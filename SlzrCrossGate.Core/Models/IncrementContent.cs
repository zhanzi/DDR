using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SlzrCrossGate.Core.Models
{
    public class IncrementContent : ITenantEntity
    {
        [StringLength(8)]
        public required string MerchantID { get; set; }
        [StringLength(4)]
        public required string IncrementType { get; set; }
        public required int SerialNum { get; set; }
        [MaxLength]
        public required string Content { get; set; }
        public DateTime CreateTime { get; set; } = DateTime.Now;
    }
}
