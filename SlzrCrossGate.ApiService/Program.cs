using Microsoft.AspNetCore.Server.Kestrel.Core;
using System.Net;
using Microsoft.AspNetCore.Connections;
using Microsoft.AspNetCore.Connections.Features;
using SlzrCrossGate.Tcp;
using SlzrCrossGate.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SlzrCrossGate.Core.Database;
using SlzrCrossGate.Core.Service;
using Microsoft.AspNetCore.Identity;
using SlzrCrossGate.Core.Models;
using Minio;
using SlzrCrossGate.Core.Services;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();


//配置文件上传服务
builder.Services.AddFileService(options =>
{
    var fileServiceConfig = builder.Configuration.GetSection("FileService");
    options.DefaultStorageType = fileServiceConfig["DefaultStorageType"] ?? throw new ArgumentNullException("FileService:DefaultStorageType");
    options.LocalFilePath = fileServiceConfig["LocalFilePath"] ?? throw new ArgumentNullException("FileService:LocalFilePath");
    options.MinioEndpoint = fileServiceConfig["MinIO:Endpoint"] ?? throw new ArgumentNullException("MinIO:Endpoint");
    options.MinioAccessKey = fileServiceConfig["MinIO:AccessKey"] ?? throw new ArgumentNullException("MinIO:AccessKey");
    options.MinioSecretKey = fileServiceConfig["MinIO:SecretKey"] ?? throw new ArgumentNullException("MinIO:SecretKey");
    options.MinioBucketName = fileServiceConfig["MinIO:BucketName"] ?? throw new ArgumentNullException("MinIO:BucketName");
});

// 配置数据库服务
builder.Services.AddConfiguredDbContext(builder.Configuration);

// 配置身份认证服务(WEB端需要)
builder.Services.AddIdentity<ApplicationUser, ApplicationRole>(options => options.SignIn.RequireConfirmedAccount = true) // 修改此行
    .AddEntityFrameworkStores<TcpDbContext>()
    .AddDefaultTokenProviders(); // 添加此行

builder.AddTcpService();
builder.AddCoreService();

// 配置Kestrel同时监听HTTP和TCP
builder.WebHost.ConfigureKestrel(kestrel =>
{
    // HTTP端点（原有配置保留）
    kestrel.Listen(IPAddress.Any, 5000, listen =>
    {
        listen.Protocols = HttpProtocols.Http1AndHttp2;
    });

    // TCP端点（新增配置）
    kestrel.Listen(IPAddress.Any, 5001, listen =>
    {
        listen.UseConnectionHandler<TcpConnectionHandler>();
        listen.UseConnectionLogging();
        listen.Use((context, next) =>
        {
            var socketFeature = context.Features.Get<IConnectionSocketFeature>();
            if (socketFeature?.Socket != null)
            {
                socketFeature.Socket.NoDelay = true;
            }
            return next();
        });
    });
});

var app = builder.Build();

// 应用数据库迁移
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var dbContext = services.GetRequiredService<TcpDbContext>();
    dbContext.Database.Migrate();

    await SeedData.InitializeUser(services);

    var terminalManager = services.GetRequiredService<TerminalManager>();
    terminalManager.LoadTerminalsFromDatabase(dbContext);
}



app.MapDefaultEndpoints();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

Console.WriteLine("Console 日志");

app.Logger.LogInformation("Logger 日志");

app.Run();
