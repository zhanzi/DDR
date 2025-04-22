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
    public class FilePublishController(TcpDbContext dbContext, UserService userService) : ControllerBase
    {
        private readonly TcpDbContext _dbContext = dbContext;
        private readonly UserService _userService = userService;

        // GET: api/FilePublish
        [HttpGet]
        public async Task<ActionResult<PaginatedResult<FilePublishDto>>> GetFilePublishes(
            [FromQuery] string? merchantId = null,
            [FromQuery] string? fileTypeId = null,
            [FromQuery] string? filePara = null,
            [FromQuery] PublishTypeOption? publishType = null,
            [FromQuery] string? publishTarget = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            // 获取当前用户的商户ID
            var currentUserMerchantId = await _userService.GetUserMerchantIdAsync(User);
            var isSystemAdmin = User.IsInRole("SystemAdmin");

            // 如果不是系统管理员，只能查看自己商户的文件发布
            if (!isSystemAdmin && merchantId != null && merchantId != currentUserMerchantId)
            {
                return Forbid();
            }

            // 如果不是系统管理员且未指定商户ID，则使用当前用户的商户ID
            if (!isSystemAdmin && merchantId == null)
            {
                merchantId = currentUserMerchantId;
            }

            // 构建查询 - 使用联结查询代替导航属性
            var query = from filePublish in _dbContext.FilePublishs
                        join fileType in _dbContext.FileTypes
                            on new { TypeId = filePublish.FileTypeID, MerchantId = filePublish.MerchantID }
                            equals new { TypeId = fileType.ID, MerchantId = fileType.MerchantID }
                        select new { FilePublish = filePublish, FileTypeName = fileType.Name };

            // 应用筛选条件
            if (!string.IsNullOrEmpty(merchantId))
            {
                query = query.Where(p => p.FilePublish.MerchantID == merchantId);
            }

            if (!string.IsNullOrEmpty(fileTypeId))
            {
                query = query.Where(p => p.FilePublish.FileTypeID == fileTypeId);
            }

            if (!string.IsNullOrEmpty(filePara))
            {
                query = query.Where(p => p.FilePublish.FilePara == filePara);
            }

            if (publishType.HasValue)
            {
                query = query.Where(p => p.FilePublish.PublishType == publishType.Value);
            }

            if (!string.IsNullOrEmpty(publishTarget))
            {
                query = query.Where(p => p.FilePublish.PublishTarget.Contains(publishTarget));
            }

            // 获取总记录数
            var count = await query.CountAsync();

            // 应用分页和排序
            var filePublishes = await query
                .OrderByDescending(p => p.FilePublish.CreateTime)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // 转换为DTO
            var filePublishDtos = filePublishes.Select(p => new FilePublishDto
            {
                ID = p.FilePublish.ID,
                MerchantID = p.FilePublish.MerchantID,
                FileTypeID = p.FilePublish.FileTypeID,
                FilePara = p.FilePublish.FilePara,
                FileFullType = p.FilePublish.FileFullType,
                Ver = p.FilePublish.Ver,
                FileSize = p.FilePublish.FileSize,
                Crc = p.FilePublish.Crc,
                UploadFileID = string.Empty, // FilePublish 模型中没有 UploadFileID 属性
                PublishType = p.FilePublish.PublishType,
                PublishTarget = p.FilePublish.PublishTarget,
                CreateTime = p.FilePublish.CreateTime,
                Operator = p.FilePublish.Operator,
                FileTypeName = p.FileTypeName
            }).ToList();

            return new PaginatedResult<FilePublishDto>
            {
                Items = filePublishDtos,
                TotalCount = count,
                Page = page,
                PageSize = pageSize
            };
        }

        // GET: api/FilePublish/5
        [HttpGet("{id}")]
        public async Task<ActionResult<FilePublishDto>> GetFilePublish(int id)
        {
            // 获取当前用户的商户ID
            var currentUserMerchantId = await _userService.GetUserMerchantIdAsync(User);
            var isSystemAdmin = User.IsInRole("SystemAdmin");

            // 使用联结查询代替导航属性
            var result = await (from fp in _dbContext.FilePublishs
                               join ft in _dbContext.FileTypes
                                   on new { TypeId = fp.FileTypeID, MerchantId = fp.MerchantID }
                                   equals new { TypeId = ft.ID, MerchantId = ft.MerchantID }
                               where fp.ID == id
                               select new { FilePublish = fp, FileTypeName = ft.Name })
                              .FirstOrDefaultAsync();

            if (result == null)
            {
                return NotFound();
            }

            var filePublish = result.FilePublish;

            // 如果不是系统管理员，只能查看自己商户的文件发布
            if (!isSystemAdmin && filePublish.MerchantID != currentUserMerchantId)
            {
                return Forbid();
            }

            return new FilePublishDto
            {
                ID = filePublish.ID,
                MerchantID = filePublish.MerchantID,
                FileTypeID = filePublish.FileTypeID,
                FilePara = filePublish.FilePara,
                FileFullType = filePublish.FileFullType,
                Ver = filePublish.Ver,
                FileSize = filePublish.FileSize,
                Crc = filePublish.Crc,
                UploadFileID = string.Empty, // FilePublish 模型中没有 UploadFileID 属性
                PublishType = filePublish.PublishType,
                PublishTarget = filePublish.PublishTarget,
                CreateTime = filePublish.CreateTime,
                Operator = filePublish.Operator,
                FileTypeName = result.FileTypeName
            };
        }

        // POST: api/FilePublish
        [HttpPost]
        public async Task<ActionResult<FilePublishDto>> CreateFilePublish(CreateFilePublishDto model)
        {
            // 获取当前用户的商户ID和用户名
            var currentUserMerchantId = await _userService.GetUserMerchantIdAsync(User);
            var isSystemAdmin = User.IsInRole("SystemAdmin");
            var username = User.FindFirstValue(ClaimTypes.Name);

            // 如果不是系统管理员，只能为自己的商户发布文件
            if (!isSystemAdmin && model.MerchantID != currentUserMerchantId)
            {
                return Forbid();
            }

            // 检查文件版本是否存在 - 使用联结查询代替导航属性
            var fileVersionResult = await (from fv in _dbContext.FileVers
                                         join ft in _dbContext.FileTypes
                                             on new { TypeId = fv.FileTypeID, MerchantId = fv.MerchantID }
                                             equals new { TypeId = ft.ID, MerchantId = ft.MerchantID }
                                         where fv.ID == model.FileVersionId && !fv.IsDelete
                                         select new { FileVersion = fv, FileTypeName = ft.Name })
                                        .FirstOrDefaultAsync();

            var fileVersion = fileVersionResult?.FileVersion;

            if (fileVersion == null)
            {
                return BadRequest("文件版本不存在");
            }

            // 检查商户ID是否匹配
            if (fileVersion.MerchantID != model.MerchantID)
            {
                return BadRequest("文件版本不属于指定商户");
            }

            // 创建文件发布记录
            var filePublish = new FilePublish
            {
                MerchantID = model.MerchantID,
                FileTypeID = fileVersion.FileTypeID,
                FilePara = fileVersion.FilePara,
                FileFullType = fileVersion.FileFullType,
                Ver = fileVersion.Ver,
                FileSize = fileVersion.FileSize,
                Crc = fileVersion.Crc,
                //UploadFileID = fileVersion.UploadFileID,
                PublishType = model.PublishType,
                PublishTarget = model.PublishTarget,
                CreateTime = DateTime.Now,
                Operator = username
            };

            _dbContext.FilePublishs.Add(filePublish);


            await _dbContext.SaveChangesAsync();

            // 创建文件发布历史记录
            var filePublishHistory = new FilePublishHistory
            {
                MerchantID = model.MerchantID,
                // FilePublishHistory 模型中没有 FilePublishID 属性
                FileTypeID = fileVersion.FileTypeID,
                FilePara = fileVersion.FilePara,
                FileFullType = fileVersion.FileFullType,
                Ver = fileVersion.Ver,
                // FilePublishHistory 模型中没有 FileSize 属性
                // FilePublishHistory 模型中没有 Crc 属性
                // FilePublishHistory 模型中没有 UploadFileID 属性
                PublishType = model.PublishType,
                PublishTarget = model.PublishTarget,
                PublishTime = DateTime.Now, // 使用 PublishTime 代替 CreateTime
                Operator = username
            };

            _dbContext.FilePublishHistories.Add(filePublishHistory);
            await _dbContext.SaveChangesAsync();

            return CreatedAtAction(nameof(GetFilePublish), new { id = filePublish.ID }, new FilePublishDto
            {
                ID = filePublish.ID,
                MerchantID = filePublish.MerchantID,
                FileTypeID = filePublish.FileTypeID,
                FilePara = filePublish.FilePara,
                FileFullType = filePublish.FileFullType,
                Ver = filePublish.Ver,
                FileSize = filePublish.FileSize,
                Crc = filePublish.Crc,
                UploadFileID = string.Empty, // FilePublish 模型中没有 UploadFileID 属性
                PublishType = filePublish.PublishType,
                PublishTarget = filePublish.PublishTarget,
                CreateTime = filePublish.CreateTime,
                Operator = filePublish.Operator,
                FileTypeName = fileVersionResult?.FileTypeName
            });
        }

        // DELETE: api/FilePublish/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteFilePublish(int id)
        {
            // 获取当前用户的商户ID和用户名
            var currentUserMerchantId = await _userService.GetUserMerchantIdAsync(User);
            var isSystemAdmin = User.IsInRole("SystemAdmin");
            var username = User.FindFirstValue(ClaimTypes.Name);

            var filePublish = await _dbContext.FilePublishs
                .FirstOrDefaultAsync(p => p.ID == id);

            if (filePublish == null)
            {
                return NotFound();
            }

            // 如果不是系统管理员，只能删除自己商户的文件发布
            if (!isSystemAdmin && filePublish.MerchantID != currentUserMerchantId)
            {
                return Forbid();
            }

            // 删除文件发布记录
            _dbContext.FilePublishs.Remove(filePublish);

            // 创建文件发布历史记录（取消发布）
            var filePublishHistory = new FilePublishHistory
            {
                MerchantID = filePublish.MerchantID,
                // FilePublishHistory 模型中没有 FilePublishID 属性
                FileTypeID = filePublish.FileTypeID,
                FilePara = filePublish.FilePara,
                FileFullType = filePublish.FileFullType,
                Ver = filePublish.Ver,
                // FilePublishHistory 模型中没有 FileSize 属性
                // FilePublishHistory 模型中没有 Crc 属性
                // FilePublishHistory 模型中没有 UploadFileID 属性
                PublishType = filePublish.PublishType,
                PublishTarget = filePublish.PublishTarget,
                PublishTime = DateTime.Now, // 使用 PublishTime 代替 CreateTime
                Operator = username,
                Remark = "取消发布"
            };

            _dbContext.FilePublishHistories.Add(filePublishHistory);
            await _dbContext.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/FilePublish/History
        [HttpGet("History")]
        public async Task<ActionResult<PaginatedResult<FilePublishHistoryDto>>> GetFilePublishHistory(
            [FromQuery] string? merchantId = null,
            [FromQuery] string? fileTypeId = null,
            [FromQuery] string? filePara = null,
            [FromQuery] PublishTypeOption? publishType = null,
            [FromQuery] string? publishTarget = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            // 获取当前用户的商户ID
            var currentUserMerchantId = await _userService.GetUserMerchantIdAsync(User);
            var isSystemAdmin = User.IsInRole("SystemAdmin");

            // 如果不是系统管理员，只能查看自己商户的文件发布历史
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
            var query = _dbContext.FilePublishHistories
                .AsQueryable();

            // 应用筛选条件
            if (!string.IsNullOrEmpty(merchantId))
            {
                query = query.Where(p => p.MerchantID == merchantId);
            }

            if (!string.IsNullOrEmpty(fileTypeId))
            {
                query = query.Where(p => p.FileTypeID == fileTypeId);
            }

            if (!string.IsNullOrEmpty(filePara))
            {
                query = query.Where(p => p.FilePara == filePara);
            }

            if (publishType.HasValue)
            {
                query = query.Where(p => p.PublishType == publishType.Value);
            }

            if (!string.IsNullOrEmpty(publishTarget))
            {
                query = query.Where(p => p.PublishTarget.Contains(publishTarget));
            }

            // 获取总记录数
            var count = await query.CountAsync();

            // 应用分页和排序
            var filePublishHistories = await query
                .OrderByDescending(p => p.PublishTime) // 使用 PublishTime 代替 CreateTime
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // 转换为DTO
            var filePublishHistoryDtos = filePublishHistories.Select(p => new FilePublishHistoryDto
            {
                ID = p.ID,
                MerchantID = p.MerchantID,
                FilePublishID = 0, // 注意：FilePublishHistory 模型中没有 FilePublishID 属性
                FileTypeID = p.FileTypeID,
                FilePara = p.FilePara,
                FileFullType = p.FileFullType,
                Ver = p.Ver,
                FileSize = 0, // 注意：FilePublishHistory 模型中没有 FileSize 属性
                Crc = string.Empty, // 注意：FilePublishHistory 模型中没有 Crc 属性
                UploadFileID = string.Empty, // 注意：FilePublishHistory 模型中没有 UploadFileID 属性
                PublishType = p.PublishType,
                PublishTarget = p.PublishTarget,
                CreateTime = p.PublishTime, // 使用 PublishTime 代替 CreateTime
                Operator = p.Operator,
                Remark = p.Remark
            }).ToList();

            return new PaginatedResult<FilePublishHistoryDto>
            {
                Items = filePublishHistoryDtos,
                TotalCount = count,
                Page = page,
                PageSize = pageSize
            };
        }
    }
}
