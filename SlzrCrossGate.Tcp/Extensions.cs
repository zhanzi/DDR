using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace SlzrCrossGate.Tcp
{
    public static class Extensions
    {
        public static TBuilder AddTcpService<TBuilder>(this TBuilder builder) where TBuilder : IHostApplicationBuilder
        {
            // 注册服务
            builder.Services.AddSingleton<TcpConnectionManager>();
            builder.Services.AddSingleton<ITcpSendService, TcpSendService>();
            builder.Services.AddConnections();
            builder.Services.AddHostedService<TcpBackgroundService>();

            //var app = builder.Build();
            //// 配置Kestrel
            //app.Listen(new IPEndPoint(IPAddress.Any, 5000), listenOptions =>
            //{
            //    listenOptions.UseConnectionHandler<TcpConnectionHandler>();
            //    listenOptions.NoDelay = true;  // 禁用Nagle算法
            //    listenOptions.Backlog = 10000; // 设置等待队列长度
            //});

            //// 调整线程池设置（重要！）
            //ThreadPool.SetMinThreads(1000, 1000);
            //ThreadPool.SetMaxThreads(32767, 32767);

            return builder;
        }
    }
}
