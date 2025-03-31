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

        public async Task HandleMessageAsync(TcpConnectionContext context, Iso8583Message message)
        {
            // TODO:处理终端签到指令


            // 发送签到成功响应
            var response = new Iso8583Package(_schema);
            response.MessageType = "0810"; // 假设响应类型为0810
            response.SetString(39, "00"); // 假设39域表示响应码，00表示成功
            response.SetString(41, message.MachineID); // 终端ID

            var responseBytes = response.PackSendBuffer();

            await context.Transport.Output.WriteAsync(responseBytes);
            await context.Transport.Output.FlushAsync();

            await _terminalEventService.RecordTerminalEventAsync(
                message.MerchantID,
                message.TerimalID,
                TerminalEventType.FileDownloadStart,
                EventSeverity.Info,
                $"sign in success"
                );

        }
    }
}
