using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SlzrCrossGate.Core.Models
{
    /// <summary>
    /// 线路票价信息表，用于存储线路票价的基本信息
    /// </summary>
    public class LinePriceInfo : ITenantEntity
    {
        /// <summary>
        /// 自增ID（主键）
        /// </summary>
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ID { get; set; }

        /// <summary>
        /// 商户ID
        /// </summary>
        [Required]
        [MaxLength(8)]
        public required string MerchantID { get; set; }

        /// <summary>
        /// 线路编号，4位数字
        /// </summary>
        [Required]
        [MaxLength(4)]
        public required string LineNumber { get; set; }

        /// <summary>
        /// 子线路号（组号），2位数字
        /// </summary>
        [Required]
        [MaxLength(2)]
        public required string GroupNumber { get; set; }

        /// <summary>
        /// 线路名称
        /// </summary>
        [MaxLength(100)]
        public required string LineName { get; set; }

        /// <summary>
        /// 票价，单位分
        /// </summary>
        public int Fare { get; set; }

        /// <summary>
        /// 是否启用
        /// </summary>
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// 创建时间
        /// </summary>
        public DateTime CreateTime { get; set; } = DateTime.Now;

        /// <summary>
        /// 更新时间
        /// </summary>
        public DateTime UpdateTime { get; set; } = DateTime.Now;

        /// <summary>
        /// 创建者
        /// </summary>
        [MaxLength(50)]
        public string? Creator { get; set; }

        /// <summary>
        /// 更新者
        /// </summary>
        [MaxLength(50)]
        public string? Updater { get; set; }

        /// <summary>
        /// 备注
        /// </summary>
        [MaxLength(500)]
        public string? Remark { get; set; }

        /// <summary>
        /// 当前最新版本号
        /// </summary>
        [MaxLength(4)]
        public string CurrentVersion { get; set; } = "";

        /// <summary>
        /// 商户关系引用
        /// </summary>
        [ForeignKey("MerchantID")]
        public Merchant? Merchant { get; set; }
    }
}
