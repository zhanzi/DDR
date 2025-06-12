using System;
using System.ComponentModel.DataAnnotations;

namespace SlzrCrossGate.Core.Models
{
    public class SystemSettings
    {
        [Key]
        public int Id { get; set; }
        
        // 双因素认证设置
        public bool EnableTwoFactorAuth { get; set; } = true;
        public bool ForceTwoFactorAuth { get; set; } = false;
        
        // 微信登录设置
        public bool EnableWechatLogin { get; set; } = true;
        
        // 其他系统设置可以在这里添加
        
        // 审计字段
        public DateTime LastModified { get; set; } = DateTime.Now;
        public string? LastModifiedBy { get; set; }
    }
}
