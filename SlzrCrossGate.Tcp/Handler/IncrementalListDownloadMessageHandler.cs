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

        public async Task HandleMessageAsync(TcpConnectionContext context, Iso8583Message message)
        {
            var incrementContentRequest = message.GetString(55);
            var incrementType = incrementContentRequest.Substring(0, 4);
            var curSerialNum = Convert.ToInt32(incrementContentRequest.Substring(4, 8), 16);
            var count = Convert.ToInt32(incrementContentRequest.Substring(12, 8), 16);

            var contentResponse = await _incrementContentService.GetIncrementContentAsync(message.MerchantID, incrementType, curSerialNum, count);

            // ������������������Ӧ
            var response = new Iso8583Message(_schema);
            response.MessageType = "0550";
            response.SetField(39, "00");
            response.SetField(41, message.MachineID);
            response.SetField(56, contentResponse?? $"{incrementType}000000000000000000000000");

            var responseBytes = response.Pack();

            await context.Transport.Output.WriteAsync(responseBytes);
            await context.Transport.Output.FlushAsync();
        }

        private byte[] ConvertListToByteArray(IEnumerable<string> list)
        {
            // �������б�ת��Ϊ�ֽ�����
            // ������Ը��ݾ����������ʽ����ʵ��
            // ���磬��ÿ��������ת��Ϊ�ַ�����Ȼ���ַ���ת��Ϊ�ֽ�����
            var listString = string.Join("\n", list);
            return System.Text.Encoding.UTF8.GetBytes(listString);
        }
    }
}

