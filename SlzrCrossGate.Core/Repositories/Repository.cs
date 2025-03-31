// SlzrCrossGate.Core/Repositories/Repository.cs
using Microsoft.EntityFrameworkCore;
using SlzrCrossGate.Core.Database;
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

        public async Task<IEnumerable<T>> GetAllAsync()
        {
            return await _context.Set<T>().ToListAsync();
        }

        public async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate)
        {
            return await _context.Set<T>().Where(predicate).ToListAsync();
        }

        //查询第一个符合条件的实体
        public async Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate)
        {
            return await _context.Set<T>().FirstOrDefaultAsync(predicate);
        }

        //查询第一个符合条件的实体带排序
        public async Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate, Expression<Func<T, object>> order, bool isAsc)
        {
            var query = _context.Set<T>().Where(predicate);
            query = isAsc ? query.OrderBy(order) : query.OrderByDescending(order);
            return await query.FirstOrDefaultAsync();
        }

        //分页查询
        public async Task<IEnumerable<T>> FindPagedAsync(Expression<Func<T, bool>> predicate, int pageIndex, int pageSize)
        {
            return await _context.Set<T>().Where(predicate).Skip((pageIndex - 1) * pageSize).Take(pageSize).ToListAsync();
        }

        //分页查询带排序
        public async Task<IEnumerable<T>> FindPagedAsync(Expression<Func<T, bool>> predicate, Expression<Func<T, object>> order, bool isAsc, int pageIndex, int pageSize)
        {
            var query = _context.Set<T>().Where(predicate);
            query = isAsc ? query.OrderBy(order) : query.OrderByDescending(order);
            return await query.Skip((pageIndex - 1) * pageSize).Take(pageSize).ToListAsync();
        }


        public async Task<T?> SingleOrDefaultAsync(Expression<Func<T, bool>> predicate)
        {
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
    }
}
