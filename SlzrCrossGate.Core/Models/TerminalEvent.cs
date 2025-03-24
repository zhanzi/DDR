using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SlzrCrossGate.Core.Models
{
    //终端事件记录
    public class TerminalEvent : ITenantEntity
    {
        [Key]
        public int ID { get; set; }
        [MaxLength(8)]
        public required string MerchantID { get; set; }
        [MaxLength(8)]
        public required string TerminalID { get; set; }
        public DateTime EventTime { get; set; }
        [MaxLength(100)]
        public required string EventName { get; set; }
        [MaxLength(2000)]
        public string? Remark { get; set; }
        [MaxLength(20)]
        public string? Operator { get; set; }
    }
}
