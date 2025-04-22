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
    public class DashboardController : ControllerBase
    {
        private readonly TcpDbContext _dbContext;
        private readonly UserService _userService;
        private readonly ILogger<DashboardController> _logger;

        public DashboardController(
            TcpDbContext dbContext,
            UserService userService,
            ILogger<DashboardController> logger)
        {
            _dbContext = dbContext;
            _userService = userService;
            _logger = logger;
        }

        // GET: api/Dashboard/MerchantStats
        [HttpGet("MerchantStats")]
        public async Task<ActionResult<MerchantDashboardDto>> GetMerchantStats([FromQuery] string? merchantId = null)
        {
            // 获取当前用户的商户ID
            var currentUserMerchantId = await _userService.GetUserMerchantIdAsync(User);
            var isSystemAdmin = User.IsInRole("SystemAdmin");

            // 如果不是系统管理员，只能查看自己商户的统计
            if (!isSystemAdmin && merchantId != null && merchantId != currentUserMerchantId)
            {
                return Forbid();
            }

            // 如果不是系统管理员且未指定商户ID，则使用当前用户的商户ID
            if (!isSystemAdmin && merchantId == null)
            {
                merchantId = currentUserMerchantId;
            }

            // 如果未指定商户ID且是系统管理员，则返回错误
            if (string.IsNullOrEmpty(merchantId))
            {
                return BadRequest("必须指定商户ID");
            }

            // 获取终端统计
            var terminals = await _dbContext.Terminals
                .Include(t => t.Status)
                .Where(t => t.MerchantID == merchantId && !t.IsDeleted)
                .ToListAsync();

            var totalTerminals = terminals.Count;
            var activeTerminals = terminals.Count(t => t.Status != null && t.Status.ActiveStatus == DeviceActiveStatus.Active);
            var inactiveTerminals = terminals.Count(t => t.Status == null || t.Status.ActiveStatus == DeviceActiveStatus.Inactive);

            // 获取消息统计
            var totalMessages = await _dbContext.MsgBoxes
                .Where(m => m.MerchantID == merchantId)
                .CountAsync();

            var readMessages = await _dbContext.MsgBoxes
                .Where(m => m.MerchantID == merchantId && m.Status==MessageStatus.Replied)
                .CountAsync();

            var unreadMessages = await _dbContext.MsgBoxes
                .Where(m => m.MerchantID == merchantId && m.Status==MessageStatus.Unread)
                .CountAsync();

            // 获取文件统计
            var totalFileTypes = await _dbContext.FileTypes
                .Where(f => f.MerchantID == merchantId)
                .CountAsync();

            var totalFileVersions = await _dbContext.FileVers
                .Where(f => f.MerchantID == merchantId && !f.IsDelete)
                .CountAsync();

            var totalFilePublishes = await _dbContext.FilePublishs
                .Where(f => f.MerchantID == merchantId)
                .CountAsync();

            // 获取最近7天的终端事件统计
            var last7Days = Enumerable.Range(0, 7)
                .Select(i => DateTime.Today.AddDays(-i))
                .ToList();

            var terminalEventStats = new List<DailyEventStatsDto>();

            foreach (var date in last7Days)
            {
                var nextDate = date.AddDays(1);
                var count = await _dbContext.TerminalEvents
                    .Where(e => e.MerchantID == merchantId && e.EventTime >= date && e.EventTime < nextDate)
                    .CountAsync();

                terminalEventStats.Add(new DailyEventStatsDto
                {
                    Date = date,
                    Count = count
                });
            }

            // 获取终端类型分布
            var terminalTypeStats = terminals
                .GroupBy(t => t.TerminalType)
                .Select(g => new TerminalTypeStatsDto
                {
                    Type = g.Key,
                    Count = g.Count()
                })
                .ToList();

            // 获取线路分布
            var lineStats = terminals
                .GroupBy(t => t.LineNO)
                .Select(g => new LineStatsDto
                {
                    LineNo = g.Key,
                    Count = g.Count(),
                    ActiveCount = g.Count(t => t.Status != null && t.Status.ActiveStatus == DeviceActiveStatus.Active)
                })
                .ToList();

            // 获取最近的终端事件
            var recentEvents = await _dbContext.TerminalEvents
                .Where(e => e.MerchantID == merchantId)
                .OrderByDescending(e => e.EventTime)
                .Take(10)
                .Select(e => new TerminalEventDto
                {
                    ID = e.ID,
                    MerchantID = e.MerchantID,
                    TerminalID = e.TerminalID,
                    EventTime = e.EventTime,
                    EventName = e.EventName,
                    EventType = e.EventType,
                    Severity = e.Severity,
                    Remark = e.Remark,
                    Operator = e.Operator
                })
                .ToListAsync();

            return new MerchantDashboardDto
            {
                MerchantId = merchantId,
                TerminalStats = new TerminalStatsDto
                {
                    TotalCount = totalTerminals,
                    ActiveCount = activeTerminals,
                    InactiveCount = inactiveTerminals
                },
                MessageStats = new MessageStatsDto
                {
                    TotalCount = totalMessages,
                    ReadCount = readMessages,
                    UnreadCount = unreadMessages,
                    DailyStats = new List<DailyMessageStatsDto>() // 暂不提供每日消息统计
                },
                FileStats = new FileStatsDto
                {
                    TotalFileTypes = totalFileTypes,
                    TotalFileVersions = totalFileVersions,
                    TotalFilePublishes = totalFilePublishes
                },
                TerminalEventStats = terminalEventStats,
                TerminalTypeStats = terminalTypeStats,
                LineStats = lineStats,
                RecentEvents = recentEvents
            };
        }

        // GET: api/Dashboard/PlatformStats
        [HttpGet("PlatformStats")]
        [Authorize(Roles = "SystemAdmin")]
        public async Task<ActionResult<PlatformDashboardDto>> GetPlatformStats()
        {
            // 获取商户统计
            var totalMerchants = await _dbContext.Merchants.CountAsync();

            // 获取终端统计
            var totalTerminals = await _dbContext.Terminals
                .Where(t => !t.IsDeleted)
                .CountAsync();

            var activeTerminals = await _dbContext.Terminals
                .Include(t => t.Status)
                .Where(t => !t.IsDeleted && t.Status != null && t.Status.ActiveStatus == DeviceActiveStatus.Active)
                .CountAsync();

            var inactiveTerminals = totalTerminals - activeTerminals;

            // 获取消息统计
            var totalMessages = await _dbContext.MsgBoxes.CountAsync();
            var readMessages = await _dbContext.MsgBoxes.Where(m => m.Status == MessageStatus.Read || m.Status == MessageStatus.Replied).CountAsync();
            var unreadMessages = totalMessages - readMessages;

            // 获取文件统计
            var totalFileTypes = await _dbContext.FileTypes.CountAsync();
            var totalFileVersions = await _dbContext.FileVers.Where(f => !f.IsDelete).CountAsync();
            var totalFilePublishes = await _dbContext.FilePublishs.CountAsync();

            // 获取最近7天的终端事件统计
            var last7Days = Enumerable.Range(0, 7)
                .Select(i => DateTime.Today.AddDays(-i))
                .ToList();

            var terminalEventStats = new List<DailyEventStatsDto>();

            foreach (var date in last7Days)
            {
                var nextDate = date.AddDays(1);
                var count = await _dbContext.TerminalEvents
                    .Where(e => e.EventTime >= date && e.EventTime < nextDate)
                    .CountAsync();

                terminalEventStats.Add(new DailyEventStatsDto
                {
                    Date = date,
                    Count = count
                });
            }

            // 获取商户终端分布
            var merchantTerminalStats = await _dbContext.Terminals
                .Where(t => !t.IsDeleted)
                .GroupBy(t => t.MerchantID)
                .Select(g => new MerchantTerminalStatsDto
                {
                    MerchantId = g.Key,
                    TerminalCount = g.Count()
                })
                .ToListAsync();

            // 获取终端类型分布
            var terminalTypeStats = await _dbContext.Terminals
                .Where(t => !t.IsDeleted)
                .GroupBy(t => t.TerminalType)
                .Select(g => new TerminalTypeStatsDto
                {
                    Type = g.Key,
                    Count = g.Count()
                })
                .ToListAsync();

            // 获取最近的终端事件
            var recentEvents = await _dbContext.TerminalEvents
                .OrderByDescending(e => e.EventTime)
                .Take(10)
                .Select(e => new TerminalEventDto
                {
                    ID = e.ID,
                    MerchantID = e.MerchantID,
                    TerminalID = e.TerminalID,
                    EventTime = e.EventTime,
                    EventName = e.EventName,
                    EventType = e.EventType,
                    Severity = e.Severity,
                    Remark = e.Remark,
                    Operator = e.Operator
                })
                .ToListAsync();

            return new PlatformDashboardDto
            {
                MerchantCount = totalMerchants,
                TerminalStats = new TerminalStatsDto
                {
                    TotalCount = totalTerminals,
                    ActiveCount = activeTerminals,
                    InactiveCount = inactiveTerminals
                },
                MessageStats = new MessageStatsDto
                {
                    TotalCount = totalMessages,
                    ReadCount = readMessages,
                    UnreadCount = unreadMessages,
                    DailyStats = new List<DailyMessageStatsDto>() // 暂不提供每日消息统计
                },
                FileStats = new FileStatsDto
                {
                    TotalFileTypes = totalFileTypes,
                    TotalFileVersions = totalFileVersions,
                    TotalFilePublishes = totalFilePublishes
                },
                TerminalEventStats = terminalEventStats,
                MerchantTerminalStats = merchantTerminalStats,
                TerminalTypeStats = terminalTypeStats,
                RecentEvents = recentEvents
            };
        }

        // GET: api/Dashboard/SystemInfo
        [HttpGet("SystemInfo")]
        [Authorize(Roles = "SystemAdmin")]
        public ActionResult<SystemInfoDto> GetSystemInfo()
        {
            var systemInfo = new SystemInfoDto
            {
                ServerTime = DateTime.Now,
                ServerTimeZone = TimeZoneInfo.Local.DisplayName,
                ServerOS = Environment.OSVersion.ToString(),
                ServerHostName = Environment.MachineName,
                DotNetVersion = Environment.Version.ToString(),
                ProcessorCount = Environment.ProcessorCount,
                SystemMemory = GetSystemMemory(),
                ProcessStartTime = System.Diagnostics.Process.GetCurrentProcess().StartTime,
                ProcessMemoryUsage = System.Diagnostics.Process.GetCurrentProcess().WorkingSet64 / (1024 * 1024) // MB
            };

            return systemInfo;
        }

        private long GetSystemMemory()
        {
            try
            {
                // 使用 GC.GetGCMemoryInfo 代替 Microsoft.VisualBasic.Devices.ComputerInfo
                return GC.GetGCMemoryInfo().TotalAvailableMemoryBytes / (1024 * 1024); // MB
            }
            catch
            {
                return 0;
            }
        }
    }
}
