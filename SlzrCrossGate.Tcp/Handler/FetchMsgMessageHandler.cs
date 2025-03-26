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
            // �����ȡ�ռ�����Ϣָ��
            _logger.LogInformation("�����ȡ�ռ�����Ϣָ��");

            // ��ȡ�ն�ID
            var terminalId = message.GetString(41); // �����ն�ID��41��

            // ��ȡ�ռ�����Ϣ
            var inboxMessages = "";// await _messageService.GetInboxMessagesAsync(terminalId);

            // ��¼��ȡ�ռ�����Ϣ��־
            _logger.LogInformation($"�ն� {terminalId} ��ȡ�ռ�����Ϣ");

            // �����ռ�����Ϣ��Ӧ
            var response = new Iso8583Package(_schema);
            response.MessageType = "0510"; // ������Ӧ����Ϊ0810
            response.SetString(39, "00"); // ����39���ʾ��Ӧ�룬00��ʾ�ɹ�
            response.SetString(41, terminalId); // �ն�ID

            // ����62��洢�ռ�����Ϣ
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
