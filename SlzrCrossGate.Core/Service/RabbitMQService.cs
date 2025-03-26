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
        
        public RabbitMQService(IOptions<RabbitMQOptions> options, ILogger<RabbitMQService> logger)
        {
            _logger = logger;
            
            try
            {
                var factory = new ConnectionFactory
                {
                    HostName = options.Value.HostName,
                    UserName = options.Value.UserName,
                    Password = options.Value.Password,
                    Port = options.Value.Port
                };


                _connection = factory.CreateConnectionAsync().GetAwaiter().GetResult();
                _channel = _connection.CreateChannelAsync().GetAwaiter().GetResult();

                // ȷ������������
                _channel.ExchangeDeclareAsync(options.Value.TcpExchange, ExchangeType.Topic, true).GetAwaiter().GetResult();
                // ����Ĭ�ϵ��������ݽ��ն���
                _channel.QueueBindAsync(options.Value.TcpQueue, options.Value.TcpExchange, "Tcp.city.#").GetAwaiter().GetResult();

                _logger.LogInformation("RabbitMQ connection established");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to connect to RabbitMQ");
                throw;
            }
        }

        public async Task PublishAsync<T>(string exchange, string routingKey, T message)
        {
            try
            {
                var json = JsonSerializer.Serialize(message);
                var body = Encoding.UTF8.GetBytes(json);

                _channel.BasicPublishAsync(
                    exchange: exchange,
                    routingKey: routingKey,
                    mandatory: false,
                    basicProperties: null,
                    body: body);

                _logger.LogInformation("Message published to {Exchange} with routing key {RoutingKey}", exchange, routingKey);

                return Task.CompletedTask;
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
                var consumer = new AsyncEventingBasicConsumer(_channel);
                consumer.ReceivedAsync += async (model, ea) =>
                {
                    try
                    {
                        var body = ea.Body.ToArray();
                        var json = Encoding.UTF8.GetString(body);
                        var message = JsonSerializer.Deserialize<T>(json);
                        await handler(message);
                        await _channel.BasicAckAsync(ea.DeliveryTag, false);
                    }
                    catch (Exception ex) {
                        // 1. ȷ����Ϣ���������ԣ����ܵ������ݶ�ʧ��
                        //await _channel.BasicAckAsync(ea.DeliveryTag, false);
                        // 2. �ܾ���Ϣ�Ҳ�������ӣ���������Ϣ��
                        // await _channel.BasicRejectAsync(ea.DeliveryTag, false);
                        // 3. �ܾ���Ϣ��������ӣ����ٴδ���������Ҫ���Ŷ��з�ֹ����ѭ����
                        await _channel.BasicRejectAsync(ea.DeliveryTag, true);
                    }
                };
                _channel.BasicConsumeAsync(queue, false, consumer);
                _logger.LogInformation("Subscribed to {Exchange} with queue {Queue} and routing key {RoutingKey}", exchange, queue, routingKey);
                return Task.CompletedTask;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error subscribing to RabbitMQ");
                throw;
            }
        }

        //SubscribeAsyncʹ��ʾ��
        //public async Task SubscribeAsync()
        //{
        //    await _rabbitMQService.SubscribeAsync<SlzrDatatransferModel.ConsumeData>(options.Value.TcpExchange, options.Value.TcpQueue, "Tcp.city.#", async message =>
        //    {
        //        _logger.LogInformation("Received message: {Message}", message);
        //        // ������Ϣ
        //    });
        //}


        public void Dispose()
        {
            _channel?.Close();
            _connection?.Close();
            _channel?.Dispose();
            _connection?.Dispose();
        }
    }
}
