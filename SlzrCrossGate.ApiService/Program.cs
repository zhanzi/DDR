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

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();



// ���������֤����(WEB����Ҫ)
builder.Services.AddIdentity<ApplicationUser, ApplicationRole>(options => options.SignIn.RequireConfirmedAccount = true) // �޸Ĵ���
    .AddEntityFrameworkStores<TcpDbContext>()
    .AddDefaultTokenProviders(); // ��Ӵ���


builder.AddCoreService();
builder.AddTcpService();

builder.Services.AddOpenTelemetry()
    //.WithTracing(tracerProviderBuilder =>
    //{
    //    tracerProviderBuilder
    //        .AddSource("SlzrCrossGate.Tcp")  // ����Զ���Դ
    //        .SetResourceBuilder(ResourceBuilder.CreateDefault()
    //            .AddService("SlzrCrossGate.Tcp"))
    //        .AddAspNetCoreInstrumentation()
    //        .AddHttpClientInstrumentation();
    //})
    .WithMetrics(meterProviderBuilder =>
    {
        meterProviderBuilder
            .AddMeter("SlzrCrossGate.Tcp")  // ����Զ������Դ
            .AddAspNetCoreInstrumentation()
            .AddHttpClientInstrumentation();
    });


// ����Kestrelͬʱ����HTTP��TCP
builder.WebHost.ConfigureKestrel(kestrel =>
{
    // HTTP�˵㣨ԭ�����ñ�����
    kestrel.Listen(IPAddress.Any, 5000, listen =>
    {
        listen.Protocols = HttpProtocols.Http1AndHttp2;
    });

    // TCP�˵㣨�������ã�
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

// Ӧ�����ݿ�Ǩ��
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

Console.WriteLine("Console ��־");

app.Logger.LogInformation("Logger ��־");

app.Run();
