using System;

namespace SlzrCrossGate.Tcp
{
    [AttributeUsage(AttributeTargets.Class, Inherited = false, AllowMultiple = false)]
    public sealed class MessageTypeAttribute : Attribute
    {
        public string MessageType { get; }

        public MessageTypeAttribute(string messageType)
        {
            MessageType = messageType;
        }
    }
}
