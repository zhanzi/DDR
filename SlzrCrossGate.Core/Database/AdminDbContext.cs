using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using SlzrCrossGate.Core.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace SlzrCrossGate.Core.Database
{
    //public class AdminDbContext : IdentityDbContext<ApplicationUser,ApplicationRole,string>
    //{
    //    public AdminDbContext(DbContextOptions<TcpDbContext> options) : base(options)
    //    {

    //    }


    //    public DbSet<ApplicationUser> ApplicationUsers { get; set; }
    //    public DbSet<ApplicationRole> ApplicationRoles { get; set; }

    //    protected override void OnModelCreating(ModelBuilder modelBuilder)
    //    {
    //        base.OnModelCreating(modelBuilder);

    //        // 配置租户隔离
    //        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
    //        {
    //            if (typeof(ITenantEntity).IsAssignableFrom(entityType.ClrType))
    //            {
    //                modelBuilder.Entity(entityType.ClrType)
    //                    .HasQueryFilter(GetTenantFilter(entityType.ClrType));
    //            }
    //        }
    //    }

    //    // 租户隔离过滤器, 仅查询当前租户的数据,管理员可以查看所有数据
    //    private LambdaExpression GetTenantFilter(Type entityType)
    //    {
    //        var parameter = Expression.Parameter(entityType, "e");

    //        //如果是管理员，不过滤
    //        if (IsAdmin) return Expression.Lambda(Expression.Constant(true), parameter);
      
    //        var property = Expression.Property(parameter, "MerchantID");

    //        //不存在租户ID的数据，不过滤
    //        if (property == null) return Expression.Lambda(Expression.Constant(true), parameter);

    //        var currentTenantId = Expression.Constant(CurrentTenantId);
    //        var condition = Expression.Equal(property, currentTenantId);
    //        return Expression.Lambda(condition, parameter);
            
    //    }
    //    public string CurrentTenantId { get; set; }
    //    public ApplicationUser CurrentUser { get; set; }

    //    public bool IsAdmin { get; set; } = false;
    //}
}
