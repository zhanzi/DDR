using Microsoft.Extensions.Logging;
using SlzrCrossGate.Core.Models;
using SlzrCrossGate.Core.Repositories;
using SlzrDatatransferModel;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SlzrCrossGate.Core.Service.BusinessServices
{
    public class ConsumeDataService
    {
        private readonly Repository<Models.ConsumeData> _consumeDataRepositry;
        private readonly ILogger<ConsumeDataService> _logger;
    
        public ConsumeDataService(Repository<Models.ConsumeData> consumeDataRepositry, ILogger<ConsumeDataService> logger)
        {
            _consumeDataRepositry = consumeDataRepositry;
            _logger = logger;
        }

        public async Task BatchInsert(IEnumerable<Models.ConsumeData> consumeDatas)
        {
            await _consumeDataRepositry.AddRangeAsync(consumeDatas);
        }
    }
}
