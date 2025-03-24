## 安装EF工具

```bash
dotnet tool install --global dotnet-ef --version 8.0.14
```

## 初始化数据库

```bash
dotnet ef migrations add InitialCreate --project SLzrCrossGate.Core --startup-project SLzrCrossGate.ApiService
```

## 模型发生变化时，更新数据库
### 基本命令（在项目根目录执行）

```bash
dotnet ef migrations add <MigrationName> \
  --project <DbContext所在项目> \
  --startup-project <启动项目> \
  --output-dir Migrations

# 示例：添加 "AddUserProfile" 迁移
dotnet ef migrations add AddUserProfile \
  --project SLzrCrossGate.Core \
  --startup-project SLzrCrossGate.ApiService
```

## 本地测试应用迁移

### 应用迁移到开发数据库

```bash
dotnet ef database update \
  --project src/MyApp.Core \
  --startup-project src/MyApp.Web

# 回滚到指定迁移
dotnet ef database update PreviousMigrationName
```

## 生成生产环境的SQL脚本

```bash
# 全量脚本（首次部署）
dotnet ef migrations script -o full.sql

# 增量脚本（更新部署）
dotnet ef migrations script FromMigration ToMigration -o incremental.sql

# 带事务和版本检查的脚本
dotnet ef migrations script --idempotent --transactional

#关键参数：
--idempotent：生成幂等脚本（包含 IF 存在性检查）
--transactional：用事务包裹整个脚本
```



## 故障恢复流程


### 回滚步骤：

1. 生成回滚脚本：
1. 
```bash
dotnet ef migrations script CurrentMigration PreviousMigration -o rollback.sql
```

2. 执行回滚前备份：
1. 
```sql
BACKUP DATABASE MyDB TO DISK = 'C:\Backups\MyDB.bak' WITH FORMAT
```

3. 执行回滚脚本
4. 重建错误迁移：

```bash
dotnet ef migrations remove --force
dotnet ef migrations add FixedMigration
```

## 最佳实践总结
- ​小步提交：每次模型变化立即生成迁移
​- 环境隔离：生产环境禁止自动迁移
​- 版本追溯：保留所有历史迁移文件
​- 自动化验证：

```yaml
# CI 管道示例
- name: Validate Migrations
  run: dotnet ef migrations script --dry-run
```

- 文档记录：维护 MIGRATION_README.md 说明重大变更

