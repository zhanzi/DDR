using Microsoft.Extensions.Logging;
using SlzrCrossGate.Common;
using SlzrCrossGate.Core.Models;
using SlzrCrossGate.Tcp.Protocol;
using System.Text;
using System.Threading.Tasks;

namespace SlzrCrossGate.Tcp.Handler
{
    [MessageType("0880")]
    public class HeartbeatMessageHandler : IIso8583MessageHandler
    {
        private readonly ILogger<HeartbeatMessageHandler> _logger;
        private readonly Iso8583Schema _schema;

        public HeartbeatMessageHandler(ILogger<HeartbeatMessageHandler> logger, Iso8583Schema schema)
        {
            _logger = logger;
            _schema = schema;
        }

        public async Task HandleMessageAsync(TcpConnectionContext context, Iso8583Message message)
        {
            var response = new Iso8583Message(_schema);
            response.MessageType = "0890";
            response.SetField(3, "805001");
            response.SetField(39, "0000");
            response.SetDateTime(12, DateTime.Now);
            response.SetDateTime(13, DateTime.Now);
            response.SetField(41, message.MachineID);

            var responseBytes = response.Pack();

            await context.Transport.Output.WriteAsync(responseBytes);
            await context.Transport.Output.FlushAsync();
        }
    }
}

