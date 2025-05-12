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
    /// 商户字典表，用于存储商户特定的字典数据
    /// 以商户编号、字典类型、字典编码三个字段为唯一约束
    /// </summary>
    public class MerchantDictionary : ITenantEntity
    {
        /// <summary>
        /// 自增ID（主键）
        /// </summary>
        [Key]
        public int ID { get; set; }

        /// <summary>
        /// 商户ID
        /// </summary>
        [Required]
        [MaxLength(8)]
        public required string MerchantID { get; set; }

        /// <summary>
        /// 字典类型（如：terminalType、cardType等）
        /// </summary>
        [Required]
        [MaxLength(50)]
        public required string DictionaryType { get; set; }

        /// <summary>
        /// 字典编码
        /// </summary>
        [Required]
        [MaxLength(50)]
        public required string DictionaryCode { get; set; }

        //字典标签/显示名称
        [MaxLength(50)]
        public string? DictionaryLabel { get; set; }

        /// <summary>
        /// 字典值
        /// </summary>
        [MaxLength(500)]
        public string? DictionaryValue { get; set; }

        /// <summary>
        /// 附加值1（预留字段）
        /// </summary>
        [MaxLength(500)]
        public string? ExtraValue1 { get; set; }

        /// <summary>
        /// 附加值2（预留字段）
        /// </summary>
        [MaxLength(500)]
        public string? ExtraValue2 { get; set; }

        /// <summary>
        /// 排序顺序
        /// </summary>
        public int SortOrder { get; set; } = 0;

        /// <summary>
        /// 是否启用
        /// </summary>
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// 描述
        /// </summary>
        [MaxLength(500)]
        public string? Description { get; set; }

        /// <summary>
        /// 创建时间
        /// </summary>
        public DateTime CreateTime { get; set; } = DateTime.Now;

        /// <summary>
        /// 更新时间
        /// </summary>
        public DateTime? UpdateTime { get; set; }

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
        /// 商户关系引用
        /// </summary>
        [ForeignKey("MerchantID")]
        public Merchant? Merchant { get; set; }
    }
}
