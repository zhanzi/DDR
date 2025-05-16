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
        /// <summary>
        /// 商户号
        /// </summary>
        [StringLength(8)]
        public required string MerchantID { get; set; }
        /// <summary>
        /// 银联商户号
        /// </summary>
        [StringLength(15)]
        public required string UP_MerchantID { get; set; }
        /// <summary>
        /// 银联终端号
        /// </summary>
        [StringLength(8)]
        public required string UP_TerminalID { get; set; }
        /// <summary>
        /// 银联终端密钥
        /// </summary>
        [StringLength(32)]
        public required string UP_Key { get; set; }
        /// <summary>
        /// 银联商户名称
        /// </summary>
        [MaxLength(50)]
        public string? UP_MerchantName { get; set; }
        /// <summary>
        /// 是否被使用（绑定）
        /// </summary>
        public bool IsInUse { get; set; }
        /// <summary>
        /// 被使用的设备ID
        /// </summary>
        [StringLength(8)]
        public string? MachineID { get; set; }
        /// <summary>
        /// 被使用的设备所在的线路ID
        /// </summary>
        [MaxLength(8)]
        public string? LineID { get; set; }
        /// <summary>
        /// 被使用的设备编号
        /// </summary>
        [MaxLength(8)]
        public string? MachineNO { get; set; }
        /// <summary>
        /// 创建时间
        /// </summary>
        public DateTime CreatedAt { get; set; }
        /// <summary>
        /// 更新时间
        /// </summary>
        public DateTime UpdatedAt { get; set; }

    }
}
