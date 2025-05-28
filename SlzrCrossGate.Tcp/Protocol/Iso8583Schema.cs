using System.Text;
using System.Xml.Serialization;

namespace SlzrCrossGate.Tcp.Protocol
{
    /// <summary>
    /// ��ʾ ISO 8583 �������������򼯺�
    /// </summary>
    public class Iso8583Schema
    {
        internal Bitmap bitmap;
        internal SortedList<int, Iso8583Field> fields;

        /// <summary>
        /// Ĭ�Ϲ��캯��
        /// </summary>
        public Iso8583Schema()
        {
            this.bitmap = new Bitmap();
            this.fields = new SortedList<int, Iso8583Field>(Bitmap.FieldCount);
        }
        /// <summary>
        /// ��ָ���ļ����ز�����ʵ��
        /// </summary>
        /// <param name="fileName"></param>
        public Iso8583Schema(string fileName)
            : this()
        {
            this.LoadFromFile(fileName);
        }

        /// <summary>
        /// ��ȡһ��ֵ��ָʾ�������Ƿ���ȫ128�ֶεġ�
        /// </summary>
        public bool IsFullBitmap
        {
            get
            {
                return true;//return this.bitmap.IsFull;
            }
        }

        /// <summary>
        /// ����һ��������
        /// </summary>
        /// <param name="field">��������Ϣ</param>
        public void AddField(Iso8583Field field)
        {
            if (field == null)
                throw new ArgumentNullException("field");
            if (this.fields.ContainsKey(field.BitNum))
                throw new Exception("�����������Ѿ����ڡ�");
            if (field.BitNum < 1 || field.BitNum > Bitmap.FieldCount)
                throw new Exception("λ��ֵ���Ϸ���");
            this.fields.Add(field.BitNum, field);
            this.bitmap.Set(field.BitNum, true);
        }
        /// <summary>
        /// �Ƴ�һ��������
        /// </summary>
        /// <param name="bitNum"></param>
        public void RemoveField(int bitNum)
        {
            this.fields.Remove(bitNum);
            this.bitmap.Set(bitNum, false);
        }

        /// <summary>
        /// ��Xml�ı�����ܹ�
        /// </summary>
        /// <param name="xml">xml�ı�</param>
        /// <returns></returns>
        public void LoadFromXml(string xml)
        {
            XmlSerializer serial = new XmlSerializer(typeof(Iso8583Field[]));
            StringReader reader = new StringReader(xml);
            Iso8583Field[]? array = serial.Deserialize(reader) as Iso8583Field[];
            if (array != null)
            {
                foreach (Iso8583Field field in array)
                {
                    this.AddField(field);
                }
            }
        }
        /// <summary>
        /// ���ļ�����ܹ�
        /// </summary>
        /// <param name="fileName">�ļ���</param>
        /// <returns></returns>
        public void LoadFromFile(string fileName)
        {
            StreamReader reader = new StreamReader(fileName);
            string xml = reader.ReadToEnd();
            reader.Close();
            this.LoadFromXml(xml);
        }
        /// <summary>
        /// �Ѽܹ��������ı�
        /// </summary>
        /// <returns></returns>
        public string ExportToXml()
        {
            Iso8583Field[] array = new Iso8583Field[this.fields.Count];
            int i = 0;
            foreach (KeyValuePair<int, Iso8583Field> kvp in this.fields)
            {
                array[i++] = kvp.Value;
            }
            XmlSerializer serial = new XmlSerializer(typeof(Iso8583Field[]));
            StringBuilder sb = new StringBuilder();
            StringWriter writer = new StringWriter(sb);
            serial.Serialize(writer, array);
            return sb.ToString();
        }
        /// <summary>
        /// ����ܹ����ļ�
        /// </summary>
        /// <param name="fileName">�ļ���</param>
        public void SaveToFile(string fileName)
        {
            string xml = this.ExportToXml();
            StreamWriter writer = new StreamWriter(fileName);
            writer.Write(xml);
            writer.Close();
        }
    }
}
