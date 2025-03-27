using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Internal;

namespace SlzrCrossGate.Core.Service.FileStorage
{
    public class FileService
    {
        private readonly IFileService _localFileService;
        private readonly IFileService _minioFileService;
        private readonly string _default_storageType;

        public FileService(IFileService localFileService, IFileService minioFileService,string defaultStorageType)
        {
            _localFileService = localFileService;
            _minioFileService = minioFileService;
            _default_storageType = defaultStorageType;
        }

        public async Task<string> UploadFileAsync(IFormFile file, string uploadedBy, string storageType = "")
        {
            if (storageType=="") storageType= _default_storageType;

            if (storageType == "Local")
            {
                return await _localFileService.UploadFileAsync(file, uploadedBy);
            }
            else if (storageType == "MinIO")
            {
                return await _minioFileService.UploadFileAsync(file, uploadedBy);
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

        public async Task<byte[]> GetFileContentAsync(string filePath)
        {
            if (filePath.StartsWith("minio://"))
            {
                // MinIO ´æ´¢
                var minioFilePath = filePath.Substring("minio://".Length);
                return await _minioFileService.GetFileContentAsync(minioFilePath);
            }
            else
            {
                // ±¾µØ´æ´¢
                return await _localFileService.GetFileContentAsync(filePath);
            }
        }
    }
}
