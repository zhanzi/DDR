using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Internal;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using SlzrCrossGate.Core.Services.BusinessServices;

namespace SlzrCrossGate.Core.Service.FileStorage
{
    public class FileService
    {
        private readonly ILogger<FileService> _logger;
        private readonly IFileStorage _localFileStorage;
        private readonly IFileStorage _minioFileStorage;
        private readonly string _default_storageType;
        private readonly IMemoryCache _cache;

        public FileService(ILogger<FileService> logger,IFileStorage localFileStorage, IFileStorage minioFileStorage,string defaultStorageType, IMemoryCache cache)
        {
            _logger = logger;
            _localFileStorage = localFileStorage;
            _minioFileStorage = minioFileStorage;
            _default_storageType = defaultStorageType;
            _cache = cache;
        }

        public async Task<string> UploadFileAsync(IFormFile file, string uploadedBy, string storageType = "")
        {
            if (storageType=="") storageType= _default_storageType;

            if (storageType == "Local")
            {
                return await _localFileStorage.UploadFileAsync(file, uploadedBy);
            }
            else if (storageType == "MinIO")
            {
                return await _minioFileStorage.UploadFileAsync(file, uploadedBy);
            }
            else
            {
                throw new ArgumentException("Invalid storage type");
            }
        }

        public async Task<string> UploadFileAsync(string localFilePath, string uploadedBy, string storageType = "")
        {
            if (storageType == "") storageType = _default_storageType;

            if (string.IsNullOrEmpty(localFilePath) || !File.Exists(localFilePath))
            {
                throw new ArgumentException("Invalid local file path");
            }

            using (var stream = new FileStream(localFilePath, FileMode.Open, FileAccess.Read))
            {
                var fileName = Path.GetFileName(localFilePath);
                var formFile = new FormFile(stream, 0, stream.Length, null, fileName)
                {
                    Headers = new HeaderDictionary(),
                    ContentType = "application/octet-stream"
                };

                return await UploadFileAsync(formFile, uploadedBy, storageType);
            }
        }

        public async Task<byte[]?> GetFileContentAsync(string filePath)
        {
            try
            {
                if (filePath.StartsWith("minio://"))
                {
                    // MinIO ¥Ê¥¢
                    var minioFilePath = filePath.Substring("minio://".Length);
                    return await _minioFileStorage.GetFileContentAsync(minioFilePath);
                }
                else
                {
                    // ±æµÿ¥Ê¥¢
                    return await _localFileStorage.GetFileContentAsync(filePath);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while getting file content for file path: {FilePath}", filePath);
                return null;
            }

        }


        public async Task<byte[]?> GetFileSegmentAsync(string filePath, int offset, int length)
        {
            string cacheKey = $"{filePath}_{offset}_{length}";
            if (_cache.TryGetValue(cacheKey, out byte[]? cachedSegment))
            {
                return cachedSegment;
            }

            var fileData = await GetFileContentAsync(filePath);
            if (fileData == null || offset >= fileData.Length)
            {
                return null;
            }

            if (offset + length > fileData.Length)
            {
                length = fileData.Length - offset;
            }

            byte[] fileSegment = new byte[length];
            Array.Copy(fileData, offset, fileSegment, 0, length);

            _cache.Set(cacheKey, fileSegment, TimeSpan.FromMinutes(10)); // ª∫¥Ê10∑÷÷”

            return fileSegment;
        }
    }
}
