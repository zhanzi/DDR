using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SlzrCrossGate.Core.Models
{
    public class ApplicationUser:IdentityUser
    {
        public string? RealName { get; set; }

        /// <summary>
        /// 系统管理员无租户ID
        /// </summary>
        public string? MerchantID { get; set; }


    }

    public class ApplicationRole : IdentityRole
    {
        //是否是系统管理员
        public bool IsSysAdmin { get; set; }

    }
}
