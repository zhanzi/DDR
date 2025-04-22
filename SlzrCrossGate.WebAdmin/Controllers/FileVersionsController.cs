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
    public class FileVersionsController : ControllerBase
    {
        private readonly TcpDbContext _dbContext;
        private readonly UserService _userService;
        private readonly ILogger<FileVersionsController> _logger;

        public FileVersionsController(
            TcpDbContext dbContext,
            UserService userService,
            ILogger<FileVersionsController> logger)
        {
            _dbContext = dbContext;
            _userService = userService;
            _logger = logger;
        }

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

            // 构建查询
            var query = _dbContext.FileVers
                .Include(f => f.FileType)
                .Where(f => !f.IsDelete)
                .AsQueryable();

            // 应用筛选条件
            if (!string.IsNullOrEmpty(merchantId))
            {
                query = query.Where(f => f.MerchantID == merchantId);
            }

            if (!string.IsNullOrEmpty(fileTypeId))
            {
                query = query.Where(f => f.FileTypeID == fileTypeId);
            }

            if (!string.IsNullOrEmpty(filePara))
            {
                query = query.Where(f => f.FilePara == filePara);
            }

            if (!string.IsNullOrEmpty(ver))
            {
                query = query.Where(f => f.Ver == ver);
            }

            // 获取总记录数
            var count = await query.CountAsync();

            // 应用分页和排序
            var fileVersions = await query
                .OrderByDescending(f => f.CreateTime)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // 转换为DTO
            var fileVersionDtos = fileVersions.Select(f => new FileVersionDto
            {
                ID = f.ID,
                MerchantID = f.MerchantID,
                FileTypeID = f.FileTypeID,
                FilePara = f.FilePara,
                FileFullType = f.FileFullType,
                Ver = f.Ver,
                CreateTime = f.CreateTime,
                UpdateTime = f.UpdateTime,
                UploadFileID = f.UploadFileID,
                FileSize = f.FileSize,
                Crc = f.Crc,
                Operator = f.Operator,
                FileTypeName = f.FileType?.Name
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

            var fileVersion = await _dbContext.FileVers
                .Include(f => f.FileType)
                .FirstOrDefaultAsync(f => f.ID == id && !f.IsDelete);

            if (fileVersion == null)
            {
                return NotFound();
            }

            // 如果不是系统管理员，只能查看自己商户的文件版本
            if (!isSystemAdmin && fileVersion.MerchantID != currentUserMerchantId)
            {
                return Forbid();
            }

            return new FileVersionDto
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
                FileTypeName = fileVersion.FileType?.Name
            };
        }

        // POST: api/FileVersions
        [HttpPost]
        public async Task<ActionResult<FileVersionDto>> CreateFileVersion([FromForm] CreateFileVersionDto model)
        {
            // 获取当前用户的商户ID和用户名
            var currentUserMerchantId = await _userService.GetUserMerchantIdAsync(User);
            var isSystemAdmin = User.IsInRole("SystemAdmin");
            var username = User.FindFirstValue(ClaimTypes.Name);

            // 如果不是系统管理员，只能为自己的商户创建文件版本
            if (!isSystemAdmin && model.MerchantID != currentUserMerchantId)
            {
                return Forbid();
            }

            // 检查文件类型是否存在
            var fileType = await _dbContext.FileTypes
                .FirstOrDefaultAsync(t => t.Code == model.FileTypeID && t.MerchantID == model.MerchantID);

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
            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "Uploads");
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            var filePath = Path.Combine(uploadsFolder, fileId);
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await model.File.CopyToAsync(stream);
            }

            // 创建上传文件记录
            var uploadFile = new UploadFile
            {
                ID = fileId,
                FileName = fileName,
                FileSize = fileSize,
                FilePath = filePath,
                UploadTime = DateTime.Now,
                Operator = username
            };

            _dbContext.UploadFiles.Add(uploadFile);

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
                FileSize = fileSize,
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
            var username = User.FindFirstValue(ClaimTypes.Name);

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

            // 检查文件是否存在
            if (!System.IO.File.Exists(uploadFile.FilePath))
            {
                return NotFound("文件不存在");
            }

            // 返回文件
            var fileBytes = await System.IO.File.ReadAllBytesAsync(uploadFile.FilePath);
            return File(fileBytes, "application/octet-stream", uploadFile.FileName);
        }

        // 计算CRC32
        private string CalculateCrc32(Stream stream)
        {
            // 这里使用简化的CRC32计算方法，实际应用中可能需要更复杂的实现
            var crc32 = new Crc32();
            var hash = crc32.ComputeHash(stream);
            return BitConverter.ToString(hash).Replace("-", "").ToLowerInvariant();
        }
    }

    // 简化的CRC32实现
    public class Crc32 : System.Security.Cryptography.HashAlgorithm
    {
        private uint _crc32 = 0xFFFFFFFF;
        private readonly uint[] _crc32Table;

        public Crc32()
        {
            _crc32Table = new uint[256];
            for (uint i = 0; i < 256; i++)
            {
                uint crc = i;
                for (int j = 0; j < 8; j++)
                {
                    if ((crc & 1) == 1)
                    {
                        crc = (crc >> 1) ^ 0xEDB88320;
                    }
                    else
                    {
                        crc >>= 1;
                    }
                }
                _crc32Table[i] = crc;
            }
        }

        protected override void HashCore(byte[] array, int ibStart, int cbSize)
        {
            for (int i = ibStart; i < ibStart + cbSize; i++)
            {
                _crc32 = ((_crc32 >> 8) & 0x00FFFFFF) ^ _crc32Table[(_crc32 ^ array[i]) & 0xFF];
            }
        }

        protected override byte[] HashFinal()
        {
            byte[] hashBuffer = BitConverter.GetBytes(~_crc32);
            this.HashValue = new byte[4] { hashBuffer[0], hashBuffer[1], hashBuffer[2], hashBuffer[3] };
            return this.HashValue;
        }

        public override void Initialize()
        {
            _crc32 = 0xFFFFFFFF;
        }
    }
}
