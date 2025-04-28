using Microsoft.AspNetCore.Identity;
using SlzrCrossGate.Core.Database;
using SlzrCrossGate.Core.Models;

public class TenantService
{
    private readonly TcpDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public TenantService(TcpDbContext context, UserManager<ApplicationUser> userManager, IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _userManager = userManager;
        _httpContextAccessor = httpContextAccessor;
    }

    //public async Task SetCurrentTenantAsync()
    //{
    //    var httpContext = _httpContextAccessor.HttpContext;
    //    if (httpContext == null) return;

    //    var user = await _userManager.GetUserAsync(httpContext.User);
    //    if (user == null) return;
         
    //    _context.CurrentTenantId = user.MerchantID ?? "";
    //    _context.CurrentUser = user;
    //    _context.IsAdmin = _userManager.GetRolesAsync(user).Result.Contains("SystemAdmin");
         
    //}
}
