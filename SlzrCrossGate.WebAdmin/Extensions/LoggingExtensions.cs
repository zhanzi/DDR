using Microsoft.Extensions.Logging;

namespace SlzrCrossGate.WebAdmin.Extensions
{
    /// <summary>
    /// 日志记录扩展方法
    /// </summary>
    public static class LoggingExtensions
    {
        // 定义高性能日志记录委托
        private static readonly Action<ILogger, string, string?, string?, Exception?> _logUserAction =
            LoggerMessage.Define<string, string?, string?>(
                LogLevel.Information,
                new EventId(1001, "UserAction"),
                "用户操作: {Action}, 用户: {UserId}, IP: {IpAddress}");

        private static readonly Action<ILogger, string, string?, string?, Exception?> _logBusinessOperation =
            LoggerMessage.Define<string, string?, string?>(
                LogLevel.Information,
                new EventId(1002, "BusinessOperation"),
                "业务操作: {Operation}, 用户: {UserId}, 结果: {Result}");

        private static readonly Action<ILogger, string, string?, string?, Exception?> _logDataAccess =
            LoggerMessage.Define<string, string?, string?>(
                LogLevel.Information,
                new EventId(1003, "DataAccess"),
                "数据访问: {Operation}, 表: {TableName}, 用户: {UserId}");

        private static readonly Action<ILogger, string, string?, string?, Exception?> _logSecurityEvent =
            LoggerMessage.Define<string, string?, string?>(
                LogLevel.Warning,
                new EventId(2001, "SecurityEvent"),
                "安全事件: {Event}, 用户: {UserId}, IP: {IpAddress}");

        private static readonly Action<ILogger, string, string?, long, Exception?> _logPerformance =
            LoggerMessage.Define<string, string?, long>(
                LogLevel.Information,
                new EventId(3001, "Performance"),
                "性能监控: {Operation}, 用户: {UserId}, 耗时: {ElapsedMilliseconds}ms");

        private static readonly Action<ILogger, string, string?, string?, Exception?> _logExternalService =
            LoggerMessage.Define<string, string?, string?>(
                LogLevel.Information,
                new EventId(4001, "ExternalService"),
                "外部服务调用: {Service}, 操作: {Operation}, 结果: {Result}");

        /// <summary>
        /// 记录用户操作日志
        /// </summary>
        public static void LogUserAction(this ILogger logger, string action, string? userId = null, string? ipAddress = null)
        {
            _logUserAction(logger, action, userId, ipAddress, null);
        }

        /// <summary>
        /// 记录业务操作日志
        /// </summary>
        public static void LogBusinessOperation(this ILogger logger, string operation, string? userId = null, string? result = null)
        {
            _logBusinessOperation(logger, operation, userId, result, null);
        }

        /// <summary>
        /// 记录数据访问日志
        /// </summary>
        public static void LogDataAccess(this ILogger logger, string operation, string? tableName = null, string? userId = null)
        {
            _logDataAccess(logger, operation, tableName, userId, null);
        }

        /// <summary>
        /// 记录安全事件日志
        /// </summary>
        public static void LogSecurityEvent(this ILogger logger, string securityEvent, string? userId = null, string? ipAddress = null)
        {
            _logSecurityEvent(logger, securityEvent, userId, ipAddress, null);
        }

        /// <summary>
        /// 记录性能监控日志
        /// </summary>
        public static void LogPerformance(this ILogger logger, string operation, long elapsedMilliseconds, string? userId = null)
        {
            _logPerformance(logger, operation, userId, elapsedMilliseconds, null);
        }

        /// <summary>
        /// 记录外部服务调用日志
        /// </summary>
        public static void LogExternalService(this ILogger logger, string service, string? operation = null, string? result = null)
        {
            _logExternalService(logger, service, operation, result, null);
        }

        /// <summary>
        /// 记录文件操作日志
        /// </summary>
        public static void LogFileOperation(this ILogger logger, string operation, string fileName, string? userId = null, long? fileSize = null)
        {
            logger.LogInformation("文件操作: {Operation}, 文件: {FileName}, 大小: {FileSize} bytes, 用户: {UserId}",
                operation, fileName, fileSize, userId);
        }

        /// <summary>
        /// 记录数据库操作异常
        /// </summary>
        public static void LogDatabaseError(this ILogger logger, Exception exception, string operation, string? tableName = null)
        {
            logger.LogError(exception, "数据库操作失败: {Operation}, 表: {TableName}", operation, tableName);
        }

        /// <summary>
        /// 记录API调用日志
        /// </summary>
        public static void LogApiCall(this ILogger logger, string method, string path, int statusCode, long elapsedMs, string? userId = null)
        {
            if (statusCode >= 400)
            {
                logger.LogWarning("API调用失败: {Method} {Path}, 状态码: {StatusCode}, 耗时: {ElapsedMs}ms, 用户: {UserId}",
                    method, path, statusCode, elapsedMs, userId);
            }
            else
            {
                logger.LogInformation("API调用成功: {Method} {Path}, 状态码: {StatusCode}, 耗时: {ElapsedMs}ms, 用户: {UserId}",
                    method, path, statusCode, elapsedMs, userId);
            }
        }
    }
}
