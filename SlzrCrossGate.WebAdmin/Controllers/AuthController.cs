using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using SlzrCrossGate.Core.Models;
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
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            IConfiguration configuration,
            ILogger<AuthController> logger)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _configuration = configuration;
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

                // 生成JWT令牌
                var token = await GenerateJwtToken(user);

                return Ok(new { token });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "登录过程中发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
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
                var token = await GenerateJwtToken(user);

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
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            try
            {
                var user = await _userManager.FindByEmailAsync(request.Email);
                if (user == null)
                {
                    return BadRequest(new { message = "无效的请求" });
                }

                var result = await _userManager.ResetPasswordAsync(user, request.Token, request.Password);

                if (!result.Succeeded)
                {
                    return BadRequest(new { message = result.Errors.First().Description });
                }

                return Ok(new { message = "密码重置成功" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "重置密码过程中发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }

        [HttpPost("verify-code")]
        public async Task<IActionResult> VerifyCode([FromBody] VerifyCodeRequest request)
        {
            try
            {
                var user = await _userManager.FindByNameAsync(request.Username);
                if (user == null)
                {
                    return Unauthorized(new { message = "用户名或验证码错误" });
                }

                // TODO: 验证TOTP动态口令
                // 这里应该调用TOTP验证服务验证动态口令
                // 例如: var isValid = _totpService.VerifyCode(user.Id, request.Code);
                var isValid = request.Code == "123456"; // 模拟验证，实际应使用TOTP验证

                if (!isValid)
                {
                    return Unauthorized(new { message = "用户名或验证码错误" });
                }

                // 生成JWT令牌
                var token = await GenerateJwtToken(user);

                return Ok(new { token });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "验证动态口令过程中发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }

        private async Task<string> GenerateJwtToken(ApplicationUser user)
        {
            var roles = await _userManager.GetRolesAsync(user);

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id),
                new Claim(JwtRegisteredClaimNames.Name, user.UserName),
                new Claim(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
                new Claim("realName", user.RealName ?? string.Empty),
                new Claim("merchantId", user.MerchantID ?? string.Empty),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            // 添加角色声明
            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
                _configuration["Jwt:Key"] ?? "defaultKeyForDevelopment12345678901234567890"));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var expires = DateTime.UtcNow.AddHours(
                double.Parse(_configuration["Jwt:ExpiresInHours"] ?? "24"));

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"] ?? "webadmin",
                audience: _configuration["Jwt:Audience"] ?? "webadmin",
                claims: claims,
                expires: expires,
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }

    public class LoginRequest
    {
        public string Username { get; set; }
        public string Password { get; set; }
    }

    public class RegisterRequest
    {
        public string Username { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public string RealName { get; set; }
        public string MerchantId { get; set; }
    }

    public class ForgotPasswordRequest
    {
        public string Email { get; set; }
    }

    public class ResetPasswordRequest
    {
        public string Email { get; set; }
        public string Token { get; set; }
        public string Password { get; set; }
    }

    public class VerifyCodeRequest
    {
        public string Username { get; set; }
        public string Code { get; set; }
    }
}
