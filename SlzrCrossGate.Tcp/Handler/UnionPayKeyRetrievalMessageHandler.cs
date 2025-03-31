using Microsoft.Extensions.Logging;
using SlzrCrossGate.Common;
using SlzrCrossGate.Core.Service.BusinessServices;
using SlzrCrossGate.Tcp.Protocol;
using System.Text;
using System.Threading.Tasks;

namespace SlzrCrossGate.Tcp.Handler
{
    [MessageType("0400")]
    public class UnionPayKeyRetrievalMessageHandler : IIso8583MessageHandler
    {
        private readonly ILogger<UnionPayKeyRetrievalMessageHandler> _logger;
        private readonly UnionPayTerminalKeyService _unionPayTerminalKeyService;
        private readonly Iso8583Schema _schema;

        public UnionPayKeyRetrievalMessageHandler(ILogger<UnionPayKeyRetrievalMessageHandler> logger, Iso8583Schema schema, UnionPayTerminalKeyService unionPayTerminalKeyService)
        {
            _logger = logger;
            _schema = schema;
            _unionPayTerminalKeyService = unionPayTerminalKeyService;
        }

        public async Task HandleMessageAsync(TcpConnectionContext context, Iso8583Message message)
        {

            var unionKey = await _unionPayTerminalKeyService.BindUnionPayTerminalKey(message.MerchantID, message.MachineID, message.LineNO, message.DeviceNO);

            // 发送密钥获取响应
            var response = new Iso8583Message(_schema);
            response.MessageType = "0410"; 
            response.SetField(39, "00"); 
            response.SetField(41, message.MachineID);

            if (unionKey is null)
            {
                response.SetField(62, DataConvert.HexToBytes("B001"));
            }
            else
            {
                IEnumerable<byte> content = ASCIIEncoding.ASCII.GetBytes(unionKey.UP_MerchantID)
                    .Concat(ASCIIEncoding.ASCII.GetBytes(unionKey.UP_TerminalID))
                    .Concat(DataConvert.HexToBytes(unionKey.UP_Key))
                    .Concat(DataConvert.HexToBytes("9000"));
                response.SetField(62, content.ToArray());
            }
            var responseBytes = response.Pack();

            await context.Transport.Output.WriteAsync(responseBytes);

            await Task.CompletedTask;
        }
    }
}

