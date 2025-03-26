using System.Text;

namespace SlzrCrossGate.Common
{
    public static partial class DataConvert
    {
        /// <summary>
        /// byte[] to Hex String
        /// </summary>
        /// <param name="bByte"></param>
        public static string BytesToHex(byte[] bByte)
        {
            StringBuilder sb = new StringBuilder();
            for (int j = 0; j < bByte.Length; j++)
            {
                sb.Append(bByte[j].ToString("X2"));
            }
            return sb.ToString();
        }

        public static string BytesToHex(byte[] bByte, int offset, int length)
        {
            StringBuilder sb = new StringBuilder();
            for (int j = offset; j < bByte.Length && j < offset + length; j++)
            {
                sb.Append(bByte[j].ToString("X2"));
            }
            return sb.ToString();
        }


        public static byte[] HexToBytes(string hex)
        {
            byte[] b = new byte[hex.Length / 2];
            for (int i = 0; i < b.Length; i++)
            {
                b[i] = Convert.ToByte(hex.Substring(2 * i, 2), 16);
            }
            return b;
        }


        /// <summary>
        /// 将int数值转换为占四个字节的byte数组，本方法适用于(低位在前，高位在后)的顺序。 和bytesToInt（）配套使用 
        /// </summary>
        /// <param name="value"></param>
        /// <returns></returns>
        public static byte[] intToBytes(int value)
        {
            byte[] src = new byte[4];
            src[3] = (byte)((value >> 24) & 0xFF);
            src[2] = (byte)((value >> 16) & 0xFF);
            src[1] = (byte)((value >> 8) & 0xFF);
            src[0] = (byte)(value & 0xFF);
            return src;
        }

        /// <summary>
        /// 将int数值转换为占四个字节的byte数组，本方法适用于(高位在前，低位在后)的顺序。  和bytesToInt2（）配套使用 
        /// </summary>
        /// <param name="value"></param>
        /// <returns></returns>
        public static byte[] intToBytes2(int value)
        {
            byte[] src = new byte[4];
            src[0] = (byte)((value >> 24) & 0xFF);
            src[1] = (byte)((value >> 16) & 0xFF);
            src[2] = (byte)((value >> 8) & 0xFF);
            src[3] = (byte)(value & 0xFF);
            return src;
        }

        /// <summary>
        /// byte数组中取int数值，本方法适用于(低位在前，高位在后)的顺序，和和intToBytes（）配套使用
        /// </summary>
        /// <param name="src">byte数组</param>
        /// <param name="offset">从数组的第offset位开始</param>
        /// <returns></returns>
        public static int bytesToInt(byte[] src, int offset)
        {
            int value;
            value = (int)((src[offset] & 0xFF)
            | ((src[offset + 1] & 0xFF) << 8)
            | ((src[offset + 2] & 0xFF) << 16)
            | ((src[offset + 3] & 0xFF) << 24));
            return value;
        }

        /// <summary>
        /// byte数组中取int数值，本方法适用于(低位在后，高位在前)的顺序。和intToBytes2（）配套使用 
        /// </summary>
        /// <param name="src"></param>
        /// <param name="offset"></param>
        /// <returns></returns>
        public static int bytesToInt2(byte[] src, int offset)
        {
            int value;
            value = (int)(((src[offset] & 0xFF) << 24)
            | ((src[offset + 1] & 0xFF) << 16)
            | ((src[offset + 2] & 0xFF) << 8)
            | (src[offset + 3] & 0xFF));
            return value;
        }


        /// <summary>
        /// 十六进制（低位在前）转换为十进制字符串
        /// </summary>
        /// <returns></returns>
        public static string HexToInteger(string hex)
        {
            string str = "";
            for (int i = 0; i < hex.Length / 2; i++)
            {
                str += hex.Substring(hex.Length - 2 * (i + 1), 2);
            }
            str = Convert.ToInt64(str, 16).ToString();
            return str;
        }



        /// <summary>
        /// 10进制整数转换为低位在前高位在后16进制字符串
        /// </summary>
        /// <param name="integer"></param>
        /// <returns></returns>
        public static string IntegerToHex(string integer)
        {
            string str = "";
            str = int.Parse(integer).ToString("X2");
            if (str.Length % 2 == 1)
            {
                str = '0' + str;
            }
            string hex = "";
            for (int i = 0; i < str.Length / 2; i++)
            {
                hex += str.Substring(str.Length - 2 * (i + 1), 2);
            }
            return hex;
        }

        /// <summary>
        /// 10进制整数转换为低位在前高位在后16进制字符串
        /// </summary>
        /// <param name="integer"></param>
        /// <returns></returns>
        public static string IntegerToHex(long integer)
        {
            string str = "";
            str = integer.ToString("X2");
            if (str.Length % 2 == 1)
            {
                str = '0' + str;
            }
            string hex = "";
            for (int i = 0; i < str.Length / 2; i++)
            {
                hex += str.Substring(str.Length - 2 * (i + 1), 2);
            }
            return hex;
        }
        /// <summary>
        /// IP转换为16进制字符串
        /// </summary>
        /// <param name="_ip"></param>
        /// <returns></returns>
        public static string IpToHex(string _ip)
        {
            string[] ips = _ip.Split(new char[] { '.' });
            return Convert.ToInt32(ips[0], 16).ToString().PadLeft(2, '0') + Convert.ToInt32(ips[1], 16).ToString().PadLeft(2, '0') + Convert.ToInt32(ips[2], 16).ToString().PadLeft(2, '0') + Convert.ToInt32(ips[3], 16).ToString().PadLeft(2, '0');
        }

        /// <summary>
        /// 汉字转16进制字符串Unicode
        /// </summary>
        /// <param name="str"></param>
        /// <returns></returns>
        public static string StringToHexByUnicode(string str)
        {
            byte[] bs = System.Text.Encoding.Convert(Encoding.Default, Encoding.Unicode, System.Text.Encoding.Default.GetBytes(str));
            //return BytesToHex(System.Text.Encoding.Default.GetBytes(str));
            return BytesToHex(bs);
        }
        /// <summary>
        /// 汉字转16进制字符串Unicode （高低位颠倒 大尾）
        /// </summary>
        /// <param name="str"></param>
        /// <returns></returns>
        public static string StringToHexByUnicode2(string str)
        {
            byte[] bs = System.Text.Encoding.Convert(Encoding.Default, Encoding.BigEndianUnicode, System.Text.Encoding.Default.GetBytes(str));
            //return BytesToHex(System.Text.Encoding.Default.GetBytes(str));
            return BytesToHex(bs);
        }
        /// <summary>
        /// 汉字转16进制字符串GBK
        /// </summary>
        /// <param name="str"></param>
        /// <returns></returns>
        public static string StringToHexByGBK(string str)
        {
            byte[] bs = System.Text.Encoding.Convert(Encoding.Default, Encoding.GetEncoding("gb2312"), System.Text.Encoding.Default.GetBytes(str));
            //return BytesToHex(System.Text.Encoding.Default.GetBytes(str));
            return BytesToHex(bs);
        }
        /// <summary>
        /// 汉字转16进制字符串UTF8
        /// </summary>
        /// <param name="str"></param>
        /// <returns></returns>
        public static string StringToHexByUTF8(string str)
        {
            byte[] bs = System.Text.Encoding.Convert(Encoding.Default, Encoding.UTF8, System.Text.Encoding.Default.GetBytes(str));
            //return BytesToHex(System.Text.Encoding.Default.GetBytes(str));
            return BytesToHex(bs);
        }
        /// <summary>
        /// ASCII字符转16进制字符串
        /// </summary>
        /// <param name="str"></param>
        /// <returns></returns>
        public static string StringToHexByASCII(string str)
        {
            return BytesToHex(System.Text.Encoding.ASCII.GetBytes(str));
        }
        /// <summary>
        /// UNICODE 16进制字符串转汉字
        /// </summary>
        /// <param name="str"></param>
        /// <returns></returns>
        public static string HexToStringByUnicode(string str)
        {
            return System.Text.Encoding.Unicode.GetString(HexToBytes(str)).Trim();
        }
        /// <summary>
        /// UNICODE 16进制字符串转汉字(高低位颠倒 大尾)
        /// </summary>
        /// <param name="str"></param>
        /// <returns></returns>
        public static string HexToStringByUnicode2(string str)
        {
            return System.Text.Encoding.BigEndianUnicode.GetString(HexToBytes(str)).Trim();
        }
        /// <summary>
        /// GBK 16进制字符串转汉字 
        /// </summary>
        /// <param name="str"></param>
        /// <returns></returns>
        public static string HexToStringByGBK(string str)
        {
            return System.Text.Encoding.GetEncoding("gb2312").GetString(HexToBytes(str)).Trim();
        }
        /// <summary>
        /// ASCII 16进制字符串转字符
        /// </summary>
        /// <param name="str"></param>
        /// <returns></returns>
        public static string HexToStringByASCII(string str)
        {
            return System.Text.Encoding.ASCII.GetString(HexToBytes(str)).Trim();
        }
        /// <summary>
        /// UTF8 16进制字符串转汉字
        /// </summary>
        /// <param name="str"></param>
        /// <returns></returns>
        public static string HexToStringByUTF8(string str)
        {
            return System.Text.Encoding.UTF8.GetString(HexToBytes(str)).Trim();
        }

        /// <summary>
        /// 16进制字符串转汉字 默认编码
        /// </summary>
        /// <param name="str"></param>
        /// <returns></returns>
        public static string HexToString(string str)
        {
            return System.Text.Encoding.Default.GetString(HexToBytes(str)).Replace("\0", "").Trim();
        }

        /// <summary>
        /// 汉字转16进制字符串 默认编码
        /// </summary>
        /// <param name="str"></param>
        /// <returns></returns>
        public static string StringToHex(string str)
        {
            return BytesToHex(System.Text.Encoding.Default.GetBytes(str));
        }

        /// <summary>
        /// 将20120214120427或者20120213格式的时间字符串转换成2012-02-14 12:04:27格式
        /// </summary>
        /// <param name="bcdDate"></param>
        /// <returns></returns>
        public static string FormatBcdDate(string bcdDate)
        {
            string date = "";
            if (bcdDate.Length >= 8)
            {
                date = bcdDate.Substring(0, 4) + "-" + bcdDate.Substring(4, 2) + "-" + bcdDate.Substring(6, 2);
            }
            if (bcdDate.Length >= 14)
            {
                date += " " + bcdDate.Substring(8, 2) + ":" + bcdDate.Substring(10, 2) + ":" + bcdDate.Substring(12, 2);
            }
            return date;
        }

        /// <summary>
        /// 将20120214120427或者20120213格式的时间字符串转换成2012年02月14日12时04分27秒格式
        /// </summary>
        /// <param name="bcdDate"></param>
        /// <returns></returns>
        public static string FormatBcdDate2(string bcdDate)
        {
            string date = "";
            if (bcdDate.Length >= 8)
            {
                date = bcdDate.Substring(0, 4) + "年" + bcdDate.Substring(4, 2) + "月" + bcdDate.Substring(6, 2) + "日";
            }
            if (bcdDate.Length >= 14)
            {
                date += bcdDate.Substring(8, 2) + "时" + bcdDate.Substring(10, 2) + "分" + bcdDate.Substring(12, 2) + "秒";
            }
            return date;
        }

        /// <summary>
        /// 返回定长数据，左边不够补0，长度多出取右边长度
        /// </summary>
        /// <param name="str"></param>
        /// <param name="len"></param>
        /// <param name="c"></param>
        /// <returns></returns>
        public static string PadLeft(string str, int len, char c)
        {
            str = str.PadLeft(len, c);
            str = str.Substring(str.Length - len, len);
            return str;
        }
        /// <summary>
        /// 返回定长数据，左边不够补0，长度多出取右边长度 默认填充'0'
        /// </summary>
        /// <param name="str"></param>
        /// <param name="len"></param>
        /// <returns></returns>
        public static string PadLeft(string str, int len)
        {
            return PadLeft(str, len, '0');
        }

        /// <summary>
        /// 返回定长数据，右边不够补0，长度多出取左边长度
        /// </summary>
        /// <param name="str"></param>
        /// <param name="len"></param>
        /// <param name="c"></param>
        /// <returns></returns>
        public static string PadRight(string str, int len, char c)
        {
            str = str.PadRight(len, c);
            str = str.Substring(0, len);
            return str;
        }
        /// <summary>
        /// 返回定长数据，右边不够补0，长度多出取左边长度 默认填充'0'
        /// </summary>
        /// <param name="str"></param>
        /// <param name="len"></param>
        /// <returns></returns>
        public static string PadRight(string str, int len)
        {
            return PadRight(str, len, '0');
        }


        public static string GetSlzrBusno(byte[] buffer, int offset)
        {
            if (buffer.Length < offset + 4)
            {
                return "";
            }
            StringBuilder busno = new StringBuilder();
            for (int i = offset; i < offset + 4; i++)
            {
                if (buffer[i] > 0xA0)
                {
                    busno.Append((char)(buffer[i] - 0xA0));
                }
                else
                {
                    busno.Append(buffer[i].ToString("X2"));
                }
            }
            return busno.ToString();
        }

        public static bool IsHex(string? v)
        {
            if (string.IsNullOrEmpty(v)) return false;
            return HexRegex().IsMatch(v);
        }

        [System.Text.RegularExpressions.GeneratedRegex(@"^[0-9A-Fa-f]+$")]
        private static partial System.Text.RegularExpressions.Regex HexRegex();
    }

}
