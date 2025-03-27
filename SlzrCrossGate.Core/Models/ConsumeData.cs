using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SlzrCrossGate.Core.Models
{
    public class ConsumeData
    {
        [Key, Required]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public long Id { get; set; }
        [MaxLength(8)]
        public string? MerchantID { get; set; }
        [MaxLength(8)]
        public string? MachineNO { get; set; }
        [MaxLength(8)]
        public string? MachineID { get; set; }
        [MaxLength(12)]
        public string? PsamNO { get; set; }

        [MaxLength(2500)]
        public required string Buffer { get; set; }
        //接收时间
        public DateTime ReceiveTime { get; set; }
    }
}
