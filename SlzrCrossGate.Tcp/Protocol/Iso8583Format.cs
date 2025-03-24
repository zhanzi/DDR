namespace SlzrCrossGate.Tcp.Protocol
{
    /// <summary>
    /// ��ʾ ISO 8583 �����ֶθ�ʽ
    /// </summary>
    public enum Iso8583Format
    {
        /// <summary>
        /// ������
        /// </summary>
        None,
        /// <summary>
        /// �ɱ䳤��ĳ���ֵ��һλ����ռ��1���ֽڣ�BCD���롣
        /// </summary>
        LVAR,
        /// <summary>
        /// �ɱ䳤��ĳ���ֵ����λ����ռ��1���ֽڣ�BCD���롣
        /// </summary>
        LLVAR,
        /// <summary>
        /// �ɱ䳤��ĳ���ֵ����λ����ռ��2���ֽڣ�BCD���롣
        /// </summary>
        LLLVAR,
        /// <summary>
        /// ������
        /// </summary>
        YYYYMMDD,
        /// <summary>
        /// <summary>
        /// ������
        /// </summary>
        YYMMDD,
        /// <summary>
        /// ����
        /// </summary>
        YYMM,
        /// <summary>
        /// ����
        /// </summary>
        MMDD,
        /// <summary>
        /// ʱ����
        /// </summary>
        hhmmss,
        /// <summary>
        /// ����ʱ����
        /// </summary>
        MMDDhhmmss
    }
}
