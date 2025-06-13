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
                    _logger.LogInformation("Closing idle connection by timeout: {ConnectionId}", id);
                    TryRemoveConnection(id);
                }
            }
        }

        public bool TryAddConnection(string terminalId, TcpConnectionContext context)
        {
            if (_connections.TryGetValue(terminalId, out var oldContext))
            {
                _logger.LogInformation("Closing old connection for {TerminalId}", terminalId);
                oldContext.Abort(); // 强制关闭旧连接
            }
            var added = _connections.TryAdd(terminalId, context);
            return added;
        }

        public void SetTerminalActive(string terminalId) {
            _terminalManager.SetTerminalActive(terminalId);
        }

        public bool TryRemoveConnection(string terminalId)
        {
            var removed = _connections.TryRemove(terminalId, out TcpConnectionContext? context);
            if (removed && context != null)
            {
                _terminalManager.SetTerminalInactive(terminalId);
                _ = context.DisposeAsync().AsTask();
            }
            return removed;
        }

        public async Task<bool> TrySendMessageAsync(string terminalId, ReadOnlyMemory<byte> message)
        {
            if (_connections.TryGetValue(terminalId, out var context))
            {
                return await context.SendMessageAsync(message);
            }
            return false;
        }

        // 保留同步版本以兼容现有代码，但建议使用异步版本
        public bool TrySendMessage(string terminalId, ReadOnlyMemory<byte> message)
        {
            if (_connections.TryGetValue(terminalId, out var context))
            {
                try
                {
                    // 检查连接是否已关闭
                    if (context.ConnectionClosed.IsCancellationRequested)
                    {
                        return false;
                    }

                    // 写入数据并立即刷新
                    var writeTask = context.Transport.Output.WriteAsync(message);
                    if (!writeTask.IsCompletedSuccessfully)
                    {
                        return false;
                    }

                    var flushTask = context.Transport.Output.FlushAsync();
                    if (flushTask.IsCompletedSuccessfully)
                    {
                        var result = flushTask.Result;
                        return result.IsCompleted && !result.IsCanceled;
                    }
                    return false;
                }
                catch
                {
                    return false;
                }
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