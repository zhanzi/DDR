using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using SlzrCrossGate.Core.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SlzrCrossGate.Core.Database
{
    public static class SeedData
    {
        public static async Task InitializeUser(IServiceProvider serviceProvider)
        {
            var roleManager = serviceProvider.GetRequiredService<RoleManager<ApplicationRole>>();

            // 系统级角色
            var systemRoles = new List<ApplicationRole>
            {
                new() { Name = "SystemAdmin", IsSysAdmin = true},
                new() { Name = "MerchantAdmin", IsSysAdmin = false},
                new() { Name = "MerchantUser", IsSysAdmin = false}
            };

            foreach (var role in systemRoles)
            {
                if (role.Name != null && !await roleManager.RoleExistsAsync(role.Name))
                {
                    await roleManager.CreateAsync(role);
                }
            }

            // 系统管理员
            var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var admin = new ApplicationUser
            {
                UserName = "admin",
                RealName = "系统管理员",
                Email="zdsh@slzr-sz.com"
            };

            var existingAdmin = await userManager.FindByNameAsync(admin.UserName);
            if (existingAdmin == null)
            {
                var result = await userManager.CreateAsync(admin, "Slzr!123456");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(admin, "SystemAdmin");
                }
            }
        }
    }
}
