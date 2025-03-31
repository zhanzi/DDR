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

        public async Task HandleMessageAsync(TcpConnectionContext context, Iso8583Message message)
        {
            // TODO：处理聚合支付指令

            await Task.CompletedTask;
        }
    }
}

