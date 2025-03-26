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
            // �����ն�ǩ��ָ��
            _logger.LogInformation("�����ն�ǩ��ָ��");

            // ��ȡ�ն�ID
            var terminalId = message.GetString(41); // �����ն�ID��41��

            // ��¼�ն�ǩ����־
            _logger.LogInformation($"�ն� {terminalId} ǩ�˳ɹ�");

            // ����ǩ�˳ɹ���Ӧ
            var response = new Iso8583Package(_schema);
            response.MessageType = "0830"; // ������Ӧ����Ϊ0830
            response.SetString(39, "00"); // ����39���ʾ��Ӧ�룬00��ʾ�ɹ�
            response.SetString(41, terminalId); // �ն�ID

            var responseBytes = response.PackSendBuffer();

            await context.Transport.Output.WriteAsync(responseBytes);

            await Task.CompletedTask;
        }
    }
}

