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
    /// 线路票价版本表，用于存储线路票价参数的各个版本
    /// </summary>
    public class LinePriceInfoVersion : ITenantEntity
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
        /// 关联的线路票价信息ID
        /// </summary>
        public int LinePriceInfoID { get; set; }

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
        /// 版本号，4位16进制数，从0001开始
        /// </summary>
        [Required]
        [MaxLength(4)]
        public required string Version { get; set; }

        /// <summary>
        /// 线路额外参数JSON字符串，包含如差额换乘时间、定额换乘时间、是否支持换乘等参数
        /// </summary>
        [Column(TypeName = "text")]
        public string? ExtraParamsJson { get; set; }

        /// <summary>
        /// 卡类参数信息JSON字符串，包含各卡类的折扣、播报语音等参数
        /// </summary>
        [Column(TypeName = "text")]
        public string? CardDiscountInfoJson { get; set; }

        /// <summary>
        /// 完整的票价参数文件JSON内容
        /// </summary>
        [Column(TypeName = "text")]
        public string? FileContentJson { get; set; }        /// <summary>
        /// 版本状态：草稿或已提交
        /// </summary>
        public LinePriceVersionStatus Status { get; set; } = LinePriceVersionStatus.Draft;

        /// <summary>
        /// 是否已发布到文件版本
        /// </summary>
        public bool IsPublished { get; set; } = false;

        /// <summary>
        /// 发布的文件版本ID，关联FileVer表
        /// </summary>
        public int? FileVerID { get; set; }

        /// <summary>
        /// 创建时间
        /// </summary>
        public DateTime CreateTime { get; set; } = DateTime.Now;

        /// <summary>
        /// 更新时间
        /// </summary>
        public DateTime UpdateTime { get; set; } = DateTime.Now;

        /// <summary>
        /// 提交时间
        /// </summary>
        public DateTime? SubmitTime { get; set; }

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
        /// 提交者
        /// </summary>
        [MaxLength(50)]
        public string? Submitter { get; set; }

        /// <summary>
        /// 商户关系引用
        /// </summary>
        [ForeignKey("MerchantID")]
        public Merchant? Merchant { get; set; }

        /// <summary>
        /// 线路票价信息关系引用
        /// </summary>
        [ForeignKey("LinePriceInfoID")]
        public LinePriceInfo? LinePriceInfo { get; set; }
    }
}
