using Microsoft.Extensions.Logging;
using SlzrCrossGate.Tcp.Protocol;
using System.Threading.Tasks;

namespace SlzrCrossGate.Tcp.Handler
{
    [MessageType("0340")]
    public class ICCardBusinessMessageHandler : IIso8583MessageHandler
    {
        private readonly ILogger<ICCardBusinessMessageHandler> _logger;
        //private readonly ICardService _cardService;
        private readonly Iso8583Schema _schema;

        public ICCardBusinessMessageHandler(ILogger<ICCardBusinessMessageHandler> logger, Iso8583Schema schema)
        {
            _logger = logger;
            //_cardService = cardService;
            _schema = schema;
        }

        public async Task HandleMessageAsync(TcpConnectionContext context, Iso8583Message message)
        {
            // TODO:处理IC卡业务指令
            _logger.LogInformation("TODO:处理IC卡业务指令");

            // 发送IC卡业务响应
            var response = new Iso8583Message(_schema);
            response.MessageType = "0350"; 
            response.SetField(41, message.TerimalID); 

            var responseBytes = response.Pack();

            await context.Transport.Output.WriteAsync(responseBytes);
            await context.Transport.Output.FlushAsync();
        }
    }
}

