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
using CommunityToolkit.HighPerformance.Helpers;
using System.Diagnostics;
using System.Diagnostics.Metrics;
using SlzrCrossGate.Core.Models;
using SlzrCrossGate.Core.Service;

namespace SlzrCrossGate.Tcp
{

    public class TcpConnectionHandler : ConnectionHandler
    {
        private readonly TcpConnectionManager _connectionManager;
        private readonly ILogger<TcpConnectionHandler> _logger;
        private readonly IServiceProvider _serviceProvider;
        private readonly IDictionary<string, IIso8583MessageHandler> _messageHandlers;
        private readonly TerminalManager _terminalManager;

        //private static readonly ActivitySource _activitySource = new ActivitySource("SlzrCrossGate.Tcp");
        private static readonly Meter _meter = new Meter("SlzrCrossGate.Tcp");
        private static readonly Counter<long> _messageProcessedCounter;
        private static readonly Histogram<double> _messageProcessingDuration;

        //消息处理失败计数器
        private static readonly Counter<long> _messageFailedCounter;

        //记录网络带宽进出流量
        private static readonly Counter<long> _networkBandwidthIn;
        private static readonly Counter<long> _networkBandwidthOut;

        static TcpConnectionHandler()
        {
            _messageProcessedCounter = _meter.CreateCounter<long>("tcp.messages.processed", "Messages");
            _messageProcessingDuration = _meter.CreateHistogram<double>("tcp.messages.duration", "ms");
            _messageFailedCounter = _meter.CreateCounter<long>("tcp.messages.failed", "Messages");
            _networkBandwidthIn = _meter.CreateCounter<long>("tcp.network.bandwidthin", "Bytes");
            _networkBandwidthOut = _meter.CreateCounter<long> ("tcp.network.bandwidthout", "Bytes");
        }

        public TcpConnectionHandler(
            TcpConnectionManager connectionManager,
            ILogger<TcpConnectionHandler> logger,
            IServiceProvider serviceProvider,TerminalManager terminalManager)
        {
            _connectionManager = connectionManager;
            _logger = logger;
            _serviceProvider = serviceProvider;
            _messageHandlers = LoadMessageHandlerTypes();
            _terminalManager= terminalManager;
        }

        public override async Task OnConnectedAsync(ConnectionContext context)
        {
            var tcpContext = new TcpConnectionContext(context);
            var remoteEndPoint = tcpContext.RemoteEndPoint;

            // 为未鉴权连接设置30秒超时
            using var connectionTimeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(30));
            using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(
                connectionTimeoutCts.Token,
                tcpContext.ConnectionClosed);

            try
            {
                _logger.LogInformation("New connection，IP:{RemoteEndPoint}", remoteEndPoint);
                var readToken = linkedCts.Token;
                // 持续读取数据
                while (!tcpContext.ConnectionClosed.IsCancellationRequested)
                {
                    var result = await tcpContext.Transport.Input.ReadAsync(readToken);
                    var data = result.Buffer;

                    if (result.IsCompleted && data.Length == 0) break;

                    while (true)
                    {
                        var message = ProcessIso8583Message(ref data);
                        if (message == null) break;

                        //成功解析消息，如果是首条消息，将连接注册到管理器
                        if (string.IsNullOrEmpty(tcpContext.TerminalID) && !string.IsNullOrEmpty(message.TerimalID))
                        {
                            tcpContext.TerminalID = message.TerimalID;
                            tcpContext.MerchantID = message.MerchantID;
                            _connectionManager.TryAddConnection(tcpContext.TerminalID, tcpContext);

                            // 已注册到连接管理器，取消此连接的专用超时
                            connectionTimeoutCts.Cancel();
                            readToken = tcpContext.ConnectionClosed;

                            if (message.MessageType != "0800") {
                                //不是签到消息，尝试添加终端
                                var terminal = new Core.Models.Terminal
                                {
                                    ID = message.TerimalID,
                                    LineNO = message.LineNO,
                                    MachineID = message.MachineID,
                                    DeviceNO = message.DeviceNO,
                                    MerchantID = message.MerchantID,
                                    CreateTime = DateTime.Now,
                                    IsDeleted = false,
                                    Status = new TerminalStatus
                                    {
                                        ID = message.TerimalID,
                                        EndPoint = remoteEndPoint?.ToString() ?? "",
                                        ActiveStatus = DeviceActiveStatus.Active,
                                        ConnectionProtocol = "TCP",
                                        LastActiveTime = DateTime.Now,
                                        FileVersionMetadata = [],
                                        PropertyMetadata = [],
                                        LoginInTime = DateTime.Now,
                                        LoginOffTime = DateTime.Now,
                                        Token = ""
                                    },
                                    StatusUpdateTime = DateTime.Now
                                };
                                await _connectionManager.AddTerminal(terminal);
                            }
                        }
                        _connectionManager.SetTerminalActive(message.TerimalID);
                        await HandleMessageAsync(tcpContext, message);
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
                _logger.LogError(ex, "Connection error{TerminalID:{0}, IP:{RemoteEndPoint}}", tcpContext.TerminalID,remoteEndPoint);
            }
            finally
            {
                _logger.LogInformation("Connection closed, IP:{0}", remoteEndPoint);
                //_connectionManager.TryRemoveConnection(tcpContext.TerminalID);
                //await context.DisposeAsync();
            }
        }


        private Iso8583Message? ProcessIso8583Message(ref ReadOnlySequence<byte> data)
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

                        var iso8583Message = Iso8583Message.Create(_serviceProvider, message);

                        //package.GetCurBuffer()
                        //TODO：登录指令需要使用登录密钥校验MAC (VER>="0300")
                        //TODO：其他指令需要使用会话密钥校验MAC 

                        return iso8583Message;
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


        private async Task HandleMessageAsync(TcpConnectionContext context, Iso8583Message message)
        {
            //// 创建活动源
            //using var activity = _activitySource.StartActivity($"ProcessMessage_{message.MessageType}");

            //// 添加有关消息的基本信息作为标签
            //activity?.SetTag("terminal.id", context.TerminalId);
            //activity?.SetTag("message.type", message.MessageType);
            //activity?.SetTag("merchant.id", context.MerchantID);

            // 开始计时
            var stopwatch = Stopwatch.StartNew();
            try
            {
                _networkBandwidthIn.Add(message.GetCurBuffer().Length,
                    new KeyValuePair<string, object?>("MessageType", message.MessageType),
                    new KeyValuePair<string, object?>("TerminalID", context.TerminalID),
                    new KeyValuePair<string, object?>("MerchantID", context.MerchantID));

                if (_messageHandlers.TryGetValue(message.MessageType, out var handler))
                {
                    // 记录处理开始事件
                    //activity?.AddEvent(new ActivityEvent("HandlerStarted"));

                    // 处理消息
                    var response = await handler.HandleMessageAsync(context, message);
                    await ProcessResponse(context, message, response);
                    // 记录处理结束事件
                    //activity?.AddEvent(new ActivityEvent("HandlerCompleted"));
                }
                else
                {
                    _logger.LogWarning("No handler found for message type {MessageType} from {TerminalID}",
                        message.MessageType, context.TerminalID);
                    //activity?.SetTag("error", "handler_not_found");
                }

                // 计算和记录处理时长
                stopwatch.Stop();
                var processingTime = stopwatch.ElapsedMilliseconds;

                // 添加处理时间作为指标
                //activity?.SetTag("processing.time_ms", processingTime);

                // 记录性能日志
                _logger.LogInformation("Message {MessageType} from {TerminalID} processed in {ElapsedMilliseconds}ms",
                    message.MessageType, context.TerminalID, processingTime);

                _messageProcessedCounter.Add(1, 
                    new KeyValuePair<string, object?>("MessageType", message.MessageType),
                    new KeyValuePair<string, object?>("TerminalID", context.TerminalID),
                    new KeyValuePair<string, object?>("MerchantID", context.MerchantID));
                _messageProcessingDuration.Record(stopwatch.ElapsedMilliseconds,
                    new KeyValuePair<string, object?>("MessageType", message.MessageType),
                    new KeyValuePair<string, object?>("TerminalID", context.TerminalID),
                    new KeyValuePair<string, object?>("MerchantID", context.MerchantID));
            }
            catch (Exception ex)
            {
                // 记录错误
                stopwatch.Stop();
                //activity?.SetStatus(ActivityStatusCode.Error, ex.Message);
                //activity?.SetTag("error", ex.GetType().Name);
                //activity?.SetTag("error.message", ex.Message);
                _messageFailedCounter.Add(1,
                    new KeyValuePair<string, object?>("MessageType", message.MessageType),
                    new KeyValuePair<string, object?>("TerminalID", context.TerminalID),
                    new KeyValuePair<string, object?>("MerchantID", context.MerchantID));

                _logger.LogError(ex, "Error handling message {MessageType} from {TerminalID} after {ElapsedMilliseconds}ms",
                    message.MessageType, context.TerminalID, stopwatch.ElapsedMilliseconds);
            }
        }


        //统一回复处理
        private async Task ProcessResponse(TcpConnectionContext context, Iso8583Message request, Iso8583Message response)
        {
            if (response == null) return;

            if (request.Exist(3)) response.SetField(3, request.GetString(3));

            response.SetDateTime(12, DateTime.Now);
            response.SetDateTime(13, DateTime.Now);
            response.SetField(41, request.MachineID);

            var needSign = false;
            var msgcount = 0;
            if (request.MessageType == Iso8583MessageType.SignInRequest)
            {
                //一旦签到，则清除终端的待签状态
                _terminalManager.ClearTerminalNeedSign(request.TerimalID);
            }
            else
            {
                //根据是否有期望版本，判断是否需要重新登录
                needSign = _terminalManager.CheckTerminalNeedSign(request.TerimalID);
            }

            if (!needSign && request.MessageType != Iso8583MessageType.MsgRequest && request.MessageType != Iso8583MessageType.MsgConfirmResquest)
            {
                //如果不是签到消息或消息处理相关指令，检查是否有未读消息
                msgcount = _terminalManager.GetUnReadMessageCount(request.TerimalID);
            }

            if (request.MessageType == Iso8583MessageType.MsgRequest) { 
                if(response.GetField<string>(39) == "0010")
                {
                    //未取得消息，清空消息
                    _terminalManager.ClearUnreadMessageCount(request.TerimalID);
                }
            }

            await context.SendMessageAsync(response.Pack(needSign, msgcount));

            _networkBandwidthOut.Add(response.GetCurBuffer().Length,
                new KeyValuePair<string, object?>("MessageType", response.MessageType),
                new KeyValuePair<string, object?>("TerminalID", context.TerminalID),
                new KeyValuePair<string, object?>("MerchantID", context.MerchantID));
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