using Microsoft.EntityFrameworkCore;
using SlzrCrossGate.Core.Database;
using SlzrCrossGate.Core.DTOs;
using SlzrCrossGate.Core.Models;
using SlzrCrossGate.Core.Service.BusinessServices;
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

        public TerminalManager( TerminalEventService terminalEventService)
        {
            _terminalEventService = terminalEventService;
        }

        //终端签到
        public void SignInTerminal(TerminalSignDto signDto)
        {
            if (_terminals.TryGetValue(signDto.ID, out var terminal))
            {
                //TODO：检查属性是否变更，检查版本是否有变更，检查版本是否需要更新
                CheckPropertyChange(terminal, signDto);
                CheckFileVersionChange(terminal, signDto.ClientFileVersionsMetaData);

            }
        }


        public bool AddOrUpdateTerminal(Terminal terminal)
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

            _terminals.AddOrUpdate(terminal.ID, terminal, (key, existingVal) =>
            {
                terminal.CreateTime = existingVal.CreateTime;
                terminal.IsDeleted = false;
                return terminal;
            });
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

        //检查商户号，线路号，设备号是否发生变更，若发生变更，则需要更新并产生变更事件
        public bool UpdateTerminalInfo(string terminalId, string merchantId, string lineNo, string deviceNo)
        {
            if (_terminals.TryGetValue(terminalId, out var terminal))
            {
                if (terminal.MerchantID == merchantId && terminal.LineNO == lineNo && terminal.DeviceNO == deviceNo) {
                    return false;
                }

                if (terminal.MerchantID != merchantId) {

                    _ = _terminalEventService.RecordTerminalEventAsync(
                           terminal.MerchantID,
                           terminalId,
                           TerminalEventType.MerchantIDChanged,
                            EventSeverity.Info,
                           $"Merchant from {terminal.MerchantID} changed to {merchantId}."
                           );
                }

                if (terminal.LineNO != lineNo)
                {
                    _ = _terminalEventService.RecordTerminalEventAsync(
                           terminal.MerchantID,
                           terminalId,
                           TerminalEventType.LineNOChanged,
                            EventSeverity.Info,
                           $"LineNO from {terminal.LineNO} changed to {lineNo}."
                           );
                }

                if(terminal.DeviceNO != deviceNo) {
                    _ = _terminalEventService.RecordTerminalEventAsync(
                           terminal.MerchantID,
                           terminalId,
                           TerminalEventType.DeviceNOChanged,
                            EventSeverity.Info,
                           $"DeviceNO from {terminal.DeviceNO} changed to {deviceNo}."
                           );
                }

                terminal.MerchantID = merchantId;
                terminal.LineNO = lineNo;
                terminal.DeviceNO = deviceNo;
                terminal.StatusUpdateTime = DateTime.Now;
                if (terminal.Status != null) {
                    foreach (var item in terminal.Status.FileVersionMetadata) {
                        item.Value.IsExpired = true;
                    }
                }
                return true;
            }
            return false;
        }

        public bool CheckPropertyChange(Terminal terminal,TerminalSignDto dto)
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
            return true;
        }

        //检查版本是否有变更
        public bool CheckFileVersionChange(Terminal terminal, Dictionary<string, string> pairs) { 
            if(terminal.Status == null) return false;
            bool result = false;
            foreach (var item in pairs)
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
            return result;
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
    }
}
