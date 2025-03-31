using Microsoft.AspNetCore.Connections;
using Microsoft.AspNetCore.Http.Features;
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
        public TcpConnectionContext(ConnectionContext connectionContext)
        {
            _connectionContext = connectionContext;
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
        public string MerchantID { get; set; }
        public string MachineID { get; set; }
        public string MachineNO { get; set; }
        public string LineNO { get; set; }
        public string FileVerInfo { get; set; } = "";
        public string PropertyInfo { get; set; } = "";

        //send message
        public async Task<bool> SendMessageAsync(ReadOnlyMemory<byte> message)
        {
            LastSendtime = DateTime.Now;
            await Transport.Output.WriteAsync(message);
            var result = await Transport.Output.FlushAsync();
            return result.IsCompleted;
        }

        // update last activity time
        public void UpdateLastActivityTime()
        {
            LastActivityTime = DateTime.Now;
        }
    }
}
