using SlzrCrossGate.Core.Models;

namespace SlzrCrossGate.WebAdmin.DTOs
{
    public class TerminalDto
    {
        public string ID { get; set; } = string.Empty;
        public string MerchantID { get; set; } = string.Empty;
        public string MachineID { get; set; } = string.Empty;
        public string DeviceNO { get; set; } = string.Empty;
        public string LineNO { get; set; } = string.Empty;
        public string TerminalType { get; set; } = string.Empty;
        public DateTime CreateTime { get; set; }
        public TerminalStatusDto? Status { get; set; }
    }

    public class TerminalStatusDto
    {
        public DeviceActiveStatus ActiveStatus { get; set; }
        public DateTime LastActiveTime { get; set; }
        public string ConnectionProtocol { get; set; } = string.Empty;
        public string EndPoint { get; set; } = string.Empty;
        public Dictionary<string, VersionOptions> FileVersionMetadata { get; set; } = new Dictionary<string, VersionOptions>();
        public Dictionary<string, string> PropertyMetadata { get; set; } = new Dictionary<string, string>();
    }

    public class TerminalEventDto
    {
        public int ID { get; set; }
        public string MerchantID { get; set; } = string.Empty;
        public string TerminalID { get; set; } = string.Empty;
        public DateTime EventTime { get; set; }
        public string EventName { get; set; } = string.Empty;
        public TerminalEventType EventType { get; set; }
        public EventSeverity Severity { get; set; }
        public string? Remark { get; set; }
        public string? Operator { get; set; }
    }

    public class TerminalStatsDto
    {
        public int TotalCount { get; set; }
        public int ActiveCount { get; set; }
        public int InactiveCount { get; set; }
    }

    public class SendMessageDto
    {
        public List<string> TerminalIds { get; set; } = new List<string>();
        public string MsgTypeCode { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
    }

    public class PublishFileDto
    {
        public List<string> TerminalIds { get; set; } = new List<string>();
        public int FileVerId { get; set; }
    }

    public class PaginatedResult<T>
    {
        public List<T> Items { get; set; } = new List<T>();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
    }
}
