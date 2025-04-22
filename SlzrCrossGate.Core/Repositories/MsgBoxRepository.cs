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
    public class MsgBoxRepository(TcpDbContext context) : Repository<MsgBox>(context)
    {
        //��ȡ��һ��δ�ظ���Ϣ
        public async Task<MsgReadDto?> GetFirstUnRepliedMessageAsync(string terminalId)
        {
            var query = from msgbox in _context.MsgBoxes
                        join msgcontent in _context.MsgContents on msgbox.MsgContentID equals msgcontent.ID
                        join msgtype in _context.MsgTypes on msgcontent.MsgTypeID equals msgtype.ID
                        where msgbox.TerminalID == terminalId && msgbox.Status != MessageStatus.Replied
                        select new MsgReadDto
                        {
                            CodeType = msgtype.CodeType,
                            Content = msgcontent.Content,
                            ID = msgcontent.ID,
                            MsgTypeID = msgcontent.MsgTypeID
                        };
            return await query.FirstOrDefaultAsync();
        }

        //�޸���ϢΪ�Ѷ�״̬
        public async Task MarkMessageAsReadAsync(int messageId)
        {
            var message = await GetByIdAsync(messageId);
            if (message != null)
            {
                message.Status = MessageStatus.Read;
                message.ReadTime = DateTime.Now;
                await _context.SaveChangesAsync();
            }
        }

        //�޸���ϢΪ�ѻظ�״̬
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

            await _context.SaveChangesAsync();
        }

        public List<KeyValuePair<string, int>> GetTerminalUnreadCount() {
            var terminalMsgCount = context.MsgBoxes.Where(p => p.Status != MessageStatus.Replied).GroupBy(p => p.TerminalID)
                .Select(g => new KeyValuePair<string, int>(g.Key, g.Count()))
                .ToList();
            return terminalMsgCount;
        }
    }
}
