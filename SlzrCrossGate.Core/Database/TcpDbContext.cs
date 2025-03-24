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


        //public DbSet<ApplicationUser> ApplicationUsers { get; set; }

        //public DbSet<ApplicationRole> ApplicationRoles { get; set; }

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
                .IncludeProperties(c => new { c.MerchantID });




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
