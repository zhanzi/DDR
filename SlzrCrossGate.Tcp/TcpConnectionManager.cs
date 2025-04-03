using Microsoft.AspNetCore.Connections;
using Microsoft.Extensions.Logging;
using SlzrCrossGate.Core.Models;
using SlzrCrossGate.Core.Service;
using System.Collections.Concurrent;
using System.Data;
using System.Net;


namespace SlzrCrossGate.Tcp
{
    public class TcpConnectionManager
    {
        private readonly ConcurrentDictionary<string, TcpConnectionContext> _connections = new();
        private readonly ILogger<TcpConnectionManager> _logger;
        private readonly TerminalManager _terminalManager;


        private readonly TimeSpan _connectionTimeout = TimeSpan.FromSeconds(60); 
        private readonly Timer _connectionCheckerTimer;

        public TcpConnectionManager(ILogger<TcpConnectionManager> logger, TerminalManager terminalManager)
        {
            _logger = logger;
            _terminalManager = terminalManager;

            // 创建定时器，每分钟检查一次连接
            _connectionCheckerTimer = new Timer(CheckIdleConnections, null, TimeSpan.FromMinutes(1), TimeSpan.FromMinutes(1));

        }

        /// <summary>
        /// 检查空闲连接
        /// </summary>
        /// <param name="state"></param>
        private void CheckIdleConnections(object? state)
        {
            var now = DateTime.Now;
            var idleConnectionIds = new List<string>();

            foreach (var kvp in _connections)
            {
                if (now - kvp.Value.LastActivityTime > _connectionTimeout)
                {
                    idleConnectionIds.Add(kvp.Key);
                }
            }

            foreach (var id in idleConnectionIds)
            {
                if (_connections.TryGetValue(id, out var context))
                {
                    _logger.LogInformation("Closing idle connection {ConnectionId}", id);
                    //context.Abort();
                    TryRemoveConnection(id);
                }
            }
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
                TerminalStatus terminalStatus = new TerminalStatus
                {
                    ID = terminalId,
                    EndPoint = context.RemoteEndPoint?.ToString() ?? "",
                    ActiveStatus = DeviceActiveStatus.Active,
                    ConnectionProtocol = "TCP",
                    LastActiveTime = DateTime.Now,
                    FileVersions = "",
                    Properties = "",
                    LoginInTime = DateTime.Now,
                    LoginOffTime = DateTime.Now,
                    Token = ""
                };
                var terminal = new Terminal
                {
                    ID = terminalId,
                    LineNO = "",
                    MachineID = "",
                    DeviceNO = "",
                    MerchantID = "",
                    CreateTime = DateTime.Now,
                    IsDeleted = false,
                    Status = terminalStatus,
                    StatusUpdateTime = DateTime.Now
                };
                _terminalManager.AddOrUpdateTerminal(terminal);
            }
            return added;
        }

        public bool TryRemoveConnection(string terminalId)
        {
            var removed = _connections.TryRemove(terminalId, out TcpConnectionContext? context);
            if (removed && context != null)
            {
                _terminalManager.RemoveTerminal(terminalId);
                _ = context.DisposeAsync().AsTask();
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

        // 添加获取连接统计的方法
        public ConnectionStats GetConnectionStats()
        {
            return new ConnectionStats
            {
                ActiveConnections = _connections.Count,
                ConnectionsByMerchant = _connections.Values
                    .GroupBy(c => c.MerchantID)
                    .ToDictionary(g => g.Key, g => g.Count())
            };
        }


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