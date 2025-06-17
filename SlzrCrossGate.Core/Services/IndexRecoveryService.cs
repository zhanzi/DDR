using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SlzrCrossGate.Core.Database;

namespace SlzrCrossGate.Core.Services;

/// <summary>
/// 索引恢复服务 - 专门处理迁移失败后的索引恢复问题
/// </summary>
public class IndexRecoveryService
{
    private readonly ILogger<IndexRecoveryService> _logger;

    public IndexRecoveryService(ILogger<IndexRecoveryService> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// 检查并恢复丢失的索引
    /// </summary>
    /// <param name="dbContext">数据库上下文</param>
    /// <param name="expectedIndexes">期望的索引列表</param>
    /// <returns></returns>
    public async Task<IndexRecoveryResult> CheckAndRecoverIndexes(TcpDbContext dbContext, List<ExpectedIndex> expectedIndexes)
    {
        var result = new IndexRecoveryResult();
        
        try
        {
            _logger.LogInformation("开始检查索引完整性...");
            
            // 获取当前数据库中的索引
            var currentIndexes = await GetCurrentIndexes(dbContext);
            var currentIndexNames = currentIndexes.Select(i => $"{i.TableName}.{i.IndexName}").ToHashSet();
            
            // 检查丢失的索引
            var missingIndexes = new List<ExpectedIndex>();
            foreach (var expected in expectedIndexes)
            {
                var indexKey = $"{expected.TableName}.{expected.IndexName}";
                if (!currentIndexNames.Contains(indexKey))
                {
                    missingIndexes.Add(expected);
                    _logger.LogWarning("发现丢失的索引: {Index}", indexKey);
                }
            }
            
            result.MissingIndexes = missingIndexes;
            result.TotalExpected = expectedIndexes.Count;
            result.TotalCurrent = currentIndexes.Count;
            
            if (missingIndexes.Count == 0)
            {
                _logger.LogInformation("所有索引完整，无需恢复");
                result.Success = true;
                return result;
            }
            
            _logger.LogWarning("发现 {Count} 个丢失的索引，开始恢复...", missingIndexes.Count);
            
            // 尝试恢复丢失的索引
            var recoveredCount = 0;
            var failedIndexes = new List<ExpectedIndex>();
            
            foreach (var missingIndex in missingIndexes)
            {
                try
                {
                    await CreateIndex(dbContext, missingIndex);
                    recoveredCount++;
                    _logger.LogInformation("成功恢复索引: {TableName}.{IndexName}", 
                        missingIndex.TableName, missingIndex.IndexName);
                }
                catch (Exception ex)
                {
                    failedIndexes.Add(missingIndex);
                    _logger.LogError(ex, "恢复索引失败: {TableName}.{IndexName}", 
                        missingIndex.TableName, missingIndex.IndexName);
                }
            }
            
            result.RecoveredCount = recoveredCount;
            result.FailedIndexes = failedIndexes;
            result.Success = failedIndexes.Count == 0;
            
            if (result.Success)
            {
                _logger.LogInformation("所有丢失的索引已成功恢复");
            }
            else
            {
                _logger.LogError("有 {Count} 个索引恢复失败，需要手动处理", failedIndexes.Count);
            }
            
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "索引恢复过程中发生错误");
            result.Success = false;
            result.Error = ex;
            return result;
        }
    }

    /// <summary>
    /// 获取当前数据库中的所有索引
    /// </summary>
    private async Task<List<DatabaseIndex>> GetCurrentIndexes(TcpDbContext dbContext)
    {
        try
        {
            var sql = @"
                SELECT 
                    table_name,
                    index_name,
                    column_name,
                    non_unique,
                    index_type
                FROM information_schema.statistics 
                WHERE table_schema = DATABASE() 
                ORDER BY table_name, index_name, seq_in_index";

            var results = await dbContext.Database.SqlQueryRaw<IndexQueryResult>(sql).ToListAsync();
            
            return results.GroupBy(r => new { r.table_name, r.index_name })
                .Select(g => new DatabaseIndex
                {
                    TableName = g.Key.table_name,
                    IndexName = g.Key.index_name,
                    Columns = g.Select(r => r.column_name).ToList(),
                    IsUnique = g.First().non_unique == 0,
                    IndexType = g.First().index_type
                }).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取当前索引列表失败");
            return new List<DatabaseIndex>();
        }
    }

    /// <summary>
    /// 创建索引
    /// </summary>
    private async Task CreateIndex(TcpDbContext dbContext, ExpectedIndex expectedIndex)
    {
        var indexType = expectedIndex.IsUnique ? "UNIQUE" : "";
        var columns = string.Join(", ", expectedIndex.Columns.Select(c => $"`{c}`"));
        
        var sql = $@"
            CREATE {indexType} INDEX `{expectedIndex.IndexName}` 
            ON `{expectedIndex.TableName}` ({columns})";

        _logger.LogDebug("执行索引创建SQL: {Sql}", sql);
        
        await dbContext.Database.ExecuteSqlRawAsync(sql);
    }

    /// <summary>
    /// 从 EF Core 模型中提取期望的索引列表
    /// </summary>
    public List<ExpectedIndex> ExtractExpectedIndexesFromModel(TcpDbContext dbContext)
    {
        var expectedIndexes = new List<ExpectedIndex>();
        
        try
        {
            var model = dbContext.Model;
            
            foreach (var entityType in model.GetEntityTypes())
            {
                var tableName = entityType.GetTableName();
                if (string.IsNullOrEmpty(tableName)) continue;
                
                // 获取所有索引
                foreach (var index in entityType.GetIndexes())
                {
                    var indexName = index.GetDatabaseName();
                    if (string.IsNullOrEmpty(indexName)) continue;
                    
                    var columns = index.Properties.Select(p => p.GetColumnName()).ToList();
                    
                    expectedIndexes.Add(new ExpectedIndex
                    {
                        TableName = tableName,
                        IndexName = indexName,
                        Columns = columns,
                        IsUnique = index.IsUnique
                    });
                }
            }
            
            _logger.LogInformation("从 EF Core 模型中提取到 {Count} 个期望的索引", expectedIndexes.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "从 EF Core 模型提取索引信息失败");
        }
        
        return expectedIndexes;
    }

    /// <summary>
    /// 生成索引恢复脚本
    /// </summary>
    public string GenerateRecoveryScript(List<ExpectedIndex> missingIndexes)
    {
        var script = new System.Text.StringBuilder();
        script.AppendLine("-- 索引恢复脚本");
        script.AppendLine("-- 请在确认数据库状态后执行以下语句");
        script.AppendLine();
        
        foreach (var index in missingIndexes)
        {
            var indexType = index.IsUnique ? "UNIQUE " : "";
            var columns = string.Join(", ", index.Columns.Select(c => $"`{c}`"));
            
            script.AppendLine($"-- 恢复表 {index.TableName} 的索引 {index.IndexName}");
            script.AppendLine($"CREATE {indexType}INDEX `{index.IndexName}` ON `{index.TableName}` ({columns});");
            script.AppendLine();
        }
        
        return script.ToString();
    }
}

/// <summary>
/// 索引恢复结果
/// </summary>
public class IndexRecoveryResult
{
    public bool Success { get; set; }
    public Exception? Error { get; set; }
    public int TotalExpected { get; set; }
    public int TotalCurrent { get; set; }
    public int RecoveredCount { get; set; }
    public List<ExpectedIndex> MissingIndexes { get; set; } = new();
    public List<ExpectedIndex> FailedIndexes { get; set; } = new();
}

/// <summary>
/// 期望的索引定义
/// </summary>
public class ExpectedIndex
{
    public string TableName { get; set; } = string.Empty;
    public string IndexName { get; set; } = string.Empty;
    public List<string> Columns { get; set; } = new();
    public bool IsUnique { get; set; }
}

/// <summary>
/// 数据库中的索引信息
/// </summary>
public class DatabaseIndex
{
    public string TableName { get; set; } = string.Empty;
    public string IndexName { get; set; } = string.Empty;
    public List<string> Columns { get; set; } = new();
    public bool IsUnique { get; set; }
    public string IndexType { get; set; } = string.Empty;
}

/// <summary>
/// 索引查询结果（用于 SqlQueryRaw）
/// </summary>
public class IndexQueryResult
{
    public string table_name { get; set; } = string.Empty;
    public string index_name { get; set; } = string.Empty;
    public string column_name { get; set; } = string.Empty;
    public int non_unique { get; set; }
    public string index_type { get; set; } = string.Empty;
}
