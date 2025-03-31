using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SlzrCrossGate.Core.Models;
using SlzrCrossGate.Core.Repositories;
using SlzrCrossGate.Core.Services.BusinessServices;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SlzrCrossGate.Core.Service.BusinessServices
{
    public class TerminalEventService
    {

        private readonly Repository<TerminalEvent> _terminalEventRepository;
        private readonly ILogger<TerminalEventService> _logger;

        public TerminalEventService(
            Repository<TerminalEvent> terminalEventRepository,
            ILogger<TerminalEventService> logger)
        {
            _terminalEventRepository = terminalEventRepository;
            _logger = logger;
        }

        public async Task RecordTerminalEventAsync(string merchantId, string terminalId, TerminalEventType eventType,EventSeverity eventSeverity, string remark)
        {
            var terminalEvent = new TerminalEvent
            {
                MerchantID = merchantId,
                TerminalID = terminalId,
                EventName = eventType.ToString(),
                EventType = eventType,
                Severity = eventSeverity,
                Remark = remark
            };

            await _terminalEventRepository.AddAsync(terminalEvent);

            _logger.LogInformation("Recorded terminal event: {MerchantID} {TerminalID} {EventName} {Severity} {Remark}", merchantId, terminalId, eventType, eventSeverity, remark);
        }

    }


}
