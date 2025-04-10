using Azure;
using CommunityToolkit.HighPerformance.Helpers;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
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

namespace SlzrCrossGate.Core.Service
{
    public class TerminalManager
    {
        private readonly ConcurrentDictionary<string, Terminal> _terminals = new();
        private readonly TerminalEventService _terminalEventService;
        private readonly Repository<Models.Terminal> _terminalRepository;
        private readonly Repository<Models.TerminalStatus> _terminalStatusRepository;
        private readonly RabbitMQService _rabbitMQService;
        private readonly FilePublishEventService _filePublishEventService;


        public TerminalManager( TerminalEventService terminalEventService, 
            Repository<Models.Terminal> terminalRepository, 
            Repository<TerminalStatus> terminalStatusRepository,
            RabbitMQService rabbitMQService,
            FilePublishEventService filePublishEventService)
        {
            _terminalEventService = terminalEventService;
            _terminalRepository = terminalRepository;
            _terminalStatusRepository = terminalStatusRepository;
            _rabbitMQService= rabbitMQService;
            _filePublishEventService = filePublishEventService;
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
            terminal.StatusUpdateTime=DateTime.Now;

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

        public bool RemoveTerminal(string terminalId)
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

        public void LoadTerminals(ConcurrentDictionary<string, Terminal> keyValuePairs) {
            _terminals.Concat(keyValuePairs);
        }

        // 从数据库加载终端信息
        public static ConcurrentDictionary<string, Terminal> FetchTerminalsFromDatabase(TcpDbContext dbContext)
        {
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
            return keyValuePairs;
        }

        public async Task<bool> ProcessPropertyChange(Terminal terminal,TerminalSignDto dto)
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

        //检查版本是否有变更
        public async Task<bool> ProcessFileVersionChange(Terminal terminal, TerminalSignDto signDto) {
            if (terminal.Status == null) {
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
                else {
                    terminal.Status.FileVersionMetadata.TryAdd(item.Key, new VersionOptions
                    {
                        Current = item.Value,
                        Expected = "",
                        IsExpired = true
                    });
                    result = true;
                }
            }

            if(result)
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
                    var expectedVersions = terminal.Status.FileVersionMetadata.Where(p => p.Value.IsExpired == false && p.Value.Current != p.Value.Expected).ToDictionary();//.Select(p => new KeyValuePair<string, string>(p.Key, p.Value.Expected)).ToDictionary();
                    return expectedVersions ?? [];
                }
            }
            return [];
        }


        //设备签到等指令中，上传新的终端属性和文件版本，需要对比，看是否有更新
        public bool UpdateTerminalProperties(string terminalId, Dictionary<string, string> newProperties)
        {
            if (_terminals.TryGetValue(terminalId, out var terminal))
            {
                if (terminal.Status != null)
                {
                    foreach (var property in newProperties)
                    {
                        terminal.Status.PropertyMetadata[property.Key] = property.Value;
                    }
                    terminal.StatusUpdateTime = DateTime.Now;
                    return true;
                }
            }
            return false;
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
        private async  Task HandleFilePublishEvent(FilePublishEventMessage fileEvent)
        {
            IEnumerable<TerminalStatus> affectedTerminals = null;
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

            // 批量更新数据库
            await _terminalStatusRepository.BulkUpdateAsync(affectedTerminals, ["FileVersions"]);
        }

        private IEnumerable<TerminalStatus> AffectedTerminalStatusByMerchant(FilePublishEventMessage fileEvent) {
            var targetTerminals = _terminals.Where(p => p.Value.MerchantID == fileEvent.MerchantID);
            foreach (var item in targetTerminals) {
                if (item.Value.Status != null)
                {

                }
            }

            return [];
        }
        private IEnumerable<TerminalStatus> AffectedTerminalStatusByLine(FilePublishEventMessage fileEvent)
        {

        }
        private IEnumerable<TerminalStatus> AffectedTerminalStatusByTerminal(FilePublishEventMessage fileEvent)
        {

        }
    }
}
