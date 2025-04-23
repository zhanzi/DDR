# WebAdmin 后端开发备忘录

## 项目概述

WebAdmin 是一个终端后台管理系统，使用 .NET 8.0 + Identity 作为后端技术栈，React + Material UI 作为前端技术栈。后端提供 RESTful API 接口，支持用户认证、角色管理、商户管理、终端管理、文件管理和消息管理等功能。项目采用前后端分离架构，使用 JWT 进行身份验证。

## 后端技术栈

- .NET 8.0
- ASP.NET Core Identity (认证和授权)
- JWT Bearer Authentication (令牌认证)
- Entity Framework Core (数据访问)
- MySQL (数据库)
- AutoMapper (对象映射)
- Swagger/OpenAPI (API 文档)
- RabbitMQ (消息队列)

## 项目结构

```
SlzrCrossGate.WebAdmin/
├── Controllers/           # API 控制器
├── DTOs/                  # 数据传输对象
├── Extensions/            # 扩展方法
├── Middlewares/           # 中间件
├── Services/              # 业务服务
├── ClientApp/             # 前端应用
├── Properties/            # 项目属性
├── appsettings.json       # 应用配置
├── Program.cs             # 应用入口
└── Startup.cs             # 应用启动配置

SlzrCrossGate.Core/
├── Database/              # 数据库上下文
├── Models/                # 数据模型
├── Repositories/          # 数据仓储
└── Services/              # 核心服务
```

## 数据模型

### 主要实体

1. **用户和角色**
   - 使用 ASP.NET Core Identity 的 IdentityUser 和 IdentityRole

2. **商户 (Merchant)**
   - ID: 商户唯一标识
   - Name: 商户名称
   - ContactPerson: 联系人
   - ContactPhone: 联系电话
   - Address: 地址
   - Status: 状态 (启用/禁用)

3. **终端 (Terminal)**
   - ID: 终端唯一标识
   - MerchantID: 所属商户ID
   - MachineID: 终端唯一码
   - DeviceNO: 设备编号
   - LineNO: 线路编号
   - TerminalType: 设备类型
   - CreateTime: 创建时间
   - IsDeleted: 是否删除

4. **终端状态 (TerminalStatus)**
   - ID: 终端ID
   - ActiveStatus: 活动状态
   - LastActiveTime: 最后活动时间
   - ConnectionProtocol: 连接协议
   - EndPoint: 连接端点
   - FileVersions: 文件版本信息
   - Properties: 属性信息

5. **消息类型 (MsgType)**
   - ID: 消息类型ID
   - MerchantID: 商户ID
   - Name: 类型名称
   - CodeType: 消息编码类型
   - Description: 描述

6. **消息内容 (MsgContent)**
   - ID: 消息内容ID
   - MerchantID: 商户ID
   - MsgTypeID: 消息类型ID
   - Content: 消息内容
   - CreateTime: 创建时间
   - Operator: 操作人员

7. **消息盒 (MsgBox)**
   - ID: 消息盒ID
   - MerchantID: 商户ID
   - MsgContentID: 消息内容ID
   - TerminalID: 终端ID
   - Status: 消息状态 (未读/已读/已回复)
   - SendTime: 发送时间
   - ReadTime: 读取时间
   - ReplyTime: 回复时间
   - ReplyCode: 回复代码
   - ReplyContent: 回复内容

8. **文件类型 (FileType)**
   - ID: 文件类型ID
   - MerchantID: 商户ID
   - Name: 类型名称
   - Description: 描述

9. **文件版本 (FileVer)**
   - ID: 文件版本ID
   - MerchantID: 商户ID
   - FileTypeID: 文件类型ID
   - Version: 版本号
   - FilePath: 文件路径
   - MD5: 文件MD5值
   - CreateTime: 创建时间
   - Operator: 操作人员

10. **文件发布 (FilePublish)**
    - ID: 发布ID
    - MerchantID: 商户ID
    - FileVerID: 文件版本ID
    - Status: 发布状态
    - CreateTime: 创建时间
    - Operator: 操作人员

## API 端点

### 认证

- POST /api/Auth/Login - 用户登录
- POST /api/Auth/Register - 用户注册
- POST /api/Auth/ForgotPassword - 忘记密码
- POST /api/Auth/ResetPassword - 重置密码
- GET /api/Auth/CurrentUser - 获取当前用户信息

### 用户管理

- GET /api/Users - 获取用户列表
- GET /api/Users/{id} - 获取用户详情
- POST /api/Users - 创建用户
- PUT /api/Users/{id} - 更新用户
- DELETE /api/Users/{id} - 删除用户
- PUT /api/Users/{id}/ChangePassword - 修改密码
- PUT /api/Users/{id}/Roles - 分配角色

### 角色管理

- GET /api/Roles - 获取角色列表
- GET /api/Roles/{id} - 获取角色详情
- POST /api/Roles - 创建角色
- PUT /api/Roles/{id} - 更新角色
- DELETE /api/Roles/{id} - 删除角色
- PUT /api/Roles/{id}/Permissions - 分配权限

### 商户管理

- GET /api/Merchants - 获取商户列表
- GET /api/Merchants/{id} - 获取商户详情
- POST /api/Merchants - 创建商户
- PUT /api/Merchants/{id} - 更新商户
- DELETE /api/Merchants/{id} - 删除商户

### 终端管理

- GET /api/Terminals - 获取终端列表
- GET /api/Terminals/{id} - 获取终端详情
- POST /api/Terminals - 创建终端
- PUT /api/Terminals/{id} - 更新终端
- DELETE /api/Terminals/{id} - 删除终端
- GET /api/Terminals/{id}/Status - 获取终端状态
- GET /api/Terminals/{id}/Events - 获取终端事件

### 消息管理

- GET /api/Messages - 获取消息列表
- GET /api/Messages/{id} - 获取消息详情
- POST /api/Messages/Send - 发送消息
- POST /api/Messages/SendByLine - 按线路发送消息
- POST /api/Messages/SendToMerchant - 向商户发送消息
- GET /api/Messages/Stats - 获取消息统计

### 文件管理

- GET /api/Files/Types - 获取文件类型列表
- GET /api/Files/Versions - 获取文件版本列表
- POST /api/Files/Upload - 上传文件
- POST /api/Files/Publish - 发布文件
- GET /api/Files/Publish - 获取文件发布列表

## 数据访问最佳实践

### 1. 避免使用导航属性

**问题**: 使用导航属性可能导致性能问题和意外的数据加载。

**解决方案**:
- 使用显式的联结查询而不是导航属性
- 例如，将以下代码:
  ```csharp
  var query = _dbContext.MsgBoxes
      .Include(m => m.MsgContent)
      .ThenInclude(c => c.MsgType)
      .Include(m => m.Terminal)
      .AsQueryable();
  ```

  改为:
  ```csharp
  var query = from msgBox in _dbContext.MsgBoxes
              join msgContent in _dbContext.MsgContents on msgBox.MsgContentID equals msgContent.ID into msgContentJoin
              from msgContent in msgContentJoin.DefaultIfEmpty()
              join msgType in _dbContext.MsgTypes on msgContent.MsgTypeID equals msgType.ID into msgTypeJoin
              from msgType in msgTypeJoin.DefaultIfEmpty()
              join terminal in _dbContext.Terminals on msgBox.TerminalID equals terminal.ID into terminalJoin
              from terminal in terminalJoin.DefaultIfEmpty()
              select new { ... };
  ```

### 2. 使用异步方法

- 使用 `async/await` 和异步方法 (`ToListAsync`, `FirstOrDefaultAsync` 等)
- 避免在异步方法中使用同步调用

### 3. 使用仓储模式

- 将数据访问逻辑封装在仓储类中
- 使用依赖注入注入仓储

### 4. 使用 DTO 而不是直接返回实体

- 创建专门的 DTO 类用于 API 响应
- 使用 AutoMapper 映射实体到 DTO

## 认证和授权

### 1. 基于角色的授权

- 使用 `[Authorize(Roles = "RoleName")]` 特性控制访问
- 常用角色: SystemAdmin, MerchantAdmin, User

### 2. 基于策略的授权

- 在 Startup.cs 中定义授权策略
- 使用 `[Authorize(Policy = "PolicyName")]` 特性

### 3. 资源所有权验证

- 验证用户是否有权访问特定商户的资源
- 例如，非系统管理员只能访问自己商户的终端

## 常见问题和解决方案

### 1. 跨域请求 (CORS)

**问题**: 前端无法访问后端 API 因为跨域限制。

**解决方案**:
- 在 Startup.cs 中配置 CORS:
  ```csharp
  services.AddCors(options =>
  {
      options.AddPolicy("AllowSpecificOrigin",
          builder => builder
              .WithOrigins("http://localhost:3000")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials());
  });

  app.UseCors("AllowSpecificOrigin");
  ```

### 2. 认证问题

**问题**: 用户无法登录或认证令牌无效。

**解决方案**:
- 检查 Identity 配置
- 验证 JWT 令牌配置
  - 确保在 Program.cs 中正确配置了 JWT Bearer 认证
  - 确保使用了 `app.UseAuthentication()` 和 `app.UseAuthorization()`
  - 检查 appsettings.json 中的 JWT 配置是否正确
- 确保前端正确发送认证头
- 使用浏览器开发者工具检查网络请求和响应

### 3. 数据库迁移问题

**问题**: 数据库架构与模型不匹配。

**解决方案**:
- 创建新的迁移: `dotnet ef migrations add MigrationName`
- 更新数据库: `dotnet ef database update`
- 确保连接字符串正确

### 4. 性能问题

**问题**: API 响应缓慢。

**解决方案**:
- 优化数据库查询
- 实现缓存
- 使用分页减少数据量
- 避免 N+1 查询问题

## 开发最佳实践

1. **控制器设计**
   - 保持控制器精简，将业务逻辑移至服务层
   - 使用 RESTful 设计原则
   - 返回适当的 HTTP 状态码

2. **异常处理**
   - 使用全局异常处理中间件
   - 记录异常但不暴露敏感信息给客户端
   - 返回友好的错误消息

3. **日志记录**
   - 使用 ILogger 接口记录日志
   - 记录关键操作和异常
   - 配置不同环境的日志级别

4. **配置管理**
   - 使用 IOptions 模式访问配置
   - 对敏感信息使用用户机密或环境变量
   - 为不同环境使用不同的配置文件

5. **依赖注入**
   - 使用构造函数注入依赖
   - 注册服务的适当生命周期 (Transient, Scoped, Singleton)
   - 避免服务定位器模式

## 部署注意事项

1. **环境配置**
   - 为生产环境使用适当的配置
   - 禁用开发者异常页面
   - 启用 HTTPS

2. **数据库迁移**
   - 在部署前备份数据库
   - 使用 EF Core 迁移更新数据库架构
   - 考虑使用数据库初始化脚本

3. **性能优化**
   - 启用响应压缩
   - 配置缓存头
   - 考虑使用 CDN 提供静态资源

4. **安全性**
   - 启用 HTTPS
   - 配置适当的 CORS 策略
   - 实施速率限制
   - 使用安全的认证机制

## JWT 认证配置

### Program.cs 中的 JWT 配置

```csharp
// 配置JWT认证
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
            builder.Configuration["Jwt:Key"] ?? "defaultKeyForDevelopment12345678901234567890"))
    };
    options.Events = new JwtBearerEvents
    {
        OnChallenge = context =>
        {
            // 覆盖默认的401响应
            context.HandleResponse();
            context.Response.StatusCode = 401;
            context.Response.ContentType = "application/json";
            var result = JsonSerializer.Serialize(new { message = "未授权访问" });
            return context.Response.WriteAsync(result);
        }
    };
});
```

### 中间件配置

在 Program.cs 中添加以下中间件（顺序很重要）：

```csharp
app.UseHttpsRedirection();

app.UseAuthentication(); // 必须在 UseAuthorization 之前

app.UseAuthorization();

app.MapControllers();
```

### appsettings.json 中的 JWT 配置

```json
"Jwt": {
  "Key": "YourSecretKeyHere12345678901234567890",
  "Issuer": "WebAdmin",
  "Audience": "WebAdmin",
  "ExpiresInHours": 24
}
```

## 双因素认证实现

后端需要实现以下 API 端点：

1. `/api/auth/login` - 用户名密码登录
2. `/api/auth/verify-code` - 验证动态口令
3. `/api/auth/setup-two-factor` - 设置双因素验证
4. `/api/auth/confirm-two-factor` - 确认双因素验证设置

## 未来改进计划

1. 实现更完善的审计日志
2. 添加更多的单元测试和集成测试
3. 实现缓存机制提高性能
4. 增强安全性，实现更完善的认证和授权机制
5. 优化数据库查询性能
6. 实现微信扫码登录功能
7. 完善双因素认证功能
