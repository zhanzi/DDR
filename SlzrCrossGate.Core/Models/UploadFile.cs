using System.ComponentModel.DataAnnotations;

namespace SlzrCrossGate.Core.Models
{



    public class UploadFile
    {
        [Key]
        [MaxLength(32)]
        public required string ID { get; set; }

        [MaxLength(200)]
        public required string FileName { get; set; }

        [MaxLength(500)]
        public string FilePath { get; set; }

        public int FileSize { get; set; }

        [MaxLength(8)]
        public required string Crc { get; set; }

        public DateTime UploadTime { get; set; }

        [MaxLength(200)]
        public string? ObjectStorageUrl { get; set; } // 对象存储的URL

        [MaxLength(100)]
        public string? BucketName { get; set; } // 存储桶名称

        [MaxLength(200)]
        public string? ContentType { get; set; } //

        [MaxLength(100)]
        public string? UploadedBy { get; set; } // 上传者

        public DateTime LastModifiedTime { get; set; } // 最后修改时间
    }

}
