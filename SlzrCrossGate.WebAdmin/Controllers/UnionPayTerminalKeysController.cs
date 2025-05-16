using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NPOI.SS.UserModel;
using NPOI.XSSF.UserModel;
using NPOI.HSSF.UserModel;
using SlzrCrossGate.Core.Database;
using SlzrCrossGate.Core.Models;
using SlzrCrossGate.Core.Repositories;
using SlzrCrossGate.WebAdmin.DTOs;
using System.IO;

namespace SlzrCrossGate.WebAdmin.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UnionPayTerminalKeysController : ControllerBase
    {
        private readonly TcpDbContext _dbContext;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<UnionPayTerminalKeysController> _logger;

        private readonly Repository<UnionPayTerminalKey> _repository;

        // 辅助方法：获取单元格的字符串值
        private string? GetStringCellValue(ICell? cell)
        {
            if (cell == null) return null;

            switch (cell.CellType)
            {
                case CellType.String:
                    return cell.StringCellValue?.Trim();
                case CellType.Numeric:
                    // 如果是数字，转为字符串返回
                    return cell.NumericCellValue.ToString().Trim();
                case CellType.Boolean:
                    return cell.BooleanCellValue.ToString().Trim();
                case CellType.Formula:
                    switch (cell.CachedFormulaResultType)
                    {
                        case CellType.String:
                            return cell.StringCellValue?.Trim();
                        case CellType.Numeric:
                            return cell.NumericCellValue.ToString().Trim();
                        default:
                            return null;
                    }
                default:
                    return null;
            }
        }

        public UnionPayTerminalKeysController(
            TcpDbContext dbContext,
            UserManager<ApplicationUser> userManager,
            Repository<UnionPayTerminalKey> repository,
            ILogger<UnionPayTerminalKeysController> logger)
        {
            _dbContext = dbContext;
            _userManager = userManager;
            _logger = logger;
            _repository = repository;
        }

        // GET: api/UnionPayTerminalKeys
        [HttpGet]
        public async Task<ActionResult<PaginatedResult<UnionPayTerminalKeyDto>>> GetUnionPayTerminalKeys(
            [FromQuery] string? search,
            [FromQuery] bool? isInUse,
            [FromQuery] string? merchantId,
            [FromQuery] string? sortBy = "CreatedAt",
            [FromQuery] string? sortDirection = "desc",
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                // 获取当前用户
                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser == null)
                {
                    return Unauthorized();
                }

                // 检查是否是系统管理员
                var isSystemAdmin = await _userManager.IsInRoleAsync(currentUser, "SystemAdmin");

                // 构建查询
                IQueryable<UnionPayTerminalKey> query = _dbContext.UnionPayTerminalKeys;

                // 如果不是系统管理员，只能查看自己商户的数据
                if (!isSystemAdmin && !string.IsNullOrEmpty(currentUser.MerchantID))
                {
                    query = query.Where(k => k.MerchantID == currentUser.MerchantID);
                }
                // 如果传入了商户ID参数，则按商户ID筛选
                else if (!string.IsNullOrEmpty(merchantId))
                {
                    query = query.Where(k => k.MerchantID == merchantId);
                }

                // 搜索条件
                if (!string.IsNullOrEmpty(search))
                {
                    search = search.Trim();
                    query = query.Where(k =>
                        k.MerchantID.Contains(search) ||
                        k.UP_MerchantID.Contains(search) ||
                        k.UP_TerminalID.Contains(search) ||
                        k.UP_Key.Contains(search) ||
                        (k.UP_MerchantName != null && k.UP_MerchantName.Contains(search)) ||
                        (k.MachineID != null && k.MachineID.Contains(search)) ||
                        (k.LineID != null && k.LineID.Contains(search)) ||
                        (k.MachineNO != null && k.MachineNO.Contains(search))
                    );
                }

                // 是否使用状态过滤
                if (isInUse.HasValue)
                {
                    query = query.Where(k => k.IsInUse == isInUse.Value);
                }

                // 排序
                if (!string.IsNullOrEmpty(sortBy))
                {
                    // 默认按创建时间降序排序
                    query = sortBy.ToLower() switch
                    {
                        "createdat" => sortDirection?.ToLower() == "asc" ? query.OrderBy(k => k.CreatedAt) : query.OrderByDescending(k => k.CreatedAt),
                        "updatedat" => sortDirection?.ToLower() == "asc" ? query.OrderBy(k => k.UpdatedAt) : query.OrderByDescending(k => k.UpdatedAt),
                        "merchantid" => sortDirection?.ToLower() == "asc" ? query.OrderBy(k => k.MerchantID) : query.OrderByDescending(k => k.MerchantID),
                        "isinuse" => sortDirection?.ToLower() == "asc" ? query.OrderBy(k => k.IsInUse) : query.OrderByDescending(k => k.IsInUse),
                        _ => query.OrderByDescending(k => k.CreatedAt)
                    };
                }
                else
                {
                    query = query.OrderByDescending(k => k.CreatedAt);
                }

                // 计算总记录数
                var totalCount = await query.CountAsync();

                // 分页
                var keys = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Join(_dbContext.Merchants,
                          key => key.MerchantID,
                          merchant => merchant.MerchantID,
                          (key, merchant) => new { Key = key, Merchant = merchant })
                    .Select(x => new UnionPayTerminalKeyDto
                    {
                        ID = x.Key.ID,
                        MerchantID = x.Key.MerchantID,
                        MerchantName = x.Merchant.Name ?? string.Empty,
                        UP_MerchantID = x.Key.UP_MerchantID,
                        UP_TerminalID = x.Key.UP_TerminalID,
                        UP_Key = x.Key.UP_Key,
                        UP_MerchantName = x.Key.UP_MerchantName,
                        IsInUse = x.Key.IsInUse,
                        MachineID = x.Key.MachineID,
                        LineID = x.Key.LineID,
                        MachineNO = x.Key.MachineNO,
                        CreatedAt = x.Key.CreatedAt,
                        UpdatedAt = x.Key.UpdatedAt
                    })
                    .ToListAsync();

                // 返回分页结果
                return Ok(new PaginatedResult<UnionPayTerminalKeyDto>
                {
                    Items = keys,
                    TotalCount = totalCount,
                    Page = page,
                    PageSize = pageSize
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取银联终端密钥列表时发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }

        // GET: api/UnionPayTerminalKeys/5
        [HttpGet("{id}")]
        public async Task<ActionResult<UnionPayTerminalKeyDto>> GetUnionPayTerminalKey(int id)
        {
            try
            {
                // 获取当前用户
                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser == null)
                {
                    return Unauthorized();
                }

                // 检查是否是系统管理员
                var isSystemAdmin = await _userManager.IsInRoleAsync(currentUser, "SystemAdmin");

                // 获取银联终端密钥
                var key = await _dbContext.UnionPayTerminalKeys
                    .Join(_dbContext.Merchants,
                          k => k.MerchantID,
                          m => m.MerchantID,
                          (k, m) => new { Key = k, Merchant = m })
                    .Where(x => x.Key.ID == id)
                    .Select(x => new UnionPayTerminalKeyDto
                    {
                        ID = x.Key.ID,
                        MerchantID = x.Key.MerchantID,
                        MerchantName = x.Merchant.Name ?? string.Empty,
                        UP_MerchantID = x.Key.UP_MerchantID,
                        UP_TerminalID = x.Key.UP_TerminalID,
                        UP_Key = x.Key.UP_Key,
                        UP_MerchantName = x.Key.UP_MerchantName,
                        IsInUse = x.Key.IsInUse,
                        MachineID = x.Key.MachineID,
                        LineID = x.Key.LineID,
                        MachineNO = x.Key.MachineNO,
                        CreatedAt = x.Key.CreatedAt,
                        UpdatedAt = x.Key.UpdatedAt
                    })
                    .FirstOrDefaultAsync();

                if (key == null)
                {
                    return NotFound(new { message = "找不到指定的银联终端密钥" });
                }

                // 如果不是系统管理员，只能查看自己商户的数据
                if (!isSystemAdmin && !string.IsNullOrEmpty(currentUser.MerchantID) && key.MerchantID != currentUser.MerchantID)
                {
                    return Forbid();
                }

                return Ok(key);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取银联终端密钥详情时发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }

        // POST: api/UnionPayTerminalKeys
        [HttpPost]
        [Authorize(Roles = "SystemAdmin,MerchantAdmin")]
        public async Task<ActionResult<UnionPayTerminalKeyDto>> CreateUnionPayTerminalKey([FromBody] CreateUnionPayTerminalKeyDto createDto)
        {
            try
            {
                // 获取当前用户
                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser == null)
                {
                    return Unauthorized();
                }

                // 检查是否是系统管理员
                var isSystemAdmin = await _userManager.IsInRoleAsync(currentUser, "SystemAdmin");
                var isMerchantAdmin = await _userManager.IsInRoleAsync(currentUser, "MerchantAdmin");

                // 如果不是系统管理员，只能创建自己商户的数据
                if (!isSystemAdmin && isMerchantAdmin && !string.IsNullOrEmpty(currentUser.MerchantID) && createDto.MerchantID != currentUser.MerchantID)
                {
                    return Forbid();
                }

                // 检查商户是否存在
                var merchant = await _dbContext.Merchants.FindAsync(createDto.MerchantID);
                if (merchant == null)
                {
                    return BadRequest(new { message = "商户不存在" });
                }

                // 检查是否已存在相同银联商户号和终端号的记录
                var exists = await _dbContext.UnionPayTerminalKeys
                    .AnyAsync(k => k.UP_MerchantID == createDto.UP_MerchantID && k.UP_TerminalID == createDto.UP_TerminalID);

                if (exists)
                {
                    return BadRequest(new { message = "已存在相同银联商户号和终端号的记录" });
                }

                // 创建新的银联终端密钥
                var now = DateTime.Now;
                var newKey = new UnionPayTerminalKey
                {
                    MerchantID = createDto.MerchantID,
                    UP_MerchantID = createDto.UP_MerchantID,
                    UP_TerminalID = createDto.UP_TerminalID,
                    UP_Key = createDto.UP_Key,
                    UP_MerchantName = createDto.UP_MerchantName,
                    IsInUse = false,
                    CreatedAt = now,
                    UpdatedAt = now
                };

                _dbContext.UnionPayTerminalKeys.Add(newKey);
                await _dbContext.SaveChangesAsync();

                // 查询包含商户名称的完整数据
                var result = await _dbContext.UnionPayTerminalKeys
                    .Join(_dbContext.Merchants,
                          k => k.MerchantID,
                          m => m.MerchantID,
                          (k, m) => new { Key = k, Merchant = m })
                    .Where(x => x.Key.ID == newKey.ID)
                    .Select(x => new UnionPayTerminalKeyDto
                    {
                        ID = x.Key.ID,
                        MerchantID = x.Key.MerchantID,
                        MerchantName = x.Merchant.Name ?? string.Empty,
                        UP_MerchantID = x.Key.UP_MerchantID,
                        UP_TerminalID = x.Key.UP_TerminalID,
                        UP_Key = x.Key.UP_Key,
                        UP_MerchantName = x.Key.UP_MerchantName,
                        IsInUse = x.Key.IsInUse,
                        MachineID = x.Key.MachineID,
                        LineID = x.Key.LineID,
                        MachineNO = x.Key.MachineNO,
                        CreatedAt = x.Key.CreatedAt,
                        UpdatedAt = x.Key.UpdatedAt
                    })
                    .FirstOrDefaultAsync();

                return CreatedAtAction(nameof(GetUnionPayTerminalKey), new { id = newKey.ID }, result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "创建银联终端密钥时发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }

        // PUT: api/UnionPayTerminalKeys/5
        [HttpPut("{id}")]
        [Authorize(Roles = "SystemAdmin,MerchantAdmin")]
        public async Task<IActionResult> UpdateUnionPayTerminalKey(int id, [FromBody] UpdateUnionPayTerminalKeyDto updateDto)
        {
            try
            {
                // 获取当前用户
                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser == null)
                {
                    return Unauthorized();
                }

                // 检查是否是系统管理员
                var isSystemAdmin = await _userManager.IsInRoleAsync(currentUser, "SystemAdmin");
                var isMerchantAdmin = await _userManager.IsInRoleAsync(currentUser, "MerchantAdmin");

                // 获取要更新的银联终端密钥
                var key = await _dbContext.UnionPayTerminalKeys.FindAsync(id);
                if (key == null)
                {
                    return NotFound(new { message = "找不到指定的银联终端密钥" });
                }

                // 如果不是系统管理员，只能更新自己商户的数据
                if (!isSystemAdmin && isMerchantAdmin && !string.IsNullOrEmpty(currentUser.MerchantID) && key.MerchantID != currentUser.MerchantID)
                {
                    return Forbid();
                }

                // 如果已被使用，不允许修改
                if (key.IsInUse)
                {
                    return BadRequest(new { message = "已被使用的银联终端密钥不允许修改" });
                }

                // 检查是否已存在相同银联商户号和终端号的记录（排除自身）
                var exists = await _dbContext.UnionPayTerminalKeys
                    .AnyAsync(k => k.ID != id && k.UP_MerchantID == updateDto.UP_MerchantID && k.UP_TerminalID == updateDto.UP_TerminalID);

                if (exists)
                {
                    return BadRequest(new { message = "已存在相同银联商户号和终端号的记录" });
                }

                // 更新银联终端密钥
                key.UP_MerchantID = updateDto.UP_MerchantID;
                key.UP_TerminalID = updateDto.UP_TerminalID;
                key.UP_Key = updateDto.UP_Key;
                key.UP_MerchantName = updateDto.UP_MerchantName;
                key.UpdatedAt = DateTime.Now;

                await _dbContext.SaveChangesAsync();

                return Ok(new { message = "银联终端密钥更新成功" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "更新银联终端密钥时发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }

        // DELETE: api/UnionPayTerminalKeys/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "SystemAdmin,MerchantAdmin")]
        public async Task<IActionResult> DeleteUnionPayTerminalKey(int id)
        {
            try
            {
                // 获取当前用户
                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser == null)
                {
                    return Unauthorized();
                }

                // 检查是否是系统管理员
                var isSystemAdmin = await _userManager.IsInRoleAsync(currentUser, "SystemAdmin");
                var isMerchantAdmin = await _userManager.IsInRoleAsync(currentUser, "MerchantAdmin");

                // 获取要删除的银联终端密钥
                var key = await _dbContext.UnionPayTerminalKeys.FindAsync(id);
                if (key == null)
                {
                    return NotFound(new { message = "找不到指定的银联终端密钥" });
                }

                // 如果不是系统管理员，只能删除自己商户的数据
                if (!isSystemAdmin && isMerchantAdmin && !string.IsNullOrEmpty(currentUser.MerchantID) && key.MerchantID != currentUser.MerchantID)
                {
                    return Forbid();
                }

                // 如果已被使用，不允许删除
                if (key.IsInUse)
                {
                    return BadRequest(new { message = "已被使用的银联终端密钥不允许删除" });
                }

                _dbContext.UnionPayTerminalKeys.Remove(key);
                await _dbContext.SaveChangesAsync();

                return Ok(new { message = "银联终端密钥删除成功" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "删除银联终端密钥时发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }

        // POST: api/UnionPayTerminalKeys/import
        [HttpPost("import")]
        [Authorize(Roles = "SystemAdmin,MerchantAdmin")]
        public async Task<ActionResult<ImportUnionPayTerminalKeyResultDto>> ImportUnionPayTerminalKeys(IFormFile file)
        {
            try
            {
                // 获取当前用户
                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser == null)
                {
                    return Unauthorized();
                }

                // 检查是否是系统管理员
                var isSystemAdmin = await _userManager.IsInRoleAsync(currentUser, "SystemAdmin");
                var isMerchantAdmin = await _userManager.IsInRoleAsync(currentUser, "MerchantAdmin");

                if (file == null || file.Length == 0)
                {
                    return BadRequest(new { message = "未接收到文件或文件为空" });
                }

                string fileExtension = Path.GetExtension(file.FileName).ToLower();
                if (fileExtension != ".xlsx" && fileExtension != ".xls" && fileExtension != ".csv")
                {
                    return BadRequest(new { message = "仅支持Excel或CSV文件格式" });
                }

                var result = new ImportUnionPayTerminalKeyResultDto
                {
                    TotalCount = 0,
                    SuccessCount = 0,
                    FailCount = 0,
                    Errors = new List<string>()
                };

                List<UnionPayTerminalKey> keys = new List<UnionPayTerminalKey>();
                // 读取文件内容
                using (var stream = new MemoryStream())
                {
                    await file.CopyToAsync(stream);
                    stream.Position = 0;

                    if (fileExtension == ".csv")
                    {
                        // 处理CSV文件
                        using var reader = new StreamReader(stream);
                        string? line = reader.ReadLine(); // 跳过表头

                        while ((line = reader.ReadLine()) != null)
                        {
                            if (string.IsNullOrWhiteSpace(line)) continue;

                            result.TotalCount++;
                            var columns = line.Split(',');

                            try
                            {
                                if (columns.Length < 4)
                                {
                                    result.FailCount++;
                                    result.Errors.Add($"第{result.TotalCount}行: 数据列数不足");
                                    continue;
                                }

                                string merchantId = columns[0].Trim();
                                string upMerchantId = columns[1].Trim();
                                string upTerminalId = columns[2].Trim();
                                string upKey = columns[3].Trim();
                                string? upMerchantName = columns.Length > 4 ? columns[4].Trim() : null;

                                // 检查商户是否存在
                                var merchant = await _dbContext.Merchants.FindAsync(merchantId);
                                if (merchant == null)
                                {
                                    result.FailCount++;
                                    result.Errors.Add($"第{result.TotalCount}行: 商户ID {merchantId} 不存在");
                                    continue;
                                }

                                // 如果当前用户是商户管理员，只能导入自己商户的数据
                                if (!isSystemAdmin && isMerchantAdmin && !string.IsNullOrEmpty(currentUser.MerchantID) && merchantId != currentUser.MerchantID)
                                {
                                    result.FailCount++;
                                    result.Errors.Add($"第{result.TotalCount}行: 无权导入商户ID {merchantId} 的数据");
                                    continue;
                                }

                                // // 检查是否已存在相同银联商户号和终端号的记录
                                // var exists = await _dbContext.UnionPayTerminalKeys
                                //     .AnyAsync(k => k.UP_MerchantID == upMerchantId && k.UP_TerminalID == upTerminalId);

                                // if (exists)
                                // {
                                //     result.FailCount++;
                                //     result.Errors.Add($"第{result.TotalCount}行: 已存在相同银联商户号 {upMerchantId} 和终端号 {upTerminalId} 的记录");
                                //     continue;
                                // }

                                // 创建新的银联终端密钥
                                var now = DateTime.Now;
                                var newKey = new UnionPayTerminalKey
                                {
                                    MerchantID = merchantId,
                                    UP_MerchantID = upMerchantId,
                                    UP_TerminalID = upTerminalId,
                                    UP_Key = upKey,
                                    UP_MerchantName = upMerchantName,
                                    IsInUse = false,
                                    CreatedAt = now,
                                    UpdatedAt = now
                                };
                                keys.Add(newKey);
                            }
                            catch (Exception ex)
                            {
                                result.FailCount++;
                                result.Errors.Add($"第{result.TotalCount}行: {ex.Message}");
                            }
                        }
                    }
                    else
                    {
                        // 处理Excel文件
                        IWorkbook workbook;
                        
                        // 根据文件扩展名创建不同的工作簿对象
                        if (fileExtension == ".xlsx")
                        {
                            workbook = new XSSFWorkbook(stream);
                        }
                        else // .xls
                        {
                            workbook = new HSSFWorkbook(stream);
                        }
                        
                        ISheet sheet = workbook.GetSheetAt(0); // 获取第一个工作表
                        

                        // 从第2行开始处理数据（跳过表头）
                        for (int rowIndex = 1; rowIndex <= sheet.LastRowNum; rowIndex++)
                        {
                            IRow? row = sheet.GetRow(rowIndex);
                            if (row == null || row.GetCell(0) == null) continue;

                            result.TotalCount++;

                            try
                            {
                                // 获取单元格值并转换为字符串
                                string? merchantId = GetStringCellValue(row.GetCell(0));
                                string? upMerchantId = GetStringCellValue(row.GetCell(1));
                                string? upTerminalId = GetStringCellValue(row.GetCell(2));
                                string? upKey = GetStringCellValue(row.GetCell(3));
                                string? upMerchantName = GetStringCellValue(row.GetCell(4));

                                if (string.IsNullOrEmpty(merchantId) || string.IsNullOrEmpty(upMerchantId) ||
                                    string.IsNullOrEmpty(upTerminalId) || string.IsNullOrEmpty(upKey))
                                {
                                    result.FailCount++;
                                    result.Errors.Add($"第{rowIndex + 1}行: 必填字段不能为空");
                                    continue;
                                }

                                // 检查商户是否存在
                                var merchant = await _dbContext.Merchants.FindAsync(merchantId);
                                if (merchant == null)
                                {
                                    result.FailCount++;
                                    result.Errors.Add($"第{row}行: 商户ID {merchantId} 不存在");
                                    continue;
                                }

                                // 如果当前用户是商户管理员，只能导入自己商户的数据
                                if (!isSystemAdmin && isMerchantAdmin && !string.IsNullOrEmpty(currentUser.MerchantID) && merchantId != currentUser.MerchantID)
                                {
                                    result.FailCount++;
                                    result.Errors.Add($"第{row}行: 无权导入商户ID {merchantId} 的数据");
                                    continue;
                                }

                                // // 检查是否已存在相同银联商户号和终端号的记录
                                // var exists = await _dbContext.UnionPayTerminalKeys
                                //     .AnyAsync(k => k.UP_MerchantID == upMerchantId && k.UP_TerminalID == upTerminalId);

                                // if (exists)
                                // {
                                //     result.FailCount++;
                                //     result.Errors.Add($"第{row}行: 已存在相同银联商户号 {upMerchantId} 和终端号 {upTerminalId} 的记录");
                                //     continue;
                                // }

                                // 创建新的银联终端密钥
                                var now = DateTime.Now;
                                var newKey = new UnionPayTerminalKey
                                {
                                    MerchantID = merchantId,
                                    UP_MerchantID = upMerchantId,
                                    UP_TerminalID = upTerminalId,
                                    UP_Key = upKey,
                                    UP_MerchantName = upMerchantName,
                                    IsInUse = false,
                                    CreatedAt = now,
                                    UpdatedAt = now
                                };

                                keys.Add(newKey);
                            }
                            catch (Exception ex)
                            {
                                result.FailCount++;
                                result.Errors.Add($"第{row}行: {ex.Message}");
                            }
                        }
                    }

                    //从数据库中检查是否已存在相同银联商户号和终端号的记录
                    var existingKeys = await _dbContext.UnionPayTerminalKeys
                        .Where(k => keys.Any(newKey => newKey.UP_MerchantID == k.UP_MerchantID && newKey.UP_TerminalID == k.UP_TerminalID))
                        .ToListAsync();

                    // 处理已存在的记录
                    foreach (var existingKey in existingKeys)
                    {
                        var newKey = keys.FirstOrDefault(k => k.UP_MerchantID == existingKey.UP_MerchantID && k.UP_TerminalID == existingKey.UP_TerminalID);
                        if (newKey != null)
                        {
                            // 如果新记录与已存在记录相同，则跳过
                            if (existingKey.UP_Key == newKey.UP_Key && existingKey.UP_MerchantName == newKey.UP_MerchantName)
                            {
                                result.SuccessCount++;
                                continue;
                            }

                            // 否则，标记为失败
                            result.FailCount++;
                            result.Errors.Add($"第{result.TotalCount}行: 已存在相同银联商户号 {existingKey.UP_MerchantID} 和终端号 {existingKey.UP_TerminalID} 的记录");
                        }
                    }

                    // 保存所有成功的记录
                    if (result.SuccessCount > 0)
                    {
                        await _repository.BulkInsertAsync(keys);
                    }
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "导入银联终端密钥时发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }        // GET: api/UnionPayTerminalKeys/template
        [HttpGet("template")]
        public IActionResult DownloadTemplate()
        {
            try
            {
                // 创建Excel文件
                XSSFWorkbook workbook = new XSSFWorkbook();
                ISheet sheet = workbook.CreateSheet("银联终端密钥");

                // 创建表头样式
                ICellStyle headerStyle = workbook.CreateCellStyle();
                IFont headerFont = workbook.CreateFont();
                headerFont.IsBold = true;
                headerStyle.SetFont(headerFont);
                headerStyle.FillForegroundColor = IndexedColors.Grey25Percent.Index;
                headerStyle.FillPattern = FillPattern.SolidForeground;

                // 创建说明行样式
                ICellStyle noteStyle = workbook.CreateCellStyle();
                IFont noteFont = workbook.CreateFont();
                noteFont.IsItalic = true;
                noteFont.Color = IndexedColors.Grey50Percent.Index;
                noteStyle.SetFont(noteFont);

                // 创建表头
                IRow headerRow = sheet.CreateRow(0);
                string[] headers = { "商户ID", "银联商户号", "银联终端号", "银联终端密钥", "银联商户名称" };
                for (int i = 0; i < headers.Length; i++)
                {
                    ICell cell = headerRow.CreateCell(i);
                    cell.SetCellValue(headers[i]);
                    cell.CellStyle = headerStyle;
                }

                // 添加说明行
                IRow noteRow = sheet.CreateRow(1);
                string[] notes = { 
                    "示例: 10000001", 
                    "示例: 123456789012345", 
                    "示例: 12345678", 
                    "示例: 0123456789ABCDEF0123456789ABCDEF", 
                    "示例: 测试商户" 
                };
                for (int i = 0; i < notes.Length; i++)
                {
                    ICell cell = noteRow.CreateCell(i);
                    cell.SetCellValue(notes[i]);
                    cell.CellStyle = noteStyle;
                }                // 设置列宽
                sheet.SetColumnWidth(0, 15 * 256);
                sheet.SetColumnWidth(1, 20 * 256);
                sheet.SetColumnWidth(2, 15 * 256);
                sheet.SetColumnWidth(3, 40 * 256);
                sheet.SetColumnWidth(4, 30 * 256);

                // 写入内存流并获取字节数组
                byte[] excelBytes;
                using (MemoryStream ms = new MemoryStream())
                {
                    workbook.Write(ms);
                    excelBytes = ms.ToArray();
                }

                // 返回文件
                string fileName = $"银联终端密钥导入模板_{DateTime.Now:yyyyMMddHHmmss}.xlsx";
                return File(excelBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "下载银联终端密钥导入模板时发生错误");
                return StatusCode(500, new { message = "服务器内部错误" });
            }
        }
    }
}
