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
            // 处理银联终端密钥获取指令
            _logger.LogInformation("处理银联终端密钥获取指令");

            // 获取终端ID
            var terminalId = message.GetString(41); // 假设终端ID在41域

            // 获取密钥
            //var key = await _keyService.GetKeyAsync(terminalId);

            // 记录密钥获取日志
            _logger.LogInformation("终端 {TerminalId} 获取密钥", terminalId);

            // 发送密钥获取响应
            var response = new Iso8583Message(_schema);
            response.MessageType = "0410"; // 假设响应类型为0410
            response.SetField(39, "00"); // 假设39域表示响应码，00表示成功
            response.SetField(41, terminalId); // 终端ID
                                               // response.SetString(62, key); // 假设62域存储密钥

            var responseBytes = response.Pack();

            await context.Transport.Output.WriteAsync(responseBytes);

            await Task.CompletedTask;
        }
    }
}

