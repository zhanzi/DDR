using Microsoft.Extensions.Logging;
using SlzrCrossGate.Tcp.Protocol;

namespace SlzrCrossGate.Tcp.Handler
{
    [MessageType("0800")]
    public class SignInMessageHandler : IIso8583MessageHandler
    {
        private readonly ILogger<SignInMessageHandler> _logger;
        private readonly Iso8583Schema _schema;

        public SignInMessageHandler(ILogger<SignInMessageHandler> logger,Iso8583Schema schema)
        {
            _logger = logger;
            _schema = schema;
        }

        public async Task HandleMessageAsync(TcpConnectionContext context, Iso8583Message message)
        {
            // 处理终端签到指令
            _logger.LogInformation("处理终端签到指令");

            // 获取终端ID
            var terminalId = message.GetString(41); // 

            // 记录终端签到日志
            _logger.LogInformation($"终端 {terminalId} 签到成功");

            // 发送签到成功响应
            var response = new Iso8583Package(_schema);
            response.MessageType = "0810"; // 假设响应类型为0810
            response.SetString(39, "00"); // 假设39域表示响应码，00表示成功
            response.SetString(41, terminalId); // 终端ID




            var responseBytes = response.PackSendBuffer();

            await context.Transport.Output.WriteAsync(responseBytes);

            await Task.CompletedTask;
        }
    }
}
