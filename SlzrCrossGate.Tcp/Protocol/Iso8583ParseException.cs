using System;

namespace SlzrCrossGate.Tcp.Protocol
{
    /// <summary>
    /// ISO8583 报文解析异常
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

    public class Iso8583FieldeException : Exception
    {
        public Iso8583FieldeException()
        {
        }

        public Iso8583FieldeException(string message)
            : base(message)
        {
        }

        public Iso8583FieldeException(string message, Exception innerException)
            : base(message, innerException)
        {
        }
    }
}
