using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace SlzrCrossGate.Core.Service.FileStorage
{
    public class LocalFileStorage : IFileStorage
    {
        private readonly string _localFilePath;

        public LocalFileStorage(string localFilePath)
        {
            _localFilePath = localFilePath;
        }

        public async Task<string> UploadFileAsync(IFormFile file, string uploadedBy)
        {
            var filePath = Path.Combine(_localFilePath, file.FileName);
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }
            return filePath;
        }

        public async Task<byte[]> GetFileContentAsync(string filePath)
        {
            return await File.ReadAllBytesAsync(filePath);
        }
    }
}
