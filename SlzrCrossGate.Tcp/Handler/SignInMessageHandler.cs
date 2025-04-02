using Microsoft.Extensions.Logging;
using SlzrCrossGate.Core.Models;
using SlzrCrossGate.Core.Service.BusinessServices;
using SlzrCrossGate.Tcp.Protocol;
using System.IO;

namespace SlzrCrossGate.Tcp.Handler
{
    [MessageType("0800")]
    public class SignInMessageHandler : IIso8583MessageHandler
    {
        private readonly ILogger<SignInMessageHandler> _logger;
        private readonly Iso8583Schema _schema;
        TerminalEventService _terminalEventService;

        public SignInMessageHandler(ILogger<SignInMessageHandler> logger,Iso8583Schema schema,
            TerminalEventService terminalEventService)
        {
            _logger = logger;
            _schema = schema;
            _terminalEventService = terminalEventService;
        }

        public async Task<Iso8583Message> HandleMessageAsync(TcpConnectionContext context, Iso8583Message message)
        {
            // 发送签到成功响应
            var response = new Iso8583Message(_schema, "0830");

            await _terminalEventService.RecordTerminalEventAsync(
                message.MerchantID,
                message.TerimalID,
                TerminalEventType.FileDownloadStart,
                EventSeverity.Info,
                $"sign in success"
                );

            response.Ok();
            return response;
        }
    }
}
