using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Connections;
using System.Buffers;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Http.HttpResults;
using Azure.Core.Pipeline;
using SlzrCrossGate.Tcp.Protocol;
using System.Reflection;
using Microsoft.Extensions.DependencyInjection;

namespace SlzrCrossGate.Tcp
{

    public class TcpConnectionHandler : ConnectionHandler
    {
        private readonly TcpConnectionManager _connectionManager;
        private readonly ILogger<TcpConnectionHandler> _logger;
        private readonly IServiceProvider _serviceProvider;
        private readonly IDictionary<string, IIso8583MessageHandler> _messageHandlers;

        public TcpConnectionHandler(
            TcpConnectionManager connectionManager,
            ILogger<TcpConnectionHandler> logger,
            IServiceProvider serviceProvider)
        {
            _connectionManager = connectionManager;
            _logger = logger;
            _serviceProvider = serviceProvider;
            _messageHandlers = LoadMessageHandlerTypes();
        }

        public override async Task OnConnectedAsync(ConnectionContext context)
        {
            var tcpContext = new TcpConnectionContext(context);
            var remoteEndPoint = tcpContext.RemoteEndPoint;
            try
            {
                _logger.LogInformation("New connection，IP:{0}", remoteEndPoint);

                // 持续读取数据
                while (!tcpContext.ConnectionClosed.IsCancellationRequested)
                {
                    var result = await tcpContext.Transport.Input.ReadAsync();
                    var data = result.Buffer;
                    if (result.IsCompleted && data.Length == 0)
                    {
                        // 连接已关闭或没有更多数据可供读取
                        break;
                    }

                    // 处理ISO 8583报文
                    while (true)
                    {
                        var message = ProcessIso8583Message(ref data);
                        if (message == null) break;

                        try
                        {
                            await HandleMessageAsync(tcpContext, message);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Error handling ISO 8583 message.");
                        }
                    }

                    tcpContext.Transport.Input.AdvanceTo(data.Start, data.End);
                }
            }
            catch (Iso8583ParseException ex)
            {
                _logger.LogError(ex, "Error parsing ISO 8583 message.");
            }
            catch (Exception ex) when (ex is OperationCanceledException || ex is IOException)
            {
                _logger.LogError(ex, "Network error or connection interrupted.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Connection error{Terminal:{0}, IP:{1}}", tcpContext.TerminalId,remoteEndPoint);
            }
            finally
            {
                _logger.LogInformation("Connection closed, IP:{0}", remoteEndPoint);
                _connectionManager.TryRemoveConnection(tcpContext.TerminalId);
                await context.DisposeAsync();
            }
        }


        private Iso8583Package? ProcessIso8583Message(ref ReadOnlySequence<byte> data)
        {
            try
            {
                var readableBytes = data.Length;

                if (readableBytes < 7) return null;

                var buffer = data.Slice(0, readableBytes).ToArray();

                // 报文头（tpdu） 固定为 6000000000
                if (buffer[2] == 0x60 && buffer[3] == 0 && buffer[4] == 0 && buffer[5] == 0 && buffer[6] == 0)
                {
                    var bodyLength = buffer[0] * 256 + buffer[1];
                    var messageLength = bodyLength + 2;

                    if (messageLength > readableBytes)
                    {
                        // 已接收长度不够
                        return null;
                    }
                    else
                    {
                        var message = data.Slice(0, messageLength).ToArray();
                        data = data.Slice(messageLength);

                        var package = new Iso8583Package(_serviceProvider.GetRequiredService<Iso8583Schema>());
                        package.SmartBitmap = true;
                        package.ParseMessage(message);
                        
                        //package.GetCurBuffer()
                        //TODO：登录指令需要使用登录密钥校验MAC (VER>="0300")
                        //TODO：其他指令需要使用会话密钥校验MAC 

                        return package;
                    }
                }
                else
                {
                    throw new Iso8583ParseException("Message header is not correct.");
                }
            }
            catch (Exception ex)
            {
                throw new Iso8583ParseException(ex.Message);
            }
        }


        private async Task HandleMessageAsync(TcpConnectionContext context, Iso8583Package message)
        {
            if (_messageHandlers.TryGetValue(message.MessageType, out var handler))
            {
                await handler.HandleMessageAsync(context, message);
            }
            else
            {
                _logger.LogWarning($"No handler found for message type {message.MessageType}");
            }
        }

        private IDictionary<string, IIso8583MessageHandler> LoadMessageHandlerTypes()
        {
            var handlerTypes = new Dictionary<string, IIso8583MessageHandler>();
            var assembly = Assembly.GetExecutingAssembly();
            var handlerInterfaceType = typeof(IIso8583MessageHandler);

            foreach (var type in assembly.GetTypes())
            {
                if (handlerInterfaceType.IsAssignableFrom(type) && !type.IsInterface && !type.IsAbstract)
                {
                    var attribute = type.GetCustomAttribute<MessageTypeAttribute>();
                    if (attribute != null)
                    {
                        var handler = (IIso8583MessageHandler)_serviceProvider.GetRequiredService(type);
                        handlerTypes[attribute.MessageType] = handler;
                    }
                }
            }

            return handlerTypes;
        }

        
    }

    
}