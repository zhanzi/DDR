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

        public async Task HandleMessageAsync(TcpConnectionContext context, Iso8583Message message)
        {
            var msg = await _msgBoxService.GetFirstUnreadMessagesAsync(message.TerimalID);

            var response = new Iso8583Message(_schema);
            response.MessageType = "0510";
            response.SetField(3, "805001");
            response.SetField(39, "0000");
            response.SetDateTime(12, DateTime.Now);
            response.SetDateTime(13, DateTime.Now);
            response.SetField(41, message.MachineID);
            if (msg == null) {
                response.SetField(39, "0010");
            }
            else
            {
                var body = msg.Content;
                if (msg.CodeType == MessageCodeType.ASCII)
                {
                    body = DataConvert.BytesToHex(Encoding.Default.GetBytes(body));
                }
                var msgStr = msg.MsgTypeID + msg.ID.ToString("X2").PadLeft(8, '0') + body;

                response.SetField(51, msgStr);
            }
            
            var responseBytes = response.Pack();

            await context.Transport.Output.WriteAsync(responseBytes);
            await context.Transport.Output.FlushAsync();

            if (msg != null) await _msgBoxService.MarkMessageAsReadAsync(message.TerimalID, msg.ID);
        }


    }
}
