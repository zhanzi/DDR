namespace SlzrCrossGate.Core.Models
{
    /// <summary>
    /// 发布类型选项
    /// </summary>
    public enum PublishTypeOption
    {
        Merchant = 1,
        Line = 2,
        Terminal = 3
    }

    /// <summary>
    /// 线路价格版本状态
    /// </summary>
    public enum LinePriceVersionStatus
    {
        /// <summary>
        /// 草稿
        /// </summary>
        Draft = 0,
        
        /// <summary>
        /// 已提交
        /// </summary>
        Submitted = 1
    }


    public enum UserRoleOption
    {
        SysAdmin = 1,
        TentantAdmin = 2,
        TenantUser = 3,
        TenantViewer = 4
    }

    //��Ϣ�������ͣ�ASCII,HEX
    public enum MessageCodeType
    {
        ASCII = 1,
        HEX = 2
    }

    //�豸��Ծ״̬
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
    /// �¼����س̶�
    /// </summary>
    public enum EventSeverity
    {
        Info,
        Warning,
        Error
    }

    /// <summary>
    /// �ն��¼�����
    /// </summary>
    public enum TerminalEventType
    {
        //�ն˱�ע�ᵽϵͳ
        Created = 0,
        //ǩ���¼�
        SignIn = 1,
        //ǩ���¼�
        SignOut = 2,
        //�ļ����ؿ�ʼ
        FileDownloadStart = 3,
        //�ļ����ؽ���
        FileDownloadEnd = 4,
        //�ļ��汾�Ѹ���
        FileVersionUpdated = 5,
        //�����ѱ��
        PropertyChanged = 6,
        //������Կ�Ѱ�
        UnionPayKeyBound = 7,
        //�̻����ѱ��
        MerchantIDChanged = 8,
        //��·���ѱ��
        LineNOChanged = 9,
        //�豸���ѱ��
        DeviceNOChanged = 10,
        //Message Sent
        MessageSent = 11,
        //File Published
        FilePublished = 12,
    }
}
