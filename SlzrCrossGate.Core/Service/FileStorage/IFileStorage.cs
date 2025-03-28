using Microsoft.AspNetCore.Http;

namespace SlzrCrossGate.Core.Service.FileStorage
{
    public interface IFileStorage
    {
        Task<string> UploadFileAsync(IFormFile file,string uploadedBy);
        Task<byte[]> GetFileContentAsync(string filePath);
    }
}
