using SlzrCrossGate.Core.Models;
using System.Text.Json.Serialization;

namespace SlzrCrossGate.WebAdmin.DTOs
{
    #region LinePriceInfo DTOs

    // 线路票价信息基础DTO
    public class LinePriceInfoDto
    {
        public int ID { get; set; }
        public string MerchantID { get; set; } = string.Empty;
        public string MerchantName { get; set; } = string.Empty;
        public string LineNumber { get; set; } = string.Empty;
        public string GroupNumber { get; set; } = string.Empty;
        public string LineName { get; set; } = string.Empty;
        public int Fare { get; set; }
        public bool IsActive { get; set; }
        public string CurrentVersion { get; set; } = string.Empty;
        public DateTime CreateTime { get; set; }
        public DateTime UpdateTime { get; set; }
        public string? Creator { get; set; }
        public string? Updater { get; set; }
        public string? Remark { get; set; }
    }

    // 创建线路票价信息DTO
    public class CreateLinePriceInfoDto
    {
        public string MerchantID { get; set; } = string.Empty;
        public string LineNumber { get; set; } = string.Empty;
        public string GroupNumber { get; set; } = string.Empty;
        public string LineName { get; set; } = string.Empty;
        public int Fare { get; set; }
        public bool IsActive { get; set; } = true;
        public string? Remark { get; set; }
    }

    // 更新线路票价信息DTO
    public class UpdateLinePriceInfoDto
    {
        public string? LineName { get; set; }
        public int? Fare { get; set; }
        public bool? IsActive { get; set; }
        public string? Remark { get; set; }
    }

    #endregion

    #region LinePriceInfoVersion DTOs

    // 线路票价版本信息DTO
    public class LinePriceInfoVersionDto
    {
        public int ID { get; set; }
        public string MerchantID { get; set; } = string.Empty;
        public string MerchantName { get; set; } = string.Empty;
        public int LinePriceInfoID { get; set; }
        public string LineNumber { get; set; } = string.Empty;
        public string GroupNumber { get; set; } = string.Empty;
        public string LineName { get; set; } = string.Empty;
        public int Fare { get; set; }
        public string Version { get; set; } = string.Empty;
        
        // 使用JsonPropertyName确保前端接收到的属性名与DTO定义一致
        [JsonPropertyName("extraParams")]
        public object? ExtraParams { get; set; }
        
        [JsonPropertyName("cardDiscountInfo")]
        public object? CardDiscountInfo { get; set; }
        
        public LinePriceVersionStatus Status { get; set; }
        public bool IsPublished { get; set; }
        public int? FileVerID { get; set; }
        public DateTime CreateTime { get; set; }
        public DateTime UpdateTime { get; set; }
        public DateTime? SubmitTime { get; set; }
        public string? Creator { get; set; }
        public string? Updater { get; set; }
        public string? Submitter { get; set; }
    }

    // 创建线路票价版本DTO
    public class CreateLinePriceInfoVersionDto
    {
        public string MerchantID { get; set; } = string.Empty;
        public int LinePriceInfoID { get; set; }
        public string? Version { get; set; }
        public object? ExtraParams { get; set; }
        public object? CardDiscountInfo { get; set; }
    }

    // 更新线路票价版本DTO
    public class UpdateLinePriceInfoVersionDto
    {
        public object? ExtraParams { get; set; }
        public object? CardDiscountInfo { get; set; }
    }

    // 提交线路票价版本DTO
    public class SubmitLinePriceInfoVersionDto
    {
        public int ID { get; set; }
        public string MerchantID { get; set; } = string.Empty;
    }

    // 预览线路票价文件DTO
    public class PreviewLinePriceFileDto
    {
        public int VersionID { get; set; }
        public string MerchantID { get; set; } = string.Empty;
    }

    // 预览响应DTO
    public class PreviewLinePriceFileResponseDto
    {
        public object FileContent { get; set; } = new();
    }

    // 发布线路票价文件DTO
    public class PublishLinePriceFileDto
    {
        public int VersionID { get; set; }
        public string MerchantID { get; set; } = string.Empty;
        public PublishTypeOption PublishType { get; set; }
        public string PublishTarget { get; set; } = string.Empty;
        public string? Remark { get; set; }
    }

    #endregion

    #region Dictionary Configuration DTOs

    // 字典配置DTO，用于动态表单配置
    public class DictionaryConfigDto
    {
        public string DictionaryCode { get; set; } = string.Empty;
        public string? DictionaryLabel { get; set; }
        public string? DictionaryValue { get; set; } // 默认值
        public string? ControlType { get; set; } // 控件类型，存储在ExtraValue1
        public object? ControlConfig { get; set; } // 控件配置，存储在ExtraValue2
    }

    #endregion
}
