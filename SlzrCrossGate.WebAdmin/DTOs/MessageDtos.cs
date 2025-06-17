using SlzrCrossGate.Core.Models;

namespace SlzrCrossGate.WebAdmin.DTOs
{
    // 消息类型DTO
    public class MessageTypeDto
    {
        public string Code { get; set; } = string.Empty;
        public string MerchantID { get; set; } = string.Empty;
        public string? Name { get; set; }
        public string? Remark { get; set; }
        public MessageCodeType CodeType { get; set; } = MessageCodeType.HEX;

        public string? ExampleMessage { get; set; }
        public string? MerchantName { get; set; }
    }
    public class CreateMessageTypeDto
    {
        public string Code { get; set; } = string.Empty;
        public string MerchantID { get; set; } = string.Empty;
        public string? Name { get; set; }
        public MessageCodeType CodeType { get; set; } = MessageCodeType.HEX;

        public string? ExampleMessage { get; set; }
        public string? Remark { get; set; }
    }

    public class UpdateMessageTypeDto
    {
        public string? Name { get; set; }
        public string? Remark { get; set; }
        public MessageCodeType CodeType { get; set; } = MessageCodeType.HEX;

        public string? ExampleMessage { get; set; }
    }

    // 消息DTO
    public class MessageDto
    {
        public int ID { get; set; }
        public string MerchantID { get; set; } = string.Empty;
        public string TerminalID { get; set; } = string.Empty;
        public int MsgContentID { get; set; }
        public DateTime CreateTime { get; set; }
        public bool IsRead { get; set; }
        public DateTime? ReadTime { get; set; }

        // 关联信息
        public string? MerchantName { get; set; }
        public string? TerminalDeviceNO { get; set; }
        public string? TerminalLineNO { get; set; }
        public string? MsgTypeID { get; set; }
        public string? MsgTypeName { get; set; }
        public string? Content { get; set; }
        public string? Operator { get; set; }
    }

    // 发送消息DTO
    public class SendMessageDto
    {
        public List<string> TerminalIds { get; set; } = new List<string>();
        public string MsgTypeCode { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
    }

    // 按线路发送消息DTO
    public class SendMessageByLineDto
    {
        public string MerchantId { get; set; } = string.Empty;
        public string LineNo { get; set; } = string.Empty;
        public string MsgTypeCode { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
    }

    // 向商户发送消息DTO
    public class SendMessageToMerchantDto
    {
        public string MerchantId { get; set; } = string.Empty;
        public string MsgTypeCode { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
    }

    // 消息发送结果DTO
    public class MessageSendResultDto
    {
        public int MessageId { get; set; }
        public int TerminalCount { get; set; }
        public string? MessageType { get; set; }
        public string Content { get; set; } = string.Empty;
        public DateTime SendTime { get; set; }
    }

    // 消息统计DTO
    public class MessageStatsDto
    {
        public int TotalCount { get; set; }
        public int ReadCount { get; set; }
        public int UnreadCount { get; set; }
        public List<DailyMessageStatsDto> DailyStats { get; set; } = new List<DailyMessageStatsDto>();
    }

    // 每日消息统计DTO
    public class DailyMessageStatsDto
    {
        public DateTime Date { get; set; }
        public int Count { get; set; }
    }
}
