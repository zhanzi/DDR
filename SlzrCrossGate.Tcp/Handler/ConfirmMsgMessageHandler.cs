using Microsoft.Extensions.Logging;
using SlzrCrossGate.Core.DTOs;
using SlzrCrossGate.Core.Services.BusinessServices;
using SlzrCrossGate.Tcp.Protocol;
using System.Globalization;

namespace SlzrCrossGate.Tcp.Handler
{

    [MessageType("0520")]
    public class ConfirmMsgMessageHandler : IIso8583MessageHandler
    {
        private readonly ILogger<ConfirmMsgMessageHandler> _logger;
        private readonly Iso8583Schema _schema;
        private readonly MsgBoxService _msgBoxService;

        public ConfirmMsgMessageHandler(ILogger<ConfirmMsgMessageHandler> logger, Iso8583Schema schema, MsgBoxService msgBoxService)
        {
            _logger = logger;
            _schema = schema;
            _msgBoxService = msgBoxService;
        }


        public async Task<Iso8583Message> HandleMessageAsync(TcpConnectionContext context, Iso8583Message message)
        {
            var content = message.GetString(52);

            var msgConfirmDtos = ConvertToMsgConfirmDtos(content);

            await _msgBoxService.MarkMessageAsRepliedAsync(msgConfirmDtos);

            var response = new Iso8583Message(_schema,"0530");
            //response.SetField(3, "805002");

            response.Ok();

            return response;
        }

        

        static List<MsgConfirmDto> ConvertToMsgConfirmDtos(string content)
        {
            if (string.IsNullOrEmpty(content))
                return new List<MsgConfirmDto>();

            var result = new List<MsgConfirmDto>();
            ReadOnlySpan<char> span = content.AsSpan();
            int pos = 0;
            int length = span.Length;

            while (pos <= length - 20)
            {
                // 解析 MSGLEN (4 chars, 2 bytes per char → actual length = value * 2)
                if (!int.TryParse(span.Slice(pos, 4), NumberStyles.None, CultureInfo.InvariantCulture, out int msgLen))
                    break; // 或 throw new FormatException("Invalid MSGLEN format");
                msgLen *= 2; // 转换为实际字符长度
                pos += 4;

                // 跳过 MSGTYPE (4 chars)
                pos += 4;

                // 解析 MSGID (8 chars, hexadecimal)
                if (!int.TryParse(span.Slice(pos, 8), NumberStyles.HexNumber, CultureInfo.InvariantCulture, out int msgId))
                    break; // 或 throw new FormatException("Invalid MSGID format");
                pos += 8;

                // 解析 RESULTCODE (4 chars)
                var replyCode = span.Slice(pos, 4).ToString();
                pos += 4;

                // 解析 RESULTCONTENT (remaining chars: msgLen - 16)
                int contentLength = msgLen - 16;
                if (contentLength < 0 || pos + contentLength > length)
                    break; // 或 throw new FormatException("Invalid content length");

                var replyContent = span.Slice(pos, contentLength).ToString();
                pos += contentLength;

                result.Add(new MsgConfirmDto
                {
                    ID = msgId,
                    ReplyCode = replyCode,
                    ReplyContent = replyContent
                });
            }

            return result;
        }

    }
}
