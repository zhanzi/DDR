using Microsoft.Extensions.Logging;
using SlzrCrossGate.Tcp.Protocol;
using System.Threading.Tasks;

namespace SlzrCrossGate.Tcp.Handler
{
    [MessageType("0320")]
    public class AggregatePaymentMessageHandler : IIso8583MessageHandler
    {
        private readonly ILogger<AggregatePaymentMessageHandler> _logger;
        //private readonly IPaymentService _paymentService;
        private readonly Iso8583Schema _schema;

        public AggregatePaymentMessageHandler(ILogger<AggregatePaymentMessageHandler> logger, Iso8583Schema schema)
        {
            _logger = logger;
            //_paymentService = paymentService;
            _schema = schema;
        }

        public async Task HandleMessageAsync(TcpConnectionContext context, Iso8583Package message)
        {
            // 处理聚合支付指令
            _logger.LogInformation("处理聚合支付指令");

            // 获取终端ID
            var terminalId = message.GetString(41); // 假设终端ID在41域

            // 获取支付信息
            var paymentInfo = message.GetString(62); // 假设62域存储支付信息

            // 处理支付
           // var paymentResult = await _paymentService.ProcessPaymentAsync(terminalId, paymentInfo);

            // 记录支付日志
            //_logger.LogInformation($"终端 {terminalId} 处理支付，结果：{paymentResult}");

            // 发送支付响应
            var response = new Iso8583Package(_schema);
            response.MessageType = "0330"; // 假设响应类型为0710
            //response.SetString(39, paymentResult ? "00" : "01"); // 假设39域表示响应码，00表示成功，01表示失败
            response.SetString(41, terminalId); // 终端ID

            var responseBytes = response.PackSendBuffer();

            await context.Transport.Output.WriteAsync(responseBytes);

            await Task.CompletedTask;
        }
    }
}

