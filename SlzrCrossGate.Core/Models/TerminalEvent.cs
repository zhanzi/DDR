using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SlzrCrossGate.Core.Models
{
    //终端事件记录
    public class TerminalEvent : ITenantEntity
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ID { get; set; }
        [MaxLength(8)]
        public required string MerchantID { get; set; }
        [MaxLength(8)]
        public required string TerminalID { get; set; }
        public DateTime EventTime { get; set; } = DateTime.Now;
        [MaxLength(100)]
        public required string EventName { get; set; }
        public TerminalEventType EventType { get; set; }
        public EventSeverity Severity { get; set; } // 添加事件严重性字段
        [MaxLength(2000)]
        public string? Remark { get; set; }
        [MaxLength(20)]
        public string? Operator { get; set; }
    }
}
