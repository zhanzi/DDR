using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SlzrCrossGate.Tcp.Protocol
{
    public class Iso8583MessageType
    {
        public const string SignInRequest = "0800";
        public const string SignInResponse = "0810";

        public const string SignOffRequest = "0820";
        public const string SignOffResponse = "0830";

        public const string FileUpdateRequest = "0840";
        public const string FileUpdateResponse = "0850";

        public const string ParaUpdateRequest = "0860";
        public const string ParaUpdateResponse = "0870";

        public const string HeartRequest = "0880";
        public const string HeartResponse = "0890";

        public const string DataTransferRequest = "0300";
        public const string DataTransferResponse = "0310";

        public const string MsgRequest = "0500";
        public const string MsgResponse = "0510";

        public const string MsgConfirmResquest = "0520";
        public const string MsgConfirmResponse = "0530";

        public const string IncrementRequest = "0540";
        public const string IncrementResponse = "0550";

        public const string RealTimeTradeRequest = "0320";
        public const string RealTimeTradeResponse = "0330";

        public const string LoadRequest = "0340";
        public const string LoadResponse = "0350";

        public const string UnionPay_TerminalKeysRequest = "0400";
        public const string UnionPay_TerminalKeysResponse = "0410";
    }
}
