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

        public async Task<bool> SendAsync(string terminalId, byte[] message)
        {
            return await _connectionManager.TrySendMessageAsync(terminalId, message);
        }
    }
}
