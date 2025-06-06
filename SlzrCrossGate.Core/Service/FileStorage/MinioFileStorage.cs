using Minio;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Minio.DataModel.Args;

namespace SlzrCrossGate.Core.Service.FileStorage
{
    public class MinioFileStorage : IFileStorage
    {
        private readonly IMinioClient _minioClient;
        private readonly string _bucketName;
        private bool _bucketInitialized = false;

        public MinioFileStorage(IMinioClient minioClient, string bucketName)
        {
            _minioClient = minioClient;
            _bucketName = bucketName;
        }

        private async Task EnsureBucketExistsAsync()
        {
            if (_bucketInitialized) return;

            try
            {
                var bucketExists = await _minioClient.BucketExistsAsync(new BucketExistsArgs().WithBucket(_bucketName));
                if (!bucketExists)
                {
                    await _minioClient.MakeBucketAsync(new MakeBucketArgs().WithBucket(_bucketName));
                }
                _bucketInitialized = true;
            }
            catch (Exception)
            {
                // 如果创建失败，下次还会重试
                _bucketInitialized = false;
                throw;
            }
        }

        //MINIO存储的文件路径前缀是 minio://
        public async Task<string> UploadFileAsync(IFormFile file, string uploadedBy)
        {
            await EnsureBucketExistsAsync();

            // 使用当前年份创建子目录
            var datePath = DateTime.UtcNow.ToString("yyyyMM");
            var filePath = Path.Combine(datePath, file.FileName+"_"+DateTime.Now.Ticks.ToString()).Replace("\\", "/"); // 确保路径分隔符是 "/"

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
