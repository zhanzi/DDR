using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Minio;
using SlzrCrossGate.Core.Database;
using SlzrCrossGate.Core.Service;
using SlzrCrossGate.Core.Service.FileStorage;
using SlzrCrossGate.Core.Services;


namespace SlzrCrossGate.Core
{
    public static class Extensions
    {
        public static TBuilder AddCoreService<TBuilder>(this TBuilder builder) where TBuilder : IHostApplicationBuilder
        {
            builder.Services.AddSingleton<TerminalManager>();
            return builder;
        }

        /// <summary>
        /// 配置数据库服务
        /// </summary>
        /// <param name="services"></param>
        /// <param name="configuration"></param>
        /// <returns></returns>
        /// <exception cref="Exception"></exception>
        public static IServiceCollection AddConfiguredDbContext(this IServiceCollection services, IConfiguration configuration)
        {
            var databaseProvider = configuration.GetValue<string>("DatabaseProvider");
            var connectionString = configuration.GetConnectionString("DefaultConnection");

            switch (databaseProvider)
            {
                case "SqlServer":
                    services.AddDbContext<TcpDbContext>(options =>
                        options.UseSqlServer(connectionString));
                    break;
                case "MySql":
                    services.AddDbContext<TcpDbContext>(options =>
                        options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));
                    break;
                default:
                    throw new Exception("Unsupported database provider: " + databaseProvider);
            }

            return services;
        }

        /// <summary>
        /// 添加上传文件服务
        /// </summary>
        /// <param name="services"></param>
        /// <returns></returns>
        public static IServiceCollection AddFileService(this IServiceCollection services, Action<FileServiceOptions> configureOptions)
        {
            var options = new FileServiceOptions();
            configureOptions(options);

            IFileService localFileService = new LocalFileService(options.LocalFilePath); ;


            var minioClient = new MinioClient()
                    .WithEndpoint(options.MinioEndpoint)
                    .WithCredentials(options.MinioAccessKey, options.MinioSecretKey)
                    .Build();
            IFileService minioFileService = new MinioFileService(minioClient, options.MinioBucketName);


            services.AddSingleton<FileService>(new FileService(localFileService, minioFileService, options.DefaultStorageType));

            return services;
        }
    }

    public class FileServiceOptions
    {
        public string DefaultStorageType { get; set; }
        public string LocalFilePath { get; set; }
        public string MinioEndpoint { get; set; }
        public string MinioAccessKey { get; set; }
        public string MinioSecretKey { get; set; }
        public string MinioBucketName { get; set; }
    }
}
