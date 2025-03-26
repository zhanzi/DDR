using Microsoft.Extensions.Logging;
using SlzrCrossGate.Tcp.Protocol;
using System.Threading.Tasks;
using System.IO;
using SlzrCrossGate.Core.Services;

namespace SlzrCrossGate.Tcp.Handler
{
    [MessageType("0840")]
    public class FileDownloadMessageHandler : IIso8583MessageHandler
    {
        private readonly ILogger<FileDownloadMessageHandler> _logger;
        private readonly FileService _fileService;
        private readonly Iso8583Schema _schema;

        public FileDownloadMessageHandler(ILogger<FileDownloadMessageHandler> logger, FileService fileService, Iso8583Schema schema)
        {
            _logger = logger;
            _fileService = fileService;
            _schema = schema;
        }

        public async Task HandleMessageAsync(TcpConnectionContext context, Iso8583Message message)
        {
            // �����ļ�����ָ��
            _logger.LogInformation("�����ļ�����ָ��");

            // ��ȡ�ļ�ID
            var fileId = message.GetString(42); // �����ļ�ID��42��

            // ��¼�ļ�������־
            _logger.LogInformation($"�ļ� {fileId} ��������");

            // ��ȡ�ļ�����
            var fileContent = await _fileService.GetFileContentAsync(fileId);
            if (fileContent == null)
            {
                _logger.LogWarning($"�ļ� {fileId} ������");
                await SendErrorResponse(context, message, "01"); // ����01��ʾ�ļ�������
                return;
            }

            // �����ļ�������Ӧ
            var response = new Iso8583Package(_schema);
            response.MessageType = "0850"; // ������Ӧ����Ϊ0810
            response.SetString(39, "00"); // ����39���ʾ��Ӧ�룬00��ʾ�ɹ�
            response.SetString(42, fileId); // �ļ�ID
            response.SetArrayData(60, fileContent); // ����60��洢�ļ�����

            var responseBytes = response.PackSendBuffer();

            await context.Transport.Output.WriteAsync(responseBytes);

            await Task.CompletedTask;
        }

        private async Task SendErrorResponse(TcpConnectionContext context, Iso8583Message request, string errorCode)
        {
            var response = new Iso8583Message(_schema);
            response.MessageType = "0810"; // ������Ӧ����Ϊ0810
            response.SetField(39, errorCode); // ��Ӧ��
            response.SetField(42, request.GetString(42)); // �ļ�ID

            var responseBytes = response.Pack();

            await context.Transport.Output.WriteAsync(responseBytes);
        }
    }
}


