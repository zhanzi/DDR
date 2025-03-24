using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SlzrCrossGate.Core.Models
{
    public class Merchant:ITenantEntity
    {
        [MaxLength(8)]
        [Key]
        public required string MerchantID { get; set; }

        [MaxLength(100)]
        public string? Name { get; set; }

        [MaxLength(100)]
        public string? CompanyName { get; set; } = null;

        //联系人
        [MaxLength(100)]
        public string? ContactPerson { get; set; } = null;

        //联系信息
        [MaxLength(100)]
        public string? ContactInfo { get; set; } = null;

        //备注
        [MaxLength(200)]
        public string? Remark { get; set; } = null;

        //运维人员
        [MaxLength(50)]
        public string? Operator { get; set; } = null;

        public bool AutoRegister { get; set; }

    }
}
