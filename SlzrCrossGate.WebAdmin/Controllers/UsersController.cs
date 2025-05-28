using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SlzrCrossGate.Core.Models;
using System.Security.Claims;

namespace SlzrCrossGate.WebAdmin.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<ApplicationRole> _roleManager;
        private readonly ILogger<UsersController> _logger;
        private readonly TwoFactorAuthService _twoFactorAuthService;

        public UsersController(
            UserManager<ApplicationUser> userManager,
            RoleManager<ApplicationRole> roleManager,
            TwoFactorAuthService twoFactorAuthService,
            ILogger<UsersController> logger)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _twoFactorAuthService = twoFactorAuthService;
            _logger = logger;
        }

        // GET: api/Users/CurrentUser
        [HttpGet("CurrentUser")]
        [Authorize]
        public async Task<ActionResult<UserDto>> GetCurrentUser()
        {
            try
            {
                // 获取当前用户
                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser == null)
                {
                    return Unauthorized(new { message = "未找到当前用户" });
                }

                // 获取用户角色
                var roles = await _userManager.GetRolesAsync(currentUser);

                // 返回用户信息
                return Ok(new UserDto
                {
                    Id = currentUser.Id,
                    UserName = currentUser.UserName ?? "",
                    Email = currentUser.Email ?? "",
                    RealName = currentUser.RealName ?? "",
                    MerchantId = currentUser.MerchantID ?? "",
                    Roles = roles.ToList(),
                    EmailConfirmed = currentUser.EmailConfirmed,
                    LockoutEnd = currentUser.LockoutEnd,
                    IsTwoFactorEnabled = currentUser.TwoFactorEnabled,
                    TwoFactorEnabled = currentUser.TwoFactorEnabled
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取当前用户信息时发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }

        // GET: api/users
        [HttpGet]
        [Authorize(Roles = "SystemAdmin,MerchantAdmin")]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetUsers([FromQuery] string? search,[FromQuery] string? merchantId, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                // 获取当前用户
                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser == null)
                {
                    return Unauthorized();
                }

                // 检查是否是系统管理员
                var isSystemAdmin = await _userManager.IsInRoleAsync(currentUser, "SystemAdmin");

                // 构建查询
                IQueryable<ApplicationUser> query = _userManager.Users;

                // 如果不是系统管理员，只能查看自己商户的用户
                if (!isSystemAdmin && !string.IsNullOrEmpty(currentUser.MerchantID))
                {
                    query = query.Where(u => u.MerchantID == currentUser.MerchantID);
                }
                // 如果指定了商户ID，则过滤
                if(isSystemAdmin && !string.IsNullOrEmpty(merchantId))
                {
                    query = query.Where(u => u.MerchantID == merchantId);
                }

                // 搜索条件
                if (!string.IsNullOrEmpty(search))
                {
                    query = query.Where(u =>
                        (u.UserName != null && u.UserName.Contains(search)) ||
                        (u.Email != null && u.Email.Contains(search)) ||
                        (u.RealName != null && u.RealName.Contains(search)));
                }

                // 计算总数
                var totalCount = await query.CountAsync();

                // 分页
                var users = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                // 转换为DTO
                var userDtos = new List<UserDto>();
                foreach (var user in users)
                {
                    var roles = await _userManager.GetRolesAsync(user);
                    userDtos.Add(new UserDto
                    {
                        Id = user.Id,
                        UserName = user.UserName ?? "",
                        Email = user.Email ?? "",
                        RealName = user.RealName ?? "",
                        MerchantId = user.MerchantID ?? "",
                        Roles = roles.ToList(),
                        EmailConfirmed = user.EmailConfirmed,
                        LockoutEnd = user.LockoutEnd,
                        IsTwoFactorEnabled = user.TwoFactorEnabled,
                        TwoFactorEnabled = user.TwoFactorEnabled
                    });
                }

                // 返回结果
                return Ok(new
                {
                    TotalCount = totalCount,
                    PageSize = pageSize,
                    CurrentPage = page,
                    TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
                    Items = userDtos
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取用户列表时发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }

        // GET: api/users/{id}
        [HttpGet("{id}")]
        [Authorize(Roles = "SystemAdmin,MerchantAdmin")]
        public async Task<ActionResult<UserDto>> GetUser(string id)
        {
            try
            {
                // 获取当前用户
                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser == null)
                {
                    return Unauthorized();
                }

                // 检查是否是系统管理员
                var isSystemAdmin = await _userManager.IsInRoleAsync(currentUser, "SystemAdmin");

                // 获取目标用户
                var user = await _userManager.FindByIdAsync(id);
                if (user == null)
                {
                    return NotFound(new { message = "用户不存在" });
                }

                // 如果不是系统管理员，只能查看自己商户的用户
                if (!isSystemAdmin && user.MerchantID != currentUser.MerchantID)
                {
                    return Forbid();
                }

                // 获取用户角色
                var roles = await _userManager.GetRolesAsync(user);

                // 返回用户信息
                return Ok(new UserDto
                {
                    Id = user.Id,
                    UserName = user.UserName ?? "",
                    Email = user.Email ?? "",
                    RealName = user.RealName ?? "",
                    MerchantId = user.MerchantID ?? "",
                    Roles = roles.ToList(),
                    EmailConfirmed = user.EmailConfirmed,
                    LockoutEnd = user.LockoutEnd,
                    IsTwoFactorEnabled = user.TwoFactorEnabled,
                    TwoFactorEnabled = user.TwoFactorEnabled // 添加兼容前端的属性
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取用户详情时发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }

        // POST: api/users
        [HttpPost]
        [Authorize(Roles = "SystemAdmin,MerchantAdmin")]
        public async Task<ActionResult<UserDto>> CreateUser([FromBody] CreateUserDto createUserDto)
        {
            try
            {
                // 获取当前用户
                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser == null)
                {
                    return Unauthorized();
                }

                // 检查是否是系统管理员
                var isSystemAdmin = await _userManager.IsInRoleAsync(currentUser, "SystemAdmin");

                // 如果不是系统管理员，只能创建自己商户的用户
                if (!isSystemAdmin && createUserDto.MerchantId != currentUser.MerchantID)
                {
                    return Forbid();
                }

                // 检查用户名是否已存在
                var existingUser = await _userManager.FindByNameAsync(createUserDto.UserName);
                if (existingUser != null)
                {
                    return BadRequest(new { message = "用户名已存在" });
                }

                // 检查邮箱是否已存在
                if (!string.IsNullOrEmpty(createUserDto.Email))
                {
                    var existingEmail = await _userManager.FindByEmailAsync(createUserDto.Email);
                    if (existingEmail != null)
                    {
                        return BadRequest(new { message = "邮箱已被注册" });
                    }
                }

                // 创建新用户
                var user = new ApplicationUser
                {
                    UserName = createUserDto.UserName,
                    Email = createUserDto.Email,
                    RealName = createUserDto.RealName,
                    MerchantID = createUserDto.MerchantId,
                    EmailConfirmed = true // 默认确认邮箱
                };

                var result = await _userManager.CreateAsync(user, createUserDto.Password);

                if (!result.Succeeded)
                {
                    return BadRequest(new { message = result.Errors.First().Description });
                }

                // 分配角色
                if (createUserDto.Roles != null && createUserDto.Roles.Any())
                {
                    // 如果不是系统管理员，不能分配SystemAdmin角色
                    if (!isSystemAdmin && createUserDto.Roles.Contains("SystemAdmin"))
                    {
                        return Forbid();
                    }

                    foreach (var role in createUserDto.Roles)
                    {
                        // 检查角色是否存在
                        if (await _roleManager.RoleExistsAsync(role))
                        {
                            await _userManager.AddToRoleAsync(user, role);
                        }
                    }
                }
                else
                {
                    // 默认分配User角色
                    await _userManager.AddToRoleAsync(user, "User");
                }

                // 获取用户角色
                var assignedRoles = await _userManager.GetRolesAsync(user);

                // 返回创建的用户信息
                return CreatedAtAction(nameof(GetUser), new { id = user.Id }, new UserDto
                {
                    Id = user.Id,
                    UserName = user.UserName,
                    Email = user.Email,
                    RealName = user.RealName,
                    MerchantId = user.MerchantID,
                    Roles = assignedRoles.ToList(),
                    EmailConfirmed = user.EmailConfirmed,
                    LockoutEnd = user.LockoutEnd,
                    IsTwoFactorEnabled = user.TwoFactorEnabled,
                    TwoFactorEnabled = user.TwoFactorEnabled
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "创建用户时发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }

        // PUT: api/users/{id}
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateUser(string id, [FromBody] UpdateUserDto updateUserDto)
        {
            try
            {
                // 获取当前用户
                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser == null)
                {
                    return Unauthorized();
                }

                // 检查是否是系统管理员或商户管理员
                var isSystemAdmin = await _userManager.IsInRoleAsync(currentUser, "SystemAdmin");
                var isMerchantAdmin = await _userManager.IsInRoleAsync(currentUser, "MerchantAdmin");
                var isAdmin = isSystemAdmin || isMerchantAdmin;

                // 获取目标用户
                var user = await _userManager.FindByIdAsync(id);
                if (user == null)
                {
                    return NotFound(new { message = "用户不存在" });
                }

                // 如果是普通用户，只能更新自己的信息
                if (!isAdmin && currentUser.Id != id)
                {
                    return Forbid();
                }

                // 如果是商户管理员，只能更新自己商户的用户
                if (isMerchantAdmin && !isSystemAdmin && user.MerchantID != currentUser.MerchantID)
                {
                    return Forbid();
                }

                // 更新用户信息
                if (!string.IsNullOrEmpty(updateUserDto.Email) && user.Email != updateUserDto.Email)
                {
                    // 检查邮箱是否已被其他用户使用
                    var existingEmail = await _userManager.FindByEmailAsync(updateUserDto.Email);
                    if (existingEmail != null && existingEmail.Id != id)
                    {
                        return BadRequest(new { message = "邮箱已被其他用户注册" });
                    }

                    user.Email = updateUserDto.Email;
                    user.EmailConfirmed = true; // 更新邮箱时默认确认
                }

                if (!string.IsNullOrEmpty(updateUserDto.RealName))
                {
                    user.RealName = updateUserDto.RealName;
                }

                // 只有管理员可以更改用户的商户ID
                if (isAdmin && !string.IsNullOrEmpty(updateUserDto.MerchantId))
                {
                    // 只有系统管理员可以随意更改商户ID
                    // 商户管理员只能将用户分配到自己的商户
                    if (isSystemAdmin || updateUserDto.MerchantId == currentUser.MerchantID)
                    {
                        user.MerchantID = updateUserDto.MerchantId;
                    }
                }

                // 更新用户
                var result = await _userManager.UpdateAsync(user);
                if (!result.Succeeded)
                {
                    return BadRequest(new { message = result.Errors.First().Description });
                }

                // 更新角色 - 只有管理员可以更新角色
                if (updateUserDto.Roles != null && isAdmin)
                {
                    // 获取当前角色
                    var currentRoles = await _userManager.GetRolesAsync(user);

                    // 如果不是系统管理员，不能分配或移除SystemAdmin角色
                    if (!isSystemAdmin)
                    {
                        if (updateUserDto.Roles.Contains("SystemAdmin") && !currentRoles.Contains("SystemAdmin"))
                        {
                            return Forbid();
                        }

                        if (!updateUserDto.Roles.Contains("SystemAdmin") && currentRoles.Contains("SystemAdmin"))
                        {
                            return Forbid();
                        }
                    }

                    // 移除当前角色
                    await _userManager.RemoveFromRolesAsync(user, currentRoles);

                    // 添加新角色
                    foreach (var role in updateUserDto.Roles)
                    {
                        // 检查角色是否存在
                        if (await _roleManager.RoleExistsAsync(role))
                        {
                            await _userManager.AddToRoleAsync(user, role);
                        }
                    }
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "更新用户时发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }

        // DELETE: api/users/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "SystemAdmin,MerchantAdmin")]
        public async Task<IActionResult> DeleteUser(string id)
        {
            try
            {
                // 获取当前用户
                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser == null)
                {
                    return Unauthorized();
                }

                // 检查是否是系统管理员
                var isSystemAdmin = await _userManager.IsInRoleAsync(currentUser, "SystemAdmin");

                // 获取目标用户
                var user = await _userManager.FindByIdAsync(id);
                if (user == null)
                {
                    return NotFound(new { message = "用户不存在" });
                }

                // 不能删除自己
                if (user.Id == currentUser.Id)
                {
                    return BadRequest(new { message = "不能删除当前登录用户" });
                }

                // 如果不是系统管理员，只能删除自己商户的用户
                if (!isSystemAdmin && user.MerchantID != currentUser.MerchantID)
                {
                    return Forbid();
                }

                // 检查目标用户是否是系统管理员
                var isTargetSystemAdmin = await _userManager.IsInRoleAsync(user, "SystemAdmin");

                // 只有系统管理员可以删除系统管理员
                if (isTargetSystemAdmin && !isSystemAdmin)
                {
                    return Forbid();
                }

                // 删除用户
                var result = await _userManager.DeleteAsync(user);
                if (!result.Succeeded)
                {
                    return BadRequest(new { message = result.Errors.First().Description });
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "删除用户时发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }

        // POST: api/users/{id}/reset-two-factor
        [HttpPost("{id}/reset-two-factor")]
        [Authorize(Roles = "SystemAdmin,MerchantAdmin")]
        public async Task<IActionResult> ResetTwoFactor(string id)
        {
            try
            {
                // 获取当前用户
                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser == null)
                {
                    return Unauthorized();
                }

                // 检查是否是系统管理员
                var isSystemAdmin = await _userManager.IsInRoleAsync(currentUser, "SystemAdmin");
                var isMerchantAdmin = await _userManager.IsInRoleAsync(currentUser, "MerchantAdmin");

                // 获取目标用户
                var user = await _userManager.FindByIdAsync(id);
                if (user == null)
                {
                    return NotFound(new { message = "用户不存在" });
                }

                // 如果不是系统管理员，只能重置自己商户的用户
                if (!isSystemAdmin && (user.MerchantID != currentUser.MerchantID || !isMerchantAdmin))
                {
                    return Forbid();
                }

                // 检查用户是否已启用双因素认证
                if (!user.TwoFactorEnabled)
                {
                    return BadRequest(new { message = "用户未启用双因素认证" });
                }

                // 重置双因素认证密钥
                user.TwoFactorSecretKey = null;

                // 禁用双因素认证
                await _userManager.SetTwoFactorEnabledAsync(user, false);
                user.TwoFactorEnabledDate = null;

                // 保存更改
                var result = await _userManager.UpdateAsync(user);
                if (!result.Succeeded)
                {
                    return BadRequest(new { message = result.Errors.First().Description });
                }

                _logger.LogInformation("管理员 {AdminId} 重置了用户 {UserId} 的双因素认证", currentUser.Id, user.Id);

                return Ok(new { message = "双因素认证已重置" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "重置双因素认证时发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }

        // POST: api/users/{id}/change-password
        [HttpPost("{id}/change-password")]
        [Authorize(Roles = "SystemAdmin,MerchantAdmin")]
        public async Task<IActionResult> ChangePassword(string id, [FromBody] ChangePasswordDto changePasswordDto)
        {
            try
            {
                // 获取当前用户
                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser == null)
                {
                    return Unauthorized();
                }

                // 检查是否是系统管理员
                var isSystemAdmin = await _userManager.IsInRoleAsync(currentUser, "SystemAdmin");

                // 获取目标用户
                var user = await _userManager.FindByIdAsync(id);
                if (user == null)
                {
                    return NotFound(new { message = "用户不存在" });
                }

                // 如果不是系统管理员，只能更改自己商户的用户密码
                if (!isSystemAdmin && user.MerchantID != currentUser.MerchantID)
                {
                    return Forbid();
                }

                // 如果是当前用户，需要验证旧密码
                if (user.Id == currentUser.Id)
                {
                    if (string.IsNullOrEmpty(changePasswordDto.CurrentPassword))
                    {
                        return BadRequest(new { message = "需要提供当前密码" });
                    }

                    var changePasswordResult = await _userManager.ChangePasswordAsync(
                        user,
                        changePasswordDto.CurrentPassword,
                        changePasswordDto.NewPassword);

                    if (!changePasswordResult.Succeeded)
                    {
                        return BadRequest(new { message = changePasswordResult.Errors.First().Description });
                    }
                }
                else
                {
                    // 管理员重置其他用户密码
                    var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
                    var resetPasswordResult = await _userManager.ResetPasswordAsync(
                        user,
                        resetToken,
                        changePasswordDto.NewPassword);

                    if (!resetPasswordResult.Succeeded)
                    {
                        return BadRequest(new { message = resetPasswordResult.Errors.First().Description });
                    }
                }

                return Ok(new { message = "密码已更改" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "更改密码时发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }

        // POST: api/users/{id}/lock
        [HttpPost("{id}/lock")]
        [Authorize(Roles = "SystemAdmin,MerchantAdmin")]
        public async Task<IActionResult> LockUser(string id, [FromBody] LockUserDto lockUserDto)
        {
            try
            {
                // 获取当前用户
                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser == null)
                {
                    return Unauthorized();
                }

                // 检查是否是系统管理员
                var isSystemAdmin = await _userManager.IsInRoleAsync(currentUser, "SystemAdmin");

                // 获取目标用户
                var user = await _userManager.FindByIdAsync(id);
                if (user == null)
                {
                    return NotFound(new { message = "用户不存在" });
                }

                // 不能锁定自己
                if (user.Id == currentUser.Id)
                {
                    return BadRequest(new { message = "不能锁定当前登录用户" });
                }

                // 如果不是系统管理员，只能锁定自己商户的用户
                if (!isSystemAdmin && user.MerchantID != currentUser.MerchantID)
                {
                    return Forbid();
                }

                // 检查目标用户是否是系统管理员
                var isTargetSystemAdmin = await _userManager.IsInRoleAsync(user, "SystemAdmin");

                // 只有系统管理员可以锁定系统管理员
                if (isTargetSystemAdmin && !isSystemAdmin)
                {
                    return Forbid();
                }

                // 锁定用户
                var lockoutEnd = lockUserDto.LockoutEnd.HasValue
                    ? new DateTimeOffset(lockUserDto.LockoutEnd.Value)
                    : DateTimeOffset.UtcNow.AddDays(30); // 默认锁定30天

                var result = await _userManager.SetLockoutEndDateAsync(user, lockoutEnd);
                if (!result.Succeeded)
                {
                    return BadRequest(new { message = result.Errors.First().Description });
                }

                return Ok(new { message = "用户已锁定" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "锁定用户时发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }

        // POST: api/users/{id}/unlock
        [HttpPost("{id}/unlock")]
        [Authorize(Roles = "SystemAdmin,MerchantAdmin")]
        public async Task<IActionResult> UnlockUser(string id)
        {
            try
            {
                // 获取当前用户
                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser == null)
                {
                    return Unauthorized();
                }

                // 检查是否是系统管理员
                var isSystemAdmin = await _userManager.IsInRoleAsync(currentUser, "SystemAdmin");

                // 获取目标用户
                var user = await _userManager.FindByIdAsync(id);
                if (user == null)
                {
                    return NotFound(new { message = "用户不存在" });
                }

                // 如果不是系统管理员，只能解锁自己商户的用户
                if (!isSystemAdmin && user.MerchantID != currentUser.MerchantID)
                {
                    return Forbid();
                }

                // 解锁用户
                var result = await _userManager.SetLockoutEndDateAsync(user, null);
                if (!result.Succeeded)
                {
                    return BadRequest(new { message = result.Errors.First().Description });
                }

                return Ok(new { message = "用户已解锁" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "解锁用户时发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }
    }

    // DTO 类
    public class UserDto
    {
        public string Id { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string RealName { get; set; } = string.Empty;
        public string MerchantId { get; set; } = string.Empty;
        public List<string> Roles { get; set; } = new List<string>();
        public bool EmailConfirmed { get; set; }
        public DateTimeOffset? LockoutEnd { get; set; }
        public bool IsTwoFactorEnabled { get; set; }
        public bool TwoFactorEnabled { get; set; } // 添加兼容前端的属性
    }

    public class CreateUserDto
    {
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string RealName { get; set; } = string.Empty;
        public string MerchantId { get; set; } = string.Empty;
        public List<string> Roles { get; set; } = new List<string>();
    }

    public class UpdateUserDto
    {
        public string? Email { get; set; }
        public string? RealName { get; set; }
        public string? MerchantId { get; set; }
        public List<string>? Roles { get; set; }
    }

    public class ChangePasswordDto
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }

    public class LockUserDto
    {
        public DateTime? LockoutEnd { get; set; }
    }
}
