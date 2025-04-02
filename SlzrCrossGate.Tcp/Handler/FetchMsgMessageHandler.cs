using Microsoft.Extensions.Logging;
using SlzrCrossGate.Common;
using SlzrCrossGate.Core.Models;
using SlzrCrossGate.Core.Services.BusinessServices;
using SlzrCrossGate.Tcp.Protocol;
using System.Text;

namespace SlzrCrossGate.Tcp.Handler
{
    [MessageType("0500")]
    public class FetchMsgMessageHandler : IIso8583MessageHandler
    {
        private readonly ILogger<FetchMsgMessageHandler> _logger;
        private readonly Iso8583Schema _schema;
        private readonly MsgBoxService _msgBoxService;

        public FetchMsgMessageHandler(ILogger<FetchMsgMessageHandler> logger, Iso8583Schema schema, MsgBoxService msgBoxService)
        {
            _logger = logger;
            _schema = schema;
            _msgBoxService = msgBoxService;
        }

        public async Task<Iso8583Message> HandleMessageAsync(TcpConnectionContext context, Iso8583Message message)
        {
            var msg = await _msgBoxService.GetFirstUnreadMessagesAsync(message.TerimalID);

            var response = new Iso8583Message(_schema, "0510");
            //response.SetField(3, "805001");

            if (msg == null) {
                response.SetField(39, "0010");
                response.Error("0010", "No message found");
                return response;
            } 


            var body = msg.Content;
            if (msg.CodeType == MessageCodeType.ASCII)
            {
                body = DataConvert.BytesToHex(Encoding.Default.GetBytes(body));
            }
            var msgStr = msg.MsgTypeID + msg.ID.ToString("X2").PadLeft(8, '0') + body;

            response.SetField(51, msgStr);
            response.Ok();

            if (msg != null) await _msgBoxService.MarkMessageAsReadAsync(message.TerimalID, msg.ID);

            return response;
        }


    }
}
