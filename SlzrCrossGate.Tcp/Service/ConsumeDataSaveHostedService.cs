using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using RabbitMQ.Client;
using SlzrCrossGate.Common;
using SlzrCrossGate.Core.Models;
using SlzrCrossGate.Core.Repositories;
using SlzrCrossGate.Core.Service.BusinessServices;
using SlzrCrossGate.Core.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Channels;
using System.Threading.Tasks;

namespace SlzrCrossGate.Tcp.Service
{
    /// <summary>
    /// 消费数据保存服务(订阅MQ数据)
    /// </summary>
    public class ConsumeDataSaveHostedService : BackgroundService
    {
        private readonly IRabbitMQService _rabbitMQService;
        private readonly ILogger<ConsumeDataSaveHostedService> _logger;
        private readonly IServiceScopeFactory _scopeFactory;

        private readonly Channel<(Core.Models.ConsumeData, ChannelTag)> _consumeDataChannel;
        private readonly TimeSpan _batchInterval = TimeSpan.FromSeconds(5); // 批量插入间隔时间
        private readonly int _batchSize = 200; // 批量大小
        private Timer? _timer;
        private int _currentBatchSize = 0;
        private readonly SemaphoreSlim _semaphore = new SemaphoreSlim(1, 1);

        public ConsumeDataSaveHostedService(IRabbitMQService rabbitMQService, ILogger<ConsumeDataSaveHostedService> logger,
            IServiceScopeFactory scopeFactory)
        {
            _rabbitMQService = rabbitMQService;
            _logger = logger;
            _scopeFactory = scopeFactory;
            _consumeDataChannel = Channel.CreateUnbounded<(Core.Models.ConsumeData,ChannelTag)>();
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _timer = new Timer(async _ => await ProcessQueueAsync(), null, _batchInterval, _batchInterval);

            await _rabbitMQService.SubscribeConsumeDataAsync(async (consumeData, channel, deliveryTag) =>
            {
                Core.Models.ConsumeData entity = new Core.Models.ConsumeData
                {
                    MachineID = consumeData.MachineID,
                    MerchantID = consumeData.MerchantID,
                    MachineNO = consumeData.MachineNO,
                    PsamNO = consumeData.PsamNO,
                    ReceiveTime = DateTime.Now,
                    Buffer = consumeData.buffer
                };
                await _consumeDataChannel.Writer.WriteAsync((entity, new ChannelTag(channel, deliveryTag)));
                Interlocked.Increment(ref _currentBatchSize);
                if (_semaphore.CurrentCount == 1 && _currentBatchSize >= _batchSize)
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
                var deliveryTags = new List<ChannelTag>();

                while (batch.Count < _batchSize && _consumeDataChannel.Reader.TryRead(out var item))
                {
                    batch.Add(item.Item1);
                    deliveryTags.Add(item.Item2);
                }

                if (batch.Count > 0)
                {
                    try
                    {
                        using var scope = _scopeFactory.CreateScope();
                        var consumeDataService = scope.ServiceProvider.GetRequiredService<ConsumeDataService>();
                        await consumeDataService.BatchInsert(batch);
                        _logger.LogInformation($"Batch inserted {batch.Count} consume data records.");

                        // 确认消息
                        foreach (var deliveryTag in deliveryTags)
                        {
                            _ = _rabbitMQService.Ack(deliveryTag.channel, deliveryTag.tag);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error inserting batch consume data records.");

                        // 消息重新入队
                        foreach (var deliveryTag in deliveryTags)
                        {
                            _ = _rabbitMQService.NAck(deliveryTag.channel, deliveryTag.tag, true);
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
    public record ChannelTag (
        IChannel channel,
        ulong tag
    );
}
