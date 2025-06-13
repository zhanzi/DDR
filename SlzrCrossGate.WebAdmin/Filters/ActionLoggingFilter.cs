using Microsoft.AspNetCore.Mvc.Filters;
using System.Diagnostics;
using System.Text.Json;

namespace SlzrCrossGate.WebAdmin.Filters
{
    /// <summary>
    /// 操作日志记录过滤器
    /// </summary>
    public class ActionLoggingFilter : IAsyncActionFilter
    {
        private readonly ILogger<ActionLoggingFilter> _logger;

        public ActionLoggingFilter(ILogger<ActionLoggingFilter> logger)
        {
            _logger = logger;
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var stopwatch = Stopwatch.StartNew();
            var actionName = $"{context.Controller.GetType().Name}.{context.ActionDescriptor.DisplayName}";
            var requestId = context.HttpContext.TraceIdentifier;
            var userId = context.HttpContext.User?.Identity?.Name ?? "Anonymous";
            var ipAddress = context.HttpContext.Connection.RemoteIpAddress?.ToString();

            // 记录请求开始
            var requestInfo = new
            {
                RequestId = requestId,
                Action = actionName,
                Method = context.HttpContext.Request.Method,
                Path = context.HttpContext.Request.Path.Value,
                QueryString = context.HttpContext.Request.QueryString.Value,
                UserId = userId,
                IpAddress = ipAddress,
                UserAgent = context.HttpContext.Request.Headers.UserAgent.ToString(),
                Parameters = GetActionParameters(context)
            };

            _logger.LogInformation("开始执行操作: {@RequestInfo}", requestInfo);

            try
            {
                var executedContext = await next();
                stopwatch.Stop();

                if (executedContext.Exception == null)
                {
                    // 成功执行
                    var responseInfo = new
                    {
                        RequestId = requestId,
                        Action = actionName,
                        StatusCode = context.HttpContext.Response.StatusCode,
                        ElapsedMilliseconds = stopwatch.ElapsedMilliseconds,
                        UserId = userId
                    };

                    _logger.LogInformation("操作执行成功: {@ResponseInfo}", responseInfo);
                }
                else
                {
                    // 执行过程中发生异常
                    var errorInfo = new
                    {
                        RequestId = requestId,
                        Action = actionName,
                        ElapsedMilliseconds = stopwatch.ElapsedMilliseconds,
                        UserId = userId,
                        Exception = executedContext.Exception.GetType().Name,
                        ErrorMessage = executedContext.Exception.Message
                    };

                    _logger.LogError(executedContext.Exception, "操作执行失败: {@ErrorInfo}", errorInfo);
                }
            }
            catch (Exception ex)
            {
                stopwatch.Stop();
                
                var errorInfo = new
                {
                    RequestId = requestId,
                    Action = actionName,
                    ElapsedMilliseconds = stopwatch.ElapsedMilliseconds,
                    UserId = userId,
                    Exception = ex.GetType().Name,
                    ErrorMessage = ex.Message
                };

                _logger.LogError(ex, "操作执行异常: {@ErrorInfo}", errorInfo);
                throw;
            }
        }

        private object GetActionParameters(ActionExecutingContext context)
        {
            var parameters = new Dictionary<string, object?>();
            
            foreach (var param in context.ActionArguments)
            {
                // 过滤敏感信息
                if (IsSensitiveParameter(param.Key))
                {
                    parameters[param.Key] = "***";
                }
                else if (param.Value != null)
                {
                    try
                    {
                        // 尝试序列化参数，如果失败则使用ToString
                        var serialized = JsonSerializer.Serialize(param.Value, new JsonSerializerOptions
                        {
                            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                            WriteIndented = false
                        });
                        parameters[param.Key] = JsonSerializer.Deserialize<object>(serialized);
                    }
                    catch
                    {
                        parameters[param.Key] = param.Value.ToString();
                    }
                }
                else
                {
                    parameters[param.Key] = null;
                }
            }

            return parameters;
        }

        private static bool IsSensitiveParameter(string parameterName)
        {
            var sensitiveParams = new[] { "password", "token", "secret", "key", "credential" };
            return sensitiveParams.Any(s => parameterName.ToLower().Contains(s));
        }
    }
}
