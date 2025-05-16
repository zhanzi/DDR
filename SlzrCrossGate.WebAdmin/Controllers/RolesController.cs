using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SlzrCrossGate.Core.Models;
using SlzrCrossGate.WebAdmin.DTOs;

namespace SlzrCrossGate.WebAdmin.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RolesController(RoleManager<ApplicationRole> roleManager, UserManager<ApplicationUser> userManager, ILogger<RolesController> logger) : ControllerBase
    {
        private readonly RoleManager<ApplicationRole> _roleManager = roleManager;
        private readonly UserManager<ApplicationUser> _userManager = userManager;
        private readonly ILogger<RolesController> _logger = logger;

        // GET: api/roles
        [HttpGet]
        [Authorize(Roles = "SystemAdmin,MerchantAdmin")]
        public async Task<ActionResult<IEnumerable<RoleDto>>> GetRoles()
        {
            try
            {
                var isSystemAdmin = User.IsInRole("SystemAdmin");
                var roles = _roleManager.Roles.AsQueryable();
                if (!isSystemAdmin)
                {
                    // 如果不是系统管理员，则只获取非系统管理员角色
                    roles = roles.Where(r => r.IsSysAdmin == false);
                }

                var roleDtos = await roles.Select(r => new RoleDto
                {
                    Id = r.Id,
                    Name = r.Name ?? string.Empty,
                    IsSysAdmin = r.IsSysAdmin,
                    Description = r.NormalizedName ?? string.Empty // 使用NormalizedName作为描述，实际应该有专门的Description字段
                }).ToListAsync();

                return Ok(roleDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取角色列表时发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }

        // GET: api/roles/{id}
        [HttpGet("{id}")]
        [Authorize(Roles = "SystemAdmin")]
        public async Task<ActionResult<RoleDto>> GetRole(string id)
        {
            try
            {
                var role = await _roleManager.FindByIdAsync(id);
                if (role == null)
                {
                    return NotFound(new { message = "角色不存在" });
                }

                return Ok(new RoleDto
                {
                    Id = role.Id,
                    Name = role.Name ?? string.Empty,
                    IsSysAdmin = role.IsSysAdmin,
                    Description = role.NormalizedName ?? string.Empty // 使用NormalizedName作为描述，实际应该有专门的Description字段
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取角色详情时发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }

        // POST: api/roles
        [HttpPost]
        [Authorize(Roles = "SystemAdmin")]
        public async Task<ActionResult<RoleDto>> CreateRole([FromBody] CreateRoleDto createRoleDto)
        {
            try
            {
                // 检查角色名是否已存在
                var existingRole = await _roleManager.FindByNameAsync(createRoleDto.Name);
                if (existingRole != null)
                {
                    return BadRequest(new { message = "角色名已存在" });
                }

                // 创建新角色
                var role = new ApplicationRole
                {
                    Name = createRoleDto.Name,
                    IsSysAdmin = createRoleDto.IsSysAdmin
                };

                var result = await _roleManager.CreateAsync(role);
                if (!result.Succeeded)
                {
                    return BadRequest(new { message = result.Errors.First().Description });
                }

                return CreatedAtAction(nameof(GetRole), new { id = role.Id }, new RoleDto
                {
                    Id = role.Id,
                    Name = role.Name ?? string.Empty,
                    IsSysAdmin = role.IsSysAdmin,
                    Description = role.NormalizedName ?? string.Empty
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "创建角色时发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }

        // PUT: api/roles/{id}
        [HttpPut("{id}")]
        [Authorize(Roles = "SystemAdmin")]
        public async Task<IActionResult> UpdateRole(string id, [FromBody] UpdateRoleDto updateRoleDto)
        {
            try
            {
                var role = await _roleManager.FindByIdAsync(id);
                if (role == null)
                {
                    return NotFound(new { message = "角色不存在" });
                }

                // 检查是否是系统预定义角色
                if (IsSystemDefinedRole(role.Name))
                {
                    return BadRequest(new { message = "系统预定义角色不能修改" });
                }

                // 检查角色名是否已被其他角色使用
                if (!string.IsNullOrEmpty(updateRoleDto.Name) && role.Name != updateRoleDto.Name)
                {
                    var existingRole = await _roleManager.FindByNameAsync(updateRoleDto.Name);
                    if (existingRole != null && existingRole.Id != id)
                    {
                        return BadRequest(new { message = "角色名已被其他角色使用" });
                    }

                    role.Name = updateRoleDto.Name;
                }

                // 更新IsSysAdmin属性
                role.IsSysAdmin = updateRoleDto.IsSysAdmin;

                var result = await _roleManager.UpdateAsync(role);
                if (!result.Succeeded)
                {
                    return BadRequest(new { message = result.Errors.First().Description });
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "更新角色时发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }

        // DELETE: api/roles/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "SystemAdmin")]
        public async Task<IActionResult> DeleteRole(string id)
        {
            try
            {
                var role = await _roleManager.FindByIdAsync(id);
                if (role == null)
                {
                    return NotFound(new { message = "角色不存在" });
                }

                // 检查是否是系统预定义角色
                if (IsSystemDefinedRole(role.Name))
                {
                    return BadRequest(new { message = "系统预定义角色不能删除" });
                }

                // 检查是否有用户使用该角色
                var usersInRole = await _userManager.GetUsersInRoleAsync(role.Name ?? string.Empty);
                if (usersInRole.Any())
                {
                    return BadRequest(new { message = "该角色已被用户使用，无法删除" });
                }

                var result = await _roleManager.DeleteAsync(role);
                if (!result.Succeeded)
                {
                    return BadRequest(new { message = result.Errors.First().Description });
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "删除角色时发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }

        // GET: api/roles/{id}/users
        [HttpGet("{id}/users")]
        [Authorize(Roles = "SystemAdmin")]
        public async Task<ActionResult<IEnumerable<RoleUserDto>>> GetUsersInRole(string id, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                var role = await _roleManager.FindByIdAsync(id);
                if (role == null)
                {
                    return NotFound(new { message = "角色不存在" });
                }

                // 获取该角色的所有用户
                var usersInRole = await _userManager.GetUsersInRoleAsync(role.Name ?? string.Empty);

                // 计算总数
                var totalCount = usersInRole.Count;

                // 分页
                var pagedUsers = usersInRole
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToList();

                // 转换为DTO
                var userDtos = new List<RoleUserDto>();
                foreach (var user in pagedUsers)
                {
                    var roles = await _userManager.GetRolesAsync(user);
                    userDtos.Add(new RoleUserDto
                    {
                        Id = user.Id,
                        UserName = user.UserName ?? string.Empty,
                        Email = user.Email ?? string.Empty,
                        RealName = user.RealName ?? string.Empty,
                        MerchantId = user.MerchantID ?? string.Empty,
                        Roles = roles.ToList(), // 必须使用 ToList() 将 IList<string> 转换为 List<string>
                        EmailConfirmed = user.EmailConfirmed,
                        LockoutEnd = user.LockoutEnd
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
                _logger.LogError(ex, "获取角色用户列表时发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }

        [Authorize(Roles = "SystemAdmin")]
        // 判断是否是系统预定义角色
        private static bool IsSystemDefinedRole(string? roleName)
        {
            if (string.IsNullOrEmpty(roleName))
                return false;

            var systemRoles = new[] { "SystemAdmin", "MerchantAdmin", "User" };
            return systemRoles.Contains(roleName);
        }
    }


}
