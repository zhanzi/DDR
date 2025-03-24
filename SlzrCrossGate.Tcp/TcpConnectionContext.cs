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
    public class TcpConnectionContext
    {
        ConnectionContext _connectionContext;
        public TcpConnectionContext(ConnectionContext connectionContext)
        {
            _connectionContext = connectionContext;connectionContext.DisposeAsync();
        }

        public string ConnectionId => _connectionContext.ConnectionId;
        public IFeatureCollection Features => _connectionContext.Features;
        public IDictionary<object, object?> Items => _connectionContext.Items;
        public IDuplexPipe Transport => _connectionContext.Transport;
        public EndPoint? LocalEndPoint => _connectionContext.LocalEndPoint;
        public EndPoint? RemoteEndPoint => _connectionContext.RemoteEndPoint;
        public void Abort() => _connectionContext.Abort();
        public CancellationToken ConnectionClosed => _connectionContext.ConnectionClosed;

        public ValueTask DisposeAsync => _connectionContext.DisposeAsync();


        public DateTime ConnectionTime { get; set; } = DateTime.Now;
        public DateTime LastSendtime { get; set; } = DateTime.Now;
        public DateTime LastReceivetime { get; set; } = DateTime.Now;

        public string TerminalId { get; set; } = "";
        public string Token { get; set; } = "";
        public string MerchantID { get; set; }
        public string MachineID { get; set; }
        public string MachineNO { get; set; }
        public string LineNO { get; set; }
        public string FileVerInfo { get; set; } = "";
        public string PropertyInfo { get; set; } = "";


    }
}
