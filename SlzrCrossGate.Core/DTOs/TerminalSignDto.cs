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

        public required string ID { get; set; }
        public required string MerchantID { get; set; }
        public required string MachineID { get; set; }

        public required string DeviceNO { get; set; }

        public required string LineNO { get; set; }

        public required string TerminalType { get; set; }

        public string ClientFileVersions { get; set; } = "";

        public Dictionary<string,string> ClientFileVersionsMetaData { get; set; } = [];


        public string Properties { get; set; } = "";
        public Dictionary<string, string> PropertiesMetaData { get; set; } = [];


        public string? ConnectionProtocol { get; set; }

        public string? EndPoint { get; set; }
    }
}
