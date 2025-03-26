using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SlzrCrossGate.Tcp
{
    public class ConnectionStats
    {
        public int ActiveConnections { get; set; }
        public required Dictionary<string, int> ConnectionsByMerchant { get; set; }
    }
}
