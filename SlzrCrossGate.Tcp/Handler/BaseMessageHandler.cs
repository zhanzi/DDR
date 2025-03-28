using Microsoft.Extensions.DependencyInjection;
using SlzrCrossGate.Tcp.Protocol;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SlzrCrossGate.Tcp.Handler
{
    public abstract class BaseMessageHandler : IIso8583MessageHandler
    {
        private readonly Iso8583Schema _schema;
        private readonly IServiceProvider _serviceProvider;
        public BaseMessageHandler(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
            _schema = serviceProvider.GetRequiredService<Iso8583Schema>();
        }

        public Task HandleMessageAsync(TcpConnectionContext context, Iso8583Message message)
        {
            throw new NotImplementedException();
        }
    }
}
