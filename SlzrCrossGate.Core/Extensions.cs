using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Minio;
using SlzrCrossGate.Core.Database;
using SlzrCrossGate.Core.Models;
using SlzrCrossGate.Core.Repositories;
using SlzrCrossGate.Core.Service;
using SlzrCrossGate.Core.Service.FileStorage;
using SlzrCrossGate.Core.Services;
using SlzrCrossGate.Core.Services.BusinessServices;


namespace SlzrCrossGate.Core
{
    public static class Extensions
    {
        public static TBuilder AddCoreService<TBuilder>(this TBuilder builder) where TBuilder : IHostApplicationBuilder
        {

            // 注册仓储
            builder.Services.AddScoped<MsgBoxRepository>();


            // 注册业务服务
            builder.Services.AddScoped<MsgBoxService>();


            //注册rabbitmqservice
            builder.Services.Configure<RabbitMQOptions>(builder.Configuration.GetSection("RabbitMQ"));
            builder.Services.AddSingleton<IRabbitMQService,RabbitMQService>();

            //配置文件上传服务
            builder.Services.AddFileService(options =>
            {
                var fileServiceConfig = builder.Configuration.GetSection("FileService");
                options.DefaultStorageType = fileServiceConfig["DefaultStorageType"] ?? throw new ArgumentNullException("FileService:DefaultStorageType");
                options.LocalFilePath = fileServiceConfig["LocalFilePath"] ?? throw new ArgumentNullException("FileService:LocalFilePath");
                options.MinioEndpoint = fileServiceConfig["MinIO:Endpoint"] ?? throw new ArgumentNullException("MinIO:Endpoint");
                options.MinioAccessKey = fileServiceConfig["MinIO:AccessKey"] ?? throw new ArgumentNullException("MinIO:AccessKey");
                options.MinioSecretKey = fileServiceConfig["MinIO:SecretKey"] ?? throw new ArgumentNullException("MinIO:SecretKey");
                options.MinioBucketName = fileServiceConfig["MinIO:BucketName"] ?? throw new ArgumentNullException("MinIO:BucketName");
            });
            //注册终端管理服务
            builder.Services.AddSingleton<TerminalManager>();

            // 配置数据库服务
            builder.Services.AddConfiguredDbContext(builder.Configuration);



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
