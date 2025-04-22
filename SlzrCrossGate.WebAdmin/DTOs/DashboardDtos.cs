namespace SlzrCrossGate.WebAdmin.DTOs
{
    // 商户仪表盘DTO
    public class MerchantDashboardDto
    {
        public string MerchantId { get; set; } = string.Empty;
        public TerminalStatsDto TerminalStats { get; set; } = new TerminalStatsDto();
        public MessageStatsDto MessageStats { get; set; } = new MessageStatsDto();
        public FileStatsDto FileStats { get; set; } = new FileStatsDto();
        public List<DailyEventStatsDto> TerminalEventStats { get; set; } = new List<DailyEventStatsDto>();
        public List<TerminalTypeStatsDto> TerminalTypeStats { get; set; } = new List<TerminalTypeStatsDto>();
        public List<LineStatsDto> LineStats { get; set; } = new List<LineStatsDto>();
        public List<TerminalEventDto> RecentEvents { get; set; } = new List<TerminalEventDto>();
    }

    // 平台仪表盘DTO
    public class PlatformDashboardDto
    {
        public int MerchantCount { get; set; }
        public TerminalStatsDto TerminalStats { get; set; } = new TerminalStatsDto();
        public MessageStatsDto MessageStats { get; set; } = new MessageStatsDto();
        public FileStatsDto FileStats { get; set; } = new FileStatsDto();
        public List<DailyEventStatsDto> TerminalEventStats { get; set; } = new List<DailyEventStatsDto>();
        public List<MerchantTerminalStatsDto> MerchantTerminalStats { get; set; } = new List<MerchantTerminalStatsDto>();
        public List<TerminalTypeStatsDto> TerminalTypeStats { get; set; } = new List<TerminalTypeStatsDto>();
        public List<TerminalEventDto> RecentEvents { get; set; } = new List<TerminalEventDto>();
    }

    // 文件统计DTO
    public class FileStatsDto
    {
        public int TotalFileTypes { get; set; }
        public int TotalFileVersions { get; set; }
        public int TotalFilePublishes { get; set; }
    }

    // 每日事件统计DTO
    public class DailyEventStatsDto
    {
        public DateTime Date { get; set; }
        public int Count { get; set; }
    }

    // 终端类型统计DTO
    public class TerminalTypeStatsDto
    {
        public string Type { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    // 线路统计DTO
    public class LineStatsDto
    {
        public string LineNo { get; set; } = string.Empty;
        public int Count { get; set; }
        public int ActiveCount { get; set; }
    }

    // 商户终端统计DTO
    public class MerchantTerminalStatsDto
    {
        public string MerchantId { get; set; } = string.Empty;
        public int TerminalCount { get; set; }
    }

    // 系统信息DTO
    public class SystemInfoDto
    {
        public DateTime ServerTime { get; set; }
        public string ServerTimeZone { get; set; } = string.Empty;
        public string ServerOS { get; set; } = string.Empty;
        public string ServerHostName { get; set; } = string.Empty;
        public string DotNetVersion { get; set; } = string.Empty;
        public int ProcessorCount { get; set; }
        public long SystemMemory { get; set; } // MB
        public DateTime ProcessStartTime { get; set; }
        public long ProcessMemoryUsage { get; set; } // MB
    }
}
