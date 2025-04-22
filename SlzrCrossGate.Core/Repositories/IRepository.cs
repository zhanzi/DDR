// SlzrCrossGate.Core/Repositories/IRepository.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;

namespace SlzrCrossGate.Core.Repositories
{
    public interface IRepository<T> where T : class
    {
        Task<T?> GetByIdAsync(object id);
        Task<IEnumerable<T>> GetAllAsync(bool asNoTracking = false);
        Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate, bool asNoTracking = false);
        Task<T?> SingleOrDefaultAsync(Expression<Func<T, bool>> predicate, bool asNoTracking = false);
        Task AddAsync(T entity);
        Task AddRangeAsync(IEnumerable<T> entities);


        Task UpdateAsync(T entity);
        Task RemoveAsync(T entity);
        Task RemoveRangeAsync(IEnumerable<T> entities);
        Task<int> CountAsync(Expression<Func<T?, bool>> predicate);
        Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate, bool asNoTracking = false);
        Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate, Expression<Func<T, object>> order, bool isAsc, bool asNoTracking = false);
        Task<IEnumerable<T>> FindPagedAsync(Expression<Func<T, bool>> predicate, int pageIndex, int pageSize, bool asNoTracking = false);
        Task<IEnumerable<T>> FindPagedAsync(Expression<Func<T, bool>> predicate, Expression<Func<T, object>> order, bool isAsc, int pageIndex, int pageSize, bool asNoTracking = false);


        /// <summary>
        /// 批量插入（EFCore.BulkExtensions）
        /// </summary>
        /// <param name="entities"></param>
        /// <returns></returns>
        Task BulkInsertAsync(IEnumerable<T> entities);

        /// <summary>
        /// 批量更新（EFCore.BulkExtensions）
        /// </summary>
        /// <param name="entities"></param>
        /// <returns></returns>
        Task BulkUpdateAsync(IEnumerable<T> entities);
        /// <summary>
        /// 批量更新指定列（EFCore.BulkExtensions）
        /// </summary>
        /// <param name="entities"></param>
        /// <param name="updateColumns"></param>
        /// <returns></returns>
        Task BulkUpdateAsync(IEnumerable<T> entities, List<string> updateColumns);

        /// <summary>
        /// EF8原生批量更新
        /// </summary>
        /// <param name="filter"></param>
        /// <param name="setters"></param>
        /// <returns></returns>
        Task<int> BatchUpdateAsync(Expression<Func<T, bool>> filter, Expression<Func<SetPropertyCalls<T>, SetPropertyCalls<T>>> setters);

        /// <summary>
        /// EF8原生批量更新（事务）
        /// </summary>
        /// <param name="filter"></param>
        /// <param name="setters"></param>
        /// <returns></returns>
        Task<int> BatchUpdateInTransactionAsync(Expression<Func<T, bool>> filter, Expression<Func<SetPropertyCalls<T>, SetPropertyCalls<T>>> setters);

        /// <summary>
        /// EF8原生批量删除
        /// </summary>
        /// <typeparam name="TEntity"></typeparam>
        /// <param name="dbContext"></param>
        /// <param name="filter"></param>
        /// <param name="isolationLevel"></param>
        /// <param name="ct"></param>
        /// <returns></returns>
        Task<int> BatchDeleteAsync(
            Expression<Func<T, bool>> filter,
            System.Data.IsolationLevel? isolationLevel = null,
            CancellationToken ct = default);

        /// <summary>
        /// EF8原生批量删除带事务
        /// </summary>
        /// <typeparam name="TEntity"></typeparam>
        /// <param name="filter"></param>
        /// <param name="isolationLevel"></param>
        /// <param name="ct"></param>
        /// <returns></returns>
        Task<int> BatchDeleteInTransactionAsync(
            Expression<Func<T, bool>> filter,
            System.Data.IsolationLevel? isolationLevel = null,
            CancellationToken ct = default);

        /// <summary>
        /// 批量删除（EFCore.BulkExtensions）
        /// </summary>
        /// <param name="entities"></param>
        /// <returns></returns>
        Task BulkDeleteAsync(IEnumerable<T> entities);


        /// <summary>
        /// 批量更新并插入（EFCore.BulkExtensions)
        /// </summary>
        /// <param name="entities"></param>
        /// <returns></returns>
        Task BulkInsertOrUpdateAsync(IEnumerable<T> entities);

        /*
         关闭跟踪（Tracking）​

            csharp
            await context.BulkInsertAsync(entities, options => {
                options.DisableConcurrencyCheck = true;
                options.AutoMapOutputDirection = false;
});
        */

    }
}
