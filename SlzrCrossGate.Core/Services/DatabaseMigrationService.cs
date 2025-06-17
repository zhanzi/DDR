using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SlzrCrossGate.Core.Database;
using System.Diagnostics;

namespace SlzrCrossGate.Core.Services;

/// <summary>
/// 数据库迁移服务，提供安全可靠的数据库迁移功能
/// 支持分布式环境下的迁移锁定机制，防止多个应用同时执行迁移
/// </summary>
public class DatabaseMigrationService
{
    private readonly ILogger<DatabaseMigrationService> _logger;
    private const string MIGRATION_LOCK_KEY = "database_migration_lock";
    private const int MIGRATION_LOCK_TIMEOUT_MINUTES = 30;

    public DatabaseMigrationService(ILogger<DatabaseMigrationService> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// 执行安全的数据库迁移（带分布式锁）
    /// </summary>
    /// <param name="dbContext">数据库上下文</param>
    /// <param name="applicationName">应用程序名称（用于日志记录）</param>
    /// <param name="options">迁移选项</param>
    /// <returns></returns>
    public async Task<MigrationResult> MigrateAsync(TcpDbContext dbContext, string applicationName, MigrationOptions? options = null)
    {
        options ??= new MigrationOptions();
        var stopwatch = Stopwatch.StartNew();
        var result = new MigrationResult { ApplicationName = applicationName };

        try
        {
            _logger.LogInformation("[{App}] 开始数据库迁移检查...", applicationName);

            // 1. 连接性检查
            if (!await CheckDatabaseConnectivity(dbContext))
            {
                throw new InvalidOperationException("无法连接到数据库");
            }

            // 2. 获取迁移状态
            var migrationStatus = await GetMigrationStatus(dbContext);
            result.InitialMigrationCount = migrationStatus.AppliedMigrations.Count;
            result.PendingMigrationCount = migrationStatus.PendingMigrations.Count;

            if (migrationStatus.PendingMigrations.Count == 0)
            {
                _logger.LogInformation("[{App}] 数据库已是最新版本，无需迁移", applicationName);
                result.Success = true;
                result.Message = "数据库已是最新版本";
                return result;
            }

            // 3. 尝试获取分布式迁移锁
            var lockAcquired = await TryAcquireMigrationLock(dbContext, applicationName);
            if (!lockAcquired)
            {
                _logger.LogInformation("[{App}] 其他应用正在执行迁移，等待完成...", applicationName);
                await WaitForMigrationCompletion(dbContext, applicationName);
                result.Success = true;
                result.Message = "迁移由其他应用完成";
                return result;
            }

            try
            {
                // 4. 执行迁移（已获得锁）
                await ExecuteMigrationWithLock(dbContext, migrationStatus, options, applicationName);

                result.Success = true;
                result.Message = $"成功应用 {migrationStatus.PendingMigrations.Count} 个迁移";
                result.AppliedMigrations = migrationStatus.PendingMigrations.ToList();

                _logger.LogInformation("[{App}] 数据库迁移成功完成，耗时: {ElapsedMs}ms",
                    applicationName, stopwatch.ElapsedMilliseconds);
            }
            finally
            {
                // 5. 释放迁移锁
                await ReleaseMigrationLock(dbContext, applicationName);
            }
        }
        catch (Exception ex)
        {
            result.Success = false;
            result.Error = ex;
            result.Message = $"迁移失败: {ex.Message}";

            _logger.LogError(ex, "[{App}] 数据库迁移失败，耗时: {ElapsedMs}ms",
                applicationName, stopwatch.ElapsedMilliseconds);
            throw;
        }
        finally
        {
            result.Duration = stopwatch.Elapsed;
            stopwatch.Stop();
        }

        return result;
    }

    /// <summary>
    /// 检查数据库连接性
    /// </summary>
    private async Task<bool> CheckDatabaseConnectivity(TcpDbContext dbContext)
    {
        try
        {
            return await dbContext.Database.CanConnectAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "数据库连接检查失败");
            return false;
        }
    }

    /// <summary>
    /// 获取迁移状态
    /// </summary>
    private async Task<MigrationStatus> GetMigrationStatus(TcpDbContext dbContext)
    {
        var appliedMigrations = await dbContext.Database.GetAppliedMigrationsAsync();
        var pendingMigrations = await dbContext.Database.GetPendingMigrationsAsync();

        _logger.LogInformation("已应用迁移: {Applied}, 待应用迁移: {Pending}",
            appliedMigrations.Count(), pendingMigrations.Count());

        return new MigrationStatus
        {
            AppliedMigrations = appliedMigrations.ToList(),
            PendingMigrations = pendingMigrations.ToList()
        };
    }

    /// <summary>
    /// 尝试获取迁移锁
    /// </summary>
    private async Task<bool> TryAcquireMigrationLock(TcpDbContext dbContext, string applicationName)
    {
        try
        {
            // 创建迁移锁表（如果不存在）
            await EnsureMigrationLockTableExists(dbContext);

            var lockExpiry = DateTime.Now.AddMinutes(MIGRATION_LOCK_TIMEOUT_MINUTES);

            // 尝试插入锁记录（MySQL 语法）
            var sql = @"
                INSERT INTO migration_locks (lock_key, application_name, acquired_at, expires_at)
                VALUES ({0}, {1}, {2}, {3})
                ON DUPLICATE KEY UPDATE
                    application_name = IF(expires_at < NOW(), VALUES(application_name), application_name),
                    acquired_at = IF(expires_at < NOW(), VALUES(acquired_at), acquired_at),
                    expires_at = IF(expires_at < NOW(), VALUES(expires_at), expires_at)";

            var rowsAffected = await dbContext.Database.ExecuteSqlRawAsync(sql,
                MIGRATION_LOCK_KEY, applicationName, DateTime.Now, lockExpiry);

            // 检查是否成功获得锁
            var lockOwnerSql = "SELECT application_name AS Value FROM migration_locks WHERE lock_key = {0} AND expires_at > NOW()";
            var lockOwnerResult = await dbContext.Database.SqlQueryRaw<StringResult>(lockOwnerSql, MIGRATION_LOCK_KEY)
                .FirstOrDefaultAsync();
            var lockOwner = lockOwnerResult?.Value;

            var acquired = lockOwner == applicationName;

            if (acquired)
            {
                _logger.LogInformation("[{App}] 成功获取迁移锁", applicationName);
            }
            else
            {
                _logger.LogInformation("[{App}] 迁移锁被 {Owner} 持有", applicationName, lockOwner);
            }

            return acquired;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[{App}] 获取迁移锁时发生错误，假设未获得锁", applicationName);
            return false;
        }
    }

    /// <summary>
    /// 确保迁移锁表存在
    /// </summary>
    private async Task EnsureMigrationLockTableExists(TcpDbContext dbContext)
    {
        try
        {
            var createTableSql = @"
                CREATE TABLE IF NOT EXISTS migration_locks (
                    lock_key VARCHAR(100) PRIMARY KEY,
                    application_name VARCHAR(100) NOT NULL,
                    acquired_at DATETIME NOT NULL,
                    expires_at DATETIME NOT NULL,
                    INDEX idx_expires_at (expires_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

            await dbContext.Database.ExecuteSqlRawAsync(createTableSql);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "创建迁移锁表时发生错误");
        }
    }

    /// <summary>
    /// 等待迁移完成
    /// </summary>
    private async Task WaitForMigrationCompletion(TcpDbContext dbContext, string applicationName)
    {
        var maxWaitTime = TimeSpan.FromMinutes(MIGRATION_LOCK_TIMEOUT_MINUTES);
        var checkInterval = TimeSpan.FromSeconds(10);
        var stopwatch = Stopwatch.StartNew();

        while (stopwatch.Elapsed < maxWaitTime)
        {
            await Task.Delay(checkInterval);

            // 检查是否还有待应用的迁移
            var pendingMigrations = await dbContext.Database.GetPendingMigrationsAsync();
            if (!pendingMigrations.Any())
            {
                _logger.LogInformation("[{App}] 迁移已由其他应用完成", applicationName);
                return;
            }

            // 检查锁是否已过期
            var lockExistsSql = "SELECT COUNT(*) AS Value FROM migration_locks WHERE lock_key = {0} AND expires_at > NOW()";
            var lockExistsResult = await dbContext.Database.SqlQueryRaw<IntResult>(lockExistsSql, MIGRATION_LOCK_KEY)
                .FirstOrDefaultAsync();
            var lockExists = lockExistsResult?.Value ?? 0;

            if (lockExists == 0)
            {
                _logger.LogWarning("[{App}] 迁移锁已过期，但迁移可能未完成", applicationName);
                break;
            }
        }

        if (stopwatch.Elapsed >= maxWaitTime)
        {
            throw new TimeoutException($"等待迁移完成超时（{maxWaitTime.TotalMinutes}分钟）");
        }
    }

    /// <summary>
    /// 在锁保护下执行迁移
    /// 注意：MySQL 中的 DDL 操作（如索引创建/删除）会导致隐式提交，无法回滚
    /// </summary>
    private async Task ExecuteMigrationWithLock(TcpDbContext dbContext, MigrationStatus status, MigrationOptions options, string applicationName)
    {
        _logger.LogInformation("[{App}] 开始执行 {Count} 个迁移", applicationName, status.PendingMigrations.Count);
        _logger.LogWarning("[{App}] 注意：MySQL DDL 操作（索引、表结构变更）无法通过事务回滚", applicationName);

        // 设置命令超时
        dbContext.Database.SetCommandTimeout(options.CommandTimeout);

        // 创建数据库结构快照（用于失败时的恢复参考）
        var preMigrationSnapshot = await CreateDatabaseSnapshot(dbContext, applicationName);

        try
        {
            // 逐个执行迁移，而不是批量执行
            await ExecuteMigrationsOneByOne(dbContext, status.PendingMigrations, applicationName);

            // 验证迁移完成
            var remainingMigrations = await dbContext.Database.GetPendingMigrationsAsync();
            if (remainingMigrations.Any())
            {
                throw new InvalidOperationException($"迁移未完全完成，仍有 {remainingMigrations.Count()} 个迁移待应用");
            }

            _logger.LogInformation("[{App}] 所有迁移执行成功", applicationName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[{App}] 迁移执行失败", applicationName);

            // 记录失败时的数据库状态
            var postFailureSnapshot = await CreateDatabaseSnapshot(dbContext, applicationName);
            await LogMigrationFailureDetails(preMigrationSnapshot, postFailureSnapshot, applicationName);

            // 提供恢复建议
            await GenerateRecoveryInstructions(preMigrationSnapshot, postFailureSnapshot, applicationName);

            throw;
        }
    }

    /// <summary>
    /// 逐个执行迁移，提供更好的错误定位
    /// </summary>
    private async Task ExecuteMigrationsOneByOne(TcpDbContext dbContext, IList<string> pendingMigrations, string applicationName)
    {
        _logger.LogInformation("[{App}] 开始逐个执行迁移以便更好地跟踪进度", applicationName);

        foreach (var migration in pendingMigrations)
        {
            _logger.LogInformation("[{App}] 准备执行迁移: {Migration}", applicationName, migration);

            try
            {
                // 执行单个迁移
                // 注意：EF Core 的 MigrateAsync 会执行所有待应用的迁移
                // 这里我们需要使用更精细的控制
                await dbContext.Database.MigrateAsync();

                // 检查这个迁移是否已经应用
                var appliedMigrations = await dbContext.Database.GetAppliedMigrationsAsync();
                if (appliedMigrations.Contains(migration))
                {
                    _logger.LogInformation("[{App}] 迁移 {Migration} 执行成功", applicationName, migration);
                }

                // 如果还有待应用的迁移，继续下一个
                var remaining = await dbContext.Database.GetPendingMigrationsAsync();
                if (!remaining.Any())
                {
                    _logger.LogInformation("[{App}] 所有迁移已完成", applicationName);
                    break;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[{App}] 迁移 {Migration} 执行失败", applicationName, migration);
                throw new InvalidOperationException($"迁移 {migration} 执行失败: {ex.Message}", ex);
            }
        }
    }

    /// <summary>
    /// 创建数据库结构快照
    /// </summary>
    private async Task<DatabaseSnapshot> CreateDatabaseSnapshot(TcpDbContext dbContext, string applicationName)
    {
        try
        {
            _logger.LogDebug("[{App}] 创建数据库结构快照", applicationName);

            var snapshot = new DatabaseSnapshot
            {
                Timestamp = DateTime.Now,
                AppliedMigrations = (await dbContext.Database.GetAppliedMigrationsAsync()).ToList(),
                Tables = await GetTableList(dbContext),
                Indexes = await GetIndexList(dbContext)
            };

            _logger.LogDebug("[{App}] 快照创建完成: {TableCount} 个表, {IndexCount} 个索引",
                applicationName, snapshot.Tables.Count, snapshot.Indexes.Count);

            return snapshot;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[{App}] 创建数据库快照失败", applicationName);
            return new DatabaseSnapshot { Timestamp = DateTime.Now };
        }
    }

    /// <summary>
    /// 获取表列表
    /// </summary>
    private async Task<List<string>> GetTableList(TcpDbContext dbContext)
    {
        try
        {
            var sql = "SELECT table_name AS Value FROM information_schema.tables WHERE table_schema = DATABASE()";
            var results = await dbContext.Database.SqlQueryRaw<StringResult>(sql).ToListAsync();
            return results.Select(r => r.Value).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "获取表列表失败");
            return new List<string>();
        }
    }

    /// <summary>
    /// 获取索引列表
    /// </summary>
    private async Task<List<IndexInfo>> GetIndexList(TcpDbContext dbContext)
    {
        try
        {
            var sql = @"
                SELECT
                    CONCAT(table_name, '.', index_name) AS Value
                FROM information_schema.statistics
                WHERE table_schema = DATABASE()
                ORDER BY table_name, index_name";

            var results = await dbContext.Database.SqlQueryRaw<StringResult>(sql).ToListAsync();

            return results.Select(r =>
            {
                var parts = r.Value.Split('.');
                return new IndexInfo
                {
                    TableName = parts[0],
                    IndexName = parts.Length > 1 ? parts[1] : "unknown"
                };
            }).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "获取索引列表失败");
            return new List<IndexInfo>();
        }
    }

    /// <summary>
    /// 记录迁移失败的详细信息
    /// </summary>
    private async Task LogMigrationFailureDetails(DatabaseSnapshot before, DatabaseSnapshot after, string applicationName)
    {
        try
        {
            _logger.LogError("[{App}] === 迁移失败详细分析 ===", applicationName);

            // 比较迁移状态
            var beforeMigrations = before.AppliedMigrations.ToHashSet();
            var afterMigrations = after.AppliedMigrations.ToHashSet();
            var newMigrations = afterMigrations.Except(beforeMigrations).ToList();

            if (newMigrations.Any())
            {
                _logger.LogError("[{App}] 部分迁移已应用: {Migrations}", applicationName, string.Join(", ", newMigrations));
            }

            // 比较表结构
            var beforeTables = before.Tables.ToHashSet();
            var afterTables = after.Tables.ToHashSet();
            var addedTables = afterTables.Except(beforeTables).ToList();
            var removedTables = beforeTables.Except(afterTables).ToList();

            if (addedTables.Any())
            {
                _logger.LogError("[{App}] 新增的表: {Tables}", applicationName, string.Join(", ", addedTables));
            }
            if (removedTables.Any())
            {
                _logger.LogError("[{App}] 删除的表: {Tables}", applicationName, string.Join(", ", removedTables));
            }

            // 比较索引
            var beforeIndexes = before.Indexes.Select(i => $"{i.TableName}.{i.IndexName}").ToHashSet();
            var afterIndexes = after.Indexes.Select(i => $"{i.TableName}.{i.IndexName}").ToHashSet();
            var addedIndexes = afterIndexes.Except(beforeIndexes).ToList();
            var removedIndexes = beforeIndexes.Except(afterIndexes).ToList();

            if (addedIndexes.Any())
            {
                _logger.LogError("[{App}] 新增的索引: {Indexes}", applicationName, string.Join(", ", addedIndexes));
            }
            if (removedIndexes.Any())
            {
                _logger.LogError("[{App}] 丢失的索引: {Indexes}", applicationName, string.Join(", ", removedIndexes));
            }

            _logger.LogError("[{App}] === 分析完成 ===", applicationName);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[{App}] 记录失败详情时发生错误", applicationName);
        }

        await Task.CompletedTask;
    }

    /// <summary>
    /// 生成恢复指令
    /// </summary>
    private async Task GenerateRecoveryInstructions(DatabaseSnapshot before, DatabaseSnapshot after, string applicationName)
    {
        try
        {
            _logger.LogInformation("[{App}] === 恢复建议 ===", applicationName);

            var beforeIndexes = before.Indexes.Select(i => $"{i.TableName}.{i.IndexName}").ToHashSet();
            var afterIndexes = after.Indexes.Select(i => $"{i.TableName}.{i.IndexName}").ToHashSet();
            var removedIndexes = beforeIndexes.Except(afterIndexes).ToList();

            if (removedIndexes.Any())
            {
                _logger.LogInformation("[{App}] 需要手动重建以下索引:", applicationName);
                foreach (var index in removedIndexes)
                {
                    _logger.LogInformation("[{App}]   - {Index}", applicationName, index);
                }

                _logger.LogInformation("[{App}] 建议操作:", applicationName);
                _logger.LogInformation("[{App}]   1. 检查迁移脚本中的索引定义", applicationName);
                _logger.LogInformation("[{App}]   2. 手动执行索引创建语句", applicationName);
                _logger.LogInformation("[{App}]   3. 或者回滚到上一个稳定版本后重新迁移", applicationName);
            }

            _logger.LogInformation("[{App}] === 建议完成 ===", applicationName);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[{App}] 生成恢复指令时发生错误", applicationName);
        }

        await Task.CompletedTask;
    }

    /// <summary>
    /// 释放迁移锁
    /// </summary>
    private async Task ReleaseMigrationLock(TcpDbContext dbContext, string applicationName)
    {
        try
        {
            var sql = "DELETE FROM migration_locks WHERE lock_key = {0} AND application_name = {1}";
            await dbContext.Database.ExecuteSqlRawAsync(sql, MIGRATION_LOCK_KEY, applicationName);

            _logger.LogInformation("[{App}] 迁移锁已释放", applicationName);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[{App}] 释放迁移锁时发生错误", applicationName);
        }
    }
}

/// <summary>
/// 迁移选项
/// </summary>
public class MigrationOptions
{
    /// <summary>
    /// 命令超时时间（秒）
    /// </summary>
    public int CommandTimeout { get; set; } = 600; // 10分钟
}

/// <summary>
/// 迁移状态
/// </summary>
public class MigrationStatus
{
    public IList<string> AppliedMigrations { get; set; } = new List<string>();
    public IList<string> PendingMigrations { get; set; } = new List<string>();
}

/// <summary>
/// 迁移结果
/// </summary>
public class MigrationResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string ApplicationName { get; set; } = string.Empty;
    public Exception? Error { get; set; }
    public TimeSpan Duration { get; set; }
    public int InitialMigrationCount { get; set; }
    public int PendingMigrationCount { get; set; }
    public IList<string> AppliedMigrations { get; set; } = new List<string>();
}

/// <summary>
/// 用于 SqlQueryRaw 返回字符串结果的辅助类
/// </summary>
public class StringResult
{
    public string Value { get; set; } = string.Empty;
}

/// <summary>
/// 用于 SqlQueryRaw 返回整数结果的辅助类
/// </summary>
public class IntResult
{
    public int Value { get; set; }
}

/// <summary>
/// 数据库结构快照
/// </summary>
public class DatabaseSnapshot
{
    public DateTime Timestamp { get; set; }
    public IList<string> AppliedMigrations { get; set; } = new List<string>();
    public IList<string> Tables { get; set; } = new List<string>();
    public IList<IndexInfo> Indexes { get; set; } = new List<IndexInfo>();
}

/// <summary>
/// 索引信息
/// </summary>
public class IndexInfo
{
    public string TableName { get; set; } = string.Empty;
    public string IndexName { get; set; } = string.Empty;
}
