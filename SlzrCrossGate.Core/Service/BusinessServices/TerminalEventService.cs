using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SlzrCrossGate.Core.Models;
using SlzrCrossGate.Core.Repositories;
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

        private readonly Repository<TerminalEvent> _terminalEventRepository;
        private readonly ILogger<TerminalEventService> _logger;
        private readonly ConcurrentQueue<TerminalEvent> _eventQueue;
        private readonly Timer _timer;
        private readonly int _batchSize;
        private readonly TimeSpan _interval;
        private readonly SemaphoreSlim _semaphore = new SemaphoreSlim(1, 1);

        public TerminalEventService(
            Repository<TerminalEvent> terminalEventRepository,
            ILogger<TerminalEventService> logger,
            int batchSize = 100,
            TimeSpan? interval = null)
        {
            _terminalEventRepository = terminalEventRepository;
            _logger = logger;
            _eventQueue = new ConcurrentQueue<TerminalEvent>();
            _batchSize = batchSize;
            _interval = interval ?? TimeSpan.FromSeconds(10);

            _timer = new Timer(async _ => await ProcessQueueAsync(), null, _interval, _interval);
        }

        public async Task RecordTerminalEventAsync(string merchantId, string terminalId, TerminalEventType eventType, EventSeverity eventSeverity, string remark)
        {
            var terminalEvent = new TerminalEvent
            {
                MerchantID = merchantId,
                TerminalID = terminalId,
                EventName = eventType.ToString(),
                EventType = eventType,
                Severity = eventSeverity,
                Remark = remark,
                EventTime = DateTime.UtcNow
            };

            _eventQueue.Enqueue(terminalEvent);
            _logger.LogInformation("Queued terminal event: {MerchantID} {TerminalID} {EventName} {Severity} {Remark}", merchantId, terminalId, eventType, eventSeverity, remark);

            if (_semaphore.CurrentCount == 1 && _eventQueue.Count >= _batchSize)
            {
                await ProcessQueueAsync();
            }
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
                        await _terminalEventRepository.AddRangeAsync(eventsToProcess);
                        _logger.LogInformation("Processed {Count} terminal events", eventsToProcess.Count);
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


}
