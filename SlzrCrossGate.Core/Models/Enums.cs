namespace SlzrCrossGate.Core.Models
{
    // 发布类型
    public enum PublishTypeOption
    {
        Merchant = 1,
        Line = 2,
        Terminal = 3
    }


    public enum UserRoleOption
    {
        SysAdmin = 1,
        TentantAdmin = 2,
        TenantUser = 3,
        TenantViewer = 4
    }

    //消息编码类型，ASCII,HEX
    public enum MessageCodeType
    {
        ASCII = 1,
        HEX = 2
    }

    //设备活跃状态
    public enum DeviceActiveStatus
    {
        Active = 1,
        Inactive = 2
    }

    public enum MessageStatus
    {
        Unread = 0,
        Read = 1,
        Replied = 2
    }

    /// <summary>
    /// 事件严重程度
    /// </summary>
    public enum EventSeverity
    {
        Info,
        Warning,
        Error
    }

    /// <summary>
    /// 终端事件类型
    /// </summary>
    public enum TerminalEventType
    {
        FileDownloadStart = 1,
        FileDownloadEnd = 2,
        // 其他事件类型
    }
}
