using Microsoft.Extensions.Logging;
using SlzrCrossGate.Tcp.Protocol;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SlzrCrossGate.Tcp.Handler
{

    [MessageType("0520")]
    public class ConfirmMsgMessageHandler : IIso8583MessageHandler
    {
        private readonly ILogger<ConfirmMsgMessageHandler> _logger;
        //private readonly IMessageService _messageService;
        private readonly Iso8583Schema _schema;

        public ConfirmMsgMessageHandler(ILogger<ConfirmMsgMessageHandler> logger, Iso8583Schema schema)
        {
            _logger = logger;
            //_messageService = messageService;
            _schema = schema;
        }

        public async Task HandleMessageAsync(TcpConnectionContext context, Iso8583Message message)
        {
            // 处理消息确认指令
            _logger.LogInformation("处理消息确认指令");

            // 获取终端ID
            var terminalId = message.GetString(41); // 假设终端ID在41域
             
            // 记录获取收件箱消息日志
            _logger.LogInformation($"终端 {terminalId} 确认消息");

            // 发送收件箱消息响应
            var response = new Iso8583Package(_schema);
            response.MessageType = "0520"; // 假设响应类型为0520
            response.SetString(39, "00"); // 假设39域表示响应码，00表示成功


            var responseBytes = response.PackSendBuffer();

            await context.Transport.Output.WriteAsync(responseBytes);

            await Task.CompletedTask;
        }
    }
}
