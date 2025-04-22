using Microsoft.Extensions.Logging;
using SlzrCrossGate.Core.Models;
using SlzrCrossGate.Core.Repositories;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SlzrCrossGate.Core.Service.BusinessServices
{
    public class UnionPayTerminalKeyService
    {
        private readonly UnionPayTerminalKeyRepository _unionPayTerminalKeyRepository;
        private readonly ILogger<UnionPayTerminalKeyService> _logger;
        private readonly TerminalEventService _terminalEventService;

        public UnionPayTerminalKeyService(
            UnionPayTerminalKeyRepository unionPayTerminalKeyRepository,
            ILogger<UnionPayTerminalKeyService> logger,
            TerminalEventService terminalEventService)
        {
            _unionPayTerminalKeyRepository = unionPayTerminalKeyRepository;
            _logger = logger;
            _terminalEventService = terminalEventService;
        }

        public async Task<UnionPayTerminalKey?> BindUnionPayTerminalKey(string merchantid, string terminalId, string machineid, string lineid, string busno)
        {
            var result = await _unionPayTerminalKeyRepository.BindUnionPayKeyAsync(merchantid, machineid, lineid, busno);
            if (result.Item1 && result.Item2 != null)
            {
                //第一次绑定
                await _terminalEventService.RecordTerminalEventAsync(new TerminalEvent
                {
                    MerchantID = merchantid,
                    TerminalID = terminalId,
                    EventType = TerminalEventType.UnionPayKeyBound,
                    Severity = EventSeverity.Info,
                    Remark = $"bind unionpay key:UnionpayMerchantID={result.Item2.UP_MerchantID},UnionpayTerminalID={result.Item2.UP_TerminalID}",
                    Operator = ""
                });
            }
            return result.Item2;
        }
    }
}
