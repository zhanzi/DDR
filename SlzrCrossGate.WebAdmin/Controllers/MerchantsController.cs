using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SlzrCrossGate.Core.Database;
using SlzrCrossGate.Core.Models;
using System.Security.Claims;

namespace SlzrCrossGate.WebAdmin.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MerchantsController : ControllerBase
    {
        private readonly TcpDbContext _dbContext;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<MerchantsController> _logger;

        public MerchantsController(
            TcpDbContext dbContext,
            UserManager<ApplicationUser> userManager,
            ILogger<MerchantsController> logger)
        {
            _dbContext = dbContext;
            _userManager = userManager;
            _logger = logger;
        }

        // GET: api/merchants
        [HttpGet]
        public async Task<ActionResult<IEnumerable<MerchantDto>>> GetMerchants(
            [FromQuery] string? search,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
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
                IQueryable<Merchant> query = _dbContext.Merchants;

                // 如果不是系统管理员，只能查看自己商户
                if (!isSystemAdmin && !string.IsNullOrEmpty(currentUser.MerchantID))
                {
                    query = query.Where(m => m.MerchantID == currentUser.MerchantID);
                }

                // 搜索条件
                if (!string.IsNullOrEmpty(search))
                {
                    query = query.Where(m =>
                        m.MerchantID.Contains(search) ||
                        m.Name.Contains(search) ||
                        m.ContactName.Contains(search) ||
                        m.ContactPhone.Contains(search) ||
                        m.ContactEmail.Contains(search));
                }

                // 计算总数
                var totalCount = await query.CountAsync();

                // 分页
                var merchants = await query
                    .OrderBy(m => m.MerchantID)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                // 转换为DTO
                var merchantDtos = merchants.Select(m => new MerchantDto
                {
                    MerchantID = m.MerchantID,
                    Name = m.Name,
                    ContactName = m.ContactName,
                    ContactPhone = m.ContactPhone,
                    ContactEmail = m.ContactEmail,
                    Address = m.Address,
                    IsActive = m.IsActive,
                    CreatedTime = m.CreatedTime,
                    UpdatedTime = m.UpdatedTime
                }).ToList();

                // 返回结果
                return Ok(new
                {
                    TotalCount = totalCount,
                    PageSize = pageSize,
                    CurrentPage = page,
                    TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
                    Items = merchantDtos
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取商户列表时发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }

        // GET: api/merchants/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<MerchantDto>> GetMerchant(string id)
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

                // 如果不是系统管理员，只能查看自己商户
                if (!isSystemAdmin && currentUser.MerchantID != id)
                {
                    return Forbid();
                }

                // 获取商户
                var merchant = await _dbContext.Merchants.FindAsync(id);
                if (merchant == null)
                {
                    return NotFound(new { message = "商户不存在" });
                }

                // 返回商户信息
                return Ok(new MerchantDto
                {
                    MerchantID = merchant.MerchantID,
                    Name = merchant.Name,
                    ContactName = merchant.ContactName,
                    ContactPhone = merchant.ContactPhone,
                    ContactEmail = merchant.ContactEmail,
                    Address = merchant.Address,
                    IsActive = merchant.IsActive,
                    CreatedTime = merchant.CreatedTime,
                    UpdatedTime = merchant.UpdatedTime
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取商户详情时发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }

        // POST: api/merchants
        [HttpPost]
        [Authorize(Roles = "SystemAdmin")]
        public async Task<ActionResult<MerchantDto>> CreateMerchant([FromBody] CreateMerchantDto createMerchantDto)
        {
            try
            {
                // 检查商户ID是否已存在
                var existingMerchant = await _dbContext.Merchants.FindAsync(createMerchantDto.MerchantID);
                if (existingMerchant != null)
                {
                    return BadRequest(new { message = "商户ID已存在" });
                }

                // 创建新商户
                var merchant = new Merchant
                {
                    MerchantID = createMerchantDto.MerchantID,
                    Name = createMerchantDto.Name,
                    ContactName = createMerchantDto.ContactName,
                    ContactPhone = createMerchantDto.ContactPhone,
                    ContactEmail = createMerchantDto.ContactEmail,
                    Address = createMerchantDto.Address,
                    IsActive = createMerchantDto.IsActive,
                    CreatedTime = DateTime.UtcNow,
                    UpdatedTime = DateTime.UtcNow
                };

                _dbContext.Merchants.Add(merchant);
                await _dbContext.SaveChangesAsync();

                // 返回创建的商户信息
                return CreatedAtAction(nameof(GetMerchant), new { id = merchant.MerchantID }, new MerchantDto
                {
                    MerchantID = merchant.MerchantID,
                    Name = merchant.Name,
                    ContactName = merchant.ContactName,
                    ContactPhone = merchant.ContactPhone,
                    ContactEmail = merchant.ContactEmail,
                    Address = merchant.Address,
                    IsActive = merchant.IsActive,
                    CreatedTime = merchant.CreatedTime,
                    UpdatedTime = merchant.UpdatedTime
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "创建商户时发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }

        // PUT: api/merchants/{id}
        [HttpPut("{id}")]
        [Authorize(Roles = "SystemAdmin")]
        public async Task<IActionResult> UpdateMerchant(string id, [FromBody] UpdateMerchantDto updateMerchantDto)
        {
            try
            {
                // 获取商户
                var merchant = await _dbContext.Merchants.FindAsync(id);
                if (merchant == null)
                {
                    return NotFound(new { message = "商户不存在" });
                }

                // 更新商户信息
                merchant.Name = updateMerchantDto.Name;
                merchant.ContactName = updateMerchantDto.ContactName;
                merchant.ContactPhone = updateMerchantDto.ContactPhone;
                merchant.ContactEmail = updateMerchantDto.ContactEmail;
                merchant.Address = updateMerchantDto.Address;
                merchant.IsActive = updateMerchantDto.IsActive;
                merchant.UpdatedTime = DateTime.UtcNow;

                await _dbContext.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "更新商户时发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }

        // DELETE: api/merchants/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "SystemAdmin")]
        public async Task<IActionResult> DeleteMerchant(string id)
        {
            try
            {
                // 获取商户
                var merchant = await _dbContext.Merchants.FindAsync(id);
                if (merchant == null)
                {
                    return NotFound(new { message = "商户不存在" });
                }

                // 检查是否有用户关联到该商户
                var hasUsers = await _dbContext.Users.AnyAsync(u => u.MerchantID == id);
                if (hasUsers)
                {
                    return BadRequest(new { message = "该商户下存在用户，无法删除" });
                }

                // 检查是否有终端关联到该商户
                var hasTerminals = await _dbContext.Terminals.AnyAsync(t => t.MerchantID == id);
                if (hasTerminals)
                {
                    return BadRequest(new { message = "该商户下存在终端，无法删除" });
                }

                // 删除商户
                _dbContext.Merchants.Remove(merchant);
                await _dbContext.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "删除商户时发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }

        // GET: api/merchants/{id}/terminals
        [HttpGet("{id}/terminals")]
        public async Task<ActionResult<IEnumerable<TerminalDto>>> GetMerchantTerminals(
            string id,
            [FromQuery] string? search,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
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

                // 如果不是系统管理员，只能查看自己商户
                if (!isSystemAdmin && currentUser.MerchantID != id)
                {
                    return Forbid();
                }

                // 检查商户是否存在
                var merchant = await _dbContext.Merchants.FindAsync(id);
                if (merchant == null)
                {
                    return NotFound(new { message = "商户不存在" });
                }

                // 构建查询
                IQueryable<Terminal> query = _dbContext.Terminals.Where(t => t.MerchantID == id);

                // 搜索条件
                if (!string.IsNullOrEmpty(search))
                {
                    query = query.Where(t =>
                        t.TerminalID.Contains(search) ||
                        t.DeviceID.Contains(search) ||
                        t.DeviceNo.Contains(search) ||
                        t.LineNo.Contains(search));
                }

                // 计算总数
                var totalCount = await query.CountAsync();

                // 分页
                var terminals = await query
                    .OrderBy(t => t.TerminalID)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                // 转换为DTO
                var terminalDtos = terminals.Select(t => new TerminalDto
                {
                    TerminalID = t.TerminalID,
                    MerchantID = t.MerchantID,
                    DeviceID = t.DeviceID,
                    DeviceNo = t.DeviceNo,
                    LineNo = t.LineNo,
                    TerminalTypeID = t.TerminalTypeID,
                    IsActive = t.IsActive,
                    CreatedTime = t.CreatedTime,
                    UpdatedTime = t.UpdatedTime
                }).ToList();

                // 返回结果
                return Ok(new
                {
                    TotalCount = totalCount,
                    PageSize = pageSize,
                    CurrentPage = page,
                    TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
                    Items = terminalDtos
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取商户终端列表时发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }

        // GET: api/merchants/{id}/users
        [HttpGet("{id}/users")]
        [Authorize(Roles = "SystemAdmin,MerchantAdmin")]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetMerchantUsers(
            string id,
            [FromQuery] string? search,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
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

                // 如果不是系统管理员，只能查看自己商户
                if (!isSystemAdmin && currentUser.MerchantID != id)
                {
                    return Forbid();
                }

                // 检查商户是否存在
                var merchant = await _dbContext.Merchants.FindAsync(id);
                if (merchant == null)
                {
                    return NotFound(new { message = "商户不存在" });
                }

                // 构建查询
                IQueryable<ApplicationUser> query = _userManager.Users.Where(u => u.MerchantID == id);

                // 搜索条件
                if (!string.IsNullOrEmpty(search))
                {
                    query = query.Where(u =>
                        u.UserName.Contains(search) ||
                        u.Email.Contains(search) ||
                        u.RealName.Contains(search));
                }

                // 计算总数
                var totalCount = await query.CountAsync();

                // 分页
                var users = await query
                    .OrderBy(u => u.UserName)
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
                        UserName = user.UserName,
                        Email = user.Email,
                        RealName = user.RealName,
                        MerchantId = user.MerchantID,
                        Roles = roles.ToList(),
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
                _logger.LogError(ex, "获取商户用户列表时发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }

        // POST: api/merchants/{id}/activate
        [HttpPost("{id}/activate")]
        [Authorize(Roles = "SystemAdmin")]
        public async Task<IActionResult> ActivateMerchant(string id)
        {
            try
            {
                // 获取商户
                var merchant = await _dbContext.Merchants.FindAsync(id);
                if (merchant == null)
                {
                    return NotFound(new { message = "商户不存在" });
                }

                // 激活商户
                merchant.IsActive = true;
                merchant.UpdatedTime = DateTime.UtcNow;

                await _dbContext.SaveChangesAsync();

                return Ok(new { message = "商户已激活" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "激活商户时发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }

        // POST: api/merchants/{id}/deactivate
        [HttpPost("{id}/deactivate")]
        [Authorize(Roles = "SystemAdmin")]
        public async Task<IActionResult> DeactivateMerchant(string id)
        {
            try
            {
                // 获取商户
                var merchant = await _dbContext.Merchants.FindAsync(id);
                if (merchant == null)
                {
                    return NotFound(new { message = "商户不存在" });
                }

                // 停用商户
                merchant.IsActive = false;
                merchant.UpdatedTime = DateTime.UtcNow;

                await _dbContext.SaveChangesAsync();

                return Ok(new { message = "商户已停用" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "停用商户时发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }
    }

    // DTO 类
    public class MerchantDto
    {
        public string MerchantID { get; set; }
        public string Name { get; set; }
        public string ContactName { get; set; }
        public string ContactPhone { get; set; }
        public string ContactEmail { get; set; }
        public string Address { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedTime { get; set; }
        public DateTime UpdatedTime { get; set; }
    }

    public class CreateMerchantDto
    {
        public string MerchantID { get; set; }
        public string Name { get; set; }
        public string ContactName { get; set; }
        public string ContactPhone { get; set; }
        public string ContactEmail { get; set; }
        public string Address { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class UpdateMerchantDto
    {
        public string Name { get; set; }
        public string ContactName { get; set; }
        public string ContactPhone { get; set; }
        public string ContactEmail { get; set; }
        public string Address { get; set; }
        public bool IsActive { get; set; }
    }

    public class TerminalDto
    {
        public string TerminalID { get; set; }
        public string MerchantID { get; set; }
        public string DeviceID { get; set; }
        public string DeviceNo { get; set; }
        public string LineNo { get; set; }
        public string TerminalTypeID { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedTime { get; set; }
        public DateTime UpdatedTime { get; set; }
    }

    public class UserDto
    {
        public string Id { get; set; }
        public string UserName { get; set; }
        public string Email { get; set; }
        public string RealName { get; set; }
        public string MerchantId { get; set; }
        public List<string> Roles { get; set; }
        public bool EmailConfirmed { get; set; }
        public DateTimeOffset? LockoutEnd { get; set; }
    }
}
