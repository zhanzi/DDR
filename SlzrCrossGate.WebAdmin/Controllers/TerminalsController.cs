using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
    public class TerminalsController : ControllerBase
    {
        private readonly TcpDbContext _dbContext;
        private readonly TerminalEventPublishService _terminalEventPublishService;
        private readonly UserService _userService;
        private readonly ILogger<TerminalsController> _logger;

        public TerminalsController(
            TcpDbContext dbContext,
            TerminalEventPublishService terminalEventPublishService,
            UserService userService,
            ILogger<TerminalsController> logger)
        {
            _dbContext = dbContext;
            _terminalEventPublishService = terminalEventPublishService;
            _userService = userService;
            _logger = logger;
        }

        // GET: api/Terminals
        [HttpGet]
        public async Task<ActionResult<PaginatedResult<TerminalDto>>> GetTerminals(
            [FromQuery] string? merchantId = null,
            [FromQuery] string? lineNo = null,
            [FromQuery] string? deviceNo = null,
            [FromQuery] string? machineId = null,
            [FromQuery] string? terminalType = null,
            [FromQuery] string? fileType = null,
            [FromQuery] string? fileVersion = null,
            [FromQuery] DeviceActiveStatus? activeStatus = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            // 获取当前用户的商户ID
            var currentUserMerchantId = await _userService.GetUserMerchantIdAsync(User);
            var isSystemAdmin = User.IsInRole("SystemAdmin");

            // 如果不是系统管理员，只能查看自己商户的终端
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
            var query = _dbContext.Terminals
                .Include(t => t.Status)
                .Where(t => !t.IsDeleted)
                .AsQueryable();

            // 应用筛选条件
            if (!string.IsNullOrEmpty(merchantId))
            {
                query = query.Where(t => t.MerchantID == merchantId);
            }

            if (!string.IsNullOrEmpty(lineNo))
            {
                query = query.Where(t => t.LineNO == lineNo);
            }

            if (!string.IsNullOrEmpty(deviceNo))
            {
                query = query.Where(t => t.DeviceNO == deviceNo);
            }

            if (!string.IsNullOrEmpty(machineId))
            {
                query = query.Where(t => t.MachineID == machineId);
            }

            if (!string.IsNullOrEmpty(terminalType))
            {
                query = query.Where(t => t.TerminalType == terminalType);
            }

            if (activeStatus.HasValue)
            {
                query = query.Where(t => t.Status != null && t.Status.ActiveStatus == activeStatus.Value);
            }

            // 文件版本筛选需要特殊处理，因为是JSON字段
            if (!string.IsNullOrEmpty(fileType) && !string.IsNullOrEmpty(fileVersion))
            {
                // 这里需要根据数据库类型进行不同的处理
                // 对于MySQL，可以使用JSON_EXTRACT函数
                // 但由于EF Core的限制，这里我们先获取所有符合其他条件的终端，然后在内存中筛选
                var terminals = await query.ToListAsync();
                var filteredTerminals = terminals.Where(t =>
                    t.Status != null &&
                    t.Status.FileVersionMetadata.TryGetValue(fileType, out var version) &&
                    version.Current == fileVersion).ToList();

                var totalCount = filteredTerminals.Count;
                var pagedTerminals = filteredTerminals
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToList();

                var terminalDtos = pagedTerminals.Select(t => new TerminalDto
                {
                    ID = t.ID,
                    MerchantID = t.MerchantID,
                    MachineID = t.MachineID,
                    DeviceNO = t.DeviceNO,
                    LineNO = t.LineNO,
                    TerminalType = t.TerminalType,
                    CreateTime = t.CreateTime,
                    Status = t.Status != null ? new TerminalStatusDto
                    {
                        ActiveStatus = t.Status.ActiveStatus,
                        LastActiveTime = t.Status.LastActiveTime,
                        ConnectionProtocol = t.Status.ConnectionProtocol ?? "",
                        EndPoint = t.Status.EndPoint ?? "",
                        FileVersionMetadata = t.Status.FileVersionMetadata,
                        PropertyMetadata = t.Status.PropertyMetadata
                    } : null,
                    TerminalID = t.ID,
                    TerminalTypeID = t.TerminalType,
                    IsActive = t.Status?.ActiveStatus == DeviceActiveStatus.Active,
                    CreatedTime = t.CreateTime,
                    UpdatedTime = t.CreateTime
                }).ToList();

                return new PaginatedResult<TerminalDto>
                {
                    Items = terminalDtos,
                    TotalCount = totalCount,
                    Page = page,
                    PageSize = pageSize
                };
            }

            // 获取总记录数
            var count = await query.CountAsync();

            // 应用分页
            var terminals2 = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // 转换为DTO
            var terminalDtos2 = terminals2.Select(t => new TerminalDto
            {
                ID = t.ID,
                MerchantID = t.MerchantID,
                MachineID = t.MachineID,
                DeviceNO = t.DeviceNO,
                LineNO = t.LineNO,
                TerminalType = t.TerminalType,
                CreateTime = t.CreateTime,
                Status = t.Status != null ? new TerminalStatusDto
                {
                    ActiveStatus = t.Status.ActiveStatus,
                    LastActiveTime = t.Status.LastActiveTime,
                    ConnectionProtocol = t.Status.ConnectionProtocol ?? "",
                    EndPoint = t.Status.EndPoint ?? "",
                    FileVersionMetadata = t.Status.FileVersionMetadata,
                    PropertyMetadata = t.Status.PropertyMetadata
                } : null,

                // 兼容属性
                TerminalID = t.ID,
                TerminalTypeID = t.TerminalType,
                IsActive = t.Status?.ActiveStatus == DeviceActiveStatus.Active,
                CreatedTime = t.CreateTime,
                UpdatedTime = t.CreateTime
            }).ToList();

            return new PaginatedResult<TerminalDto>
            {
                Items = terminalDtos2,
                TotalCount = count,
                Page = page,
                PageSize = pageSize
            };
        }

        // GET: api/Terminals/5
        [HttpGet("{id}")]
        public async Task<ActionResult<TerminalDto>> GetTerminal(string id)
        {
            // 获取当前用户的商户ID
            var currentUserMerchantId = await _userService.GetUserMerchantIdAsync(User);
            var isSystemAdmin = User.IsInRole("SystemAdmin");

            var terminal = await _dbContext.Terminals
                .Include(t => t.Status)
                .FirstOrDefaultAsync(t => t.ID == id && !t.IsDeleted);

            if (terminal == null)
            {
                return NotFound();
            }

            // 如果不是系统管理员，只能查看自己商户的终端
            if (!isSystemAdmin && terminal.MerchantID != currentUserMerchantId)
            {
                return Forbid();
            }

            return new TerminalDto
            {
                ID = terminal.ID,
                MerchantID = terminal.MerchantID,
                MachineID = terminal.MachineID,
                DeviceNO = terminal.DeviceNO,
                LineNO = terminal.LineNO,
                TerminalType = terminal.TerminalType,
                CreateTime = terminal.CreateTime,
                Status = terminal.Status != null ? new TerminalStatusDto
                {
                    ActiveStatus = terminal.Status.ActiveStatus,
                    LastActiveTime = terminal.Status.LastActiveTime,
                    ConnectionProtocol = terminal.Status.ConnectionProtocol ?? "",
                    EndPoint = terminal.Status.EndPoint ?? "",
                    FileVersionMetadata = terminal.Status.FileVersionMetadata,
                    PropertyMetadata = terminal.Status.PropertyMetadata
                } : null,

                // 兼容属性
                TerminalID = terminal.ID,
                TerminalTypeID = terminal.TerminalType,
                IsActive = terminal.Status?.ActiveStatus == DeviceActiveStatus.Active,
                CreatedTime = terminal.CreateTime,
                UpdatedTime = terminal.CreateTime
            };
        }

        // GET: api/Terminals/Stats
        [HttpGet("stats")]
        public async Task<ActionResult<TerminalStatsDto>> GetTerminalStats([FromQuery] string? merchantId = null)
        {
            // 获取当前用户的商户ID
            var currentUserMerchantId = await _userService.GetUserMerchantIdAsync(User);
            var isSystemAdmin = User.IsInRole("SystemAdmin");

            // 如果不是系统管理员，只能查看自己商户的终端
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
            var query = _dbContext.Terminals
                .Include(t => t.Status)
                .Where(t => !t.IsDeleted)
                .AsQueryable();

            // 应用商户筛选
            if (!string.IsNullOrEmpty(merchantId))
            {
                query = query.Where(t => t.MerchantID == merchantId);
            }

            // 获取统计数据
            var totalCount = await query.CountAsync();
            var activeCount = await query.CountAsync(t => t.Status != null && t.Status.ActiveStatus == DeviceActiveStatus.Active);
            var inactiveCount = await query.CountAsync(t => t.Status != null && t.Status.ActiveStatus == DeviceActiveStatus.Inactive);

            return new TerminalStatsDto
            {
                TotalCount = totalCount,
                ActiveCount = activeCount,
                InactiveCount = inactiveCount
            };
        }

        // GET: api/Terminals/5/Events
        [HttpGet("{id}/events")]
        public async Task<ActionResult<PaginatedResult<TerminalEventDto>>> GetTerminalEvents(
            string id,
            [FromQuery] TerminalEventType? eventType = null,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            // 获取当前用户的商户ID
            var currentUserMerchantId = await _userService.GetUserMerchantIdAsync(User);
            var isSystemAdmin = User.IsInRole("SystemAdmin");

            // 检查终端是否存在
            var terminal = await _dbContext.Terminals.FirstOrDefaultAsync(t => t.ID == id && !t.IsDeleted);
            if (terminal == null)
            {
                return NotFound();
            }

            // 如果不是系统管理员，只能查看自己商户的终端
            if (!isSystemAdmin && terminal.MerchantID != currentUserMerchantId)
            {
                return Forbid();
            }

            // 构建查询
            var query = _dbContext.TerminalEvents
                .Where(e => e.TerminalID == id)
                .AsQueryable();

            // 应用筛选条件
            if (eventType.HasValue)
            {
                query = query.Where(e => e.EventType == eventType.Value);
            }

            if (startDate.HasValue)
            {
                query = query.Where(e => e.EventTime >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(e => e.EventTime <= endDate.Value);
            }

            // 获取总记录数
            var count = await query.CountAsync();

            // 应用分页和排序
            var events = await query
                .OrderByDescending(e => e.EventTime)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // 转换为DTO
            var eventDtos = events.Select(e => new TerminalEventDto
            {
                ID = e.ID,
                MerchantID = e.MerchantID,
                TerminalID = e.TerminalID,
                EventTime = e.EventTime,
                EventName = e.EventName,
                EventType = e.EventType,
                Severity = e.Severity,
                Remark = e.Remark,
                Operator = e.Operator
            }).ToList();

            return new PaginatedResult<TerminalEventDto>
            {
                Items = eventDtos,
                TotalCount = count,
                Page = page,
                PageSize = pageSize
            };
        }

        // POST: api/Terminals/SendMessage
        [HttpPost("SendMessage")]
        public async Task<IActionResult> SendMessage([FromBody] SendMessageDto model)
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

            return Ok(new { MessageId = msgContent.ID, TerminalCount = terminals.Count });
        }

        // POST: api/Terminals/PublishFile
        [HttpPost("PublishFile")]
        public async Task<IActionResult> PublishFile([FromBody] PublishFileDto model)
        {
            // 获取当前用户的商户ID和用户名
            var currentUserMerchantId = await _userService.GetUserMerchantIdAsync(User);
            var isSystemAdmin = User.IsInRole("SystemAdmin");
            var username = UserService.GetUserNameForOperator(User);

            // 验证文件版本
            var fileVer = await _dbContext.FileVers.FirstOrDefaultAsync(f => f.ID == model.FileVerId && !f.IsDelete);
            if (fileVer == null)
            {
                return BadRequest("Invalid file version");
            }

            // 验证终端列表(文件版本的商户需要和终端的商户ID一致)
            var terminals = await _dbContext.Terminals
                .Where(t => model.TerminalIds.Contains(t.ID) && t.MerchantID == fileVer.MerchantID && !t.IsDeleted)
                .ToListAsync();

            if (terminals.Count == 0)
            {
                return BadRequest("No valid terminals found");
            }

            // 如果不是系统管理员，只能向自己商户的终端发布文件
            if (!isSystemAdmin && terminals.Any(t => t.MerchantID != currentUserMerchantId))
            {
                return Forbid();
            }


            // 创建文件发布记录
            var filePublish = new FilePublish
            {
                MerchantID = fileVer.MerchantID,
                FileTypeID = fileVer.FileTypeID,
                FilePara = fileVer.FilePara,
                FileFullType = fileVer.FileFullType,
                Ver = fileVer.Ver,
                FileSize = fileVer.FileSize,
                Crc = fileVer.Crc,
                FileVerID = fileVer.ID,
                UploadFileID = fileVer.UploadFileID,
                PublishType = PublishTypeOption.Terminal,
                PublishTarget = string.Join(",", model.TerminalIds),
                PublishTime = DateTime.Now,
                Operator = username
            };

            await _dbContext.FilePublishs.AddAsync(filePublish);
            await _dbContext.SaveChangesAsync();

            // 创建文件发布历史记录
            var filePublishHistory = new FilePublishHistory
            {
                MerchantID = terminals.First().MerchantID,
                FileTypeID = fileVer.FileTypeID,
                FilePara = fileVer.FilePara,
                FileFullType = fileVer.FileFullType,
                Ver = fileVer.Ver,
                FileSize = fileVer.FileSize,
                Crc = fileVer.Crc,
                FileVerID = fileVer.ID,
                UploadFileID = fileVer.UploadFileID,
                PublishType = PublishTypeOption.Terminal,
                PublishTarget = string.Join(",", model.TerminalIds),
                PublishTime = filePublish.PublishTime,
                Operator = username
            };

            await _dbContext.FilePublishHistories.AddAsync(filePublishHistory);
            await _dbContext.SaveChangesAsync();

            // 记录事件
            foreach (var terminal in terminals)
            {
                await _terminalEventPublishService.PublishTerminalEventAsync(new TerminalEventMessage
                {
                    MerchantID = terminal.MerchantID,
                    TerminalID = terminal.ID,
                    EventType = TerminalEventType.FilePublished,
                    Severity = EventSeverity.Info,
                    Remark = $"File published: Type={fileVer.FileFullType}, Version={fileVer.Ver}",
                    Operator = username
                });

            }

            return Ok(new { PublishId = filePublish.ID, TerminalCount = terminals.Count });
        }

        // GET: api/Terminals/Export
        [HttpGet("export")]
        public async Task<IActionResult> ExportTerminals(
            [FromQuery] string? merchantId = null,
            [FromQuery] string? lineNo = null,
            [FromQuery] string? deviceNo = null,
            [FromQuery] string? machineId = null,
            [FromQuery] string? terminalType = null,
            [FromQuery] DeviceActiveStatus? activeStatus = null)
        {
            // 获取当前用户的商户ID
            var currentUserMerchantId = await _userService.GetUserMerchantIdAsync(User);
            var isSystemAdmin = User.IsInRole("SystemAdmin");

            // 如果不是系统管理员，只能查看自己商户的终端
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
            var query = _dbContext.Terminals
                .Include(t => t.Status)
                .Where(t => !t.IsDeleted)
                .AsQueryable();

            // 应用筛选条件
            if (!string.IsNullOrEmpty(merchantId))
            {
                query = query.Where(t => t.MerchantID == merchantId);
            }

            if (!string.IsNullOrEmpty(lineNo))
            {
                query = query.Where(t => t.LineNO == lineNo);
            }

            if (!string.IsNullOrEmpty(deviceNo))
            {
                query = query.Where(t => t.DeviceNO == deviceNo);
            }

            if (!string.IsNullOrEmpty(machineId))
            {
                query = query.Where(t => t.MachineID == machineId);
            }

            if (!string.IsNullOrEmpty(terminalType))
            {
                query = query.Where(t => t.TerminalType == terminalType);
            }

            if (activeStatus.HasValue)
            {
                query = query.Where(t => t.Status != null && t.Status.ActiveStatus == activeStatus.Value);
            }

            // 获取终端列表
            var terminals = await query.ToListAsync();

            // 转换为CSV格式
            var csv = new System.Text.StringBuilder();
            csv.AppendLine("ID,MerchantID,MachineID,DeviceNO,LineNO,TerminalType,CreateTime,ActiveStatus,LastActiveTime");

            foreach (var terminal in terminals)
            {
                csv.AppendLine($"{terminal.ID},{terminal.MerchantID},{terminal.MachineID},{terminal.DeviceNO},{terminal.LineNO},{terminal.TerminalType},{terminal.CreateTime},{terminal.Status?.ActiveStatus},{terminal.Status?.LastActiveTime}");
            }

            // 返回CSV文件
            return File(System.Text.Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", "terminals.csv");
        }
    }
}
