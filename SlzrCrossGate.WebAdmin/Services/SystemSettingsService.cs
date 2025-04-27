using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SlzrCrossGate.Core.Database;
using SlzrCrossGate.Core.Models;
using System;
using System.Threading.Tasks;

namespace SlzrCrossGate.WebAdmin.Services
{
    public class SystemSettingsService
    {
        private readonly TcpDbContext _context;
        private readonly ILogger<SystemSettingsService> _logger;
        private SystemSettings _cachedSettings;
        private DateTime _cacheTime = DateTime.MinValue;
        private readonly TimeSpan _cacheDuration = TimeSpan.FromMinutes(5);

        public SystemSettingsService(TcpDbContext context, ILogger<SystemSettingsService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// 获取系统设置，优先从缓存获取
        /// </summary>
        public async Task<SystemSettings> GetSettingsAsync()
        {
            // 如果缓存有效，直接返回缓存的设置
            if (_cachedSettings != null && DateTime.UtcNow - _cacheTime < _cacheDuration)
            {
                return _cachedSettings;
            }

            // 从数据库获取设置
            var settings = await _context.SystemSettings.FirstOrDefaultAsync();
            
            // 如果没有设置记录，创建默认设置
            if (settings == null)
            {
                settings = new SystemSettings
                {
                    EnableTwoFactorAuth = true,
                    ForceTwoFactorAuth = false,
                    EnableWechatLogin = true,
                    LastModified = DateTime.UtcNow,
                    LastModifiedBy = "System"
                };
                
                _context.SystemSettings.Add(settings);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Created default system settings");
            }
            
            // 更新缓存
            _cachedSettings = settings;
            _cacheTime = DateTime.UtcNow;
            
            return settings;
        }

        /// <summary>
        /// 更新系统设置
        /// </summary>
        public async Task<SystemSettings> UpdateSettingsAsync(SystemSettings settings, string userName)
        {
            var existingSettings = await _context.SystemSettings.FirstOrDefaultAsync();
            
            if (existingSettings == null)
            {
                // 如果没有设置记录，创建新记录
                settings.LastModified = DateTime.UtcNow;
                settings.LastModifiedBy = userName;
                _context.SystemSettings.Add(settings);
            }
            else
            {
                // 更新现有记录
                existingSettings.EnableTwoFactorAuth = settings.EnableTwoFactorAuth;
                existingSettings.ForceTwoFactorAuth = settings.ForceTwoFactorAuth;
                existingSettings.EnableWechatLogin = settings.EnableWechatLogin;
                existingSettings.LastModified = DateTime.UtcNow;
                existingSettings.LastModifiedBy = userName;
            }
            
            await _context.SaveChangesAsync();
            
            // 更新缓存
            _cachedSettings = existingSettings ?? settings;
            _cacheTime = DateTime.UtcNow;
            
            _logger.LogInformation("Updated system settings by {UserName}", userName);
            
            return _cachedSettings;
        }

        /// <summary>
        /// 检查是否需要双因素认证
        /// </summary>
        public async Task<bool> IsTwoFactorRequiredAsync(ApplicationUser user)
        {
            if (user == null)
            {
                return false;
            }

            var settings = await GetSettingsAsync();
            
            // 如果系统禁用了双因素认证，则不需要
            if (!settings.EnableTwoFactorAuth)
            {
                return false;
            }
            
            // 如果用户启用了双因素认证，则需要
            if (user.TwoFactorEnabled)
            {
                return true;
            }
            
            // 如果系统强制要求双因素认证，则需要
            if (settings.ForceTwoFactorAuth)
            {
                return true;
            }
            
            // 如果用户被单独设置为需要双因素认证，则需要
            if (user.IsTwoFactorRequired)
            {
                return true;
            }
            
            return false;
        }

        /// <summary>
        /// 检查是否启用微信登录
        /// </summary>
        public async Task<bool> IsWechatLoginEnabledAsync()
        {
            var settings = await GetSettingsAsync();
            return settings.EnableWechatLogin;
        }
    }
}
