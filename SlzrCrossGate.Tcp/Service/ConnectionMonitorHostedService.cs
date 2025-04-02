using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SlzrCrossGate.Tcp.Service
{
    /// <summary>
    /// 定时发布连接统计信息的后台服务
    /// </summary>
    public class ConnectionMonitorHostedService : BackgroundService
    {
        private readonly TcpConnectionManager _connectionManager;
        private readonly ILogger<ConnectionMonitorHostedService> _logger;

        public ConnectionMonitorHostedService(TcpConnectionManager connectionManager, ILogger<ConnectionMonitorHostedService> logger)
        {
            _connectionManager = connectionManager;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                var stats = _connectionManager.GetConnectionStats();

                _logger.LogInformation(
                    "Connection stats: {ActiveConnections} active connections",
                    stats.ActiveConnections);

                foreach (var merchant in stats.ConnectionsByMerchant)
                {
                    _logger.LogInformation(
                        "Merchant {Type}: {Count} connections",
                        merchant.Key,
                        merchant.Value);
                }

                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
            }
        }
    }
}
