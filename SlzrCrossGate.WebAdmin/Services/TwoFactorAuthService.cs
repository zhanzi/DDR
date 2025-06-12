using Microsoft.AspNetCore.Identity;
using OtpNet;
using SlzrCrossGate.Core.Models;

public class TwoFactorAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ILogger<TwoFactorAuthService> _logger;

    public TwoFactorAuthService(
        UserManager<ApplicationUser> userManager,
        ILogger<TwoFactorAuthService> logger)
    {
        _userManager = userManager;
        _logger = logger;
    }

    public (string secretKey, string qrCodeUrl) GenerateNewTwoFactorSecretKey(ApplicationUser user)
    {
        // 生成新的密钥
        var secretKey = GenerateSecretKey();
        
        // 生成 TOTP URI (用于生成二维码)
        var companyName = "SlzrCrossGate";
        var totpUri = $"otpauth://totp/{companyName}:{user.UserName}?secret={secretKey}&issuer={companyName}";
        
        return (secretKey, totpUri);
    }

    private string GenerateSecretKey()
    {
        var key = new byte[20]; // 160 bits
        using (var rng = System.Security.Cryptography.RandomNumberGenerator.Create())
        {
            rng.GetBytes(key);
        }
        return Base32Encoding.ToString(key);
    }

    public bool ValidateTwoFactorCode(string secretKey, string code)
    {
        try
        {
            var totp = new Totp(Base32Encoding.ToBytes(secretKey));
            return totp.VerifyTotp(code, out _, new VerificationWindow(2, 2));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "验证双因素认证码时发生错误");
            return false;
        }
    }

    public async Task<bool> ValidateAndUpdateFailedAttempts(ApplicationUser user, string code)
    {
        if (string.IsNullOrEmpty(user.TwoFactorSecretKey))
        {
            return false;
        }

        var isValid = ValidateTwoFactorCode(user.TwoFactorSecretKey, code);

        if (!isValid)
        {
            user.FailedTwoFactorAttempts = (user.FailedTwoFactorAttempts ?? 0) + 1;
            user.LastFailedTwoFactorAttempt = DateTime.Now;
            
            // 如果失败次数过多，可以在这里添加锁定逻辑
            if (user.FailedTwoFactorAttempts >= 5)
            {
                await _userManager.SetLockoutEndDateAsync(user, DateTime.Now.AddMinutes(15));
            }
            
            await _userManager.UpdateAsync(user);
            return false;
        }

        // 重置失败计数
        if (user.FailedTwoFactorAttempts > 0)
        {
            user.FailedTwoFactorAttempts = 0;
            user.LastFailedTwoFactorAttempt = null;
            await _userManager.UpdateAsync(user);
        }

        return true;
    }
}
