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
            // TODO:����IC��ҵ��ָ��
            _logger.LogInformation("TODO:����IC��ҵ��ָ��");

            // ����IC��ҵ����Ӧ
            var response = new Iso8583Message(_schema);
            response.MessageType = "0350"; 
            response.SetField(41, message.TerimalID); 

            var responseBytes = response.Pack();

            await context.Transport.Output.WriteAsync(responseBytes);
            await context.Transport.Output.FlushAsync();
        }
    }
}

