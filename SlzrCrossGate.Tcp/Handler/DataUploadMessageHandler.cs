using Microsoft.Extensions.Logging;
using SlzrCrossGate.Tcp.Protocol;
using System.Threading.Tasks;
using System.IO;
using SlzrCrossGate.Core.Services;

namespace SlzrCrossGate.Tcp.Handler
{
    [MessageType("0300")]
    public class DataUploadMessageHandler : IIso8583MessageHandler
    {
        private readonly ILogger<DataUploadMessageHandler> _logger;
        private readonly FileService _fileService;
        private readonly Iso8583Schema _schema;

        public DataUploadMessageHandler(ILogger<DataUploadMessageHandler> logger, FileService fileService, Iso8583Schema schema)
        {
            _logger = logger;
            _fileService = fileService;
            _schema = schema;
        }

        public async Task HandleMessageAsync(TcpConnectionContext context, Iso8583Package message)
        {
            // ���������ϴ�ָ��
            _logger.LogInformation("���������ϴ�ָ��");

            // ��ȡ�ն�ID
            var terminalId = message.GetString(41); // �����ն�ID��41��

            // ��ȡ�ϴ�������
            var data = message.GetArrayData(60); // ����60��洢�ϴ�������

            // ��¼�����ϴ���־
            _logger.LogInformation($"�ն� {terminalId} �ϴ�����");

            // �����ϴ�������
            var filePath = $"{terminalId}_{DateTime.Now:yyyyMMddHHmmss}.dat";
            await _fileService.GetFileContentAsync(filePath);

            // �����ϴ��ɹ���Ӧ
            var response = new Iso8583Package(_schema);
            response.MessageType = "0310"; // ������Ӧ����Ϊ0810
            response.SetString(39, "00"); // ����39���ʾ��Ӧ�룬00��ʾ�ɹ�
            response.SetString(41, terminalId); // �ն�ID

            var responseBytes = response.PackSendBuffer();

            await context.Transport.Output.WriteAsync(responseBytes);

            await Task.CompletedTask;
        }
    }
}
