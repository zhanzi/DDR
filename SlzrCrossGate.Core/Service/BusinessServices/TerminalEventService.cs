using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
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
    public class TerminalEventService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<TerminalEventService> _logger;
        private readonly ConcurrentQueue<TerminalEvent> _eventQueue;
        private readonly IRabbitMQService _rabbitMQService;
        private readonly Timer _timer;
        private readonly int _batchSize;
        private readonly TimeSpan _interval;
        private readonly SemaphoreSlim _semaphore = new SemaphoreSlim(1, 1);

        private readonly string EXCHANGE_NAME = "SlzrCrossGate.Event";
        private readonly string QUEUE_NAME = "SlzrCrossGate.Event.Queue.TerminalEvent";
        private readonly string ROUTING_KEY = "Event.TerminalEvent";

        public TerminalEventService(IServiceProvider serviceProvider,
            ILogger<TerminalEventService> logger,
            IRabbitMQService rabbitMQService,
            int batchSize = 100,
            TimeSpan? interval = null)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
            _eventQueue = new ConcurrentQueue<TerminalEvent>();
            _rabbitMQService = rabbitMQService;
            _batchSize = batchSize;
            _interval = interval ?? TimeSpan.FromSeconds(10);


            _timer = new Timer(async _ => await ProcessQueueAsync(), null, _interval, _interval);

            _ = Task.Run(Subscribe);
        }

        public async Task RecordTerminalEventAsync(TerminalEvent terminalEvent)
        {
            _eventQueue.Enqueue(terminalEvent);
            _logger.LogInformation("Queued terminal event: {MerchantID} {TerminalID} {EventName} {Severity} {Remark}", terminalEvent.MerchantID, terminalEvent.TerminalID, terminalEvent.EventName, terminalEvent.Severity, terminalEvent.Remark);

            if (_semaphore.CurrentCount == 1 && _eventQueue.Count >= _batchSize)
            {
                await ProcessQueueAsync();
            }
        }


        public async Task Subscribe()
        {
            await _rabbitMQService.SubscribeAsync<TerminalEventMessage>(EXCHANGE_NAME, QUEUE_NAME, ROUTING_KEY, (message)=>{

                return Task.Run(async () =>
                {
                    var terminalEvent = new TerminalEvent
                    {
                        MerchantID = message.MerchantID,
                        TerminalID = message.TerminalID,
                        EventType = message.EventType,
                        Severity = message.Severity,
                        Remark = message.Remark,
                        Operator = message.Operator,
                        EventTime = DateTime.UtcNow
                    };

                    await RecordTerminalEventAsync(terminalEvent);
                });
            }, true);
        }

        public async Task ProcessQueueAsync()
        {
            await _semaphore.WaitAsync();
            try
            {
                var eventsToProcess = new List<TerminalEvent>();

                while (eventsToProcess.Count < _batchSize && _eventQueue.TryDequeue(out var terminalEvent))
                {
                    eventsToProcess.Add(terminalEvent);
                }

                if (eventsToProcess.Count > 0)
                {
                    try
                    {
                        // 创建一个新的作用域来解析作用域服务
                        using (var scope = _serviceProvider.CreateScope())
                        {
                            var _terminalEventRepository = scope.ServiceProvider.GetRequiredService<Repository<TerminalEvent>>();
                            await _terminalEventRepository.AddRangeAsync(eventsToProcess);
                            _logger.LogInformation("Processed {Count} terminal events", eventsToProcess.Count);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error processing terminal events");
                        // 如果处理失败，可以选择将事件重新加入队列，或者记录失败的事件
                        foreach (var terminalEvent in eventsToProcess)
                        {
                            _eventQueue.Enqueue(terminalEvent);
                        }
                    }
                }
            }
            finally
            {
                _semaphore.Release();
            }
        }


    }

    public class TerminalEventPublishService
    {
        private readonly IRabbitMQService _rabbitMQService;
        private readonly ILogger<TerminalEventPublishService> _logger;

        private readonly string EXCHANGE_NAME = "SlzrCrossGate.Event";
        private readonly string ROUTING_KEY = "Event.TerminalEvent";

        public TerminalEventPublishService(IRabbitMQService rabbitMQService, ILogger<TerminalEventPublishService> logger)
        {
            _rabbitMQService = rabbitMQService;
            _logger = logger;
        }

        public async Task PublishTerminalEventAsync(TerminalEventMessage message)
        {
            await _rabbitMQService.PublishAsync(EXCHANGE_NAME,ROUTING_KEY,message);
            _logger.LogInformation("Published terminal event: {MerchantID} {TerminalID} {EventName} {Severity} {Remark}", message.MerchantID, message.TerminalID, message.EventName, message.Severity, message.Remark);
        }
    }
}
