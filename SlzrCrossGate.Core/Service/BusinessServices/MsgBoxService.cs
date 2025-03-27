// SlzrCrossGate.Core/Services/BusinessServices/MessageService.cs
using SlzrCrossGate.Core.Models;
using SlzrCrossGate.Core.Repositories;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using SlzrCrossGate.Core.DTOs;

namespace SlzrCrossGate.Core.Services.BusinessServices
{
    public class MsgBoxService
    {
        private readonly MsgBoxRepository _messageRepository;
        private readonly ILogger<MsgBoxService> _logger;

        public MsgBoxService(
            MsgBoxRepository messageRepository,
            ILogger<MsgBoxService> logger)
        {
            _messageRepository = messageRepository;
            _logger = logger;
        }

        public async Task<MsgReadDto> GetFirstUnreadMessagesAsync(string terminalId)
        {
            try
            {
                return await _messageRepository.GetFirstUnconfirmedMessageAsync(terminalId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting first unread message for terminal {TerminalId}", terminalId);
                throw;
            }
        }

        public async Task MarkMessageAsReadAsync(string terminalId, int messageId)
        {
            try
            {
                await _messageRepository.MarkMessageAsReadAsync(messageId);
                _logger.LogInformation("Message {MessageId} marked as read by terminal {TerminalId}", messageId, terminalId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking message {MessageId} as read by terminal {TerminalId}", messageId, terminalId);
                throw;
            }
        }

        public async Task MarkMessageAsRepliedAsync(IEnumerable<MsgConfirmDto> msgConfirmDtos)
        {
            try
            {
                await _messageRepository.MarkMessageAsRepliedAsync(msgConfirmDtos);
                _logger.LogInformation("{msgConfirmDtos.Count} messages marked as replied", msgConfirmDtos.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error confirming message {MessageId} by terminal {TerminalId}", messageId, terminalId);
                throw;
            }
        }

    }
}
