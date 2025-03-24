using Microsoft.Extensions.Hosting;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SlzrCrossGate.Tcp
{
    // 实现后台服务
    public class TcpBackgroundService : IHostedService
    {
        private readonly TcpConnectionManager _manager;

        public TcpBackgroundService(TcpConnectionManager manager)
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
