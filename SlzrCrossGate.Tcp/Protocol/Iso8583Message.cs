using Azure.Core;
using Microsoft.Extensions.DependencyInjection;
using SlzrCrossGate.Core.Models;
using System;
using System.Collections.Generic;
using System.Formats.Tar;
using System.Linq;
using System.Reflection.PortableExecutable;
using System.Text;
using System.Threading.Tasks;

namespace SlzrCrossGate.Tcp.Protocol
{
    public class Iso8583Message
    {
        private Iso8583Package _iso8583Package;

        public Iso8583Message(Iso8583Schema schema)
        {
            _iso8583Package = new Iso8583Package(schema);
        }

        public static Iso8583Message Create(IServiceProvider serviceProvider)
        {
            return new Iso8583Message(serviceProvider.GetRequiredService<Iso8583Schema>());
        }

        public static Iso8583Message Create(IServiceProvider serviceProvider, byte[] buffer)
        {
            var message = new Iso8583Message(serviceProvider.GetRequiredService<Iso8583Schema>());
            message.Parse(buffer);
            return message;
        }

        public string TerimalID { get; private set; } = "";
        public string MerchantID { get; private set; } = "";
        public string MachineID { get; private set; } = "";
        public string DeviceNO { get; private set; } = "";
        public string LineNO { get; private set; } = "";

        public string MessageType { get => _iso8583Package.MessageType; set => value = _iso8583Package.MessageType; }
        public bool Exist(int fieldNo) => _iso8583Package.ExistValue(fieldNo);
        public void SetField(int fieldNo, object value) => _iso8583Package.SetField(fieldNo, value);

        public void SetDateTime(int fieldNo, DateTime value) => _iso8583Package.SetDateTime(fieldNo, value);

        public T GetField<T>(int fieldNo) => _iso8583Package.GetField<T>(fieldNo);
        public string GetString(int fieldNo) => GetField<string>(fieldNo);
        public byte[] GetBytes(int fieldNo) => GetField<byte[]>(fieldNo);
        public void Parse(byte[] data)
        {
            _iso8583Package.ParseMessage(data);

            if (this.Exist(7)) TerminalType = this.GetString(7);
            if (this.Exist(8)) ProtocolVer = this.GetString(8);
            if (this.Exist(41))
            {
                MachineID = this.GetString(41);
                TerimalID = $"{TerminalType}-{MachineID}";
            }
            if (this.Exist(42)) MerchantID = this.GetString(42);
            if (this.Exist(43)) LineNO = this.GetString(43);
            if (this.Exist(44)) DeviceNO = this.GetString(44);
            
            
        }
        public byte[] Pack(bool needReLogin = false, int msgcount = 0) => _iso8583Package.PackSendBuffer(needReLogin, msgcount);
        public byte[] GetCurBuffer() => _iso8583Package.GetCurBuffer();


        public string ProtocolVer { get; private set; } = "";
        public string TerminalType { get; private set; } = "";
    }
}
