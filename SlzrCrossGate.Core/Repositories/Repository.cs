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

        //查询第一个符合条件的实体
        public async Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate, bool asNoTracking = false)
        {
            if (asNoTracking)
            {
                return await _context.Set<T>().AsNoTracking().FirstOrDefaultAsync(predicate);
            }
            return await _context.Set<T>().FirstOrDefaultAsync(predicate);
        }

        //查询第一个符合条件的实体带排序
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

        //分页查询
        public async Task<IEnumerable<T>> FindPagedAsync(Expression<Func<T, bool>> predicate, int pageIndex, int pageSize, bool asNoTracking = false)
        {
            if (asNoTracking)
            {
                return await _context.Set<T>().AsNoTracking().Where(predicate).Skip((pageIndex - 1) * pageSize).Take(pageSize).ToListAsync();
            }
            return await _context.Set<T>().Where(predicate).Skip((pageIndex - 1) * pageSize).Take(pageSize).ToListAsync();
        }

        //分页查询带排序
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


        //批量插入
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
            await _context.BulkUpdateAsync(entities, options => {
                options.PropertiesToInclude = updateColumns; // 只更新 updateColumns 字段
            });
            await _context.BulkUpdateAsync(entities);

        }

        public async Task<int> BatchUpdateAsync(Expression<Func<T, bool>> filter, Expression<Func<SetPropertyCalls<T>, SetPropertyCalls<T>>> setters)
        {
            return await _context.BatchUpdateAsync<T>(filter, setters);
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
        // 批量更新（带返回值）
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

        // 批量删除（带事务）
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
