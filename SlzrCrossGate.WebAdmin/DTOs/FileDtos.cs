using SlzrCrossGate.Core.Models;
using System.ComponentModel.DataAnnotations;

namespace SlzrCrossGate.WebAdmin.DTOs
{
    // 文件类型DTO
    public class FileTypeDto
    {
        public string Code { get; set; } = string.Empty;
        public string MerchantID { get; set; } = string.Empty;
        public string? Name { get; set; }
        public string? Remark { get; set; }
        public string MerchantName { get; set; } = string.Empty;
    }

    public class CreateFileTypeDto
    {
        public string Code { get; set; } = string.Empty;
        public string MerchantID { get; set; } = string.Empty;
        public string? Name { get; set; }
        public string? Remark { get; set; }
    }

    public class UpdateFileTypeDto
    {
        public string? Name { get; set; }
        public string? Remark { get; set; }
    }

    // 文件版本DTO
    public class FileVersionDto
    {
        public int ID { get; set; }
        public string MerchantID { get; set; } = string.Empty;
        public string MerchantName { get; set; } = string.Empty;
        public string FileTypeID { get; set; } = string.Empty;
        public string FilePara { get; set; } = string.Empty;
        public string FileFullType { get; set; } = string.Empty;
        public string Ver { get; set; } = string.Empty;
        public DateTime CreateTime { get; set; }
        public DateTime UpdateTime { get; set; }
        public string UploadFileID { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public string Crc { get; set; } = string.Empty;
        public string? Operator { get; set; }
        public string? FileTypeName { get; set; }
    }

    public class CreateFileVersionDto
    {
        [Required(ErrorMessage = "商户ID不能为空")]
        [StringLength(8, ErrorMessage = "商户ID最多8个字符")]
        public string MerchantID { get; set; } = string.Empty;

        [Required(ErrorMessage = "文件类型ID不能为空")]
        [StringLength(3, ErrorMessage = "文件类型ID最多3个字符")]
        public string FileTypeID { get; set; } = string.Empty;

        [StringLength(8, ErrorMessage = "文件参数最多8个字符")]
        public string? FilePara { get; set; } = string.Empty;

        [Required(ErrorMessage = "版本号不能为空")]
        [StringLength(4, MinimumLength = 4, ErrorMessage = "版本号必须为4个字符")]
        [RegularExpression(@"^[0-9A-Fa-f]{4}$", ErrorMessage = "版本号必须为4位16进制字符")]
        public string Ver { get; set; } = string.Empty;

        [Required(ErrorMessage = "请选择要上传的文件")]
        public IFormFile? File { get; set; }
    }

    // 文件发布DTO
    public class FilePublishDto
    {
        public int ID { get; set; }
        public int FileVerID { get; set; }
        public string MerchantID { get; set; } = string.Empty;
        public string FileTypeID { get; set; } = string.Empty;
        public string FilePara { get; set; } = string.Empty;
        public string FileFullType { get; set; } = string.Empty;
        public string Ver { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public string Crc { get; set; } = string.Empty;
        public string UploadFileID { get; set; } = string.Empty;
        public PublishTypeOption PublishType { get; set; }
        public string PublishTarget { get; set; } = string.Empty;
        public DateTime PublishTime { get; set; }
        public string? Operator { get; set; }
        public string? OperationType { get; set; } = "Publish";
        public string? FileTypeName { get; set; }
        public string MerchantName { get; set; } = string.Empty;
    }

    public class CreateFilePublishDto
    {
        public string MerchantID { get; set; } = string.Empty;
        public int FileVersionId { get; set; }
        public PublishTypeOption PublishType { get; set; }
        public string PublishTarget { get; set; } = string.Empty;
    }

    // 文件发布历史DTO
    public class FilePublishHistoryDto
    {
        public int ID { get; set; }
        public string MerchantID { get; set; } = string.Empty;
        public string MerchantName { get; set; } = string.Empty;
        public string FileTypeID { get; set; } = string.Empty;
        public string FileTypeName { get; set; } = string.Empty;
        public string FilePara { get; set; } = string.Empty;
        public string FileFullType { get; set; } = string.Empty;
        public string Ver { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public string Crc { get; set; } = string.Empty;
        public string UploadFileID { get; set; } = string.Empty;
        public PublishTypeOption PublishType { get; set; }
        public string PublishTarget { get; set; } = string.Empty;
        public DateTime PublishTime { get; set; }
        public string? Operator { get; set; }
        public string? OperationType { get; set; } = "Publish";
        public string? Remark { get; set; }
    }
}
