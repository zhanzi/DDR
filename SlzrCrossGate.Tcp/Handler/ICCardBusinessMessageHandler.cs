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
            // ����IC��ҵ��ָ��
            _logger.LogInformation("����IC��ҵ��ָ��");

            // ��ȡ�ն�ID
            var terminalId = message.GetString(41); // �����ն�ID��41��

            // ��ȡIC����Ϣ
            var cardInfo = message.GetString(62); // ����62��洢IC����Ϣ

            // ����IC��ҵ��
            //var cardResult = await _cardService.ProcessCardAsync(terminalId, cardInfo);

            // ��¼IC��ҵ����־
            //_logger.LogInformation($"�ն� {terminalId} ����IC��ҵ�񣬽����{cardResult}");

            // ����IC��ҵ����Ӧ
            var response = new Iso8583Package(_schema);
            response.MessageType = "0350"; // ������Ӧ����Ϊ0810
            //response.SetString(39, cardResult ? "00" : "01"); // ����39���ʾ��Ӧ�룬00��ʾ�ɹ���01��ʾʧ��
            response.SetString(41, terminalId); // �ն�ID

            var responseBytes = response.PackSendBuffer();

            await context.Transport.Output.WriteAsync(responseBytes);

            await Task.CompletedTask;
        }
    }
}

