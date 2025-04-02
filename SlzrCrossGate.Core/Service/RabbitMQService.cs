using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System;
using System.Runtime.Intrinsics.X86;
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

                // ȷ������������
                _channel.ExchangeDeclareAsync(_options.TcpExchange, ExchangeType.Topic, true).GetAwaiter().GetResult();
                // ����Ĭ�ϵ��������ݽ��ն���
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

        public async Task SubscribeAsync<T>(string exchange, string queue, string routingKey, Func<T, Task> handler, bool autoAck = true)
        {
            try
            {
                // ȷ������������
                _channel.ExchangeDeclareAsync(exchange, ExchangeType.Topic, true).GetAwaiter().GetResult();
                // ����Ĭ�ϵ��������ݽ��ն���
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
                        if (autoAck)
                        {
                            await _channel.BasicAckAsync(ea.DeliveryTag, false);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error handling message by Subscriber to {Exchange} with queue {Queue} and routing key {RoutingKey}", exchange, queue, routingKey);

                        // 1. ȷ����Ϣ���������ԣ����ܵ������ݶ�ʧ��
                        //await _channel.BasicAckAsync(ea.DeliveryTag, false);
                        // 2. �ܾ���Ϣ�Ҳ�������ӣ���������Ϣ��
                        // await _channel.BasicRejectAsync(ea.DeliveryTag, false);
                        // 3. �ܾ���Ϣ��������ӣ����ٴδ���������Ҫ���Ŷ��з�ֹ����ѭ����
                        await _channel.BasicRejectAsync(ea.DeliveryTag, true);

                        //���Ŷ�������
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

        /// <summary>
        /// ���������������ݣ���Ҫ�ֶ�ACK
        /// </summary>
        /// <param name="handler"></param>
        /// <returns></returns>
        public async Task SubscribeConsumeDataAsync(Func<SlzrDatatransferModel.ConsumeData, ulong, Task> handler, bool autoAck = true)
        {
            // ȷ������������
            _channel.ExchangeDeclareAsync(_options.TcpExchange, ExchangeType.Topic, true).GetAwaiter().GetResult();
            // ����Ĭ�ϵ��������ݽ��ն���
            _channel.QueueBindAsync(_options.TcpQueue, _options.TcpExchange, "Tcp.city.#").GetAwaiter().GetResult();

            var consumer = new AsyncEventingBasicConsumer(_channel);
            consumer.ReceivedAsync += async (model, ea) =>
            {
                try
                {
                    var body = ea.Body.ToArray();
                    var consumeData = JsonSerializer.Deserialize<SlzrDatatransferModel.ConsumeData>(body);
                    if (consumeData != null)
                    {
                        await handler(consumeData, ea.DeliveryTag);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error handling message by Subscriber to {Exchange} with queue {Queue} and routing key {RoutingKey}", _options.TcpExchange, _options.TcpQueue, "Tcp.city.#");
                    await _channel.BasicRejectAsync(ea.DeliveryTag, true);
                }
            };

            await _channel.BasicConsumeAsync(queue: _options.TcpQueue, autoAck: false, consumer: consumer);
        }

        public async Task PublishConsumeDataAsync(SlzrDatatransferModel.ConsumeData consumeData) {
            //SlzrBus.SignleInstance().Publish<ConsumeData>(consumedata, $"Tcp.city.{CloudMers[busmercode]}.{consumedata.MerchantID}.{consumedata.buffer[2].ToString("X2")}");
            await PublishAsync(_options.TcpExchange, $"Tcp.city.{0000}.{consumeData.MerchantID}.{consumeData.buffer[2].ToString("X2")}", consumeData);
        }


        public async Task Ack(ulong deliveryTag)
        {
            await _channel.BasicAckAsync(deliveryTag, false);
        }

        public async Task NAck(ulong deliveryTag, bool requeue)
        {
            await _channel.BasicRejectAsync(deliveryTag, requeue);
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
