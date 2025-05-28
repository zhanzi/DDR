using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json;
using SlzrCrossGate.Core.Models;
using SlzrCrossGate.Core.Database;
using SlzrCrossGate.Core;
using SlzrCrossGate.WebAdmin.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.DataProtection;
using System.IO;

var builder = WebApplication.CreateBuilder(args);


builder.AddServiceDefaults();

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

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

                            logger.LogInformation("已将ClaimTypes.NameIdentifier映射到JwtRegisteredClaimNames.Sub");
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
    dbContext.Database.Migrate();

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

app.UseDefaultFiles();

app.UseStaticFiles();
app.UseRouting();

//开发环境允许跨域
app.UseCors(builder =>
{
    builder.WithOrigins("http://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
});

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapFallbackToFile("index.html");//SPA回退路由

app.Run();
