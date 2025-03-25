using Microsoft.Extensions.Logging;
using SlzrCrossGate.Tcp.Protocol;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace SlzrCrossGate.Tcp.Handler
{
    [MessageType("0540")]
    public class IncrementalListDownloadMessageHandler : IIso8583MessageHandler
    {
        private readonly ILogger<IncrementalListDownloadMessageHandler> _logger;
        //private readonly IListService _listService;
        private readonly Iso8583Schema _schema;

        public IncrementalListDownloadMessageHandler(ILogger<IncrementalListDownloadMessageHandler> logger, Iso8583Schema schema)
        {
            _logger = logger;
            //_listService = listService;
            _schema = schema;
        }

        public async Task HandleMessageAsync(TcpConnectionContext context, Iso8583Package message)
        {
            // ����������������ָ��
            _logger.LogInformation("����������������ָ��");

            // ��ȡ�ն�ID
            var terminalId = message.GetString(41); // �����ն�ID��41��

            // ��ȡ��������
            //var incrementalList = await _listService.GetIncrementalListAsync(terminalId);

            // ��¼��������������־
            _logger.LogInformation($"�ն� {terminalId} ������������");

            // ������������������Ӧ
            var response = new Iso8583Package(_schema);
            response.MessageType = "0550"; // ������Ӧ����Ϊ0810
            response.SetString(39, "00"); // ����39���ʾ��Ӧ�룬00��ʾ�ɹ�
            response.SetString(41, terminalId); // �ն�ID

            // ����62��洢��������
            //var listData = ConvertListToByteArray(incrementalList);
            //response.SetArrayData(62, listData);

            var responseBytes = response.PackSendBuffer();

            await context.Transport.Output.WriteAsync(responseBytes);

            await Task.CompletedTask;
        }

        private byte[] ConvertListToByteArray(IEnumerable<string> list)
        {
            // �������б�ת��Ϊ�ֽ�����
            // ������Ը��ݾ����������ʽ����ʵ��
            // ���磬��ÿ��������ת��Ϊ�ַ�����Ȼ���ַ���ת��Ϊ�ֽ�����
            var listString = string.Join("\n", list);
            return System.Text.Encoding.UTF8.GetBytes(listString);
        }
    }
}

