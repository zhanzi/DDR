using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SlzrCrossGate.Core.Models
{
    public class MsgType : ITenantEntity
    {
        [Key]
        [StringLength(4)]
        public required string ID { get; set; }

        [Key]
        [MaxLength(8)]
        public required string MerchantID { get; set; }

        [MaxLength(50)]
        public string? Name { get; set; }


        //消息编码 UTF8,HEX
        [MaxLength(10)]
        public MessageCodeType CodeType { get; set; } = MessageCodeType.HEX;

        [MaxLength(1000)] // 根据实际示例长度调整
        public string? ExampleMessage { get; set; }

        [MaxLength(500)]
        public string? Description { get; set; }


    }

    public class MsgContent : ITenantEntity
    {
        [Key]
        [StringLength(4)]
        public int ID { get; set; }

        [MaxLength(8)]
        public required string MerchantID { get; set; }

        [StringLength(4)]
        public required string MsgTypeID { get; set; }

        [MaxLength(500)]
        public required string Content { get; set; }

        public DateTime CreateTime { get; set; }

        //备注
        [MaxLength(200)]
        public string? Remark { get; set; }

        //操作人员
        [MaxLength(20)]
        public string? Operator { get; set; }
    }

    public class MsgBox : ITenantEntity
    {

        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Key]
        public int ID { get; set; }

        [MaxLength(8)]
        public required string MerchantID { get; set; }

        public int MsgContentID { get; set; }

        //接收设备
        [MaxLength(20)]
        public required string TerminalID { get; set; }

        //消息状态 0:未读 1:已读 2:已回复
        public MessageStatus Status { get; set; }

        //发送时间
        public DateTime SendTime { get; set; }

        //读取时间
        public DateTime? ReadTime { get; set; }

        //回复时间
        public DateTime? ReplyTime { get; set; }

        //回复代码
        [MaxLength(20)]
        public string? ReplyCode { get; set; }

        //回复内容
        [MaxLength(200)]
        public string? ReplyContent { get; set; }

    }

}
