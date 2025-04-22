using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Minio;
using SlzrCrossGate.Core.Database;
using SlzrCrossGate.Core.Models;
using SlzrCrossGate.Core.Repositories;
using SlzrCrossGate.Core.Service;
using SlzrCrossGate.Core.Service.BusinessServices;
using SlzrCrossGate.Core.Service.FileStorage;
using SlzrCrossGate.Core.Services;
using SlzrCrossGate.Core.Services.BusinessServices;
using System.Threading.Tasks;


namespace SlzrCrossGate.Core
{
    public static class Extensions
    {
        public static TBuilder AddCoreService<TBuilder>(this TBuilder builder) where TBuilder : IHostApplicationBuilder
        {
            builder.Services.AddMemoryCache();

            // 注册仓储
            builder.Services.AddScoped<MsgBoxRepository>();
            builder.Services.AddScoped<Repository<UploadFile>>(); 
            builder.Services.AddScoped<Repository<FileVer>>();
            builder.Services.AddScoped<Repository<TerminalEvent>>();


            // 注册业务服务
            builder.Services.AddScoped<MsgBoxService>();
            builder.Services.AddScoped<PublishFileSerice>();

            builder.Services.AddSingleton<TerminalEventService>();
            builder.Services.AddSingleton<FilePublishEventService>();

            builder.Services.AddSingleton<TerminalEventService>();
            builder.Services.AddSingleton<FilePublishEventService>();
            builder.Services.AddSingleton<MsgboxEventService>();

            //注册rabbitmqservice
            builder.Services.Configure<RabbitMQOptions>(builder.Configuration.GetSection("RabbitMQ"));
            builder.Services.AddSingleton<IRabbitMQService,RabbitMQService>();



            //配置文件上传服务
            _ = builder.Services.AddFileService(options =>
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
        public static async Task<IServiceCollection> AddFileService(this IServiceCollection services, Action<FileServiceOptions> configureOptions)
        {
            var options = new FileServiceOptions();
            configureOptions(options);

            IFileStorage localFileService = new LocalFileStorage(options.LocalFilePath); ;

            var minioClient = new MinioClient()
                    .WithEndpoint(options.MinioEndpoint)
                    .WithCredentials(options.MinioAccessKey, options.MinioSecretKey)
                    .Build();
            IFileStorage minioFileService = new MinioFileStorage(minioClient, options.MinioBucketName);


            services.AddSingleton<FileService>(provider => new FileService(provider.GetRequiredService<ILogger<FileService>>(), localFileService, minioFileService, options.DefaultStorageType, provider.GetRequiredService<IMemoryCache>()));

            return services;
        }
    }

    public record FileServiceOptions
    {
        public string DefaultStorageType { get; set; }
        public string LocalFilePath { get; set; }
        public string MinioEndpoint { get; set; }
        public string MinioAccessKey { get; set; }
        public string MinioSecretKey { get; set; }
        public string MinioBucketName { get; set; }
    }
}
