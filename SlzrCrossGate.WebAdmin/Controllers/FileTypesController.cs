using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SlzrCrossGate.Core.Database;
using SlzrCrossGate.Core.Models;
using SlzrCrossGate.WebAdmin.DTOs;
using SlzrCrossGate.WebAdmin.Services;
using System.Security.Claims;

namespace SlzrCrossGate.WebAdmin.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class FileTypesController(TcpDbContext dbContext, UserService userService) : ControllerBase
    {
        private readonly TcpDbContext _dbContext = dbContext;
        private readonly UserService _userService = userService;

        // GET: api/FileTypes
        [HttpGet]
        public async Task<ActionResult<PaginatedResult<FileTypeDto>>> GetFileTypes(
            [FromQuery] string? merchantId = null,
            [FromQuery] string? code = null,
            [FromQuery] string? name = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            // 获取当前用户的商户ID
            var currentUserMerchantId = await _userService.GetUserMerchantIdAsync(User);
            var isSystemAdmin = User.IsInRole("SystemAdmin");

            // 如果不是系统管理员，只能查看自己商户的文件类型
            if (!isSystemAdmin && merchantId != null && merchantId != currentUserMerchantId)
            {
                return Forbid();
            }

            // 如果不是系统管理员且未指定商户ID，则使用当前用户的商户ID
            if (!isSystemAdmin && merchantId == null)
            {
                merchantId = currentUserMerchantId;
            }

            // 构建查询
            var query = from m in  _dbContext.FileTypes
                        join t in _dbContext.Merchants on m.MerchantID equals t.MerchantID 
                        select new
                        {
                            FileType = m,
                            MerchantName = t.Name
                        };

            // 应用筛选条件
            if (!string.IsNullOrEmpty(merchantId))
            {
                query = query.Where(t => t.FileType.MerchantID == merchantId);
            }

            if (!string.IsNullOrEmpty(code))
            {
                query = query.Where(t => t.FileType.ID.Contains(code));
            }

            if (!string.IsNullOrEmpty(name))
            {
                query = query.Where(t => t.FileType.Name != null && t.FileType.Name.Contains(name));
            }

            // 获取总记录数
            var count = await query.CountAsync();

            // 应用分页
            var fileTypes = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // 转换为DTO
            var fileTypeDtos = fileTypes.Select(t => new FileTypeDto
            {
                Code = t.FileType.ID,
                MerchantID = t.FileType.MerchantID,
                MerchantName = t.MerchantName,
                Name = t.FileType.Name,
                Remark = t.FileType.Description ?? string.Empty
            }).ToList();

            return new PaginatedResult<FileTypeDto>
            {
                Items = fileTypeDtos,
                TotalCount = count,
                Page = page,
                PageSize = pageSize
            };
        }

        // GET: api/FileTypes/5
        [HttpGet("{code}/{merchantId}")]
        public async Task<ActionResult<FileTypeDto>> GetFileType(string code, string merchantId)
        {
            // 获取当前用户的商户ID
            var currentUserMerchantId = await _userService.GetUserMerchantIdAsync(User);
            var isSystemAdmin = User.IsInRole("SystemAdmin");

            // 如果不是系统管理员，只能查看自己商户的文件类型
            if (!isSystemAdmin && merchantId != currentUserMerchantId)
            {
                return Forbid();
            }

            var fileType = await _dbContext.FileTypes
                .FirstOrDefaultAsync(t => t.ID == code && t.MerchantID == merchantId);

            if (fileType == null)
            {
                return NotFound();
            }

            return new FileTypeDto
            {
                Code = fileType.ID,
                MerchantID = fileType.MerchantID,
                Name = fileType.Name,
                Remark = fileType.Description ?? string.Empty
            };
        }

        // POST: api/FileTypes
        [HttpPost]
        public async Task<ActionResult<FileTypeDto>> CreateFileType(CreateFileTypeDto model)
        {
            // 获取当前用户的商户ID和用户名
            var currentUserMerchantId = await _userService.GetUserMerchantIdAsync(User);
            var isSystemAdmin = User.IsInRole("SystemAdmin");
            var username = User.FindFirstValue(ClaimTypes.Name);

            // 如果不是系统管理员，只能为自己的商户创建文件类型
            if (!isSystemAdmin && model.MerchantID != currentUserMerchantId)
            {
                return Forbid();
            }

            // 检查文件类型是否已存在
            var existingFileType = await _dbContext.FileTypes
                .FirstOrDefaultAsync(t => t.ID == model.Code && t.MerchantID == model.MerchantID);

            if (existingFileType != null)
            {
                return Conflict("文件类型已存在");
            }

            // 创建新文件类型
            var fileType = new FileType
            {
                ID = model.Code,
                MerchantID = model.MerchantID,
                Name = model.Name ?? string.Empty,
                Description = model.Remark
            };

            _dbContext.FileTypes.Add(fileType);
            await _dbContext.SaveChangesAsync();

            return CreatedAtAction(nameof(GetFileType), new { code = fileType.ID, merchantId = fileType.MerchantID }, new FileTypeDto
            {
                Code = fileType.ID,
                MerchantID = fileType.MerchantID,
                Name = fileType.Name,
                Remark = fileType.Description ?? string.Empty
            });
        }

        // PUT: api/FileTypes/5
        [HttpPut("{code}/{merchantId}")]
        public async Task<IActionResult> UpdateFileType(string code, string merchantId, UpdateFileTypeDto model)
        {
            // 获取当前用户的商户ID和用户名
            var currentUserMerchantId = await _userService.GetUserMerchantIdAsync(User);
            var isSystemAdmin = User.IsInRole("SystemAdmin");
            var username = User.FindFirstValue(ClaimTypes.Name);

            // 如果不是系统管理员，只能更新自己商户的文件类型
            if (!isSystemAdmin && merchantId != currentUserMerchantId)
            {
                return Forbid();
            }

            // 检查文件类型是否存在
            var fileType = await _dbContext.FileTypes
                .FirstOrDefaultAsync(t => t.ID == code && t.MerchantID == merchantId);

            if (fileType == null)
            {
                return NotFound();
            }

            // 更新文件类型
            fileType.Name = model.Name ?? string.Empty;
            fileType.Description = model.Remark;

            await _dbContext.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/FileTypes/5/00009998
        [HttpDelete("{code}/{merchantId}")]
        public async Task<IActionResult> DeleteFileType(string code, string merchantId)
        {
            // 获取当前用户的商户ID和用户名
            var currentUserMerchantId = await _userService.GetUserMerchantIdAsync(User);
            var isSystemAdmin = User.IsInRole("SystemAdmin");
            var username = User.FindFirstValue(ClaimTypes.Name);

            // 如果不是系统管理员，只能删除自己商户的文件类型
            if (!isSystemAdmin && merchantId != currentUserMerchantId)
            {
                return Forbid();
            }

            // 检查文件类型是否存在
            var fileType = await _dbContext.FileTypes
                .FirstOrDefaultAsync(t => t.ID == code && t.MerchantID == merchantId);

            if (fileType == null)
            {
                return NotFound();
            }

            // 检查是否有关联的文件版本
            var hasFileVersions = await _dbContext.FileVers
                .AnyAsync(v => v.FileTypeID == code && v.MerchantID == merchantId);

            if (hasFileVersions)
            {
                return BadRequest("无法删除已有文件版本的文件类型");
            }

            // 删除文件类型
            _dbContext.FileTypes.Remove(fileType);
            await _dbContext.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/FileTypes/all
        // 获取所有文件类型（不分页），用于下拉框等需要完整数据的场景
        [HttpGet("all")]
        public async Task<ActionResult<FileTypeListResult>> GetAllFileTypes([FromQuery] string? merchantId = null)
        {
            // 获取当前用户的商户ID
            var currentUserMerchantId = await _userService.GetUserMerchantIdAsync(User);
            var isSystemAdmin = User.IsInRole("SystemAdmin");

            // 如果不是系统管理员，只能查看自己商户的文件类型
            if (!isSystemAdmin && merchantId != null && merchantId != currentUserMerchantId)
            {
                return Forbid();
            }

            // 如果不是系统管理员且未指定商户ID，则使用当前用户的商户ID
            if (!isSystemAdmin && merchantId == null)
            {
                merchantId = currentUserMerchantId;
            }

            // 构建查询
            var query = _dbContext.FileTypes.AsQueryable();

            // 应用商户筛选条件
            if (!string.IsNullOrEmpty(merchantId))
            {
                query = query.Where(t => t.MerchantID == merchantId);
            }

            // 获取所有符合条件的文件类型
            var fileTypes = await query.ToListAsync();

            // 转换为DTO
            var fileTypeDtos = fileTypes.Select(t => new FileTypeDto
            {
                Code = t.ID,
                MerchantID = t.MerchantID,
                Name = t.Name,
                Remark = t.Description ?? string.Empty
            }).ToList();

            return new FileTypeListResult
            {
                Items = fileTypeDtos
            };
        }
    }

    // 新增用于返回不分页文件类型列表的结果类
    public class FileTypeListResult
    {
        public List<FileTypeDto> Items { get; set; } = new List<FileTypeDto>();
    }
}
