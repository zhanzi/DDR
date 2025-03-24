using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SlzrCrossGate.Core.Models;
using Microsoft.AspNetCore.Identity.UI.Services;
using SlzrCrossGate.Core.Database; // 添加此行

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();


//配置 DbContext
//var databaseProvider = builder.Configuration.GetValue<string>("DatabaseProvider");
//var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

//switch (databaseProvider)
//{
//    case "SqlServer":
//        builder.Services.AddDbContext<TcpDbContext>(options =>
//            options.UseSqlServer(connectionString));
//        break;
//    case "MySql":
//        builder.Services.AddDbContext<TcpDbContext>(options =>
//            options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));
//        break;
//    case "PostgreSql":
//        builder.Services.AddDbContext<TcpDbContext>(options =>
//            options.UseNpgsql(connectionString));
//        break;
//    default:
//        throw new Exception("Unsupported database provider: " + databaseProvider);
//}

//builder.Services.AddIdentity<ApplicationUser, ApplicationRole>(options => options.SignIn.RequireConfirmedAccount = true) // 修改此行
//    .AddEntityFrameworkStores<AdminDbContext>()
//    .AddDefaultTokenProviders(); // 添加此行

//builder.Services.AddScoped<TenantService>();

var app = builder.Build();

//// 调用 SeedData.Initialize 方法
//using (var scope = app.Services.CreateScope())
//{
//    var services = scope.ServiceProvider;
//    await SeedData.InitializeUser(services);
//}

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
//添加静态文件支持
app.UseStaticFiles();
app.UseRouting();

//配置跨域访问
app.UseCors();

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
