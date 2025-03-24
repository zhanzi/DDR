using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SlzrCrossGate.Core.Models
{
    public class FileVer : ITenantEntity
    {
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Key]
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


        [MaxLength(4)]
        public required string Ver { get; set; }

        public DateTime CreateTime { get; set; }= DateTime.Now;

        public DateTime UpdateTime { get; set; } = DateTime.Now;

        [MaxLength(32)]
        public required string UploadFileID { get; set; }


        //操作人员
        [MaxLength(32)]
        public string? Operator { get; set; }

        public bool IsDelete { get; set; } = false;

    }
}
