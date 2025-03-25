using Microsoft.Extensions.Logging;
using SlzrCrossGate.Tcp.Protocol;
using System.Threading.Tasks;

namespace SlzrCrossGate.Tcp.Handler
{
    [MessageType("0880")]
    public class HeartbeatMessageHandler : IIso8583MessageHandler
    {
        private readonly ILogger<HeartbeatMessageHandler> _logger;
        private readonly Iso8583Schema _schema;

        public HeartbeatMessageHandler(ILogger<HeartbeatMessageHandler> logger, Iso8583Schema schema)
        {
            _logger = logger;
            _schema = schema;
        }

        public async Task HandleMessageAsync(TcpConnectionContext context, Iso8583Package message)
        {
            // ��������ָ��
            _logger.LogInformation("��������ָ��");

            // ��ȡ�ն�ID
            var terminalId = message.GetString(41); // �����ն�ID��41��

            // ��¼������־
            _logger.LogInformation($"�ն� {terminalId} ��������");

            // ����������Ӧ
            var response = new Iso8583Package(_schema);
            response.MessageType = "0890"; // ������Ӧ����Ϊ0810
            response.SetString(39, "00"); // ����39���ʾ��Ӧ�룬00��ʾ�ɹ�
            response.SetString(41, terminalId); // �ն�ID

            var responseBytes = response.PackSendBuffer();

            await context.Transport.Output.WriteAsync(responseBytes);

            await Task.CompletedTask;
        }
    }
}

