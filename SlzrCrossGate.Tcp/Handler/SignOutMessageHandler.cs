using Microsoft.Extensions.Logging;
using SlzrCrossGate.Tcp.Protocol;

namespace SlzrCrossGate.Tcp.Handler
{
    [MessageType("0820")]
    public class SignOutMessageHandler : IIso8583MessageHandler
    {
        private readonly ILogger<SignOutMessageHandler> _logger;
        private readonly Iso8583Schema _schema;

        public SignOutMessageHandler(ILogger<SignOutMessageHandler> logger, Iso8583Schema schema)
        {
            _logger = logger;
            _schema = schema;
        }

        public async Task HandleMessageAsync(TcpConnectionContext context, Iso8583Message message)
        {
            // 处理终端签退指令
            _logger.LogInformation("处理终端签退指令");

            // 获取终端ID
            var terminalId = message.GetString(41); // 假设终端ID在41域

            // 记录终端签退日志
            _logger.LogInformation($"终端 {terminalId} 签退成功");

            // 发送签退成功响应
            var response = new Iso8583Package(_schema);
            response.MessageType = "0830"; // 假设响应类型为0830
            response.SetString(39, "00"); // 假设39域表示响应码，00表示成功
            response.SetString(41, terminalId); // 终端ID

            var responseBytes = response.PackSendBuffer();

            await context.Transport.Output.WriteAsync(responseBytes);

            await Task.CompletedTask;
        }
    }
}

