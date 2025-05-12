using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SlzrCrossGate.Core.Database;
using SlzrCrossGate.Core.Models;
using System.ComponentModel.DataAnnotations;

namespace SlzrCrossGate.WebAdmin.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MerchantDictionaryController : ControllerBase
    {
        private readonly TcpDbContext _dbContext;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<MerchantDictionaryController> _logger;

        public MerchantDictionaryController(
            TcpDbContext dbContext, 
            UserManager<ApplicationUser> userManager, 
            ILogger<MerchantDictionaryController> logger)
        {
            _dbContext = dbContext;
            _userManager = userManager;
            _logger = logger;
        }

        // GET: api/MerchantDictionary
        [HttpGet]
        public async Task<ActionResult<IEnumerable<MerchantDictionaryDto>>> GetDictionaries(
            [FromQuery] string? merchantId,
            [FromQuery] string? dictionaryType,
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
                IQueryable<MerchantDictionary> query = _dbContext.MerchantDictionaries;

                // 如果不是系统管理员，只能查看自己商户
                if (!isSystemAdmin && !string.IsNullOrEmpty(currentUser.MerchantID))
                {
                    query = query.Where(d => d.MerchantID == currentUser.MerchantID);
                }

                // 按商户ID筛选
                if (!string.IsNullOrEmpty(merchantId))
                {
                    query = query.Where(d => d.MerchantID == merchantId);
                }

                // 按字典类型筛选
                if (!string.IsNullOrEmpty(dictionaryType))
                {
                    query = query.Where(d => d.DictionaryType == dictionaryType);
                }                // 搜索条件
                if (!string.IsNullOrEmpty(search))
                {
                    query = query.Where(d =>
                        d.DictionaryCode.Contains(search) ||
                        d.DictionaryType.Contains(search) ||
                        d.DictionaryValue!.Contains(search) ||
                        d.DictionaryLabel!.Contains(search) ||
                        d.Description!.Contains(search));
                }

                // 计算总数
                var totalCount = await query.CountAsync();                // 分页和排序
                var dictionaries = await query
                    .OrderBy(d => d.MerchantID)
                    .ThenBy(d => d.DictionaryType)
                    .ThenBy(d => d.SortOrder)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(d => new MerchantDictionaryDto
                    {
                        ID = d.ID,
                        MerchantID = d.MerchantID,
                        DictionaryType = d.DictionaryType,
                        DictionaryCode = d.DictionaryCode,
                        DictionaryLabel = d.DictionaryLabel,
                        DictionaryValue = d.DictionaryValue,
                        ExtraValue1 = d.ExtraValue1,
                        ExtraValue2 = d.ExtraValue2,
                        SortOrder = d.SortOrder,
                        IsActive = d.IsActive,
                        Description = d.Description,
                        CreateTime = d.CreateTime,
                        UpdateTime = d.UpdateTime,
                        Creator = d.Creator,
                        Updater = d.Updater
                    })
                    .ToListAsync();

                // 获取商户名称
                var merchantIds = dictionaries.Select(d => d.MerchantID).Distinct().ToList();
                var merchants = await _dbContext.Merchants
                    .Where(m => merchantIds.Contains(m.MerchantID))
                    .ToDictionaryAsync(m => m.MerchantID, m => m.Name ?? m.MerchantID);

                // 为每个字典项添加商户名称
                foreach (var dictionary in dictionaries)
                {
                    if (merchants.TryGetValue(dictionary.MerchantID, out var merchantName))
                    {
                        dictionary.MerchantName = merchantName;
                    }
                    else
                    {
                        dictionary.MerchantName = dictionary.MerchantID;
                    }
                }

                // 设置分页响应头
                Response.Headers.Append("X-Total-Count", totalCount.ToString());
                Response.Headers.Append("X-Total-Pages", Math.Ceiling((double)totalCount / pageSize).ToString());

                return dictionaries;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取商户字典列表时发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }

        // GET: api/MerchantDictionary/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<MerchantDictionaryDto>> GetDictionary(int id)
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

                // 查询字典
                var dictionary = await _dbContext.MerchantDictionaries.FindAsync(id);
                if (dictionary == null)
                {
                    return NotFound(new { message = "字典不存在" });
                }

                // 权限检查
                if (!isSystemAdmin && currentUser.MerchantID != dictionary.MerchantID)
                {
                    return Forbid();
                }

                // 获取商户名称
                var merchant = await _dbContext.Merchants.FindAsync(dictionary.MerchantID);
                var merchantName = merchant?.Name ?? dictionary.MerchantID;                var dictionaryDto = new MerchantDictionaryDto
                {
                    ID = dictionary.ID,
                    MerchantID = dictionary.MerchantID,
                    MerchantName = merchantName,
                    DictionaryType = dictionary.DictionaryType,
                    DictionaryCode = dictionary.DictionaryCode,
                    DictionaryLabel = dictionary.DictionaryLabel,
                    DictionaryValue = dictionary.DictionaryValue,
                    ExtraValue1 = dictionary.ExtraValue1,
                    ExtraValue2 = dictionary.ExtraValue2,
                    SortOrder = dictionary.SortOrder,
                    IsActive = dictionary.IsActive,
                    Description = dictionary.Description,
                    CreateTime = dictionary.CreateTime,
                    UpdateTime = dictionary.UpdateTime,
                    Creator = dictionary.Creator,
                    Updater = dictionary.Updater
                };

                return dictionaryDto;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取商户字典详情时发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }

        // POST: api/MerchantDictionary
        [HttpPost]
        public async Task<ActionResult<MerchantDictionaryDto>> CreateDictionary([FromBody] CreateMerchantDictionaryDto createDto)
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

                if (!isSystemAdmin && !isMerchantAdmin)
                {
                    return Forbid();
                }

                // 如果非系统管理员，只能添加自己商户的字典
                if (!isSystemAdmin && currentUser.MerchantID != createDto.MerchantID)
                {
                    return Forbid();
                }

                // 检查商户是否存在
                var merchant = await _dbContext.Merchants.FindAsync(createDto.MerchantID);
                if (merchant == null)
                {
                    return BadRequest(new { message = "商户不存在" });
                }

                // 检查是否有相同的字典项
                var existingDictionary = await _dbContext.MerchantDictionaries
                    .Where(d => d.MerchantID == createDto.MerchantID && 
                           d.DictionaryType == createDto.DictionaryType && 
                           d.DictionaryCode == createDto.DictionaryCode)
                    .FirstOrDefaultAsync();

                if (existingDictionary != null)
                {
                    return BadRequest(new { message = "该商户下已存在相同类型和编码的字典项" });
                }                // 创建新字典项
                var dictionary = new MerchantDictionary
                {
                    MerchantID = createDto.MerchantID,
                    DictionaryType = createDto.DictionaryType,
                    DictionaryCode = createDto.DictionaryCode,
                    DictionaryLabel = createDto.DictionaryLabel,
                    DictionaryValue = createDto.DictionaryValue,
                    ExtraValue1 = createDto.ExtraValue1,
                    ExtraValue2 = createDto.ExtraValue2,
                    SortOrder = createDto.SortOrder,
                    IsActive = createDto.IsActive,
                    Description = createDto.Description,
                    CreateTime = DateTime.Now,
                    Creator = currentUser.UserName
                };

                _dbContext.MerchantDictionaries.Add(dictionary);
                await _dbContext.SaveChangesAsync();                // 返回创建后的字典信息
                var dictionaryDto = new MerchantDictionaryDto
                {
                    ID = dictionary.ID,
                    MerchantID = dictionary.MerchantID,
                    MerchantName = merchant.Name ?? dictionary.MerchantID,
                    DictionaryType = dictionary.DictionaryType,
                    DictionaryCode = dictionary.DictionaryCode,
                    DictionaryLabel = dictionary.DictionaryLabel,
                    DictionaryValue = dictionary.DictionaryValue,
                    ExtraValue1 = dictionary.ExtraValue1,
                    ExtraValue2 = dictionary.ExtraValue2,
                    SortOrder = dictionary.SortOrder,
                    IsActive = dictionary.IsActive,
                    Description = dictionary.Description,
                    CreateTime = dictionary.CreateTime,
                    UpdateTime = dictionary.UpdateTime,
                    Creator = dictionary.Creator,
                    Updater = dictionary.Updater
                };

                return CreatedAtAction(nameof(GetDictionary), new { id = dictionary.ID }, dictionaryDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "创建商户字典时发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }

        // PUT: api/MerchantDictionary/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDictionary(int id, [FromBody] UpdateMerchantDictionaryDto updateDto)
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

                if (!isSystemAdmin && !isMerchantAdmin)
                {
                    return Forbid();
                }

                // 查询字典
                var dictionary = await _dbContext.MerchantDictionaries.FindAsync(id);
                if (dictionary == null)
                {
                    return NotFound(new { message = "字典不存在" });
                }

                // 权限检查
                if (!isSystemAdmin && currentUser.MerchantID != dictionary.MerchantID)
                {
                    return Forbid();
                }

                // 如果更改了类型或编码，检查是否会与现有记录冲突
                if (updateDto.DictionaryType != dictionary.DictionaryType || 
                    updateDto.DictionaryCode != dictionary.DictionaryCode)
                {
                    var existingDictionary = await _dbContext.MerchantDictionaries
                        .Where(d => d.ID != id &&
                               d.MerchantID == dictionary.MerchantID &&
                               d.DictionaryType == updateDto.DictionaryType &&
                               d.DictionaryCode == updateDto.DictionaryCode)
                        .FirstOrDefaultAsync();

                    if (existingDictionary != null)
                    {
                        return BadRequest(new { message = "该商户下已存在相同类型和编码的字典项" });
                    }
                }                // 更新字典项
                dictionary.DictionaryType = updateDto.DictionaryType;
                dictionary.DictionaryCode = updateDto.DictionaryCode;
                dictionary.DictionaryLabel = updateDto.DictionaryLabel;
                dictionary.DictionaryValue = updateDto.DictionaryValue;
                dictionary.ExtraValue1 = updateDto.ExtraValue1;
                dictionary.ExtraValue2 = updateDto.ExtraValue2;
                dictionary.SortOrder = updateDto.SortOrder;
                dictionary.IsActive = updateDto.IsActive;
                dictionary.Description = updateDto.Description;
                dictionary.UpdateTime = DateTime.Now;
                dictionary.Updater = currentUser.UserName;

                await _dbContext.SaveChangesAsync();
                return Ok(new { message = "字典更新成功" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "更新商户字典时发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }

        // DELETE: api/MerchantDictionary/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDictionary(int id)
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

                if (!isSystemAdmin && !isMerchantAdmin)
                {
                    return Forbid();
                }

                // 查询字典
                var dictionary = await _dbContext.MerchantDictionaries.FindAsync(id);
                if (dictionary == null)
                {
                    return NotFound(new { message = "字典不存在" });
                }

                // 权限检查
                if (!isSystemAdmin && currentUser.MerchantID != dictionary.MerchantID)
                {
                    return Forbid();
                }

                _dbContext.MerchantDictionaries.Remove(dictionary);
                await _dbContext.SaveChangesAsync();

                return Ok(new { message = "字典删除成功" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "删除商户字典时发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }

        // GET: api/MerchantDictionary/Types
        [HttpGet("Types/{merchantId}")]
        public async Task<ActionResult<IEnumerable<string>>> GetDictionaryTypes(string merchantId)
        {
            try
            {
                // 获取当前用户
                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser == null)
                {
                    return Unauthorized();
                }
                var currentUserMerchantId = currentUser.MerchantID;

                // 检查是否是系统管理员
                var isSystemAdmin = User.IsInRole("SystemAdmin");

                // 如果不是系统管理员，只能查看自己商户的文件类型
                if (!isSystemAdmin &&  merchantId != currentUserMerchantId)
                {
                    return Forbid();
                }

                // 构建查询
                IQueryable<MerchantDictionary> query = _dbContext.MerchantDictionaries;
                if (!string.IsNullOrEmpty(merchantId))
                {
                    query = query.Where(d => d.MerchantID == merchantId);
                }
                // 获取所有字典类型
                var types = await query
                    .Select(d => d.DictionaryType)
                    .Distinct()
                    .OrderBy(t => t)
                    .ToListAsync();

                return types;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取字典类型列表时发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }

        // GET: api/MerchantDictionary/ByType
        [HttpGet("ByType")]
        public async Task<ActionResult<IEnumerable<MerchantDictionaryDto>>> GetDictionariesByType(
            [FromQuery] string merchantId,
            [FromQuery] string dictionaryType)
        {
            try
            {
                if (string.IsNullOrEmpty(merchantId) || string.IsNullOrEmpty(dictionaryType))
                {
                    return BadRequest(new { message = "商户ID和字典类型不能为空" });
                }

                // 获取当前用户
                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser == null)
                {
                    return Unauthorized();
                }

                // 检查是否是系统管理员
                var isSystemAdmin = await _userManager.IsInRoleAsync(currentUser, "SystemAdmin");

                // 如果不是系统管理员，只能查看自己商户
                if (!isSystemAdmin && currentUser.MerchantID != merchantId)
                {
                    return Forbid();
                }

                // 查询字典                
                var dictionaries = await _dbContext.MerchantDictionaries
                    .Where(d => d.MerchantID == merchantId && d.DictionaryType == dictionaryType)
                    .OrderBy(d => d.SortOrder)
                    .Select(d => new MerchantDictionaryDto
                    {
                        ID = d.ID,
                        MerchantID = d.MerchantID,
                        DictionaryType = d.DictionaryType,
                        DictionaryCode = d.DictionaryCode,
                        DictionaryLabel = d.DictionaryLabel,
                        DictionaryValue = d.DictionaryValue,
                        ExtraValue1 = d.ExtraValue1,
                        ExtraValue2 = d.ExtraValue2,
                        SortOrder = d.SortOrder,
                        IsActive = d.IsActive,
                        Description = d.Description,
                        CreateTime = d.CreateTime,
                        UpdateTime = d.UpdateTime,
                        Creator = d.Creator,
                        Updater = d.Updater
                    })
                    .ToListAsync();

                // 获取商户名称
                var merchant = await _dbContext.Merchants.FindAsync(merchantId);
                var merchantName = merchant?.Name ?? merchantId;

                // 为每个字典项添加商户名称
                foreach (var dictionary in dictionaries)
                {
                    dictionary.MerchantName = merchantName;
                }

                return dictionaries;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取指定类型的商户字典列表时发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }
    }    // DTO 类
    public class MerchantDictionaryDto
    {
        public int ID { get; set; }
        public required string MerchantID { get; set; }
        public string? MerchantName { get; set; }
        public required string DictionaryType { get; set; }
        public required string DictionaryCode { get; set; }
        public string? DictionaryLabel { get; set; }
        public string? DictionaryValue { get; set; }
        public string? ExtraValue1 { get; set; }
        public string? ExtraValue2 { get; set; }
        public int SortOrder { get; set; }
        public bool IsActive { get; set; }
        public string? Description { get; set; }
        public DateTime CreateTime { get; set; }
        public DateTime? UpdateTime { get; set; }
        public string? Creator { get; set; }
        public string? Updater { get; set; }
    }    public class CreateMerchantDictionaryDto
    {
        [Required(ErrorMessage = "商户ID不能为空")]
        [MaxLength(8, ErrorMessage = "商户ID最大长度为8")]
        public required string MerchantID { get; set; }

        [Required(ErrorMessage = "字典类型不能为空")]
        [MaxLength(50, ErrorMessage = "字典类型最大长度为50")]
        public required string DictionaryType { get; set; }

        [Required(ErrorMessage = "字典编码不能为空")]
        [MaxLength(50, ErrorMessage = "字典编码最大长度为50")]
        public required string DictionaryCode { get; set; }

        [MaxLength(50, ErrorMessage = "字典标签最大长度为50")]
        public string? DictionaryLabel { get; set; }

        [MaxLength(500, ErrorMessage = "字典值最大长度为500")]
        public string? DictionaryValue { get; set; }

        [MaxLength(500, ErrorMessage = "附加值1最大长度为500")]
        public string? ExtraValue1 { get; set; }

        [MaxLength(500, ErrorMessage = "附加值2最大长度为500")]
        public string? ExtraValue2 { get; set; }

        public int SortOrder { get; set; } = 0;
        public bool IsActive { get; set; } = true;

        [MaxLength(500, ErrorMessage = "描述最大长度为500")]
        public string? Description { get; set; }
    }    public class UpdateMerchantDictionaryDto
    {
        [Required(ErrorMessage = "字典类型不能为空")]
        [MaxLength(50, ErrorMessage = "字典类型最大长度为50")]
        public required string DictionaryType { get; set; }

        [Required(ErrorMessage = "字典编码不能为空")]
        [MaxLength(50, ErrorMessage = "字典编码最大长度为50")]
        public required string DictionaryCode { get; set; }

        [MaxLength(50, ErrorMessage = "字典标签最大长度为50")]
        public string? DictionaryLabel { get; set; }

        [MaxLength(500, ErrorMessage = "字典值最大长度为500")]
        public string? DictionaryValue { get; set; }

        [MaxLength(500, ErrorMessage = "附加值1最大长度为500")]
        public string? ExtraValue1 { get; set; }

        [MaxLength(500, ErrorMessage = "附加值2最大长度为500")]
        public string? ExtraValue2 { get; set; }

        public int SortOrder { get; set; } = 0;
        public bool IsActive { get; set; } = true;

        [MaxLength(500, ErrorMessage = "描述最大长度为500")]
        public string? Description { get; set; }
    }
}
