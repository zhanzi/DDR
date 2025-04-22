using SlzrCrossGate.Core.Models;

namespace SlzrCrossGate.WebAdmin.DTOs
{
    // 文件类型DTO
    public class FileTypeDto
    {
        public string Code { get; set; } = string.Empty;
        public string MerchantID { get; set; } = string.Empty;
        public string? Name { get; set; }
        public string? Remark { get; set; }
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
        public string MerchantID { get; set; } = string.Empty;
        public string FileTypeID { get; set; } = string.Empty;
        public string FilePara { get; set; } = string.Empty;
        public string Ver { get; set; } = string.Empty;
        public IFormFile? File { get; set; }
    }

    // 文件发布DTO
    public class FilePublishDto
    {
        public int ID { get; set; }
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
        public DateTime CreateTime { get; set; }
        public string? Operator { get; set; }
        public string? FileTypeName { get; set; }
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
        public int FilePublishID { get; set; }
        public string FileTypeID { get; set; } = string.Empty;
        public string FilePara { get; set; } = string.Empty;
        public string FileFullType { get; set; } = string.Empty;
        public string Ver { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public string Crc { get; set; } = string.Empty;
        public string UploadFileID { get; set; } = string.Empty;
        public PublishTypeOption PublishType { get; set; }
        public string PublishTarget { get; set; } = string.Empty;
        public DateTime CreateTime { get; set; }
        public string? Operator { get; set; }
        public string? Remark { get; set; }
    }
}
