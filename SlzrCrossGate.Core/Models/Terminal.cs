using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Text.Json;
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


        public DateTime CreateTime { get; set; }

        //软删除
        public bool IsDeleted { get; set; } = false;

        //导航属性到TerminalStatus
        public virtual TerminalStatus? Status { get; set; }
        public DateTime StatusUpdateTime { get; set; }
    }
}
