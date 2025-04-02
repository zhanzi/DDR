using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using SlzrCrossGate.Core.Models;
using System.Linq.Expressions;


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
        public DbSet<UploadFile> UploadFiles { get; set; }
        public DbSet<ConsumeData> ConsumeDatas { get; set; }
        public DbSet<UnionPayTerminalKey> UnionPayTerminalKeys { get; set; }
        public DbSet<IncrementContent> IncrementContents { get; set; }

        public DbSet<ApplicationUser> ApplicationUsers { get; set; }
        public DbSet<ApplicationRole> ApplicationRoles { get; set; }
        

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // 配置 ID 作为聚集索引
            modelBuilder.Entity<ConsumeData>()
                .HasKey(c => c.Id)
                .IsClustered();

            // 配置 ReceiveTime 作为非聚集索引
            modelBuilder.Entity<ConsumeData>()
                .HasIndex(c => c.ReceiveTime)
                .IncludeProperties(c => new { c.MerchantID,c.MachineID });


            // 配置TerminalEvent的联合索引（e.MerchantID, e.TerminalID, e.EventType, e.EventTime）,并按EventTime倒序排列
            modelBuilder.Entity<TerminalEvent>()
                .HasIndex(e => new { e.MerchantID, e.TerminalID, e.EventType, e.EventTime })
                .IsDescending([false, false, false, true]);
            // 配置TerminalEvent的联合索引（e.MerchantID, e.TerminalID, e.EventTime）,并按EventTime倒序排列
            modelBuilder.Entity<TerminalEvent>()
                .HasIndex(e => new { e.MerchantID, e.TerminalID, e.EventTime })
                .IsDescending([false, false, true]);

            modelBuilder.Entity<Terminal>(entity =>
            {
                // MySQL 配置
                if (Database.IsMySql())
                {
                    entity.Property(e => e.FileVersions)
                        .HasColumnType("json");
                    entity.Property(e => e.Properties)
                        .HasColumnType("json");
                }
            });


            // 配置 TerminalEvent 的联合索引
            modelBuilder.Entity<TerminalEvent>()
                .HasIndex(e => new { e.MerchantID, e.TerminalID, e.EventType });

            // 配置UnionPayTerminalKey的索引
            modelBuilder.Entity<UnionPayTerminalKey>()
                .HasIndex(e => new { e.MerchantID, e.MachineID });
            modelBuilder.Entity<UnionPayTerminalKey>()
                .HasIndex(e => new { e.MerchantID, e.IsInUse });

            //配置IncrementContent的联合主键
            modelBuilder.Entity<IncrementContent>()
                .HasKey(e => new { e.MerchantID, e.IncrementType, e.SerialNum })
                .IsClustered();

            // 配置租户隔离
            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                if (typeof(ITenantEntity).IsAssignableFrom(entityType.ClrType))
                {
                    modelBuilder.Entity(entityType.ClrType)
                        .HasQueryFilter(GetTenantFilter(entityType.ClrType));
                }
            }
        }

        // 租户隔离过滤器, 仅查询当前租户的数据,管理员可以查看所有数据
        private LambdaExpression GetTenantFilter(Type entityType)
        {
            var parameter = Expression.Parameter(entityType, "e");

            //如果是管理员，不过滤
            if (IsAdmin) return Expression.Lambda(Expression.Constant(true), parameter);

            var property = Expression.Property(parameter, "MerchantID");

            //不存在租户ID的数据，不过滤
            if (property == null) return Expression.Lambda(Expression.Constant(true), parameter);

            var currentTenantId = Expression.Constant(CurrentTenantId);
            var condition = Expression.Equal(property, currentTenantId);
            return Expression.Lambda(condition, parameter);

        }
        public string CurrentTenantId { get; set; }
        public ApplicationUser CurrentUser { get; set; }

        public bool IsAdmin { get; set; } = false;
    }
}
