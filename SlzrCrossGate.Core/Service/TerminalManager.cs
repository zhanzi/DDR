using SlzrCrossGate.Core.Database;
using SlzrCrossGate.Core.Models;
using System.Collections.Concurrent;
using System.Collections.Generic;

namespace SlzrCrossGate.Core.Service
{
    public class TerminalManager
    {
        private readonly ConcurrentDictionary<string, Terminal> _terminals = new();

        public bool AddOrUpdateTerminal(Terminal terminal)
        {
            terminal.LastActiveTime = DateTime.Now;
            terminal.ActiveStatus = DeviceActiveStatus.Active;
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
                terminal.ActiveStatus = DeviceActiveStatus.Active;
                terminal.LastActiveTime = DateTime.Now;
                return true;
            }
            return false;
        }

        //设置设备为非活跃状态
        public bool SetTerminalInactive(string terminalId)
        {
            if (_terminals.TryGetValue(terminalId, out var terminal))
            {
                terminal.ActiveStatus = DeviceActiveStatus.Inactive;
                return true;
            }
            return false;
        }

        public bool RemoveTerminal(string terminalId)
        {
            if (_terminals.TryGetValue(terminalId, out var terminal))
            {
                terminal.ActiveStatus = DeviceActiveStatus.Inactive;
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

        // 从数据库加载终端信息
        public void LoadTerminalsFromDatabase(TcpDbContext dbContext)
        {
            var terminals = dbContext.Terminals.ToList();

            foreach (var terminal in terminals)
            {
                _terminals.TryAdd(terminal.ID, terminal);
            }
        }
    }
}
