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

        public async Task<Iso8583Message> HandleMessageAsync(TcpConnectionContext context, Iso8583Message message)
        {

            var unionKey = await _unionPayTerminalKeyService.BindUnionPayTerminalKey(message.MerchantID,message.TerimalID, message.MachineID, message.LineNO, message.DeviceNO);

            var response = new Iso8583Message(_schema, "0410");

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
            response.Ok();
            return response;
        }
    }
}

