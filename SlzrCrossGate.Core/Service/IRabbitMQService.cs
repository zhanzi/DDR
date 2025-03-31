using System.Threading.Tasks;

namespace SlzrCrossGate.Core.Services
{
    public interface IRabbitMQService
    {
        Task DeclareTopicExchange(string exchange);
        Task PublishAsync<T>(string exchange, string routingKey, T message);
        Task SubscribeAsync<T>(string exchange, string queue, string routingKey, Func<T, Task> handler,bool autoAck);
        Task PublishConsumeDataAsync(SlzrDatatransferModel.ConsumeData consumeData);
        Task SubscribeConsumeDataAsync(Func<SlzrDatatransferModel.ConsumeData, Task> handler, ulong deliveryTag, bool autoAck);
        void Ack(ulong deliveryTag);
        void NAck(ulong deliveryTag, bool requeue);
    }
}
