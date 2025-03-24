using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SlzrCrossGate.Core.Models
{
    public class FilePublish : ITenantEntity
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ID { get; set; }

        [MaxLength(8)]
        public required string MerchantID { get; set; }
         

        [StringLength(3)]
        public required string FileTypeID { get; set; }


        [MaxLength(8)]
        public required string FilePara { get; set; }


        [MaxLength(11)]
        [MinLength(3)]
        /// <summary>
        /// SysFileTypeID+SysFilePara
        /// </summary>
        public required string FileFullType { get; set; }


        [StringLength(4)]
        public required string Ver { get; set; }

        public DateTime CreateTime { get; set; }
        public DateTime UpdateTime { get; set; }

        //操作人员
        [MaxLength(20)]
        public string? Operator { get; set; }


        //发布类型
        public PublishTypeOption PublishType { get; set; }//1:商户 2:线路 3:终端 

        //发布目标
        [MaxLength(100)]
        public required string PublishTarget { get; set; }

        //发布备注
        [MaxLength(200)]
        public string? Remark { get; set; }

    }

}
