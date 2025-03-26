using Microsoft.Extensions.Logging;
using SlzrCrossGate.Tcp.Protocol;
using System.Threading.Tasks;

namespace SlzrCrossGate.Tcp.Handler
{
    [MessageType("0400")]
    public class UnionPayKeyRetrievalMessageHandler : IIso8583MessageHandler
    {
        private readonly ILogger<UnionPayKeyRetrievalMessageHandler> _logger;
        //private readonly IKeyService _keyService;
        private readonly Iso8583Schema _schema;

        public UnionPayKeyRetrievalMessageHandler(ILogger<UnionPayKeyRetrievalMessageHandler> logger, Iso8583Schema schema)
        {
            _logger = logger;
            //_keyService = keyService;
            _schema = schema;
        }

        public async Task HandleMessageAsync(TcpConnectionContext context, Iso8583Message message)
        {
            // ���������ն���Կ��ȡָ��
            _logger.LogInformation("���������ն���Կ��ȡָ��");

            // ��ȡ�ն�ID
            var terminalId = message.GetString(41); // �����ն�ID��41��

            // ��ȡ��Կ
            //var key = await _keyService.GetKeyAsync(terminalId);

            // ��¼��Կ��ȡ��־
            _logger.LogInformation("�ն� {TerminalId} ��ȡ��Կ", terminalId);

            // ������Կ��ȡ��Ӧ
            var response = new Iso8583Message(_schema);
            response.MessageType = "0410"; // ������Ӧ����Ϊ0410
            response.SetField(39, "00"); // ����39���ʾ��Ӧ�룬00��ʾ�ɹ�
            response.SetField(41, terminalId); // �ն�ID
                                               // response.SetString(62, key); // ����62��洢��Կ

            var responseBytes = response.Pack();

            await context.Transport.Output.WriteAsync(responseBytes);

            await Task.CompletedTask;
        }
    }
}

