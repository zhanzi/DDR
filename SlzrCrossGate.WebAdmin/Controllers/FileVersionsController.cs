using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SlzrCrossGate.Core.Database;
using SlzrCrossGate.Core.Models;
using SlzrCrossGate.Core.Service.FileStorage;
using SlzrCrossGate.WebAdmin.DTOs;
using SlzrCrossGate.WebAdmin.Services;
using System.Security.Claims;

namespace SlzrCrossGate.WebAdmin.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class FileVersionsController(TcpDbContext dbContext, UserService userService,FileService fileService) : ControllerBase
    {
        private readonly TcpDbContext _dbContext = dbContext;
        private readonly UserService _userService = userService;

        private readonly FileService _fileService= fileService;

        // GET: api/FileVersions
        [HttpGet]
        public async Task<ActionResult<PaginatedResult<FileVersionDto>>> GetFileVersions(
            [FromQuery] string? merchantId = null,
            [FromQuery] string? fileTypeId = null,
            [FromQuery] string? filePara = null,
            [FromQuery] string? ver = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            // 获取当前用户的商户ID
            var currentUserMerchantId = await _userService.GetUserMerchantIdAsync(User);
            var isSystemAdmin = User.IsInRole("SystemAdmin");

            // 如果不是系统管理员，只能查看自己商户的文件版本
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
            var query = from fileVer in _dbContext.FileVers
                        join fileType in _dbContext.FileTypes
                            on new { TypeId = fileVer.FileTypeID, MerchantId = fileVer.MerchantID }
                            equals new { TypeId = fileType.ID, MerchantId = fileType.MerchantID }
                        join merchant in _dbContext.Merchants
                            on fileVer.MerchantID equals merchant.MerchantID
                        where !fileVer.IsDelete
                        select new { FileVer = fileVer, FileTypeName = fileType.Name, MerchantName = merchant.Name };

            // 应用筛选条件
            if (!string.IsNullOrEmpty(merchantId))
            {
                query = query.Where(f => f.FileVer.MerchantID == merchantId);
            }

            if (!string.IsNullOrEmpty(fileTypeId))
            {
                query = query.Where(f => f.FileVer.FileTypeID == fileTypeId);
            }

            if (!string.IsNullOrEmpty(filePara))
            {
                query = query.Where(f => f.FileVer.FilePara == filePara);
            }

            if (!string.IsNullOrEmpty(ver))
            {
                query = query.Where(f => f.FileVer.Ver == ver);
            }

            // 获取总记录数
            var count = await query.CountAsync();

            // 应用分页和排序
            var fileVersions = await query
                .OrderByDescending(f => f.FileVer.CreateTime)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // 转换为DTO
            var fileVersionDtos = fileVersions.Select(f => new FileVersionDto
            {
                ID = f.FileVer.ID,
                MerchantID = f.FileVer.MerchantID,
                MerchantName = f.MerchantName,
                FileTypeID = f.FileVer.FileTypeID,
                FilePara = f.FileVer.FilePara,
                FileFullType = f.FileVer.FileFullType,
                Ver = f.FileVer.Ver,
                CreateTime = f.FileVer.CreateTime,
                UpdateTime = f.FileVer.UpdateTime,
                UploadFileID = f.FileVer.UploadFileID,
                FileSize = f.FileVer.FileSize,
                Crc = f.FileVer.Crc,
                Operator = f.FileVer.Operator,
                FileTypeName = f.FileTypeName
            }).ToList();

            return new PaginatedResult<FileVersionDto>
            {
                Items = fileVersionDtos,
                TotalCount = count,
                Page = page,
                PageSize = pageSize
            };
        }

        // GET: api/FileVersions/5
        [HttpGet("{id}")]
        public async Task<ActionResult<FileVersionDto>> GetFileVersion(int id)
        {
            // 获取当前用户的商户ID
            var currentUserMerchantId = await _userService.GetUserMerchantIdAsync(User);
            var isSystemAdmin = User.IsInRole("SystemAdmin");

            // 使用联结查询代替导航属性
            var result = await (from fv in _dbContext.FileVers
                               join ft in _dbContext.FileTypes
                                   on new { TypeId = fv.FileTypeID, MerchantId = fv.MerchantID }
                                   equals new { TypeId = ft.ID, MerchantId = ft.MerchantID }
                                join m in _dbContext.Merchants
                                    on fv.MerchantID equals m.MerchantID
                               where fv.ID == id && !fv.IsDelete
                               select new { FileVer = fv, FileTypeName = ft.Name, MerchantName = m.Name })
                              .FirstOrDefaultAsync();

            if (result == null)
            {
                return NotFound();
            }

            var fileVer = result.FileVer;

            // 如果不是系统管理员，只能查看自己商户的文件版本
            if (!isSystemAdmin && fileVer.MerchantID != currentUserMerchantId)
            {
                return Forbid();
            }

            return new FileVersionDto
            {
                ID = fileVer.ID,
                MerchantID = fileVer.MerchantID,
                MerchantName = result.MerchantName,
                FileTypeID = fileVer.FileTypeID,
                FilePara = fileVer.FilePara,
                FileFullType = fileVer.FileFullType,
                Ver = fileVer.Ver,
                CreateTime = fileVer.CreateTime,
                UpdateTime = fileVer.UpdateTime,
                UploadFileID = fileVer.UploadFileID,
                FileSize = fileVer.FileSize,
                Crc = fileVer.Crc,
                Operator = fileVer.Operator,
                FileTypeName = result.FileTypeName
            };
        }

        // POST: api/FileVersions
        [HttpPost]
        public async Task<ActionResult<FileVersionDto>> CreateFileVersion([FromForm] CreateFileVersionDto model)
        {
            // 获取当前用户的商户ID和用户名
            var currentUserMerchantId = await _userService.GetUserMerchantIdAsync(User);
            var isSystemAdmin = User.IsInRole("SystemAdmin");
            var username = UserService.GetUserNameForOperator(User);

            // 如果不是系统管理员，只能为自己的商户创建文件版本
            if (!isSystemAdmin && model.MerchantID != currentUserMerchantId)
            {
                return Forbid();
            }

            // 检查文件类型是否存在
            var fileType = await _dbContext.FileTypes
                .FirstOrDefaultAsync(t => t.ID == model.FileTypeID && t.MerchantID == model.MerchantID);

            if (fileType == null)
            {
                return BadRequest("文件类型不存在");
            }

            // 处理上传的文件
            if (model.File == null || model.File.Length == 0)
            {
                return BadRequest("请上传文件");
            }

            // 生成文件ID
            var fileId = Guid.NewGuid().ToString("N");
            var fileName = model.File.FileName;
            var fileSize = model.File.Length;

            // 计算CRC
            string crc;
            using (var stream = model.File.OpenReadStream())
            {
                crc = CalculateCrc32(stream);
            }

            // 保存文件
            var filePath=await _fileService.UploadFileAsync(model.File, username);

 
            // 创建上传文件记录
            var uploadFile = new UploadFile
            {
                ID = fileId,
                FileName = fileName,
                FileSize = (int)fileSize, // 显式转换为 int
                FilePath = filePath,
                UploadTime = DateTime.Now,
                Crc = crc, // 添加必要的 Crc 属性
                UploadedBy= username,
                ContentType= model.File.ContentType
             };

            _dbContext.UploadFiles.Add(uploadFile);

            if(string.IsNullOrEmpty(  model.FilePara)){
                model.FilePara = "";
            }
            // 创建文件版本记录
            var fileFullType = $"{model.FileTypeID}{model.FilePara}";
            var fileVersion = new FileVer
            {
                MerchantID = model.MerchantID,
                FileTypeID = model.FileTypeID,
                FilePara = model.FilePara,
                FileFullType = fileFullType,
                Ver = model.Ver,
                CreateTime = DateTime.Now,
                UpdateTime = DateTime.Now,
                UploadFileID = fileId,
                FileSize = (int)fileSize, // 显式转换为 int
                Crc = crc,
                Operator = username,
                IsDelete = false
            };

            _dbContext.FileVers.Add(fileVersion);
            await _dbContext.SaveChangesAsync();

            return CreatedAtAction(nameof(GetFileVersion), new { id = fileVersion.ID }, new FileVersionDto
            {
                ID = fileVersion.ID,
                MerchantID = fileVersion.MerchantID,
                FileTypeID = fileVersion.FileTypeID,
                FilePara = fileVersion.FilePara,
                FileFullType = fileVersion.FileFullType,
                Ver = fileVersion.Ver,
                CreateTime = fileVersion.CreateTime,
                UpdateTime = fileVersion.UpdateTime,
                UploadFileID = fileVersion.UploadFileID,
                FileSize = fileVersion.FileSize,
                Crc = fileVersion.Crc,
                Operator = fileVersion.Operator,
                FileTypeName = fileType.Name
            });
        }

        // DELETE: api/FileVersions/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteFileVersion(int id)
        {
            // 获取当前用户的商户ID和用户名
            var currentUserMerchantId = await _userService.GetUserMerchantIdAsync(User);
            var isSystemAdmin = User.IsInRole("SystemAdmin");
            var username = UserService.GetUserNameForOperator(User);

            var fileVersion = await _dbContext.FileVers
                .FirstOrDefaultAsync(f => f.ID == id && !f.IsDelete);

            if (fileVersion == null)
            {
                return NotFound();
            }

            // 如果不是系统管理员，只能删除自己商户的文件版本
            if (!isSystemAdmin && fileVersion.MerchantID != currentUserMerchantId)
            {
                return Forbid();
            }

            // 检查是否有关联的文件发布
            var hasFilePublish = await _dbContext.FilePublishs
                .AnyAsync(p => p.FileFullType == fileVersion.FileFullType && p.Ver == fileVersion.Ver);

            if (hasFilePublish)
            {
                return BadRequest("无法删除已发布的文件版本");
            }

            // 软删除文件版本
            fileVersion.IsDelete = true;
            await _dbContext.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/FileVersions/Download/5
        [HttpGet("Download/{id}")]
        public async Task<IActionResult> DownloadFile(int id)
        {
            // 获取当前用户的商户ID
            var currentUserMerchantId = await _userService.GetUserMerchantIdAsync(User);
            var isSystemAdmin = User.IsInRole("SystemAdmin");

            var fileVersion = await _dbContext.FileVers
                .FirstOrDefaultAsync(f => f.ID == id && !f.IsDelete);

            if (fileVersion == null)
            {
                return NotFound();
            }

            // 如果不是系统管理员，只能下载自己商户的文件
            if (!isSystemAdmin && fileVersion.MerchantID != currentUserMerchantId)
            {
                return Forbid();
            }

            // 获取上传文件信息
            var uploadFile = await _dbContext.UploadFiles
                .FirstOrDefaultAsync(u => u.ID == fileVersion.UploadFileID);

            if (uploadFile == null)
            {
                return NotFound("文件不存在");
            }

            var fileBytes = await _fileService.GetFileContentAsync(uploadFile.FilePath);

            return File(fileBytes, "application/octet-stream", uploadFile.FileName);
        }

        // 计算CRC32
        private static string CalculateCrc32(Stream stream)
        {
            // 这里使用简化的CRC32计算方法，实际应用中可能需要更复杂的实现
            return SlzrCrossGate.Common.CRC.calStreamCRC(stream).ToString("X2").PadLeft(8, '0');
        }
    }

}
