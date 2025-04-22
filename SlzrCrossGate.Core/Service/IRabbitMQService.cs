using System.Threading.Tasks;

namespace SlzrCrossGate.Core.Services
{
    public interface IRabbitMQService
    {
        Task DeclareTopicExchange(string exchange);
        Task PublishAsync<T>(string exchange, string routingKey, T message);
        Task SubscribeAsync<T>(string exchange, string queue, string routingKey, Func<T, Task> handler,bool autoAck);
        Task PublishConsumeDataAsync(SlzrDatatransferModel.ConsumeData consumeData);
        Task SubscribeConsumeDataAsync(Func<SlzrDatatransferModel.ConsumeData, ulong, Task> handler, bool autoAck);
        Task Ack(ulong deliveryTag);
        Task NAck(ulong deliveryTag, bool requeue);

        Task PurgeQueue(string queue);
    }
}
