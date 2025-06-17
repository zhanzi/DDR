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
            builder.Services.AddScoped(typeof(Repository<>));
            builder.Services.AddScoped<MsgBoxRepository>();
            builder.Services.AddScoped<Repository<UploadFile>>();
            builder.Services.AddScoped<Repository<FileVer>>();
            builder.Services.AddScoped<Repository<TerminalEvent>>();
            builder.Services.AddScoped<UnionPayTerminalKeyRepository>();
            builder.Services.AddScoped<ConsumeDataService>();

            //注册rabbitmqservice
            builder.Services.Configure<RabbitMQOptions>(builder.Configuration.GetSection("RabbitMQ"));
            builder.Services.AddSingleton<IRabbitMQService, RabbitMQService>();

            // 注册业务服务 - 确保生命周期匹配
            builder.Services.AddScoped<MsgBoxService>();
            builder.Services.AddScoped<PublishFileService>();
            builder.Services.AddScoped<IncrementContentService>();
            builder.Services.AddScoped<TerminalSignService>();
            builder.Services.AddScoped<UnionPayTerminalKeyService>();
            builder.Services.AddScoped<FilePublishEventService>();
            builder.Services.AddScoped<FilePublishCachedService>();


            builder.Services.AddSingleton<TerminalManager>();
            builder.Services.AddSingleton<TerminalEventService>();
            builder.Services.AddSingleton<MsgboxEventService>();






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

            // 配置数据库服务
            builder.Services.AddConfiguredDbContext(builder.Configuration);

            // 注册数据库迁移服务
            builder.Services.AddScoped<DatabaseMigrationService>();
            builder.Services.AddScoped<IndexRecoveryService>();

            return builder;
        }

        public static TBuilder AddCoreWebAdminService<TBuilder>(this TBuilder builder) where TBuilder : IHostApplicationBuilder
        {
            builder.Services.AddMemoryCache();

            // 注册仓储
            builder.Services.AddScoped(typeof(Repository<>));
            builder.Services.AddScoped<MsgBoxRepository>();
            builder.Services.AddScoped<Repository<UploadFile>>();
            builder.Services.AddScoped<Repository<FileVer>>();
            builder.Services.AddScoped<Repository<TerminalEvent>>();
            builder.Services.AddScoped<UnionPayTerminalKeyRepository>();
            builder.Services.AddScoped<ConsumeDataService>();

            //注册rabbitmqservice
            builder.Services.Configure<RabbitMQOptions>(builder.Configuration.GetSection("RabbitMQ"));
            builder.Services.AddSingleton<IRabbitMQService, RabbitMQService>();

            // 注册业务服务 - 确保生命周期匹配
            builder.Services.AddScoped<MsgBoxService>();
            builder.Services.AddScoped<PublishFileService>();
            //builder.Services.AddScoped<IncrementContentService>();
            //builder.Services.AddScoped<TerminalSignService>();
            //builder.Services.AddScoped<UnionPayTerminalKeyService>();
            builder.Services.AddScoped<FilePublishEventService>();
            //builder.Services.AddScoped<FilePublishCachedService>();


            //builder.Services.AddSingleton<TerminalManager>();
            builder.Services.AddSingleton<TerminalEventPublishService>();
            builder.Services.AddSingleton<MsgboxEventService>();



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

            // 配置数据库服务
            builder.Services.AddConfiguredDbContext(builder.Configuration);

            // 注册数据库迁移服务
            builder.Services.AddScoped<DatabaseMigrationService>();

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
        public string DefaultStorageType { get; set; } = string.Empty;
        public string LocalFilePath { get; set; } = string.Empty;
        public string MinioEndpoint { get; set; } = string.Empty;
        public string MinioAccessKey { get; set; } = string.Empty;
        public string MinioSecretKey { get; set; } = string.Empty;
        public string MinioBucketName { get; set; } = string.Empty;
    }
}
