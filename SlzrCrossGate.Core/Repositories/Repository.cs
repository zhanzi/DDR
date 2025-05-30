// SlzrCrossGate.Core/Repositories/Repository.cs
using EFCore.BulkExtensions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;
using Minio.DataModel.Notification;
using SlzrCrossGate.Core.Database;
using SlzrCrossGate.Core.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;

namespace SlzrCrossGate.Core.Repositories
{
    public class Repository<T>(TcpDbContext context) : IRepository<T> where T : class
    {
        protected readonly TcpDbContext _context = context;

        public async Task<T?> GetByIdAsync(object id)
        {
            return await _context.Set<T>().FindAsync(id);
        }

        public async Task<IEnumerable<T>> GetAllAsync(bool asNoTracking = false)
        {
            if (asNoTracking)
            {
                return await _context.Set<T>().AsNoTracking().ToListAsync();
            }
            return await _context.Set<T>().ToListAsync();
        }

        public async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate, bool asNoTracking = false)
        {
            if (asNoTracking)
            {
                return await _context.Set<T>().AsNoTracking().Where(predicate).ToListAsync();
            }
            return await _context.Set<T>().Where(predicate).ToListAsync();
        }

        //��ѯ��һ������������ʵ��
        public async Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate, bool asNoTracking = false)
        {
            if (asNoTracking)
            {
                return await _context.Set<T>().AsNoTracking().FirstOrDefaultAsync(predicate);
            }
            return await _context.Set<T>().FirstOrDefaultAsync(predicate);
        }

        //��ѯ��һ������������ʵ�������
        public async Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate, Expression<Func<T, object>> order, bool isAsc, bool asNoTracking = false)
        {
            var query = _context.Set<T>().Where(predicate);
            if (asNoTracking)
            {
                query = query.AsNoTracking();
            }
            query = isAsc ? query.OrderBy(order) : query.OrderByDescending(order);
            return await query.FirstOrDefaultAsync();
        }

        //��ҳ��ѯ
        public async Task<IEnumerable<T>> FindPagedAsync(Expression<Func<T, bool>> predicate, int pageIndex, int pageSize, bool asNoTracking = false)
        {
            if (asNoTracking)
            {
                return await _context.Set<T>().AsNoTracking().Where(predicate).Skip((pageIndex - 1) * pageSize).Take(pageSize).ToListAsync();
            }
            return await _context.Set<T>().Where(predicate).Skip((pageIndex - 1) * pageSize).Take(pageSize).ToListAsync();
        }

        //��ҳ��ѯ������
        public async Task<IEnumerable<T>> FindPagedAsync(Expression<Func<T, bool>> predicate, Expression<Func<T, object>> order, bool isAsc, int pageIndex, int pageSize, bool asNoTracking = false)
        {
            var query = _context.Set<T>().Where(predicate);
            if (asNoTracking)
            {
                query = query.AsNoTracking();
            }
            query = isAsc ? query.OrderBy(order) : query.OrderByDescending(order);
            return await query.Skip((pageIndex - 1) * pageSize).Take(pageSize).ToListAsync();
        }


        public async Task<T?> SingleOrDefaultAsync(Expression<Func<T, bool>> predicate, bool asNoTracking = false)
        {
            if (asNoTracking)
            {
                return await _context.Set<T>().AsNoTracking().SingleOrDefaultAsync(predicate);
            }
            return await _context.Set<T>().SingleOrDefaultAsync(predicate);
        }

        public async Task AddAsync(T entity)
        {
            await _context.Set<T>().AddAsync(entity);
            await _context.SaveChangesAsync();
        }

        public async Task AddRangeAsync(IEnumerable<T> entities)
        {
            await _context.Set<T>().AddRangeAsync(entities);
            await _context.SaveChangesAsync();
        }


        public async Task UpdateAsync(T entity)
        {
            _context.Set<T>().Update(entity);
            await _context.SaveChangesAsync();
        }

        public async Task RemoveAsync(T entity)
        {
            _context.Set<T>().Remove(entity);
            await _context.SaveChangesAsync();
        }

        public async Task RemoveRangeAsync(IEnumerable<T> entities)
        {
            _context.Set<T>().RemoveRange(entities);
            await _context.SaveChangesAsync();
        }

        public async Task<int> CountAsync(Expression<Func<T?, bool>> predicate)
        {
            if (predicate == null)
                return await _context.Set<T>().CountAsync();
            else
                return await _context.Set<T>().CountAsync(predicate);
        }


        //��������
        public async Task BulkInsertAsync(IEnumerable<T> entities)
        {
            await _context.BulkInsertAsync(entities);
        }

        public async Task BulkUpdateAsync(IEnumerable<T> entities)
        {
            await _context.BulkUpdateAsync(entities);
        }

        public async Task BulkUpdateAsync(IEnumerable<T> entities, List<string> updateColumns)
        {
            if (entities == null || !entities.Any())
                return;

            if (updateColumns == null || !updateColumns.Any())
                return;

            try
            {
                await _context.BulkUpdateAsync(entities, options => {
                    options.PropertiesToInclude = updateColumns; // 只更新 updateColumns 字段
                    options.SetOutputIdentity = false; // 不需要返回标识
                    options.BatchSize = 1000; // 设置批次大小
                });
            }
            catch (Exception ex)
            when (ex.Message.Contains("Loading local data is disabled") ||
                                     ex.Message.Contains("AllowLoadLocalInfile") ||
                                     ex.Message.Contains("doesn't have a default value"))
            {
                // 如果 MySqlBulkLoader 不可用或字段缺少默认值，回退到常规的批量更新
                await BulkUpdateFallback(entities);
            }
        }

        private async Task BulkUpdateFallback(IEnumerable<T> entities)
        {
            // 回退到逐个更新的方式
            foreach (var entity in entities)
            {
                _context.Set<T>().Update(entity);
            }
            await _context.SaveChangesAsync();
        }

        /// <summary>
        /// 专门用于更新 TerminalStatus 的 FileVersions 字段
        /// </summary>
        public async Task BulkUpdateFileVersionsAsync(IEnumerable<TerminalStatus> terminalStatuses)
        {
            if (!terminalStatuses.Any()) return;

            var statusList = terminalStatuses.ToList();

            // 优先尝试使用 EF Core 原生的高性能批量更新
            try
            {
                await UpdateFileVersionsWithExecuteUpdate(statusList);
            }
            catch (Exception)
            {
                // 如果失败，回退到逐个更新
                await UpdateFileVersionsOneByOne(statusList);
            }
        }

        /// <summary>
        /// 使用 EF Core 原生的 ExecuteUpdateAsync 进行高性能批量更新
        /// </summary>
        private async Task UpdateFileVersionsWithExecuteUpdate(List<TerminalStatus> statusList)
        {
            // 使用事务来提高性能
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 将状态列表按 ID 分组，为每个 ID 执行批量更新
                var statusDict = statusList.ToDictionary(s => s.ID, s => s.FileVersions);

                foreach (var kvp in statusDict)
                {
                    var terminalId = kvp.Key;
                    var fileVersions = kvp.Value;

                    await _context.Set<TerminalStatus>()
                        .Where(ts => ts.ID == terminalId)
                        .ExecuteUpdateAsync(setters => setters
                            .SetProperty(ts => ts.FileVersions, fileVersions));
                }

                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        private async Task UpdateFileVersionsOneByOne(List<TerminalStatus> statusList)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                foreach (var status in statusList)
                {
                    await _context.Database.ExecuteSqlRawAsync(
                        "UPDATE TerminalStatuses SET FileVersions = @p0 WHERE ID = @p1",
                        status.FileVersions, status.ID);
                }
                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<int> BatchUpdateAsync(Expression<Func<T, bool>> filter, Expression<Func<SetPropertyCalls<T>, SetPropertyCalls<T>>> setters)
        {
            return await _context.BatchUpdateAsync<T>(filter, setters);
        }

        /// <summary>
        /// 使用 EF Core 原生 ExecuteUpdateAsync 的高性能批量更新
        /// 适用于简单的字段更新场景
        /// </summary>
        public async Task<int> ExecuteUpdateAsync(Expression<Func<T, bool>> filter, Expression<Func<SetPropertyCalls<T>, SetPropertyCalls<T>>> setters)
        {
            return await _context.Set<T>()
                .Where(filter)
                .ExecuteUpdateAsync(setters);
        }

        public async Task<int> BatchUpdateInTransactionAsync(Expression<Func<T, bool>> filter, Expression<Func<SetPropertyCalls<T>, SetPropertyCalls<T>>> setters)
        {
            return await _context.BatchUpdateInTransactionAsync<T>(filter, setters);
        }

        public async Task<int> BatchDeleteAsync(Expression<Func<T, bool>> filter,
            System.Data.IsolationLevel? isolationLevel = null,
            CancellationToken ct = default)
        {
            return await _context.Set<T>().Where(filter)
                    .ExecuteDeleteAsync();
        }

        public async Task<int> BatchDeleteInTransactionAsync(Expression<Func<T, bool>> filter,
            System.Data.IsolationLevel? isolationLevel = null,
            CancellationToken ct = default)
        {
            return await _context.BatchDeleteInTransactionAsync(filter, isolationLevel, ct);
        }

        public async Task BulkDeleteAsync(IEnumerable<T> entities)
        {
            await _context.BulkDeleteAsync<T>(entities);
        }

        public async Task BulkInsertOrUpdateAsync(IEnumerable<T> entities)
        {
            await _context.BulkInsertOrUpdateAsync<T>(entities);
        }

    }

    public static class EfCoreBatchUtils
    {
        // �������£�������ֵ��
        public static async Task<int> BatchUpdateAsync<TEntity>(
            this DbContext dbContext,
            Expression<Func<TEntity, bool>> filter,
            Expression<Func<SetPropertyCalls<TEntity>, SetPropertyCalls<TEntity>>> setters,
            int? commandTimeout = null,
            CancellationToken ct = default)
            where TEntity : class
        {
            var query = dbContext.Set<TEntity>().Where(filter);
            if (commandTimeout != null)
            {
                dbContext.Database.SetCommandTimeout(commandTimeout.Value);
            }
            return await query.ExecuteUpdateAsync(setters, ct);
        }

        public static async Task<int> BatchUpdateInTransactionAsync<TEntity>(
            this DbContext dbContext,
            Expression<Func<TEntity, bool>> filter,
            Expression<Func<SetPropertyCalls<TEntity>, SetPropertyCalls<TEntity>>> setters,
            System.Data.IsolationLevel isolationLevel = System.Data.IsolationLevel.ReadCommitted)
            where TEntity : class
                {
                    await using var transaction = await dbContext.Database
                        .BeginTransactionAsync(isolationLevel);

                    try
                    {
                        var affectedRows = await dbContext.Set<TEntity>()
                            .Where(filter)
                            .ExecuteUpdateAsync(setters);

                        await transaction.CommitAsync();
                        return affectedRows;
                    }
                    catch
                    {
                        await transaction.RollbackAsync();
                        throw;
                    }
                }

        // ����ɾ����������
        public static async Task<int> BatchDeleteInTransactionAsync<TEntity>(
            this DbContext dbContext,
            Expression<Func<TEntity, bool>> filter,
            System.Data.IsolationLevel? isolationLevel = null,
            CancellationToken ct = default)
            where TEntity : class
        {
            if (isolationLevel == null)
            {
                return await dbContext.Set<TEntity>()
                    .Where(filter)
                    .ExecuteDeleteAsync(ct);
            }

            await using var transaction = await dbContext.Database
                .BeginTransactionAsync(isolationLevel.Value, ct);

            try
            {
                var affectedRows = await dbContext.Set<TEntity>()
                    .Where(filter)
                    .ExecuteDeleteAsync(ct);

                await transaction.CommitAsync(ct);
                return affectedRows;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
    }


}
