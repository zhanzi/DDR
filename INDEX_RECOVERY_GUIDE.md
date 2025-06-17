# 索引恢复指南

## 🚨 **问题背景**

在 MySQL 中，DDL 操作（如索引的创建和删除）具有以下特点：
- **隐式提交**：DDL 操作会自动提交事务
- **不可回滚**：一旦执行就无法通过 ROLLBACK 撤销
- **原子性限制**：单个 DDL 语句是原子的，但多个 DDL 语句之间不是

这意味着当 EF Core 迁移失败时，可能会出现以下情况：
- ✅ 某些表已创建
- ❌ 某些索引已删除但新索引创建失败
- ❌ 数据库处于不一致状态

## 🛠️ **解决方案**

### 1. **改进的迁移服务**

新的 `DatabaseMigrationService` 提供：
- **详细的失败分析**：记录迁移前后的数据库状态
- **索引状态监控**：跟踪索引的创建和删除
- **恢复建议**：自动生成恢复指令

### 2. **专门的索引恢复服务**

`IndexRecoveryService` 提供：
- **索引完整性检查**：对比期望索引与实际索引
- **自动恢复**：尝试重建丢失的索引
- **恢复脚本生成**：生成手动恢复的 SQL 脚本

## 📋 **使用方法**

### **场景一：迁移失败后的自动检查**

```csharp
// 在 Program.cs 中，迁移失败后执行索引恢复
try
{
    var result = await migrationService.MigrateAsync(dbContext, "WebAdmin", migrationOptions);
}
catch (Exception ex)
{
    logger.LogError(ex, "迁移失败，开始索引恢复检查...");
    
    // 获取索引恢复服务
    var indexRecoveryService = services.GetRequiredService<IndexRecoveryService>();
    
    // 从 EF Core 模型中提取期望的索引
    var expectedIndexes = indexRecoveryService.ExtractExpectedIndexesFromModel(dbContext);
    
    // 检查并尝试恢复丢失的索引
    var recoveryResult = await indexRecoveryService.CheckAndRecoverIndexes(dbContext, expectedIndexes);
    
    if (recoveryResult.Success)
    {
        logger.LogInformation("索引恢复成功，应用可以继续启动");
    }
    else
    {
        logger.LogError("索引恢复失败，需要手动处理");
        
        // 生成恢复脚本
        var script = indexRecoveryService.GenerateRecoveryScript(recoveryResult.FailedIndexes);
        logger.LogError("手动恢复脚本:\n{Script}", script);
        
        throw new InvalidOperationException("数据库索引不完整，应用无法启动");
    }
}
```

### **场景二：定期索引完整性检查**

```csharp
// 创建一个后台服务定期检查索引完整性
public class IndexHealthCheckService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<IndexHealthCheckService> _logger;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            using var scope = _serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<TcpDbContext>();
            var indexRecoveryService = scope.ServiceProvider.GetRequiredService<IndexRecoveryService>();

            try
            {
                var expectedIndexes = indexRecoveryService.ExtractExpectedIndexesFromModel(dbContext);
                var result = await indexRecoveryService.CheckAndRecoverIndexes(dbContext, expectedIndexes);

                if (!result.Success)
                {
                    _logger.LogWarning("发现索引问题: {MissingCount} 个索引丢失", 
                        result.MissingIndexes.Count);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "索引健康检查失败");
            }

            // 每小时检查一次
            await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
        }
    }
}
```

### **场景三：手动恢复**

```csharp
// 创建一个 API 端点用于手动触发索引恢复
[ApiController]
[Route("api/[controller]")]
public class MaintenanceController : ControllerBase
{
    private readonly TcpDbContext _dbContext;
    private readonly IndexRecoveryService _indexRecoveryService;

    [HttpPost("recover-indexes")]
    public async Task<IActionResult> RecoverIndexes()
    {
        try
        {
            var expectedIndexes = _indexRecoveryService.ExtractExpectedIndexesFromModel(_dbContext);
            var result = await _indexRecoveryService.CheckAndRecoverIndexes(_dbContext, expectedIndexes);

            return Ok(new
            {
                Success = result.Success,
                TotalExpected = result.TotalExpected,
                TotalCurrent = result.TotalCurrent,
                RecoveredCount = result.RecoveredCount,
                MissingIndexes = result.MissingIndexes.Select(i => $"{i.TableName}.{i.IndexName}"),
                FailedIndexes = result.FailedIndexes.Select(i => $"{i.TableName}.{i.IndexName}")
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Error = ex.Message });
        }
    }

    [HttpGet("index-recovery-script")]
    public async Task<IActionResult> GetRecoveryScript()
    {
        try
        {
            var expectedIndexes = _indexRecoveryService.ExtractExpectedIndexesFromModel(_dbContext);
            var currentIndexes = await _indexRecoveryService.CheckAndRecoverIndexes(_dbContext, expectedIndexes);
            
            if (currentIndexes.MissingIndexes.Count > 0)
            {
                var script = _indexRecoveryService.GenerateRecoveryScript(currentIndexes.MissingIndexes);
                return Ok(new { Script = script });
            }
            
            return Ok(new { Message = "所有索引完整，无需恢复脚本" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Error = ex.Message });
        }
    }
}
```

## 🔧 **最佳实践**

### 1. **预防措施**

```csharp
// 在迁移前创建数据库备份
public class MigrationOptions
{
    public bool CreateBackup { get; set; } = true;
    public string BackupPath { get; set; } = "./backups";
    public bool ValidateIndexes { get; set; } = true;
}
```

### 2. **分步迁移**

```csharp
// 对于复杂的迁移，考虑分步执行
public async Task ExecuteComplexMigration(TcpDbContext dbContext)
{
    // 步骤1：创建新表
    await ExecuteStep1Migration(dbContext);
    await ValidateStep1(dbContext);
    
    // 步骤2：修改现有表
    await ExecuteStep2Migration(dbContext);
    await ValidateStep2(dbContext);
    
    // 步骤3：创建索引
    await ExecuteStep3Migration(dbContext);
    await ValidateIndexes(dbContext);
}
```

### 3. **监控和告警**

```csharp
// 集成到健康检查系统
public class DatabaseIndexHealthCheck : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            var expectedIndexes = _indexRecoveryService.ExtractExpectedIndexesFromModel(_dbContext);
            var result = await _indexRecoveryService.CheckAndRecoverIndexes(_dbContext, expectedIndexes);
            
            if (result.Success)
            {
                return HealthCheckResult.Healthy("所有索引完整");
            }
            else
            {
                return HealthCheckResult.Degraded($"发现 {result.MissingIndexes.Count} 个丢失的索引");
            }
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("索引检查失败", ex);
        }
    }
}
```

## 📊 **恢复脚本示例**

当索引恢复失败时，系统会生成类似以下的恢复脚本：

```sql
-- 索引恢复脚本
-- 请在确认数据库状态后执行以下语句

-- 恢复表 Terminals 的索引 IX_Terminals_MerchantID
CREATE INDEX `IX_Terminals_MerchantID` ON `Terminals` (`MerchantID`);

-- 恢复表 Terminals 的索引 IX_Terminals_LineNO
CREATE INDEX `IX_Terminals_LineNO` ON `Terminals` (`LineNO`);

-- 恢复表 FilePublish 的索引 IX_FilePublish_TerminalID_FileVerID
CREATE UNIQUE INDEX `IX_FilePublish_TerminalID_FileVerID` ON `FilePublish` (`TerminalID`, `FileVerID`);
```

## ⚠️ **注意事项**

1. **备份优先**：在执行任何恢复操作前，确保有完整的数据库备份
2. **验证数据**：恢复索引后，验证数据完整性和应用功能
3. **监控性能**：索引重建可能影响数据库性能，建议在低峰期执行
4. **测试环境**：先在测试环境验证恢复脚本的正确性

## 🎯 **总结**

通过这套索引恢复机制，您可以：
- ✅ **自动检测**索引丢失问题
- ✅ **自动恢复**大部分丢失的索引
- ✅ **生成脚本**用于手动恢复复杂情况
- ✅ **监控健康**状态，及时发现问题
- ✅ **预防问题**通过更好的迁移策略

这大大提高了数据库迁移的可靠性和可恢复性！
