using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SlzrCrossGate.Core.Models
{
    public class ApplicationUser : IdentityUser
    {
        public string? RealName { get; set; }
        public string? MerchantID { get; set; }
        public DateTime CreateTime { get; set; }=DateTime.Now;
        public bool IsDeleted { get; set; }=false;

        // 双因素认证相关字段
        public string? TwoFactorSecretKey { get; set; }
        public bool IsTwoFactorRequired { get; set; }=false;  // 是否强制要求使用双因素认证
        public DateTime? TwoFactorEnabledDate { get; set; }
        public int? FailedTwoFactorAttempts { get; set; }
        public DateTime? LastFailedTwoFactorAttempt { get; set; }

        // 微信登录相关字段
        public string? WechatOpenId { get; set; }      // 微信OpenID
        public string? WechatUnionId { get; set; }     // 微信UnionID
        public string? WechatNickname { get; set; }    // 微信昵称
        public DateTime? WechatBindTime { get; set; }  // 微信绑定时间
    }

    public class ApplicationRole : IdentityRole
    {
        //是否是系统管理员
        public bool IsSysAdmin { get; set; }

    }
}
