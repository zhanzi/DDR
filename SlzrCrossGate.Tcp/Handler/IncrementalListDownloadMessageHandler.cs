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
            // 处理增量名单下载指令
            _logger.LogInformation("处理增量名单下载指令");

            // 获取终端ID
            var terminalId = message.GetString(41); // 假设终端ID在41域

            // 获取增量名单
            //var incrementalList = await _listService.GetIncrementalListAsync(terminalId);

            // 记录增量名单下载日志
            _logger.LogInformation($"终端 {terminalId} 下载增量名单");

            // 发送增量名单下载响应
            var response = new Iso8583Package(_schema);
            response.MessageType = "0550"; // 假设响应类型为0810
            response.SetString(39, "00"); // 假设39域表示响应码，00表示成功
            response.SetString(41, terminalId); // 终端ID

            // 假设62域存储增量名单
            //var listData = ConvertListToByteArray(incrementalList);
            //response.SetArrayData(62, listData);

            var responseBytes = response.PackSendBuffer();

            await context.Transport.Output.WriteAsync(responseBytes);

            await Task.CompletedTask;
        }

        private byte[] ConvertListToByteArray(IEnumerable<string> list)
        {
            // 将名单列表转换为字节数组
            // 这里可以根据具体的名单格式进行实现
            // 例如，将每个名单项转换为字符串，然后将字符串转换为字节数组
            var listString = string.Join("\n", list);
            return System.Text.Encoding.UTF8.GetBytes(listString);
        }
    }
}

