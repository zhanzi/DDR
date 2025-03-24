using Microsoft.AspNetCore.Connections;
using Microsoft.Extensions.Logging;
using SlzrCrossGate.Core.Models;
using SlzrCrossGate.Core.Service;
using System.Collections.Concurrent;
using System.Net;


namespace SlzrCrossGate.Tcp
{
    public class TcpConnectionManager
    {
        private readonly ConcurrentDictionary<string, TcpConnectionContext> _connections = new();
        private readonly ILogger<TcpConnectionManager> _logger;
        private readonly TerminalManager _terminalManager;

        public TcpConnectionManager(ILogger<TcpConnectionManager> logger, TerminalManager terminalManager)
        {
            _logger = logger;
            _terminalManager = terminalManager;
        }

        public bool TryAddConnection(string terminalId, TcpConnectionContext context)
        {
            if (_connections.TryGetValue(terminalId, out var oldContext))
            {
                _logger.LogInformation($"Closing old connection for {terminalId}");
                oldContext.Abort(); // 强制关闭旧连接
            }
            var added = _connections.TryAdd(terminalId, context);
            if (added)
            {
                var terminal = new Terminal
                {
                    ID = terminalId,
                    EndPoint = context.RemoteEndPoint?.ToString() ?? "",
                    ActiveStatus = DeviceActiveStatus.Active,
                    ConnectionProtocol = "TCP",
                    LineNO = "",
                    MachineID = "",
                    MachineNO = "",
                    MerchantID = "",
                    CreateTime = DateTime.Now,
                    LastActiveTime = DateTime.Now,
                    FileVerInfo = "",
                    PropertyInfo = "",
                    IsDeleted = false,
                     LoginInTime = DateTime.Now,
                    LoginOffTime = DateTime.Now,
                    Token = ""
                };
                _terminalManager.AddOrUpdateTerminal(terminal);
            }
            return added;
        }

        public bool TryRemoveConnection(string terminalId)
        {
            var removed = _connections.TryRemove(terminalId, out _);
            if (removed)
            {
                _terminalManager.RemoveTerminal(terminalId);
            }
            return removed;
        }

        public bool TrySendMessage(string terminalId, ReadOnlyMemory<byte> message)
        {
            if (_connections.TryGetValue(terminalId, out var context))
            {
                return context.Transport.Output.WriteAsync(message).IsCompletedSuccessfully;
            }
            return false;
        }

        // 添加清除方法
        public void ClearAllConnections()
        {
            foreach (var conn in _connections.Values)
            {
                conn.Abort();
            }
            _connections.Clear();
        }

    }

}