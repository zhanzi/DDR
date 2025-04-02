using Microsoft.Extensions.Logging;
using SlzrCrossGate.Tcp.Protocol;
using System.Threading.Tasks;
using System.Collections.Generic;
using SlzrCrossGate.Core.Service.BusinessServices;

namespace SlzrCrossGate.Tcp.Handler
{
    [MessageType("0540")]
    public class IncrementalListDownloadMessageHandler : IIso8583MessageHandler
    {
        private readonly ILogger<IncrementalListDownloadMessageHandler> _logger;
        private readonly Iso8583Schema _schema;
        private readonly IncrementContentService _incrementContentService;

        public IncrementalListDownloadMessageHandler(ILogger<IncrementalListDownloadMessageHandler> logger, Iso8583Schema schema, IncrementContentService incrementContentService)
        {
            _logger = logger;
            _schema = schema;
            _incrementContentService = incrementContentService;
        }

        public async Task<Iso8583Message> HandleMessageAsync(TcpConnectionContext context, Iso8583Message message)
        {
            var incrementContentRequest = message.GetString(55);
            var incrementType = incrementContentRequest.Substring(0, 4);
            var curSerialNum = Convert.ToInt32(incrementContentRequest.Substring(4, 8), 16);
            var count = Convert.ToInt32(incrementContentRequest.Substring(12, 8), 16);

            var contentResponse = await _incrementContentService.GetIncrementContentAsync(message.MerchantID, incrementType, curSerialNum, count);

            // 发送增量名单下载响应
            var response = new Iso8583Message(_schema, "0550");

            response.SetField(56, contentResponse?? $"{incrementType}000000000000000000000000");
            response.Ok();

            return response;
        }

    }
}

