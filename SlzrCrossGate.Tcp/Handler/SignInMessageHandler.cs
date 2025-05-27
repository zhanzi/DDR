using Microsoft.Extensions.Logging;
using SlzrCrossGate.Common;
using SlzrCrossGate.Core.Models;
using SlzrCrossGate.Core.Service.BusinessServices;
using SlzrCrossGate.Tcp.Protocol;
using System.IO;
using System.Text;

namespace SlzrCrossGate.Tcp.Handler
{
    [MessageType(Iso8583MessageType.SignInRequest)]
    public class SignInMessageHandler : IIso8583MessageHandler
    {
        private readonly ILogger<SignInMessageHandler> _logger;
        private readonly Iso8583Schema _schema;
        private readonly TerminalEventService _terminalEventService;
        private readonly TerminalSignService _terminalSignService;

        public SignInMessageHandler(ILogger<SignInMessageHandler> logger,Iso8583Schema schema,
            TerminalEventService terminalEventService, TerminalSignService terminalSignService)
        {
            _logger = logger;
            _schema = schema;
            _terminalEventService = terminalEventService;
            _terminalSignService = terminalSignService;
        }

        public async Task<Iso8583Message> HandleMessageAsync(TcpConnectionContext context, Iso8583Message message)
        {
            var signDto = new Core.DTOs.TerminalSignDto
            {
                ID = message.TerimalID,
                MerchantID = message.MerchantID,
                MachineID = message.MachineID,
                DeviceNO = message.DeviceNO,
                LineNO = message.LineNO,
                TerminalType = message.TerminalType,
                ClientFileVersionsMetaData = GetClientFiles(message.GetString(45), message.ProtocolVer),
                PropertiesMetaData = GetPropertys(message.GetString(54)),
            };

            // 签到成功响应
            var response = new Iso8583Message(_schema, Iso8583MessageType.SignInResponse);

            //检查终端是否存在，不存在则添加
            if (_terminalSignService.CheckTerminalExists(message.TerimalID))
            {
                await _terminalSignService.AddTerminal(signDto);
                response.SetField(46, "");
            }
            else
            {
                await _terminalSignService.ProcessPropertyAndVersionUpdated(signDto);
                var expectedVersions = _terminalSignService.QueryExpectedVersions(message.TerimalID);
                var serverExpectedVersions = ConvertToExpectedVersionsForTerminal(expectedVersions, message.ProtocolVer);

                response.SetField(46, serverExpectedVersions);
            }
            var token = Encrypts.ComputeMD5($"slzr-token-{message.TerimalID}-{DateTime.Now.ToString("yyyyMMdd")}");
            response.SetField(40, token);
            var mackey = Encrypts.ComputeMD5($"slzr-mackey-{message.TerimalID}");
            response.SetField(53, mackey);
            response.Ok();

            await _terminalEventService.RecordTerminalEventAsync(
                new TerminalEvent
                {
                    MerchantID = message.MerchantID,
                    TerminalID = message.TerimalID,
                    EventType = TerminalEventType.SignIn,
                    Severity = EventSeverity.Info,
                    Remark = $"Sign in success",
                    Operator = ""
                });

            return response;
        }


        public static Dictionary<string, string> GetPropertys(string content)
        {
            string tag = "";
            Dictionary<string, string> dict = new Dictionary<string, string>();

            //Dictionary<string, string> dict = new Dictionary<string, string>();
            int pos = 0;
            int length = content.Length;
            //string tag = "";
            int len = 0;
            string val = "";
            while (pos + 2 <= length)
            {
                tag = content.Substring(pos, 2);
                pos += 2;
                //len = Convert.ToInt32(content.Substring(pos, 2), 16) * 2;
                len = Convert.ToInt16(content.Substring(pos, 2)) * 2;
                pos += 2;
                if (pos + len > length)
                {
                    break;
                }
                val = DataConvert.HexToString(content.Substring(pos, len));
                pos += len;
                dict.Add(tag, val);
            }
            return dict;
        }

        public static Dictionary<string, string> GetClientFiles(string content, string ver = "0100")
        {
            var len = 10;
            var codeLen = 6;
            int v = Convert.ToInt32(ver, 16);
            if (v >= 0x0200)
            {
                len = 26;
                codeLen = 22;
            }

            var count = content.Length / len;
            Dictionary<string, string> dict = new Dictionary<string, string>();
            string code = "";
            for (int i = 0; i < count; i++)
            {
                code = DataConvert.HexToString(content.Substring(i * len, codeLen)).Replace("\0", "");
                if (!dict.ContainsKey(code))
                {
                    dict.Add(code, content.Substring(i * len + codeLen, 4));
                }
            }
            return dict;
        }




        public static string ConvertToExpectedVersionsForTerminal(Dictionary<string, VersionOptions> dict, string ver = "0100")
        { /*
         
        StringBuilder sb = new StringBuilder();
            for (int i = 0; i < ServerFiles.Length; i++)
            {
                //sb.AppendFormat("{0}{1}{2}", DataConvert.StringToHex(ServerFiles[i].Code), DataConvert.PadLeft(ServerFiles[i].Ver, 4), DataConvert.BytesToHex(DataConvert.intToBytes2(ServerFiles[i].Size)));
                //2017-01-11文件增加crc校验    
                var code = DataConvert.StringToHex(ServerFiles[i].Code).PadRight(22, '0');
                if (ver < 0x0200) {
                    code = DataConvert.StringToHex(ServerFiles[i].Code).Substring(0, 6);
                }
                sb.AppendFormat("{0}{1}{2}{3}", code, DataConvert.PadLeft(ServerFiles[i].Ver, 4), DataConvert.BytesToHex(DataConvert.intToBytes2(ServerFiles[i].Size)), (ServerFiles[i].Crc ?? "00000000").Trim().PadLeft(8, '0'));
            }
            return sb.ToString();

        */

            int verVal = Convert.ToInt32(ver, 16);
            StringBuilder result = new StringBuilder();
            foreach (var item in dict)
            {
                var code = string.Empty;
                if (verVal < 0x0200)
                {
                    code = DataConvert.StringToHex(item.Key).Substring(0, 6);
                }
                else
                {
                    code = DataConvert.StringToHex(item.Key).PadRight(22, '0');
                }
                result.AppendFormat("{0}{1}{2}{3}", code, item.Value.Expected, DataConvert.BytesToHex(DataConvert.intToBytes2(item.Value.ExpectedFileSize)), (item.Value.ExpectedFileCrc ?? "00000000").Trim().PadLeft(8, '0'));
            }
            return result.ToString();
        }
    }
}
