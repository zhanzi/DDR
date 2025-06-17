using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Minio.DataModel.Notification;
using SlzrCrossGate.Core.Database;
using SlzrCrossGate.Core.Models;
using SlzrCrossGate.Core.Service;
using SlzrCrossGate.Core.Service.BusinessServices;
using SlzrCrossGate.WebAdmin.DTOs;
using SlzrCrossGate.WebAdmin.Services;
using System.Security.Claims;

namespace SlzrCrossGate.WebAdmin.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class MessagesController : ControllerBase
    {
        private readonly TcpDbContext _dbContext;
        private readonly UserService _userService;
        private readonly TerminalEventPublishService _terminalEventPublishService;
        private readonly ILogger<MessagesController> _logger;

        public MessagesController(
            TcpDbContext dbContext,
            UserService userService,
            TerminalEventPublishService terminalEventPublishService,
            ILogger<MessagesController> logger)
        {
            _dbContext = dbContext;
            _userService = userService;
            _terminalEventPublishService = terminalEventPublishService;
            _logger = logger;
        }

        // GET: api/Messages
        [HttpGet]
        public async Task<ActionResult<PaginatedResult<MessageDto>>> GetMessages(
            [FromQuery] string? merchantId = null,
            [FromQuery] string? msgTypeId = null,
            [FromQuery] string? machineId = null, // 出厂序列号
            [FromQuery] string? deviceNo = null, // 设备编号
            [FromQuery] bool? isRead = null,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            // 获取当前用户的商户ID
            var currentUserMerchantId = await _userService.GetUserMerchantIdAsync(User);
            var isSystemAdmin = User.IsInRole("SystemAdmin");

            // 如果不是系统管理员，只能查看自己商户的消息
            if (!isSystemAdmin && merchantId != null && merchantId != currentUserMerchantId)
            {
                return Forbid();
            }

            // 如果不是系统管理员且未指定商户ID，则使用当前用户的商户ID
            if (!isSystemAdmin && merchantId == null)
            {
                merchantId = currentUserMerchantId;
            }

            // 构建联结查询
            var query = from msgBox in _dbContext.MsgBoxes
                        join msgContent in _dbContext.MsgContents on msgBox.MsgContentID equals msgContent.ID into msgContentJoin
                        from msgContent in msgContentJoin.DefaultIfEmpty()
                        join msgType in _dbContext.MsgTypes on msgContent.MsgTypeID equals msgType.ID into msgTypeJoin
                        from msgType in msgTypeJoin.DefaultIfEmpty()
                        join terminal in _dbContext.Terminals on msgBox.TerminalID equals terminal.ID into terminalJoin
                        from terminal in terminalJoin.DefaultIfEmpty()
                        join merchant in _dbContext.Merchants on msgBox.MerchantID equals merchant.MerchantID into merchantJoin
                        from merchant in merchantJoin.DefaultIfEmpty()
                        select new
                        {
                            msgBox.ID,
                            msgBox.MerchantID,
                            msgBox.TerminalID,
                            msgBox.MsgContentID,
                            CreateTime = msgBox.SendTime,
                            IsRead = msgBox.Status == MessageStatus.Read || msgBox.Status == MessageStatus.Replied,
                            msgBox.ReadTime,
                            MerchantName = merchant.Name,
                            TerminalMachineID = terminal.MachineID,
                            TerminalDeviceNO = terminal.DeviceNO,
                            TerminalLineNO = terminal.LineNO,
                            MsgTypeID = msgContent.MsgTypeID,
                            MsgTypeName = msgType.Name,
                            Content = msgContent.Content,
                            Operator = msgContent.Operator
                        };

            // 应用筛选条件
            if (!string.IsNullOrEmpty(merchantId))
            {
                query = query.Where(m => m.MerchantID == merchantId);
            }

            if (!string.IsNullOrEmpty(msgTypeId))
            {
                query = query.Where(m => m.MsgTypeID == msgTypeId);
            }

            if (!string.IsNullOrEmpty(machineId))
            {
                query = query.Where(m => m.TerminalMachineID == machineId);
            }

            if (!string.IsNullOrEmpty(deviceNo))
            {
                query = query.Where(m => m.TerminalDeviceNO == deviceNo);
            }

            if (isRead.HasValue)
            {
                query = query.Where(m => m.IsRead == isRead.Value);
            }

            if (startDate.HasValue)
            {
                query = query.Where(m => m.CreateTime >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(m => m.CreateTime <= endDate.Value);
            }

            // 获取总记录数
            var count = await query.CountAsync();

            // 应用分页和排序
            var messages = await query
                .OrderByDescending(m => m.CreateTime)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // 转换为DTO
            var messageDtos = messages.Select(m => new MessageDto
            {
                ID = m.ID,
                MerchantID = m.MerchantID,
                TerminalID = m.TerminalID,
                MsgContentID = m.MsgContentID,
                CreateTime = m.CreateTime,
                IsRead = m.IsRead,
                ReadTime = m.ReadTime,
                MerchantName = m.MerchantName,
                TerminalDeviceNO = m.TerminalDeviceNO,
                TerminalLineNO = m.TerminalLineNO,
                MsgTypeID = m.MsgTypeID,
                MsgTypeName = m.MsgTypeName,
                Content = m.Content,
                Operator = m.Operator
            }).ToList();

            return new PaginatedResult<MessageDto>
            {
                Items = messageDtos,
                TotalCount = count,
                Page = page,
                PageSize = pageSize
            };
        }

        // GET: api/Messages/5
        [HttpGet("{id}")]
        public async Task<ActionResult<MessageDto>> GetMessage(int id)
        {
            // 获取当前用户的商户ID
            var currentUserMerchantId = await _userService.GetUserMerchantIdAsync(User);
            var isSystemAdmin = User.IsInRole("SystemAdmin");

            // 使用联结查询获取消息详情
            var message = await (from msgBox in _dbContext.MsgBoxes
                               join msgContent in _dbContext.MsgContents on msgBox.MsgContentID equals msgContent.ID into msgContentJoin
                               from msgContent in msgContentJoin.DefaultIfEmpty()
                               join msgType in _dbContext.MsgTypes on msgContent.MsgTypeID equals msgType.ID into msgTypeJoin
                               from msgType in msgTypeJoin.DefaultIfEmpty()
                               join terminal in _dbContext.Terminals on msgBox.TerminalID equals terminal.ID into terminalJoin
                               from terminal in terminalJoin.DefaultIfEmpty()
                               join merchant in _dbContext.Merchants on msgBox.MerchantID equals merchant.MerchantID into merchantJoin
                               from merchant in merchantJoin.DefaultIfEmpty()
                               where msgBox.ID == id
                               select new
                               {
                                   msgBox.ID,
                                   msgBox.MerchantID,
                                   msgBox.TerminalID,
                                   msgBox.MsgContentID,
                                   CreateTime = msgBox.SendTime,
                                   IsRead = msgBox.Status == MessageStatus.Read || msgBox.Status == MessageStatus.Replied,
                                   msgBox.ReadTime,
                                   MerchantName = merchant.Name,
                                   TerminalDeviceNO = terminal.DeviceNO,
                                   TerminalLineNO = terminal.LineNO,
                                   MsgTypeID = msgContent.MsgTypeID,
                                   MsgTypeName = msgType.Name,
                                   Content = msgContent.Content,
                                   Operator = msgContent.Operator
                               }).FirstOrDefaultAsync();

            if (message == null)
            {
                return NotFound();
            }

            // 如果不是系统管理员，只能查看自己商户的消息
            if (!isSystemAdmin && message.MerchantID != currentUserMerchantId)
            {
                return Forbid();
            }

            return new MessageDto
            {
                ID = message.ID,
                MerchantID = message.MerchantID,
                TerminalID = message.TerminalID,
                MsgContentID = message.MsgContentID,
                CreateTime = message.CreateTime,
                IsRead = message.IsRead,
                ReadTime = message.ReadTime,
                MerchantName = message.MerchantName,
                TerminalDeviceNO = message.TerminalDeviceNO,
                TerminalLineNO = message.TerminalLineNO,
                MsgTypeID = message.MsgTypeID,
                MsgTypeName = message.MsgTypeName,
                Content = message.Content,
                Operator = message.Operator
            };
        }

        // POST: api/Messages/Send
        [HttpPost("Send")]
        public async Task<ActionResult<MessageSendResultDto>> SendMessage(SendMessageDto model)
        {
            // 获取当前用户的商户ID和用户名
            var currentUserMerchantId = await _userService.GetUserMerchantIdAsync(User);
            var isSystemAdmin = User.IsInRole("SystemAdmin");
            var username = UserService.GetUserNameForOperator(User);

            // 验证终端列表
            var terminals = await _dbContext.Terminals
                .Where(t => model.TerminalIds.Contains(t.ID) && !t.IsDeleted)
                .ToListAsync();

            if (terminals.Count == 0)
            {
                return BadRequest("No valid terminals found");
            }

            // 如果不是系统管理员，只能向自己商户的终端发送消息
            if (!isSystemAdmin && terminals.Any(t => t.MerchantID != currentUserMerchantId))
            {
                return Forbid();
            }

            // 验证消息类型
            var msgType = await _dbContext.MsgTypes.FirstOrDefaultAsync(m => m.ID == model.MsgTypeCode);
            if (msgType == null)
            {
                return BadRequest("Invalid message type");
            }

            // 创建消息内容
            var msgContent = new MsgContent
            {
                MerchantID = terminals.First().MerchantID,
                MsgTypeID = model.MsgTypeCode,
                Content = model.Content,
                CreateTime = DateTime.Now,
                Operator = username
            };

            await _dbContext.MsgContents.AddAsync(msgContent);
            await _dbContext.SaveChangesAsync();

            // 为每个终端创建消息
            var msgBoxes = terminals.Select(t => new MsgBox
            {
                MerchantID = t.MerchantID,
                TerminalID = t.ID,
                MsgContentID = msgContent.ID,
                SendTime = DateTime.Now,
                Status = MessageStatus.Unread,
                ReadTime = null
            }).ToList();

            await _dbContext.MsgBoxes.AddRangeAsync(msgBoxes);
            await _dbContext.SaveChangesAsync();

            // 记录事件
            foreach (var terminal in terminals)
            {
                 await _terminalEventPublishService.PublishTerminalEventAsync(new TerminalEventMessage
                {
                    MerchantID = terminal.MerchantID,
                    TerminalID = terminal.ID,
                    EventType = TerminalEventType.MessageSent,
                    Severity = EventSeverity.Info,
                    Remark = $"Message sent: Type={model.MsgTypeCode}, Content={model.Content}",
                    Operator = username
                });

            }

            return new MessageSendResultDto
            {
                MessageId = msgContent.ID,
                TerminalCount = terminals.Count,
                MessageType = msgType.Name,
                Content = model.Content,
                SendTime = msgContent.CreateTime
            };
        }

        // POST: api/Messages/SendByLine
        [HttpPost("SendByLine")]
        public async Task<ActionResult<MessageSendResultDto>> SendMessageByLine(SendMessageByLineDto model)
        {
            // 获取当前用户的商户ID和用户名
            var currentUserMerchantId = await _userService.GetUserMerchantIdAsync(User);
            var isSystemAdmin = User.IsInRole("SystemAdmin");
            var username = UserService.GetUserNameForOperator(User);

            // 如果不是系统管理员，只能向自己商户的终端发送消息
            if (!isSystemAdmin && model.MerchantId != currentUserMerchantId)
            {
                return Forbid();
            }

            // 验证消息类型
            var msgType = await _dbContext.MsgTypes.FirstOrDefaultAsync(m => m.ID == model.MsgTypeCode);
            if (msgType == null)
            {
                return BadRequest("Invalid message type");
            }

            // 查找指定线路的终端
            var terminals = await _dbContext.Terminals
                .Where(t => t.MerchantID == model.MerchantId && t.LineNO == model.LineNo && !t.IsDeleted)
                .ToListAsync();

            if (terminals.Count == 0)
            {
                return BadRequest("No terminals found for the specified line");
            }

            // 创建消息内容
            var msgContent = new MsgContent
            {
                MerchantID = model.MerchantId,
                MsgTypeID = model.MsgTypeCode,
                Content = model.Content,
                CreateTime = DateTime.Now,
                Operator = username
            };

            await _dbContext.MsgContents.AddAsync(msgContent);
            await _dbContext.SaveChangesAsync();

            // 为每个终端创建消息
            var msgBoxes = terminals.Select(t => new MsgBox
            {
                MerchantID = t.MerchantID,
                TerminalID = t.ID,
                MsgContentID = msgContent.ID,
                SendTime = DateTime.Now,
                Status = MessageStatus.Unread,
                ReadTime = null
            }).ToList();

            await _dbContext.MsgBoxes.AddRangeAsync(msgBoxes);
            await _dbContext.SaveChangesAsync();

            // 记录事件
            foreach (var terminal in terminals)
            {
                 await _terminalEventPublishService.PublishTerminalEventAsync(new TerminalEventMessage
                {
                    MerchantID = terminal.MerchantID,
                    TerminalID = terminal.ID,
                    EventType = TerminalEventType.MessageSent,
                    Severity = EventSeverity.Info,
                    Remark = $"Message sent to line: Type={model.MsgTypeCode}, Content={model.Content}",
                    Operator = username
                });
            }

            return new MessageSendResultDto
            {
                MessageId = msgContent.ID,
                TerminalCount = terminals.Count,
                MessageType = msgType.Name,
                Content = model.Content,
                SendTime = msgContent.CreateTime
            };
        }

        // POST: api/Messages/SendToMerchant
        [HttpPost("SendToMerchant")]
        public async Task<ActionResult<MessageSendResultDto>> SendMessageToMerchant(SendMessageToMerchantDto model)
        {
            // 获取当前用户的商户ID和用户名
            var currentUserMerchantId = await _userService.GetUserMerchantIdAsync(User);
            var isSystemAdmin = User.IsInRole("SystemAdmin");
            var username = UserService.GetUserNameForOperator(User);

            // 如果不是系统管理员，只能向自己商户的终端发送消息
            if (!isSystemAdmin && model.MerchantId != currentUserMerchantId)
            {
                return Forbid();
            }

            // 验证消息类型
            var msgType = await _dbContext.MsgTypes.FirstOrDefaultAsync(m => m.ID == model.MsgTypeCode);
            if (msgType == null)
            {
                return BadRequest("Invalid message type");
            }

            // 查找商户的所有终端
            var terminals = await _dbContext.Terminals
                .Where(t => t.MerchantID == model.MerchantId && !t.IsDeleted)
                .ToListAsync();

            if (terminals.Count == 0)
            {
                return BadRequest("No terminals found for the specified merchant");
            }

            // 创建消息内容
            var msgContent = new MsgContent
            {
                MerchantID = model.MerchantId,
                MsgTypeID = model.MsgTypeCode,
                Content = model.Content,
                CreateTime = DateTime.Now,
                Operator = username
            };

            await _dbContext.MsgContents.AddAsync(msgContent);
            await _dbContext.SaveChangesAsync();

            // 为每个终端创建消息
            var msgBoxes = terminals.Select(t => new MsgBox
            {
                MerchantID = t.MerchantID,
                TerminalID = t.ID,
                MsgContentID = msgContent.ID,
                SendTime = DateTime.Now,
                Status = MessageStatus.Unread,
                ReadTime = null
            }).ToList();

            await _dbContext.MsgBoxes.AddRangeAsync(msgBoxes);
            await _dbContext.SaveChangesAsync();

            // 记录事件
            foreach (var terminal in terminals)
            {
                 await _terminalEventPublishService.PublishTerminalEventAsync(new TerminalEventMessage
                {
                    MerchantID = terminal.MerchantID,
                    TerminalID = terminal.ID,
                    EventType = TerminalEventType.MessageSent,
                    Severity = EventSeverity.Info,
                    Remark = $"Message sent to merchant: Type={model.MsgTypeCode}, Content={model.Content}",
                    Operator = username
                });
            }

            return new MessageSendResultDto
            {
                MessageId = msgContent.ID,
                TerminalCount = terminals.Count,
                MessageType = msgType.Name,
                Content = model.Content,
                SendTime = msgContent.CreateTime
            };
        }

        // GET: api/Messages/Stats
        [HttpGet("Stats")]
        public async Task<ActionResult<MessageStatsDto>> GetMessageStats([FromQuery] string? merchantId = null)
        {
            // 获取当前用户的商户ID
            var currentUserMerchantId = await _userService.GetUserMerchantIdAsync(User);
            var isSystemAdmin = User.IsInRole("SystemAdmin");

            // 如果不是系统管理员，只能查看自己商户的消息统计
            if (!isSystemAdmin && merchantId != null && merchantId != currentUserMerchantId)
            {
                return Forbid();
            }

            // 如果不是系统管理员且未指定商户ID，则使用当前用户的商户ID
            if (!isSystemAdmin && merchantId == null)
            {
                merchantId = currentUserMerchantId;
            }

            // 构建查询
            var query = _dbContext.MsgBoxes.AsQueryable();

            // 应用商户筛选
            if (!string.IsNullOrEmpty(merchantId))
            {
                query = query.Where(m => m.MerchantID == merchantId);
            }

            // 获取统计数据
            var totalCount = await _dbContext.MsgBoxes.CountAsync();
            var readCount = await _dbContext.MsgBoxes.CountAsync(m => m.Status == MessageStatus.Read || m.Status == MessageStatus.Replied);
            var unreadCount = await _dbContext.MsgBoxes.CountAsync(m => m.Status == MessageStatus.Unread);

            // 获取最近7天的消息数量
            var last7Days = Enumerable.Range(0, 7)
                .Select(i => DateTime.Today.AddDays(-i))
                .ToList();

            var dailyStats = new List<DailyMessageStatsDto>();

            foreach (var date in last7Days)
            {
                var nextDate = date.AddDays(1);
                var count = await _dbContext.MsgBoxes.CountAsync(m => m.SendTime >= date && m.SendTime < nextDate);

                dailyStats.Add(new DailyMessageStatsDto
                {
                    Date = date,
                    Count = count
                });
            }

            return new MessageStatsDto
            {
                TotalCount = totalCount,
                ReadCount = readCount,
                UnreadCount = unreadCount,
                DailyStats = dailyStats
            };
        }
    }
}
