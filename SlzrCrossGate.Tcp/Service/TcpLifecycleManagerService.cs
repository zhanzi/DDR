using Microsoft.Extensions.Hosting;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SlzrCrossGate.Tcp.Service
{
    /// <summary>
    /// TCP连接生命周期管理服务
    /// </summary>
    public class TcpLifecycleManagerService : IHostedService
    {
        private readonly TcpConnectionManager _manager;

        public TcpLifecycleManagerService(TcpConnectionManager manager)
        {
            _manager = manager;
        }

        public Task StartAsync(CancellationToken token) => Task.CompletedTask;

        public Task StopAsync(CancellationToken token)
        {
            // 应用关闭时断开所有连接
            _manager.ClearAllConnections();
            return Task.CompletedTask;
        }
    }
}
