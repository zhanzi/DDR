using Azure;
using CommunityToolkit.HighPerformance.Helpers;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Abstractions;
using RabbitMQ.Client;
using SlzrCrossGate.Common;
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
using static System.Formats.Asn1.AsnWriter;

namespace SlzrCrossGate.Core.Service
{
    public class TerminalManager
    {
        private readonly ConcurrentDictionary<string, Terminal> _terminals = new();
        private readonly TerminalEventService _terminalEventService;
        private readonly MsgboxEventService _msgboxEventService;
        private readonly IServiceScopeFactory _scopeFactory;

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
        private readonly ILogger<TerminalManager> _logger;


        public TerminalManager(
            IRabbitMQService rabbitMQService,
            IServiceScopeFactory scopeFactory,
            TerminalEventService terminalEventService,
            MsgboxEventService msgboxEventService,
            ILogger<TerminalManager> logger
            )
        {
            _scopeFactory = scopeFactory;
            _terminalEventService = terminalEventService;
            _msgboxEventService = msgboxEventService;
            _logger = logger;

            //定时器，定时检查终端的文件版本是否与期望版本一致，并提醒更新. 每分钟检查一次
            _checkFileVersionTimer = new Timer(new TimerCallback( _ =>  CheckTerminalFileVersion()), null, TimeSpan.FromSeconds(59), TimeSpan.FromSeconds(59));
            //定时器，定期对期望版本过期的终端进行更新. 5分钟检查一次
            _updateExpiredVersionTimer = new Timer(new TimerCallback(async _ => await UpdateExpiredTerminalVersion()), null, TimeSpan.FromSeconds(293), TimeSpan.FromSeconds(293));


        }


        public void Init() {
            InitTerminalsFromDatabase();
            RefreshTerminalMessageCount();
            Task.Run(() => SubscribeToFileEventsQueue());
            Task.Run(() => SubscribeToMsgboxEventsQueue());
        }

        public async Task<bool> AddOrUpdateTerminal(Terminal terminal)
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
                    ConnectionProtocol = "",
                    EndPoint = "",
                    FileVersions = "",
                    Properties = ""
                };
            }
            terminal.Status.LastActiveTime = DateTime.Now;
            terminal.Status.ActiveStatus = DeviceActiveStatus.Active;
            terminal.StatusUpdateTime = DateTime.Now;

            _terminals.AddOrUpdate(terminal.ID, terminal, (k, v) =>
            {
                v.MerchantID = terminal.MerchantID;
                v.MachineID = terminal.MachineID;
                v.DeviceNO = terminal.DeviceNO;
                v.LineNO = terminal.LineNO;
                v.IsDeleted = false;
                v.TerminalType = terminal.TerminalType;
                v.StatusUpdateTime = DateTime.Now;
                if (v.Status == null)
                {
                    v.Status = terminal.Status;
                }
                else
                {
                    v.Status.ActiveStatus = terminal.Status.ActiveStatus;
                    v.Status.LastActiveTime = terminal.Status.LastActiveTime;
                    v.Status.ConnectionProtocol = terminal.Status.ConnectionProtocol;
                    v.Status.EndPoint = terminal.Status.EndPoint;
                    v.Status.FileVersionMetadata = terminal.Status.FileVersionMetadata;
                    v.Status.PropertyMetadata = terminal.Status.PropertyMetadata;
                    v.Status.LoginInTime = terminal.Status.LoginInTime;
                    v.Status.Token = terminal.Status.Token;
                }
                return v;
            });
            return await SaveTerminal(terminal);
        }

        public async Task<bool> SaveTerminal(Terminal terminal)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<TcpDbContext>();

                // 检查终端是否已存在
                var existingTerminal = await dbContext.Terminals
                    .Include(t => t.Status)
                    .FirstOrDefaultAsync(t => t.ID == terminal.ID);

                if (existingTerminal != null)
                {
                    // 更新现有终端
                    existingTerminal.MerchantID = terminal.MerchantID;
                    existingTerminal.MachineID = terminal.MachineID;
                    existingTerminal.DeviceNO = terminal.DeviceNO;
                    existingTerminal.LineNO = terminal.LineNO;
                    existingTerminal.IsDeleted = false;
                    existingTerminal.TerminalType = terminal.TerminalType;
                    existingTerminal.StatusUpdateTime = DateTime.Now;

                    if (existingTerminal.Status != null && terminal.Status != null)
                    {
                        existingTerminal.Status.LastActiveTime = DateTime.Now;
                        existingTerminal.Status.ActiveStatus = DeviceActiveStatus.Active;
                        existingTerminal.Status.ConnectionProtocol = terminal.Status.ConnectionProtocol;
                        existingTerminal.Status.EndPoint = terminal.Status.EndPoint;
                        existingTerminal.Status.FileVersionMetadata = terminal.Status.FileVersionMetadata;
                        existingTerminal.Status.PropertyMetadata = terminal.Status.PropertyMetadata;
                        existingTerminal.Status.LoginInTime = terminal.Status.LoginInTime;
                        existingTerminal.Status.Token = terminal.Status.Token;
                        existingTerminal.Status.LoginOffTime = terminal.Status.LoginOffTime;
                    }
                    else
                    {
                        existingTerminal.Status = terminal.Status;
                    }
                }
                else
                {
                    // 添加新终端
                    dbContext.Terminals.Add(terminal);
                }

                await dbContext.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding or updating terminal {TerminalID}", terminal.ID);
                return false;
            }
        }

        private void RecordTerminalEvent(TerminalEvent terminalEvent)
        {
            _ = _terminalEventService.RecordTerminalEventAsync(terminalEvent);
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
            //从数据库加载终端的未读消息数量
            using var scope = _scopeFactory.CreateScope();
            var msgBoxRepository = scope.ServiceProvider.GetRequiredService<MsgBoxRepository>();
            msgBoxRepository.GetTerminalUnreadCount()
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
            using var scope = _scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<TcpDbContext>();

            var terminals = dbContext.Terminals
                .Include(t => t.Status)
                .AsNoTracking()
                .ToList();

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
                _terminals.TryAdd(terminal.ID, terminal);
            }

        }


        public bool ProcessPropertyChange(Terminal terminal, TerminalSignDto dto)
        {
            if (terminal.ID != dto.ID) return false;
            if (terminal.MerchantID == dto.MerchantID && terminal.LineNO == dto.LineNO && terminal.DeviceNO == dto.DeviceNO)
            {
                return false;
            }

            bool ischanged = false;

            if (terminal.MerchantID != dto.MerchantID)
            {
                RecordTerminalEvent(new TerminalEvent
                {
                    MerchantID = terminal.MerchantID,
                    TerminalID = terminal.ID,
                    EventType = TerminalEventType.MerchantIDChanged,
                    Severity = EventSeverity.Info,
                    Remark = $"Merchant changed from {terminal.MerchantID} to {dto.MerchantID}.",
                    Operator = ""
                });
                terminal.MerchantID = dto.MerchantID;
                ischanged = true;
            }

            if (terminal.LineNO != dto.LineNO)
            {
                RecordTerminalEvent(new TerminalEvent
                {
                    MerchantID = terminal.MerchantID,
                    TerminalID = terminal.ID,
                    EventType = TerminalEventType.LineNOChanged,
                    Severity = EventSeverity.Info,
                    Remark = $"LineNO  changed from {terminal.LineNO}to {dto.LineNO}.",
                    Operator = ""
                });
                terminal.LineNO = dto.LineNO;
                ischanged = true;
            }

            if (terminal.DeviceNO != dto.DeviceNO)
            {
                RecordTerminalEvent(new TerminalEvent
                {
                    MerchantID = terminal.MerchantID,
                    TerminalID = terminal.ID,
                    EventType = TerminalEventType.DeviceNOChanged,
                    Severity = EventSeverity.Info,
                    Remark = $"DeviceNO changed from {terminal.DeviceNO} to {dto.DeviceNO}.",
                    Operator = ""
                });
                terminal.DeviceNO = dto.DeviceNO;
                ischanged = true;
            }



            if (terminal.Status != null)
            {
                //对比 property是否有变更
                foreach (var item in dto.PropertiesMetaData)
                {
                    if (terminal.Status.PropertyMetadata.TryGetValue(item.Key, out var property))
                    {
                        if (item.Value != property)
                        {
                            RecordTerminalEvent(new TerminalEvent
                            {
                                MerchantID = terminal.MerchantID,
                                TerminalID = terminal.ID,
                                EventType = TerminalEventType.PropertyChanged,
                                Severity = EventSeverity.Info,
                                Remark = $"Property {item.Key} changed from {property} to {item.Value}.",
                                Operator = ""
                            });
                            ischanged = true;
                        }
                    }
                    else
                    {
                        RecordTerminalEvent(new TerminalEvent
                        {
                            MerchantID = terminal.MerchantID,
                            TerminalID = terminal.ID,
                            EventType = TerminalEventType.PropertyChanged,
                            Severity = EventSeverity.Info,
                            Remark = $"New Property {item.Key} added with value {item.Value}.",
                            Operator = ""
                        });
                        ischanged = true;
                    }
                }                
            }

            // using var scope = _scopeFactory.CreateScope();
            // var terminalRepository = scope.ServiceProvider.GetRequiredService<Repository<Terminal>>();
            // await terminalRepository.UpdateAsync(terminal);
            if (ischanged)
            {
                terminal.StatusUpdateTime = DateTime.Now;
            }
            return ischanged;
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
                using (var scope = _scopeFactory.CreateScope())
                {
                    var terminalStatusRepository = scope.ServiceProvider.GetRequiredService<Repository<TerminalStatus>>();
                    await terminalStatusRepository.AddAsync(terminal.Status);
                }

                return false;
            }
            bool result = false;
            foreach (var item in signDto.ClientFileVersionsMetaData)
            {
                if (terminal.Status.FileVersionMetadata.TryGetValue(item.Key, out var version))
                {
                    if (item.Value != version.Current)
                    {
                        RecordTerminalEvent(new TerminalEvent
                        {
                            MerchantID = terminal.MerchantID,
                            TerminalID = terminal.ID,
                            EventType = TerminalEventType.FileVersionUpdated,
                            Severity = EventSeverity.Info,
                            Remark = $"File {item.Key} , Version from {version.Current} changed to {item.Value}.",
                            Operator = ""
                        });

                        version.Current = item.Value;
                        result = true;
                    }
                }
                else
                {
                    terminal.Status.AddFileVersion(item.Key, new VersionOptions
                    {
                        Current = item.Value,
                        Expected = "",
                        ExpectedFileCrc = "",
                        IsExpired = true,
                        PublishType = PublishTypeOption.None
                    });
                    result = true;
                    RecordTerminalEvent(new TerminalEvent
                    {
                        MerchantID = terminal.MerchantID,
                        TerminalID = terminal.ID,
                        EventType = TerminalEventType.FileVersionUpdated,
                        Severity = EventSeverity.Info,
                        Remark = $"New File {item.Key} , Version  {item.Value}.",
                        Operator = ""
                    });
                }
            }

            // if (result)
            // {
            //     using var scope = _scopeFactory.CreateScope();
            //     var terminalStatusRepository = scope.ServiceProvider.GetRequiredService<Repository<TerminalStatus>>();
            //     await terminalStatusRepository.UpdateAsync(terminal.Status);
            // }

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
            return clientVersions.Select(x => new KeyValuePair<string, VersionOptions>(x.Key, new VersionOptions
            {
                Current = x.Value,
                Expected = "",
                ExpectedFileCrc = "",
                IsExpired = true,
                PublishType = PublishTypeOption.None
            })).ToDictionary(x => x.Key, x => x.Value);
        }

        //实现一个方法，监听一个RabbitMQ的队列，处理文件发布和取消的事件
        public async Task SubscribeToFileEventsQueue()
        {
            using var scope = _scopeFactory.CreateScope();
            var filePublishEventService = scope.ServiceProvider.GetRequiredService<FilePublishEventService>();
            await filePublishEventService.Subscribe(HandleFilePublishEvent);
        }
        private async Task HandleFilePublishEvent(FilePublishEventMessage fileEvent)
        {
            List<TerminalStatus> affectedTerminals;

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

        private List<TerminalStatus> AffectedTerminalStatusByMerchant(FilePublishEventMessage fileEvent)
        {
            var result = new List<TerminalStatus>();

            foreach (var terminal in _terminals.Values)
            {
                // 检查商户ID是否匹配
                if (terminal.MerchantID != fileEvent.MerchantID)
                    continue;

                // 检查状态是否存在
                if (terminal.Status == null)
                    continue;

                // 检查是否有对应的文件版本信息
                if (!terminal.Status.FileVersionMetadata.TryGetValue(fileEvent.FileFullType, out var version))
                    continue;

                // 检查发布类型优先级
                if (version.PublishType > fileEvent.PublishType)
                    continue;

                result.Add(terminal.Status);
            }

            return result;
        }
        private List<TerminalStatus> AffectedTerminalStatusByLine(FilePublishEventMessage fileEvent)
        {
            var result = new List<TerminalStatus>();

            foreach (var terminal in _terminals.Values)
            {
                // 检查商户ID是否匹配
                if (terminal.MerchantID != fileEvent.MerchantID)
                    continue;

                // 检查线路号是否匹配
                if (terminal.LineNO != fileEvent.PublishTarget)
                    continue;

                // 检查状态是否存在
                if (terminal.Status == null)
                    continue;

                // 检查是否有对应的文件版本信息
                if (!terminal.Status.FileVersionMetadata.TryGetValue(fileEvent.FileFullType, out var version))
                    continue;

                // 检查发布类型优先级
                if (version.PublishType > fileEvent.PublishType)
                    continue;

                result.Add(terminal.Status);
            }

            return result;
        }
        private List<TerminalStatus> AffectedTerminalStatusByTerminal(FilePublishEventMessage fileEvent)
        {
            var result = new List<TerminalStatus>();

            foreach (var terminal in _terminals.Values)
            {
                // 检查商户ID是否匹配
                if (terminal.MerchantID != fileEvent.MerchantID)
                    continue;

                // 检查终端ID是否匹配
                if (terminal.ID != fileEvent.PublishTarget)
                    continue;

                // 检查状态是否存在
                if (terminal.Status == null)
                    continue;

                // 检查是否有对应的文件版本信息
                if (!terminal.Status.FileVersionMetadata.TryGetValue(fileEvent.FileFullType, out var version))
                    continue;

                // 检查发布类型优先级
                if (version.PublishType > fileEvent.PublishType)
                    continue;

                result.Add(terminal.Status);
            }

            return result;
        }

        //更新终端期望版本
        private async Task UpdateTerminalExpectedVersion(IEnumerable<TerminalStatus> terminalStatuses, FilePublishEventMessage fileEvent)
        {
            using var scope = _scopeFactory.CreateScope();
            if (fileEvent.ActionType == FilePublishEventActionType.Publish)
            {
                foreach (TerminalStatus terminalStatus in terminalStatuses)
                {
                    // 使用新的辅助方法来更新文件版本信息
                    terminalStatus.UpdateFileVersion(fileEvent.FileFullType, version =>
                    {
                        version.IsExpired = false;
                        version.ExpectedFileCrc = fileEvent.FileCrc;
                        version.PublishType = fileEvent.PublishType;
                        version.Expected = fileEvent.Ver;
                        version.ExpectedFileSize = fileEvent.FileSize;
                    });

                }
            }
            else
            {
                //对于取消发布事件，可能导致一些终端的期望版本过期，需要重新查询数据库版本信息并更新
                var filePublishRepository = scope.ServiceProvider.GetRequiredService<Repository<FilePublish>>();
                var published = await filePublishRepository.FindAsync(p => p.MerchantID == fileEvent.MerchantID
                    && p.FileFullType == fileEvent.FileFullType
                    && p.PublishType < fileEvent.PublishType);

                foreach (TerminalStatus terminalStatus in terminalStatuses)
                {
                    // 使用新的辅助方法来更新文件版本信息
                    terminalStatus.UpdateFileVersion(fileEvent.FileFullType, version =>
                    {
                        if (published.FirstOrDefault(p => p.PublishType == PublishTypeOption.Line) is FilePublish linePublish)
                        {
                            version.Expected = linePublish.Ver;
                            version.ExpectedFileCrc = linePublish.Crc;
                            version.ExpectedFileSize = linePublish.FileSize;
                            version.IsExpired = false;
                        }
                        else if (published.FirstOrDefault(p => p.PublishType == PublishTypeOption.Merchant) is FilePublish merchantPublish)
                        {
                            version.Expected = merchantPublish.Ver;
                            version.ExpectedFileCrc = merchantPublish.Crc;
                            version.ExpectedFileSize = merchantPublish.FileSize;
                            version.IsExpired = false;
                        }
                        else
                        {
                            version.Expected = "";
                            version.ExpectedFileCrc = "";
                            version.ExpectedFileSize = 0;
                            version.IsExpired = false;
                            version.PublishType =  PublishTypeOption.None;
                        }
                    });
                }
            }

            //批量更新数据库
            //using var scope = _scopeFactory.CreateScope();
            var terminalStatusRepository = scope.ServiceProvider.GetRequiredService<Repository<TerminalStatus>>();

            // 使用专门的方法更新 FileVersions 字段，避免其他字段的约束问题
            await terminalStatusRepository.BulkUpdateFileVersionsAsync(terminalStatuses);
        }

        //对终端期望版本过期的进行批量更新
        public async Task<bool> UpdateExpiredTerminalVersion()
        {
            var expiredTerminals = _terminals
                .Where(p => p.Value.Status != null
                    && p.Value.Status.FileVersionMetadata.Any(v => v.Value.IsExpired == true))
                .Select(p => p.Value).ToList();

            if(expiredTerminals.Count == 0) return false;

            using var scope = _scopeFactory.CreateScope();
            var filePublishCachedService = scope.ServiceProvider.GetRequiredService<FilePublishCachedService>();


            foreach (var terminal in expiredTerminals)
            {
                if (terminal.Status == null) continue;

                await filePublishCachedService.LoadMerchantPublish(terminal.MerchantID);

                // 使用新的辅助方法来批量更新文件版本信息
                terminal.Status.UpdateFileVersions(metadata =>
                {
                    foreach (var item in metadata)
                    {
                        if (filePublishCachedService.TryGetValue(filePublishCachedService.GetKey(terminal.MerchantID, item.Key, PublishTypeOption.Terminal, terminal.ID), out FilePublish? publish) && publish != null)
                        {
                            item.Value.Expected = publish.Ver;
                            item.Value.ExpectedFileCrc = publish.Crc;
                            item.Value.ExpectedFileSize = publish.FileSize;
                            item.Value.IsExpired = false;
                            continue;
                        }
                        if (filePublishCachedService.TryGetValue(filePublishCachedService.GetKey(terminal.MerchantID, item.Key, PublishTypeOption.Line, terminal.LineNO), out publish) && publish != null)
                        {
                            item.Value.Expected = publish.Ver;
                            item.Value.ExpectedFileCrc = publish.Crc;
                            item.Value.ExpectedFileSize = publish.FileSize;
                            item.Value.IsExpired = false;
                            continue;
                        }
                        if (filePublishCachedService.TryGetValue(filePublishCachedService.GetKey(terminal.MerchantID, item.Key, PublishTypeOption.Merchant, terminal.MerchantID), out publish) && publish != null)
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
                });
            }


            //批量更新数据库
            //using var scope = _scopeFactory.CreateScope();
            var terminalStatusRepository = scope.ServiceProvider.GetRequiredService<Repository<TerminalStatus>>();
            // 使用专门的方法更新 FileVersions 字段，避免其他字段的约束问题
            await terminalStatusRepository.BulkUpdateFileVersionsAsync(expiredTerminals.Where(p => p.Status != null).Select(p => p.Status!).ToList());

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


        public bool CheckMac(string terminalId, byte[] message)
        {
            var key = GetMacKey(terminalId);
            var mac = message.TakeLast(4).ToArray();
            return Encrypts.ChcekMac(message.Skip(13).SkipLast(4).ToArray(), mac, DataConvert.HexToBytes(key));
        }

        public string GetMacKey(string terminalId)
        {
            var hexmackey= Encrypts.ComputeMD5($"slzr-mackey-{terminalId}");
            return hexmackey;
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
