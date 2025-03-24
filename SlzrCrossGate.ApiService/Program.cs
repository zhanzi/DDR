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

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();


// ���� DbContext
var databaseProvider = builder.Configuration.GetValue<string>("DatabaseProvider");
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

switch (databaseProvider)
{
    case "SqlServer":
        builder.Services.AddDbContext<TcpDbContext>(options =>
            options.UseSqlServer(connectionString));
        break;
    case "MySql":
        builder.Services.AddDbContext<TcpDbContext>(options =>
            options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));
        break;
    //case "PostgreSql":
    //    builder.Services.AddDbContext<TcpDbContext>(options =>
    //        options.UseNpgsql(connectionString));
    //    break;
    default:
        throw new Exception("Unsupported database provider: " + databaseProvider);
}

builder.Services.AddIdentity<ApplicationUser, ApplicationRole>(options => options.SignIn.RequireConfirmedAccount = true) // �޸Ĵ���
    .AddEntityFrameworkStores<TcpDbContext>()
    .AddDefaultTokenProviders(); // ��Ӵ���

builder.AddTcpService();
builder.AddCoreService();

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
