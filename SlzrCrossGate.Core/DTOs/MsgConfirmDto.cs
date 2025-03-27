using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SlzrCrossGate.Core.DTOs
{
    public record MsgConfirmDto
    {
        public required  int ID { get; set; }
        public required string ReplyCode { get; set; }
        public required string ReplyContent { get; set; }
    }
}
