// SlzrCrossGate.Core/Repositories/MessageRepository.cs
using SlzrCrossGate.Core.Database;
using SlzrCrossGate.Core.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using SlzrCrossGate.Core.DTOs;

namespace SlzrCrossGate.Core.Repositories
{
    public class MsgBoxRepository : Repository<MsgBox>
    {
        public MsgBoxRepository(TcpDbContext context) : base(context) { }

        public async Task<List<MsgBox>> GetUnconfirmedMessagesAsync(string terminalId, string merchantId)
        {
            return await _context.MsgBoxes
                .Include(m => m.MsgContent)
                .Where(m => m.TerminalID == terminalId && 
                           m.MerchantID == merchantId &&
                           m.Status == MessageStatus.Pending)
                .ToListAsync();
        }

        //获取第一条未确认消息
        public async Task<MsgReadDto> GetFirstUnconfirmedMessageAsync(string terminalId)
        {
            var query = from msgbox in _context.MsgBoxes
                        join msgcontent in _context.MsgContents on msgbox.MsgContentID equals msgcontent.ID
                        join msgtype in _context.MsgTypes on msgcontent.MsgTypeID equals msgtype.ID
                        where msgbox.TerminalID == terminalId && msgbox.Status == MessageStatus.Unread
                        select new MsgReadDto
                        {
                            CodeType = msgtype.CodeType,
                            Content = msgcontent.Content,
                            ID = msgcontent.ID,
                            MsgTypeID = msgcontent.MsgTypeID
                        };
           await query.FirstOrDefaultAsync();
        }

        //修改消息为已读状态
        public async Task MarkMessageAsReadAsync(int messageId)
        {
            var message = await _context.MsgBoxes
                .FirstOrDefaultAsync(m => m.ID == messageId);
            if (message != null)
            {
                message.Status = MessageStatus.Read;
                message.ReadTime = DateTime.Now;
                await _context.SaveChangesAsync();
            }
        }

        public async Task MarkMessageAsRepliedAsync(IEnumerable<MsgConfirmDto> msgConfirmDtos)
        {
            var confirmDtoIds = msgConfirmDtos.Select(c => c.ID).ToArray();
            var messages = await _context.MsgBoxes
                .Where(m => confirmDtoIds.Contains(m.ID))
                .ToListAsync();

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

            await _context.SaveChangesAsync();
        }
    }
}
