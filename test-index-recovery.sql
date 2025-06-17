-- 索引恢复功能测试脚本
-- 此脚本用于测试索引恢复功能是否正常工作
-- 警告：仅在测试环境中使用！

-- 1. 查看当前数据库中的所有索引
SELECT 
    table_name,
    index_name,
    column_name,
    non_unique,
    index_type
FROM information_schema.statistics 
WHERE table_schema = DATABASE() 
ORDER BY table_name, index_name, seq_in_index;

-- 2. 备份当前索引信息（用于恢复）
CREATE TABLE IF NOT EXISTS index_backup_test AS
SELECT 
    table_name,
    index_name,
    column_name,
    non_unique,
    index_type,
    seq_in_index
FROM information_schema.statistics 
WHERE table_schema = DATABASE();

-- 3. 模拟索引丢失 - 删除一些非关键索引进行测试
-- 注意：这些操作会实际删除索引，请确保在测试环境中执行

-- 示例：删除 Terminals 表的一些索引（如果存在）
-- DROP INDEX IF EXISTS IX_Terminals_MerchantID ON Terminals;
-- DROP INDEX IF EXISTS IX_Terminals_LineNO ON Terminals;

-- 示例：删除 FilePublish 表的索引（如果存在）
-- DROP INDEX IF EXISTS IX_FilePublish_TerminalID ON FilePublish;

-- 4. 检查索引是否已删除
SELECT 
    'After deletion' as status,
    table_name,
    index_name,
    column_name
FROM information_schema.statistics 
WHERE table_schema = DATABASE() 
    AND table_name IN ('Terminals', 'FilePublish')
ORDER BY table_name, index_name;

-- 5. 现在重启 WebAdmin 应用，观察日志中的索引恢复过程
-- 应该看到类似以下的日志：
-- [WebAdmin] 提取到 X 个期望的索引定义
-- [WebAdmin] 发现丢失的索引: Terminals.IX_Terminals_MerchantID
-- [WebAdmin] 成功恢复索引: Terminals.IX_Terminals_MerchantID
-- [WebAdmin] 索引恢复成功，应用可以继续启动

-- 6. 验证索引是否已恢复
SELECT 
    'After recovery' as status,
    table_name,
    index_name,
    column_name
FROM information_schema.statistics 
WHERE table_schema = DATABASE() 
    AND table_name IN ('Terminals', 'FilePublish')
ORDER BY table_name, index_name;

-- 7. 清理测试数据
-- DROP TABLE IF EXISTS index_backup_test;

-- 测试步骤说明：
-- 1. 在测试环境中执行此脚本的前半部分（查看和备份）
-- 2. 取消注释并执行索引删除语句
-- 3. 重启 WebAdmin 应用
-- 4. 观察应用日志中的索引恢复过程
-- 5. 执行验证查询确认索引已恢复
-- 6. 清理测试数据

-- 预期结果：
-- - 应用启动时检测到丢失的索引
-- - 自动尝试重建丢失的索引
-- - 记录详细的恢复日志
-- - 应用正常启动，不会因为索引问题而失败

-- 如果自动恢复失败，应该看到：
-- - 详细的错误日志
-- - 生成的手动恢复脚本
-- - 应用启动失败并提供明确的错误信息

-- 常见的测试索引（根据实际模型调整）：
/*
-- Terminals 表的索引
CREATE INDEX IX_Terminals_MerchantID ON Terminals (MerchantID);
CREATE INDEX IX_Terminals_LineNO ON Terminals (LineNO);
CREATE INDEX IX_Terminals_Status ON Terminals (Status);

-- FilePublish 表的索引
CREATE INDEX IX_FilePublish_TerminalID ON FilePublish (TerminalID);
CREATE INDEX IX_FilePublish_FileVerID ON FilePublish (FileVerID);
CREATE UNIQUE INDEX IX_FilePublish_TerminalID_FileVerID ON FilePublish (TerminalID, FileVerID);

-- Users 表的索引
CREATE UNIQUE INDEX IX_Users_Email ON Users (Email);
CREATE INDEX IX_Users_MerchantID ON Users (MerchantID);

-- Messages 表的索引
CREATE INDEX IX_Messages_TerminalID ON Messages (TerminalID);
CREATE INDEX IX_Messages_CreatedAt ON Messages (CreatedAt);
*/
