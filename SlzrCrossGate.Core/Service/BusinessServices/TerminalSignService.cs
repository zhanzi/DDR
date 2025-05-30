using Microsoft.Extensions.Logging;
using SlzrCrossGate.Core.DTOs;
using SlzrCrossGate.Core.Models;
using SlzrCrossGate.Core.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SlzrCrossGate.Core.Service.BusinessServices
{
    public class TerminalSignService
    {
        private readonly Repository<Models.Terminal> _signServiceRepositry;
        private readonly ILogger<TerminalSignService> _logger;
        private readonly TerminalManager _terminalManager;

        public TerminalSignService(Repository<Models.Terminal> signServiceRepositry, ILogger<TerminalSignService> logger, TerminalManager terminalManager)
        {
            _signServiceRepositry = signServiceRepositry;
            _logger = logger;
            _terminalManager = terminalManager;
        }


        public bool CheckTerminalExists(string terminalID) {
            var terminal = _terminalManager.GetTerminal(terminalID);
            return terminal != null;
        }

        public async Task AddTerminal(TerminalSignDto signDto)
        {
            var terminal = new Terminal
            {
                ID = signDto.ID,
                MerchantID = signDto.MerchantID,
                MachineID = signDto.MachineID,
                DeviceNO = signDto.DeviceNO,
                LineNO = signDto.LineNO,
                CreateTime = DateTime.Now,
                IsDeleted = false,
                TerminalType = signDto.TerminalType,
                StatusUpdateTime = DateTime.Now
            };
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
            terminal.Status.LastActiveTime = DateTime.Now;
            terminal.Status.ActiveStatus = DeviceActiveStatus.Active;
            terminal.StatusUpdateTime = DateTime.Now;

            await _terminalManager.AddOrUpdateTerminal(terminal);
        }

        public static Dictionary<string, VersionOptions> ConvertClientVersionToFileVersion(Dictionary<string, string> clientVersions) {
            return clientVersions.Select(x => new KeyValuePair<string, VersionOptions>(x.Key, new VersionOptions
            {
                Current = x.Value,
                Expected = "",
                ExpectedFileCrc = "",
                IsExpired = true,
                PublishType = PublishTypeOption.None
            })).ToDictionary(x => x.Key, x => x.Value);
        }

        /// <summary>
        /// 对比终端变更信息
        /// </summary>
        /// <param name="signDto"></param>
        public async Task ProcessPropertyAndVersionUpdated(TerminalSignDto signDto)
        {
            var terminal = _terminalManager.GetTerminal(signDto.ID);

            if (terminal != null)
            {
                //TODO：检查属性是否变更，检查版本是否有变更，检查版本是否需要更新
                bool ischanged = _terminalManager.ProcessPropertyChange(terminal, signDto);
                ischanged = ischanged || await _terminalManager.ProcessFileVersionChange(terminal, signDto);
                if (ischanged)
                {
                    terminal.StatusUpdateTime = DateTime.Now;
                }
                if (terminal.Status != null)
                {
                    terminal.Status.ActiveStatus = DeviceActiveStatus.Active;
                    terminal.Status.LastActiveTime = DateTime.Now;
                    terminal.Status.EndPoint = signDto.EndPoint;
                    terminal.Status.ConnectionProtocol = signDto.ConnectionProtocol;
                    terminal.Status.LoginInTime = DateTime.Now;
                }
                await _terminalManager.SaveTerminal(terminal);
            }
        }

        public Dictionary<string,VersionOptions> QueryExpectedVersions(string terminalId)
        {
            var terminal = _terminalManager.GetTerminal(terminalId);
            if(terminal == null)
            {
                return [];
            }
            return _terminalManager.QueryExpectedVersions(terminalId);
        }


    }
}
