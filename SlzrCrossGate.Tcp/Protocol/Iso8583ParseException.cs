using System;

namespace SlzrCrossGate.Tcp.Protocol
{
    /// <summary>
    /// ISO8583 ���Ľ����쳣
    /// </summary>
    public class Iso8583ParseException : Exception
    {
        public Iso8583ParseException() 
        { 
        }

        public Iso8583ParseException(string message) 
            : base(message)
        {
        }

        public Iso8583ParseException(string message, Exception innerException) 
            : base(message, innerException)
        {
        }
    }
}
