using Microsoft.Extensions.Logging;
using SlzrCrossGate.Tcp.Protocol;
using System.Threading.Tasks;

namespace SlzrCrossGate.Tcp.Handler
{
    [MessageType("0340")]
    public class ICCardBusinessMessageHandler : IIso8583MessageHandler
    {
        private readonly ILogger<ICCardBusinessMessageHandler> _logger;
        //private readonly ICardService _cardService;
        private readonly Iso8583Schema _schema;

        public ICCardBusinessMessageHandler(ILogger<ICCardBusinessMessageHandler> logger, Iso8583Schema schema)
        {
            _logger = logger;
            //_cardService = cardService;
            _schema = schema;
        }

        public async Task HandleMessageAsync(TcpConnectionContext context, Iso8583Package message)
        {
            // 处理IC卡业务指令
            _logger.LogInformation("处理IC卡业务指令");

            // 获取终端ID
            var terminalId = message.GetString(41); // 假设终端ID在41域

            // 获取IC卡信息
            var cardInfo = message.GetString(62); // 假设62域存储IC卡信息

            // 处理IC卡业务
            //var cardResult = await _cardService.ProcessCardAsync(terminalId, cardInfo);

            // 记录IC卡业务日志
            //_logger.LogInformation($"终端 {terminalId} 处理IC卡业务，结果：{cardResult}");

            // 发送IC卡业务响应
            var response = new Iso8583Package(_schema);
            response.MessageType = "0350"; // 假设响应类型为0810
            //response.SetString(39, cardResult ? "00" : "01"); // 假设39域表示响应码，00表示成功，01表示失败
            response.SetString(41, terminalId); // 终端ID

            var responseBytes = response.PackSendBuffer();

            await context.Transport.Output.WriteAsync(responseBytes);

            await Task.CompletedTask;
        }
    }
}

