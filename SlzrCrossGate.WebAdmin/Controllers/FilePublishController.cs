using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SlzrCrossGate.Core.Database;
using SlzrCrossGate.Core.Models;
using SlzrCrossGate.Core.Service.BusinessServices;
using SlzrCrossGate.Core.Services;
using SlzrCrossGate.WebAdmin.DTOs;
using SlzrCrossGate.WebAdmin.Services;
using System.Security.Claims;

namespace SlzrCrossGate.WebAdmin.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class FilePublishController(TcpDbContext dbContext, UserService userService,FilePublishEventService filePublishEventService) : ControllerBase
    {
        private readonly TcpDbContext _dbContext = dbContext;
        private readonly UserService _userService = userService;
        private readonly FilePublishEventService _filePublishEventService = filePublishEventService;

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
                        join merchant in _dbContext.Merchants
                            on filePublish.MerchantID equals merchant.MerchantID
                        select new { FilePublish = filePublish, FileTypeName = fileType.Name, MerchantName = merchant.Name };

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
                .OrderByDescending(p => p.FilePublish.PublishTime)
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
                FileVerID = p.FilePublish.FileVerID,
                FileSize = p.FilePublish.FileSize,
                Crc = p.FilePublish.Crc,
                UploadFileID = p.FilePublish.UploadFileID,
                PublishType = p.FilePublish.PublishType,
                PublishTarget = p.FilePublish.PublishTarget,
                PublishTime = p.FilePublish.PublishTime,
                Operator = p.FilePublish.Operator,
                FileTypeName = p.FileTypeName,
                MerchantName = p.MerchantName
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
                                 join m in _dbContext.Merchants
                                      on fp.MerchantID equals m.MerchantID
                               where fp.ID == id
                               select new { FilePublish = fp, FileTypeName = ft.Name, MerchantName = m.Name })
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
                FileVerID = filePublish.FileVerID,
                FileSize = filePublish.FileSize,
                Crc = filePublish.Crc,
                UploadFileID = filePublish.UploadFileID,
                PublishType = filePublish.PublishType,
                PublishTarget = filePublish.PublishTarget,
                PublishTime = filePublish.PublishTime,
                Operator = filePublish.Operator,
                FileTypeName = result.FileTypeName,
                MerchantName = result.MerchantName
            };
        }

        // POST: api/FilePublish
        [HttpPost]
        public async Task<ActionResult<FilePublishDto>> CreateFilePublish(CreateFilePublishDto model)
        {
            // 获取当前用户的商户ID和用户名
            var currentUserMerchantId = await _userService.GetUserMerchantIdAsync(User);
            var isSystemAdmin = User.IsInRole("SystemAdmin");
            var username = UserService.GetUserNameForOperator(User);

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
                                         join m in _dbContext.Merchants
                                             on fv.MerchantID equals m.MerchantID
                                         where fv.ID == model.FileVersionId && !fv.IsDelete
                                         select new { FileVersion = fv, FileTypeName = ft.Name, MerchantName = m.Name })
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
            if(model.PublishType==PublishTypeOption.Merchant)
            {
                model.PublishTarget= fileVersion.MerchantID;
            }

            var now=DateTime.Now;
            // 检查该文件类型和发布目标与发布类型是否已存在
            var filePublish = await _dbContext.FilePublishs
                .FirstOrDefaultAsync(p =>p.FileFullType== fileVersion.FileFullType && p.PublishType == model.PublishType && p.PublishTarget == model.PublishTarget && p.MerchantID == model.MerchantID);
            if (filePublish != null)
            {
                if(filePublish.FileVerID == fileVersion.ID)
                {
                    return Conflict("该发布已存在");
                }
                //存在其它版本的发布，更新版本信息
                filePublish.FileVerID = fileVersion.ID;
                filePublish.Ver = fileVersion.Ver;
                filePublish.FileSize = fileVersion.FileSize;
                filePublish.Crc = fileVersion.Crc;
                filePublish.UploadFileID = fileVersion.UploadFileID;
                filePublish.PublishTime = now;
                filePublish.Operator = username;
            }
            else
            {
                // 创建文件发布记录
                filePublish = new FilePublish
                {
                    MerchantID = model.MerchantID,
                    FileTypeID = fileVersion.FileTypeID,
                    FilePara = fileVersion.FilePara,
                    FileFullType = fileVersion.FileFullType,
                    Ver = fileVersion.Ver,
                    FileSize = fileVersion.FileSize,
                    Crc = fileVersion.Crc,
                    FileVerID = fileVersion.ID,
                    UploadFileID = fileVersion.UploadFileID,
                    PublishType = model.PublishType,
                    PublishTarget = model.PublishTarget,
                    PublishTime = now,
                    Operator = username
                };
                _dbContext.FilePublishs.Add(filePublish);
            }
            // 创建文件发布历史记录
            var filePublishHistory = new FilePublishHistory
            {
                MerchantID = model.MerchantID,
                FileTypeID = fileVersion.FileTypeID,
                FilePara = fileVersion.FilePara,
                FileFullType = fileVersion.FileFullType,
                Ver = fileVersion.Ver,
                FileSize = fileVersion.FileSize,
                Crc = fileVersion.Crc,
                FileVerID = fileVersion.ID,
                UploadFileID = fileVersion.UploadFileID,
                PublishType = model.PublishType,
                PublishTarget = model.PublishTarget,
                PublishTime = now,
                Operator = username
            };

            _dbContext.FilePublishHistories.Add(filePublishHistory);
            await _dbContext.SaveChangesAsync();

            await _filePublishEventService.Publish(new FilePublishEventMessage
            {
                ActionType = FilePublishEventActionType.Publish,
                FilePublishID = filePublish.ID,
                MerchantID = filePublish.MerchantID,
                FileTypeID = filePublish.FileTypeID,
                FilePara = filePublish.FilePara,
                FileFullType = filePublish.FileFullType,
                Ver = filePublish.Ver,
                FileCrc = filePublish.Crc,
                FileSize = filePublish.FileSize,
                Operator = filePublish.Operator,
                PublishTarget = filePublish.PublishTarget,
                PublishType = filePublish.PublishType,
                ActionTime = filePublish.PublishTime
            });

            return CreatedAtAction(nameof(GetFilePublish), new { id = filePublish.ID }, new FilePublishDto
            {
                ID = filePublish.ID,
                MerchantID = filePublish.MerchantID,
                MerchantName = fileVersionResult!.MerchantName,
                FileTypeID = filePublish.FileTypeID,
                FilePara = filePublish.FilePara,
                FileFullType = filePublish.FileFullType,
                Ver = filePublish.Ver,
                FileSize = filePublish.FileSize,
                Crc = filePublish.Crc,
                UploadFileID = filePublish.UploadFileID,
                PublishType = filePublish.PublishType,
                PublishTarget = filePublish.PublishTarget,
                PublishTime = filePublish.PublishTime,
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
            var username = UserService.GetUserNameForOperator(User);

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
                FileTypeID = filePublish.FileTypeID,
                FilePara = filePublish.FilePara,
                FileFullType = filePublish.FileFullType,
                Ver = filePublish.Ver,
                FileSize = filePublish.FileSize,
                Crc = filePublish.Crc,
                 FileVerID = filePublish.ID,
                UploadFileID = filePublish.UploadFileID,
                PublishType = filePublish.PublishType,
                PublishTarget = filePublish.PublishTarget,
                PublishTime = DateTime.Now,
                Operator = username,
                OperationType = "Revoke", // 取消发布
                Remark = "取消发布" // 取消发布时的备注
            };

            _dbContext.FilePublishHistories.Add(filePublishHistory);
            await _dbContext.SaveChangesAsync();

            await _filePublishEventService.Publish(new FilePublishEventMessage
            {
                ActionType = FilePublishEventActionType.Cancel,
                FilePublishID = filePublish.ID,
                MerchantID = filePublish.MerchantID,
                FileTypeID = filePublish.FileTypeID,
                FilePara = filePublish.FilePara,
                FileFullType = filePublish.FileFullType,
                Ver = filePublish.Ver,
                FileCrc = filePublish.Crc,
                FileSize = filePublish.FileSize,
                Operator = username,
                PublishTarget = filePublish.PublishTarget,
                PublishType = filePublish.PublishType,
                ActionTime = filePublish.PublishTime
            });

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
            var query = from filePublishHistory in _dbContext.FilePublishHistories
                        join fileType in _dbContext.FileTypes
                            on new { TypeId = filePublishHistory.FileTypeID, MerchantId = filePublishHistory.MerchantID }
                            equals new { TypeId = fileType.ID, MerchantId = fileType.MerchantID }
                        join merchant in _dbContext.Merchants
                            on filePublishHistory.MerchantID equals merchant.MerchantID
                        select new { FilePublishHistory = filePublishHistory, FileTypeName = fileType.Name, MerchantName = merchant.Name };

            // 应用筛选条件
            if (!string.IsNullOrEmpty(merchantId))
            {
                query = query.Where(p => p.FilePublishHistory.MerchantID == merchantId);
            }

            if (!string.IsNullOrEmpty(fileTypeId))
            {
                query = query.Where(p => p.FilePublishHistory.FileTypeID == fileTypeId);
            }

            if (!string.IsNullOrEmpty(filePara))
            {
                query = query.Where(p => p.FilePublishHistory.FilePara == filePara);
            }

            if (publishType.HasValue)
            {
                query = query.Where(p => p.FilePublishHistory.PublishType == publishType.Value);
            }

            if (!string.IsNullOrEmpty(publishTarget))
            {
                query = query.Where(p => p.FilePublishHistory.PublishTarget.Contains(publishTarget));
            }

            // 获取总记录数
            var count = await query.CountAsync();

            // 应用分页和排序
            var filePublishHistories = await query
                .OrderByDescending(p => p.FilePublishHistory.PublishTime) // 使用 PublishTime 代替 CreateTime
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // 转换为DTO
            var filePublishHistoryDtos = filePublishHistories.Select(p => new FilePublishHistoryDto
            {
                ID = p.FilePublishHistory.ID,
                MerchantID = p.FilePublishHistory.MerchantID,
                MerchantName = p.MerchantName,
                FileTypeID = p.FilePublishHistory.FileTypeID,
                FileTypeName = p.FileTypeName,
                FilePara = p.FilePublishHistory.FilePara,
                FileFullType = p.FilePublishHistory.FileFullType,
                Ver = p.FilePublishHistory.Ver,
                FileSize = p.FilePublishHistory.FileSize,
                Crc = p.FilePublishHistory.Crc,
                UploadFileID = p.FilePublishHistory.UploadFileID,
                PublishType = p.FilePublishHistory.PublishType,
                PublishTarget = p.FilePublishHistory.PublishTarget,
                PublishTime = p.FilePublishHistory.PublishTime, 
                Operator = p.FilePublishHistory.Operator,
                OperationType= p.FilePublishHistory.OperationType,
                Remark = p.FilePublishHistory.Remark
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
