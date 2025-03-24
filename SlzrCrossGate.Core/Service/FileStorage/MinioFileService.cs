using Minio;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Minio.DataModel.Args;

namespace SlzrCrossGate.Core.Service.FileStorage
{
    public class MinioFileService : IFileService
    {
        private readonly IMinioClient _minioClient;
        private readonly string _bucketName;

        public MinioFileService(IMinioClient minioClient, string bucketName)
        {
            _minioClient = minioClient;
            _bucketName = bucketName;
        }

        //MINIO存储的文件路径前面加上 minio:// 
        public async Task<string> UploadFileAsync(IFormFile file, string uploadedBy)
        {
            // 使用当前月份创建子目录
            var datePath = DateTime.UtcNow.ToString("yyyyMM");
            var filePath = Path.Combine(datePath, file.FileName).Replace("\\", "/"); // 确保路径分隔符是 "/"

            using (var stream = file.OpenReadStream())
            {
                await _minioClient.PutObjectAsync(new PutObjectArgs()
                    .WithBucket(_bucketName)
                    .WithObject(filePath)
                    .WithStreamData(stream)
                    .WithObjectSize(file.Length)
                    .WithContentType(file.ContentType));
            }
            return "minio://" + filePath;
        }

        public async Task<byte[]> GetFileContentAsync(string filePath)
        {
            using (var memoryStream = new MemoryStream())
            {
                await _minioClient.GetObjectAsync(new GetObjectArgs()
                    .WithBucket(_bucketName)
                    .WithObject(filePath)
                    .WithCallbackStream(stream =>
                    {
                        stream.CopyTo(memoryStream);
                    }));
                return memoryStream.ToArray();
            }
        }
    }
}
