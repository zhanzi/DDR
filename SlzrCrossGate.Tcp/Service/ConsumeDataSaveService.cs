using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SlzrCrossGate.Common;
using SlzrCrossGate.Core.Service.BusinessServices;
using SlzrCrossGate.Core.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Channels;
using System.Threading.Tasks;

namespace SlzrCrossGate.Tcp.Service
{
    /// <summary>
    /// 消费数据保存服务(订阅MQ数据)
    /// </summary>
    public class ConsumeDataSaveService : BackgroundService
    {
        private readonly RabbitMQService _rabbitMQService;
        private readonly ILogger<ConsumeDataSaveService> _logger;
        private readonly ConsumeDataService _consumeDataService;

        private readonly Channel<(Core.Models.ConsumeData, ulong)> _consumeDataChannel;
        private readonly TimeSpan _batchInterval = TimeSpan.FromSeconds(5); // 批量插入间隔时间
        private readonly int _batchSize = 200; // 批量大小
        private Timer? _timer;
        private int _currentBatchSize = 0;
        private readonly SemaphoreSlim _semaphore = new SemaphoreSlim(1, 1);

        public ConsumeDataSaveService(RabbitMQService rabbitMQService, ILogger<ConsumeDataSaveService> logger,
            ConsumeDataService consumeDataService)
        {
            _rabbitMQService = rabbitMQService;
            _logger = logger;
            _consumeDataService = consumeDataService;
            _consumeDataChannel = Channel.CreateUnbounded<(Core.Models.ConsumeData, ulong)>();
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _timer = new Timer(async _ => await ProcessQueueAsync(), null, _batchInterval, _batchInterval);

            await _rabbitMQService.SubscribeConsumeDataAsync(async (consumeData,deliveryTag) =>
            {
                Core.Models.ConsumeData entity = new Core.Models.ConsumeData
                {
                    MachineID = consumeData.MachineID,
                    MerchantID = consumeData.MerchantID,
                    MachineNO = consumeData.MachineNO,
                    PsamNO = consumeData.PsamNO,
                    ReceiveTime = DateTime.Now,
                    Buffer = DataConvert.BytesToHex(consumeData.buffer)
                };
                await _consumeDataChannel.Writer.WriteAsync((entity, deliveryTag));
                Interlocked.Increment(ref _currentBatchSize);
                if (_currentBatchSize >= _batchSize)
                {
                    await ProcessQueueAsync();
                }
            }, false);
        }

        private async Task ProcessQueueAsync()
        {
            await _semaphore.WaitAsync();
            try
            {
                var batch = new List<Core.Models.ConsumeData>();
                var deliveryTags = new List<ulong>();

                while (batch.Count < _batchSize && _consumeDataChannel.Reader.TryRead(out var item))
                {
                    batch.Add(item.Item1);
                    deliveryTags.Add(item.Item2);
                }

                if (batch.Count > 0)
                {
                    try
                    {
                        await _consumeDataService.BatchInsert(batch);
                        _logger.LogInformation($"Batch inserted {batch.Count} consume data records.");

                        // 确认消息
                        foreach (var deliveryTag in deliveryTags)
                        {
                            _rabbitMQService.Ack(deliveryTag);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error inserting batch consume data records.");

                        // 消息重新入队
                        foreach (var deliveryTag in deliveryTags)
                        {
                            _rabbitMQService.NAck(deliveryTag, true);
                        }
                    }
                    finally
                    {
                        Interlocked.Add(ref _currentBatchSize, -batch.Count);
                    }
                }
            }
            finally
            {
                _semaphore.Release();
            }
        }

        public override async Task StopAsync(CancellationToken cancellationToken)
        {
            _timer?.Change(Timeout.Infinite, 0);
            await ProcessQueueAsync(); // 处理剩余数据
            await base.StopAsync(cancellationToken);
        }
    }
}
