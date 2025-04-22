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
    public class TerminalSignDto
    {

        public string ID { get; set; }
        public string MerchantID { get; set; }
        public string MachineID { get; set; }

        public string DeviceNO { get; set; }

        public string LineNO { get; set; }

        public string TerminalType { get; set; }

        public string ClientFileVersions { get; set; } = "";

        public Dictionary<string,string> ClientFileVersionsMetaData { get; set; } = [];


        public string Properties { get; set; } = "";
        public Dictionary<string, string> PropertiesMetaData { get; set; } = [];


        public string? ConnectionProtocol { get; set; }

        public string? EndPoint { get; set; }
    }
}
