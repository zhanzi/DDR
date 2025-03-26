using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SlzrCrossGate.Core.Models
{
    public class Terminal
    {
        [Key]
        [MaxLength(20)]
        /// <summary>
        /// 系统唯一编号
        /// </summary>
        public required string ID { get; set; }

        [MaxLength(8)]
        /// <summary>
        /// 商户编号
        /// </summary>
        public required string MerchantID { get; set; }

        [MaxLength(8)]
        /// <summary>
        /// 终端唯一码
        /// </summary>
        public required string MachineID { get; set; }

        [MaxLength(8)]
        /// <summary>
        /// 设备编号,车辆编号,自编码,自定义编号
        /// </summary>
        public required string DeviceNO { get; set; }

        [MaxLength(8)]
        public required string LineNO { get; set; }

        [MaxLength(2000)]
        public string FileVerInfo { get; set; } = "";

        [MaxLength(2000)]
        public string PropertyInfo { get; set; } = "";

        public DateTime CreateTime { get; set; }

        public DateTime LoginInTime { get; set; }

        [MaxLength(200)]
        public string? Token { get; set; }
        public DateTime LoginOffTime { get; set; }
        public DateTime LastActiveTime { get; set; }


        //终端连接协议类型，如：MQTT、HTTP、TCP、UDP等
        [MaxLength(20)]
        public string? ConnectionProtocol { get; set; }


        //设备终结点信息
        [MaxLength(200)]
        public string? EndPoint { get; set; }


        //设备活跃状态
        public DeviceActiveStatus ActiveStatus { get; set; }

        //软删除
        public bool IsDeleted { get; set; } = false;

    }
}
