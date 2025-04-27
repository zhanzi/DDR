-- 创建SystemSettings表
CREATE TABLE IF NOT EXISTS `SystemSettings` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `EnableTwoFactorAuth` tinyint(1) NOT NULL DEFAULT 1,
    `ForceTwoFactorAuth` tinyint(1) NOT NULL DEFAULT 0,
    `EnableWechatLogin` tinyint(1) NOT NULL DEFAULT 1,
    `LastModified` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `LastModifiedBy` longtext NULL,
    PRIMARY KEY (`Id`)
) CHARACTER SET utf8mb4;

-- 添加默认系统设置记录（如果表为空）
INSERT INTO `SystemSettings` (`EnableTwoFactorAuth`, `ForceTwoFactorAuth`, `EnableWechatLogin`, `LastModifiedBy`)
SELECT 1, 0, 1, 'System'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `SystemSettings` LIMIT 1);

-- 更新迁移历史记录表，标记此迁移已应用
INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
SELECT '20250427064746_AddSystemSettings', '8.0.14'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM `__EFMigrationsHistory` 
    WHERE `MigrationId` = '20250427064746_AddSystemSettings'
);
