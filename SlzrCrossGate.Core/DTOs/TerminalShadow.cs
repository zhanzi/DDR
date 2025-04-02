using SlzrCrossGate.Core.Models;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace SlzrCrossGate.Core.DTOs
{
    public class TerminalShadow
    {

        public required string ID { get; set; }

        [MaxLength(8)]
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
        public string FileVersions { get; set; } = "";

        [MaxLength(2000)]
        public string Properties { get; set; } = "";

        [NotMapped]
        public Dictionary<string, string> FileVersionMetadata
        {
            get => JsonSerializer.Deserialize<Dictionary<string, string>>(FileVersions) ?? [];
            set => FileVersions = JsonSerializer.Serialize(value);
        }

        //期望的文件版本信息
        public Dictionary<string,string> ExpectFileVersions { get; set; } = [];


        [NotMapped]
        public Dictionary<string, string> PropertyMetadata
        {
            get => JsonSerializer.Deserialize<Dictionary<string, string>>(Properties) ?? [];
            set => Properties = JsonSerializer.Serialize(value);
        }

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
