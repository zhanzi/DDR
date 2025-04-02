using SlzrCrossGate.Tcp.Protocol;
using System.Threading.Tasks;

namespace SlzrCrossGate.Tcp
{
    public interface IIso8583MessageHandler
    {
        Task<Iso8583Message> HandleMessageAsync(TcpConnectionContext context, Iso8583Message message);
    }

}
