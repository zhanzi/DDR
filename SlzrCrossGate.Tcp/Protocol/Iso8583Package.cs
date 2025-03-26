using System.Text;
using System.Diagnostics;
using SlzrCrossGate.Common;

namespace SlzrCrossGate.Tcp.Protocol
{
    /// <summary>
    /// ISO 8583 数据包类
    /// </summary>
    public class Iso8583Package
    {
        private string messageType = "";
        private Iso8583Schema schema;
        private Bitmap bitmap;
        private SortedList<int, object> values;
        private bool smartBitmap = true;

        private bool messageTypeIsBCD = true;

        private byte[] _buffer = Array.Empty<byte>();

        public byte[] GetCurBuffer()
        {
            return _buffer;
        }

        #region 构造函数
        /// <summary>
        /// 使用指定的 Schema 构造数据包类
        /// </summary>
        /// <param name="schema"></param>
        public Iso8583Package(Iso8583Schema schema, bool messageTypeIsBCD = true)
        {
            this.bitmap = new Bitmap();
            this.values = new SortedList<int, object>(Bitmap.FieldCount);
            this.schema = schema;
            this.messageTypeIsBCD = messageTypeIsBCD;
        }
        /// <summary>
        /// 使用指定的 Schema 文件构造数据包类
        /// </summary>
        /// <param name="schemaFile"></param>
        public Iso8583Package() : this(new Iso8583Schema("schema.xml"))
        {

        }
        #endregion


        /// <summary>
        /// 设置值（通用方法）
        /// </summary>
        /// <param name="bitNum"></param>
        /// <param name="value"></param>
        /// <exception cref="Exception"></exception>
        public void SetField(int bitNum, object value)
        {
            if (value == null)
            {
                this.bitmap.Set(bitNum, false);
                this.values.Remove(bitNum);
                return;
            }
            if (!this.schema.fields.ContainsKey(bitNum)) throw new Exception(String.Format("field {0} is not defined in schema.", bitNum));

            Iso8583Field field = this.schema.fields[bitNum];
            switch (field.DataType)
            {
                case Iso8583DataType.B:
                    if (value is not byte[])
                    {
                        throw new Iso8583FieldeException("this field is binary, but the value is not byte[].");
                    }
                    break;
                case Iso8583DataType.N:
                case Iso8583DataType.BCD:
                case Iso8583DataType.ANS:
                    if (value is string && !DataConvert.IsHex(value.ToString()))
                    {
                        throw new Iso8583FieldeException("this field is number, but the value is not hex string.");
                    }

                    if (field.Format == Iso8583Format.LVAR || field.Format == Iso8583Format.LLVAR || field.Format == Iso8583Format.LLLVAR)
                    {
                        if (value.ToString()?.Length > field.Length)
                        {
                            throw new Iso8583FieldeException("this field is number, but the value is too long.");
                        }
                    }
                    else
                    {
                        if (value.ToString()?.Length != field.Length)
                        {
                            throw new Iso8583FieldeException("this field need length " + field.Length + ", but the value is " + value.ToString()?.Length);
                        }
                    }

                    break;
                default:
                    if (value is not string)
                    {
                        throw new Iso8583FieldeException("this field is string, but the value is not string.");
                    }
                    break;
            }
            this.bitmap.Set(bitNum, true);
            this.values[bitNum] = value;
        }

        /// <summary>
        /// 获取值（通用方法）
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="bitNum"></param>
        /// <returns></returns>
        public T GetField<T>(int bitNum)
        {
            Iso8583Field field = this.schema.fields[bitNum];
            if (field == null)
            {
                throw new Exception("field is not defined in schema.");
            }
            if (!this.values.ContainsKey(bitNum) || this.values[bitNum] == null)
            {
                throw new Exception("field is not set value.");
            }
            if (field.DataType != Iso8583DataType.B)
            {
                return (T)this.values[bitNum];
            }
            else if (typeof(T) == typeof(byte[]))
            {
                return (T)this.values[bitNum];
            }
            else if (typeof(T) == typeof(string))
            {
                return (T)(object)DataConvert.BytesToHex((byte[])this.values[bitNum]);
            }
            else
            {
                throw new Exception("field is binary, but the value is not byte[] or string.");
            }
        }


        #region 公共属性
        /// <summary>
        /// 消息类型
        /// </summary>
        public string MessageType
        {
            get { return this.messageType; }
            set
            {
                if (value.Length != 4)
                    throw new Exception("长度不正确。");
                this.messageType = value;
            }
        }
        /// <summary>
        /// 指示是否使用智能位图模式进行组包和解包。
        /// 设置 true 时需要 Schema 为全128字段的定义。
        /// </summary>
        public bool SmartBitmap
        {
            get { return this.smartBitmap; }
            set
            {
                if (value)
                {
                    if (!this.schema.IsFullBitmap)
                        throw new Exception("架构定义不是全128字段的，不能开启智能位图模式进行组包和解包");
                }
                this.smartBitmap = value;
            }
        }
        #endregion

        #region 为数据域设置值
        /// <summary>
        /// 清除所有数据。
        /// </summary>
        public void Clear()
        {
            this.bitmap = new Bitmap();
            this.values = new SortedList<int, object>(Bitmap.FieldCount);
        }
        /// <summary>
        /// 为指定数据域设置一个字符串值
        /// </summary>
        /// <param name="bitNum">数据域</param>
        /// <param name="value">字符串值</param>
        public void SetString(int bitNum, string value)
        {
            if (!this.schema.fields.ContainsKey(bitNum))
                throw new Exception(String.Format("数据包定义不包含此域：{0}", bitNum));
            Iso8583Field field = this.schema.fields[bitNum];
            if (Encoding.Default.GetByteCount(value) > field.Length)
                throw new Exception("长度过长。bitNum:" + bitNum.ToString() + "value:" + value);
            switch (field.DataType)
            {
                case Iso8583DataType.B:
                    throw new Exception("格式不符。bitNum:" + bitNum.ToString() + "value:" + value);
                default:
                    values[bitNum] = value;
                    break;
            }
            this.bitmap.Set(bitNum, value != null);
        }
        /// <summary>
        /// 为指定数据域设置一个数字值
        /// </summary>
        /// <param name="bitNum">数据域</param>
        /// <param name="value">数字值</param>
        public void SetNumber(int bitNum, int value)
        {
            if (!this.schema.fields.ContainsKey(bitNum))
                throw new Exception(String.Format("数据包定义不包含此域：{0}", bitNum));
            Iso8583Field field = this.schema.fields[bitNum];
            string strValue = value.ToString();
            if (strValue.Length > field.Length)
                throw new ArgumentException("数值过大。", "value");
            switch (field.DataType)
            {
                case Iso8583DataType.B:
                    throw new Exception("格式不符。bitNum:" + bitNum.ToString() + "value:" + value.ToString());
                default:
                    values[bitNum] = new string('0', field.Length - strValue.Length) + strValue;
                    break;
            }
            this.bitmap.Set(bitNum, true);
        }
        /// <summary>
        /// 为指定数据域设置一个金额值
        /// </summary>
        /// <param name="bitNum">数据域</param>
        /// <param name="money">金额值</param>
        public void SetMoney(int bitNum, decimal money)
        {
            int value = Convert.ToInt32(money * 100);
            this.SetNumber(bitNum, value);
        }
        /// <summary>
        /// 为指定数据域设置一个日期值
        /// </summary>
        /// <param name="bitNum">数据域</param>
        /// <param name="time">日期值</param>
        public void SetDateTime(int bitNum, DateTime time)
        {
            if (!this.schema.fields.ContainsKey(bitNum))
                throw new Exception(String.Format("数据包定义不包含此域：{0}", bitNum));
            Iso8583Field field = this.schema.fields[bitNum];
            switch (field.DataType)
            {
                case Iso8583DataType.B:
                    throw new Exception("格式不符。");
                default:
                    switch (field.Format)
                    {
                        case Iso8583Format.YYMMDD:
                            values[bitNum] = time.ToString("yyMMdd");
                            break;
                        case Iso8583Format.YYYYMMDD:
                            values[bitNum] = time.ToString("yyyyMMdd");
                            break;
                        case Iso8583Format.YYMM:
                            values[bitNum] = time.ToString("yyMM");
                            break;
                        case Iso8583Format.MMDD:
                            values[bitNum] = time.ToString("MMdd");
                            break;
                        case Iso8583Format.hhmmss:
                            values[bitNum] = time.ToString("HHmmss");
                            break;
                        case Iso8583Format.MMDDhhmmss:
                            values[bitNum] = time.ToString("MMddHHmmss");
                            break;
                        default:
                            throw new Exception("格式不符。");
                    }
                    break;
            }
            this.bitmap.Set(bitNum, true);
        }
        /// <summary>
        /// 为指定数据域设置一个二进制值
        /// </summary>
        /// <param name="bitNum">数据域</param>
        /// <param name="data">二进制值</param>
        public void SetArrayData(int bitNum, byte[] data)
        {
            if (!this.schema.fields.ContainsKey(bitNum))
                throw new Exception(String.Format("数据包定义不包含此域：{0}", bitNum));
            Iso8583Field field = this.schema.fields[bitNum];
            if (data.Length > field.Length)
                throw new Exception("长度过长。bitNum:" + bitNum.ToString());
            switch (field.DataType)
            {
                case Iso8583DataType.B:
                    values[bitNum] = data;
                    break;
                default:
                    throw new Exception("格式不符。bitNum:" + bitNum.ToString());
            }
            this.bitmap.Set(bitNum, data != null);
        }
        public void SetBCD(int bitNum, string value) {
            if (!this.schema.fields.ContainsKey(bitNum))
                throw new Exception(String.Format("数据包定义不包含此域：{0}", bitNum));
            Iso8583Field field = this.schema.fields[bitNum];
            if (value.Length/2 > field.Length)
                throw new Exception("长度过长。bitNum:" + bitNum.ToString() + "value:" + value);
            switch (field.DataType)
            {
                case Iso8583DataType.B:
                    throw new Exception("格式不符。bitNum:" + bitNum.ToString() + "value:" + value);
                default:
                    values[bitNum] = value;
                    break;
            }
            this.bitmap.Set(bitNum, value != null);
        }
        #endregion

        #region 从数据域获取值
        /// <summary>
        /// 获取某个域上是否存在有效值。
        /// </summary>
        /// <param name="bitNum">数据域</param>
        /// <returns></returns>
        public bool ExistValue(int bitNum)
        {
            return this.values.ContainsKey(bitNum) && (this.values[bitNum] != null);
        }
        /// <summary>
        /// 从指定数据域获取字符串值
        /// </summary>
        /// <param name="bitNum">数据域</param>
        /// <returns></returns>
        public string GetString(int bitNum)
        {
            if (!this.schema.fields.ContainsKey(bitNum))
                throw new Exception(String.Format("数据包定义不包含此域：{0}", bitNum));
            Iso8583Field field = this.schema.fields[bitNum];
            if (!this.values.ContainsKey(bitNum) || (this.values[bitNum] == null))
                throw new Exception(String.Format("数据域 {0} 不包含任何有效值。", bitNum));
            switch (field.DataType)
            {
                case Iso8583DataType.B:
                    throw new Exception("格式不符。");
                default:
                    return this.values[bitNum].ToString();
            }
        }
        /// <summary>
        /// 从指定数据域获取数字值
        /// </summary>
        /// <param name="bitNum">数据域</param>
        /// <returns></returns>
        public int GetNumber(int bitNum)
        {
            if (!this.schema.fields.ContainsKey(bitNum))
                throw new Exception(String.Format("数据包定义不包含此域：{0}", bitNum));
            Iso8583Field field = this.schema.fields[bitNum];
            if (!this.values.ContainsKey(bitNum) || (this.values[bitNum] == null))
                throw new Exception(String.Format("数据域 {0} 不包含任何有效值。", bitNum));
            switch (field.DataType)
            {
                case Iso8583DataType.N:
                    return Convert.ToInt32(this.values[bitNum]);
                default:
                    throw new Exception("格式不符。");
            }
        }
        /// <summary>
        /// 从指定数据域获取金额值
        /// </summary>
        /// <param name="bitNum">数据域</param>
        /// <returns></returns>
        public decimal GetMoney(int bitNum)
        {
            decimal money = this.GetNumber(bitNum);
            return money / 100;
        }
        /// <summary>
        /// 从指定数据域获取日期值
        /// </summary>
        /// <param name="bitNum">数据域</param>
        /// <returns></returns>
        public DateTime GetDateTime(int bitNum)
        {
            if (!this.schema.fields.ContainsKey(bitNum))
                throw new Exception(String.Format("数据包定义不包含此域：{0}", bitNum));
            Iso8583Field field = this.schema.fields[bitNum];
            if (!this.values.ContainsKey(bitNum) || (this.values[bitNum] == null))
                throw new Exception(String.Format("数据域 {0} 不包含任何有效值。", bitNum));
            switch (field.DataType)
            {
                case Iso8583DataType.B:
                    throw new Exception("格式不符。");
                default:
                    string value = (string)this.values[bitNum];
                    switch (field.Format)
                    {
                        case Iso8583Format.YYMMDD:
                            return DateTime.ParseExact(value, "yyMMdd", null);
                        case Iso8583Format.YYYYMMDD:
                            return DateTime.ParseExact(value, "yyyyMMdd", null);
                        case Iso8583Format.YYMM:
                            return DateTime.ParseExact(value, "yyMM", null);
                        case Iso8583Format.MMDD:
                            return DateTime.ParseExact(value, "MMdd", null);
                        case Iso8583Format.hhmmss:
                            return DateTime.ParseExact(value, "HHmmss", null);
                        case Iso8583Format.MMDDhhmmss:
                            return DateTime.ParseExact(value, "MMddHHmmss", null);
                        default:
                            throw new Exception("格式不符。");
                    }
            }
        }
        /// <summary>
        /// 从指定数据域获取二进制值
        /// </summary>
        /// <param name="bitNum">数据域</param>
        /// <returns></returns>
        public byte[] GetArrayData(int bitNum)
        {
            if (!this.schema.fields.ContainsKey(bitNum))
                throw new Exception(String.Format("数据包定义不包含此域：{0}", bitNum));
            Iso8583Field field = this.schema.fields[bitNum];
            if (!this.values.ContainsKey(bitNum) || (this.values[bitNum] == null))
                throw new Exception(String.Format("数据域 {0} 不包含任何有效值。", bitNum));
            switch (field.DataType)
            {
                case Iso8583DataType.B:
                    return (byte[])this.values[bitNum];
                default:
                    throw new Exception(String.Format("数据域 {0} 格式不是二进制。", bitNum));
            }
        }
        #endregion

        #region 组包
        private int GetLength(int bitNum)
        {
            Debug.Assert(this.schema.fields.ContainsKey(bitNum));
            Iso8583Field field = this.schema.fields[bitNum];
            switch (field.Format)
            {
                case Iso8583Format.LVAR:
                case Iso8583Format.LLVAR:
                case Iso8583Format.LLLVAR:
                    string value = "";
                    int len = 0;
                    if (this.values.ContainsKey(bitNum) && (this.values[bitNum] != null))
                    {
                        switch (field.DataType)
                        {
                            case Iso8583DataType.B:
                                var data = (byte[])values[bitNum];
                                len = data.Length;
                                break;
                            case Iso8583DataType.N:
                            case Iso8583DataType.BCD:
                                value = (string)values[bitNum];
                                len = value.Length / 2;
                                break;
                            default:
                                value = (string)values[bitNum];
                                len = Encoding.Default.GetByteCount(value);
                                break;
                        }

                    }
                    return len + (field.Format - Iso8583Format.LVAR + 2) / 2;
                default:
                    switch (field.DataType)
                    {
                        case Iso8583DataType.B:
                            return field.Length;
                        case Iso8583DataType.N:
                        case Iso8583DataType.BCD:
                            return field.Length / 2;
                        default:
                            return field.Length;
                    }
            }


            //switch (field.DataType)
            //{
            //    case Iso8583DataType.B:
            //        return field.Length;
            //    case Iso8583DataType.N:
            //    case Iso8583DataType.BCD:
            //        return field.Length / 2;
            //    default:
            //        switch (field.Format)
            //        {
            //            case Iso8583Format.LVAR:
            //            case Iso8583Format.LLVAR:
            //            case Iso8583Format.LLLVAR:
            //                string value = "";
            //                int len = 0;
            //                if (this.values.ContainsKey(bitNum) && (this.values[bitNum] != null))
            //                {
            //                    value = (string)values[bitNum];
            //                    len = Encoding.Default.GetByteCount(value);
            //                }
            //                return len + field.Format - Iso8583Format.LVAR + 1;
            //            default:
            //                return field.Length;
            //        }
            //}
        }
        private void AppendData(string str, Array dst, ref int pos)
        {
            if (String.IsNullOrEmpty(str)) return;
            byte[] field = Encoding.Default.GetBytes(str);
            System.Buffer.BlockCopy(field, 0, dst, pos, field.Length);
            pos += field.Length;
        }


        private readonly byte[] EmptyBytes = new byte[1024];
        /// <summary>
        /// 组包一个 ISO 8583 数据包
        /// </summary>
        /// <returns></returns>
        private byte[] PackSendBody()
        {
            int len = 0;
            if (!String.IsNullOrEmpty(this.messageType))
            {
                if (messageType.Length != 4) {
                    messageType = new string('0', 4 - messageType.Length) + messageType;
                }
                if (messageTypeIsBCD)
                {
                    len += 2; //this.messageType.Length;
                }
                else {
                    len += 4;
                }
            }
            Bitmap map = this.schema.bitmap;
            if (this.smartBitmap)
                map = this.bitmap;
            for (int bitNum = 2; bitNum <= Bitmap.FieldCount; bitNum++)
            {
                if (map.Get(bitNum))
                {
                    len += this.GetLength(bitNum);
                    if (bitNum > 64)
                        map.Set(1, true);
                }
            }
            len += 16;
            byte[] result = new byte[len];
            int pos = 0;
            if (messageTypeIsBCD)
            {
                DataConvert.HexToBytes(messageType).CopyTo(result, pos);
                pos += 2;
            }
            else
            {
                this.AppendData(MessageType, result, ref pos);
            }
            map.CopyTo(result, pos);
            pos += 16;
            for (int bitNum = 2; bitNum <= Bitmap.FieldCount; bitNum++)
            {
                if (!map.Get(bitNum)) continue;
                Iso8583Field field = this.schema.fields[bitNum];
                string value = "";

                value = "";
                len = 0;
                switch (field.Format)
                {
                    case Iso8583Format.LVAR:
                    case Iso8583Format.LLVAR:
                    case Iso8583Format.LLLVAR:
                        value = "";
                        if (this.ExistValue(bitNum))
                        {
                            switch (field.DataType)
                            {
                                case Iso8583DataType.B:
                                    byte[] data = (byte[])this.values[bitNum];
                                    value = DataConvert.BytesToHex(data);
                                    len = data.Length;
                                    break;
                                case Iso8583DataType.BCD:
                                case Iso8583DataType.N:
                                    value = (string)this.values[bitNum];
                                    len = value.Length / 2;
                                    break;
                                default:
                                    value= (string)this.values[bitNum];
                                    var bValue = Encoding.Default.GetBytes(value);
                                    value = DataConvert.BytesToHex(bValue);
                                    len = bValue.Length;
                                    break;
                            }
                        }
                        var headlen = (field.Format - Iso8583Format.LVAR + 2) / 2;
                        var head = new string('0', headlen * 2 - len.ToString().Length) + len.ToString();
                        byte[] bufferVar = DataConvert.HexToBytes(head + value);
                        bufferVar.CopyTo(result, pos);
                        pos += headlen + len;
                        break;
                    default:
                        switch (field.DataType)
                        {
                            case Iso8583DataType.B:
                                if (this.ExistValue(bitNum))
                                {
                                    byte[] data = (byte[])this.values[bitNum];
                                    data.CopyTo(result, pos);
                                }
                                pos += field.Length;
                                break;
                            case Iso8583DataType.BCD:
                            case Iso8583DataType.N:
                                value = (string)this.values[bitNum];
                                value = DataConvert.PadLeft(value, field.Length);
                                byte[] buffer = DataConvert.HexToBytes(value);
                                buffer.CopyTo(result, pos);
                                pos += field.Length / 2;
                                break;
                            default:
                                value = (string)this.values[bitNum];
                                var bValue = Encoding.Default.GetBytes(value);
                                //value = DataConvert.BytesToHex(bValue);
                                //bValue.CopyTo(result, pos);
                                var diff = field.Length - bValue.Length;
                                if (diff < 0)
                                {
                                    throw new Exception($"{bitNum}域的内容超过规定长度{field.Length}");
                                }
                                if (diff > 1024)
                                {
                                    throw new Exception($"{bitNum}域字段长度异常");
                                }
                                bValue.CopyTo(result, pos);
                                var destIndex = pos;
                                if (diff > 0)
                                {
                                    Array.Copy(EmptyBytes, 0, result, pos + bValue.Length, diff);
                                }
                                pos += field.Length;
                                break;
                        }
                        break;
                }

            }
            return result;
        }

        /// <summary>
        /// 打包完整数据包
        /// </summary>
        /// <param name="NeedReSign"></param>
        /// <returns></returns>
        public byte[] PackSendBuffer(bool NeedReSign = false, int msgcount = 0)
        {
            var body = PackSendBody();
            string headStr = "6000000000612200000001";
            if (NeedReSign)
            {
                headStr = "6000000000612203000001";
            }
            else
            {
                if (msgcount > 0)
                {
                    headStr = "6000000000612205000001";
                }
            }
            //int len = body.Length + 11+4;//4字节CRC
            int len = body.Length + 11;
            _buffer = new byte[body.Length + 11 + 2];
            _buffer[0] = Convert.ToByte(len >> 8 & 0XFF);
            _buffer[1] = Convert.ToByte(len & 0XFF);
            DataConvert.HexToBytes(headStr).CopyTo(_buffer, 2);
            body.CopyTo(_buffer, 13);
            return _buffer;
        }
        #endregion

        #region 解包
        /// <summary>
        /// 解包一个 ISO 8583 数据包
        /// </summary>
        /// <param name="buf">数据包</param>
        /// <param name="haveMT">数据包是否包含4字节的MessageType</param>
        private void ParseBuffer(byte[] buf, bool haveMT=true)
        {
            int pos = 0;
            if (buf == null)
                throw new ArgumentNullException("buf");
            if ((haveMT && messageTypeIsBCD && buf.Length < 18) 
                || (haveMT && !messageTypeIsBCD && buf.Length < 204))
                throw new ArgumentException("数据包长度不符合定义", "buf");
            if (haveMT)
            {
                if (messageTypeIsBCD)
                {
                    this.messageType =DataConvert.BytesToHex(buf, pos, 2);
                    pos += 2;
                }
                else
                {
                    this.messageType = Encoding.Default.GetString(buf, pos, 4);
                    pos += 4;
                }
            }
            byte[] data = new byte[16];
            Array.Copy(buf, pos, data, 0, 16);
            pos += 16;
            this.bitmap = new Bitmap(data);
            if (!this.smartBitmap && !this.schema.bitmap.IsEqual(data))
                throw new Exception("数据包的位图表和定义的不一致");
            for (int bitNum = 2; bitNum <= Bitmap.FieldCount; bitNum++)
            {
                if (!bitmap.Get(bitNum)) continue;
                if (this.smartBitmap && !schema.fields.ContainsKey(bitNum))
                {
                    throw new Exception(string.Format("数据结构定义中不包含域{0}", bitNum));
                }
                Iso8583Field field = this.schema.fields[bitNum];
                int len = 0;
                switch (field.Format)
                {
                    case Iso8583Format.LVAR:
                    case Iso8583Format.LLVAR:
                    case Iso8583Format.LLLVAR:
                        int varLen = field.Format - Iso8583Format.LVAR + 1;
                        //len = int.Parse(Encoding.Default.GetString(buf, pos, varLen));
                        varLen = (varLen + 1) / 2;
                        len = Convert.ToInt32(DataConvert.BytesToHex(buf, pos, varLen));
                        pos += varLen;
                        break;
                    default:
                        switch (field.DataType)
                        {
                            case Iso8583DataType.B:
                                len = field.Length;
                                break;
                            case Iso8583DataType.N:
                            case Iso8583DataType.BCD:
                                len = field.Length / 2;
                                break;
                            default:
                                len = field.Length;
                                break;
                        }
                        break;
                }
                if (buf.Length < pos + len)
                    //throw new ArgumentException("数据包长度不符合定义", "buf");
                    throw new Exception("数据包长度不符合定义");
                switch (field.DataType)
                {
                    case Iso8583DataType.B:
                        if (len > 0)
                        {
                            data = new byte[len];
                            Array.Copy(buf, pos, data, 0, len);
                            this.values[bitNum] = data;
                        }
                        break;

                    case Iso8583DataType.N:
                    case Iso8583DataType.BCD:
                        this.values[bitNum] = DataConvert.BytesToHex(buf, pos, len);
                        break;
                    default:
                        this.values[bitNum] = Encoding.Default.GetString(buf, pos, len).Replace("\0","");
                        break;
                }
                pos += len;
            }
        }

        /// <summary>
        /// 解包完整报文消息（Len + TPDU + Header + 8583message）
        /// </summary>
        /// <param name="buf"></param>
        /// <param name="haveMT"></param>
        public void ParseMessage(byte[] buf, bool haveMT = true)
        {
            _buffer = buf;
            ParseBuffer(buf.Skip(13).ToArray());
        }
        #endregion

        #region Util
        /// <summary>
        /// 获取一个适合在日志中输入的字符串
        /// </summary>
        /// <returns></returns>
        public string GetLogText()
        {
            StringBuilder sb = new StringBuilder();
            sb.AppendFormat("Package(MessageType:{0}):", this.messageType);
            sb.AppendLine();
            sb.AppendLine("{");
            foreach (KeyValuePair<int, object> kvp in this.values)
            {
                Iso8583Field field = this.schema.fields[kvp.Key];
                string value = "";
                if (kvp.Value != null)
                {
                    switch (field.DataType)
                    {
                        case Iso8583DataType.B:
                            value = DataConvert.BytesToHex((byte[])kvp.Value);// BitConverter.ToString((byte[])kvp.Value);
                            break;
                        default:
                            value = (string)kvp.Value;
                            break;
                    }
                }
                sb.AppendFormat("    [{2}][{0}]:{1}", field.FieldName, value, field.BitNum);
                sb.AppendLine();
            }
            sb.AppendLine("}");
            return sb.ToString();
        }
        #endregion
    }
}
