using Microsoft.Extensions.Logging;
using SlzrCrossGate.Core.Models;
using SlzrCrossGate.Core.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SlzrCrossGate.Core.Service.BusinessServices
{
    public class FilePublishCachedService : IDisposable
    {
        private readonly ILogger<FilePublishCachedService> _logger;
        private readonly Repository<FilePublish> _filePublishRepository;
        //一个临时的内存缓存
        private readonly Dictionary<string, FilePublish> _filePublishCache = new();
        //已被临时缓存的商户编号
        private readonly HashSet<string> _cachedMerchantIds = new();

        public FilePublishCachedService(
            Repository<FilePublish> filePublishRepository,
            ILogger<FilePublishCachedService> logger)
        {
            _filePublishRepository = filePublishRepository ?? throw new ArgumentNullException(nameof(filePublishRepository));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public bool TryGetValue(string key, out FilePublish filePublish)
        {
            return _filePublishCache.TryGetValue(key, out filePublish);
        }

        public async Task LoadMerchantPublish(string merchantid)
        {
            if (_cachedMerchantIds.Contains(merchantid))
            {
                return;
            }
            var publishs = await _filePublishRepository.FindAsync(p => p.MerchantID == merchantid);
            foreach (var publish in publishs)
            {
                _filePublishCache.TryAdd(GetKey(publish.MerchantID, publish.FileFullType, publish.PublishType, publish.PublishTarget)
                    , publish);
            }
        }

        public string GetKey(string merchantId, string fileCode, PublishTypeOption publishType, string target)
        {
            return $"{merchantId}-{fileCode}-{publishType}-{target}";
        }

        public void Dispose()
        {
            _filePublishCache.Clear();
            _cachedMerchantIds.Clear();
        }
    }
}
