using Azure;
using CommunityToolkit.HighPerformance.Helpers;
using EFCore.BulkExtensions;
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
using System.Text;
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

        //增加定时器，定期批量更新终端的最后活动时间到数据库
        private readonly Timer _updateLastActiveTimeTimer;

        //记录需要更新LastActiveTime的终端ID集合
        private readonly ConcurrentDictionary<string, DateTime> _pendingLastActiveTimeUpdates = new();

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
            //定时器，定期批量更新终端的最后活动时间到数据库. 每30秒更新一次
            _updateLastActiveTimeTimer = new Timer(new TimerCallback(async _ => await BatchUpdateLastActiveTime()), null, TimeSpan.FromSeconds(30), TimeSpan.FromSeconds(30));


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
                bool activeStatusChanged = false;
                var now = DateTime.Now;
                if (terminal.Status != null)
                {
                    activeStatusChanged = terminal.Status.ActiveStatus != DeviceActiveStatus.Active;
                    terminal.Status.ActiveStatus = DeviceActiveStatus.Active;
                    terminal.Status.LastActiveTime = now;
                }
                terminal.StatusUpdateTime = now;
                if (activeStatusChanged)
                {
                    try
                    {
                        //立即更新状态到数据库
                        using var scope = _scopeFactory.CreateScope();
                        var dbContext = scope.ServiceProvider.GetRequiredService<TcpDbContext>();

                        // 只更新TerminalStatus，避免Terminal的级联操作导致主键冲突
                        if (terminal.Status != null)
                        {
                            var existingStatus = dbContext.TerminalStatuses.Find(terminal.Status.ID);
                            if (existingStatus != null)
                            {
                                existingStatus.ActiveStatus = DeviceActiveStatus.Active;
                                existingStatus.LastActiveTime = now;
                                dbContext.SaveChanges();
                            }
                            else
                            {
                                // 如果TerminalStatus不存在，创建新的
                                dbContext.TerminalStatuses.Add(terminal.Status);
                                dbContext.SaveChanges();
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "更新终端活跃状态失败: {TerminalId}", terminalId);
                        // 继续执行，不影响内存状态更新
                    }
                }
                else
                {
                    // 记录需要更新LastActiveTime的终端，用于批量更新
                    _pendingLastActiveTimeUpdates.AddOrUpdate(terminalId, now, (key, oldValue) => now);
                }
                return true;
            }
            return false;
        }

        //设置设备为非活跃状态
        public bool SetTerminalInactive(string terminalId)
        {
            if (_terminals.TryGetValue(terminalId, out var terminal))
            {
                bool activeStatusChanged = false;
                var now = DateTime.Now;
                if (terminal.Status != null)
                {
                    activeStatusChanged = terminal.Status.ActiveStatus != DeviceActiveStatus.Inactive;
                    terminal.Status.ActiveStatus = DeviceActiveStatus.Inactive;
                }
                terminal.StatusUpdateTime = now;
                if (activeStatusChanged)
                {
                    try
                    {
                        //立即更新状态到数据库
                        using var scope = _scopeFactory.CreateScope();
                        var dbContext = scope.ServiceProvider.GetRequiredService<TcpDbContext>();

                        // 只更新TerminalStatus，避免Terminal的级联操作导致主键冲突
                        if (terminal.Status != null)
                        {
                            var existingStatus = dbContext.TerminalStatuses.Find(terminal.Status.ID);
                            if (existingStatus != null)
                            {
                                existingStatus.ActiveStatus = DeviceActiveStatus.Inactive;
                                dbContext.SaveChanges();
                            }
                            else
                            {
                                // 如果TerminalStatus不存在，创建新的
                                dbContext.TerminalStatuses.Add(terminal.Status);
                                dbContext.SaveChanges();
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "更新终端非活跃状态失败: {TerminalId}", terminalId);
                        // 继续执行，不影响内存状态更新
                    }
                }
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
                    //Remark = $"Merchant changed from {terminal.MerchantID} to {dto.MerchantID}.",
                    //Remark 中文
                    Remark = $"商户变更: {terminal.MerchantID} => {dto.MerchantID}.",
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
                    //Remark = $"LineNO  changed from {terminal.LineNO}to {dto.LineNO}.",
                    Remark = $"线路变更: {terminal.LineNO} => {dto.LineNO}.",
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
                    //Remark = $"DeviceNO changed from {terminal.DeviceNO} to {dto.DeviceNO}.",
                    Remark = $"设备编号变更: {terminal.DeviceNO} => {dto.DeviceNO}.",
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
                                //Remark = $"Property {item.Key} changed from {property} to {item.Value}.",
                                Remark = $"属性[{item.Key}]变更: {property} => {item.Value}.",
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
                            //Remark = $"New Property {item.Key} added with value {item.Value}.",
                            Remark = $"新增属性[{item.Key}]，值: {item.Value}.",
                            Operator = ""
                        });
                        ischanged = true;
                    }
                }
                //terminal.Status.PropertyMetadata 中存在，但 dto.PropertiesMetaData 中不存在
                foreach (var item in terminal.Status.PropertyMetadata)
                {
                    if (!dto.PropertiesMetaData.TryGetValue(item.Key, out var property))
                    {
                        RecordTerminalEvent(new TerminalEvent
                        {
                            MerchantID = terminal.MerchantID,
                            TerminalID = terminal.ID,
                            EventType = TerminalEventType.PropertyChanged,
                            Severity = EventSeverity.Info,
                            //Remark = $"Property {item.Key} removed.",
                            Remark = $"删除属性[{item.Key}]，值: {item.Value}.",
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
            var currentVersions = terminal.Status.FileVersionMetadata;
            foreach (var item in signDto.ClientFileVersionsMetaData)
            {
                if (currentVersions.TryGetValue(item.Key, out var version))
                {
                    if (item.Value != version.Current)
                    {
                        RecordTerminalEvent(new TerminalEvent
                        {
                            MerchantID = terminal.MerchantID,
                            TerminalID = terminal.ID,
                            EventType = TerminalEventType.FileVersionUpdated,
                            Severity = EventSeverity.Info,
                            //Remark = $"File {item.Key} , Version from {version.Current} changed to {item.Value}.",
                            Remark = $"文件[{item.Key}]版本变更: {version.Current} => {item.Value}.",
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
                        //Remark = $"New File {item.Key} , Version  {item.Value}.",
                        Remark = $"新增文件[{item.Key}]，版本: {item.Value}.",
                        Operator = ""
                    });
                }
            }
            //terminal.Status.FileVersionMetadata 中存在，但 signDto.ClientFileVersionsMetaData 中不存在
            foreach (var item in currentVersions)
            {
                if (!signDto.ClientFileVersionsMetaData.TryGetValue(item.Key, out var version))
                {
                    currentVersions.Remove(item.Key);
                    result = true;
                    RecordTerminalEvent(new TerminalEvent
                    {
                        MerchantID = terminal.MerchantID,
                        TerminalID = terminal.ID,
                        EventType = TerminalEventType.FileVersionUpdated,
                        Severity = EventSeverity.Info,
                        Remark = $"删除文件[{item.Key}]，版本: {item.Value.Current}.",
                        Operator = ""
                    });
                }
            }

            if (result)
            {
                // using var scope = _scopeFactory.CreateScope();
                // var terminalStatusRepository = scope.ServiceProvider.GetRequiredService<Repository<TerminalStatus>>();
                // await terminalStatusRepository.UpdateAsync(terminal.Status);
                terminal.Status.FileVersionMetadata= currentVersions;
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
            try
            {
                var expiredTerminals = _terminals
                    .Where(p => p.Value.Status != null
                        && p.Value.Status.FileVersionMetadata.Any(v => v.Value.IsExpired == true))
                    .Select(p => p.Value).ToList();

                if (expiredTerminals.Count == 0) return false;

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
            catch (Exception ex)
            {
                _logger.LogError(ex, "批量更新终端期望版本失败");
                return false;
            }
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

        //批量更新终端的最后活动时间到数据库
        private async Task BatchUpdateLastActiveTime()
        {
            if (_pendingLastActiveTimeUpdates.IsEmpty)
                return;

            try
            {
                // 获取所有待更新的终端ID和时间
                var updates = new Dictionary<string, DateTime>();
                foreach (var kvp in _pendingLastActiveTimeUpdates)
                {
                    updates[kvp.Key] = kvp.Value;
                }

                // 清空待更新列表
                _pendingLastActiveTimeUpdates.Clear();

                if (updates.Count == 0)
                    return;

                using var scope = _scopeFactory.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<TcpDbContext>();

                // 使用高性能批量更新方案
                var affectedRows = await BatchUpdateLastActiveTimeOptimized(dbContext, updates);

                _logger.LogDebug("批量更新了 {Count} 个终端的最后活动时间，影响行数: {AffectedRows}", updates.Count, affectedRows);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "批量更新终端最后活动时间时发生错误");
            }
        }

        /// <summary>
        /// 高性能批量更新LastActiveTime的优化实现
        /// 支持多种策略：EF Core原生批量更新 -> 原生SQL -> 回退方案
        /// </summary>
        private async Task<int> BatchUpdateLastActiveTimeOptimized(TcpDbContext dbContext, Dictionary<string, DateTime> updates)
        {
            var terminalIds = updates.Keys.ToList();

            // 方案1: 尝试EFCore.BulkExtensions (优化配置后重新尝试)
            try
            {
                return await BatchUpdateWithExecuteUpdate(dbContext, updates);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "EFCore.BulkExtensions批量更新失败，回退到原生SQL方案");
            }

            // 方案2: 使用原生SQL方案，这是最稳定和高性能的方案
            try
            {
                return await BatchUpdateWithRawSql(dbContext, updates);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "原生SQL批量更新失败，使用回退方案");
            }

            // 方案3: 回退到优化的逐个更新方案 (保底方案)
            return await BatchUpdateFallback(dbContext, updates);
        }

        /// <summary>
        /// 方案1: EFCore.BulkExtensions真正的高性能批量更新 - 最高性能
        /// 性能: 1000个终端 < 50ms，这才是真正的批量更新！
        /// </summary>
        private async Task<int> BatchUpdateWithExecuteUpdate(TcpDbContext dbContext, Dictionary<string, DateTime> updates)
        {
            if (updates.Count == 0) return 0;

            // 构造要更新的TerminalStatus实体列表
            var terminalStatusesToUpdate = updates.Select(kvp => new TerminalStatus
            {
                ID = kvp.Key,
                LastActiveTime = kvp.Value
            }).ToList();

            try
            {
                _logger.LogDebug("开始EFCore.BulkExtensions批量更新，数据量: {Count}", terminalStatusesToUpdate.Count);

                // 尝试不使用事务，避免事务中SQL语句拼接问题
                // 使用EFCore.BulkExtensions进行真正的高性能批量更新
                // 只更新LastActiveTime字段，避免影响其他字段
                await dbContext.BulkUpdateAsync(terminalStatusesToUpdate, options =>
                {
                    options.PropertiesToInclude = new List<string> { nameof(TerminalStatus.LastActiveTime) };
                    options.SetOutputIdentity = false; // 不需要返回标识
                    options.BatchSize = 20; // 进一步减小批次大小，提高MySQL兼容性
                    options.UseTempDB = false; // 禁用临时表，避免MySQL语法问题
                    options.BulkCopyTimeout = 30; // 设置超时时间
                    // 尝试禁用一些可能导致MySQL语法问题的特性
                    options.IncludeGraph = false; // 禁用图形包含
                    options.EnableShadowProperties = false; // 禁用影子属性
                    options.TrackingEntities = false; // 禁用实体跟踪，提高性能
                });

                _logger.LogDebug("EFCore.BulkExtensions批量更新成功，更新数量: {Count}", terminalStatusesToUpdate.Count);
                return terminalStatusesToUpdate.Count;
            }
            catch (Exception ex) when (
                ex.Message.Contains("Loading local data is disabled") ||
                ex.Message.Contains("AllowLoadLocalInfile") ||
                ex.Message.Contains("doesn't have a default value") ||
                ex.Message.Contains("UseTempDB") ||
                ex.Message.Contains("Transaction") ||
                ex.Message.Contains("SQL syntax") ||
                ex.Message.Contains("sql_select_limit") ||
                ex.Message.Contains("SET sql_select_limit") ||
                ex.Message.Contains("MySqlException") ||
                ex.Message.Contains("MySqlConnector.MySqlException"))
            {
                // 如果BulkExtensions不可用，回退到原生SQL方案
                _logger.LogWarning(ex, "EFCore.BulkExtensions批量更新失败（MySQL兼容性问题），回退到原生SQL方案");
                return await BatchUpdateWithRawSql(dbContext, updates);
            }
        }

        /// <summary>
        /// 方案2: 原生SQL CASE WHEN批量更新 - 高性能
        /// 性能: 1000个终端 < 200ms
        /// </summary>
        private async Task<int> BatchUpdateWithRawSql(TcpDbContext dbContext, Dictionary<string, DateTime> updates)
        {
            if (updates.Count == 0) return 0;

            // 分批处理，避免SQL过长
            const int batchSize = 100;
            var totalAffected = 0;
            var updatesList = updates.ToList();

            for (int i = 0; i < updatesList.Count; i += batchSize)
            {
                var batch = updatesList.Skip(i).Take(batchSize).ToList();
                var affected = await ExecuteBatchUpdateSql(dbContext, batch);
                totalAffected += affected;
            }

            return totalAffected;
        }

        /// <summary>
        /// 执行单批次的SQL更新
        /// </summary>
        private async Task<int> ExecuteBatchUpdateSql(TcpDbContext dbContext, List<KeyValuePair<string, DateTime>> batch)
        {
            var sqlBuilder = new StringBuilder();
            var parameters = new List<object>();

            sqlBuilder.AppendLine("UPDATE TerminalStatuses SET LastActiveTime = CASE ID");

            for (int j = 0; j < batch.Count; j++)
            {
                var kvp = batch[j];
                sqlBuilder.AppendLine($"    WHEN @p{j * 2} THEN @p{j * 2 + 1}");
                parameters.Add(kvp.Key);
                parameters.Add(kvp.Value);
            }

            sqlBuilder.AppendLine("    ELSE LastActiveTime END");
            sqlBuilder.Append("WHERE ID IN (");
            sqlBuilder.Append(string.Join(",", batch.Select((_, idx) => $"@p{idx * 2}")));
            sqlBuilder.Append(")");

            return await dbContext.Database.ExecuteSqlRawAsync(sqlBuilder.ToString(), parameters.ToArray());
        }

        /// <summary>
        /// 方案3: 优化的回退方案 - 保底性能
        /// 性能: 1000个终端 < 2秒
        /// </summary>
        private async Task<int> BatchUpdateFallback(TcpDbContext dbContext, Dictionary<string, DateTime> updates)
        {
            var terminalIds = updates.Keys.ToList();

            // 一次性查询所有需要更新的记录
            var existingStatuses = await dbContext.TerminalStatuses
                .Where(ts => terminalIds.Contains(ts.ID))
                .ToListAsync();

            // 更新内存中的对象
            var updatedCount = 0;
            foreach (var status in existingStatuses)
            {
                if (updates.TryGetValue(status.ID, out var newTime))
                {
                    status.LastActiveTime = newTime;
                    updatedCount++;
                }
            }

            // 一次性保存所有更改
            await dbContext.SaveChangesAsync();
            return updatedCount;
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
