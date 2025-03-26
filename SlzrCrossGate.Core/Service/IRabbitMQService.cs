using System.Threading.Tasks;

namespace SlzrCrossGate.Core.Services
{
    public interface IRabbitMQService
    {
        Task PublishAsync<T>(string exchange, string routingKey, T message);
    }
}
