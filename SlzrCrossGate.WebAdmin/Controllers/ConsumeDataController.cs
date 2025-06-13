using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SlzrCrossGate.Core.Database;
using SlzrCrossGate.Core.Service.BusinessServices;
using SlzrCrossGate.WebAdmin.DTOs;
using System.Security.Claims;
using System.Text;

namespace SlzrCrossGate.WebAdmin.Controllers
{
    /// <summary>
    /// 终端记录控制器
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "SystemAdmin,MerchantAdmin")]
    public class ConsumeDataController : ControllerBase
    {
        private readonly ConsumeDataService _consumeDataService;
        private readonly TcpDbContext _dbContext;
        private readonly ILogger<ConsumeDataController> _logger;

        public ConsumeDataController(
            ConsumeDataService consumeDataService,
            TcpDbContext dbContext,
            ILogger<ConsumeDataController> logger)
        {
            _consumeDataService = consumeDataService;
            _dbContext = dbContext;
            _logger = logger;
        }

        /// <summary>
        /// 分页查询终端记录
        /// </summary>
        /// <param name="query">查询参数</param>
        /// <returns>分页查询结果</returns>
        [HttpGet]
        public async Task<ActionResult<PagedResult<ConsumeDataDto>>> GetConsumeData([FromQuery] ConsumeDataQueryDto query)
        {
            try
            {
                // 检查权限和商户限制
                var userMerchantId = GetUserMerchantId();
                var effectiveMerchantId = GetEffectiveMerchantId(query.MerchantID, userMerchantId);

                // 执行查询
                var (items, totalCount) = await _consumeDataService.GetPagedConsumeDataAsync(
                    merchantId: effectiveMerchantId,
                    machineId: query.MachineID,
                    machineNo: query.MachineNO,
                    startTime: query.StartTime,
                    endTime: query.EndTime,
                    page: query.Page,
                    pageSize: query.PageSize,
                    sortBy: query.SortBy ?? "ReceiveTime",
                    sortDirection: query.SortDirection ?? "desc"
                );

                // 获取商户名称映射
                var merchantIds = items.Select(i => i.MerchantID).Where(id => !string.IsNullOrEmpty(id)).Distinct().Cast<string>().ToList();
                var merchantNames = await GetMerchantNamesAsync(merchantIds);

                // 转换为DTO
                var dtoItems = items.Select(item => new ConsumeDataDto
                {
                    Id = item.Id,
                    MerchantID = item.MerchantID,
                    MerchantName = merchantNames.GetValueOrDefault(item.MerchantID ?? "", ""),
                    MachineID = item.MachineID,
                    MachineNO = item.MachineNO,
                    PsamNO = item.PsamNO,
                    BufferHex = Convert.ToHexString(item.Buffer),
                    ReceiveTime = item.ReceiveTime
                }).ToList();

                var result = new PagedResult<ConsumeDataDto>
                {
                    Items = dtoItems,
                    TotalCount = totalCount,
                    Page = query.Page,
                    PageSize = query.PageSize
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "查询终端记录时发生错误");
                return StatusCode(500, new { message = "查询终端记录失败", error = ex.Message });
            }
        }

        /// <summary>
        /// 导出终端记录为CSV文件
        /// </summary>
        /// <param name="query">查询参数</param>
        /// <returns>CSV文件</returns>
        [HttpGet("export")]
        public async Task<IActionResult> ExportConsumeData([FromQuery] ConsumeDataQueryDto query)
        {
            try
            {
                // 检查权限和商户限制
                var userMerchantId = GetUserMerchantId();
                var effectiveMerchantId = GetEffectiveMerchantId(query.MerchantID, userMerchantId);

                // 获取导出数据（限制最大10000条记录）
                var items = await _consumeDataService.GetConsumeDataForExportAsync(
                    merchantId: effectiveMerchantId,
                    machineId: query.MachineID,
                    machineNo: query.MachineNO,
                    startTime: query.StartTime,
                    endTime: query.EndTime,
                    maxRecords: 10000
                );

                // 生成CSV内容（只包含交易数据的HEX格式，每行一条记录）
                var csvContent = new StringBuilder();
                foreach (var item in items)
                {
                    var hexString = Convert.ToHexString(item.Buffer);
                    csvContent.AppendLine(hexString);
                }

                // 生成文件名
                var fileName = $"terminal_records_{DateTime.Now:yyyyMMdd_HHmmss}.csv";

                // 返回文件
                var bytes = Encoding.UTF8.GetBytes(csvContent.ToString());
                return File(bytes, "text/csv", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "导出终端记录时发生错误");
                return StatusCode(500, new { message = "导出终端记录失败", error = ex.Message });
            }
        }

        /// <summary>
        /// 获取当前用户的商户ID
        /// </summary>
        /// <returns>商户ID，如果是系统管理员则返回null</returns>
        private string? GetUserMerchantId()
        {
            var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();

            // 系统管理员可以查看所有商户的数据
            if (roles.Contains("SystemAdmin"))
            {
                return null;
            }

            // 商户管理员只能查看自己商户的数据
            var merchantIdClaim = User.FindFirst("MerchantId");
            return merchantIdClaim?.Value;
        }

        /// <summary>
        /// 获取有效的商户ID（考虑用户权限）
        /// </summary>
        /// <param name="requestedMerchantId">请求的商户ID</param>
        /// <param name="userMerchantId">用户的商户ID</param>
        /// <returns>有效的商户ID</returns>
        private string? GetEffectiveMerchantId(string? requestedMerchantId, string? userMerchantId)
        {
            // 如果用户是系统管理员（userMerchantId为null），使用请求的商户ID
            if (userMerchantId == null)
            {
                return requestedMerchantId;
            }

            // 如果用户是商户管理员，只能查看自己商户的数据
            return userMerchantId;
        }

        /// <summary>
        /// 获取商户名称映射
        /// </summary>
        /// <param name="merchantIds">商户ID列表</param>
        /// <returns>商户ID到名称的映射</returns>
        private async Task<Dictionary<string, string>> GetMerchantNamesAsync(List<string> merchantIds)
        {
            if (!merchantIds.Any())
            {
                return new Dictionary<string, string>();
            }

            var merchants = await _dbContext.Merchants
                .Where(m => merchantIds.Contains(m.MerchantID))
                .Select(m => new { m.MerchantID, m.Name })
                .ToListAsync();

            return merchants.ToDictionary(m => m.MerchantID, m => m.Name ?? "");
        }
    }
}
