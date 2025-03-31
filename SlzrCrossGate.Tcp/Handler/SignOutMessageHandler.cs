using Microsoft.Extensions.Logging;
using SlzrCrossGate.Core.Models;
using SlzrCrossGate.Core.Service;
using SlzrCrossGate.Core.Service.BusinessServices;
using SlzrCrossGate.Tcp.Protocol;
using System.IO;

namespace SlzrCrossGate.Tcp.Handler
{
    [MessageType("0820")]
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

        public async Task HandleMessageAsync(TcpConnectionContext context, Iso8583Message message)
        {
            //var response = new Iso8583Message(_schema);
            //response.MessageType = "0830"; 
            //response.SetField(39, "00"); 
            //response.SetField(41, message.MachineID); 

            //var responseBytes = response.Pack();

            //await context.Transport.Output.WriteAsync(responseBytes);
            //await context.Transport.Output.FlushAsync();

            _tcpConnectionManager.TryRemoveConnection(message.TerimalID);

            await _terminalEventService.RecordTerminalEventAsync(
                message.MerchantID,
                message.TerimalID,
                TerminalEventType.SignOut,
                EventSeverity.Info,
                //ÖÕ¶ËÖ÷¶¯Ç©ÍË
                $"terminal sign out"
            );

        }
    }
}

