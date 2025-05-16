using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SlzrCrossGate.Core.Database;
using SlzrCrossGate.Core.Models;
using SlzrCrossGate.Core.Service.FileStorage;
using SlzrCrossGate.WebAdmin.DTOs;
using SlzrCrossGate.WebAdmin.Services;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace SlzrCrossGate.WebAdmin.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class LinePriceController : ControllerBase
    {
        private readonly TcpDbContext _dbContext;
        private readonly UserService _userService;
        private readonly FileService _fileService;
        
        // 常量定义
        private const string LINE_PRICE_FILE_TYPE = "PZB"; // 票价文件类型固定为PZB

        public LinePriceController(TcpDbContext dbContext, UserService userService, FileService fileService)
        {
            _dbContext = dbContext;
            _userService = userService;
            _fileService = fileService;
        }

        #region LinePriceInfo APIs

        // GET: api/LinePrices
        [HttpGet]
        public async Task<ActionResult<PaginatedResult<LinePriceInfoDto>>> GetLinePriceInfos(
            [FromQuery] string? merchantId = null,
            [FromQuery] string? lineNumber = null,
            [FromQuery] string? groupNumber = null,
            [FromQuery] bool? isActive = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            // 获取当前用户的商户ID
            var currentUserMerchantId = await _userService.GetUserMerchantIdAsync(User);
            var isSystemAdmin = User.IsInRole("SystemAdmin");

            // 如果不是系统管理员，只能查看自己商户的线路票价信息
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
            var query = from lpi in _dbContext.LinePriceInfos
                        join merchant in _dbContext.Merchants
                            on lpi.MerchantID equals merchant.MerchantID
                        select new { LinePriceInfo = lpi, MerchantName = merchant.Name };

            // 应用筛选条件
            if (!string.IsNullOrEmpty(merchantId))
            {
                query = query.Where(lpi => lpi.LinePriceInfo.MerchantID == merchantId);
            }

            if (!string.IsNullOrEmpty(lineNumber))
            {
                query = query.Where(lpi => lpi.LinePriceInfo.LineNumber == lineNumber);
            }

            if (!string.IsNullOrEmpty(groupNumber))
            {
                query = query.Where(lpi => lpi.LinePriceInfo.GroupNumber == groupNumber);
            }

            if (isActive.HasValue)
            {
                query = query.Where(lpi => lpi.LinePriceInfo.IsActive == isActive.Value);
            }

            // 获取总记录数
            var count = await query.CountAsync();

            // 应用分页和排序
            var linePriceInfos = await query
                .OrderBy(lpi => lpi.LinePriceInfo.MerchantID)
                .ThenBy(lpi => lpi.LinePriceInfo.LineNumber)
                .ThenBy(lpi => lpi.LinePriceInfo.GroupNumber)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // 转换为DTO
            var linePriceInfoDtos = linePriceInfos.Select(lpi => new LinePriceInfoDto
            {
                ID = lpi.LinePriceInfo.ID,
                MerchantID = lpi.LinePriceInfo.MerchantID,
                MerchantName = lpi.MerchantName,
                LineNumber = lpi.LinePriceInfo.LineNumber,
                GroupNumber = lpi.LinePriceInfo.GroupNumber,
                LineName = lpi.LinePriceInfo.LineName,
                Fare = lpi.LinePriceInfo.Fare,
                IsActive = lpi.LinePriceInfo.IsActive,
                CurrentVersion = lpi.LinePriceInfo.CurrentVersion,
                CreateTime = lpi.LinePriceInfo.CreateTime,
                UpdateTime = lpi.LinePriceInfo.UpdateTime,
                Creator = lpi.LinePriceInfo.Creator,
                Updater = lpi.LinePriceInfo.Updater,
                Remark = lpi.LinePriceInfo.Remark
            }).ToList();

            return new PaginatedResult<LinePriceInfoDto>
            {
                Items = linePriceInfoDtos,
                TotalCount = count,
                Page = page,
                PageSize = pageSize
            };
        }

        // GET: api/LinePrice/search - 搜索线路(用于跨线路复制)
        [HttpGet("search")]
        public async Task<ActionResult<PaginatedResult<LinePriceInfoDto>>> SearchLinePrices(
            [FromQuery] string? search = "", 
            [FromQuery] int excludeLineId = 0, 
            [FromQuery] string? merchantId = null,
            [FromQuery] int page = 1, 
            [FromQuery] int pageSize = 20)
        {
            // 获取当前用户的商户ID
            var currentUserMerchantId = await _userService.GetUserMerchantIdAsync(User);
            var isSystemAdmin = User.IsInRole("SystemAdmin");

            // 非系统管理员只能查看自己商户的数据
            if (!isSystemAdmin && merchantId != null && merchantId != currentUserMerchantId)
            {
                return Forbid();
            }

            // 如果未指定商户ID且不是系统管理员，则使用当前用户的商户ID
            if (merchantId == null && !isSystemAdmin)
            {
                merchantId = currentUserMerchantId;
            }

            // 构建查询，使用联结查询而非导航属性
            var query = from lpi in _dbContext.LinePriceInfos
                        join merchant in _dbContext.Merchants
                            on lpi.MerchantID equals merchant.MerchantID
                        select new { LinePriceInfo = lpi, MerchantName = merchant.Name };

            // 应用筛选条件
            if (!string.IsNullOrEmpty(merchantId))
            {
                query = query.Where(lpi => lpi.LinePriceInfo.MerchantID == merchantId);
            }

            // 排除指定的线路ID
            if (excludeLineId > 0)
            {
                query = query.Where(lpi => lpi.LinePriceInfo.ID != excludeLineId);
            }

            // 基于搜索关键词筛选
            if (!string.IsNullOrEmpty(search))
            {
                // 搜索线路号、组号、名称
                query = query.Where(lpi => 
                    lpi.LinePriceInfo.LineNumber.Contains(search) || 
                    lpi.LinePriceInfo.GroupNumber.Contains(search) || 
                    lpi.LinePriceInfo.LineName.Contains(search));
            }

            // 获取总记录数
            var count = await query.CountAsync();

            // 应用分页和排序
            var linePriceInfos = await query
                .OrderBy(lpi => lpi.LinePriceInfo.LineNumber)
                .ThenBy(lpi => lpi.LinePriceInfo.GroupNumber)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // 转换为DTO
            var linePriceInfoDtos = linePriceInfos.Select(lpi => new LinePriceInfoDto
            {
                ID = lpi.LinePriceInfo.ID,
                MerchantID = lpi.LinePriceInfo.MerchantID,
                MerchantName = lpi.MerchantName ?? "",
                LineNumber = lpi.LinePriceInfo.LineNumber,
                GroupNumber = lpi.LinePriceInfo.GroupNumber,
                LineName = lpi.LinePriceInfo.LineName,
                Fare = lpi.LinePriceInfo.Fare,
                IsActive = lpi.LinePriceInfo.IsActive,
                CurrentVersion = lpi.LinePriceInfo.CurrentVersion,
                CreateTime = lpi.LinePriceInfo.CreateTime,
                UpdateTime = lpi.LinePriceInfo.UpdateTime,
                Creator = lpi.LinePriceInfo.Creator,
                Updater = lpi.LinePriceInfo.Updater,
                Remark = lpi.LinePriceInfo.Remark
            }).ToList();

            return new PaginatedResult<LinePriceInfoDto>
            {
                Items = linePriceInfoDtos,
                TotalCount = count,
                Page = page,
                PageSize = pageSize
            };
        }

        // GET: api/LinePrices/5
        [HttpGet("{id}")]
        public async Task<ActionResult<LinePriceInfoDto>> GetLinePriceInfo(int id)
        {
            // 获取当前用户的商户ID
            var currentUserMerchantId = await _userService.GetUserMerchantIdAsync(User);
            var isSystemAdmin = User.IsInRole("SystemAdmin");

            // 使用联结查询代替导航属性
            var result = await (from lpi in _dbContext.LinePriceInfos
                               join merchant in _dbContext.Merchants
                                   on lpi.MerchantID equals merchant.MerchantID
                               where lpi.ID == id
                               select new { LinePriceInfo = lpi, MerchantName = merchant.Name })
                              .FirstOrDefaultAsync();

            if (result == null)
            {
                return NotFound();
            }

            var linePriceInfo = result.LinePriceInfo;

            // 如果不是系统管理员，只能查看自己商户的线路票价信息
            if (!isSystemAdmin && linePriceInfo.MerchantID != currentUserMerchantId)
            {
                return Forbid();
            }

            return new LinePriceInfoDto
            {
                ID = linePriceInfo.ID,
                MerchantID = linePriceInfo.MerchantID,
                MerchantName = result.MerchantName,
                LineNumber = linePriceInfo.LineNumber,
                GroupNumber = linePriceInfo.GroupNumber,
                LineName = linePriceInfo.LineName,
                Fare = linePriceInfo.Fare,
                IsActive = linePriceInfo.IsActive,
                CurrentVersion = linePriceInfo.CurrentVersion,
                CreateTime = linePriceInfo.CreateTime,
                UpdateTime = linePriceInfo.UpdateTime,
                Creator = linePriceInfo.Creator,
                Updater = linePriceInfo.Updater,
                Remark = linePriceInfo.Remark
            };
        }

        // POST: api/LinePrices
        [HttpPost]
        public async Task<ActionResult<LinePriceInfoDto>> CreateLinePriceInfo(CreateLinePriceInfoDto model)
        {
            // 获取当前用户的商户ID和用户名
            var currentUserMerchantId = await _userService.GetUserMerchantIdAsync(User);
            var isSystemAdmin = User.IsInRole("SystemAdmin");
            var username = UserService.GetUserNameForOperator(User);

            // 如果不是系统管理员，只能为自己的商户创建线路票价信息
            if (!isSystemAdmin && model.MerchantID != currentUserMerchantId)
            {
                return Forbid();
            }

            // 验证商户是否存在
            var merchant = await _dbContext.Merchants.FirstOrDefaultAsync(m => m.MerchantID == model.MerchantID);
            if (merchant == null)
            {
                return BadRequest("指定的商户不存在");
            }

            // 验证线路号和组号格式
            if (!IsValidLineNumber(model.LineNumber) || !IsValidGroupNumber(model.GroupNumber))
            {
                return BadRequest("线路号必须为4位数字，组号必须为2位数字");
            }

            // 检查线路号和组号是否已存在
            var exists = await _dbContext.LinePriceInfos.AnyAsync(lpi => 
                lpi.MerchantID == model.MerchantID && 
                lpi.LineNumber == model.LineNumber && 
                lpi.GroupNumber == model.GroupNumber);

            if (exists)
            {
                return BadRequest("该商户下已存在相同线路号和组号的线路票价信息");
            }

            // 创建线路票价信息
            var linePriceInfo = new LinePriceInfo
            {
                MerchantID = model.MerchantID,
                LineNumber = model.LineNumber,
                GroupNumber = model.GroupNumber,
                LineName = model.LineName,
                Fare = model.Fare,
                IsActive = model.IsActive,
                CurrentVersion = "", // 初始版本号为空
                CreateTime = DateTime.Now,
                UpdateTime = DateTime.Now,
                Creator = username,
                Updater = username,
                Remark = model.Remark
            };

            _dbContext.LinePriceInfos.Add(linePriceInfo);
            await _dbContext.SaveChangesAsync();

            // 返回创建结果
            return CreatedAtAction(nameof(GetLinePriceInfo), new { id = linePriceInfo.ID }, new LinePriceInfoDto
            {
                ID = linePriceInfo.ID,
                MerchantID = linePriceInfo.MerchantID,
                MerchantName = merchant.Name ?? "",
                LineNumber = linePriceInfo.LineNumber,
                GroupNumber = linePriceInfo.GroupNumber,
                LineName = linePriceInfo.LineName,
                Fare = linePriceInfo.Fare,
                IsActive = linePriceInfo.IsActive,
                CurrentVersion = linePriceInfo.CurrentVersion,
                CreateTime = linePriceInfo.CreateTime,
                UpdateTime = linePriceInfo.UpdateTime,
                Creator = linePriceInfo.Creator,
                Updater = linePriceInfo.Updater,
                Remark = linePriceInfo.Remark
            });
        }

        // PUT: api/LinePrices/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateLinePriceInfo(int id, UpdateLinePriceInfoDto model)
        {
            // 获取当前用户的商户ID和用户名
            var currentUserMerchantId = await _userService.GetUserMerchantIdAsync(User);
            var isSystemAdmin = User.IsInRole("SystemAdmin");
            var username = UserService.GetUserNameForOperator(User);

            var linePriceInfo = await _dbContext.LinePriceInfos.FindAsync(id);
            if (linePriceInfo == null)
            {
                return NotFound();
            }

            // 如果不是系统管理员，只能更新自己商户的线路票价信息
            if (!isSystemAdmin && linePriceInfo.MerchantID != currentUserMerchantId)
            {
                return Forbid();
            }

            // 更新非空字段
            if (!string.IsNullOrEmpty(model.LineName))
                linePriceInfo.LineName = model.LineName;

            if (model.Fare.HasValue)
                linePriceInfo.Fare = model.Fare.Value;

            if (model.IsActive.HasValue)
                linePriceInfo.IsActive = model.IsActive.Value;

            if (model.Remark != null)
                linePriceInfo.Remark = model.Remark;

            linePriceInfo.UpdateTime = DateTime.Now;
            linePriceInfo.Updater = username;

            await _dbContext.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/LinePrices/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLinePriceInfo(int id)
        {
            // 获取当前用户的商户ID
            var currentUserMerchantId = await _userService.GetUserMerchantIdAsync(User);
            var isSystemAdmin = User.IsInRole("SystemAdmin");

            var linePriceInfo = await _dbContext.LinePriceInfos.FindAsync(id);
            if (linePriceInfo == null)
            {
                return NotFound();
            }

            // 如果不是系统管理员，只能删除自己商户的线路票价信息
            if (!isSystemAdmin && linePriceInfo.MerchantID != currentUserMerchantId)
            {
                return Forbid();
            }

            // 检查是否有已提交的版本
            var hasSubmittedVersion = await _dbContext.LinePriceInfoVersions
                .AnyAsync(v => v.LinePriceInfoID == id && v.Status == LinePriceVersionStatus.Submitted);

            if (hasSubmittedVersion)
            {
                return BadRequest("无法删除已有已提交版本的线路票价信息");
            }

            // 删除相关的版本信息
            var versions = await _dbContext.LinePriceInfoVersions
                .Where(v => v.LinePriceInfoID == id)
                .ToListAsync();

            _dbContext.LinePriceInfoVersions.RemoveRange(versions);
            _dbContext.LinePriceInfos.Remove(linePriceInfo);
            await _dbContext.SaveChangesAsync();

            return NoContent();
        }

        #endregion

        #region LinePriceInfoVersion APIs

        // GET: api/LinePrices/{linePriceInfoId}/Versions
        [HttpGet("{linePriceInfoId}/Versions")]
        public async Task<ActionResult<PaginatedResult<LinePriceInfoVersionDto>>> GetLinePriceInfoVersions(
            int linePriceInfoId,
            [FromQuery] LinePriceVersionStatus? status = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            // 获取当前用户的商户ID
            var currentUserMerchantId = await _userService.GetUserMerchantIdAsync(User);
            var isSystemAdmin = User.IsInRole("SystemAdmin");

            // 先检查线路票价信息是否存在
            var linePriceInfo = await _dbContext.LinePriceInfos.FindAsync(linePriceInfoId);
            if (linePriceInfo == null)
            {
                return NotFound("线路票价信息不存在");
            }

            // 如果不是系统管理员，只能查看自己商户的线路票价版本
            if (!isSystemAdmin && linePriceInfo.MerchantID != currentUserMerchantId)
            {
                return Forbid();
            }

            // 构建查询 - 使用联结查询代替导航属性
            var query = from lpiv in _dbContext.LinePriceInfoVersions
                        join lpi in _dbContext.LinePriceInfos
                            on lpiv.LinePriceInfoID equals lpi.ID
                        join merchant in _dbContext.Merchants
                            on lpiv.MerchantID equals merchant.MerchantID
                        where lpiv.LinePriceInfoID == linePriceInfoId
                        select new { Version = lpiv, LinePriceInfo = lpi, MerchantName = merchant.Name };

            // 应用状态筛选
            if (status.HasValue)
            {
                query = query.Where(v => v.Version.Status == status.Value);
            }

            // 获取总记录数
            var count = await query.CountAsync();

            // 应用分页和排序
            var versions = await query
                .OrderByDescending(v => v.Version.Version) // 按版本号降序排列
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // 转换为DTO
            var versionDtos = versions.Select(v => new LinePriceInfoVersionDto
            {
                ID = v.Version.ID,
                MerchantID = v.Version.MerchantID,
                MerchantName = v.MerchantName,
                LinePriceInfoID = v.Version.LinePriceInfoID,
                LineNumber = v.Version.LineNumber,
                GroupNumber = v.Version.GroupNumber,
                LineName = v.Version.LineName,
                Fare = v.Version.Fare,
                Version = v.Version.Version,
                ExtraParams = string.IsNullOrEmpty(v.Version.ExtraParamsJson) ? null : JsonSerializer.Deserialize<object>(v.Version.ExtraParamsJson),
                CardDiscountInfo = string.IsNullOrEmpty(v.Version.CardDiscountInfoJson) ? null : JsonSerializer.Deserialize<object>(v.Version.CardDiscountInfoJson),
                Status = v.Version.Status,
                IsPublished = v.Version.IsPublished,
                FileVerID = v.Version.FileVerID,
                CreateTime = v.Version.CreateTime,
                UpdateTime = v.Version.UpdateTime,
                SubmitTime = v.Version.SubmitTime,
                Creator = v.Version.Creator,
                Updater = v.Version.Updater,
                Submitter = v.Version.Submitter
            }).ToList();

            return new PaginatedResult<LinePriceInfoVersionDto>
            {
                Items = versionDtos,
                TotalCount = count,
                Page = page,
                PageSize = pageSize
            };
        }

        // GET: api/LinePrices/Versions/{versionId}
        [HttpGet("Versions/{versionId}")]
        public async Task<ActionResult<LinePriceInfoVersionDto>> GetLinePriceInfoVersion(int versionId)
        {
            // 获取当前用户的商户ID
            var currentUserMerchantId = await _userService.GetUserMerchantIdAsync(User);
            var isSystemAdmin = User.IsInRole("SystemAdmin");

            // 使用联结查询代替导航属性
            var result = await (from lpiv in _dbContext.LinePriceInfoVersions
                                join lpi in _dbContext.LinePriceInfos
                                    on lpiv.LinePriceInfoID equals lpi.ID
                                join merchant in _dbContext.Merchants
                                    on lpiv.MerchantID equals merchant.MerchantID
                                where lpiv.ID == versionId
                                select new { Version = lpiv, LinePriceInfo = lpi, MerchantName = merchant.Name })
                                .FirstOrDefaultAsync();

            if (result == null)
            {
                return NotFound();
            }

            var version = result.Version;

            // 如果不是系统管理员，只能查看自己商户的线路票价版本
            if (!isSystemAdmin && version.MerchantID != currentUserMerchantId)
            {
                return Forbid();
            }

            return new LinePriceInfoVersionDto
            {
                ID = version.ID,
                MerchantID = version.MerchantID,
                MerchantName = result.MerchantName,
                LinePriceInfoID = version.LinePriceInfoID,
                LineNumber = version.LineNumber,
                GroupNumber = version.GroupNumber,
                LineName = version.LineName,
                Fare = version.Fare,
                Version = version.Version,
                ExtraParams = string.IsNullOrEmpty(version.ExtraParamsJson) ? null : JsonSerializer.Deserialize<object>(version.ExtraParamsJson),
                CardDiscountInfo = string.IsNullOrEmpty(version.CardDiscountInfoJson) ? null : JsonSerializer.Deserialize<object>(version.CardDiscountInfoJson),
                Status = version.Status,
                IsPublished = version.IsPublished,
                FileVerID = version.FileVerID,
                CreateTime = version.CreateTime,
                UpdateTime = version.UpdateTime,
                SubmitTime = version.SubmitTime,
                Creator = version.Creator,
                Updater = version.Updater,
                Submitter = version.Submitter
            };
        }

        // GET: api/LinePrices/Versions/{versionId}
        [HttpDelete("Versions/{versionId}")]
        public async Task<ActionResult<LinePriceInfoVersionDto>> DeleteLinePriceInfoVersion(int versionId)
        {
            // 获取当前用户的商户ID
            var currentUserMerchantId = await _userService.GetUserMerchantIdAsync(User);
            var isSystemAdmin = User.IsInRole("SystemAdmin");

            var version = await _dbContext.LinePriceInfoVersions.FindAsync(versionId);
            if (version == null)
            {
                return NotFound();
            }

            // 如果不是系统管理员，只能删除自己商户的线路票价信息
            if (!isSystemAdmin && version.MerchantID != currentUserMerchantId)
            {
                return Forbid();
            }

            // 只能删除草稿状态的版本
            if (version.Status != LinePriceVersionStatus.Draft)
            {
                return BadRequest("只能删除草稿状态的版本");
            }

            _dbContext.LinePriceInfoVersions.Remove(version);
            await _dbContext.SaveChangesAsync();

            return NoContent();
        }
        // POST: api/LinePrices/{linePriceInfoId}/Versions
        [HttpPost("{linePriceInfoId}/Versions")]
        public async Task<ActionResult<LinePriceInfoVersionDto>> CreateLinePriceInfoVersion(
            int linePriceInfoId, 
            CreateLinePriceInfoVersionDto model)
        {
            // 获取当前用户的商户ID和用户名
            var currentUserMerchantId = await _userService.GetUserMerchantIdAsync(User);
            var isSystemAdmin = User.IsInRole("SystemAdmin");
            var username = UserService.GetUserNameForOperator(User);

            // 先检查线路票价信息是否存在
            var linePriceInfo = await _dbContext.LinePriceInfos.FindAsync(linePriceInfoId);
            if (linePriceInfo == null)
            {
                return NotFound("线路票价信息不存在");
            }

            // 如果不是系统管理员，只能为自己商户的线路创建版本
            if (!isSystemAdmin && linePriceInfo.MerchantID != currentUserMerchantId)
            {
                return Forbid();
            }

            // 验证商户ID是否匹配
            if (model.MerchantID != linePriceInfo.MerchantID)
            {
                return BadRequest("商户ID与线路票价信息不一致");
            }

            // 获取商户信息
            var merchant = await _dbContext.Merchants
                .FirstOrDefaultAsync(m => m.MerchantID == linePriceInfo.MerchantID);

            if (merchant == null)
            {
                return BadRequest("商户不存在");
            }            
            // 如果未指定版本号，则基于当前版本号生成新版本号
            string versionNumber = model.Version ?? "";
            if (string.IsNullOrEmpty(versionNumber))
            {
                //查询最新版本号
                var maxVersion = await _dbContext.LinePriceInfoVersions
                    .Where(v => v.LinePriceInfoID == linePriceInfoId)
                    .OrderByDescending(v => v.CreateTime)
                    .Select(v => v.Version)
                    .FirstOrDefaultAsync();
                
                // 将当前版本号转换为16进制整数，加1，再转回16进制字符串
                int currentVersionInt = Convert.ToInt32(maxVersion??"0000", 16) % 0xFFFF; // 限制在4位16进制数范围内;
                versionNumber = (currentVersionInt + 1).ToString("X4");
            }

            // 创建版本记录
            var version = new LinePriceInfoVersion
            {
                MerchantID = linePriceInfo.MerchantID,
                LinePriceInfoID = linePriceInfoId,
                LineNumber = linePriceInfo.LineNumber,
                GroupNumber = linePriceInfo.GroupNumber,
                LineName = linePriceInfo.LineName,
                Fare = linePriceInfo.Fare,
                Version = versionNumber,
                ExtraParamsJson = model.ExtraParams != null ? JsonSerializer.Serialize(model.ExtraParams) : null,
                CardDiscountInfoJson = model.CardDiscountInfo != null ? JsonSerializer.Serialize(model.CardDiscountInfo) : null,
                Status = LinePriceVersionStatus.Draft,
                IsPublished = false,
                CreateTime = DateTime.Now,
                UpdateTime = DateTime.Now,
                Creator = username,
                Updater = username
            };

            _dbContext.LinePriceInfoVersions.Add(version);
            await _dbContext.SaveChangesAsync();

            return CreatedAtAction(nameof(GetLinePriceInfoVersion), new { versionId = version.ID }, new LinePriceInfoVersionDto
            {
                ID = version.ID,
                MerchantID = version.MerchantID,
                MerchantName = merchant.Name ?? "",
                LinePriceInfoID = version.LinePriceInfoID,
                LineNumber = version.LineNumber,
                GroupNumber = version.GroupNumber,
                LineName = version.LineName,
                Fare = version.Fare,
                Version = version.Version,
                ExtraParams = model.ExtraParams,
                CardDiscountInfo = model.CardDiscountInfo,
                Status = version.Status,
                IsPublished = version.IsPublished,
                FileVerID = version.FileVerID,
                CreateTime = version.CreateTime,
                UpdateTime = version.UpdateTime,
                SubmitTime = version.SubmitTime,
                Creator = version.Creator,
                Updater = version.Updater,
                Submitter = version.Submitter
            });
        }

        // PUT: api/LinePrices/Versions/{versionId}
        [HttpPut("Versions/{versionId}")]
        public async Task<IActionResult> UpdateLinePriceInfoVersion(int versionId, UpdateLinePriceInfoVersionDto model)
        {
            // 获取当前用户的商户ID和用户名
            var currentUserMerchantId = await _userService.GetUserMerchantIdAsync(User);
            var isSystemAdmin = User.IsInRole("SystemAdmin");
            var username = UserService.GetUserNameForOperator(User);

            var version = await _dbContext.LinePriceInfoVersions.FindAsync(versionId);
            if (version == null)
            {
                return NotFound();
            }

            // 如果不是系统管理员，只能更新自己商户的线路票价版本
            if (!isSystemAdmin && version.MerchantID != currentUserMerchantId)
            {
                return Forbid();
            }

            // 只能更新草稿状态的版本
            if (version.Status != LinePriceVersionStatus.Draft)
            {
                return BadRequest("只能更新草稿状态的版本");
            }

            // 更新非空字段
            if (model.ExtraParams != null)
                version.ExtraParamsJson = JsonSerializer.Serialize(model.ExtraParams);

            if (model.CardDiscountInfo != null)
                version.CardDiscountInfoJson = JsonSerializer.Serialize(model.CardDiscountInfo);

            version.UpdateTime = DateTime.Now;
            version.Updater = username;

            await _dbContext.SaveChangesAsync();

            return NoContent();
        }        // POST: api/LinePrices/Versions/{versionId}/Submit
        [HttpPost("Versions/{versionId}/Submit")]
        public async Task<IActionResult> SubmitLinePriceInfoVersion(int versionId, SubmitLinePriceInfoVersionDto model)
        {
            // 获取当前用户的商户ID和用户名
            var currentUserMerchantId = await _userService.GetUserMerchantIdAsync(User);
            var isSystemAdmin = User.IsInRole("SystemAdmin");
            var username = UserService.GetUserNameForOperator(User);

            // 获取版本和线路票价信息
            var version = await _dbContext.LinePriceInfoVersions.FindAsync(versionId);
            if (version == null)
            {
                return NotFound("版本不存在");
            }

            // 验证商户ID
            if (version.MerchantID != model.MerchantID)
            {
                return BadRequest("商户ID不匹配");
            }

            // 如果不是系统管理员，只能提交自己商户的线路票价版本
            if (!isSystemAdmin && version.MerchantID != currentUserMerchantId)
            {
                return Forbid();
            }

            // 只能提交草稿状态的版本
            if (version.Status != LinePriceVersionStatus.Draft)
            {
                return BadRequest("只能提交草稿状态的版本");
            }

            // 检查版本信息是否完整
            if (string.IsNullOrEmpty(version.ExtraParamsJson) || string.IsNullOrEmpty(version.CardDiscountInfoJson))
            {
                return BadRequest("版本信息不完整，无法提交");
            }

            // 获取关联的线路票价信息
            var linePriceInfo = await _dbContext.LinePriceInfos.FindAsync(version.LinePriceInfoID);
            if (linePriceInfo == null)
            {
                return NotFound("线路票价信息不存在");
            }

            try
            {
                // 生成完整的票价参数文件内容
                var fileContent = GenerateLinePriceFileContent(version);
                if (fileContent == null)
                {
                    return BadRequest("生成票价文件内容失败");
                }

                // 将文件内容转换为JSON字符串
                string fileContentJson = JsonSerializer.Serialize(fileContent);
                version.FileContentJson = fileContentJson;
                byte[] fileContentBytes = Encoding.UTF8.GetBytes(fileContentJson);

                // 生成文件名
                string fileName = $"PZB_{version.LineNumber}{version.GroupNumber}_{version.Version}.json";

                // 保存到文件存储
                var filePath = await _fileService.SaveTemporaryFile(fileContentBytes, fileName, username);
                if (string.IsNullOrEmpty(filePath))
                {
                    return BadRequest("保存文件失败");
                }

                // 计算CRC
                string crc = CalculateCrc32(fileContentBytes);

                // 生成文件ID
                var fileId = Guid.NewGuid().ToString("N");

                // 创建上传文件记录
                var uploadFile = new UploadFile
                {
                    ID = fileId,
                    FileName = fileName,
                    FileSize = fileContentBytes.Length,
                    FilePath = filePath,
                    UploadTime = DateTime.Now,
                    Crc = crc,
                    UploadedBy = username,
                    ContentType = "application/json"
                };

                _dbContext.UploadFiles.Add(uploadFile);

                // 创建文件版本记录
                var filePara = version.LineNumber + version.GroupNumber; // 合并线路号和组号作为文件参数
                var fileFullType = $"{LINE_PRICE_FILE_TYPE}{filePara}";
                var fileVersion = new FileVer
                {
                    MerchantID = version.MerchantID,
                    FileTypeID = LINE_PRICE_FILE_TYPE,
                    FilePara = filePara,
                    FileFullType = fileFullType,
                    Ver = version.Version,
                    CreateTime = DateTime.Now,
                    UpdateTime = DateTime.Now,
                    UploadFileID = fileId,
                    FileSize = fileContentBytes.Length,
                    Crc = crc,
                    Operator = username,
                    IsDelete = false
                };

                _dbContext.FileVers.Add(fileVersion);

                // 更新版本状态
                version.Status = LinePriceVersionStatus.Submitted;
                version.SubmitTime = DateTime.Now;
                version.Submitter = username;
                version.FileVerID = fileVersion.ID; // 关联到文件版本

                // 更新线路票价信息的当前版本号
                linePriceInfo.CurrentVersion = version.Version;
                linePriceInfo.UpdateTime = DateTime.Now;
                linePriceInfo.Updater = username;

                await _dbContext.SaveChangesAsync();

                return Ok(new { message = "版本提交成功", fileVerID = fileVersion.ID });
            }
            catch (Exception ex)
            {
                return BadRequest($"提交失败：{ex.Message}");
            }
        }

        // POST: api/LinePrices/Versions/{versionId}/Preview
        [HttpPost("Versions/{versionId}/Preview")]
        public async Task<ActionResult<PreviewLinePriceFileResponseDto>> PreviewLinePriceFile(int versionId, PreviewLinePriceFileDto model)
        {
            // 获取当前用户的商户ID
            var currentUserMerchantId = await _userService.GetUserMerchantIdAsync(User);
            var isSystemAdmin = User.IsInRole("SystemAdmin");

            var version = await _dbContext.LinePriceInfoVersions.FindAsync(versionId);
            if (version == null)
            {
                return NotFound("版本不存在");
            }

            // 验证商户ID
            if (version.MerchantID != model.MerchantID)
            {
                return BadRequest("商户ID不匹配");
            }

            // 如果不是系统管理员，只能预览自己商户的线路票价文件
            if (!isSystemAdmin && version.MerchantID != currentUserMerchantId)
            {
                return Forbid();
            }            // 检查版本信息是否完整
            if (string.IsNullOrEmpty(version.ExtraParamsJson) || string.IsNullOrEmpty(version.CardDiscountInfoJson))
            {
                return BadRequest("版本信息不完整，无法预览");
            }            // 生成票价文件内容
            var fileContent = GenerateLinePriceFileContent(version);
            if (fileContent == null)
            {
                return BadRequest("生成票价文件内容失败");
            }

            return new PreviewLinePriceFileResponseDto { FileContent = fileContent };
        }

        [HttpPost("Versions/{versionId}/CopyCreate")]
        public async Task<ActionResult<LinePriceInfoVersionDto>> CopyLinePriceinfoVersion(int versionId)
        {
            // 获取当前用户的商户ID
            var currentUserMerchantId = await _userService.GetUserMerchantIdAsync(User);
            var username = UserService.GetUserNameForOperator(User);
            var isSystemAdmin = User.IsInRole("SystemAdmin");

            var version = await _dbContext.LinePriceInfoVersions.FindAsync(versionId);
            if (version == null)
            {
                return NotFound("版本不存在");
            }

            // 如果不是系统管理员，只能操作自己商户的线路票价文件
            if (!isSystemAdmin && version.MerchantID != currentUserMerchantId)
            {
                return Forbid();
            }

            // 获取商户信息
            var merchant = await _dbContext.Merchants
                .FirstOrDefaultAsync(m => m.MerchantID == version.MerchantID);

            if (merchant == null)
            {
                return BadRequest("商户不存在");
            } 

            // 先检查线路票价信息是否存在
            var linePriceInfo = await _dbContext.LinePriceInfos.FindAsync(version.LinePriceInfoID);
            if (linePriceInfo == null)
            {
                return NotFound("线路票价信息不存在");
            }

            // 如果不是系统管理员，只能为自己商户的线路创建版本
            if (!isSystemAdmin && linePriceInfo.MerchantID != currentUserMerchantId)
            {
                return Forbid();
            }

            //查询最新版本号
            var maxVersion = await _dbContext.LinePriceInfoVersions
                .Where(v => v.LinePriceInfoID == version.LinePriceInfoID)
                .OrderByDescending(v => v.CreateTime)
                .Select(v => v.Version)
                .FirstOrDefaultAsync();
            
            // 将当前版本号转换为16进制整数，加1，再转回16进制字符串
            int currentVersionInt = Convert.ToInt32(maxVersion??"0000", 16) % 0xFFFF; // 限制在4位16进制数范围内;
            var versionNumber = (currentVersionInt + 1).ToString("X4");

            // 创建版本记录
            var versionNew = new LinePriceInfoVersion
            {
                MerchantID = linePriceInfo.MerchantID,
                LinePriceInfoID = linePriceInfo.ID,
                LineNumber = linePriceInfo.LineNumber,
                GroupNumber = linePriceInfo.GroupNumber,
                LineName = linePriceInfo.LineName,
                Fare = linePriceInfo.Fare,
                Version = versionNumber,
                ExtraParamsJson = version.ExtraParamsJson,
                CardDiscountInfoJson = version.CardDiscountInfoJson,
                Status = LinePriceVersionStatus.Draft,
                IsPublished = false,
                CreateTime = DateTime.Now,
                UpdateTime = DateTime.Now,
                Creator = username,
                Updater = username
            };

            _dbContext.LinePriceInfoVersions.Add(versionNew);
            await _dbContext.SaveChangesAsync();


            return CreatedAtAction(nameof(GetLinePriceInfoVersion), new { versionId = version.ID }, new LinePriceInfoVersionDto
            {
                ID = versionNew.ID,
                MerchantID = versionNew.MerchantID,
                MerchantName = merchant.Name ?? "",
                LinePriceInfoID = versionNew.LinePriceInfoID,
                LineNumber = versionNew.LineNumber,
                GroupNumber = versionNew.GroupNumber,
                LineName = versionNew.LineName,
                Fare = versionNew.Fare,
                Version = versionNew.Version,
                ExtraParams = string.IsNullOrEmpty(versionNew.ExtraParamsJson) ? null : JsonSerializer.Deserialize<object>(versionNew.ExtraParamsJson),
                CardDiscountInfo = string.IsNullOrEmpty(versionNew.CardDiscountInfoJson) ? null : JsonSerializer.Deserialize<object>(versionNew.CardDiscountInfoJson),
                Status = versionNew.Status,
                IsPublished = versionNew.IsPublished,
                FileVerID = versionNew.FileVerID,
                CreateTime = versionNew.CreateTime,
                UpdateTime = versionNew.UpdateTime,
                SubmitTime = versionNew.SubmitTime,
                Creator = versionNew.Creator,
                Updater = versionNew.Updater,
                Submitter = versionNew.Submitter
            });
        }

        // POST: api/LinePrices/Versions/{versionId}/CopyToLines
        [HttpPost("Versions/{versionId}/CopyToLines")]
        public async Task<IActionResult> CopyLinePriceVersionToOtherLines(int versionId, CopyToLinesRequestDto model)
        {
            // 获取当前用户的商户ID和用户名
            var currentUserMerchantId = await _userService.GetUserMerchantIdAsync(User);
            var isSystemAdmin = User.IsInRole("SystemAdmin");
            var username = UserService.GetUserNameForOperator(User);

            // 验证参数
            if (model.TargetLineIds == null || !model.TargetLineIds.Any())
            {
                return BadRequest("目标线路ID不能为空");
            }

            // 获取要复制的版本
            var sourceVersion = await _dbContext.LinePriceInfoVersions
                .FirstOrDefaultAsync(v => v.ID == versionId);

            if (sourceVersion == null)
            {
                return NotFound("源版本不存在");
            }

            // 如果不是系统管理员，只能复制自己商户的版本
            if (!isSystemAdmin && sourceVersion.MerchantID != currentUserMerchantId)
            {
                return Forbid();
            }

            // 验证商户ID匹配
            if (sourceVersion.MerchantID != model.MerchantId)
            {
                return BadRequest("商户ID不匹配");
            }

            // 只能复制已提交状态的版本
            if (sourceVersion.Status != LinePriceVersionStatus.Submitted)
            {
                return BadRequest("只能复制已提交状态的版本");
            }

            // 获取目标线路信息列表，验证它们存在且属于同一商户
            var targetLines = await _dbContext.LinePriceInfos
                .Where(lpi => model.TargetLineIds.Contains(lpi.ID))
                .ToListAsync();

            if (targetLines.Count != model.TargetLineIds.Count)
            {
                return BadRequest("部分目标线路不存在");
            }

            // 验证目标线路是否全部属于同一商户
            if (targetLines.Any(lpi => lpi.MerchantID != sourceVersion.MerchantID))
            {
                return BadRequest("部分目标线路不属于指定商户");
            }


            // 查询每个目标线路的最新版本号
            var maxVersions = await _dbContext.LinePriceInfoVersions
                .Where(v => model.TargetLineIds.Contains(v.LinePriceInfoID))
                .GroupBy(v => v.LinePriceInfoID)
                .Select(g => new
                {
                    LinePriceInfoID = g.Key,
                    MaxVersion = g.OrderByDescending(v => v.CreateTime).Select(v => v.Version).FirstOrDefault()
                }).ToListAsync();

            // 开始复制操作
            List<LinePriceInfoVersion> newVersions = new List<LinePriceInfoVersion>();
            foreach (var targetLine in targetLines)
            {
                // 将当前版本号转换为16进制整数，加1，再转回16进制字符串
                int currentVersionInt = Convert.ToInt32(maxVersions.FirstOrDefault(m => m.LinePriceInfoID == targetLine.ID)?.MaxVersion ?? "0000", 16) % 0xFFFF; // 限制在4位16进制数范围内

                // 为每条目标线路创建一个新的版本（草稿状态）
                var newVersion = new LinePriceInfoVersion
                {
                    MerchantID = sourceVersion.MerchantID,
                    LinePriceInfoID = targetLine.ID,
                    LineNumber = targetLine.LineNumber,
                    GroupNumber = targetLine.GroupNumber,
                    LineName = targetLine.LineName,
                    Fare = targetLine.Fare,
                    Version = (currentVersionInt + 1).ToString("X4"),
                    ExtraParamsJson = sourceVersion.ExtraParamsJson,
                    CardDiscountInfoJson = sourceVersion.CardDiscountInfoJson,
                    Status = LinePriceVersionStatus.Draft,
                    IsPublished = false,
                    CreateTime = DateTime.Now,
                    UpdateTime = DateTime.Now,
                    Creator = username,
                    Updater = username
                };
                newVersions.Add(newVersion);
            }

            // 批量保存所有新版本
            _dbContext.LinePriceInfoVersions.AddRange(newVersions);
            await _dbContext.SaveChangesAsync();

            return Ok(new
            {
                Message = $"已成功复制到 {newVersions.Count} 条线路",
                SuccessCount = newVersions.Count,
                TargetCount = model.TargetLineIds.Count
            });
        }

        

        // POST: api/LinePrices/Versions/{versionId}/Publish
        [HttpPost("Versions/{versionId}/Publish")]
        public async Task<ActionResult<LinePriceInfoVersionDto>> PublishLinePriceFile(int versionId)
        {
            // 获取当前用户的商户ID和用户名
            var currentUserMerchantId = await _userService.GetUserMerchantIdAsync(User);
            var isSystemAdmin = User.IsInRole("SystemAdmin");
            var username = UserService.GetUserNameForOperator(User);

            var version = await _dbContext.LinePriceInfoVersions.FindAsync(versionId);
            if (version == null)
            {
                return NotFound("版本不存在");
            }

            // 如果不是系统管理员，只能发布自己商户的线路票价文件
            if (!isSystemAdmin && version.MerchantID != currentUserMerchantId)
            {
                return Forbid();
            }

            // 只能发布已提交状态的版本
            if (version.Status != LinePriceVersionStatus.Submitted)
            {
                return BadRequest("只能发布已提交状态的版本");
            }

            // 如果已经发布过，则不能再次发布
            if (version.IsPublished && version.FileVerID.HasValue)
            {
                return BadRequest("该版本已经发布，不能重复发布");
            }            // 获取文件内容
            object? fileContent;
            if (!string.IsNullOrEmpty(version.FileContentJson))
            {
                fileContent = JsonSerializer.Deserialize<object>(version.FileContentJson);
                if (fileContent == null)
                {
                    return BadRequest("反序列化保存的文件内容失败");
                }
            }
            else
            {
                fileContent = GenerateLinePriceFileContent(version);
                if (fileContent == null)
                {
                    return BadRequest("生成票价文件内容失败");
                }
            }

            // 将文件内容转换为JSON字符串
            string fileContentJson = JsonSerializer.Serialize(fileContent);
            var fileContentBytes = Encoding.UTF8.GetBytes(fileContentJson);

            // 生成文件名
            string fileName = $"line_price_{version.MerchantID}_{version.LineNumber}_{version.GroupNumber}_{version.Version}.json";

            // 保存到文件存储
            var filePath = await _fileService.SaveTemporaryFile(fileContentBytes, fileName, username);

            // 计算CRC
            string crc = CalculateCrc32(fileContentBytes);

            // 生成文件ID
            var fileId = Guid.NewGuid().ToString("N");

            // 创建上传文件记录
            var uploadFile = new UploadFile
            {
                ID = fileId,
                FileName = fileName,
                FileSize = fileContentBytes.Length,
                FilePath = filePath,
                UploadTime = DateTime.Now,
                Crc = crc,
                UploadedBy = username,
                ContentType = "application/json"
            };

            _dbContext.UploadFiles.Add(uploadFile);

            // 创建文件版本记录
            var filePara = version.LineNumber + version.GroupNumber; // 合并线路号和组号作为文件参数
            var fileFullType = $"{LINE_PRICE_FILE_TYPE}{filePara}";
            var fileVersion = new FileVer
            {
                MerchantID = version.MerchantID,
                FileTypeID = LINE_PRICE_FILE_TYPE,
                FilePara = filePara,
                FileFullType = fileFullType,
                Ver = version.Version,
                CreateTime = DateTime.Now,
                UpdateTime = DateTime.Now,
                UploadFileID = fileId,
                FileSize = fileContentBytes.Length,
                Crc = crc,
                Operator = username,
                IsDelete = false
            };

            _dbContext.FileVers.Add(fileVersion);
            await _dbContext.SaveChangesAsync();

            // 更新版本的发布状态
            version.IsPublished = true;
            version.FileVerID = fileVersion.ID;
            version.UpdateTime = DateTime.Now;
            version.Updater = username;

            await _dbContext.SaveChangesAsync();

            // 返回文件发布结果
            return new LinePriceInfoVersionDto
            {
                ID = version.ID,
                MerchantID = version.MerchantID,
                LineNumber = version.LineNumber,
                GroupNumber = version.GroupNumber,
                Version = version.Version,
                IsPublished = version.IsPublished,
                FileVerID = version.FileVerID
            };
        }

        // GET: api/LinePrices/DictionaryConfig/{dictionaryType}
        [HttpGet("DictionaryConfig/{merchantId}/{dictionaryType}")]
        public async Task<ActionResult<List<DictionaryConfigDto>>> GetDictionaryConfig(string merchantId,string dictionaryType)
        {
            // 获取当前用户的商户ID
            var currentUserMerchantId = await _userService.GetUserMerchantIdAsync(User);
            var isSystemAdmin = User.IsInRole("SystemAdmin");

            if (string.IsNullOrEmpty(dictionaryType))
            {
                return BadRequest("字典类型不能为空");
            }

            if(isSystemAdmin!= true && currentUserMerchantId != merchantId)
            {
                return BadRequest("无权限访问其他商户的字典配置");
            }

            // 查询指定类型的字典配置
            var query = from dict in _dbContext.MerchantDictionaries
                        where dict.MerchantID == merchantId && dict.DictionaryType == dictionaryType && dict.IsActive
                        orderby dict.MerchantID == currentUserMerchantId descending, dict.SortOrder
                        select dict;

            // 获取字典配置列表
            var dictionaries = await query.ToListAsync();


            // 转换为DTO
            var configDtos = dictionaries.Select(dict => new DictionaryConfigDto
            {
                DictionaryCode = dict.DictionaryCode,
                DictionaryLabel = dict.DictionaryLabel,
                DictionaryValue = dict.DictionaryValue,
                ControlType = dict.ExtraValue1, // 控件类型
                ControlConfig = !string.IsNullOrEmpty(dict.ExtraValue2) ? JsonSerializer.Deserialize<object>(dict.ExtraValue2) : null // 控件配置
            }).ToList();

            return configDtos;
        }

        #endregion

        #region Helper Methods        // 生成票价文件内容
        private object? GenerateLinePriceFileContent(LinePriceInfoVersion version)
        {
            try
            {
                // 获取额外参数和卡类信息
                var extraParams = !string.IsNullOrEmpty(version.ExtraParamsJson)
                    ? JsonSerializer.Deserialize<Dictionary<string, object>>(version.ExtraParamsJson)
                    : new Dictionary<string, object>();

                var cardDiscountInfo = !string.IsNullOrEmpty(version.CardDiscountInfoJson)
                    ? JsonSerializer.Deserialize<List<Dictionary<string, object>>>(version.CardDiscountInfoJson)
                    : new List<Dictionary<string, object>>();

                //过滤掉cardDiscountInfo的object中值为null的项
                if (cardDiscountInfo != null)
                {
                    cardDiscountInfo = cardDiscountInfo
                        .Select(dict => dict.Where(kvp => kvp.Value != null && !string.IsNullOrWhiteSpace(kvp.Value.ToString())).ToDictionary(kvp => kvp.Key, kvp => kvp.Value))
                        .ToList();
                }

                // 创建文件内容
                var content = new Dictionary<string, object>
                {
                    { "lineNumber", version.LineNumber },
                    { "lineName", version.LineName },
                    { "fare", version.Fare.ToString() },
                    { "groupNumber", version.GroupNumber }
                };

                // 添加额外参数
                if (extraParams != null)
                {
                    foreach (var param in extraParams)
                    {
                        if (!content.ContainsKey(param.Key) && param.Value != null && !string.IsNullOrWhiteSpace(param.Value.ToString()))
                        {
                            content.Add(param.Key, param.Value);
                        }
                    }
                }

                // 添加卡类折扣信息
                if (cardDiscountInfo != null && cardDiscountInfo.Count > 0)
                {
                    content.Add("cardDiscountInformation", cardDiscountInfo);
                }

                // 创建完整文件结构
                var fileContent = new Dictionary<string, object>
                {
                    { "type", LINE_PRICE_FILE_TYPE },
                    { "para", $"{version.LineNumber}{version.GroupNumber}" },
                    { "name", "线路票价文件" },
                    { "version", version.Version },
                    { "datetime", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") },
                    { "content", content }
                };

                return fileContent;
            }
            catch (Exception)
            {
                return null;
            }
        }

        // 计算CRC32
        private string CalculateCrc32(byte[] data)
        {
            return SlzrCrossGate.Common.CRC.calFileCRC(data).ToString("X2").PadLeft(8, '0');
        }

        // 验证线路号格式，必须为4位数字
        private bool IsValidLineNumber(string lineNumber)
        {
            return !string.IsNullOrEmpty(lineNumber) && lineNumber.Length == 4 && lineNumber.All(char.IsDigit);
        }

        // 验证组号格式，必须为2位数字
        private bool IsValidGroupNumber(string groupNumber)
        {
            return !string.IsNullOrEmpty(groupNumber) && groupNumber.Length == 2 && groupNumber.All(char.IsDigit);
        }

        #endregion
    }
}
