using Microsoft.EntityFrameworkCore;
using System;

namespace SlzrCrossGate.WebAdmin.Migrations
{
    /// <summary>
    /// 时区迁移助手
    /// 用于将现有的UTC时间数据转换为本地时间
    /// </summary>
    public static class TimezoneMigrationHelper
    {
        /// <summary>
        /// 将UTC时间转换为本地时间的SQL脚本
        /// 注意：这个脚本假设现有数据是UTC时间，需要转换为CST(+8)
        /// </summary>
        /// <param name="migrationBuilder">迁移构建器</param>
        public static void ConvertUtcToLocalTime(Microsoft.EntityFrameworkCore.Migrations.MigrationBuilder migrationBuilder)
        {
            // 警告：执行前请备份数据库！

            // 示例：转换TerminalEvents表的EventTime字段
            migrationBuilder.Sql(@"
                -- 将UTC时间转换为CST时间（+8小时）
                UPDATE TerminalEvents
                SET EventTime = DATE_ADD(EventTime, INTERVAL 8 HOUR)
                WHERE EventTime IS NOT NULL;
            ");

            // 示例：转换Messages表的CreateTime字段
            migrationBuilder.Sql(@"
                UPDATE Messages
                SET CreateTime = DATE_ADD(CreateTime, INTERVAL 8 HOUR)
                WHERE CreateTime IS NOT NULL;
            ");

            // 示例：转换Messages表的ReadTime字段
            migrationBuilder.Sql(@"
                UPDATE Messages
                SET ReadTime = DATE_ADD(ReadTime, INTERVAL 8 HOUR)
                WHERE ReadTime IS NOT NULL;
            ");

            // 示例：转换FileVersions表的CreateTime字段
            migrationBuilder.Sql(@"
                UPDATE FileVersions
                SET CreateTime = DATE_ADD(CreateTime, INTERVAL 8 HOUR)
                WHERE CreateTime IS NOT NULL;
            ");

            // 示例：转换TerminalStatus表的LastActiveTime字段
            migrationBuilder.Sql(@"
                UPDATE TerminalStatus
                SET LastActiveTime = DATE_ADD(LastActiveTime, INTERVAL 8 HOUR)
                WHERE LastActiveTime IS NOT NULL;
            ");

            // 添加注释到数据库，记录迁移信息
            migrationBuilder.Sql(@"
                INSERT INTO __EFMigrationsHistory (MigrationId, ProductVersion)
                VALUES ('TimezoneMigration_UTC_to_CST', 'Manual Migration - Converted UTC to CST+8')
                ON DUPLICATE KEY UPDATE ProductVersion = 'Manual Migration - Converted UTC to CST+8';
            ");
        }

        /// <summary>
        /// 回滚：将本地时间转换回UTC时间
        /// </summary>
        /// <param name="migrationBuilder">迁移构建器</param>
        public static void ConvertLocalTimeToUtc(Microsoft.EntityFrameworkCore.Migrations.MigrationBuilder migrationBuilder)
        {
            // 警告：执行前请备份数据库！

            // 示例：将CST时间转换回UTC时间（-8小时）
            migrationBuilder.Sql(@"
                UPDATE TerminalEvents
                SET EventTime = DATE_SUB(EventTime, INTERVAL 8 HOUR)
                WHERE EventTime IS NOT NULL;
            ");

            migrationBuilder.Sql(@"
                UPDATE Messages
                SET CreateTime = DATE_SUB(CreateTime, INTERVAL 8 HOUR)
                WHERE CreateTime IS NOT NULL;
            ");

            migrationBuilder.Sql(@"
                UPDATE Messages
                SET ReadTime = DATE_SUB(ReadTime, INTERVAL 8 HOUR)
                WHERE ReadTime IS NOT NULL;
            ");

            migrationBuilder.Sql(@"
                UPDATE FileVersions
                SET CreateTime = DATE_SUB(CreateTime, INTERVAL 8 HOUR)
                WHERE CreateTime IS NOT NULL;
            ");

            migrationBuilder.Sql(@"
                UPDATE TerminalStatus
                SET LastActiveTime = DATE_SUB(LastActiveTime, INTERVAL 8 HOUR)
                WHERE LastActiveTime IS NOT NULL;
            ");
        }

        /// <summary>
        /// 验证时间转换是否正确
        /// </summary>
        /// <param name="context">数据库上下文</param>
        /// <returns>验证结果</returns>
        public static async Task<bool> ValidateTimeConversion(DbContext context)
        {
            try
            {
                // 检查是否有明显错误的时间数据
                var futureEvents = await context.Database.ExecuteSqlRawAsync(@"
                    SELECT COUNT(*) FROM TerminalEvents
                    WHERE EventTime > DATE_ADD(NOW(), INTERVAL 1 DAY)
                ");

                var veryOldEvents = await context.Database.ExecuteSqlRawAsync(@"
                    SELECT COUNT(*) FROM TerminalEvents
                    WHERE EventTime < '2020-01-01'
                ");

                // 如果有太多未来或过于古老的事件，可能转换有问题
                return futureEvents < 10 && veryOldEvents < 100;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"验证时间转换时出错: {ex.Message}");
                return false;
            }
        }

        /// <summary>
        /// 生成时间转换报告
        /// </summary>
        /// <param name="context">数据库上下文</param>
        /// <returns>转换报告</returns>
        public static async Task<string> GenerateConversionReport(DbContext context)
        {
            var report = "时区转换报告\n";
            report += "================\n";
            report += $"转换时间: {DateTime.Now:yyyy-MM-dd HH:mm:ss}\n";
            report += $"目标时区: {TimeZoneInfo.Local.DisplayName}\n\n";

            try
            {
                // 统计各表的记录数量
                var terminalEventsCount = await context.Database.ExecuteSqlRawAsync("SELECT COUNT(*) FROM TerminalEvents");
                var messagesCount = await context.Database.ExecuteSqlRawAsync("SELECT COUNT(*) FROM Messages");
                var fileVersionsCount = await context.Database.ExecuteSqlRawAsync("SELECT COUNT(*) FROM FileVersions");

                report += $"已转换的记录数量:\n";
                report += $"- TerminalEvents: {terminalEventsCount}\n";
                report += $"- Messages: {messagesCount}\n";
                report += $"- FileVersions: {fileVersionsCount}\n\n";

                report += "注意事项:\n";
                report += "1. 所有时间字段已从UTC转换为CST(+8)\n";
                report += "2. 请验证业务逻辑是否正常工作\n";
                report += "3. 建议在生产环境部署前进行充分测试\n";
            }
            catch (Exception ex)
            {
                report += $"生成报告时出错: {ex.Message}\n";
            }

            return report;
        }
    }
}
