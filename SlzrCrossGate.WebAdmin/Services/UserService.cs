using Microsoft.AspNetCore.Identity;
using Microsoft.Data.SqlClient;
using SlzrCrossGate.Core.Models;
using System.Security.Claims;

namespace SlzrCrossGate.WebAdmin.Services
{
    public class UserService
    {
        private readonly UserManager<ApplicationUser> _userManager;

        public UserService(UserManager<ApplicationUser> userManager)
        {
            _userManager = userManager;
        }

        public async Task<string?> GetUserMerchantIdAsync(ClaimsPrincipal user)
        {
            if (user == null)
            {
                return null; 
            }
            // 获取当前用户的商户ID
            var currentUser = await _userManager.GetUserAsync(user);
            if (currentUser == null)
            {
                return null; 
            }
            return currentUser.MerchantID;
        }
        public static string GetUserDisplayName(ClaimsPrincipal user)
        {
            return user.FindFirstValue("realName") 
                ?? user.FindFirstValue(ClaimTypes.Name)
                ?? "未知用户";
        }

        public static string GetUserName(ClaimsPrincipal user)
        {
            return user.FindFirstValue("name")??"";
        }
        
        public static string GetUserNameForOperator(ClaimsPrincipal user)
        {
            return  $"{GetUserDisplayName(user)}({GetUserName(user)})";
        }

        public static string GetUserMerchantID(ClaimsPrincipal user)
        {
            return user.FindFirstValue("merchantId") 
                ?? "";
        }


    }
}
