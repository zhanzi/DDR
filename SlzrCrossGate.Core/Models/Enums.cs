namespace SlzrCrossGate.Core.Models
{
    // ��������
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
        AttributeChanged = 6,
        //������Կ�Ѱ�
        UnionPayKeyBound = 7
    }
}
