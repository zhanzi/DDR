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
    public class PublishFileSerice
    {
        private readonly ILogger<PublishFileSerice> _logger;
        private readonly Repository<UploadFile> _uploadfileRepository;
        private readonly Repository<FileVer> _fileverRepository;

        public PublishFileSerice(
            Repository<UploadFile> uploadfileRepository,
            Repository<FileVer> fileverRepository,
            ILogger<PublishFileSerice> logger)
        {
            _uploadfileRepository = uploadfileRepository;
            _fileverRepository = fileverRepository;
            _logger = logger;
        }

        public async Task<UploadFile?> GetFileInfoAsync(string merchantId, string fileCode, string fileVersion)
        {
            try
            {
                var fileVer = await _fileverRepository.SingleOrDefaultAsync(m => m.MerchantID == merchantId && m.FileFullType == fileCode && m.Ver == fileVersion);
                if (fileVer == null) return null;

                return await _uploadfileRepository.GetByIdAsync(fileVer.UploadFileID);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while retrieving file information for MerchantID: {MerchantID}, FileCode: {FileCode}, FileVersion: {FileVersion}", merchantId, fileCode, fileVersion);
                throw new Exception("An error occurred while retrieving file information.", ex);
            }
        }
    }
}
