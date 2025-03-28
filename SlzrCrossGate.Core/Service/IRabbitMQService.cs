using System.Threading.Tasks;

namespace SlzrCrossGate.Core.Services
{
    public interface IRabbitMQService
    {
        Task DeclareTopicExchange(string exchange);
        Task PublishAsync<T>(string exchange, string routingKey, T message);
        Task SubscribeAsync<T>(string exchange, string queue, string routingKey, Func<T, Task> handler);
        Task PublishConsumeDataAsync(SlzrDatatransferModel.ConsumeData consumeData);
        Task SubscribeConsumeDataAsync(Func<SlzrDatatransferModel.ConsumeData, Task> handler);
    }
}
