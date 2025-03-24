using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SlzrCrossGate.Tcp
{
    public interface ITcpSendService
    {
        Task<bool> SendAsync(string terminalId, byte[] message);
    }

    public class TcpSendService : ITcpSendService
    {
        private readonly TcpConnectionManager _connectionManager;

        public TcpSendService(TcpConnectionManager connectionManager)
        {
            _connectionManager = connectionManager;
        }

        public Task<bool> SendAsync(string terminalId, byte[] message)
        {
            return Task.FromResult(_connectionManager.TrySendMessage(terminalId, message));
        }
    }
}
