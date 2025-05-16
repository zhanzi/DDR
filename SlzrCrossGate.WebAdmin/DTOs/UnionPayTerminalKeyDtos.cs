using SlzrCrossGate.Core.Models;

namespace SlzrCrossGate.WebAdmin.DTOs
{
    // 银联终端密钥DTO
    public class UnionPayTerminalKeyDto
    {
        public int ID { get; set; }
        public string MerchantID { get; set; } = string.Empty;
        public string MerchantName { get; set; } = string.Empty;
        public string UP_MerchantID { get; set; } = string.Empty;
        public string UP_TerminalID { get; set; } = string.Empty;
        public string UP_Key { get; set; } = string.Empty;
        public string? UP_MerchantName { get; set; }
        public bool IsInUse { get; set; }
        public string? MachineID { get; set; }
        public string? LineID { get; set; }
        public string? MachineNO { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    // 创建银联终端密钥DTO
    public class CreateUnionPayTerminalKeyDto
    {
        public string MerchantID { get; set; } = string.Empty;
        public string UP_MerchantID { get; set; } = string.Empty;
        public string UP_TerminalID { get; set; } = string.Empty;
        public string UP_Key { get; set; } = string.Empty;
        public string? UP_MerchantName { get; set; }
    }

    // 更新银联终端密钥DTO
    public class UpdateUnionPayTerminalKeyDto
    {
        public string UP_MerchantID { get; set; } = string.Empty;
        public string UP_TerminalID { get; set; } = string.Empty;
        public string UP_Key { get; set; } = string.Empty;
        public string? UP_MerchantName { get; set; }
    }

    // 导入银联终端密钥结果DTO
    public class ImportUnionPayTerminalKeyResultDto
    {
        public int TotalCount { get; set; }
        public int SuccessCount { get; set; }
        public int FailCount { get; set; }
        public List<string> Errors { get; set; } = new List<string>();
    }
}
