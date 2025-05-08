using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SlzrCrossGate.Core.Database;
using SlzrCrossGate.Core.Models;
using SlzrCrossGate.WebAdmin.DTOs;
using SlzrCrossGate.WebAdmin.Services;
using System.Security.Claims;

namespace SlzrCrossGate.WebAdmin.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class MessageTypesController(TcpDbContext dbContext, UserService userService) : ControllerBase
    {
        private readonly TcpDbContext _dbContext = dbContext;
        private readonly UserService _userService = userService;

        // GET: api/MessageTypes
        [HttpGet]
        public async Task<ActionResult<PaginatedResult<MessageTypeDto>>> GetMessageTypes(
            [FromQuery] string? merchantId = null,
            [FromQuery] string? code = null,
            [FromQuery] string? name = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            // 获取当前用户的商户ID
            var currentUserMerchantId = await _userService.GetUserMerchantIdAsync(User);
            var isSystemAdmin = User.IsInRole("SystemAdmin");

            // 如果不是系统管理员，只能查看自己商户的消息类型
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
            var query = from t in _dbContext.MsgTypes
                        join m in _dbContext.Merchants on t.MerchantID equals m.MerchantID
                        select new
                        {
                            MsgType = t,
                            MerchantName = m.Name
                        };

            // 应用筛选条件
            if (!string.IsNullOrEmpty(merchantId))
            {
                query = query.Where(t => t.MsgType.MerchantID == merchantId);
            }

            if (!string.IsNullOrEmpty(code))
            {
                query = query.Where(t => t.MsgType.ID.Contains(code));
            }

            if (!string.IsNullOrEmpty(name))
            {
                query = query.Where(t => t.MsgType.Name != null && t.MsgType.Name.Contains(name));
            }

            // 获取总记录数
            var count = await query.CountAsync();

            // 应用分页
            var messageTypes = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // 转换为DTO
            var messageTypeDtos = messageTypes.Select(t => new MessageTypeDto
            {
                Code = t.MsgType.ID,
                MerchantID = t.MsgType.MerchantID,
                CodeType = t.MsgType.CodeType,
                ExampleMessage = t.MsgType.ExampleMessage,
                Name = t.MsgType.Name,
                Remark = t.MsgType.Description,
                MerchantName = t.MerchantName
            }).ToList();

            return new PaginatedResult<MessageTypeDto>
            {
                Items = messageTypeDtos,
                TotalCount = count,
                Page = page,
                PageSize = pageSize
            };
        }

        // GET: api/MessageTypes/5
        [HttpGet("{code}/{merchantId}")]
        public async Task<ActionResult<MessageTypeDto>> GetMessageType(string code, string merchantId)
        {
            // 获取当前用户的商户ID
            var currentUserMerchantId = await _userService.GetUserMerchantIdAsync(User);
            var isSystemAdmin = User.IsInRole("SystemAdmin");

            // 如果不是系统管理员，只能查看自己商户的消息类型
            if (!isSystemAdmin && merchantId != currentUserMerchantId)
            {
                return Forbid();
            }

            var messageType = await _dbContext.MsgTypes
                .FirstOrDefaultAsync(t => t.ID == code && t.MerchantID == merchantId);

            if (messageType == null)
            {
                return NotFound();
            }

            return new MessageTypeDto
            {
                Code = messageType.ID,
                MerchantID = messageType.MerchantID,
                CodeType = messageType.CodeType,
                ExampleMessage = messageType.ExampleMessage,
                Name = messageType.Name,
                Remark = messageType.Description
            };
        }

        // POST: api/MessageTypes
        [HttpPost]
        public async Task<ActionResult<MessageTypeDto>> CreateMessageType(CreateMessageTypeDto model)
        {
            // 获取当前用户的商户ID和用户名
            var currentUserMerchantId = await _userService.GetUserMerchantIdAsync(User);
            var isSystemAdmin = User.IsInRole("SystemAdmin");
            var username = User.FindFirstValue(ClaimTypes.Name);

            // 如果不是系统管理员，只能为自己的商户创建消息类型
            if (!isSystemAdmin && model.MerchantID != currentUserMerchantId)
            {
                return Forbid();
            }

            // 检查消息类型是否已存在
            var existingMessageType = await _dbContext.MsgTypes
                .FirstOrDefaultAsync(t => t.ID == model.Code && t.MerchantID == model.MerchantID);

            if (existingMessageType != null)
            {
                return Conflict("消息类型已存在");
            }

            // 创建新消息类型
            var messageType = new MsgType
            {
                ID = model.Code,
                MerchantID = model.MerchantID,
                Name = model.Name,
                CodeType = model.CodeType,
                ExampleMessage = model.ExampleMessage,
                Description = model.Remark
            };

            _dbContext.MsgTypes.Add(messageType);
            await _dbContext.SaveChangesAsync();

            return CreatedAtAction(nameof(GetMessageType), new { code = messageType.ID, merchantId = messageType.MerchantID }, new MessageTypeDto
            {
                Code = messageType.ID,
                MerchantID = messageType.MerchantID,
                Name = messageType.Name,
                CodeType = messageType.CodeType,
                ExampleMessage = messageType.ExampleMessage,
                Remark = messageType.Description
            });
        }

        // PUT: api/MessageTypes/5
        [HttpPut("{code}/{merchantId}")]
        public async Task<IActionResult> UpdateMessageType(string code, string merchantId, UpdateMessageTypeDto model)
        {
            // 获取当前用户的商户ID和用户名
            var currentUserMerchantId = await _userService.GetUserMerchantIdAsync(User);
            var isSystemAdmin = User.IsInRole("SystemAdmin");
            var username = User.FindFirstValue(ClaimTypes.Name);

            // 如果不是系统管理员，只能更新自己商户的消息类型
            if (!isSystemAdmin && merchantId != currentUserMerchantId)
            {
                return Forbid();
            }

            // 检查消息类型是否存在
            var messageType = await _dbContext.MsgTypes
                .FirstOrDefaultAsync(t => t.ID == code && t.MerchantID == merchantId);

            if (messageType == null)
            {
                return NotFound();
            }

            // 更新消息类型
            messageType.Name = model.Name;
            messageType.Description = model.Remark;
            messageType.CodeType = model.CodeType;
            messageType.ExampleMessage = model.ExampleMessage;

            await _dbContext.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/MessageTypes/5
        [HttpDelete("{code}/{merchantId}")]
        public async Task<IActionResult> DeleteMessageType(string code, string merchantId)
        {
            // 获取当前用户的商户ID和用户名
            var currentUserMerchantId = await _userService.GetUserMerchantIdAsync(User);
            var isSystemAdmin = User.IsInRole("SystemAdmin");
            var username = User.FindFirstValue(ClaimTypes.Name);

            // 如果不是系统管理员，只能删除自己商户的消息类型
            if (!isSystemAdmin && merchantId != currentUserMerchantId)
            {
                return Forbid();
            }

            // 检查消息类型是否存在
            var messageType = await _dbContext.MsgTypes
                .FirstOrDefaultAsync(t => t.ID == code && t.MerchantID == merchantId);

            if (messageType == null)
            {
                return NotFound();
            }

            // 检查是否有关联的消息内容
            var hasMessages = await _dbContext.MsgContents
                .AnyAsync(m => m.MsgTypeID == code && m.MerchantID == merchantId);

            if (hasMessages)
            {
                return BadRequest("无法删除已有消息的消息类型");
            }

            // 删除消息类型
            _dbContext.MsgTypes.Remove(messageType);
            await _dbContext.SaveChangesAsync();

            return NoContent();
        }


        // GET: api/MessageTypes/all
        // 获取所有消息类型（不分页），用于下拉框等需要完整数据的场景
        [HttpGet("all")]
        public async Task<ActionResult<MsgTypeListResult>> GetAllMessageTypes([FromQuery] string? merchantId = null)
        {
            // 获取当前用户的商户ID
            var currentUserMerchantId = await _userService.GetUserMerchantIdAsync(User);
            var isSystemAdmin = User.IsInRole("SystemAdmin");

            // 如果不是系统管理员，只能查看自己商户的文件类型
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
            var query = _dbContext.MsgTypes.AsQueryable();

            // 应用商户筛选条件
            if (!string.IsNullOrEmpty(merchantId))
            {
                query = query.Where(t => t.MerchantID == merchantId);
            }

            // 获取所有符合条件的消息类型
            var messageTypes = await query.ToListAsync();

            // 转换为DTO
            var messageTypeDtos = messageTypes.Select(t => new MessageTypeDto
            {
                Code = t.ID,
                MerchantID = t.MerchantID,
                 ExampleMessage= t.ExampleMessage,
                  CodeType = t.CodeType,
                Remark = t.Description,
                Name = t.Name
            }).ToList();

            return new MsgTypeListResult
            {
                Items = messageTypeDtos
            };
        }

    }
    public class MsgTypeListResult
    {
        public List<MessageTypeDto> Items { get; set; } = new List<MessageTypeDto>();
    }
}
