using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace SlzrCrossGate.Core.Services
{
    public class RabbitMQOptions
    {
        public string HostName { get; set; } = "localhost";
        public string UserName { get; set; } = "guest";
        public string Password { get; set; } = "guest";
        public int Port { get; set; } = 5672;
        public string TcpExchange { get; set; } = "SlzrDatatransferModel.ConsumeData:SlzrDatatransferModel";
        public string TcpQueue { get; set; } = "SlzrDatatransferModel.ConsumeData:TcpServer";
    }

    public class RabbitMQService : IRabbitMQService, IDisposable
    {
        private readonly IConnection _connection;
        private readonly IChannel _channel;
        private readonly ILogger<RabbitMQService> _logger;

        private RabbitMQOptions _options;



        public RabbitMQService(IOptions<RabbitMQOptions> options, ILogger<RabbitMQService> logger)
        {
            _logger = logger;

            try
            {
                _options = options.Value;
                var factory = new ConnectionFactory
                {
                    HostName = _options.HostName,
                    UserName = _options.UserName,
                    Password = _options.Password,
                    Port = _options.Port
                };


                _connection = factory.CreateConnectionAsync().GetAwaiter().GetResult();
                _channel = _connection.CreateChannelAsync().GetAwaiter().GetResult();

                // 确保交换机存在
                _channel.ExchangeDeclareAsync(_options.TcpExchange, ExchangeType.Topic, true).GetAwaiter().GetResult();
                // 创建默认的消费数据接收队列
                _channel.QueueBindAsync(_options.TcpQueue, _options.TcpExchange, "Tcp.city.#").GetAwaiter().GetResult();

                _logger.LogInformation("RabbitMQ connection established");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to connect to RabbitMQ");
                throw;
            }
        }


        public async Task DeclareTopicExchange(string exchange)
        {
            await _channel.ExchangeDeclareAsync(exchange, ExchangeType.Topic, true);
        }

        public async Task PublishAsync<T>(string exchange, string routingKey, T message)
        {
            try
            {
                var json = JsonSerializer.Serialize(message);
                var body = Encoding.UTF8.GetBytes(json);

                ValueTask valueTask = _channel.BasicPublishAsync(
                    exchange: exchange,
                    routingKey: routingKey,
                    mandatory: false,
                    basicProperties: new BasicProperties() { },
                    body: body);

                _logger.LogInformation("Message published to {Exchange} with routing key {RoutingKey}", exchange, routingKey);

                await valueTask;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error publishing message to RabbitMQ");
                throw;
            }
        }

        public async Task SubscribeAsync<T>(string exchange, string queue, string routingKey, Func<T, Task> handler)
        {
            try
            {
                // 确保交换机存在
                _channel.ExchangeDeclareAsync(exchange, ExchangeType.Topic, true).GetAwaiter().GetResult();
                // 创建默认的消费数据接收队列
                _channel.QueueBindAsync(queue, exchange, routingKey).GetAwaiter().GetResult();

                var consumer = new AsyncEventingBasicConsumer(_channel);
                consumer.ReceivedAsync += async (model, ea) =>
                {
                    try
                    {
                        var body = ea.Body.ToArray();
                        var json = Encoding.UTF8.GetString(body);
                        var message = JsonSerializer.Deserialize<T>(json);

                        if (message != null) await handler(message);

                        await _channel.BasicAckAsync(ea.DeliveryTag, false);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error handling message by Subscriber to {Exchange} with queue {Queue} and routing key {RoutingKey}", exchange, queue, routingKey);

                        // 1. 确认消息（放弃重试，可能导致数据丢失）
                        //await _channel.BasicAckAsync(ea.DeliveryTag, false);
                        // 2. 拒绝消息且不重新入队（放弃此消息）
                        // await _channel.BasicRejectAsync(ea.DeliveryTag, false);
                        // 3. 拒绝消息并重新入队（将再次处理，可能需要死信队列防止无限循环）
                        await _channel.BasicRejectAsync(ea.DeliveryTag, true);

                        //死信队列做法
                        //await _channel.BasicRejectAsync(ea.DeliveryTag, false);
                        //await _channel.BasicPublishAsync("dead-letter-exchange", "dead-letter-queue", false, ea.BasicProperties, ea.Body);

                        
                    }
                };
                await _channel.BasicConsumeAsync(queue, false, consumer);
                _logger.LogInformation("Subscribed to {Exchange} with queue {Queue} and routing key {RoutingKey}", exchange, queue, routingKey);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error subscribing to RabbitMQ");
                throw;
            }
        }

        public async Task SubscribeConsumeDataAsync(Func<SlzrDatatransferModel.ConsumeData, Task> handler)
        {
            await SubscribeAsync(_options.TcpExchange, _options.TcpQueue, "Tcp.city.#", handler);
        }

        public async Task PublishConsumeDataAsync(SlzrDatatransferModel.ConsumeData consumeData) {
            //SlzrBus.SignleInstance().Publish<ConsumeData>(consumedata, $"Tcp.city.{CloudMers[busmercode]}.{consumedata.MerchantID}.{consumedata.buffer[2].ToString("X2")}");
            await PublishAsync(_options.TcpExchange, $"Tcp.city.{0000}.{consumeData.MerchantID}.{consumeData.buffer[2].ToString("X2")}", consumeData);
        }


        public void Dispose()
        {
            _channel?.CloseAsync().GetAwaiter().GetResult();
            _connection?.CloseAsync().GetAwaiter().GetResult();
            _channel?.Dispose();
            _connection?.Dispose();
        }

    }
}
