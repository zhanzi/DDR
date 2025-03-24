using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace SlzrCrossGate.WebAdmin.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            //var user = await _userManager.FindByNameAsync(request.Username);

            //// 验证租户状态
            //if (user?.Tenant?.IsActive == false)
            //    return Unauthorized("租户已禁用");

            //var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, false);

            //if (result.Succeeded)
            //{
            //    var claims = new List<Claim>
            //    {
            //    new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            //    new Claim("tenant_id", user.TenantId?.ToString() ?? "system")
            //};

            //    var roles = await _userManager.GetRolesAsync(user);
            //    claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

            //    var token = new JwtSecurityToken(
            //        issuer: _config["Jwt:Issuer"],
            //        audience: _config["Jwt:Audience"],
            //        claims: claims,
            //        expires: DateTime.UtcNow.AddHours(2),
            //        signingCredentials: new SigningCredentials(
            //            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"])),
            //            SecurityAlgorithms.HmacSha256)
            //    );

            //    return Ok(new { Token = new JwtSecurityTokenHandler().WriteToken(token) });
            //}

            return Unauthorized();
        }
    }
}
