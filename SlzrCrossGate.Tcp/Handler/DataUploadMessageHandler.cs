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
            // 处理数据上传指令
            _logger.LogInformation("处理数据上传指令");

            // 获取终端ID
            var terminalId = message.GetString(41); // 假设终端ID在41域

            // 获取上传的数据
            var data = message.GetArrayData(60); // 假设60域存储上传的数据

            // 记录数据上传日志
            _logger.LogInformation($"终端 {terminalId} 上传数据");

            // 保存上传的数据
            var filePath = $"{terminalId}_{DateTime.Now:yyyyMMddHHmmss}.dat";
            await _fileService.GetFileContentAsync(filePath);

            // 发送上传成功响应
            var response = new Iso8583Package(_schema);
            response.MessageType = "0310"; // 假设响应类型为0810
            response.SetString(39, "00"); // 假设39域表示响应码，00表示成功
            response.SetString(41, terminalId); // 终端ID

            var responseBytes = response.PackSendBuffer();

            await context.Transport.Output.WriteAsync(responseBytes);

            await Task.CompletedTask;
        }
    }
}
