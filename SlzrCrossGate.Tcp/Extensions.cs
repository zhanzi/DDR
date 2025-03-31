using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using SlzrCrossGate.Tcp.Protocol;
using SlzrCrossGate.Tcp.Service;

namespace SlzrCrossGate.Tcp
{
    public static class Extensions
    {
        static void RegisterMessageHandlers(IServiceCollection services)
        {
            var assembly = Assembly.GetExecutingAssembly();
            var handlerInterfaceType = typeof(IIso8583MessageHandler);

            foreach (var type in assembly.GetTypes())
            {
                if (handlerInterfaceType.IsAssignableFrom(type) && !type.IsInterface && !type.IsAbstract)
                {
                    services.AddSingleton(type);
                }
            }

        }


        public static TBuilder AddTcpService<TBuilder>(this TBuilder builder) where TBuilder : IHostApplicationBuilder
        {
            // 自动注册消息处理程序
            RegisterMessageHandlers(builder.Services);

            builder.Services.AddSingleton<TcpConnectionManager>();
            builder.Services.AddSingleton<ITcpSendService, TcpSendService>();
            builder.Services.AddConnections();

            builder.Services.AddSingleton<Iso8583Schema>(new Iso8583Schema("schema.xml"));

            // 注册后台服务
            builder.Services.AddHostedService<TcpLifecycleManagerService>();
            builder.Services.AddHostedService<ConsumeDataSaveService>();


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
