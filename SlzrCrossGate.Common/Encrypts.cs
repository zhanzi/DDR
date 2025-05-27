using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace SlzrCrossGate.Common
{
    public static class Encrypts
    {

        public static byte[] Encrypt(byte[] original, byte[] key)
        {
            using (var des = TripleDES.Create())
            {
                des.Key = key;
                des.Mode = CipherMode.ECB;
                return des.CreateEncryptor().TransformFinalBlock(original, 0, original.Length);
            }
        }

        public static byte[] Decrypt(byte[] encrypted, byte[] key)
        {
            using (var des = TripleDES.Create())
            {
                des.Key = key;
                des.Mode = CipherMode.ECB;
                return des.CreateDecryptor().TransformFinalBlock(encrypted, 0, encrypted.Length);
            }
        }

        private static readonly byte[] _iv = new byte[8];
        public static byte[] encrypt_3des(byte[] source, byte[] key)
        {
            return encrypt_3des(source, key, _iv);
        }

        public static byte[] encrypt_3des(byte[] source, byte[] key, byte[] iv )
        {
            using (var des3 = TripleDES.Create())
            {
                des3.Key = key;
                des3.Mode = CipherMode.CBC;
                des3.Padding = PaddingMode.None;
                des3.IV = iv;
                var transfer = des3.CreateEncryptor(key, iv);
                return transfer.TransformFinalBlock(source, 0, source.Length);
            }
        }
        public static byte[] decrypt_3des(byte[] source, byte[] key)
        {
            return decrypt_3des(source, key, _iv);
        }
        public static byte[] decrypt_3des(byte[] source, byte[] key, byte[] iv)
        {
            using (var des3 = TripleDES.Create())
            {
                des3.Mode = CipherMode.CBC;
                des3.Padding = PaddingMode.None;
                var transfer = des3.CreateDecryptor(key, iv);
                return transfer.TransformFinalBlock(source, 0, source.Length);
            }
        }

        public static string encrypt_3des(string sourceHex, string keyHex)
        {
            byte[] source = new byte[sourceHex.Length / 2];
            byte[] key = new byte[keyHex.Length / 2];
            for (int i = 0; i < source.Length; i++)
            {
                source[i] = Convert.ToByte(sourceHex.Substring(i * 2, 2), 16);
            }
            for (int i = 0; i < key.Length; i++)
            {
                key[i] = Convert.ToByte(keyHex.Substring(i * 2, 2), 16);
            }
            var result = encrypt_3des(source, key);
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < result.Length; i++)
            {
                sb.Append(result[i].ToString("X2"));
            }
            return sb.ToString();
        }

        public static string decrypt_3des(string sourceHex, string keyHex)
        {
            byte[] source = new byte[sourceHex.Length / 2];
            byte[] key = new byte[keyHex.Length / 2];
            for (int i = 0; i < source.Length; i++)
            {
                source[i] = Convert.ToByte(sourceHex.Substring(i * 2, 2), 16);
            }
            for (int i = 0; i < key.Length; i++)
            {
                key[i] = Convert.ToByte(keyHex.Substring(i * 2, 2), 16);
            }
            var result = decrypt_3des(source, key);
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < result.Length; i++)
            {
                sb.Append(result[i].ToString("X2"));
            }
            return sb.ToString();
        }

        private static string xor(string s1, string s2)
        {
            byte[] s1Bytes = DataConvert.HexToBytes(s1);
            byte[] s2Bytes = DataConvert.HexToBytes(s2);
            List<byte> xorList = new List<byte>();
            for (int i = 0; i < s1Bytes.Length; i++)
            {
                xorList.Add(Convert.ToByte(s1Bytes[i] ^ s2Bytes[i]));
            }
            return DataConvert.BytesToHex(xorList.ToArray());
        }

        public static string MAC(string hexContent, string hexKey, string hexIv = "0000000000000000")
        {
            //初始化偏移
            hexIv = hexIv.PadRight(16, '0');
            //初始化填充
            string hexPadding = "8000000000000000";
            //进行填充（填充至8字节的倍数）
            int hexLen = hexContent.Length;
            String afterCoverStr = hexContent + hexPadding.Substring(0, 16 - hexLen % 16);
            int afterCoverLen = afterCoverStr.Length;
            //将填充后的十六进制字符串进行MAB分割（每8字节为一组）
            int mabLen = afterCoverLen / 16;
            String[] mab = new String[mabLen];

            for (int i = 0; i < mabLen; i++)
            {
                mab[i] = afterCoverStr.Substring(i * 16, 16);
            }
            //获取左半部密钥（密钥必须是16字节的，左半部密钥为前8字节）
            string leftKey = hexKey.Substring(0, 16);
            //初始化算法服务

            var desPrivider = DES.Create();
            desPrivider.IV = DataConvert.HexToBytes(hexIv);
            desPrivider.Mode = CipherMode.ECB;
            desPrivider.Key = DataConvert.HexToBytes(leftKey);
            var des = desPrivider.CreateEncryptor();

            //定义算法过程变量，其中I的初始值为第一个MAB与偏移做异或
            String I = xor(hexIv, mab[0]);
            String O = string.Empty;
            //循环异或
            for (int i = 1; i < mabLen; i++)
            {
                byte[] ob = new byte[8];
                des.TransformBlock(DataConvert.HexToBytes(I), 0, 8, ob, 0);
                O = DataConvert.BytesToHex(ob);
                I = xor(mab[i], O);
            }
            //使用3DES算法加密最后的I值得到MAC
            var des3Privider = TripleDES.Create();
            des3Privider.Key = DataConvert.HexToBytes(hexKey);
            des3Privider.IV = DataConvert.HexToBytes(hexIv);
            des3Privider.Mode = CipherMode.ECB;
            var des3 = des3Privider.CreateEncryptor();

            var macbyte = new byte[8];
            des3.TransformBlock(DataConvert.HexToBytes(I), 0, 8, macbyte, 0);
            return DataConvert.BytesToHex(macbyte);
        }


        public static byte[] GetMac(byte[] source, byte[] key)
        {
            var mac = MAC(DataConvert.BytesToHex(source), DataConvert.BytesToHex(key));
            return DataConvert.HexToBytes(mac.Substring(0, 8));
        }


        public static bool ChcekMac(byte[] source, byte[] mac, byte[] key)
        {
            if (mac.Length != 4)
            {
                return false;
            }
            //key = new byte[] { 0x12,0x33,0x32,0x44,0x55,0x89,0x44,0x22, 0x12, 0x33, 0x32, 0x44, 0x55, 0x89, 0x43, 0x22 };
            var mac2 = GetMac(source, key);
            for (int i = 0; i < mac2.Length; i++)
            {
                if (mac2[i] != mac[i])
                {
                    return false;
                }
            }
            return true;
        }

        //计算MD5哈希值
        public static string ComputeMD5(string input)
        {
            using (var md5 = MD5.Create())
            {
                byte[] inputBytes = Encoding.UTF8.GetBytes(input);
                byte[] hashBytes = md5.ComputeHash(inputBytes);
                return BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();
            }
        }
    }
}
