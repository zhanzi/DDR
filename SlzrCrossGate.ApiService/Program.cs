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
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using SlzrCrossGate.Core.Service.BusinessServices;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();

System.Text.Encoding.RegisterProvider(System.Text.CodePagesEncodingProvider.Instance);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 扩展健康检查服务，添加数据库检查
builder.Services.AddHealthChecks()
    .AddMySql(builder.Configuration.GetConnectionString("DefaultConnection")!, name: "database");
    // 注意：RabbitMQ健康检查暂时移除，因为AspNetCore.HealthChecks.RabbitMQ与RabbitMQ.Client 7.1.2版本不兼容

//// 配置身份认证服务(WEB端需要)
//builder.Services.AddIdentity<ApplicationUser, ApplicationRole>(options => options.SignIn.RequireConfirmedAccount = true) // 修改此行
//    .AddEntityFrameworkStores<TcpDbContext>()
//    .AddDefaultTokenProviders(); // 添加此行

builder.AddCoreService();
builder.AddTcpService();

builder.Services.AddOpenTelemetry()
    //.WithTracing(tracerProviderBuilder =>
    //{
    //    tracerProviderBuilder
    //        .AddSource("SlzrCrossGate.Tcp")  // 添加自定义活动源
    //        .SetResourceBuilder(ResourceBuilder.CreateDefault()
    //            .AddService("SlzrCrossGate.Tcp"))
    //        .AddAspNetCoreInstrumentation()
    //        .AddHttpClientInstrumentation();
    //})
    .WithMetrics(meterProviderBuilder =>
    {
        meterProviderBuilder
            .AddMeter("SlzrCrossGate.Tcp")  // 添加自定义度量源
            .AddAspNetCoreInstrumentation()
            .AddHttpClientInstrumentation();
    });


// 配置Kestrel同时监听HTTP和TCP
builder.WebHost.ConfigureKestrel(kestrel =>
{
    // 从环境变量读取端口配置，如果不存在则使用默认值
    var httpPort = int.Parse(Environment.GetEnvironmentVariable("HTTP_PORT") ?? "8000");
    var tcpPort = int.Parse(Environment.GetEnvironmentVariable("TCP_PORT") ?? "8001");

    Console.WriteLine($"正在配置HTTP端口: {httpPort}, TCP端口: {tcpPort}");

    // HTTP端点
    kestrel.Listen(IPAddress.Any, httpPort, listen =>
    {
        listen.Protocols = HttpProtocols.Http1AndHttp2;
    });

    // TCP端点
    kestrel.Listen(IPAddress.Any, tcpPort, listen =>
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

    //await SeedData.InitializeUser(services);

    var terminalManager = services.GetRequiredService<TerminalManager>();
    terminalManager.Init();

    _ = services.GetRequiredService<TerminalEventService>();
    _ = services.GetRequiredService<MsgboxEventService>();
    _ = services.GetRequiredService<IRabbitMQService>();
}



app.MapDefaultEndpoints();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// 在使用反向代理时，HTTPS重定向由代理层处理
// 如果直接暴露容器，请启用此行
// app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Logger.LogInformation("启动时间: {Time}", DateTime.Now);

app.Run();
