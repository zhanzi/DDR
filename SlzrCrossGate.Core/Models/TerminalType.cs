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
    public class TerminalType : ITenantEntity
    {
        [StringLength(3)]
        [Key]
        public required string Code { get; set; }
        [Key]
        [MaxLength(8)]
        public required string MerchantID { get; set; }
        [MaxLength(8)]
        public string? Name { get; set; }
        [MaxLength(200)]
        public string? Remark { get; set; }
    }
}
