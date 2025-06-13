using Microsoft.AspNetCore.Connections;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.IO.Pipelines;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace SlzrCrossGate.Tcp
{
    public class TcpConnectionContext : ConnectionContext
    {
        ConnectionContext _connectionContext;
        ILogger<TcpConnectionContext> _logger;

        public TcpConnectionContext(ConnectionContext connectionContext, ILogger<TcpConnectionContext> logger)
        {
            _connectionContext = connectionContext;
            this._logger = logger;
        }

        public override IDuplexPipe Transport { get => _connectionContext.Transport; set => _connectionContext.Transport = value; }

        public override string ConnectionId { get => _connectionContext.ConnectionId; set => _connectionContext.ConnectionId = value; }

        public override IFeatureCollection Features => _connectionContext.Features;

        public override IDictionary<object, object?> Items { get => _connectionContext.Items; set => _connectionContext.Items = value; }

        public override EndPoint? RemoteEndPoint { get => _connectionContext.RemoteEndPoint; set => _connectionContext.RemoteEndPoint = value; }

        public override ValueTask DisposeAsync() => _connectionContext.DisposeAsync();

        public DateTime ConnectionTime { get; set; } = DateTime.Now;
        public DateTime LastSendtime { get; set; } = DateTime.Now;
        public DateTime LastActivityTime { get; private set; } = DateTime.Now;

        public string TerminalID { get; set; } = "";
        public string Token { get; set; } = "";
        public string MerchantID { get; set; } = string.Empty;
        public string MachineID { get; set; } = string.Empty;
        public string MachineNO { get; set; } = string.Empty;
        public string LineNO { get; set; } = string.Empty;
        public string FileVerInfo { get; set; } = "";
        public string PropertyInfo { get; set; } = "";

        //send message
        public async Task<bool> SendMessageAsync(ReadOnlyMemory<byte> message)
        {
            try
            {
                // 检查连接是否已关闭
                if (ConnectionClosed.IsCancellationRequested)
                {
                    return false;
                }

                LastSendtime = DateTime.Now;
                await Transport.Output.WriteAsync(message, ConnectionClosed);
                var result = await Transport.Output.FlushAsync(ConnectionClosed);

                // 正确的成功判断：操作完成且未被取消
                return result.IsCompleted && !result.IsCanceled;
            }
            catch (OperationCanceledException)
            {
                _logger.LogWarning("Connection cancelled while sending message to {TerminalID}", TerminalID);
                // 连接已取消
                return false;
            }
            catch (InvalidOperationException)
            {
                _logger.LogWarning("Connection closed while sending message to {TerminalID}", TerminalID);
                // 管道已关闭
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending message to {TerminalID}", TerminalID);
                // 其他网络错误
                return false;
            }
        }

        // update last activity time
        public void UpdateLastActivityTime()
        {
            LastActivityTime = DateTime.Now;
        }
    }
}
