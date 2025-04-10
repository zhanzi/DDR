using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SlzrCrossGate.Core.Models;
using SlzrCrossGate.Core.Repositories;
using SlzrCrossGate.Core.Services;
using SlzrCrossGate.Core.Services.BusinessServices;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SlzrCrossGate.Core.Service.BusinessServices
{
    public class FilePublishEventService
    {
        private readonly ILogger<FilePublishEventService> _logger;
        private readonly RabbitMQService _rabbitMQService;

        private readonly string EXCHANGE_NAME = "SlzrDatatransferModel.ConsumeData:SlzrDatatransferModel";
        private readonly string QUEUE_NAME = "SlzrDatatransferModel.ConsumeData:TcpServer";
        private readonly string ROUTING_KEY = "Tcp.city.#";

        public FilePublishEventService(
            ILogger<FilePublishEventService> logger,RabbitMQService rabbitMQService)
        {
            _logger = logger;
            _rabbitMQService = rabbitMQService;
        }
        public async Task Subscribe(Func<FilePublishEventMessage,Task> handle)
        {
            await _rabbitMQService.SubscribeAsync<FilePublishEventMessage>(EXCHANGE_NAME, QUEUE_NAME, ROUTING_KEY, handle, true);
        }

        public async Task Publish(FilePublishEventMessage filePublishEventMessage) { 
            await _rabbitMQService.PublishAsync(EXCHANGE_NAME, ROUTING_KEY, filePublishEventMessage);
        }

    }


}
