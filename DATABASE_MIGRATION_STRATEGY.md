# 数据库迁移策略文档

## 🏗️ 架构设计

### 1. **迁移服务位置**
- **Core 项目**：`SlzrCrossGate.Core/Services/DatabaseMigrationService.cs`
- **共享使用**：WebAdmin 和 ApiService 都可以使用同一个迁移服务

### 2. **分布式迁移锁机制**
为了防止多个应用同时执行迁移，实现了基于数据库的分布式锁：

```sql
CREATE TABLE migration_locks (
    lock_key VARCHAR(100) PRIMARY KEY,
    application_name VARCHAR(100) NOT NULL,
    acquired_at DATETIME NOT NULL,
    expires_at DATETIME NOT NULL,
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## 🔒 迁移安全机制

### 1. **事务保护**
- 所有迁移在事务中执行
- 失败时自动回滚
- 确保迁移的原子性

### 2. **分布式锁**
- 防止多个应用同时执行迁移
- 30分钟超时机制
- 自动清理过期锁

### 3. **迁移验证**
- 执行前检查数据库连接
- 执行后验证迁移完整性
- 详细的日志记录

## 📋 使用方式

### WebAdmin 项目
```csharp
// Program.cs
using SlzrCrossGate.Core.Services;

// 在应用启动时
var migrationService = services.GetRequiredService<DatabaseMigrationService>();
var result = await migrationService.MigrateAsync(dbContext, "WebAdmin", new MigrationOptions
{
    CommandTimeout = 600 // 10分钟超时
});
```

### ApiService 项目
```csharp
// Program.cs 或启动代码
var migrationService = services.GetRequiredService<DatabaseMigrationService>();
var result = await migrationService.MigrateAsync(dbContext, "ApiService", new MigrationOptions
{
    CommandTimeout = 600
});
```

## 🚀 部署策略

### 方案一：指定单一应用执行迁移（推荐）
```yaml
# docker-compose.yml
version: '3.8'
services:
  webadmin:
    image: webadmin:latest
    environment:
      - ENABLE_MIGRATION=true  # 只有 WebAdmin 执行迁移
    depends_on:
      - mysql

  apiservice:
    image: apiservice:latest
    environment:
      - ENABLE_MIGRATION=false  # ApiService 不执行迁移
    depends_on:
      - webadmin  # 确保 WebAdmin 先启动
```

### 方案二：使用分布式锁（当前实现）
- 两个应用都可以尝试执行迁移
- 通过数据库锁确保只有一个应用执行
- 其他应用等待迁移完成

### 方案三：独立迁移容器
```yaml
# docker-compose.yml
services:
  migration:
    image: migration-tool:latest
    command: ["dotnet", "ef", "database", "update"]
    depends_on:
      - mysql
    restart: "no"  # 只运行一次

  webadmin:
    depends_on:
      - migration

  apiservice:
    depends_on:
      - migration
```

## ⚙️ 配置选项

### MigrationOptions
```csharp
public class MigrationOptions
{
    /// <summary>
    /// 命令超时时间（秒）
    /// </summary>
    public int CommandTimeout { get; set; } = 600; // 10分钟
}
```

### 环境变量配置
```bash
# 是否启用迁移
ENABLE_MIGRATION=true

# 迁移超时时间（秒）
MIGRATION_TIMEOUT=600

# 应用程序名称（用于锁标识）
APPLICATION_NAME=WebAdmin
```

## 📊 监控和日志

### 日志级别
- **Information**：正常迁移流程
- **Warning**：非关键错误（如备份失败）
- **Error**：迁移失败
- **Critical**：严重错误，应用无法启动

### 关键日志示例
```
[WebAdmin] 开始数据库迁移检查...
[WebAdmin] 发现 2 个待应用的迁移: AddUserTable, AddTerminalTable
[WebAdmin] 成功获取迁移锁
[WebAdmin] 开始在事务中执行 2 个迁移
[WebAdmin] 迁移事务提交成功
[WebAdmin] 数据库迁移成功完成，耗时: 1234ms
```

## 🛠️ 故障排除

### 常见问题

#### 1. 迁移锁超时
```
错误：等待迁移完成超时（30分钟）
解决：检查其他应用是否卡死，手动清理锁表
```

#### 2. 迁移失败回滚
```
错误：迁移失败，事务已回滚
解决：检查迁移脚本，修复后重新启动
```

#### 3. 数据库连接失败
```
错误：无法连接到数据库
解决：检查连接字符串和数据库服务状态
```

### 手动清理锁
```sql
-- 清理过期的迁移锁
DELETE FROM migration_locks WHERE expires_at < NOW();

-- 强制清理所有锁（谨慎使用）
DELETE FROM migration_locks;
```

## 🔧 最佳实践

### 1. **生产环境部署**
- 使用方案一：指定单一应用执行迁移
- 在部署脚本中先执行迁移，再启动应用
- 备份数据库后再执行迁移

### 2. **开发环境**
- 可以使用分布式锁方案
- 每个开发者独立的数据库实例

### 3. **CI/CD 集成**
```yaml
# GitHub Actions 示例
- name: Run Database Migration
  run: |
    dotnet ef database update --project SlzrCrossGate.Core
  env:
    ConnectionStrings__DefaultConnection: ${{ secrets.DB_CONNECTION }}
```

### 4. **监控建议**
- 监控迁移执行时间
- 设置迁移失败告警
- 定期清理迁移锁表

## 📝 总结

这个迁移策略提供了：
- ✅ **安全性**：事务保护，失败回滚
- ✅ **可靠性**：分布式锁，防止冲突
- ✅ **可观测性**：详细日志，状态监控
- ✅ **灵活性**：支持多种部署方案
- ✅ **可维护性**：统一的服务，易于扩展

推荐在生产环境使用方案一（指定单一应用执行迁移），在开发和测试环境使用当前的分布式锁方案。
