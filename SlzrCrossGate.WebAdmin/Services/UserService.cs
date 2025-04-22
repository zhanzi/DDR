using Microsoft.AspNetCore.Identity;
using System.Security.Claims;

namespace SlzrCrossGate.WebAdmin.Services
{
    public class UserService
    {
        private readonly UserManager<IdentityUser> _userManager;

        public UserService(UserManager<IdentityUser> userManager)
        {
            _userManager = userManager;
        }

        public async Task<string?> GetUserMerchantIdAsync(ClaimsPrincipal user)
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return null;
            }

            var identityUser = await _userManager.FindByIdAsync(userId);
            if (identityUser == null)
            {
                return null;
            }

            // 假设商户ID存储在用户的MerchantId声明中
            var merchantIdClaim = await _userManager.GetClaimsAsync(identityUser);
            return merchantIdClaim.FirstOrDefault(c => c.Type == "MerchantId")?.Value;
        }
    }
}
