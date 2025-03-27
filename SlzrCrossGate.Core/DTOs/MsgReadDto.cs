using SlzrCrossGate.Core.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SlzrCrossGate.Core.DTOs
{
    public record MsgReadDto
    {
        public required int ID { get; set; }
        public required string Content { get; set; }
        public required string MsgTypeID { get; set; }
        public required MessageCodeType CodeType { get; set; }
    }
}
