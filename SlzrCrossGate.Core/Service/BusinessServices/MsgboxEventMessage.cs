using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SlzrCrossGate.Core.Service.BusinessServices
{
    public class MsgboxEventMessage
    {
        public MsgboxEventMessage() { }
        /// <summary>
        /// Send,Read,Reply
        /// </summary>
        public MsgboxEventActionType ActionType { get; set; }
        public DateTime ActionTime { get; set; } = DateTime.Now;
        public int ID { get; set; }
        public required string MerchantID { get; set; }
        public required string TerminalID { get; set; }
        public int MesgContentID { get; set; }
    }

    public enum MsgboxEventActionType
    {
        Send,
        Read,
        Reply
    }
}
