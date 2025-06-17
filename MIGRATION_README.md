# Entity Framework Core 数据库迁移指南

本文档详细说明了在 WebAdmin 项目中使用 Entity Framework Core 进行数据库迁移的常用命令和最佳实践。

## 目录
- [迁移相关命令](#迁移相关命令)
- [数据库更新命令](#数据库更新命令)
- [指定项目和上下文](#指定项目和上下文)
- [连接字符串相关](#连接字符串相关)
- [实用选项](#实用选项)
- [常见使用场景](#常见使用场景)
- [故障排除命令](#故障排除命令)
- [WebAdmin 项目实际应用](#webadmin-项目实际应用)
- [注意事项](#注意事项)

## 迁移相关命令

### 创建迁移
```bash

### 常用
#### 创建迁移
dotnet ef migrations add AddFilePulisFileVerIndex --project SlzrCrossGate.Core --startup-project SlzrCrossGate.WebAdmin
#### 应用迁移
dotnet ef database update --project SlzrCrossGate.Core --startup-project SlzrCrossGate.WebAdmin










# 创建新的迁移文件
dotnet ef migrations add <迁移名称>

# 示例
dotnet ef migrations add InitialCreate
dotnet ef migrations add AddUserTable
dotnet ef migrations add UpdateTerminalSchema
dotnet ef migrations add AddFileManagement
dotnet ef migrations add AddMessageSystem
```

### 查看迁移状态
```bash
# 列出所有迁移
dotnet ef migrations list

# 查看迁移脚本（不执行）
dotnet ef migrations script

# 查看特定迁移之间的脚本
dotnet ef migrations script <起始迁移> <结束迁移>

# 查看从特定迁移到最新的脚本
dotnet ef migrations script AddUserTable
```

### 删除迁移
```bash
# 删除最后一个迁移（未应用到数据库的）
dotnet ef migrations remove

# 强制删除最后一个迁移
dotnet ef migrations remove --force
```

## 数据库更新命令

### 应用迁移到数据库
```bash
# 将所有待处理的迁移应用到数据库
dotnet ef database update

# 更新到特定迁移
dotnet ef database update <迁移名称>

# 回滚到特定迁移
dotnet ef database update <较早的迁移名称>

# 回滚到初始状态（删除所有迁移）
dotnet ef database update 0
```

### 数据库操作
```bash
# 删除数据库
dotnet ef database drop

# 删除数据库（强制，不询问确认）
dotnet ef database drop --force

# 检查数据库是否存在
dotnet ef database exists
```

## 指定项目和上下文

### 多项目解决方案中的命令
```bash
# 指定启动项目和目标项目
dotnet ef migrations add <迁移名称> --project <项目路径> --startup-project <启动项目路径>

# 示例：WebAdmin 项目中的命令
dotnet ef migrations add AddTerminalManagement --project WebAdmin --startup-project WebAdmin

# 指定 DbContext（如果有多个）
dotnet ef migrations add <迁移名称> --context <DbContext类名>
dotnet ef migrations add AddUserRoles --context ApplicationDbContext
```

## 连接字符串相关

### 指定连接字符串
```bash
# 使用特定连接字符串
dotnet ef database update --connection "Server=localhost;Database=WebAdmin;User Id=root;Password=123456;"

# 使用不同环境的配置
dotnet ef database update --environment Production
dotnet ef database update --environment Development
dotnet ef database update --environment Staging
```

## 实用选项

### 详细输出
```bash
# 显示详细信息
dotnet ef migrations add <迁移名称> --verbose

# 显示 SQL 语句
dotnet ef database update --verbose
```

### 干运行（预览）
```bash
# 生成 SQL 脚本而不执行
dotnet ef migrations script --output migration.sql

# 查看将要执行的 SQL（幂等脚本）
dotnet ef migrations script --idempotent

# 生成特定迁移范围的脚本
dotnet ef migrations script InitialCreate AddTerminalManagement --output partial_migration.sql
```

## 常见使用场景

### 开发环境典型流程
```bash
# 1. 修改实体类后创建迁移
dotnet ef migrations add UpdateUserEntity

# 2. 应用迁移到数据库
dotnet ef database update

# 3. 如果迁移有问题，回滚到上一个迁移
dotnet ef database update PreviousMigration

# 4. 删除错误的迁移
dotnet ef migrations remove

# 5. 重新创建正确的迁移
dotnet ef migrations add UpdateUserEntityFixed
```

### 生产环境部署
```bash
# 1. 生成部署脚本（推荐方式）
dotnet ef migrations script --idempotent --output deploy.sql

# 2. 或直接更新（谨慎使用）
dotnet ef database update --environment Production

# 3. 生成从特定版本的增量脚本
dotnet ef migrations script v1.0.0 v1.1.0 --output v1.1.0_update.sql
```

### 团队协作场景
```bash
# 1. 拉取最新代码后，检查是否有新迁移
dotnet ef migrations list

# 2. 应用团队成员创建的新迁移
dotnet ef database update

# 3. 如果有冲突的迁移，可能需要重置并重新迁移
dotnet ef database update 0
dotnet ef database update
```

## 故障排除命令

### 检查配置
```bash
# 检查 DbContext 配置
dotnet ef dbcontext info

# 列出所有 DbContext
dotnet ef dbcontext list

# 生成 DbContext 脚手架（从现有数据库反向工程）
dotnet ef dbcontext scaffold "Server=localhost;Database=WebAdmin;User Id=root;Password=123456;" Pomelo.EntityFrameworkCore.MySql
```

### 诊断问题
```bash
# 检查迁移历史
dotnet ef migrations list --verbose

# 查看当前数据库状态
dotnet ef database exists

# 生成当前模型的 SQL 脚本
dotnet ef migrations script --no-transactions
```

## WebAdmin 项目实际应用

### 项目结构中的迁移命令
```bash
# 在解决方案根目录执行（推荐）
cd e:\Coding\Solution\通讯程序\SlzrCrossGate

# 针对 WebAdmin 项目创建迁移
dotnet ef migrations add AddTerminalManagement --project SlzrCrossGate.WebAdmin --startup-project SlzrCrossGate.WebAdmin

# 应用迁移到数据库
dotnet ef database update --project SlzrCrossGate.WebAdmin --startup-project SlzrCrossGate.WebAdmin

# 或者直接在 WebAdmin 目录下执行
cd SlzrCrossGate.WebAdmin
dotnet ef migrations add AddTerminalManagement
dotnet ef database update
```

### 常用的 WebAdmin 迁移示例
```bash
# 用户管理相关
dotnet ef migrations add AddUserManagement
dotnet ef migrations add AddUserRoles
dotnet ef migrations add AddTwoFactorAuth

# 终端管理相关
dotnet ef migrations add AddTerminalManagement
dotnet ef migrations add AddTerminalStatus
dotnet ef migrations add AddTerminalCommands

# 文件管理相关
dotnet ef migrations add AddFileManagement
dotnet ef migrations add AddFileVersions
dotnet ef migrations add AddFilePublishing

# 消息系统相关
dotnet ef migrations add AddMessageSystem
dotnet ef migrations add AddMessageTypes
dotnet ef migrations add AddMessageHistory

# 商户管理相关
dotnet ef migrations add AddMerchantManagement
dotnet ef migrations add AddMerchantSettings
```

### 生产部署脚本生成
```bash
# 生成完整的部署脚本
dotnet ef migrations script --idempotent --output ../deploy/webadmin_migration.sql --project SlzrCrossGate.WebAdmin

# 生成增量更新脚本
dotnet ef migrations script LastProductionMigration --output ../deploy/webadmin_update.sql --project SlzrCrossGate.WebAdmin
```

## 注意事项

### 🔒 安全注意事项
1. **备份数据库**：在生产环境执行更新前务必备份数据库
2. **测试迁移**：先在开发/测试环境验证迁移的正确性
3. **权限控制**：确保数据库用户有足够的权限执行 DDL 操作
4. **敏感数据**：避免在迁移中硬编码敏感信息

### 📝 版本控制
1. **迁移文件**：所有迁移文件应纳入版本控制
2. **命名规范**：使用有意义的迁移名称，如 `AddUserTable` 而不是 `Migration1`
3. **提交策略**：迁移文件与相关代码更改一起提交

### 👥 团队协作
1. **避免冲突**：避免多人同时创建迁移导致冲突
2. **沟通协调**：大的数据库结构变更需要团队沟通
3. **迁移顺序**：确保迁移按正确顺序应用

### ⚡ 性能考虑
1. **大表操作**：对大表的结构变更可能需要较长时间
2. **索引管理**：注意迁移对索引的影响
3. **数据迁移**：大量数据迁移考虑分批处理

### 🐛 常见问题解决
1. **迁移失败**：检查数据库连接和权限
2. **模型不同步**：使用 `dotnet ef migrations add` 同步模型变更
3. **回滚问题**：某些操作（如删除列）可能无法完全回滚

### 📊 MySQL 特定注意事项
1. **字符集**：确保使用正确的字符集（如 utf8mb4）
2. **存储引擎**：推荐使用 InnoDB 存储引擎
3. **外键约束**：注意 MySQL 的外键约束限制
4. **时区处理**：WebAdmin 项目使用本地时间，注意时区设置

## 高级用法

### 自定义迁移操作
```bash
# 创建空迁移（用于自定义 SQL）
dotnet ef migrations add CustomDataMigration --empty

# 在迁移中执行自定义 SQL
# 编辑生成的迁移文件，在 Up() 方法中添加：
# migrationBuilder.Sql("INSERT INTO ...");
```

### 多数据库支持
```bash
# 为不同数据库生成迁移
dotnet ef migrations add AddUserTable --context MySqlDbContext
dotnet ef migrations add AddUserTable --context SqlServerDbContext

# 应用特定数据库的迁移
dotnet ef database update --context MySqlDbContext
```

### 数据种子（Seeding）
```bash
# 创建包含种子数据的迁移
dotnet ef migrations add SeedInitialData

# 在迁移中添加种子数据
# migrationBuilder.InsertData(
#     table: "Users",
#     columns: new[] { "Id", "Name", "Email" },
#     values: new object[] { 1, "Admin", "admin@example.com" });
```

## 环境配置

### 开发环境配置
```json
// appsettings.Development.json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=WebAdmin_Dev;User Id=root;Password=123456;AllowLoadLocalInfile=true;"
  }
}
```

### 生产环境配置
```json
// appsettings.Production.json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=prod-server;Database=WebAdmin_Prod;User Id=webadmin;Password=${DB_PASSWORD};AllowLoadLocalInfile=true;"
  }
}
```

### Docker 环境配置
```bash
# 在 Docker 容器中执行迁移
docker exec -it webadmin-container dotnet ef database update

# 使用环境变量指定连接字符串
docker run -e ConnectionStrings__DefaultConnection="Server=db;Database=WebAdmin;..." webadmin-image dotnet ef database update
```

## 迁移最佳实践

### 1. 迁移命名规范
```bash
# 好的命名示例
dotnet ef migrations add AddUserEmailIndex
dotnet ef migrations add UpdateTerminalStatusEnum
dotnet ef migrations add RemoveObsoleteColumns
dotnet ef migrations add AddFileUploadTable

# 避免的命名
dotnet ef migrations add Migration1
dotnet ef migrations add Update
dotnet ef migrations add Fix
```

### 2. 迁移内容组织
- **单一职责**：每个迁移只做一件事
- **原子性**：迁移要么全部成功，要么全部失败
- **可逆性**：确保 Down() 方法能正确回滚

### 3. 大数据量迁移策略
```bash
# 对于大表，考虑分批迁移
# 在迁移中使用事务控制
# migrationBuilder.Sql(@"
#     UPDATE Users SET Status = 1 WHERE Id BETWEEN 1 AND 1000;
#     UPDATE Users SET Status = 1 WHERE Id BETWEEN 1001 AND 2000;
# ");
```

## 故障排除指南

### 常见错误及解决方案

#### 1. 连接字符串错误
```bash
# 错误：Unable to connect to any of the specified MySQL hosts
# 解决：检查连接字符串和数据库服务状态
dotnet ef database exists --verbose
```

#### 2. 权限不足
```bash
# 错误：Access denied for user
# 解决：确保数据库用户有 CREATE, ALTER, DROP 权限
GRANT ALL PRIVILEGES ON webadmin.* TO 'webadmin'@'%';
FLUSH PRIVILEGES;
```

#### 3. 迁移冲突
```bash
# 错误：There is already an object named 'XXX' in the database
# 解决：检查数据库当前状态，可能需要手动清理
dotnet ef migrations list
dotnet ef database update 0  # 重置到初始状态
```

#### 4. 模型不匹配
```bash
# 错误：The model backing the context has changed
# 解决：创建新迁移同步模型
dotnet ef migrations add SyncModel
```

### 调试技巧

#### 1. 查看生成的 SQL
```bash
# 查看迁移将执行的 SQL
dotnet ef migrations script --from 0 --to AddUserTable

# 查看特定迁移的 SQL
dotnet ef migrations script AddUserTable AddTerminalTable
```

#### 2. 验证迁移
```bash
# 在测试数据库上验证迁移
dotnet ef database update --connection "Server=localhost;Database=WebAdmin_Test;..."

# 检查迁移历史
dotnet ef migrations list --verbose
```

#### 3. 性能分析
```bash
# 使用 --verbose 查看执行时间
dotnet ef database update --verbose

# 分析慢查询日志
# 在 MySQL 中启用慢查询日志
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;
```

## CI/CD 集成

### GitHub Actions 示例
```yaml
name: Database Migration
on:
  push:
    branches: [ main ]

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Setup .NET
      uses: actions/setup-dotnet@v1
      with:
        dotnet-version: 8.0.x
    - name: Install EF Tools
      run: dotnet tool install --global dotnet-ef
    - name: Update Database
      run: dotnet ef database update --project SlzrCrossGate.WebAdmin
      env:
        ConnectionStrings__DefaultConnection: ${{ secrets.DB_CONNECTION_STRING }}
```

### Docker 部署脚本
```bash
#!/bin/bash
# deploy-with-migration.sh

echo "Starting database migration..."

# 生成迁移脚本
dotnet ef migrations script --idempotent --output migration.sql --project SlzrCrossGate.WebAdmin

# 执行迁移
docker exec mysql-container mysql -u root -p$MYSQL_ROOT_PASSWORD webadmin < migration.sql

echo "Migration completed successfully!"
```

## 监控和维护

### 迁移监控
```bash
# 检查迁移状态
dotnet ef migrations list --json | jq '.[] | select(.applied == false)'

# 监控数据库大小变化
SELECT
    table_schema AS 'Database',
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.tables
WHERE table_schema = 'webadmin'
GROUP BY table_schema;
```

### 性能优化
```bash
# 分析表结构
DESCRIBE users;
SHOW INDEX FROM users;

# 检查查询执行计划
EXPLAIN SELECT * FROM users WHERE email = 'test@example.com';
```

### 备份策略
```bash
# 迁移前备份
mysqldump -u root -p webadmin > backup_before_migration_$(date +%Y%m%d_%H%M%S).sql

# 自动化备份脚本
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u root -p$MYSQL_ROOT_PASSWORD webadmin > $BACKUP_DIR/webadmin_$DATE.sql
```

---

**最后更新时间**: 2025-06-16
**适用版本**: .NET 8.0, Entity Framework Core 8.0
**数据库**: MySQL 8.0+
**维护者**: WebAdmin 开发团队
