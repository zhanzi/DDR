using Microsoft.Extensions.Logging;
using SlzrCrossGate.Core.Models;
using SlzrCrossGate.Core.Service;
using SlzrCrossGate.Core.Service.BusinessServices;
using SlzrCrossGate.Tcp.Protocol;
using System.IO;

namespace SlzrCrossGate.Tcp.Handler
{
    [MessageType(Iso8583MessageType.SignOffRequest)]
    public class SignOutMessageHandler : IIso8583MessageHandler
    {
        private readonly ILogger<SignOutMessageHandler> _logger;
        private readonly Iso8583Schema _schema;
        private readonly TerminalEventService _terminalEventService;
        private readonly TcpConnectionManager _tcpConnectionManager;

        public SignOutMessageHandler(ILogger<SignOutMessageHandler> logger, Iso8583Schema schema, 
            TerminalEventService terminalEventService, TcpConnectionManager tcpConnectionManager)
        {
            _logger = logger;
            _schema = schema;
            _terminalEventService = terminalEventService;
            _tcpConnectionManager = tcpConnectionManager;
        }

        public async Task<Iso8583Message> HandleMessageAsync(TcpConnectionContext context, Iso8583Message message)
        {
            await _terminalEventService.RecordTerminalEventAsync(new TerminalEvent
            {
                MerchantID = message.MerchantID,
                TerminalID = message.TerimalID,
                EventType = TerminalEventType.SignOut,
                Severity = EventSeverity.Info,
                Remark = $"Terminal sign out",
                Operator = ""
            }); 

            // 发送签到成功响应
            var response = new Iso8583Message(_schema, Iso8583MessageType.SignOffResponse);
            response.Ok();
            return response;
        }
    }
}

