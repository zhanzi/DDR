using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using SlzrCrossGate.Core.Models;
using SlzrCrossGate.Core.Repositories;
using SlzrCrossGate.Core.Database;
using SlzrDatatransferModel;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SlzrCrossGate.Core.Service.BusinessServices
{
    public class ConsumeDataService
    {
        private readonly Repository<Models.ConsumeData> _consumeDataRepositry;
        private readonly TcpDbContext _dbContext;
        private readonly ILogger<ConsumeDataService> _logger;

        public ConsumeDataService(Repository<Models.ConsumeData> consumeDataRepositry, TcpDbContext dbContext, ILogger<ConsumeDataService> logger)
        {
            _consumeDataRepositry = consumeDataRepositry;
            _dbContext = dbContext;
            _logger = logger;
        }

        public async Task BatchInsert(IEnumerable<Models.ConsumeData> consumeDatas)
        {
            await _consumeDataRepositry.AddRangeAsync(consumeDatas);
        }

        /// <summary>
        /// 分页查询终端记录
        /// </summary>
        /// <param name="merchantId">商户ID（可选）</param>
        /// <param name="machineId">出厂序列号（可选）</param>
        /// <param name="machineNo">设备编号（可选）</param>
        /// <param name="startTime">开始时间（可选）</param>
        /// <param name="endTime">结束时间（可选）</param>
        /// <param name="page">页码（从1开始）</param>
        /// <param name="pageSize">每页条数</param>
        /// <param name="sortBy">排序字段</param>
        /// <param name="sortDirection">排序方向</param>
        /// <returns>分页查询结果</returns>
        public async Task<(List<Models.ConsumeData> Items, int TotalCount)> GetPagedConsumeDataAsync(
            string? merchantId = null,
            string? machineId = null,
            string? machineNo = null,
            DateTime? startTime = null,
            DateTime? endTime = null,
            int page = 1,
            int pageSize = 20,
            string sortBy = "ReceiveTime",
            string sortDirection = "desc")
        {
            var query = _dbContext.ConsumeDatas.AsQueryable();

            // 应用筛选条件
            if (!string.IsNullOrEmpty(merchantId))
            {
                query = query.Where(c => c.MerchantID == merchantId);
            }

            if (!string.IsNullOrEmpty(machineId))
            {
                query = query.Where(c => c.MachineID == machineId);
            }

            if (!string.IsNullOrEmpty(machineNo))
            {
                query = query.Where(c => c.MachineNO == machineNo);
            }

            if (startTime.HasValue)
            {
                query = query.Where(c => c.ReceiveTime >= startTime.Value);
            }

            if (endTime.HasValue)
            {
                query = query.Where(c => c.ReceiveTime <= endTime.Value);
            }

            // 获取总记录数
            var totalCount = await query.CountAsync();

            // 应用排序
            query = ApplySorting(query, sortBy, sortDirection);

            // 应用分页
            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, totalCount);
        }

        /// <summary>
        /// 获取终端记录用于导出（不分页）
        /// </summary>
        /// <param name="merchantId">商户ID（可选）</param>
        /// <param name="machineId">出厂序列号（可选）</param>
        /// <param name="machineNo">设备编号（可选）</param>
        /// <param name="startTime">开始时间（可选）</param>
        /// <param name="endTime">结束时间（可选）</param>
        /// <param name="maxRecords">最大记录数限制</param>
        /// <returns>终端记录列表</returns>
        public async Task<List<Models.ConsumeData>> GetConsumeDataForExportAsync(
            string? merchantId = null,
            string? machineId = null,
            string? machineNo = null,
            DateTime? startTime = null,
            DateTime? endTime = null,
            int maxRecords = 10000)
        {
            var query = _dbContext.ConsumeDatas.AsQueryable();

            // 应用筛选条件
            if (!string.IsNullOrEmpty(merchantId))
            {
                query = query.Where(c => c.MerchantID == merchantId);
            }

            if (!string.IsNullOrEmpty(machineId))
            {
                query = query.Where(c => c.MachineID == machineId);
            }

            if (!string.IsNullOrEmpty(machineNo))
            {
                query = query.Where(c => c.MachineNO == machineNo);
            }

            if (startTime.HasValue)
            {
                query = query.Where(c => c.ReceiveTime >= startTime.Value);
            }

            if (endTime.HasValue)
            {
                query = query.Where(c => c.ReceiveTime <= endTime.Value);
            }

            // 按接收时间降序排序，并限制记录数
            var items = await query
                .OrderByDescending(c => c.ReceiveTime)
                .Take(maxRecords)
                .ToListAsync();

            return items;
        }

        /// <summary>
        /// 应用排序
        /// </summary>
        private IQueryable<Models.ConsumeData> ApplySorting(IQueryable<Models.ConsumeData> query, string sortBy, string sortDirection)
        {
            var isDescending = sortDirection?.ToLower() == "desc";

            return sortBy?.ToLower() switch
            {
                "id" => isDescending ? query.OrderByDescending(c => c.Id) : query.OrderBy(c => c.Id),
                "merchantid" => isDescending ? query.OrderByDescending(c => c.MerchantID) : query.OrderBy(c => c.MerchantID),
                "machineid" => isDescending ? query.OrderByDescending(c => c.MachineID) : query.OrderBy(c => c.MachineID),
                "machineno" => isDescending ? query.OrderByDescending(c => c.MachineNO) : query.OrderBy(c => c.MachineNO),
                "psamno" => isDescending ? query.OrderByDescending(c => c.PsamNO) : query.OrderBy(c => c.PsamNO),
                "receivetime" or _ => isDescending ? query.OrderByDescending(c => c.ReceiveTime) : query.OrderBy(c => c.ReceiveTime),
            };
        }
    }
}
