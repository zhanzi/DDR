using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using SlzrCrossGate.Core.Models;
using SlzrCrossGate.WebAdmin.Services;
using System.ComponentModel.DataAnnotations;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace SlzrCrossGate.WebAdmin.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly IConfiguration _configuration;
        private readonly TwoFactorAuthService _twoFactorAuthService;
        private readonly WechatAuthService _wechatAuthService;
        private readonly SystemSettingsService _settingsService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            IConfiguration configuration,
            TwoFactorAuthService twoFactorAuthService,
            WechatAuthService wechatAuthService,
            SystemSettingsService settingsService,
            ILogger<AuthController> logger)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _configuration = configuration;
            _twoFactorAuthService = twoFactorAuthService;
            _wechatAuthService = wechatAuthService;
            _settingsService = settingsService;
            _logger = logger;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            try
            {
                var user = await _userManager.FindByNameAsync(request.Username);

                if (user == null)
                {
                    return Unauthorized(new { message = "用户名或密码错误" });
                }

                var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, true);

                if (result.IsLockedOut)
                {
                    return Unauthorized(new { message = "账户已被锁定，请稍后再试" });
                }

                if (!result.Succeeded)
                {
                    return Unauthorized(new { message = "用户名或密码错误" });
                }

                // 获取系统设置
                var systemSettings = await _settingsService.GetSettingsAsync();

                // 检查是否需要双因素认证
                bool requireTwoFactor = await _settingsService.IsTwoFactorRequiredAsync(user);

                // 检查用户是否已启用双因素认证
                var isTwoFactorEnabled = await _userManager.GetTwoFactorEnabledAsync(user);

                // 如果系统设置禁用了双因素认证，或者用户不需要双因素认证，直接登录
                if (!systemSettings.EnableTwoFactorAuth || !requireTwoFactor)
                {
                    var token = await GenerateJwtToken(user, false);
                    return Ok(new { token, isTwoFactorEnabled });
                }

                // 如果用户已启用双因素认证
                if (isTwoFactorEnabled)
                {
                    // 用户已启用双因素认证，需要验证动态口令
                    // 生成临时令牌
                    var tempToken = await GenerateJwtToken(user, true);
                    return Ok(new
                    {
                        requireTwoFactor = true,
                        tempToken,
                        isTwoFactorEnabled = true
                    });
                }
                else
                {
                    // 用户未启用双因素认证，但系统或用户设置要求双因素认证，需要设置
                    var tempToken = await GenerateJwtToken(user, true);
                    return Ok(new
                    {
                        setupTwoFactor = true,
                        tempToken
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "登录过程中发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }



        [HttpPost("setup-two-factor")]
        public async Task<IActionResult> SetupTwoFactor()
        {
            try
            {
                _logger.LogInformation("开始设置双因素认证");

                // 检查Authorization头中的令牌
                string? authHeader = Request.Headers.Authorization.FirstOrDefault();
                string? tokenFromHeader = null;

                if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                {
                    tokenFromHeader = authHeader[7..].Trim();
                    if (!string.IsNullOrEmpty(tokenFromHeader))
                    {
                        _logger.LogInformation("从Authorization头中获取到令牌: {Token}",
                            tokenFromHeader.Length > 10 ? tokenFromHeader[..10] + "..." : tokenFromHeader);
                    }
                }

                if (string.IsNullOrEmpty(tokenFromHeader))
                {
                    _logger.LogWarning("未提供临时令牌");
                    return Unauthorized(new { message = "未提供临时令牌" });
                }

                // 从临时令牌中获取用户信息
                var principal = ValidateToken(tokenFromHeader);
                if (principal == null)
                {
                    _logger.LogWarning("临时令牌验证失败");
                    return Unauthorized(new { message = "临时令牌已过期或无效" });
                }

                // 检查令牌是否为临时令牌
                var isTemporary = principal.FindFirst("isTemporary")?.Value;
                if (isTemporary != "True")
                {
                    _logger.LogWarning("提供的令牌不是临时令牌");
                    return Unauthorized(new { message = "提供的令牌不是临时令牌" });
                }

                // 获取用户ID
                var userId = principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    _logger.LogWarning("令牌中未找到用户ID");
                    return Unauthorized(new { message = "令牌中未找到用户ID" });
                }

                _logger.LogInformation("从令牌中获取到用户ID: {UserId}", userId);

                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    _logger.LogWarning("未找到用户: {UserId}", userId);
                    return Unauthorized(new { message = "未找到用户" });
                }

                _logger.LogInformation("找到用户: {UserName}", user.UserName);

                try
                {
                    // 生成新的双因素认证密钥
                    var (secretKey, qrCodeUrl) = _twoFactorAuthService.GenerateNewTwoFactorSecretKey(user);
                    _logger.LogInformation("生成双因素认证密钥成功: {SecretKey}, {QrCodeUrl}", secretKey, qrCodeUrl);

                    // 保存密钥到用户的TwoFactorSecretKey中
                    user.TwoFactorSecretKey = secretKey;
                    var result = await _userManager.UpdateAsync(user);
                    if (result.Succeeded)
                    {
                        _logger.LogInformation("更新用户双因素认证密钥成功");
                    }
                    else
                    {
                        _logger.LogError("更新用户双因素认证密钥失败: {Errors}", string.Join(", ", result.Errors.Select(e => e.Description)));
                        return StatusCode(500, new { message = "保存双因素认证密钥失败" });
                    }

                    // 重新获取用户，确认密钥已保存
                    user = await _userManager.FindByIdAsync(userId);
                    if (user == null)
                    {
                        _logger.LogError("无法重新获取用户");
                        return StatusCode(500, new { message = "保存双因素认证密钥失败" });
                    }

                    if (string.IsNullOrEmpty(user.TwoFactorSecretKey))
                    {
                        _logger.LogError("保存后用户双因素认证密钥仍为空");
                        return StatusCode(500, new { message = "保存双因素认证密钥失败" });
                    }

                    _logger.LogInformation("确认用户双因素认证密钥已保存: {SecretKey}", user.TwoFactorSecretKey);

                    // 返回成功响应
                    return Ok(new
                    {
                        secretKey = secretKey,
                        qrCodeUrl = qrCodeUrl
                    });
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "生成或保存双因素认证密钥时发生错误");
                    return StatusCode(500, new { message = "生成或保存双因素认证密钥失败: " + ex.Message });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "设置双因素认证过程中发生错误");
                return StatusCode(500, new { message = "服务器内部错误: " + ex.Message });
            }
        }

        [HttpPost("confirm-two-factor")]
        public async Task<IActionResult> ConfirmTwoFactor([FromBody] ConfirmTwoFactorRequest request)
        {
            try
            {
                _logger.LogInformation("开始确认双因素认证设置");

                // 检查Authorization头中的令牌
                string? authHeader = Request.Headers.Authorization.FirstOrDefault();
                string? tokenFromHeader = null;

                if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                {
                    tokenFromHeader = authHeader[7..].Trim();
                    if (!string.IsNullOrEmpty(tokenFromHeader))
                    {
                        _logger.LogInformation("从Authorization头中获取到令牌: {Token}",
                            tokenFromHeader.Length > 10 ? tokenFromHeader[..10] + "..." : tokenFromHeader);
                    }
                }

                // 优先使用Authorization头中的令牌，如果没有则使用请求体中的令牌
                string? tokenToValidate = tokenFromHeader ?? request.TempToken;

                if (string.IsNullOrEmpty(tokenToValidate))
                {
                    _logger.LogWarning("未提供临时令牌");
                    return Unauthorized(new { message = "未提供临时令牌" });
                }

                // 从临时令牌中获取用户信息
                var principal = ValidateToken(tokenToValidate);
                if (principal == null)
                {
                    _logger.LogWarning("临时令牌验证失败");
                    return Unauthorized(new { message = "临时令牌已过期或无效" });
                }

                // 检查令牌是否为临时令牌
                var isTemporary = principal.FindFirst("isTemporary")?.Value;
                if (isTemporary != "True")
                {
                    _logger.LogWarning("提供的令牌不是临时令牌");
                    return Unauthorized(new { message = "提供的令牌不是临时令牌" });
                }

                // 获取用户ID
                var userId = principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    _logger.LogWarning("令牌中未找到用户ID");
                    return Unauthorized(new { message = "令牌中未找到用户ID" });
                }

                _logger.LogInformation("从令牌中获取到用户ID: {UserId}", userId);

                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    _logger.LogWarning("未找到用户: {UserId}", userId);
                    return Unauthorized(new { message = "未找到用户" });
                }

                _logger.LogInformation("找到用户: {UserName}", user.UserName);

                // 验证用户提供的验证码
                if (string.IsNullOrEmpty(user.TwoFactorSecretKey))
                {
                    _logger.LogWarning("用户未设置双因素认证密钥");
                    return BadRequest(new { message = "未找到双因素认证密钥，请重新开始设置过程" });
                }

                if (!_twoFactorAuthService.ValidateTwoFactorCode(user.TwoFactorSecretKey, request.Code))
                {
                    _logger.LogWarning("验证码无效");
                    return BadRequest(new { message = "验证码无效" });
                }

                _logger.LogInformation("验证码验证成功");

                // 启用双因素认证
                await _userManager.SetTwoFactorEnabledAsync(user, true);
                user.TwoFactorEnabledDate = DateTime.Now;
                await _userManager.UpdateAsync(user);
                _logger.LogInformation("双因素认证已启用");

                // 生成新的完整JWT令牌
                var token = await GenerateJwtToken(user, false);
                _logger.LogInformation("生成新的JWT令牌成功");

                return Ok(new
                {
                    token,
                    message = "双因素认证已成功启用"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "确认双因素认证设置过程中发生错误");
                return StatusCode(500, new { message = "服务器内部错误: " + ex.Message });
            }
        }

        [HttpPost("verify-code")]
        public async Task<IActionResult> VerifyCode([FromBody] VerifyCodeRequest request)
        {
            try
            {
                // 如果提供了用户名和验证码，使用用户名查找用户
                if (!string.IsNullOrEmpty(request.Username) && !string.IsNullOrEmpty(request.Code))
                {
                    var user = await _userManager.FindByNameAsync(request.Username);
                    if (user == null)
                    {
                        return Unauthorized(new { message = "用户名或验证码错误" });
                    }

                    // 验证TOTP动态口令
                    if (!await _twoFactorAuthService.ValidateAndUpdateFailedAttempts(user, request.Code))
                    {
                        return Unauthorized(new { message = "用户名或验证码错误" });
                    }

                    // 生成JWT令牌
                    var token = await GenerateJwtToken(user, false);
                    var isTwoFactorEnabled = await _userManager.GetTwoFactorEnabledAsync(user);

                    return Ok(new { token, isTwoFactorEnabled });
                }
                // 如果提供了临时令牌和验证码，使用临时令牌查找用户
                else if (!string.IsNullOrEmpty(request.TempToken) && !string.IsNullOrEmpty(request.Code))
                {
                    // 从临时令牌中获取用户信息
                    var principal = ValidateToken(request.TempToken);
                    if (principal == null)
                    {
                        _logger.LogWarning("临时令牌验证失败");
                        return Unauthorized(new { message = "临时令牌已过期或无效" });
                    }

                    // 检查令牌是否为临时令牌
                    var isTemporary = principal.FindFirst("isTemporary")?.Value;
                    if (isTemporary != "True")
                    {
                        _logger.LogWarning("提供的令牌不是临时令牌");
                        return Unauthorized(new { message = "提供的令牌不是临时令牌" });
                    }

                    // 获取用户ID
                    var userId = principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
                    if (string.IsNullOrEmpty(userId))
                    {
                        _logger.LogWarning("令牌中未找到用户ID");
                        return Unauthorized(new { message = "令牌中未找到用户ID" });
                    }

                    _logger.LogInformation("从令牌中获取到用户ID: {UserId}", userId);

                    var user = await _userManager.FindByIdAsync(userId);
                    if (user == null)
                    {
                        _logger.LogWarning("未找到用户: {UserId}", userId);
                        return Unauthorized(new { message = "未找到用户" });
                    }

                    _logger.LogInformation("找到用户: {UserName}", user.UserName);

                    // 验证双因素认证码
                    if (!await _twoFactorAuthService.ValidateAndUpdateFailedAttempts(user, request.Code))
                    {
                        _logger.LogWarning("验证码无效");
                        return BadRequest(new { message = "验证码无效" });
                    }

                    _logger.LogInformation("验证码验证成功");

                    // 生成新的完整JWT令牌
                    var token = await GenerateJwtToken(user, false);
                    var isTwoFactorEnabled = await _userManager.GetTwoFactorEnabledAsync(user);
                    _logger.LogInformation("生成新的JWT令牌成功");

                    return Ok(new { token, isTwoFactorEnabled });
                }
                else
                {
                    return BadRequest(new { message = "请提供用户名和验证码，或临时令牌和验证码" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "验证动态口令过程中发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }

        private ClaimsPrincipal? ValidateToken(string token)
        {
            try
            {
                _logger.LogInformation("开始验证令牌");

                // 尝试直接解析令牌，不进行验证，用于调试
                JwtSecurityToken? jwtToken = null;
                try
                {
                    var jwtTokenHandler = new JwtSecurityTokenHandler();
                    jwtToken = jwtTokenHandler.ReadJwtToken(token);

                    _logger.LogInformation("令牌解析成功，包含以下声明:");
                    foreach (var claim in jwtToken.Claims)
                    {
                        _logger.LogInformation("声明: {Type} = {Value}", claim.Type, claim.Value);
                    }

                    // 特别检查用户ID声明
                    var subClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Sub);
                    if (subClaim != null)
                    {
                        _logger.LogInformation("找到用户ID声明: {UserId}", subClaim.Value);
                    }
                    else
                    {
                        _logger.LogWarning("未找到用户ID声明");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "令牌解析失败");
                }

                // 正常验证流程
                var jwtKey = _configuration["Jwt:Key"] ?? "defaultKeyForDevelopment12345678901234567890";
                var key = Encoding.UTF8.GetBytes(jwtKey);
                var issuer = _configuration["Jwt:Issuer"] ?? "webadmin";
                var audience = _configuration["Jwt:Audience"] ?? "webadmin";

                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = true,
                    ValidIssuer = issuer,
                    ValidateAudience = true,
                    ValidAudience = audience,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero,
                    // 关键设置：确保JWT的sub声明被映射为JwtRegisteredClaimNames.Sub
                    NameClaimType = ClaimTypes.Name,
                    RoleClaimType = ClaimTypes.Role
                };

                var tokenHandler = new JwtSecurityTokenHandler();
                var principal = tokenHandler.ValidateToken(token, validationParameters, out var validatedToken);

                _logger.LogInformation("令牌验证成功");

                // 根本原因：JWT验证过程中，sub声明被映射为ClaimTypes.NameIdentifier
                // 解决方案：从原始令牌中提取sub声明，并确保它在principal中可用

                string? userId = null;

                // 首先尝试从验证后的principal中获取用户ID
                userId = principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;

                // 如果找不到，尝试从ClaimTypes.NameIdentifier获取（这是JWT库的默认映射）
                if (string.IsNullOrEmpty(userId))
                {
                    userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                    if (!string.IsNullOrEmpty(userId))
                    {
                        _logger.LogInformation("从ClaimTypes.NameIdentifier找到用户ID: {UserId}", userId);

                        // 将找到的用户ID添加为标准的Sub声明
                        if (principal.Identity is ClaimsIdentity identity)
                        {
                            identity.AddClaim(new Claim(JwtRegisteredClaimNames.Sub, userId));
                            _logger.LogInformation("已将ClaimTypes.NameIdentifier映射到JwtRegisteredClaimNames.Sub");
                        }
                    }
                }

                // 如果仍然找不到，尝试从原始令牌中获取
                if (string.IsNullOrEmpty(userId) && jwtToken != null)
                {
                    var subClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Sub || c.Type == "sub");
                    if (subClaim != null)
                    {
                        userId = subClaim.Value;
                        _logger.LogInformation("从原始令牌中提取用户ID: {UserId}", userId);

                        // 将找到的用户ID添加为标准的Sub声明
                        if (principal.Identity is ClaimsIdentity identity)
                        {
                            identity.AddClaim(new Claim(JwtRegisteredClaimNames.Sub, userId));
                            _logger.LogInformation("已将原始令牌中的sub声明添加到principal");
                        }
                    }
                }

                // 如果仍然找不到，记录所有可用的声明以便调试
                if (string.IsNullOrEmpty(userId))
                {
                    _logger.LogWarning("无法找到用户ID，列出所有可用声明:");
                    foreach (var claim in principal.Claims)
                    {
                        _logger.LogInformation("验证后的声明: {Type} = {Value}", claim.Type, claim.Value);
                    }
                }
                else
                {
                    _logger.LogInformation("成功找到用户ID: {UserId}", userId);
                }

                return principal;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "令牌验证失败: {Message}", ex.Message);
                return null;
            }
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            try
            {
                // 检查用户名是否已存在
                var existingUser = await _userManager.FindByNameAsync(request.Username);
                if (existingUser != null)
                {
                    return BadRequest(new { message = "用户名已存在" });
                }

                // 检查邮箱是否已存在
                var existingEmail = await _userManager.FindByEmailAsync(request.Email);
                if (existingEmail != null)
                {
                    return BadRequest(new { message = "邮箱已被注册" });
                }

                // 创建新用户
                var user = new ApplicationUser
                {
                    UserName = request.Username,
                    Email = request.Email,
                    RealName = request.RealName,
                    MerchantID = request.MerchantId
                };

                var result = await _userManager.CreateAsync(user, request.Password);

                if (!result.Succeeded)
                {
                    return BadRequest(new { message = result.Errors.First().Description });
                }

                // 分配默认角色
                await _userManager.AddToRoleAsync(user, "User");

                // 生成JWT令牌
                var token = await GenerateJwtToken(user,true);

                return Ok(new { token });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "注册过程中发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            try
            {
                var user = await _userManager.FindByEmailAsync(request.Email);
                if (user == null)
                {
                    // 不要透露用户不存在的信息
                    return Ok(new { message = "如果邮箱存在，重置密码链接已发送" });
                }

                // 生成密码重置令牌
                var token = await _userManager.GeneratePasswordResetTokenAsync(user);

                // TODO: 发送密码重置邮件
                // 这里应该调用邮件服务发送重置链接
                // 例如: await _emailService.SendPasswordResetEmail(user.Email, token);

                return Ok(new { message = "重置密码链接已发送到您的邮箱" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "忘记密码过程中发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }

        [HttpPost("reset-password")]
        [Authorize]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            try
            {
                var user = await _userManager.FindByEmailAsync(request.Email);
                if (user == null)
                {
                    return BadRequest(new { message = "无效的请求" });
                }

                // 检查是否是管理员重置密码的特殊标记
                if (request.Token == "admin-reset")
                {
                    // 检查当前用户是否有权限重置密码
                    var currentUser = await _userManager.GetUserAsync(User);
                    if (currentUser == null)
                    {
                        return Unauthorized(new { message = "未授权的操作" });
                    }

                    // 检查是否是系统管理员或商户管理员
                    var isSystemAdmin = await _userManager.IsInRoleAsync(currentUser, "SystemAdmin");
                    var isMerchantAdmin = await _userManager.IsInRoleAsync(currentUser, "MerchantAdmin");

                    if (!isSystemAdmin && !isMerchantAdmin)
                    {
                        return Forbid();
                    }

                    // 如果是商户管理员，只能重置自己商户的用户密码
                    if (isMerchantAdmin && !isSystemAdmin && user.MerchantID != currentUser.MerchantID)
                    {
                        return Forbid();
                    }

                    // 管理员重置密码流程
                    var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
                    var result = await _userManager.ResetPasswordAsync(user, resetToken, request.Password);

                    if (!result.Succeeded)
                    {
                        return BadRequest(new { message = result.Errors.First().Description });
                    }

                    _logger.LogInformation("管理员 {AdminName} 重置了用户 {UserName} 的密码", currentUser.UserName, user.UserName);
                    return Ok(new { message = "密码重置成功" });
                }
                else
                {
                    // 普通用户重置密码流程
                    // 检查当前用户是否是本人或管理员
                    var currentUser = await _userManager.GetUserAsync(User);
                    if (currentUser != null)
                    {
                        var isSystemAdmin = await _userManager.IsInRoleAsync(currentUser, "SystemAdmin");
                        var isMerchantAdmin = await _userManager.IsInRoleAsync(currentUser, "MerchantAdmin");
                        var isAdmin = isSystemAdmin || isMerchantAdmin;

                        // 如果不是管理员，只能重置自己的密码
                        if (!isAdmin && currentUser.Id != user.Id)
                        {
                            _logger.LogWarning("用户 {UserName} 尝试重置其他用户 {TargetUserName} 的密码", currentUser.UserName, user.UserName);
                            return Forbid();
                        }

                        // 如果是商户管理员，只能重置自己商户的用户密码
                        if (isMerchantAdmin && !isSystemAdmin && user.MerchantID != currentUser.MerchantID)
                        {
                            _logger.LogWarning("商户管理员 {AdminName} 尝试重置其他商户的用户 {UserName} 的密码", currentUser.UserName, user.UserName);
                            return Forbid();
                        }
                    }

                    var result = await _userManager.ResetPasswordAsync(user, request.Token, request.Password);

                    if (!result.Succeeded)
                    {
                        return BadRequest(new { message = result.Errors.First().Description });
                    }

                    _logger.LogInformation("用户 {Email} 的密码已重置", user.Email);
                    return Ok(new { message = "密码重置成功" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "重置密码过程中发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            try
            {
                // 获取当前用户
                var userId = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
                if (!string.IsNullOrEmpty(userId))
                {
                    var user = await _userManager.FindByIdAsync(userId);
                    if (user != null)
                    {
                        _logger.LogInformation("用户 {UserName} 退出登录", user.UserName);
                    }
                }

                // 在服务器端，我们不需要做太多事情，因为JWT是无状态的
                // 客户端会删除token

                return Ok(new { message = "退出成功" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "退出登录过程中发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }

        // 微信登录相关接口

        [HttpGet("wechat-login")]
        public async Task<IActionResult> GetWechatLoginQrCode()
        {
            try
            {
                // 检查系统设置是否启用微信登录
                var systemSettings = await _settingsService.GetSettingsAsync();
                if (!systemSettings.EnableWechatLogin)
                {
                    return BadRequest(new { message = "微信登录功能已被系统管理员禁用" });
                }

                // 创建微信登录会话
                var session = await _wechatAuthService.CreateLoginSessionAsync();

                return Ok(new
                {
                    loginId = session.LoginId,
                    qrCodeUrl = session.QrCodeUrl,
                    expiresAt = session.ExpiresAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取微信登录二维码时发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }

        [HttpGet("wechat-callback")]
        public async Task<IActionResult> WechatCallback([FromQuery] string code, [FromQuery] string state)
        {
            try
            {
                _logger.LogInformation("收到微信回调: code={Code}, state={State}", code, state);

                // 处理微信回调
                var session = await _wechatAuthService.HandleWechatCallbackAsync(code, state);
                if (session == null)
                {
                    return BadRequest(new { message = "处理微信回调失败" });
                }

                // 更新会话状态为已确认
                await _wechatAuthService.ConfirmLoginAsync(session.LoginId);

                // 返回成功页面
                return Content("<html><body><h1>微信登录成功</h1><p>请返回应用继续操作</p></body></html>", "text/html");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "处理微信回调时发生错误");
                return Content("<html><body><h1>微信登录失败</h1><p>请返回应用重试</p></body></html>", "text/html");
            }
        }

        [HttpGet("wechat-login-status")]
        public async Task<IActionResult> CheckWechatLoginStatus([FromQuery] string loginId)
        {
            try
            {
                // 检查系统设置是否启用微信登录
                var systemSettings = await _settingsService.GetSettingsAsync();
                if (!systemSettings.EnableWechatLogin)
                {
                    return BadRequest(new { message = "微信登录功能已被系统管理员禁用" });
                }

                if (string.IsNullOrEmpty(loginId))
                {
                    return BadRequest(new { message = "登录ID不能为空" });
                }

                // 获取登录会话
                var session = _wechatAuthService.GetLoginSession(loginId);
                if (session == null)
                {
                    return NotFound(new { message = "登录会话不存在" });
                }

                // 返回会话状态
                switch (session.Status)
                {
                    case WechatLoginStatus.Pending:
                        return Ok(new { status = "pending" });

                    case WechatLoginStatus.Scanned:
                        return Ok(new { status = "scanned" });

                    case WechatLoginStatus.Confirmed:
                        // 查找或创建用户
                        var user = await _userManager.Users.Where(u => u.WechatOpenId == session.OpenId).FirstOrDefaultAsync();
                        if (user == null)
                        {
                            return Ok(new { status = "unbound", openId = session.OpenId, unionId = session.UnionId, nickname = session.Nickname });
                        }

                        // 检查是否需要双因素认证
                        bool requireTwoFactor = await _settingsService.IsTwoFactorRequiredAsync(user);
                        var isTwoFactorEnabled = await _userManager.GetTwoFactorEnabledAsync(user);

                        // 如果需要双因素认证且用户已启用
                        if (requireTwoFactor && isTwoFactorEnabled)
                        {
                            // 生成临时令牌
                            var tempToken = await GenerateJwtToken(user, true);
                            return Ok(new
                            {
                                status = "require_two_factor",
                                tempToken,
                                isTwoFactorEnabled = true
                            });
                        }

                        // 生成JWT令牌
                        var token = await GenerateJwtToken(user, false);

                        return Ok(new
                        {
                            status = "success",
                            token,
                            isTwoFactorEnabled
                        });

                    case WechatLoginStatus.Expired:
                        return Ok(new { status = "expired" });

                    case WechatLoginStatus.Canceled:
                        return Ok(new { status = "canceled" });

                    default:
                        return Ok(new { status = "unknown" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "检查微信登录状态时发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }

        // 模拟微信扫码和确认（实际项目中由微信服务器回调）
        [HttpPost("wechat-mock-scan")]
        public async Task<IActionResult> MockWechatScan([FromBody] MockWechatScanRequest request)
        {
            try
            {
                var success = await _wechatAuthService.UpdateLoginSessionAsync(
                    request.LoginId,
                    request.OpenId,
                    request.UnionId ?? "",
                    request.Nickname);

                if (success)
                {
                    return Ok(new { message = "扫码成功" });
                }
                else
                {
                    return BadRequest(new { message = "扫码失败，会话可能已过期" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "模拟微信扫码时发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }

        [HttpPost("wechat-mock-confirm")]
        public async Task<IActionResult> MockWechatConfirm([FromBody] MockWechatConfirmRequest request)
        {
            try
            {
                var success = await _wechatAuthService.ConfirmLoginAsync(request.LoginId);

                if (success)
                {
                    return Ok(new { message = "确认成功" });
                }
                else
                {
                    return BadRequest(new { message = "确认失败，会话可能已过期或未扫码" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "模拟微信确认时发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }

        // 启用或禁用双因素认证
        [HttpPost("toggle-two-factor")]
        [Authorize]
        public async Task<IActionResult> ToggleTwoFactor([FromBody] ToggleTwoFactorRequest request)
        {
            try
            {
                // 获取当前用户
                var userId = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { message = "未找到用户ID" });
                }

                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    return Unauthorized(new { message = "未找到用户" });
                }

                // 检查是否需要强制双因素认证
                var systemSettings = await _settingsService.GetSettingsAsync();

                // 如果系统强制要求双因素认证，用户不能禁用
                if (systemSettings.ForceTwoFactorAuth && !request.Enable)
                {
                    return BadRequest(new { message = "系统设置要求所有用户必须启用双因素认证，无法禁用" });
                }

                // 如果用户被单独设置为需要双因素认证，用户不能禁用
                if (user.IsTwoFactorRequired && !request.Enable)
                {
                    return BadRequest(new { message = "您的账户被管理员设置为必须使用双因素认证，无法禁用" });
                }

                // 如果是禁用双因素认证
                if (!request.Enable)
                {
                    // 验证用户提供的验证码
                    if (string.IsNullOrEmpty(user.TwoFactorSecretKey))
                    {
                        return BadRequest(new { message = "未找到双因素认证密钥" });
                    }

                    if (string.IsNullOrEmpty(request.Code))
                    {
                        return BadRequest(new { message = "请提供验证码以确认身份" });
                    }

                    if (!_twoFactorAuthService.ValidateTwoFactorCode(user.TwoFactorSecretKey, request.Code))
                    {
                        return BadRequest(new { message = "验证码无效" });
                    }

                    // 禁用双因素认证
                    await _userManager.SetTwoFactorEnabledAsync(user, false);
                    user.TwoFactorEnabledDate = null;
                    await _userManager.UpdateAsync(user);

                    return Ok(new { message = "双因素认证已禁用", isTwoFactorEnabled = false });
                }
                else // 启用双因素认证
                {
                    // 如果用户已经启用了双因素认证
                    if (await _userManager.GetTwoFactorEnabledAsync(user))
                    {
                        return BadRequest(new { message = "双因素认证已经启用" });
                    }

                    // 如果用户没有设置双因素认证密钥，生成新的密钥
                    if (string.IsNullOrEmpty(user.TwoFactorSecretKey))
                    {
                        var (secretKey, qrCodeUrl) = _twoFactorAuthService.GenerateNewTwoFactorSecretKey(user);
                        user.TwoFactorSecretKey = secretKey;
                        await _userManager.UpdateAsync(user);

                        return Ok(new
                        {
                            message = "请使用验证器应用扫描二维码，然后使用confirm-two-factor接口确认设置",
                            secretKey = secretKey,
                            qrCodeUrl = qrCodeUrl,
                            isTwoFactorEnabled = false
                        });
                    }
                    else
                    {
                        // 如果用户已经有密钥，但需要重新启用
                        if (string.IsNullOrEmpty(request.Code))
                        {
                            // 如果没有提供验证码，返回密钥和二维码，让用户重新扫描
                            var (secretKey, qrCodeUrl) = _twoFactorAuthService.GenerateNewTwoFactorSecretKey(user);
                            user.TwoFactorSecretKey = secretKey;
                            await _userManager.UpdateAsync(user);

                            return Ok(new
                            {
                                message = "请使用验证器应用扫描二维码，然后使用confirm-two-factor接口确认设置",
                                secretKey = secretKey,
                                qrCodeUrl = qrCodeUrl,
                                isTwoFactorEnabled = false
                            });
                        }

                        if (!_twoFactorAuthService.ValidateTwoFactorCode(user.TwoFactorSecretKey, request.Code))
                        {
                            return BadRequest(new { message = "验证码无效" });
                        }

                        // 启用双因素认证
                        await _userManager.SetTwoFactorEnabledAsync(user, true);
                        user.TwoFactorEnabledDate = DateTime.Now;
                        await _userManager.UpdateAsync(user);

                        return Ok(new { message = "双因素认证已启用", isTwoFactorEnabled = true });
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "切换双因素认证状态时发生错误");
                return StatusCode(500, new { message = "服务器内部错误: " + ex.Message });
            }
        }

        // 绑定微信账号
        [HttpPost("bind-wechat")]
        [Authorize]
        public async Task<IActionResult> BindWechat([FromBody] BindWechatRequest request)
        {
            try
            {
                // 检查系统设置是否启用微信登录
                var systemSettings = await _settingsService.GetSettingsAsync();
                if (!systemSettings.EnableWechatLogin)
                {
                    return BadRequest(new { message = "微信登录功能已被系统管理员禁用" });
                }

                // 获取当前用户
                var userId = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { message = "未找到用户ID" });
                }

                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    return Unauthorized(new { message = "未找到用户" });
                }

                // 绑定微信账号
                var success = await _wechatAuthService.BindWechatToUserAsync(
                    user,
                    request.OpenId,
                    request.UnionId ?? "",
                    request.Nickname);

                if (success)
                {
                    return Ok(new { message = "微信账号绑定成功" });
                }
                else
                {
                    return BadRequest(new { message = "微信账号绑定失败，可能已被其他用户绑定" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "绑定微信账号时发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }

        // 解绑微信账号
        [HttpPost("unbind-wechat")]
        [Authorize]
        public async Task<IActionResult> UnbindWechat()
        {
            try
            {
                // 检查系统设置是否启用微信登录
                var systemSettings = await _settingsService.GetSettingsAsync();
                if (!systemSettings.EnableWechatLogin)
                {
                    return BadRequest(new { message = "微信登录功能已被系统管理员禁用" });
                }

                // 获取当前用户
                var userId = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { message = "未找到用户ID" });
                }

                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    return Unauthorized(new { message = "未找到用户" });
                }

                // 检查用户是否已绑定微信
                if (string.IsNullOrEmpty(user.WechatOpenId))
                {
                    return BadRequest(new { message = "用户未绑定微信账号" });
                }

                // 解绑微信账号
                var success = await _wechatAuthService.UnbindWechatFromUserAsync(user);

                if (success)
                {
                    return Ok(new { message = "微信账号解绑成功" });
                }
                else
                {
                    return BadRequest(new { message = "微信账号解绑失败" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "解绑微信账号时发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }

        // 获取当前用户的微信绑定状态
        [HttpGet("wechat-binding")]
        [Authorize]
        public async Task<IActionResult> GetWechatBinding()
        {
            try
            {
                // 检查系统设置是否启用微信登录
                var systemSettings = await _settingsService.GetSettingsAsync();

                // 获取当前用户
                var userId = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { message = "未找到用户ID" });
                }

                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    return Unauthorized(new { message = "未找到用户" });
                }

                // 返回微信绑定状态
                return Ok(new
                {
                    isBound = !string.IsNullOrEmpty(user.WechatOpenId),
                    wechatNickname = user.WechatNickname,
                    bindTime = user.WechatBindTime,
                    isWechatLoginEnabled = systemSettings.EnableWechatLogin
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取微信绑定状态时发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }

        // 修改 GenerateJwtToken 方法，添加临时令牌支持
        private async Task<string> GenerateJwtToken(ApplicationUser user, bool isTemporary)
        {
            var roles = await _userManager.GetRolesAsync(user);

            // 确保用户名不为空
            var userName = user.UserName ?? "unknown";

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id),
                new Claim(JwtRegisteredClaimNames.Name, userName),
                new Claim(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
                new Claim("realName", user.RealName ?? string.Empty),
                new Claim("merchantId", user.MerchantID ?? string.Empty),
                new Claim("isTemporary", isTemporary.ToString()),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var jwtKey = _configuration["Jwt:Key"] ?? "defaultKeyForDevelopment12345678901234567890";
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            // 临时令牌的有效期较短
            var expiresInHours = _configuration["Jwt:ExpiresInHours"] ?? "24";
            var expires = isTemporary
                ? DateTime.Now.AddMinutes(5)
                : DateTime.Now.AddHours(double.Parse(expiresInHours));

            var issuer = _configuration["Jwt:Issuer"] ?? "webadmin";
            var audience = _configuration["Jwt:Audience"] ?? "webadmin";

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: expires,
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public class LoginRequest
        {
            [Required]
            public string Username { get; set; } = string.Empty;

            [Required]
            public string Password { get; set; } = string.Empty;
        }

        public class RegisterRequest
        {
            [Required]
            public string Username { get; set; } = string.Empty;

            [Required]
            public string Email { get; set; } = string.Empty;

            [Required]
            public string Password { get; set; } = string.Empty;

            [Required]
            public string RealName { get; set; } = string.Empty;

            [Required]
            public string MerchantId { get; set; } = string.Empty;
        }

        public class ForgotPasswordRequest
        {
            [Required]
            public string Email { get; set; } = string.Empty;
        }

        public class ResetPasswordRequest
        {
            [Required]
            public string Email { get; set; } = string.Empty;

            [Required]
            public string Token { get; set; } = string.Empty;

            [Required]
            public string Password { get; set; } = string.Empty;
        }

        // 微信相关请求模型
        public class MockWechatScanRequest
        {
            [Required]
            public string LoginId { get; set; } = string.Empty;

            [Required]
            public string OpenId { get; set; } = string.Empty;

            public string? UnionId { get; set; }

            public string Nickname { get; set; } = string.Empty;
        }

        public class MockWechatConfirmRequest
        {
            [Required]
            public string LoginId { get; set; } = string.Empty;
        }

        public class BindWechatRequest
        {
            [Required]
            public string OpenId { get; set; } = string.Empty;

            public string? UnionId { get; set; }

            public string Nickname { get; set; } = string.Empty;
        }

        public class VerifyCodeRequest
        {
            public string? Username { get; set; }
            public string? TempToken { get; set; }

            [Required]
            [StringLength(6, MinimumLength = 6)]
            public string Code { get; set; } = string.Empty;
        }

        public class ConfirmTwoFactorRequest
        {
            [Required]
            [StringLength(6, MinimumLength = 6)]
            public string Code { get; set; } = string.Empty;

            // 可选，用于兼容旧版本
            public string? TempToken { get; set; }
        }

        public class VerifyTwoFactorRequest
        {
            [Required]
            public string TempToken { get; set; } = string.Empty;

            [Required]
            [StringLength(6, MinimumLength = 6)]
            public string Code { get; set; } = string.Empty;
        }

        public class SetupTwoFactorRequest
        {
            // 空类，因为我们现在从Authorization头中获取令牌
        }

        public class ToggleTwoFactorRequest
        {
            [Required]
            public bool Enable { get; set; }

            // 当禁用双因素认证或重新启用时需要提供验证码
            public string? Code { get; set; }
        }
    }
}
