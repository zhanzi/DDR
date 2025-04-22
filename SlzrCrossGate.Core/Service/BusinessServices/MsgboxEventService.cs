using Microsoft.Extensions.Logging;
using SlzrCrossGate.Core.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SlzrCrossGate.Core.Service.BusinessServices
{
    public class MsgboxEventService
    {
        private readonly ILogger<MsgboxEventService> _logger;
        private readonly IRabbitMQService _rabbitMQService;

        private readonly string EXCHANGE_NAME = "SlzrCrossGate.Event";
        private readonly string QUEUE_NAME = "SlzrCrossGate.Event.Queue.MsgboxEvent";
        private readonly string ROUTING_KEY = "Event.MsgboxEvent";

        public MsgboxEventService(
            ILogger<MsgboxEventService> logger, IRabbitMQService rabbitMQService)
        {
            _logger = logger;
            _rabbitMQService = rabbitMQService;
        }

        /// <summary>
        /// 清空队列
        /// </summary>
        /// <returns></returns>
        public async Task PurgeQueue() {
            
            await _rabbitMQService.PurgeQueue(QUEUE_NAME);
        }

        public async Task Subscribe(Func<MsgboxEventMessage, Task> handle)
        {
            await _rabbitMQService.SubscribeAsync<MsgboxEventMessage>(EXCHANGE_NAME, QUEUE_NAME, ROUTING_KEY, handle, true);
        }

        public async Task Publish(MsgboxEventMessage  msgboxEventMessage)
        {
            await _rabbitMQService.PublishAsync(EXCHANGE_NAME, ROUTING_KEY, msgboxEventMessage);
        }
    }
}
