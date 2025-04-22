using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SlzrCrossGate.Core.Models
{
    /// <summary>
    /// 文件类型
    /// </summary>
    public class FileType : ITenantEntity
    {
        [StringLength(3)]
        /// <summary>
        /// 文件代码
        /// </summary>
        public required string ID { get; set; }

        [MaxLength(8)]
        public required string MerchantID { get; set; }


        [MaxLength(50)]
        /// <summary>
        /// 类型名称
        /// </summary>
        public required string Name { get; set; }


        [MaxLength(200)]
        /// <summary>
        /// 说明
        /// </summary>
        public string? Description { get; set; }
    }
}
