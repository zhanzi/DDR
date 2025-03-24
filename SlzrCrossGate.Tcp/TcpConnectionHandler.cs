using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Connections;
using System.Buffers;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Http.HttpResults;

namespace SlzrCrossGate.Tcp
{

    public class TcpConnectionHandler : ConnectionHandler
    {
        private readonly TcpConnectionManager _connectionManager;
        private readonly ILogger<TcpConnectionHandler> _logger;

        public TcpConnectionHandler(
            TcpConnectionManager connectionManager,
            ILogger<TcpConnectionHandler> logger)
        {
            _connectionManager = connectionManager;
            _logger = logger;
        }

        public override async Task OnConnectedAsync(ConnectionContext context)
        {
            var buffer = new byte[4096];
            var terminalId = "";
            try
            {
                var tcpContext = new TcpConnectionContext(context);

                _logger.LogInformation("有新连接，IP:{0}", tcpContext.RemoteEndPoint);

                //读取第一个数据包，获取终端ID
                var result = await tcpContext.Transport.Input.ReadAsync();
                var data = result.Buffer;
                //处理第一个ISO8583报文
                ProcessIso8583Message(data);
                _connectionManager.TryAddConnection(terminalId, tcpContext);
                

                // 持续读取数据
                while (!tcpContext.ConnectionClosed.IsCancellationRequested)
                {
                    result = await tcpContext.Transport.Input.ReadAsync();
                    data = result.Buffer;

                    // 处理ISO 8583报文
                    ProcessIso8583Message(data);

                    tcpContext.Transport.Input.AdvanceTo(data.End);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Connection error");
            }
            finally
            {
                _connectionManager.TryRemoveConnection(terminalId);
                await context.DisposeAsync();
            }
        }

        private bool ProcessIso8583Message(ReadOnlySequence<byte> data)
        {
            return true;
        }
    }

    
}