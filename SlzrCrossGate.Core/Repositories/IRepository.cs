// SlzrCrossGate.Core/Repositories/IRepository.cs
using Microsoft.EntityFrameworkCore;
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
        Task<IEnumerable<T>> GetAllAsync();
        Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate);
        Task<T?> SingleOrDefaultAsync(Expression<Func<T, bool>> predicate);
        Task AddAsync(T entity);
        Task AddRangeAsync(IEnumerable<T> entities);
        Task UpdateAsync(T entity);
        Task RemoveAsync(T entity);
        Task RemoveRangeAsync(IEnumerable<T> entities);
        Task<int> CountAsync(Expression<Func<T?, bool>> predicate);
        Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate);
        Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate, Expression<Func<T, object>> order, bool isAsc);
        Task<IEnumerable<T>> FindPagedAsync(Expression<Func<T, bool>> predicate, int pageIndex, int pageSize);
        Task<IEnumerable<T>> FindPagedAsync(Expression<Func<T, bool>> predicate, Expression<Func<T, object>> order, bool isAsc, int pageIndex, int pageSize);
    }
}
