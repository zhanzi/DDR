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
    public class IncrementContentService
    {

        private readonly Repository<IncrementContent> _incrementContentRepository;
        private readonly ILogger<IncrementContentService> _logger;

        public IncrementContentService(
            Repository<IncrementContent> incrementContentRepository,
            ILogger<IncrementContentService> logger)
        {
            _incrementContentRepository = incrementContentRepository;
            _logger = logger;
        }


        /// <summary>
        /// 获取增量内容
        /// </summary>
        /// <param name="merchantid"></param>
        /// <param name="incrementType"></param>
        /// <param name="curSerialNum">终端已下载序号</param>
        /// <param name="count">请求数量</param>
        /// <returns></returns>
        public async Task<string> GetIncrementContentAsync(string merchantid, string incrementType, int curSerialNum, int count)
        {
            try
            {
                var lastEntity = await _incrementContentRepository.FirstOrDefaultAsync(p => p.MerchantID == merchantid && p.IncrementType == incrementType, p => p.SerialNum, false);
                if (lastEntity == null)
                {
                    return $"{incrementType}000000000000000000000000";
                }

                var lastSerialNum = lastEntity.SerialNum;

                if (curSerialNum >= lastSerialNum)
                {
                    return $"{incrementType}{lastSerialNum.ToString("X2").PadLeft(8, '0')}0000000000000000";
                }

                var contents = await _incrementContentRepository.FindPagedAsync(p => p.MerchantID == merchantid && p.IncrementType == incrementType && p.SerialNum > curSerialNum, p => p.SerialNum, true, 1, count);
                if (contents.Count() == 0)
                {
                    return $"{incrementType}{lastSerialNum.ToString("X2").PadLeft(8, '0')}0000000000000000";
                }

                var curMaxIncrementId = 0;
                StringBuilder sb = new StringBuilder();
                foreach (var item in contents)
                {
                    if (item.SerialNum > curMaxIncrementId)
                    {
                        curMaxIncrementId = item.SerialNum;
                    }
                    sb.Append(item.Content);
                }

                //平台版本(4B)+当前版本(4B)+当前大小(4B)+内容
                return $"{incrementType}{lastSerialNum.ToString("X2").PadLeft(8, '0')}{curMaxIncrementId.ToString("X2").PadLeft(8, '0')}{contents.Count().ToString("X2").PadLeft(8, '0')}{sb.ToString()}";
            }
            catch (Exception e)
            {
                _logger.LogError(e, "increment content error:MerchantID={MerchantID},IncrementType={IncrementType},CurID={CurID},Count={Count}", merchantid, incrementType, curSerialNum, count);
                return $"{incrementType}000000000000000000000000";
            }
        }
    }
}
