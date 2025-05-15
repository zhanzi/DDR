using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using SlzrCrossGate.Core.Models;
using System.Linq.Expressions;
using Microsoft.AspNetCore.Identity;
using Minio.DataModel;


namespace SlzrCrossGate.Core.Database
{
    public class TcpDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, string>
    {
        public TcpDbContext(DbContextOptions<TcpDbContext> options) : base(options)
        {

        }

        public DbSet<Merchant> Merchants { get; set; }
        public DbSet<FilePublish> FilePublishs { get; set; }
        public DbSet<FilePublishHistory> FilePublishHistories { get; set; }
        public DbSet<FileVer> FileVers { get; set; }
        public DbSet<FileType> FileTypes { get; set; }
        public DbSet<MsgType> MsgTypes { get; set; }
        public DbSet<MsgContent> MsgContents { get; set; }
        public DbSet<MsgBox> MsgBoxes { get; set; }
        public DbSet<Terminal> Terminals { get; set; }
        public DbSet<TerminalEvent> TerminalEvents { get; set; }
        public DbSet<TerminalStatus> TerminalStatuses { get; set; }
        public DbSet<UploadFile> UploadFiles { get; set; }
        public DbSet<ConsumeData> ConsumeDatas { get; set; }
        public DbSet<UnionPayTerminalKey> UnionPayTerminalKeys { get; set; }        
        public DbSet<IncrementContent> IncrementContents { get; set; }        public DbSet<MerchantDictionary> MerchantDictionaries { get; set; }
        public DbSet<LinePriceInfo> LinePriceInfos { get; set; }
        public DbSet<LinePriceInfoVersion> LinePriceInfoVersions { get; set; }

        public DbSet<ApplicationUser> ApplicationUsers { get; set; }
        public DbSet<ApplicationRole> ApplicationRoles { get; set; }
        public DbSet<SystemSettings> SystemSettings { get; set; }


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);


            modelBuilder.Entity<ConsumeData>(builder=>
            {
                builder.HasKey(e => new { e.Id }).IsClustered();
                builder.HasIndex(c => c.ReceiveTime)
                    .IncludeProperties(c => new { c.MerchantID,c.MachineID,c.MachineNO });
                
            });
            
            modelBuilder.Entity<FilePublish>(builder=>
            {
                builder.HasKey(e => new { e.ID }).IsClustered();
                builder.HasIndex(e => new { e.MerchantID, e.FileTypeID, e.FilePara, e.Ver }).IsUnique();
                builder.HasIndex(e => new { e.MerchantID, e.FileFullType, e.Ver }).IsUnique();
                builder.HasIndex(e => new { e.MerchantID, e.FileTypeID, e.PublishTime });
            });

            modelBuilder.Entity<FilePublishHistory>(builder=>
            {
                builder.HasKey(e => new { e.ID }).IsClustered();
                //给FilePublishHistory的OperationType字段添加check约束，限制值只能为"Publish"或"Revoke"
                builder.ToTable(t => t.HasCheckConstraint("CK_FilePublishHistory_OperationType", "OperationType IN ('Publish', 'Revoke')"));
                builder.HasIndex(e => new { e.MerchantID, e.FileTypeID, e.FilePara, e.Ver }).IsUnique();
                builder.HasIndex(e => new { e.PublishTime })
                    .IsDescending([true])
                    .IncludeProperties(e => new { e.MerchantID, e.FileTypeID, e.Ver, e.FilePara, e.FileFullType, e.PublishTarget, e.OperationType });
            });

            modelBuilder.Entity<FileVer>(builder=>
            {
                builder.HasKey(e => new { e.ID }).IsClustered();
                builder.HasIndex(e => new { e.MerchantID, e.FileFullType, e.Ver }).IsUnique();
                builder.HasIndex(e => new { e.MerchantID, e.FileTypeID, e.FilePara, e.Ver }).IsUnique();
            });
            

            modelBuilder.Entity<FileType>(builder=>{
                builder.HasKey(e => new { e.ID, e.MerchantID }).IsClustered();
            });
            

            modelBuilder.Entity<IncrementContent>(builder=>
            {
                builder.HasKey(e => new { e.MerchantID, e.IncrementType, e.SerialNum })
                    .IsClustered();
            });  

            modelBuilder.Entity<MsgType>(builder=>{
                builder.HasKey(e => new { e.ID, e.MerchantID }).IsClustered();
            });
            
            modelBuilder.Entity<Merchant>(builder=>{
                builder.HasKey(e=>e.MerchantID).IsClustered();
            });

            modelBuilder.Entity<MsgContent>(builder=>{
                builder.HasKey(e=>e.ID).IsClustered();
            });
            
            modelBuilder.Entity<MsgBox>(builder=>
            {
                builder.HasKey(e => new { e.ID }).IsClustered();
                builder.HasIndex(e => new { e.MerchantID, e.Status, e.TerminalID, e.SendTime })
                    .IsDescending([false, false, false, false]);
            });


            modelBuilder.Entity<Terminal>(builder=>
            {
                builder.HasKey(e => new { e.ID }).IsClustered();
                builder.HasIndex(e => new { e.MerchantID, e.MachineID });
                builder.HasIndex(e => new { e.MerchantID, e.DeviceNO });
            });

            modelBuilder.Entity<TerminalEvent>(builder=>{
                builder.HasKey(e => e.ID).IsClustered();
                builder.HasIndex(e => new { e.MerchantID, e.TerminalID, e.EventType, e.EventTime })
                    .IsDescending([false, false, false, true]);
                builder.HasIndex(e => new { e.MerchantID, e.TerminalID, e.EventTime })
                    .IsDescending([false, false, true]);
                builder.HasIndex(e => new { e.EventTime  })
                    .IsDescending([true]);
            });
            
            modelBuilder.Entity<TerminalStatus>(builder =>
            {
                builder.HasKey(e => new { e.ID }).IsClustered();
                // MySQL 配置 json字段配置
                if (Database.IsMySql())
                {
                    builder.Property(e => e.FileVersions)
                        .HasColumnType("json");
                    builder.Property(e => e.Properties)
                        .HasColumnType("json");
                }
            });

            modelBuilder.Entity<UploadFile>(builder=>
            {
                builder.HasKey(e => new { e.ID }).IsClustered();
            });

            modelBuilder.Entity<UnionPayTerminalKey>(builder=>
            {
                builder.HasKey(e => new { e.ID }).IsClustered();
                builder.HasIndex(e => new { e.MerchantID, e.MachineID });
                builder.HasIndex(e => new { e.MerchantID, e.IsInUse });
            });            modelBuilder.Entity<SystemSettings>(builder=>
            {
                builder.HasKey(e => new { e.Id }).IsClustered();
            });
              modelBuilder.Entity<MerchantDictionary>(builder=>
            {
                builder.HasKey(e => new { e.ID }).IsClustered();
                // 复合唯一索引：(MerchantID, DictionaryType, DictionaryCode)
                builder.HasIndex(e => new { e.MerchantID, e.DictionaryType, e.DictionaryCode }).IsUnique();
                // 辅助索引：按商户和字典类型查询
                builder.HasIndex(e => new { e.MerchantID, e.DictionaryType });
                // 外键关系
                builder.HasOne(e => e.Merchant)
                      .WithMany()
                      .HasForeignKey(e => e.MerchantID)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<LinePriceInfo>(builder =>
            {
                builder.HasKey(e => new { e.ID }).IsClustered();
                // 复合唯一索引：(MerchantID, LineNumber, GroupNumber)
                builder.HasIndex(e => new { e.MerchantID, e.LineNumber, e.GroupNumber }).IsUnique();
                // 外键关系
                builder.HasOne(e => e.Merchant)
                      .WithMany()
                      .HasForeignKey(e => e.MerchantID)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<LinePriceInfoVersion>(builder =>
            {
                builder.HasKey(e => new { e.ID }).IsClustered();
                // 索引：按商户和线路信息ID查询
                builder.HasIndex(e => new { e.MerchantID, e.LinePriceInfoID });
                // 索引：按商户、线路号和组号查询
                builder.HasIndex(e => new { e.MerchantID, e.LineNumber, e.GroupNumber });
                // 索引：按版本状态查询
                builder.HasIndex(e => new { e.MerchantID, e.Status });
                // 外键关系
                builder.HasOne(e => e.Merchant)
                      .WithMany()
                      .HasForeignKey(e => e.MerchantID)
                      .OnDelete(DeleteBehavior.Cascade);
                builder.HasOne(e => e.LinePriceInfo)
                      .WithMany()
                      .HasForeignKey(e => e.LinePriceInfoID)
                      .OnDelete(DeleteBehavior.Cascade);
                
                // MySQL 配置 json字段配置
                if (Database.IsMySql())
                {
                    builder.Property(e => e.ExtraParamsJson)
                        .HasColumnType("json");
                    builder.Property(e => e.CardDiscountInfoJson)
                        .HasColumnType("json");
                    builder.Property(e => e.FileContentJson)
                        .HasColumnType("json");
                }
            });

            //// 配置租户隔离
            //foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            //{
            //    if (typeof(ITenantEntity).IsAssignableFrom(entityType.ClrType))
            //    {
            //        modelBuilder.Entity(entityType.ClrType)
            //            .HasQueryFilter(GetTenantFilter(entityType.ClrType));
            //    }
            //}
        }

        //// 租户隔离过滤器, 仅查询当前租户的数据,管理员可以查看所有数据
        //private LambdaExpression GetTenantFilter(Type entityType)
        //{
        //    var parameter = Expression.Parameter(entityType, "e");

        //    //如果是管理员，不过滤
        //    if (IsAdmin) return Expression.Lambda(Expression.Constant(true), parameter);

        //    var property = Expression.Property(parameter, "MerchantID");

        //    //不存在租户ID的数据，不过滤
        //    if (property == null) return Expression.Lambda(Expression.Constant(true), parameter);

        //    var currentTenantId = Expression.Constant(CurrentTenantId);
        //    var condition = Expression.Equal(property, currentTenantId);
        //    return Expression.Lambda(condition, parameter);

        //}
        //public string CurrentTenantId { get; set; }
        //public ApplicationUser CurrentUser { get; set; }

        //public bool IsAdmin { get; set; } = false;
    }
}
