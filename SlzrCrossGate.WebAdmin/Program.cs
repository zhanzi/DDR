using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json;
using SlzrCrossGate.Core.Models;
using SlzrCrossGate.Core.Database;
using SlzrCrossGate.Core;
using SlzrCrossGate.Core.Services;
using SlzrCrossGate.WebAdmin.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.AspNetCore.Server.IIS;
using Microsoft.AspNetCore.Http.Features;
using SlzrCrossGate.WebAdmin.Middleware;
using SlzrCrossGate.WebAdmin.Filters;
using System.IO;

var builder = WebApplication.CreateBuilder(args);

// 设置应用程序时区为中国标准时间
TimeZoneInfo.ClearCachedData();
var chinaTimeZone = TimeZoneInfo.FindSystemTimeZoneById("China Standard Time");
// 注意：在Linux系统中可能需要使用 "Asia/Shanghai"

builder.AddServiceDefaults();

// Add services to the container.

// 配置控制器和过滤器
builder.Services.AddControllers(options =>
{
    // 添加全局操作日志过滤器
    options.Filters.Add<ActionLoggingFilter>();
});

// 配置文件上传大小限制
builder.Services.Configure<IISServerOptions>(options =>
{
    options.MaxRequestBodySize = 100 * 1024 * 1024; // 100MB
});

builder.Services.Configure<KestrelServerOptions>(options =>
{
    options.Limits.MaxRequestBodySize = 100 * 1024 * 1024; // 100MB
});

builder.Services.Configure<FormOptions>(options =>
{
    options.ValueLengthLimit = int.MaxValue;
    options.MultipartBodyLengthLimit = 100 * 1024 * 1024; // 100MB
    options.MultipartHeadersLengthLimit = int.MaxValue;
});
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 扩展健康检查服务，添加数据库检查
builder.Services.AddHealthChecks()
    .AddMySql(builder.Configuration.GetConnectionString("DefaultConnection")!, name: "database");
    // 注意：RabbitMQ健康检查暂时移除，因为AspNetCore.HealthChecks.RabbitMQ与RabbitMQ.Client 7.1.2版本不兼容

// 配置数据保护,使密钥持久化存储
var keysDirectory = Path.Combine(builder.Environment.ContentRootPath, "Keys");
if (!Directory.Exists(keysDirectory))
{
    Directory.CreateDirectory(keysDirectory);
}

var dataProtectionBuilder = builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo(keysDirectory))
    .SetApplicationName("SlzrCrossGate.WebAdmin");

// 简化的数据保护配置
// 在开发环境下，密钥以明文存储到文件系统即可
// 在生产环境下，建议配置环境变量或使用云服务的密钥管理
if (builder.Environment.IsDevelopment())
{
    // 开发环境：使用默认保护即可
    var logger = LoggerFactory.Create(builder => builder.AddConsole()).CreateLogger("DataProtection");
    logger.LogInformation("开发环境：数据保护密钥存储在 {KeysDirectory}", keysDirectory);
}
else
{
    // 生产环境：如果有配置证书则使用，否则使用默认方式并记录提醒
    var keyEncryptionCertPath = builder.Configuration["DataProtection:CertificatePath"];
    var keyEncryptionPassword = builder.Configuration["DataProtection:CertificatePassword"];

    if (!string.IsNullOrEmpty(keyEncryptionCertPath) && File.Exists(keyEncryptionCertPath))
    {
        try
        {
            var certificate = new System.Security.Cryptography.X509Certificates.X509Certificate2(
                keyEncryptionCertPath,
                keyEncryptionPassword);
            dataProtectionBuilder.ProtectKeysWithCertificate(certificate);

            var logger = LoggerFactory.Create(builder => builder.AddConsole()).CreateLogger("DataProtection");
            logger.LogInformation("生产环境：使用X509证书保护数据密钥");
        }
        catch (Exception ex)
        {
            var logger = LoggerFactory.Create(builder => builder.AddConsole()).CreateLogger("DataProtection");
            logger.LogWarning(ex, "无法加载X509证书，使用默认保护方式");
        }
    }
    else
    {
        var logger = LoggerFactory.Create(builder => builder.AddConsole()).CreateLogger("DataProtection");
        logger.LogInformation("生产环境：使用默认数据保护方式，密钥存储在 {KeysDirectory}", keysDirectory);
        logger.LogInformation("如需更高安全性，可配置 DataProtection:CertificatePath 使用证书加密");
    }
}


// 在 ConfigureServices 中添加
builder.Services.AddScoped<TwoFactorAuthService>();
builder.Services.AddScoped<WechatAuthService>();
builder.Services.AddScoped<SystemSettingsService>();
builder.Services.AddScoped<UserService>();


// 添加HttpClient
builder.Services.AddHttpClient("WechatApi", client =>
{
    client.BaseAddress = new Uri("https://api.weixin.qq.com/");
    client.DefaultRequestHeaders.Add("Accept", "application/json");
});

// 配置身份认证服务
builder.Services.AddIdentity<ApplicationUser, ApplicationRole>(options => {
    options.SignIn.RequireConfirmedAccount = false; // 设置用户不需要确认邮箱就可以登录
    // 密码设置
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = true;
    options.Password.RequiredLength = 8;

    // 锁定设置
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.AllowedForNewUsers = true;

    // 用户设置
    options.User.RequireUniqueEmail = true;
}).AddEntityFrameworkStores<TcpDbContext>()
    .AddDefaultTokenProviders();

// 配置JWT认证
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
            builder.Configuration["Jwt:Key"] ?? "defaultKeyForDevelopment12345678901234567890")),
        // 关键设置：确保JWT的sub声明被正确映射
        NameClaimType = System.Security.Claims.ClaimTypes.Name,
        RoleClaimType = System.Security.Claims.ClaimTypes.Role
    };
    options.Events = new JwtBearerEvents
    {
        OnChallenge = context =>
        {
            // 覆盖默认的401响应
            context.HandleResponse();
            context.Response.StatusCode = 401;
            context.Response.ContentType = "application/json";
            var result = JsonSerializer.Serialize(new { message = "未授权访问" });
            return context.Response.WriteAsync(result);
        },
        OnTokenValidated = context =>
        {
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();

            // 确保sub声明被正确处理
            var principal = context.Principal;
            if (principal != null)
            {
                // 检查是否有sub声明
                var subClaim = principal.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub);

                // 如果没有sub声明，但有NameIdentifier声明，则添加sub声明
                if (subClaim == null)
                {
                    var nameIdClaim = principal.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                    if (nameIdClaim != null)
                    {
                        // 添加sub声明
                        var identity = principal.Identity as System.Security.Claims.ClaimsIdentity;
                        if (identity != null)
                        {
                            identity.AddClaim(new System.Security.Claims.Claim(
                                System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub,
                                nameIdClaim.Value));
                        }
                    }
                }
            }

            // 检查令牌是否为临时令牌
            var isTemporaryClaim = principal?.FindFirst("isTemporary");
            if (isTemporaryClaim != null && isTemporaryClaim.Value == "True")
            {
                // 获取当前请求路径
                var path = context.HttpContext.Request.Path.Value?.ToLower();

                // 允许临时令牌访问的路径列表
                var allowedPaths = new[]
                {
                    "/api/auth/verify-code",
                    "/api/auth/setup-two-factor",
                    "/api/auth/confirm-two-factor"
                };

                // 如果不是允许的路径，则拒绝访问
                if (string.IsNullOrEmpty(path) || !allowedPaths.Any(p => path.StartsWith(p)))
                {
                    logger.LogWarning("用户使用临时令牌尝试访问受保护的资源: {Path}", path);
                    context.Fail("临时令牌不能访问此资源，请先完成双因素验证");
                    return Task.CompletedTask;
                }

                logger.LogInformation("用户使用临时令牌访问允许的路径: {Path}", path);
            }
            return Task.CompletedTask;
        }
    };
});

// 添加授权服务
builder.Services.AddAuthorization();

builder.AddCoreWebAdminService();

var app = builder.Build();


// 应用数据库迁移
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var dbContext = services.GetRequiredService<TcpDbContext>();
    var logger = services.GetRequiredService<ILogger<Program>>();

    // 检查是否启用迁移（默认启用）
    var enableMigration = builder.Configuration.GetValue<bool>("EnableMigration", true);

    if (enableMigration)
    {
        var migrationService = services.GetRequiredService<DatabaseMigrationService>();

        try
        {
            logger.LogInformation("[WebAdmin] 开始执行数据库迁移...");

            // 使用专业的迁移服务执行安全迁移
            var migrationOptions = new MigrationOptions
            {
                CommandTimeout = 600 // 10分钟超时
            };

            var result = await migrationService.MigrateAsync(dbContext, "WebAdmin", migrationOptions);

            if (result.Success)
            {
                logger.LogInformation("[WebAdmin] 数据库迁移成功: {Message}, 耗时: {Duration}",
                    result.Message, result.Duration);
            }
            else
            {
                logger.LogError("[WebAdmin] 数据库迁移失败: {Message}", result.Message);
                throw new InvalidOperationException($"数据库迁移失败: {result.Message}", result.Error);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "[WebAdmin] 数据库迁移失败，开始索引恢复检查...");

            try
            {
                // 获取索引恢复服务
                var indexRecoveryService = services.GetRequiredService<IndexRecoveryService>();

                // 从 EF Core 模型中提取期望的索引
                var expectedIndexes = indexRecoveryService.ExtractExpectedIndexesFromModel(dbContext);
                logger.LogInformation("[WebAdmin] 提取到 {Count} 个期望的索引定义", expectedIndexes.Count);

                // 检查并尝试恢复丢失的索引
                var recoveryResult = await indexRecoveryService.CheckAndRecoverIndexes(dbContext, expectedIndexes);

                if (recoveryResult.Success)
                {
                    logger.LogInformation("[WebAdmin] 索引恢复成功，应用可以继续启动");
                    logger.LogInformation("[WebAdmin] 恢复统计: 期望 {Expected} 个，当前 {Current} 个，恢复 {Recovered} 个",
                        recoveryResult.TotalExpected, recoveryResult.TotalCurrent, recoveryResult.RecoveredCount);
                }
                else
                {
                    logger.LogError("[WebAdmin] 索引恢复失败，有 {FailedCount} 个索引无法自动恢复",
                        recoveryResult.FailedIndexes.Count);

                    // 生成手动恢复脚本
                    var script = indexRecoveryService.GenerateRecoveryScript(recoveryResult.FailedIndexes);
                    logger.LogError("[WebAdmin] 手动恢复脚本:\n{Script}", script);

                    // 记录详细的失败信息
                    foreach (var failedIndex in recoveryResult.FailedIndexes)
                    {
                        logger.LogError("[WebAdmin] 无法恢复索引: {TableName}.{IndexName}",
                            failedIndex.TableName, failedIndex.IndexName);
                    }

                    throw new InvalidOperationException($"数据库迁移失败且索引恢复不完整，有 {recoveryResult.FailedIndexes.Count} 个索引需要手动处理", ex);
                }
            }
            catch (Exception recoveryEx)
            {
                logger.LogCritical(recoveryEx, "[WebAdmin] 索引恢复过程中发生错误");
                logger.LogCritical(ex, "[WebAdmin] 原始迁移错误");
                throw new InvalidOperationException("数据库迁移失败且索引恢复也失败，应用程序无法启动", ex);
            }
        }
    }
    else
    {
        logger.LogInformation("[WebAdmin] 数据库迁移已禁用，跳过迁移步骤");

        // 等待数据库就绪
        var maxRetries = 30;
        var retryCount = 0;

        while (retryCount < maxRetries)
        {
            try
            {
                var canConnect = await dbContext.Database.CanConnectAsync();
                if (canConnect)
                {
                    logger.LogInformation("[WebAdmin] 数据库连接就绪");
                    break;
                }
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "[WebAdmin] 数据库连接尝试 {Retry}/{MaxRetries} 失败", retryCount + 1, maxRetries);
            }

            retryCount++;
            if (retryCount < maxRetries)
            {
                await Task.Delay(2000);
            }
        }

        if (retryCount >= maxRetries)
        {
            throw new InvalidOperationException("等待数据库就绪超时");
        }
    }

    await SeedData.InitializeUser(services);
}

app.MapDefaultEndpoints();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}


//app.Use(async (context, next) =>
//{
//    var tenantService = context.RequestServices.GetRequiredService<TenantService>();
//    await tenantService.SetCurrentTenantAsync();
//    await next.Invoke();
//});

// 添加全局异常处理中间件（必须在其他中间件之前）
app.UseMiddleware<GlobalExceptionHandlingMiddleware>();

app.UseDefaultFiles();

app.UseStaticFiles();
app.UseRouting();

//开发环境允许跨域
if (app.Environment.IsDevelopment())
{
    app.UseCors(builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyHeader()
               .AllowAnyMethod();
    });
}
else
{
    app.UseCors(builder =>
    {
        builder.WithOrigins("http://localhost:3000","http://localhost:5270")
               .AllowAnyHeader()
               .AllowAnyMethod()
               .AllowCredentials();
    });
}

// 在使用反向代理时，HTTPS重定向由代理层处理
// 如果直接暴露容器，请启用此行
// app.UseHttpsRedirection();

// 配置转发头部，支持反向代理
app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
});

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapFallbackToFile("index.html");//SPA回退路由


app.Logger.LogInformation("启动时间: {Time}", DateTime.Now);

app.Run();
