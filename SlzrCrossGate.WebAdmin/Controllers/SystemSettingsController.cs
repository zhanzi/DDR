using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using SlzrCrossGate.Core.Models;
using SlzrCrossGate.WebAdmin.Services;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace SlzrCrossGate.WebAdmin.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "SystemAdmin")]
    public class SystemSettingsController : ControllerBase
    {
        private readonly SystemSettingsService _settingsService;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<SystemSettingsController> _logger;

        public SystemSettingsController(
            SystemSettingsService settingsService,
            UserManager<ApplicationUser> userManager,
            ILogger<SystemSettingsController> logger)
        {
            _settingsService = settingsService;
            _userManager = userManager;
            _logger = logger;
        }

        // GET: api/SystemSettings
        [HttpGet]
        public async Task<ActionResult<SystemSettings>> GetSettings()
        {
            try
            {
                var settings = await _settingsService.GetSettingsAsync();
                return Ok(settings);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取系统设置时发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }

        // PUT: api/SystemSettings
        [HttpPut]
        public async Task<ActionResult<SystemSettings>> UpdateSettings(SystemSettings settings)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var user = await _userManager.FindByIdAsync(userId);
                
                if (user == null)
                {
                    return Unauthorized(new { message = "未找到用户" });
                }
                
                var updatedSettings = await _settingsService.UpdateSettingsAsync(settings, user.UserName);
                return Ok(updatedSettings);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "更新系统设置时发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }
    }
}
