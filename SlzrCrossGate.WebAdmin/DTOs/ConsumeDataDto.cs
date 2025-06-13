using System.ComponentModel.DataAnnotations;

namespace SlzrCrossGate.WebAdmin.DTOs
{
    /// <summary>
    /// 终端记录数据传输对象
    /// </summary>
    public class ConsumeDataDto
    {
        /// <summary>
        /// 主键ID
        /// </summary>
        public long Id { get; set; }

        /// <summary>
        /// 商户编号
        /// </summary>
        public string? MerchantID { get; set; }

        /// <summary>
        /// 商户名称
        /// </summary>
        public string? MerchantName { get; set; }

        /// <summary>
        /// 出厂序列号
        /// </summary>
        public string? MachineID { get; set; }

        /// <summary>
        /// 设备编号
        /// </summary>
        public string? MachineNO { get; set; }

        /// <summary>
        /// PSAM卡号
        /// </summary>
        public string? PsamNO { get; set; }

        /// <summary>
        /// 交易数据（HEX格式字符串）
        /// </summary>
        public string BufferHex { get; set; } = "";

        /// <summary>
        /// 接收时间
        /// </summary>
        public DateTime ReceiveTime { get; set; }
    }

    /// <summary>
    /// 终端记录查询请求参数
    /// </summary>
    public class ConsumeDataQueryDto
    {
        /// <summary>
        /// 商户编号
        /// </summary>
        public string? MerchantID { get; set; }

        /// <summary>
        /// 出厂序列号
        /// </summary>
        public string? MachineID { get; set; }

        /// <summary>
        /// 设备编号
        /// </summary>
        public string? MachineNO { get; set; }

        /// <summary>
        /// 开始时间
        /// </summary>
        public DateTime? StartTime { get; set; }

        /// <summary>
        /// 结束时间
        /// </summary>
        public DateTime? EndTime { get; set; }

        /// <summary>
        /// 页码（从1开始）
        /// </summary>
        [Range(1, int.MaxValue, ErrorMessage = "页码必须大于0")]
        public int Page { get; set; } = 1;

        /// <summary>
        /// 每页条数
        /// </summary>
        [Range(1, 1000, ErrorMessage = "每页条数必须在1-1000之间")]
        public int PageSize { get; set; } = 20;

        /// <summary>
        /// 排序字段
        /// </summary>
        public string? SortBy { get; set; } = "ReceiveTime";

        /// <summary>
        /// 排序方向（asc/desc）
        /// </summary>
        public string? SortDirection { get; set; } = "desc";
    }

    /// <summary>
    /// 分页查询结果
    /// </summary>
    /// <typeparam name="T"></typeparam>
    public class PagedResult<T>
    {
        /// <summary>
        /// 数据列表
        /// </summary>
        public List<T> Items { get; set; } = new List<T>();

        /// <summary>
        /// 总记录数
        /// </summary>
        public int TotalCount { get; set; }

        /// <summary>
        /// 当前页码
        /// </summary>
        public int Page { get; set; }

        /// <summary>
        /// 每页条数
        /// </summary>
        public int PageSize { get; set; }

        /// <summary>
        /// 总页数
        /// </summary>
        public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);

        /// <summary>
        /// 是否有下一页
        /// </summary>
        public bool HasNextPage => Page < TotalPages;

        /// <summary>
        /// 是否有上一页
        /// </summary>
        public bool HasPreviousPage => Page > 1;
    }
}
