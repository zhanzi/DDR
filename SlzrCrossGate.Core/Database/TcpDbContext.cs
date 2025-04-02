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

            // ���� ID ��Ϊ�ۼ�����
            modelBuilder.Entity<ConsumeData>()
                .HasKey(c => c.Id)
                .IsClustered();

            // ���� ReceiveTime ��Ϊ�Ǿۼ�����
            modelBuilder.Entity<ConsumeData>()
                .HasIndex(c => c.ReceiveTime)
                .IncludeProperties(c => new { c.MerchantID,c.MachineID });


            // ����TerminalEvent������������e.MerchantID, e.TerminalID, e.EventType, e.EventTime��,����EventTime��������
            modelBuilder.Entity<TerminalEvent>()
                .HasIndex(e => new { e.MerchantID, e.TerminalID, e.EventType, e.EventTime })
                .IsDescending([false, false, false, true]);
            // ����TerminalEvent������������e.MerchantID, e.TerminalID, e.EventTime��,����EventTime��������
            modelBuilder.Entity<TerminalEvent>()
                .HasIndex(e => new { e.MerchantID, e.TerminalID, e.EventTime })
                .IsDescending([false, false, true]);

            modelBuilder.Entity<Terminal>(entity =>
            {
                // MySQL ����
                if (Database.IsMySql())
                {
                    entity.Property(e => e.FileVersions)
                        .HasColumnType("json");
                    entity.Property(e => e.Properties)
                        .HasColumnType("json");
                }
            });


            // ���� TerminalEvent ����������
            modelBuilder.Entity<TerminalEvent>()
                .HasIndex(e => new { e.MerchantID, e.TerminalID, e.EventType });

            // ����UnionPayTerminalKey������
            modelBuilder.Entity<UnionPayTerminalKey>()
                .HasIndex(e => new { e.MerchantID, e.MachineID });
            modelBuilder.Entity<UnionPayTerminalKey>()
                .HasIndex(e => new { e.MerchantID, e.IsInUse });

            //����IncrementContent����������
            modelBuilder.Entity<IncrementContent>()
                .HasKey(e => new { e.MerchantID, e.IncrementType, e.SerialNum })
                .IsClustered();

            // �����⻧����
            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                if (typeof(ITenantEntity).IsAssignableFrom(entityType.ClrType))
                {
                    modelBuilder.Entity(entityType.ClrType)
                        .HasQueryFilter(GetTenantFilter(entityType.ClrType));
                }
            }
        }

        // �⻧���������, ����ѯ��ǰ�⻧������,����Ա���Բ鿴��������
        private LambdaExpression GetTenantFilter(Type entityType)
        {
            var parameter = Expression.Parameter(entityType, "e");

            //����ǹ���Ա��������
            if (IsAdmin) return Expression.Lambda(Expression.Constant(true), parameter);

            var property = Expression.Property(parameter, "MerchantID");

            //�������⻧ID�����ݣ�������
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
