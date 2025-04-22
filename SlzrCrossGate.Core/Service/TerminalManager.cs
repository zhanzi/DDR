using Azure;
using CommunityToolkit.HighPerformance.Helpers;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Abstractions;
using RabbitMQ.Client;
using SlzrCrossGate.Core.Database;
using SlzrCrossGate.Core.DTOs;
using SlzrCrossGate.Core.Models;
using SlzrCrossGate.Core.Repositories;
using SlzrCrossGate.Core.Service.BusinessServices;
using SlzrCrossGate.Core.Services;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.IO.Pipelines;
using System.Threading.Tasks;

namespace SlzrCrossGate.Core.Service
{
    public class TerminalManager
    {
        private readonly ConcurrentDictionary<string, Terminal> _terminals = new();
        private readonly TerminalEventService _terminalEventService;
        private readonly Repository<Models.Terminal> _terminalRepository;
        private readonly Repository<Models.TerminalStatus> _terminalStatusRepository;
        private readonly Repository<Models.FilePublish> _filePublishRepository;
        private readonly MsgBoxRepository _msgBoxRepository;
        private readonly RabbitMQService _rabbitMQService;
        private readonly FilePublishEventService _filePublishEventService;
        private readonly MsgboxEventService _msgboxEventService;
        //DI容器对象获取器
        private readonly IServiceProvider _serviceProvider;

        //缓存终端的未读消息数量
        private readonly ConcurrentDictionary<string, MessageCount> _unreadMessageCount = new();

        /// <summary>
        /// 缓存有版本需要更新的终端编号
        /// </summary>
        private readonly HashSet<string> _cachedNeedSignTerminalIds = new();

        //增加定时器，定时检查终端的文件版本是否与期望版本一致，并提醒更新
        private readonly Timer _checkFileVersionTimer;

        //增加定时器，定期对期望版本过期的终端进行更新
        private readonly Timer _updateExpiredVersionTimer;


        public TerminalManager(TerminalEventService terminalEventService,
            Repository<Models.Terminal> terminalRepository,
            Repository<TerminalStatus> terminalStatusRepository,
            RabbitMQService rabbitMQService,
            FilePublishEventService filePublishEventService,
            Repository<FilePublish> filePublishRepository,
            IServiceProvider serviceProvider,
            MsgBoxRepository msgBoxRepository,
            MsgboxEventService msgboxEventService)
        {
            _terminalEventService = terminalEventService;
            _terminalRepository = terminalRepository;
            _terminalStatusRepository = terminalStatusRepository;
            _rabbitMQService = rabbitMQService;
            _filePublishEventService = filePublishEventService;
            _filePublishRepository = filePublishRepository;
            _serviceProvider = serviceProvider;

            //定时器，定时检查终端的文件版本是否与期望版本一致，并提醒更新. 每分钟检查一次
            _checkFileVersionTimer = new Timer(new TimerCallback( _ =>  CheckTerminalFileVersion()), null, TimeSpan.FromSeconds(59), TimeSpan.FromSeconds(59));
            //定时器，定期对期望版本过期的终端进行更新. 5分钟检查一次
            _updateExpiredVersionTimer = new Timer(new TimerCallback(async _ => await UpdateExpiredTerminalVersion()), null, TimeSpan.FromSeconds(293), TimeSpan.FromSeconds(293));
            _msgBoxRepository = msgBoxRepository;
            _msgboxEventService = msgboxEventService;


            Task.Run(() => SubscribeToFileEventsQueue());
            Task.Run(() => SubscribeToMsgboxEventsQueue());
        }

        public async Task<bool> AddOrUpdateTerminal(Terminal terminal)
        {
            terminal.Status ??= new TerminalStatus
            {
                ID = terminal.ID,
                LastActiveTime = DateTime.Now,
                ActiveStatus = DeviceActiveStatus.Active,
                LoginInTime = DateTime.Now,
                LoginOffTime = DateTime.Now,
                Token = "",
                ConnectionProtocol = "",
                EndPoint = "",
                FileVersions = "",
                Properties = ""
            };
            terminal.Status.LastActiveTime = DateTime.Now;
            terminal.Status.ActiveStatus = DeviceActiveStatus.Active;
            terminal.StatusUpdateTime = DateTime.Now;

            bool isNewTerminal = !_terminals.ContainsKey(terminal.ID);
            _terminals.AddOrUpdate(terminal.ID, terminal, (key, existingVal) =>
            {
                terminal.CreateTime = existingVal.CreateTime;
                terminal.IsDeleted = false;
                return terminal;
            });

            if (isNewTerminal)
            {
                //终端不存在，添加新终端
                terminal.CreateTime = DateTime.Now;
                terminal.IsDeleted = false;
                await _terminalRepository.AddAsync(terminal);
                await _terminalStatusRepository.AddAsync(terminal.Status);

                //终端第一次连接，记录事件
                _ = _terminalEventService.RecordTerminalEventAsync(
                    terminal.MerchantID,
                    terminal.ID,
                    TerminalEventType.Created,
                    EventSeverity.Info,
                    $"Terminal Created."
                );

            }

            return true;
        }

        //设置设备为活跃状态
        public bool SetTerminalActive(string terminalId)
        {
            if (_terminals.TryGetValue(terminalId, out var terminal))
            {
                if (terminal.Status != null)
                {
                    terminal.Status.ActiveStatus = DeviceActiveStatus.Active;
                    terminal.Status.LastActiveTime = DateTime.Now;
                }
                terminal.StatusUpdateTime = DateTime.Now;
                return true;
            }
            return false;
        }

        //设置设备为非活跃状态
        public bool SetTerminalInactive(string terminalId)
        {
            if (_terminals.TryGetValue(terminalId, out var terminal))
            {
                if (terminal.Status != null)
                {
                    terminal.Status.ActiveStatus = DeviceActiveStatus.Inactive;
                }
                terminal.StatusUpdateTime = DateTime.Now;
                return true;
            }
            return false;
        }


        public Terminal? GetTerminal(string terminalId)
        {
            _terminals.TryGetValue(terminalId, out var terminal);
            return terminal;
        }

        public IEnumerable<Terminal> GetAllTerminals() => _terminals.Values;


        public void RefreshTerminalMessageCount() {
            _unreadMessageCount.Clear();
            _msgBoxRepository.GetTerminalUnreadCount()
                .ForEach(item =>
                {
                    _unreadMessageCount.TryAdd(item.Key, new MessageCount(item.Value, DateTime.Now));
                });
        }

        //未读消息量减1
        public void DecreaseUnreadMessageCount(string terminalId)
        {
            if (_unreadMessageCount.TryGetValue(terminalId, out var messageCount))
            {
                messageCount.Decrease();
            }
        }

        //未读消息量加1
        public void IncreaseUnreadMessageCount(string terminalId)
        {
            if (_unreadMessageCount.TryGetValue(terminalId, out var messageCount))
            {
                messageCount.Increase();
            }
            else
            {
                _unreadMessageCount.TryAdd(terminalId, new MessageCount(1, DateTime.Now));
            }
        }

        public int GetUnReadMessageCount(string terminalId)
        {
            if (_unreadMessageCount.TryGetValue(terminalId, out var messageCount))
            {
                return messageCount.Count;
            }
            return 0;
        }

        //消息清零
        public void ClearUnreadMessageCount(string terminalId)
        {
            if (_unreadMessageCount.TryGetValue(terminalId, out var messageCount))
            {
                messageCount.Clear();
            }
        }

        // 从数据库加载终端信息
        public void InitTerminalsFromDatabase()
        {
            var dbContext = _serviceProvider.GetRequiredService<TcpDbContext>();

            var terminals = dbContext.Terminals
                .Include(t => t.Status)
                .AsNoTracking()
                .ToList();


            ConcurrentDictionary<string, Terminal> keyValuePairs = new ConcurrentDictionary<string, Terminal>();

            foreach (var terminal in terminals)
            {
                terminal.Status ??= new TerminalStatus
                {
                    ID = terminal.ID,
                    LastActiveTime = DateTime.Now,
                    ActiveStatus = DeviceActiveStatus.Active,
                    LoginInTime = DateTime.Now,
                    LoginOffTime = DateTime.Now,
                    Token = "",
                    ConnectionProtocol = "",
                    EndPoint = "",
                    FileVersions = "",
                    Properties = ""
                };
                keyValuePairs.TryAdd(terminal.ID, terminal);
            }
            _terminals.Concat(keyValuePairs);
        }


        public async Task<bool> ProcessPropertyChange(Terminal terminal, TerminalSignDto dto)
        {
            if (terminal.ID != dto.ID) return false;
            if (terminal.MerchantID == dto.MerchantID && terminal.LineNO == dto.LineNO && terminal.DeviceNO == dto.DeviceNO)
            {
                return false;
            }

            if (terminal.MerchantID != dto.MerchantID)
            {
                _ = _terminalEventService.RecordTerminalEventAsync(
                       terminal.MerchantID,
                       terminal.ID,
                       TerminalEventType.MerchantIDChanged,
                        EventSeverity.Info,
                       $"Merchant from {terminal.MerchantID} changed to {dto.MerchantID}."
                       );
            }

            if (terminal.LineNO != dto.LineNO)
            {
                _ = _terminalEventService.RecordTerminalEventAsync(
                       terminal.MerchantID,
                       terminal.ID,
                       TerminalEventType.LineNOChanged,
                        EventSeverity.Info,
                       $"LineNO from {terminal.LineNO} changed to {dto.LineNO}."
                       );
            }

            if (terminal.DeviceNO != dto.DeviceNO)
            {
                _ = _terminalEventService.RecordTerminalEventAsync(
                       terminal.MerchantID,
                       terminal.ID,
                       TerminalEventType.DeviceNOChanged,
                        EventSeverity.Info,
                       $"DeviceNO from {terminal.DeviceNO} changed to {dto.DeviceNO}."
                       );
            }

            terminal.MerchantID = dto.MerchantID;
            terminal.LineNO = dto.LineNO;
            terminal.DeviceNO = dto.DeviceNO;
            terminal.StatusUpdateTime = DateTime.Now;

            if (terminal.Status != null)
            {
                foreach (var item in terminal.Status.FileVersionMetadata)
                {
                    item.Value.IsExpired = true;
                }
            }

            //更新
            await _terminalRepository.UpdateAsync(terminal);

            return true;
        }

        //版本变更处理
        public async Task<bool> ProcessFileVersionChange(Terminal terminal, TerminalSignDto signDto)
        {
            if (terminal.Status == null)
            {
                terminal.Status = new TerminalStatus
                {
                    ID = terminal.ID,
                    LastActiveTime = DateTime.Now,
                    ActiveStatus = DeviceActiveStatus.Active,
                    LoginInTime = DateTime.Now,
                    LoginOffTime = DateTime.Now,
                    Token = "",
                    ConnectionProtocol = signDto.ConnectionProtocol,
                    EndPoint = signDto.EndPoint,
                    FileVersionMetadata = ConvertClientVersionToFileVersion(signDto.ClientFileVersionsMetaData),
                    PropertyMetadata = signDto.PropertiesMetaData
                };
                //补充逻辑，当status信息被人工删除后可以自动重建
                await _terminalStatusRepository.AddAsync(terminal.Status);
                return false;
            }
            bool result = false;
            foreach (var item in signDto.ClientFileVersionsMetaData)
            {
                if (terminal.Status.FileVersionMetadata.TryGetValue(item.Key, out var version))
                {
                    if (item.Value != version.Current)
                    {
                        _ = _terminalEventService.RecordTerminalEventAsync(
                               terminal.MerchantID,
                               terminal.ID,
                               TerminalEventType.FileVersionUpdated,
                                EventSeverity.Info,
                               $"File {item.Key} , Version from {version.Current} changed to {item.Value}."
                               );
                        version.Current = item.Value;
                        result = true;
                    }
                }
                else
                {
                    terminal.Status.FileVersionMetadata.TryAdd(item.Key, new VersionOptions
                    {
                        Current = item.Value,
                        Expected = "",
                        IsExpired = true
                    });
                    result = true;
                }
            }

            if (result)
            {
                await _terminalStatusRepository.UpdateAsync(terminal.Status);
            }

            return result;
        }

        //查询是否有期望的新版本
        public Dictionary<string, VersionOptions> QueryExpectedVersions(string terminalId)
        {
            if (_terminals.TryGetValue(terminalId, out var terminal))
            {
                if (terminal.Status != null)
                {
                    var expectedVersions = terminal.Status.FileVersionMetadata.Where(p => p.Value.IsExpired == false && p.Value.Current != p.Value.Expected && p.Value.Expected != "").ToDictionary();
                    return expectedVersions ?? [];
                }
            }
            return [];
        }


        public static Dictionary<string, VersionOptions> ConvertClientVersionToFileVersion(Dictionary<string, string> clientVersions)
        {
            return clientVersions.Select(x => new KeyValuePair<string, VersionOptions>(x.Key, new VersionOptions { Current = x.Value, IsExpired = true })).ToDictionary(x => x.Key, x => x.Value);
        }

        //实现一个方法，监听一个RabbitMQ的队列，处理文件发布和取消的事件
        public async Task SubscribeToFileEventsQueue()
        {
            await _filePublishEventService.Subscribe(HandleFilePublishEvent);
        }
        private async Task HandleFilePublishEvent(FilePublishEventMessage fileEvent)
        {
            IEnumerable<TerminalStatus> affectedTerminals = [];
            if (fileEvent.PublishType == PublishTypeOption.Merchant)
            {
                affectedTerminals = AffectedTerminalStatusByMerchant(fileEvent);
            }
            else if (fileEvent.PublishType == PublishTypeOption.Line)
            {
                affectedTerminals = AffectedTerminalStatusByLine(fileEvent);
            }
            else
            {
                affectedTerminals = AffectedTerminalStatusByTerminal(fileEvent);
            }

            await UpdateTerminalExpectedVersion(affectedTerminals, fileEvent);
        }

        public async Task SubscribeToMsgboxEventsQueue() {
            await _msgboxEventService.PurgeQueue();
            await _msgboxEventService.Subscribe(HandleMsgboxEvent);
        }
        private Task HandleMsgboxEvent(MsgboxEventMessage msgboxEvent)
        {
            if (msgboxEvent.ActionType == MsgboxEventActionType.Send)
            {
                IncreaseUnreadMessageCount(msgboxEvent.TerminalID);
            }
            else if (msgboxEvent.ActionType == MsgboxEventActionType.Reply) { 
                DecreaseUnreadMessageCount(msgboxEvent.TerminalID);
            }
            return Task.CompletedTask;
        }

        private IEnumerable<TerminalStatus> AffectedTerminalStatusByMerchant(FilePublishEventMessage fileEvent)
        {
            var affectedTerminals = _terminals
                .Where(p => p.Value.MerchantID == fileEvent.MerchantID
                    && p.Value.Status != null
                    && p.Value.Status.FileVersionMetadata.TryGetValue(fileEvent.FileFullType, out var version)
                    && version.PublishType <= fileEvent.PublishType)
                .Select(p => p.Value.Status!);

            return affectedTerminals;
        }
        private IEnumerable<TerminalStatus> AffectedTerminalStatusByLine(FilePublishEventMessage fileEvent)
        {
            var affectedTerminals = _terminals
                .Where(p => p.Value.MerchantID == fileEvent.MerchantID
                    && p.Value.LineNO == fileEvent.PublishTarget
                    && p.Value.Status != null
                    && p.Value.Status.FileVersionMetadata.TryGetValue(fileEvent.FileFullType, out var version)
                    && version.PublishType <= fileEvent.PublishType)
                .Select(p => p.Value.Status!);

            return affectedTerminals;
        }
        private IEnumerable<TerminalStatus> AffectedTerminalStatusByTerminal(FilePublishEventMessage fileEvent)
        {
            var affectedTerminals = _terminals
                .Where(p => p.Value.MerchantID == fileEvent.MerchantID
                    && p.Value.ID == fileEvent.PublishTarget
                    && p.Value.Status != null
                    && p.Value.Status.FileVersionMetadata.TryGetValue(fileEvent.FileFullType, out var version)
                    && version.PublishType <= fileEvent.PublishType)
                .Select(p => p.Value.Status!);

            return affectedTerminals;
        }

        //更新终端期望版本
        private async Task UpdateTerminalExpectedVersion(IEnumerable<TerminalStatus> terminalStatuses, FilePublishEventMessage fileEvent)
        {
            if (fileEvent.ActionType == FilePublishEventActionType.Publish)
            {
                foreach (TerminalStatus terminalStatus in terminalStatuses)
                {
                    if (terminalStatus.FileVersionMetadata.TryGetValue(fileEvent.FileFullType, out var version))
                    {

                        version.IsExpired = false;
                        version.ExpectedFileCrc = fileEvent.FileCrc;
                        version.PublishType = fileEvent.PublishType;
                        version.Expected = fileEvent.Ver;
                        version.ExpectedFileSize = fileEvent.FileSize;

                    }
                }
            }
            else
            {
                //对于取消发布事件，可能导致一些终端的期望版本过期，需要重新查询数据库版本信息并更新
                var published = await _filePublishRepository.FindAsync(p => p.MerchantID == fileEvent.MerchantID
                    && p.FileFullType == fileEvent.FileFullType
                    && p.PublishType < fileEvent.PublishType);

                foreach (TerminalStatus terminalStatus in terminalStatuses)
                {
                    if (terminalStatus.FileVersionMetadata.TryGetValue(fileEvent.FileFullType, out var version))
                    {
                        if (published.FirstOrDefault(p => p.PublishType == PublishTypeOption.Line) is FilePublish linePublish)
                        {
                            version.Expected = linePublish.Ver;
                            version.ExpectedFileCrc = linePublish.Crc;
                            version.ExpectedFileSize = linePublish.FileSize;
                            version.IsExpired = false;
                            continue;
                        }
                        if (published.FirstOrDefault(p => p.PublishType == PublishTypeOption.Merchant) is FilePublish merchantPublish)
                        {
                            version.Expected = merchantPublish.Ver;
                            version.ExpectedFileCrc = merchantPublish.Crc;
                            version.ExpectedFileSize = merchantPublish.FileSize;
                            version.IsExpired = false;
                            continue;
                        }
                        version.Expected = "";
                        version.ExpectedFileCrc = "";
                        version.ExpectedFileSize = 0;
                        version.IsExpired = false;
                    }
                }
                //批量更新数据库
                await _terminalStatusRepository.BulkUpdateAsync(terminalStatuses, ["FileVersions"]);
            }
        }

        //对终端期望版本过期的进行批量更新
        public async Task<bool> UpdateExpiredTerminalVersion()
        {
            using var filepublish = _serviceProvider.GetService<FilePublishCachedService>();

            if (filepublish == null) return false;

            var expiredTerminals = _terminals
                .Where(p => p.Value.Status != null
                    && p.Value.Status.FileVersionMetadata.Any(v => v.Value.IsExpired == true))
                .Select(p => p.Value).ToList();
            foreach (var terminal in expiredTerminals)
            {
                if (terminal.Status == null) continue;

                await filepublish.LoadMerchantPublish(terminal.MerchantID);

                foreach (var item in terminal.Status.FileVersionMetadata)
                {
                    FilePublish publish;
                    if (filepublish.TryGetValue(filepublish.GetKey(terminal.MerchantID, item.Key, PublishTypeOption.Terminal, terminal.ID), out publish))
                    {
                        item.Value.Expected = publish.Ver;
                        item.Value.ExpectedFileCrc = publish.Crc;
                        item.Value.ExpectedFileSize = publish.FileSize;
                        item.Value.IsExpired = false;
                        continue;
                    }
                    if (filepublish.TryGetValue(filepublish.GetKey(terminal.MerchantID, item.Key, PublishTypeOption.Line, terminal.LineNO), out publish))
                    {
                        item.Value.Expected = publish.Ver;
                        item.Value.ExpectedFileCrc = publish.Crc;
                        item.Value.ExpectedFileSize = publish.FileSize;
                        item.Value.IsExpired = false;
                        continue;
                    }
                    if (filepublish.TryGetValue(filepublish.GetKey(terminal.MerchantID, item.Key, PublishTypeOption.Merchant, terminal.MerchantID), out publish))
                    {
                        item.Value.Expected = publish.Ver;
                        item.Value.ExpectedFileCrc = publish.Crc;
                        item.Value.ExpectedFileSize = publish.FileSize;
                        item.Value.IsExpired = false;
                        continue;
                    }
                    item.Value.Expected = "";
                    item.Value.ExpectedFileCrc = "";
                    item.Value.ExpectedFileSize = 0;
                    item.Value.IsExpired = false;
                }
            }
            return true;
        }

        //检查终端文件版本与期望版本不一致的，提醒更新
        public bool CheckTerminalFileVersion()
        {
            var terminals = _terminals
                .Where(p => p.Value.Status != null
                    && p.Value.Status.FileVersionMetadata.Any(v => v.Value.IsExpired == false && v.Value.Expected!="" && v.Value.Current != v.Value.Expected))
                .Select(p => p.Value).ToList();
            foreach (var terminal in terminals)
            {
                if (terminal.Status == null) continue;
                _cachedNeedSignTerminalIds.Add(terminal.ID);
            }
            return true;
        }

        //查询终端是否有需要更新版本（是否需要重新签到）
        public bool CheckTerminalNeedSign(string terminalId)
        {
            return _cachedNeedSignTerminalIds.Contains(terminalId);
        }

        //清除终端的需要更新版本标记（签到后调用）
        public bool ClearTerminalNeedSign(string terminalId)
        {
            return _cachedNeedSignTerminalIds.Remove(terminalId);
        }
    }

    // Replace the problematic record declaration with a proper class definition  
    public class MessageCount
    {
        private int _count;
        public int Count { get; private set; }

        //Count增加1 
        public void Increase()
        {
            Count++;
            FreshTime = DateTime.Now;
        }
        //Count减少1
        public void Decrease()
        {
            Count = Math.Max(Interlocked.Decrement(ref _count), 0);//减1，如果小于0则清零
            FreshTime = DateTime.Now;
        }

        //Count清零
        public void Clear()
        {
            Count = 0;
            FreshTime = DateTime.Now;
        }

        public DateTime FreshTime { get; set; }

        public MessageCount(int count, DateTime freshTime)
        {
            _count = count;
            FreshTime = freshTime;
        }
    }
}
