using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SlzrCrossGate.Core.Models
{
    public class UnionPayTerminalKey:ITenantEntity
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ID { get; set; }
        [StringLength(8)]
        public required string MerchantID { get; set; }
        [StringLength(15)]
        public required string UP_MerchantID { get; set; }
        [StringLength(8)]
        public required string UP_TerminalID { get; set; }
        [StringLength(32)]
        public required string UP_Key { get; set; }
        [MaxLength(50)]
        public string? UP_MerchantName { get; set; }
        public bool IsInUse { get; set; }
        [StringLength(8)]
        public string? MachineID { get; set; }
        [MaxLength(8)]
        public string? LineID { get; set; }
        [MaxLength(8)]
        public string? MachineNO { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

    }
}
