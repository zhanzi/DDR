using Microsoft.Extensions.Logging;
using SlzrCrossGate.Tcp.Protocol;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace SlzrCrossGate.Tcp.Handler
{
    [MessageType("0500")]
    public class FetchMsgMessageHandler : IIso8583MessageHandler
    {
        private readonly ILogger<FetchMsgMessageHandler> _logger;
        //private readonly IMessageService _messageService;
        private readonly Iso8583Schema _schema;

        public FetchMsgMessageHandler(ILogger<FetchMsgMessageHandler> logger, Iso8583Schema schema)
        {
            _logger = logger;
            //_messageService = messageService;
            _schema = schema;
        }

        public async Task HandleMessageAsync(TcpConnectionContext context, Iso8583Message message)
        {
            // 处理获取收件箱消息指令
            _logger.LogInformation("处理获取收件箱消息指令");

            // 获取终端ID
            var terminalId = message.GetString(41); // 假设终端ID在41域

            // 获取收件箱消息
            var inboxMessages = "";// await _messageService.GetInboxMessagesAsync(terminalId);

            // 记录获取收件箱消息日志
            _logger.LogInformation($"终端 {terminalId} 获取收件箱消息");

            // 发送收件箱消息响应
            var response = new Iso8583Package(_schema);
            response.MessageType = "0510"; // 假设响应类型为0810
            response.SetString(39, "00"); // 假设39域表示响应码，00表示成功
            response.SetString(41, terminalId); // 终端ID

            // 假设62域存储收件箱消息
            var messagesData = ConvertMessagesToByteArray(inboxMessages);
            response.SetArrayData(62, messagesData);

            var responseBytes = response.PackSendBuffer();

            await context.Transport.Output.WriteAsync(responseBytes);

            await Task.CompletedTask;
        }

        private byte[] ConvertMessagesToByteArray(string inboxMessages)
        {
            throw new NotImplementedException();
        }

    }
}
