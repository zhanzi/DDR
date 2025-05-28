// SlzrCrossGate.Core/Repositories/MessageRepository.cs
using SlzrCrossGate.Core.Database;
using SlzrCrossGate.Core.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using SlzrCrossGate.Core.DTOs;
using SlzrCrossGate.Core.Service;

namespace SlzrCrossGate.Core.Repositories
{
    public class MsgBoxRepository : Repository<MsgBox>
    {
        private readonly TcpDbContext _tcpContext;

        public MsgBoxRepository(TcpDbContext context) : base(context)
        {
            _tcpContext = context;
        }

        //获取第一条未回复消息
        public async Task<MsgReadDto?> GetFirstUnRepliedMessageAsync(string terminalId, string merchantId)
        {
            var query = from msgbox in _tcpContext.MsgBoxes
                        join msgcontent in _tcpContext.MsgContents on msgbox.MsgContentID equals msgcontent.ID
                        join msgtype in _tcpContext.MsgTypes on msgcontent.MsgTypeID equals msgtype.ID
                        where msgbox.MerchantID == merchantId && msgbox.TerminalID == terminalId && msgbox.Status != MessageStatus.Replied
                        select new MsgReadDto
                        {
                            CodeType = msgtype.CodeType,
                            Content = msgcontent.Content,
                            ID = msgcontent.ID,
                            MsgTypeID = msgcontent.MsgTypeID
                        };
            return await query.FirstOrDefaultAsync();
        }

        //修改消息为已读状态
        public async Task MarkMessageAsReadAsync(int messageId)
        {
            var message = await GetByIdAsync(messageId);
            if (message != null)
            {
                message.Status = MessageStatus.Read;
                message.ReadTime = DateTime.Now;
                await _tcpContext.SaveChangesAsync();
            }
        }

        //修改消息为已回复状态
        public async Task MarkMessageAsRepliedAsync(IEnumerable<MsgConfirmDto> msgConfirmDtos)
        {
            var confirmDtoIds = msgConfirmDtos.Select(c => c.ID).ToArray();
            var messages = await FindAsync(m => confirmDtoIds.Contains(m.ID));

            var confirmDtoDict = msgConfirmDtos.ToDictionary(c => c.ID);
            foreach (var message in messages)
            {
                if (confirmDtoDict.TryGetValue(message.ID, out var confirmDto))
                {
                    message.Status = MessageStatus.Replied;
                    message.ReplyCode = confirmDto.ReplyCode;
                    message.ReplyContent = confirmDto.ReplyContent;
                    message.ReplyTime = DateTime.Now;
                }
            }

            await _tcpContext.SaveChangesAsync();
        }

        public List<KeyValuePair<string, int>> GetTerminalUnreadCount() {
            var terminalMsgCount = _tcpContext.MsgBoxes.Where(p => p.Status != MessageStatus.Replied).GroupBy(p => p.TerminalID)
                .Select(g => new KeyValuePair<string, int>(g.Key, g.Count()))
                .ToList();
            return terminalMsgCount;
        }
    }
}
