using Microsoft.Extensions.Logging;
using SlzrCrossGate.Core.Service.FileStorage;
using SlzrCrossGate.Core.Services;
using SlzrCrossGate.Tcp.Protocol;

namespace SlzrCrossGate.Tcp.Handler
{
    [MessageType(Iso8583MessageType.DataTransferRequest)]
    public class DataUploadMessageHandler : IIso8583MessageHandler
    {
        private readonly ILogger<DataUploadMessageHandler> _logger;
        private readonly FileService _fileService;
        private readonly Iso8583Schema _schema;
        private readonly IRabbitMQService _rabbitMQService;

        public DataUploadMessageHandler(ILogger<DataUploadMessageHandler> logger, FileService fileService, Iso8583Schema schema,IRabbitMQService rabbitMQService)
        {
            _logger = logger;
            _fileService = fileService;
            _schema = schema;
            _rabbitMQService = rabbitMQService;
        }

        public async Task<Iso8583Message> HandleMessageAsync(TcpConnectionContext context, Iso8583Message message)
        {
            // ��ȡ�ϴ�������
            var data = message.GetBytes(61); 

            // �ϴ�MQ
            await _rabbitMQService.PublishConsumeDataAsync(new SlzrDatatransferModel.ConsumeData()
            {
                MachineID = message.MachineID,
                MerchantID = message.MerchantID,
                MachineNO = message.DeviceNO,
                PsamNO = "",
                buffer = data
            });

            // �����ϴ��ɹ���Ӧ
            var response = new Iso8583Message(_schema, Iso8583MessageType.DataTransferResponse);
            response.SetField(11, message.GetString(11));
            response.SetField(14, message.GetString(14));
            response.Ok();

            return response;
        }
    }
}
