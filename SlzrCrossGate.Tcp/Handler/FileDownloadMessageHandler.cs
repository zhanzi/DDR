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
            // 处理文件下载指令
            _logger.LogInformation("处理文件下载指令");

            // 获取文件ID
            var fileId = message.GetString(42); // 假设文件ID在42域

            // 记录文件下载日志
            _logger.LogInformation($"文件 {fileId} 下载请求");

            // 获取文件内容
            var fileContent = await _fileService.GetFileContentAsync(fileId);
            if (fileContent == null)
            {
                _logger.LogWarning($"文件 {fileId} 不存在");
                await SendErrorResponse(context, message, "01"); // 假设01表示文件不存在
                return;
            }

            // 发送文件下载响应
            var response = new Iso8583Package(_schema);
            response.MessageType = "0850"; // 假设响应类型为0810
            response.SetString(39, "00"); // 假设39域表示响应码，00表示成功
            response.SetString(42, fileId); // 文件ID
            response.SetArrayData(60, fileContent); // 假设60域存储文件内容

            var responseBytes = response.PackSendBuffer();

            await context.Transport.Output.WriteAsync(responseBytes);

            await Task.CompletedTask;
        }

        private async Task SendErrorResponse(TcpConnectionContext context, Iso8583Message request, string errorCode)
        {
            var response = new Iso8583Message(_schema);
            response.MessageType = "0810"; // 假设响应类型为0810
            response.SetField(39, errorCode); // 响应码
            response.SetField(42, request.GetString(42)); // 文件ID

            var responseBytes = response.Pack();

            await context.Transport.Output.WriteAsync(responseBytes);
        }
    }
}


