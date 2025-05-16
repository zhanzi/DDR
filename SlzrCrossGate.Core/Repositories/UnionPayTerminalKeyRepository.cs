using Microsoft.EntityFrameworkCore;
using SlzrCrossGate.Core.Database;
using SlzrCrossGate.Core.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SlzrCrossGate.Core.Repositories
{
    public class UnionPayTerminalKeyRepository : Repository<UnionPayTerminalKey>
    {
        public UnionPayTerminalKeyRepository(TcpDbContext context) : base(context)
        {
        }
        //绑定银联密钥
        public async Task<Tuple<bool,UnionPayTerminalKey?>> BindUnionPayKeyAsync(string merchantid, string machineid, string lineid, string busno)
        {
            var upkey = await SingleOrDefaultAsync(p=>p.MerchantID== merchantid && p.MachineID==machineid);
            if (upkey != null) {
                return new Tuple<bool, UnionPayTerminalKey?>(false, upkey);
            }

            while (true)
            {
                var bindkey = await FirstOrDefaultAsync(p => p.MerchantID == merchantid && p.IsInUse == false);
                if (bindkey == null) return  new Tuple<bool, UnionPayTerminalKey?>(false, null);

                bindkey.UpdatedAt = DateTime.Now;
                bindkey.MachineNO = busno;
                bindkey.LineID = lineid;
                try
                {
                    this._context.SaveChanges();
                    return new Tuple<bool, UnionPayTerminalKey?>(true, bindkey);
                }
                catch (DbUpdateConcurrencyException)
                {
                    continue;
                }
            }
        }
    }
}
