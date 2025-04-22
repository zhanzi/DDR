using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SlzrCrossGate.Core.Models;
using Microsoft.AspNetCore.Identity.UI.Services;
using SlzrCrossGate.Core.Database;  
using SlzrCrossGate.Core;
var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();



builder.AddCoreService();

builder.Services.AddIdentity<ApplicationUser, ApplicationRole>(options => options.SignIn.RequireConfirmedAccount = true) 
    .AddEntityFrameworkStores<TcpDbContext>()
    .AddDefaultTokenProviders(); 

//builder.Services.AddScoped<TenantService>();

var app = builder.Build();


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

app.UseAuthorization();

app.MapControllers();

app.Run();
