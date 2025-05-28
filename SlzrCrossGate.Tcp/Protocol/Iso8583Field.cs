namespace SlzrCrossGate.Tcp.Protocol
{
    /// <summary>
    /// ��ʾ ISO 8583 ������������
    /// </summary>
    [Serializable]
    public class Iso8583Field
    {
        private int bitNum;
        private string fieldName = string.Empty;
        private Iso8583DataType dataType;
        private int length;
        private Iso8583Format format;
        private string description = string.Empty;

        /// <summary>
        /// Ĭ�Ϲ��캯��
        /// </summary>
        public Iso8583Field()
        {
        }
        /// <summary>
        /// ��ָ����������ʵ��
        /// </summary>
        /// <param name="bitNum">λ��</param>
        /// <param name="fieldName">�ֶ�����</param>
        /// <param name="dataType">��������</param>
        /// <param name="length">����</param>
        /// <param name="format">��ʽ����</param>
        public Iso8583Field(int bitNum, string fieldName, Iso8583DataType dataType, int length, Iso8583Format format)
        {
            this.bitNum = bitNum;
            this.fieldName = fieldName;
            this.dataType = dataType;
            if (dataType != Iso8583DataType.B)
                this.format = format;
            this.length = length;
            switch (this.format)
            {
                case Iso8583Format.YYMMDD:
                case Iso8583Format.hhmmss:
                    this.length = 6;
                    break;
                case Iso8583Format.YYMM:
                case Iso8583Format.MMDD:
                    this.length = 4;
                    break;
                case Iso8583Format.YYYYMMDD:
                    this.length = 8;
                    break;
                case Iso8583Format.MMDDhhmmss:
                    this.length = 10;
                    break;
                case Iso8583Format.LVAR:
                    if (length > 9) this.length = 9;
                    break;
                case Iso8583Format.LLVAR:
                    if (length > 99) this.length = 99;
                    break;
                case Iso8583Format.LLLVAR:
                    if (length > 999) this.length = 999;
                    break;
            }
        }

        /// <summary>
        /// λ��
        /// </summary>
        public int BitNum
        {
            get { return this.bitNum; }
            set { this.bitNum = value; }
        }
        /// <summary>
        /// �ֶ�����
        /// </summary>
        public string FieldName
        {
            get { return this.fieldName; }
            set { this.fieldName = value; }
        }
        /// <summary>
        /// ��������
        /// </summary>
        public Iso8583DataType DataType
        {
            get { return this.dataType; }
            set { this.dataType = value; }
        }
        /// <summary>
        /// ���ȣ������򣩻���󳤶ȣ������
        /// </summary>
        public int Length
        {
            get { return this.length; }
            set { this.length = value; }
        }
        /// <summary>
        /// ��ʽ����
        /// </summary>
        public Iso8583Format Format
        {
            get { return this.format; }
            set { this.format = value; }
        }
        /// <summary>
        /// �ֶ�����
        /// </summary>
        public string Description
        {
            get { return this.description; }
            set { this.description = value; }
        }
    }
}
