using System.Threading.Tasks;
using RabbitMQ.Client;

namespace SlzrCrossGate.Core.Services
{
    public interface IRabbitMQService
    {
        Task DeclareTopicExchange(string exchange);
        Task PublishAsync<T>(string exchange, string routingKey, T message,bool mandatory = false);
        Task SubscribeAsync<T>(string exchange, string queue, string routingKey, Func<T, Task> handler,bool autoAck);
        Task PublishConsumeDataAsync(SlzrDatatransferModel.ConsumeData consumeData);
        Task SubscribeConsumeDataAsync(Func<SlzrDatatransferModel.ConsumeData, IChannel, ulong, Task> handler, bool autoAck);
        Task Ack(IChannel channel,ulong deliveryTag);
        Task NAck(IChannel channel, ulong deliveryTag, bool requeue);
        Task Ack( ulong deliveryTag);
        Task NAck(ulong deliveryTag, bool requeue);

        Task PurgeQueue(string queue);
    }
}
