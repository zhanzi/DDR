using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using RabbitMQ.Client.Exceptions;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace SlzrCrossGate.Core.Services
{
    public class RabbitMQOptions
    {
        public string HostName { get; set; } = "localhost";
        public string UserName { get; set; } = "guest";
        public string Password { get; set; } = "guest";
        public int Port { get; set; } = 5672;
        public string VirtualHost { get; set; } = "/";
        public string TcpExchange { get; set; } = "SlzrCrossGate.Data";
        public string TcpQueue { get; set; } = "SlzrCrossGate.Data.Queue.ConsumeData";
        public int ConnectionRetryCount { get; set; } = 5;
        public int ConnectionRetryIntervalSeconds { get; set; } = 5;
        public int PublishConfirmTimeoutSeconds { get; set; } = 5;
        public int PublishChannelPoolSize { get; set; } = 10;
        public int ConsumeChannelPoolSize { get; set; } = 5;
    }

    public class RabbitMQService : IRabbitMQService, IDisposable, IAsyncDisposable
    {
        private IConnection? _connection;
        private readonly ILogger<RabbitMQService> _logger;
        private readonly RabbitMQOptions _options;
        private readonly SemaphoreSlim _connectionLock = new SemaphoreSlim(1, 1);

        // 发布消息的通道池
        private readonly ConcurrentBag<IChannel> _publishChannelPool = new ConcurrentBag<IChannel>();
        // 消费消息的通道池
        private readonly ConcurrentDictionary<string, IChannel> _consumeChannels = new ConcurrentDictionary<string, IChannel>();
        // 默认通道（用于向后兼容和简单操作）
        private IChannel? _defaultChannel;

        // 连接状态
        private bool _isConnected = false;
        private readonly CancellationTokenSource _connectionCts = new CancellationTokenSource();

        // 消费者集合，用于重连后重新订阅
        private readonly ConcurrentDictionary<string, ConsumerInfo> _consumers = new ConcurrentDictionary<string, ConsumerInfo>();

        public RabbitMQService(IOptions<RabbitMQOptions> options, ILogger<RabbitMQService> logger)
        {
            _logger = logger;
            _options = options.Value;

            // 初始化连接
            InitializeConnectionAsync().GetAwaiter().GetResult();

            // 监听应用程序退出事件，确保资源正确释放
            AppDomain.CurrentDomain.ProcessExit += (sender, e) => Dispose();
        }

        /// <summary>
        /// 初始化RabbitMQ连接
        /// </summary>
        private async Task InitializeConnectionAsync()
        {
            await _connectionLock.WaitAsync();
            try
            {
                if (_isConnected)
                {
                    return;
                }

                var factory = new ConnectionFactory
                {
                    HostName = _options.HostName,
                    UserName = _options.UserName,
                    Password = _options.Password,
                    Port = _options.Port,
                    VirtualHost = _options.VirtualHost,
                    // 添加自动重连功能
                    AutomaticRecoveryEnabled = true,
                    // 设置重连间隔
                    NetworkRecoveryInterval = TimeSpan.FromSeconds(_options.ConnectionRetryIntervalSeconds),
                    // 连接超时
                    ContinuationTimeout = TimeSpan.FromSeconds(30),
                    // 心跳检测
                    RequestedHeartbeat = TimeSpan.FromSeconds(60)
                };

                // 尝试建立连接，带重试机制
                for (int attempt = 0; attempt < _options.ConnectionRetryCount; attempt++)
                {
                    try
                    {
                        _connection = await factory.CreateConnectionAsync();

                        // 设置连接状态
                        _isConnected = true;
                        _logger.LogInformation("RabbitMQ connection established successfully");

                        // 初始化通道池
                        await InitializeChannelPoolsAsync();

                        break;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to connect to RabbitMQ (Attempt {Attempt}/{MaxAttempts})", attempt + 1, _options.ConnectionRetryCount);

                        if (attempt < _options.ConnectionRetryCount - 1)
                        {
                            await Task.Delay(TimeSpan.FromSeconds(_options.ConnectionRetryIntervalSeconds));
                        }
                        else
                        {
                            _logger.LogError(ex, "Failed to connect to RabbitMQ after {MaxAttempts} attempts. Service will continue but RabbitMQ functionality will be limited.", _options.ConnectionRetryCount);
                        }
                    }
                }
            }
            finally
            {
                _connectionLock.Release();
            }
        }

        /// <summary>
        /// 初始化通道池
        /// </summary>
        private async Task InitializeChannelPoolsAsync()
        {
            try
            {
                if (_connection == null || !_connection.IsOpen)
                {
                    _logger.LogWarning("Cannot initialize channel pools because RabbitMQ connection is not available");
                    return;
                }

                // 清空现有通道池
                while (_publishChannelPool.TryTake(out var channel))
                {
                    try { await channel.CloseAsync(); } catch { }
                    try { channel.Dispose(); } catch { }
                }

                // 创建默认通道
                _defaultChannel = await _connection.CreateChannelAsync();

                // 确保交换机存在
                await _defaultChannel.ExchangeDeclareAsync(_options.TcpExchange, ExchangeType.Topic, true);
                // 创建默认的消费数据接收队列
                await _defaultChannel.QueueDeclareAsync(_options.TcpQueue, true, false, false, null);
                // 创建默认绑定关系
                await _defaultChannel.QueueBindAsync(_options.TcpQueue, _options.TcpExchange, "Tcp.city.#");

                // 初始化发布通道池
                for (int i = 0; i < _options.PublishChannelPoolSize; i++)
                {
                    var channel = await _connection.CreateChannelAsync();
                    // 启用发布确认 - 在RabbitMQ.Client 7.1.2中不需要显式调用
                    _publishChannelPool.Add(channel);
                }

                _logger.LogInformation("RabbitMQ channel pools initialized with {PublishPoolSize} publish channels", _options.PublishChannelPoolSize);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error initializing RabbitMQ channel pools");
            }
        }

        /// <summary>
        /// 从发布通道池获取一个通道
        /// </summary>
        private async Task<IChannel?> GetPublishChannelAsync()
        {
            // 如果连接不可用，尝试重新连接
            if (!_isConnected)
            {
                await InitializeConnectionAsync();
            }

            if (_publishChannelPool.TryTake(out var channel) && channel.IsOpen)
            {
                return channel;
            }

            try
            {
                if (_connection?.IsOpen == true)
                {
                    var newChannel = await _connection.CreateChannelAsync();
                    // 启用发布确认 - 在RabbitMQ.Client 7.1.2中不需要显式调用
                    return newChannel;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating new publish channel");
            }

            return null;
        }

        /// <summary>
        /// 将通道返回到发布通道池
        /// </summary>
        private void ReturnPublishChannel(IChannel? channel)
        {
            if (channel?.IsOpen == true)
            {
                _publishChannelPool.Add(channel);
            }
            else if (channel != null)
            {
                try { channel.Dispose(); } catch { }
            }
        }

        /// <summary>
        /// 获取或创建消费通道
        /// </summary>
        private async Task<IChannel?> GetOrCreateConsumeChannelAsync(string queueName)
        {
            // 如果连接不可用，尝试重新连接
            if (!_isConnected)
            {
                await InitializeConnectionAsync();
            }

            if (_consumeChannels.TryGetValue(queueName, out var existingChannel) && existingChannel.IsOpen)
            {
                return existingChannel;
            }

            try
            {
                if (_connection?.IsOpen == true)
                {
                    var newChannel = await _connection.CreateChannelAsync();
                    // 设置预取计数，提高消费效率
                    await newChannel.BasicQosAsync(0, 100, false);
                    _consumeChannels[queueName] = newChannel;
                    return newChannel;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating new consume channel for queue {QueueName}", queueName);
            }

            return null;
        }

        /// <summary>
        /// 重新订阅所有消费者
        /// </summary>
        private async Task ResubscribeAllConsumersAsync()
        {
            foreach (var consumer in _consumers.Values)
            {
                try
                {
                    await consumer.ResubscribeAsync(this);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error resubscribing consumer for queue {QueueName}", consumer.QueueName);
                }
            }
        }

        /// <summary>
        /// 消费者信息类，用于重连后重新订阅
        /// </summary>
        private class ConsumerInfo
        {
            public string ExchangeName { get; }
            public string QueueName { get; }
            public string RoutingKey { get; }
            public bool AutoAck { get; }
            public Type MessageType { get; }
            public Delegate Handler { get; }
            public bool IsConsumeData { get; }

            public ConsumerInfo(string exchangeName, string queueName, string routingKey, bool autoAck, Type messageType, Delegate handler, bool isConsumeData = false)
            {
                ExchangeName = exchangeName;
                QueueName = queueName;
                RoutingKey = routingKey;
                AutoAck = autoAck;
                MessageType = messageType;
                Handler = handler;
                IsConsumeData = isConsumeData;
            }

            public async Task ResubscribeAsync(RabbitMQService service)
            {
                if (IsConsumeData && Handler is Func<SlzrDatatransferModel.ConsumeData,IChannel, ulong, Task> consumeDataHandler)
                {
                    await service.SubscribeConsumeDataInternalAsync(consumeDataHandler, AutoAck, true);
                }
                else if (!IsConsumeData)
                {
                    // 使用反射调用泛型方法
                    var method = typeof(RabbitMQService).GetMethod(nameof(SubscribeAsyncInternal), System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
                    var genericMethod = method?.MakeGenericMethod(MessageType);

                    if (genericMethod != null && Handler is Delegate handlerDelegate)
                    {
                        await (Task)genericMethod.Invoke(service, new object[] { ExchangeName, QueueName, RoutingKey, handlerDelegate, AutoAck, true })!;
                    }
                }
            }
        }


        public async Task DeclareTopicExchange(string exchange)
        {
            try
            {
                // 使用默认通道或从发布通道池获取通道
                var channel = _defaultChannel ?? await GetPublishChannelAsync();
                if (channel == null)
                {
                    _logger.LogWarning("Cannot declare exchange {Exchange} because RabbitMQ connection is not available", exchange);
                    return;
                }

                await channel.ExchangeDeclareAsync(exchange, ExchangeType.Topic, true);
                _logger.LogInformation("Declared topic exchange {Exchange}", exchange);

                // 如果使用了发布通道池的通道，将其返回池中
                if (channel != _defaultChannel)
                {
                    ReturnPublishChannel(channel);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error declaring topic exchange {Exchange}", exchange);
            }
        }

        public async Task PublishAsync<T>(string exchange, string routingKey, T message)
        {
            // 从发布通道池获取一个通道
            var channel = await GetPublishChannelAsync();
            if (channel == null)
            {
                _logger.LogWarning("Cannot publish message to {Exchange} with routing key {RoutingKey} because RabbitMQ connection is not available", exchange, routingKey);
                return;
            }

            try
            {
                // 序列化消息
                var json = JsonSerializer.Serialize(message);
                var body = Encoding.UTF8.GetBytes(json);

                // 在RabbitMQ.Client 7.1.2中，我们使用简化的方式发布消息

                // 发布消息
                await channel.BasicPublishAsync(
                    exchange,
                    routingKey,
                    body);

                _logger.LogInformation("Message published to {Exchange} with routing key {RoutingKey}", exchange, routingKey);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error publishing message to {Exchange} with routing key {RoutingKey}", exchange, routingKey);
                // 不抛出异常，避免影响应用程序的正常运行
            }
            finally
            {
                // 将通道返回到池中
                ReturnPublishChannel(channel);
            }
        }

        public async Task SubscribeAsync<T>(string exchange, string queue, string routingKey, Func<T, Task> handler, bool autoAck = true)
        {
            await SubscribeAsyncInternal<T>(exchange, queue, routingKey, handler, autoAck, false);
        }

        /// <summary>
        /// 内部订阅方法，支持重连后重新订阅
        /// </summary>
        private async Task SubscribeAsyncInternal<T>(string exchange, string queue, string routingKey, Func<T, Task> handler, bool autoAck = true, bool isResubscribe = false)
        {
            // 获取或创建消费通道
            var channel = await GetOrCreateConsumeChannelAsync(queue);
            if (channel == null)
            {
                _logger.LogWarning("Cannot subscribe to {Exchange} with queue {Queue} and routing key {RoutingKey} because RabbitMQ connection is not available", exchange, queue, routingKey);
                return;
            }

            try
            {
                // 确保交换机存在
                await channel.ExchangeDeclareAsync(exchange, ExchangeType.Topic, true);
                // 创建队列，设置为持久化
                await channel.QueueDeclareAsync(queue, true, false, false, null);
                // 绑定队列到交换机
                await channel.QueueBindAsync(queue, exchange, routingKey);

                // 设置预取计数，提高消费效率
                await channel.BasicQosAsync(0, 100, false);

                // 创建消费者
                var consumer = new AsyncEventingBasicConsumer(channel);
                consumer.ReceivedAsync += async (model, ea) =>
                {
                    try
                    {
                        var body = ea.Body.ToArray();
                        var json = Encoding.UTF8.GetString(body);
                        var message = JsonSerializer.Deserialize<T>(json);

                        if (message != null)
                        {
                            await handler(message);
                        }

                        if (autoAck)
                        {
                            await channel.BasicAckAsync(ea.DeliveryTag, false);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error handling message by Subscriber to {Exchange} with queue {Queue} and routing key {RoutingKey}", exchange, queue, routingKey);

                        try
                        {
                            // 拒绝消息并重新入队（将再次处理）
                            await channel.BasicRejectAsync(ea.DeliveryTag, true);
                        }
                        catch (Exception rejectEx)
                        {
                            _logger.LogError(rejectEx, "Error rejecting message");
                        }
                    }
                };

                // 开始消费
                string consumerTag = await channel.BasicConsumeAsync(queue, false, consumer);

                // 如果不是重新订阅，则添加到消费者集合中，以便重连后重新订阅
                if (!isResubscribe)
                {
                    string consumerKey = $"{exchange}:{queue}:{routingKey}";
                    _consumers[consumerKey] = new ConsumerInfo(exchange, queue, routingKey, autoAck, typeof(T), handler);
                }

                _logger.LogInformation("Subscribed to {Exchange} with queue {Queue} and routing key {RoutingKey}", exchange, queue, routingKey);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error subscribing to {Exchange} with queue {Queue} and routing key {RoutingKey}", exchange, queue, routingKey);
            }
        }

        /// <summary>
        /// 批量处理消费数据，需要手动ACK
        /// </summary>
        /// <param name="handler">处理消费数据的回调函数</param>
        /// <param name="autoAck">是否自动确认消息</param>
        /// <returns></returns>
        public async Task SubscribeConsumeDataAsync(Func<SlzrDatatransferModel.ConsumeData,IChannel, ulong, Task> handler, bool autoAck = true)
        {
            await SubscribeConsumeDataInternalAsync(handler, autoAck, false);
        }

        /// <summary>
        /// 内部消费数据订阅方法，支持重连后重新订阅
        /// </summary>
        private async Task SubscribeConsumeDataInternalAsync(Func<SlzrDatatransferModel.ConsumeData,IChannel , ulong, Task> handler, bool autoAck = true, bool isResubscribe = false)
        {
            // 获取或创建消费通道
            var channel = await GetOrCreateConsumeChannelAsync(_options.TcpQueue);
            if (channel == null)
            {
                _logger.LogWarning("Cannot subscribe to consume data because RabbitMQ connection is not available");
                return;
            }

            try
            {
                // 确保交换机存在
                await channel.ExchangeDeclareAsync(_options.TcpExchange, ExchangeType.Topic, true);
                // 创建默认的消费数据接收队列
                await channel.QueueDeclareAsync(_options.TcpQueue, true, false, false, null);
                // 绑定队列到交换机
                await channel.QueueBindAsync(_options.TcpQueue, _options.TcpExchange, "Tcp.city.#");

                // 设置预取计数，提高消费效率
                await channel.BasicQosAsync(0, 100, false);

                // 创建消费者
                var consumer = new AsyncEventingBasicConsumer(channel);
                consumer.ReceivedAsync += async (model, ea) =>
                {
                    try
                    {
                        var body = ea.Body.ToArray();
                        var consumeData = JsonSerializer.Deserialize<SlzrDatatransferModel.ConsumeData>(body);
                        if (consumeData != null)
                        {
                            await handler(consumeData,channel, ea.DeliveryTag);
                        }

                        if (autoAck)
                        {
                            await channel.BasicAckAsync(ea.DeliveryTag, false);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error handling message by Subscriber to {Exchange} with queue {Queue} and routing key {RoutingKey}", _options.TcpExchange, _options.TcpQueue, "Tcp.city.#");
                        try
                        {
                            // 拒绝消息并重新入队（将再次处理）
                            await channel.BasicRejectAsync(ea.DeliveryTag, true);
                        }
                        catch (Exception rejectEx)
                        {
                            _logger.LogError(rejectEx, "Error rejecting message");
                        }
                    }
                };

                // 开始消费
                string consumerTag = await channel.BasicConsumeAsync(queue: _options.TcpQueue, autoAck: false, consumer: consumer);

                // 如果不是重新订阅，则添加到消费者集合中，以便重连后重新订阅
                if (!isResubscribe)
                {
                    string consumerKey = $"{_options.TcpExchange}:{_options.TcpQueue}:ConsumeData";
                    _consumers[consumerKey] = new ConsumerInfo(_options.TcpExchange, _options.TcpQueue, "Tcp.city.#", autoAck, typeof(SlzrDatatransferModel.ConsumeData), handler, true);
                }

                _logger.LogInformation("Subscribed to consume data with exchange {Exchange} and queue {Queue}", _options.TcpExchange, _options.TcpQueue);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error subscribing to RabbitMQ for consume data");
            }
        }

        /// <summary>
        /// 发布消费数据到RabbitMQ
        /// </summary>
        /// <param name="consumeData">消费数据</param>
        /// <returns></returns>
        public async Task PublishConsumeDataAsync(SlzrDatatransferModel.ConsumeData consumeData) {
            try
            {
                // 构建路由键
                string routingKey = $"Tcp.city.{0000}.{consumeData.MerchantID}";

                // 确保buffer数组长度足够
                if (consumeData.buffer != null && consumeData.buffer.Length > 2)
                {
                    routingKey += $".{consumeData.buffer[2].ToString("X2")}";
                }

                // 使用改进的PublishAsync方法发布消息
                await PublishAsync(_options.TcpExchange, routingKey, consumeData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error publishing consume data to RabbitMQ");
                // 不抛出异常，避免影响应用程序的正常运行
            }
        }


        /// <summary>
        /// 清空指定队列的数据
        /// </summary>
        /// <param name="queue">队列名称</param>
        /// <returns></returns>
        public async Task PurgeQueue(string queue)
        {
            try
            {
                // 使用默认通道或从发布通道池获取通道
                var channel = _defaultChannel ?? await GetPublishChannelAsync();
                if (channel == null)
                {
                    _logger.LogWarning("Cannot purge queue {Queue} because RabbitMQ connection is not available", queue);
                    return;
                }

                try
                {
                    // 先判断队列是否存在
                    await channel.QueueDeclarePassiveAsync(queue);
                    await channel.QueuePurgeAsync(queue);
                    _logger.LogInformation("Queue {Queue} purged successfully", queue);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Queue {Queue} does not exist or cannot be purged", queue);
                }
                finally
                {
                    // 如果使用了发布通道池的通道，将其返回池中
                    if (channel != _defaultChannel)
                    {
                        ReturnPublishChannel(channel);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error purging queue {Queue}", queue);
            }
        }


        /// <summary>
        /// 确认消息已经处理完成
        /// </summary>
        /// <param name="deliveryTag">消息标识</param>
        /// <returns></returns>
        public async Task Ack(ulong deliveryTag)
        {
            // 使用消费通道池中的所有通道尝试确认消息
            // 因为我们不知道这个消息是从哪个通道收到的
            bool acknowledged = false;

            // 先尝试默认通道
            if (_defaultChannel?.IsOpen == true)
            {
                try
                {
                    await _defaultChannel.BasicAckAsync(deliveryTag, false);
                    acknowledged = true;
                    return;
                }
                catch (Exception ex)
                {
                    // 如果失败，继续尝试其他通道
                    _logger.LogDebug(ex, "Failed to acknowledge message with delivery tag {DeliveryTag} on default channel", deliveryTag);
                }
            }

            // 如果默认通道失败，尝试消费通道池中的所有通道
            foreach (var channel in _consumeChannels.Values)
            {
                if (channel.IsOpen && !acknowledged)
                {
                    try
                    {
                        await channel.BasicAckAsync(deliveryTag, false);
                        acknowledged = true;
                        break;
                    }
                    catch (Exception ex)
                    {
                        // 如果失败，继续尝试下一个通道
                        _logger.LogDebug(ex, "Failed to acknowledge message with delivery tag {DeliveryTag} on a consume channel", deliveryTag);
                    }
                }
            }

            if (!acknowledged)
            {
                _logger.LogWarning("Failed to acknowledge message with delivery tag {DeliveryTag} on any channel", deliveryTag);
            }
        }

        public async Task Ack(IChannel channel, ulong deliveryTag) {
            await channel.BasicAckAsync(deliveryTag, false);
        }

        public async Task NAck(IChannel channel, ulong deliveryTag,bool requeue)
        {
            await channel.BasicRejectAsync(deliveryTag, requeue);
        }

        /// <summary>
        /// 拒绝消息
        /// </summary>
        /// <param name="deliveryTag">消息标识</param>
        /// <param name="requeue">是否重新入队</param>
        /// <returns></returns>
        public async Task NAck(ulong deliveryTag, bool requeue)
        {
            // 使用消费通道池中的所有通道尝试拒绝消息
            // 因为我们不知道这个消息是从哪个通道收到的
            bool rejected = false;

            // 先尝试默认通道
            if (_defaultChannel?.IsOpen == true)
            {
                try
                {
                    await _defaultChannel.BasicRejectAsync(deliveryTag, requeue);
                    rejected = true;
                    return;
                }
                catch (Exception ex)
                {
                    // 如果失败，继续尝试其他通道
                    _logger.LogDebug(ex, "Failed to reject message with delivery tag {DeliveryTag} on default channel", deliveryTag);
                }
            }

            // 如果默认通道失败，尝试消费通道池中的所有通道
            foreach (var channel in _consumeChannels.Values)
            {
                if (channel.IsOpen && !rejected)
                {
                    try
                    {
                        await channel.BasicRejectAsync(deliveryTag, requeue);
                        rejected = true;
                        break;
                    }
                    catch (Exception ex)
                    {
                        // 如果失败，继续尝试下一个通道
                        _logger.LogDebug(ex, "Failed to reject message with delivery tag {DeliveryTag} on a consume channel", deliveryTag);
                    }
                }
            }

            if (!rejected)
            {
                _logger.LogWarning("Failed to reject message with delivery tag {DeliveryTag} on any channel", deliveryTag);
            }
        }

        /// <summary>
        /// 释放资源
        /// </summary>
        public void Dispose()
        {
            try
            {
                // 取消连接重试
                _connectionCts.Cancel();

                // 关闭所有发布通道
                while (_publishChannelPool.TryTake(out var channel))
                {
                    try { channel.CloseAsync().GetAwaiter().GetResult(); } catch { }
                    try { channel.Dispose(); } catch { }
                }

                // 关闭所有消费通道
                foreach (var channel in _consumeChannels.Values)
                {
                    try { channel.CloseAsync().GetAwaiter().GetResult(); } catch { }
                    try { channel.Dispose(); } catch { }
                }

                // 关闭默认通道
                if (_defaultChannel != null)
                {
                    try { _defaultChannel.CloseAsync().GetAwaiter().GetResult(); } catch { }
                    try { _defaultChannel.Dispose(); } catch { }
                }

                // 关闭连接
                if (_connection != null)
                {
                    try { _connection.CloseAsync().GetAwaiter().GetResult(); } catch { }
                    try { _connection.Dispose(); } catch { }
                }

                _logger.LogInformation("RabbitMQ connection closed and resources disposed");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error disposing RabbitMQ resources");
            }
            finally
            {
                _connectionCts.Dispose();
            }
        }

        /// <summary>
        /// 异步释放资源
        /// </summary>
        public async ValueTask DisposeAsync()
        {
            try
            {
                // 取消连接重试
                _connectionCts.Cancel();

                // 关闭所有发布通道
                while (_publishChannelPool.TryTake(out var channel))
                {
                    try { await channel.CloseAsync(); } catch { }
                    try { channel.Dispose(); } catch { }
                }

                // 关闭所有消费通道
                foreach (var channel in _consumeChannels.Values)
                {
                    try { await channel.CloseAsync(); } catch { }
                    try { channel.Dispose(); } catch { }
                }

                // 关闭默认通道
                if (_defaultChannel != null)
                {
                    try { await _defaultChannel.CloseAsync(); } catch { }
                    try { _defaultChannel.Dispose(); } catch { }
                }

                // 关闭连接
                if (_connection != null)
                {
                    try { await _connection.CloseAsync(); } catch { }
                    try { _connection.Dispose(); } catch { }
                }

                _logger.LogInformation("RabbitMQ connection closed and resources disposed asynchronously");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error disposing RabbitMQ resources asynchronously");
            }
            finally
            {
                _connectionCts.Dispose();
            }
        }
    }
}
