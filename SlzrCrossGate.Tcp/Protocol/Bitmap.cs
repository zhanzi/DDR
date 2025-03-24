using System;
using System.Collections.Generic;
using System.Text;
using System.Collections;

namespace SlzrCrossGate.Tcp.Protocol
{
    internal class Bitmap
    {
        //ISO 8583 �������������128
        internal const int FieldCount = 128;
        private BitArray array;

        public Bitmap()
        {
            this.array = new BitArray(Bitmap.FieldCount);
        }
        public Bitmap(byte[] map)
        {
            Array.Reverse(map);
            this.array = new BitArray(map);
            Array.Reverse(map);
        }
        /// <summary>
        /// ��ȡһ��ֵ��ָʾλͼ�Ƿ���ȫ128�ֶεġ�
        /// </summary>
        public bool IsFull
        {
            get
            {
                byte[] thisMap = this.GetBytes();
                for (int i = 0; i < thisMap.Length; i++)
                {
                    if (thisMap[i] != 255)
                        return false;
                }
                return true;
            }
        }

        public byte[] GetBytes()
        {
            byte[] map = new byte[16];
            this.array.CopyTo(map, 0);
            Array.Reverse(map);
            return map;
        }

        public bool Get(int bitNum)
        {
            return this.array.Get(FieldCount - bitNum);
        }
        public void Set(int bitNum, bool value)
        {
            this.array.Set(FieldCount - bitNum, value);
        }
        public void CopyTo(Array array, int index)
        {
            byte[] map = this.GetBytes();
            map.CopyTo(array, index);
        }
        public bool IsEqual(byte[] map)
        {
            byte[] thisMap = this.GetBytes();
            if (thisMap.Length != map.Length)
                return false;
            for (int i = 0; i < map.Length; i++)
                if (map[i] != thisMap[i])
                    return false;
            return true;
        }
    }
}
