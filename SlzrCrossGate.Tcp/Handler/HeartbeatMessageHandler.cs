using Microsoft.Extensions.Logging;
using SlzrCrossGate.Common;
using SlzrCrossGate.Core.Models;
using SlzrCrossGate.Tcp.Protocol;
using System.Text;
using System.Threading.Tasks;

namespace SlzrCrossGate.Tcp.Handler
{
    [MessageType(Iso8583MessageType.HeartRequest)]
    public class HeartbeatMessageHandler : IIso8583MessageHandler
    {
        private readonly ILogger<HeartbeatMessageHandler> _logger;
        private readonly Iso8583Schema _schema;

        public HeartbeatMessageHandler(ILogger<HeartbeatMessageHandler> logger, Iso8583Schema schema)
        {
            _logger = logger;
            _schema = schema;
        }

        public async Task<Iso8583Message> HandleMessageAsync(TcpConnectionContext context, Iso8583Message message)
        {
            var response = new Iso8583Message(_schema, Iso8583MessageType.HeartResponse);
            //response.SetField(3, "805001");
            response.Ok();

            return await Task.FromResult(response);
        }
    }
}

