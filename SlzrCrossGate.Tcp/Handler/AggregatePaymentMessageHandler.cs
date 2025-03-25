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
            // ����ۺ�֧��ָ��
            _logger.LogInformation("����ۺ�֧��ָ��");

            // ��ȡ�ն�ID
            var terminalId = message.GetString(41); // �����ն�ID��41��

            // ��ȡ֧����Ϣ
            var paymentInfo = message.GetString(62); // ����62��洢֧����Ϣ

            // ����֧��
           // var paymentResult = await _paymentService.ProcessPaymentAsync(terminalId, paymentInfo);

            // ��¼֧����־
            //_logger.LogInformation($"�ն� {terminalId} ����֧���������{paymentResult}");

            // ����֧����Ӧ
            var response = new Iso8583Package(_schema);
            response.MessageType = "0330"; // ������Ӧ����Ϊ0710
            //response.SetString(39, paymentResult ? "00" : "01"); // ����39���ʾ��Ӧ�룬00��ʾ�ɹ���01��ʾʧ��
            response.SetString(41, terminalId); // �ն�ID

            var responseBytes = response.PackSendBuffer();

            await context.Transport.Output.WriteAsync(responseBytes);

            await Task.CompletedTask;
        }
    }
}

