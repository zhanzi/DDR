using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace SlzrCrossGate.WebAdmin.Middleware
{
    /// <summary>
    /// 全局异常处理中间件
    /// </summary>
    public class GlobalExceptionHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GlobalExceptionHandlingMiddleware> _logger;
        private readonly IWebHostEnvironment _environment;

        public GlobalExceptionHandlingMiddleware(
            RequestDelegate next,
            ILogger<GlobalExceptionHandlingMiddleware> logger,
            IWebHostEnvironment environment)
        {
            _next = next;
            _logger = logger;
            _environment = environment;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                await HandleExceptionAsync(context, ex);
            }
        }

        private async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            // 记录详细的异常信息
            var requestInfo = new
            {
                Method = context.Request.Method,
                Path = context.Request.Path.Value,
                QueryString = context.Request.QueryString.Value,
                Headers = context.Request.Headers.ToDictionary(h => h.Key, h => h.Value.ToString()),
                UserAgent = context.Request.Headers.UserAgent.ToString(),
                RemoteIpAddress = context.Connection.RemoteIpAddress?.ToString(),
                UserId = context.User?.Identity?.Name,
                TraceId = context.TraceIdentifier
            };

            _logger.LogError(exception, 
                "未处理的异常发生。请求信息: {@RequestInfo}", 
                requestInfo);

            // 设置响应
            context.Response.ContentType = "application/json";
            
            var response = new ProblemDetails();
            
            switch (exception)
            {
                case ArgumentException argEx:
                    response.Status = (int)HttpStatusCode.BadRequest;
                    response.Title = "参数错误";
                    response.Detail = argEx.Message;
                    break;
                    
                case UnauthorizedAccessException:
                    response.Status = (int)HttpStatusCode.Unauthorized;
                    response.Title = "未授权访问";
                    response.Detail = "您没有权限访问此资源";
                    break;
                    
                case KeyNotFoundException:
                    response.Status = (int)HttpStatusCode.NotFound;
                    response.Title = "资源未找到";
                    response.Detail = "请求的资源不存在";
                    break;
                    
                case InvalidOperationException invOpEx:
                    response.Status = (int)HttpStatusCode.BadRequest;
                    response.Title = "操作无效";
                    response.Detail = invOpEx.Message;
                    break;
                    
                case TimeoutException:
                    response.Status = (int)HttpStatusCode.RequestTimeout;
                    response.Title = "请求超时";
                    response.Detail = "请求处理超时，请稍后重试";
                    break;
                    
                default:
                    response.Status = (int)HttpStatusCode.InternalServerError;
                    response.Title = "服务器内部错误";
                    response.Detail = _environment.IsDevelopment() 
                        ? exception.Message 
                        : "服务器发生错误，请联系管理员";
                    break;
            }

            // 添加追踪ID
            response.Extensions["traceId"] = context.TraceIdentifier;
            
            // 在开发环境下添加详细的异常信息
            if (_environment.IsDevelopment())
            {
                response.Extensions["exception"] = new
                {
                    Type = exception.GetType().Name,
                    Message = exception.Message,
                    StackTrace = exception.StackTrace,
                    InnerException = exception.InnerException?.Message
                };
            }

            context.Response.StatusCode = response.Status ?? (int)HttpStatusCode.InternalServerError;

            var jsonResponse = JsonSerializer.Serialize(response, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = true
            });

            await context.Response.WriteAsync(jsonResponse);
        }
    }
}
