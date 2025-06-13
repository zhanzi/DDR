# WebAdmin 开发备忘录

## 项目概述
- WebAdmin项目是一个终端后台管理系统，技术栈为React+Material UI前端和.NET 8.0+Identity后端
- 设计风格为科技感/简约设计，包含用户角色管理、商户管理、终端管理、文件管理、消息管理和仪表盘等功能模块
- 项目采用前后端分离部署，前端和后端需要单独运行
- 前端使用React 18、Material UI 5、Vite 5.4.18构建，后端使用.NET 8.0和ASP.NET Core Identity
- 登录系统支持双因素认证（用户名密码+动态口令）和微信扫码登录
- 新用户首次登录需要先进行动态密码绑定

## 技术栈与开发环境

### 前端技术栈
- React 18
- Material UI 5
- Vite 5.4.18 (构建工具)
- React Router 6 (路由)
- Formik + Yup (表单处理和验证)
- Notistack (通知提示)
- React Feather (图标库)
- Axios (网络请求)
- JWT-Decode (JWT解析)

### 后端技术栈
- .NET 8.0 (不要升级到.NET 9.0)
- ASP.NET Core Identity (认证和授权)
- JWT Bearer Authentication (令牌认证)
- Entity Framework Core 8.0.14 (不要升级到EF Core 9.x)
- Pomelo.EntityFrameworkCore.MySql 8.0.3 (与EF Core 8.x兼容)
- MySQL 8.0+ (数据库)
- AutoMapper (对象映射)
- Swagger/OpenAPI (API 文档)
- RabbitMQ (消息队列)

### 版本兼容性注意事项
- 项目使用.NET 8.0，不要升级到.NET 9.0
- Entity Framework Core使用8.0.14版本，不要升级到EF Core 9.x
- Pomelo.EntityFrameworkCore.MySql使用8.0.3版本，仅兼容EF Core 8.x
- 安装新包时，确保版本兼容性，特别是EF Core相关包
- 使用`dotnet add package PackageName --version X.Y.Z`指定版本安装包
- 如需安装EF Core工具，使用`dotnet tool install --global dotnet-ef --version 8.0.14`

### 开发环境设置
1. **前端开发环境**
   - Node.js 18+
   - 启动命令：
     ```bash
     cd ClientApp
     npm install
     npm run dev
     ```
   - 开发服务器默认运行在 http://localhost:3000

2. **后端开发环境**
   - .NET 8.0 SDK
   - Visual Studio 2022 或 VS Code + C# 扩展
   - 启动命令：
     ```bash
     dotnet restore
     dotnet build
     dotnet run --project SlzrCrossGate.WebAdmin
     ```
   - API服务器默认运行在 https://localhost:7296

3. **数据库设置**
   - MySQL 8.0+
   - 连接字符串在 appsettings.json 中配置
   - 初始化数据库：
     ```bash
     dotnet ef database update
     ```

## 项目结构

### 前端项目结构
```
ClientApp/
├── public/              # 静态资源
├── src/
│   ├── components/      # 通用组件
│   ├── contexts/        # React 上下文
│   ├── layouts/         # 布局组件
│   │   ├── AuthLayout.jsx       # 认证页面布局
│   │   ├── DashboardLayout.jsx  # 主应用布局
│   │   ├── DashboardSidebar.jsx # 侧边栏
│   │   └── NavItem.jsx          # 导航项组件
│   ├── pages/           # 页面组件
│   │   ├── auth/        # 认证相关页面
│   │   ├── dashboard/   # 仪表盘页面
│   │   ├── errors/      # 错误页面
│   │   ├── files/       # 文件管理页面
│   │   ├── merchants/   # 商户管理页面
│   │   ├── messages/    # 消息管理页面
│   │   ├── roles/       # 角色管理页面
│   │   ├── terminals/   # 终端管理页面
│   │   └── users/       # 用户管理页面
│   ├── services/        # API 服务
│   ├── theme/           # 主题配置
│   ├── utils/           # 工具函数
│   ├── App.jsx          # 应用入口
│   ├── main.jsx         # 主入口文件
│   └── routes.jsx       # 路由配置
├── .eslintrc.js         # ESLint 配置
├── index.html           # HTML 模板
├── package.json         # 依赖配置
└── vite.config.js       # Vite 配置
```

### 后端项目结构
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

## API端点

### 认证
- POST /api/Auth/Login - 用户登录
- POST /api/Auth/Register - 用户注册
- POST /api/Auth/ForgotPassword - 忘记密码
- POST /api/Auth/ResetPassword - 重置密码
- GET /api/Auth/CurrentUser - 获取当前用户信息
- POST /api/Auth/Logout - 用户退出登录
- POST /api/Auth/VerifyCode - 验证动态口令
- POST /api/Auth/SetupTwoFactor - 设置双因素验证
- POST /api/Auth/ConfirmTwoFactor - 确认双因素验证设置
- GET /api/Auth/Wechat-Login - 获取微信登录二维码
- GET /api/Auth/Wechat-Login-Status - 检查微信登录状态
- POST /api/Auth/Bind-Wechat - 绑定微信账号
- POST /api/Auth/Unbind-Wechat - 解绑微信账号
- GET /api/Auth/Wechat-Binding - 获取微信绑定状态

### 系统设置
- GET /api/SystemSettings - 获取系统设置
- PUT /api/SystemSettings - 更新系统设置
- 注意：API路径使用PascalCase（SystemSettings），而不是kebab-case（system-settings）

### 用户管理
- GET /api/Users/CurrentUser - 获取当前登录用户信息
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

### 文件管理
- GET /api/Files - 获取文件列表
- GET /api/Files/{id} - 获取文件详情
- POST /api/Files/Upload - 上传文件
- DELETE /api/Files/{id} - 删除文件
- GET /api/Files/Types - 获取文件类型列表
- GET /api/Files/Versions - 获取文件版本列表
- POST /api/Files/Publish - 发布文件
- GET /api/Files/Publish - 获取文件发布列表

## UI设计规范
### 设计风格
- 整体设计风格：玻璃拟态+微立体感，深色模式为基础，主色使用#7E22CE
- 所有组件需有动画效果，禁止使用纯色背景卡片、直角边框和线性渐变
- 侧边栏可折叠，移动端需优化导航，支持明暗主题切换
- 输入框保留Material UI的浮动标签动画效果

### 颜色
- 主色: 紫色 (#7E22CE)
- 次要色: Material UI 默认紫色 (#9c27b0)
- 错误色: Material UI 默认红色 (#d32f2f)
- 成功色: Material UI 默认绿色 (#2e7d32)
- 警告色: Material UI 默认橙色 (#ed6c02)
- 信息色: Material UI 默认蓝色 (#0288d1)

### 组件样式
1. **按钮**
   - 主要操作: `variant="contained" color="primary"`
   - 次要操作: `variant="outlined" color="primary"`
   - 危险操作: `variant="contained" color="error"`
   - 大按钮: `size="large"`
   - 标准按钮: 不指定 size
   - 小按钮: `size="small"`

2. **表单**
   - 使用 Formik 和 Yup 进行表单处理和验证
   - 输入框使用 Material UI 的 TextField 组件
   - 表单项之间使用 `margin="normal"` 提供间距

3. **表格**
   - 使用 Material UI 的 Table 组件
   - 表头使用浅灰色背景
   - 表格行使用交替的背景色提高可读性
   - 分页控件放在表格底部

4. **卡片**
   - 使用 Paper 组件提供阴影和边框
   - 内边距通常为 `p: 3` 或 `p: 4`
   - 卡片之间的间距通常为 `mt: 3` 或 `mb: 3`

## 路由规则

1. 认证相关路由：
   - /login - 登录页面
   - /register - 注册页面
   - /forgot-password - 忘记密码
   - /two-factor-verify - 双因素认证验证
   - /two-factor-setup - 双因素认证设置
   - /wechat-login - 微信登录

2. 应用内路由：
   - /app/dashboard - 仪表盘
   - /app/account - 账户设置
   - /app/users - 用户管理
   - /app/roles - 角色管理
   - /app/merchants - 商户管理
   - /app/terminals - 终端管理
   - /app/files - 文件管理
   - /app/messages - 消息管理
   - /app/settings - 系统设置

3. 错误页面：
   - /app/404 - 404页面

## 常见问题及解决方案

### 前端问题

1. **双因素认证状态显示不一致**
   - 问题：在用户管理页面和账户设置页面中，同一用户的双因素认证状态显示不一致
   - 原因：后端返回的属性名为`IsTwoFactorEnabled`，但前端在用户管理页面使用的是`twoFactorEnabled`（首字母小写）
   - 解决方案：
     - 在后端`UserDto`类中添加`TwoFactorEnabled`属性，与`IsTwoFactorEnabled`保持一致
     - 在前端检查时使用`user?.twoFactorEnabled || user?.isTwoFactorEnabled`兼容两种属性名
     - 确保所有返回`UserDto`的API接口都包含这两个属性

2. **路由问题**
   - 所有页面（包括404错误页面）都应保持统一的布局、菜单和风格
   - 路由定义在`App.jsx`中，新增页面需要在此处添加路由
   - 确保路由定义中的路径与导航链接一致
   - 添加兼容路径，如 `/auth/login` 重定向到 `/login`
   - 确保所有页面都使用相同的布局组件，包括 404 页面

2. **API请求问题**
   - 后端API使用HTTPS协议(https://localhost:7296)
   - API定义在`services/api.js`中，按功能模块分类
   - 请求拦截器会自动添加token到请求头
   - 使用axios拦截器统一处理请求和响应
   - API端点命名约定使用PascalCase（如`/api/SystemSettings`），而不是kebab-case（如`/api/system-settings`）
   - 前端API调用地址需要与后端控制器路由匹配，注意大小写

3. **布局问题**
   - 主布局使用`DashboardLayout.jsx`，包含侧边栏、顶部栏和内容区
   - 认证相关页面使用`AuthLayout.jsx`
   - `AuthLayout`支持两种使用方式：作为路由容器使用`<Outlet/>`或作为普通组件使用`children`
   - 移动端使用抽屉式侧边栏，通过`openMobile`状态控制显示和隐藏

4. **登录认证问题**
   - 登录流程支持双因素认证（用户名密码+动态口令）
   - 新用户首次登录需要先进行动态密码绑定
   - 双因素认证相关接口(`setup-two-factor`和`confirm-two-factor`)需要传递临时令牌
   - 微信扫码登录无需动态口令验证
   - 退出登录功能通过顶部导航栏的用户菜单实现，点击"退出登录"按钮即可退出

5. **JSX语法错误**
   - 使用.js扩展名的文件中的JSX语法无法被正确解析
   - 解决方案：
     - 将包含JSX的文件重命名为.jsx扩展名
     - 或在vite.config.js中添加配置：
       ```js
       export default defineConfig({
         plugins: [react()],
         resolve: {
           extensions: ['.js', '.jsx', '.json'],
           alias: {
             '@': path.resolve(__dirname, 'src'),
           },
         },
         esbuild: {
           loader: { '.js': 'jsx' },
         },
       });
       ```

## 移动端适配

### 侧边栏导航
1. **移动端侧边栏实现**
   - 使用Material UI的Drawer组件，设置`variant="temporary"`
   - 通过`openMobile`状态控制侧边栏的显示和隐藏
   - 点击菜单按钮打开侧边栏，点击外部区域或关闭按钮关闭侧边栏

2. **关键文件**
   - `src/layouts/DashboardLayout.jsx`: 管理侧边栏状态
   - `src/layouts/DashboardSidebar.jsx`: 侧边栏组件
   - `src/layouts/DashboardNavbar.jsx`: 顶部导航栏，包含菜单按钮

3. **注意事项**
   - 使用`useRef`跟踪路由变化，避免在组件挂载时关闭侧边栏
   - 在路由变化时关闭侧边栏，但不在`openMobile`状态变化时触发关闭
   - 使用`e.stopPropagation()`阻止事件冒泡，避免意外关闭
   - 设置适当的`zIndex`确保侧边栏在正确的层级显示

### 响应式设计
1. **使用Material UI的Grid系统**
   ```jsx
   <Grid container spacing={3}>
     <Grid item xs={12} md={6} lg={4}>
       {/* 内容会根据屏幕尺寸自动调整宽度 */}
     </Grid>
   </Grid>
   ```

2. **使用useMediaQuery钩子检测屏幕尺寸**
   ```jsx
   const isMobile = useMediaQuery((theme) => theme.breakpoints.down('md'));

   return (
     <div>
       {isMobile ? <MobileComponent /> : <DesktopComponent />}
     </div>
   );
   ```

3. **表格响应式处理**
   - 在小屏幕上使用水平滚动容器包裹表格
   - 或者使用卡片式布局替代表格

### 后端问题
1. **数据库访问**
   - 控制器中应避免使用导航属性，而应使用显式的联结查询
   - 例如，将 `query.Include(m => m.MsgContent).ThenInclude(c => c.MsgType)`
     改为 LINQ 联结查询:
     ```csharp
     var query = from msgBox in _dbContext.MsgBoxes
                 join msgContent in _dbContext.MsgContents on msgBox.MsgContentID equals msgContent.ID
                 join msgType in _dbContext.MsgTypes on msgContent.MsgTypeID equals msgType.ID
                 select new { ... };
     ```
   - 使用异步方法 (`ToListAsync`, `FirstOrDefaultAsync` 等)
   - 避免在异步方法中使用同步调用

2. **RabbitMQ服务**
   - RabbitMQ服务设计为单例模式，使用单一_channel实例供所有服务共享
   - 需要确保服务健壮，能从断开连接中自动恢复
   - 实现自动重连机制和错误处理

3. **跨域请求 (CORS)**
   - 前端无法访问后端API可能是因为跨域限制
   - 在Program.cs中配置CORS:
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

4. **认证问题**
   - 检查Identity配置
   - 验证JWT令牌配置
   - 确保在Program.cs中正确配置了JWT Bearer认证
   - 确保使用了`app.UseAuthentication()`和`app.UseAuthorization()`
   - 检查appsettings.json中的JWT配置是否正确

## JWT认证配置

### Program.cs中的JWT配置
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
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
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

// 中间件配置（顺序很重要）
app.UseHttpsRedirection();
app.UseAuthentication(); // 必须在UseAuthorization之前
app.UseAuthorization();
app.MapControllers();
```

### appsettings.json中的JWT配置
```json
"Jwt": {
  "Key": "YourSecretKeyHere12345678901234567890",
  "Issuer": "WebAdmin",
  "Audience": "WebAdmin",
  "ExpiresInHours": 24
}
```

## 系统设置功能

### 系统设置模型
1. **SystemSettings**
   - `EnableTwoFactorAuth`: 是否启用双因素认证功能
   - `ForceTwoFactorAuth`: 是否强制所有用户使用双因素认证
   - `EnableWechatLogin`: 是否启用微信扫码登录功能
   - `LastModified`: 最后修改时间
   - `LastModifiedBy`: 最后修改人

### 系统设置服务
1. **SystemSettingsService**
   - 提供获取和更新系统设置的方法
   - 使用内存缓存优化性能
   - 提供检查用户是否需要双因素认证的方法
   - 提供检查是否启用微信登录的方法

### 系统设置控制器
1. **SystemSettingsController**
   - `GET /api/SystemSettings`: 获取系统设置
   - `PUT /api/SystemSettings`: 更新系统设置
   - 仅允许SystemAdmin角色访问

### 系统设置页面
1. **SystemSettings.jsx**
   - 路径: `/app/settings`
   - 功能:
     - 启用/禁用双因素认证功能
     - 启用/禁用强制双因素认证
     - 启用/禁用微信扫码登录
   - 权限: 仅SystemAdmin角色可访问

### 用户级双因素认证设置
1. **UserDetailView.jsx**
   - 在用户详情页面的"安全设置"标签页中添加双因素认证开关
   - 允许管理员为特定用户启用/禁用强制双因素认证
   - 显示用户当前的双因素认证状态

## 双因素认证实现

### 前端实现
1. **认证上下文**
   - 文件路径：`src/contexts/AuthContext.jsx`
   - 主要状态：
     - `isAuthenticated`: 用户是否已认证
     - `user`: 当前用户信息
     - `token`: JWT令牌
     - `needTwoFactor`: 是否需要双因素验证
     - `isTwoFactorEnabled`: 用户是否已启用双因素验证
     - `tempToken`: 临时令牌（用于双因素验证过程）
   - 主要方法：
     - `login`: 用户名密码登录
     - `verifyTwoFactor`: 验证动态口令
     - `setupTwoFactor`: 获取双因素验证设置信息
     - `confirmTwoFactorSetup`: 确认双因素验证设置
     - `loginWithWechat`: 获取微信登录二维码
     - `checkWechatLoginStatus`: 检查微信登录状态

2. **认证页面**
   - 登录页面：`src/pages/auth/Login.jsx`
   - 双因素验证页面：`src/pages/auth/TwoFactorVerify.jsx`
   - 双因素验证设置页面：`src/pages/auth/TwoFactorSetup.jsx`
   - 微信登录页面：`src/pages/auth/WechatLogin.jsx`

3. **账户设置页面**
   - 文件路径：`src/pages/account/AccountView.jsx`
   - 双因素认证管理功能：
     - 显示当前双因素认证状态
     - 启用双因素认证（生成密钥、显示二维码、验证确认）
     - 禁用双因素认证（需要验证码确认）
     - 根据系统设置和用户权限控制是否允许禁用

### 后端实现
1. **TwoFactorAuthService**
   - 使用OtpNet库实现TOTP算法
   - 提供生成密钥、验证动态口令、管理失败尝试次数等功能
   - 使用Base32编码生成密钥和二维码URL

2. **AuthController**
   - 双因素认证相关API端点：
     - `POST /api/auth/setup-two-factor`: 获取双因素认证设置信息（密钥和二维码）
     - `POST /api/auth/confirm-two-factor`: 确认双因素认证设置
     - `POST /api/auth/verify-code`: 验证动态口令
     - `POST /api/auth/toggle-two-factor`: 启用或禁用双因素认证
   - 双因素认证控制逻辑：
     - 根据系统设置和用户设置判断是否需要双因素认证
     - 如果需要双因素认证但用户未设置，引导用户设置
     - 如果系统强制要求双因素认证或用户被单独设置为需要双因素认证，用户不能禁用

3. **SystemSettingsService**
   - `IsTwoFactorRequiredAsync`方法：判断用户是否需要双因素认证
   - 判断逻辑：
     - 如果系统禁用了双因素认证，则不需要
     - 如果用户已启用双因素认证，则需要
     - 如果系统强制要求双因素认证，则需要
     - 如果用户被单独设置为需要双因素认证，则需要

3. **JWT令牌**
   - 使用临时令牌（有效期短）和完整令牌（有效期长）区分不同认证阶段
   - 在令牌中包含`isTemporary`声明，标识令牌类型

### 数据模型
1. **ApplicationUser**
   - 扩展IdentityUser，添加双因素认证相关字段：
     - `TwoFactorSecretKey`: 存储用户的TOTP密钥
     - `IsTwoFactorRequired`: 是否强制要求使用双因素认证
     - `TwoFactorEnabledDate`: 启用双因素认证的日期
     - `FailedTwoFactorAttempts`: 失败尝试次数
     - `LastFailedTwoFactorAttempt`: 最后一次失败尝试的时间

## 部署指南

### 前端部署
1. **构建前端应用**
   ```bash
   cd ClientApp
   npm run build
   ```
   构建输出位于 `dist` 目录

2. **部署选项**
   - 将构建输出复制到 .NET 项目的 `wwwroot` 目录（集成部署）
   - 或部署到独立的静态文件服务器（如Nginx、Apache）
   - 或部署到云服务（如Azure Static Web Apps、Netlify、Vercel）

3. **环境配置**
   - 确保在生产环境中配置正确的API基础URL
   - 在 `.env.production` 文件中设置：
     ```
     VITE_API_BASE_URL=https://your-api-domain.com/api
     ```

### 后端部署
1. **发布.NET应用**
   ```bash
   dotnet publish -c Release
   ```

2. **部署选项**
   - IIS部署（Windows）
   - Linux服务器部署（使用Nginx + Kestrel）
   - Docker容器部署
   - 云服务部署（如Azure App Service、AWS Elastic Beanstalk）

3. **环境配置**
   - 确保生产环境的 `appsettings.Production.json` 包含正确的配置
   - 配置数据库连接字符串
   - 配置JWT密钥（使用安全的随机生成密钥）
   - 配置CORS策略，允许前端域名访问

4. **安全注意事项**
   - 启用HTTPS
   - 使用环境变量存储敏感信息
   - 配置适当的防火墙规则
   - 实施速率限制防止暴力攻击

## 最近修复的问题

0. **双因素认证二维码显示问题**
   - 问题：账户设置页面中启用双因素认证时，二维码无法正确显示
   - 原因：
     1. 前端使用`<img>`标签直接显示`otpauth://`协议的URI，而这不是有效的图片URL
     2. 后端返回的是TOTP URI，而不是图片URL
   - 解决方案：
     1. 在前端引入`qrcode.react`库，使用`QRCodeSVG`组件直接生成二维码
     2. 修改账户设置页面中的二维码显示代码，使用`QRCodeSVG`组件替代`<img>`标签
     3. 确保后端返回的是TOTP URI，而不是Google Chart API的URL
     4. 参考`TwoFactorSetup`组件中的二维码显示方式进行实现

1. **双因素认证用户控制**
   - 问题：用户无法在账户设置中自行控制是否启用双因素认证
   - 原因：
     1. 缺少用户自行启用/禁用双因素认证的API和前端界面
     2. 系统设计中没有考虑用户自主选择的场景
   - 解决方案：
     1. 在`AuthController`中添加`toggle-two-factor`API端点，支持启用和禁用双因素认证
     2. 在账户设置页面添加双因素认证管理功能，包括启用和禁用选项
     3. 实现逻辑控制：如果系统强制要求双因素认证或用户被单独设置为需要双因素认证，用户不能禁用
     4. 启用双因素认证时显示二维码和密钥，禁用时需要验证码确认身份
1. **系统设置页面404错误**
   - 问题：系统管理员访问系统设置页面(/app/settings)时出现404错误，API请求`GET /api/system-settings`返回404
   - 原因：
     1. 数据库中缺少`SystemSettings`表，虽然代码中已定义了模型和控制器
     2. 迁移文件`20250427064746_AddSystemSettings.cs`存在但内容为空，没有实际创建表的SQL语句
     3. 前端API调用的地址与后端控制器定义的路由不匹配，前端使用kebab-case（`system-settings`），后端使用PascalCase（`SystemSettings`）
   - 解决方案：
     1. 修改迁移文件，添加创建`SystemSettings`表的SQL语句
     2. 应用迁移到数据库，创建表并添加默认记录
     3. 确保`SystemSettingsController`和`SystemSettingsService`正确实现
     4. 修改前端API调用的地址，使其与后端路由匹配，将`/system-settings`改为`/SystemSettings`
   - 注意事项：
     1. 安装EF Core工具时需指定版本：`dotnet tool install --global dotnet-ef --version 8.0.14`
     2. 安装`Microsoft.EntityFrameworkCore.Design`包时需指定版本：`dotnet add package Microsoft.EntityFrameworkCore.Design --version 8.0.14`
     3. 避免版本不兼容问题，确保所有EF Core相关包版本一致(8.0.x)
     4. API端点命名约定应保持一致，要么全部使用kebab-case，要么全部使用PascalCase

2. **用户退出功能实现**
   - 功能：添加用户退出登录功能
   - 实现：
     1. 在顶部导航栏添加用户菜单，包含"退出登录"选项
     2. 在后端`AuthController.cs`中添加`logout`接口
     3. 在前端`api.js`中添加`logout`方法
     4. 修改`AuthContext.jsx`中的`logout`函数，调用后端API
   - 使用方式：点击顶部导航栏右侧的用户头像，在弹出的菜单中选择"退出登录"

3. **用户编辑页面渲染问题**
   - 问题：
     1. 用户编辑页面中的按钮无法正常渲染，控制台报错"Cannot read properties of undefined (reading 'main')"
     2. 点击"安全设置"标签时出现DOM嵌套错误，控制台报错"Warning: validateDOMNesting(...): <div> cannot appear as a descendant of <p>"
   - 原因：
     1. 主题配置中按钮样式使用了渐变背景，但在某些情况下无法正确解析
     2. Typography组件默认使用p标签作为容器，而Chip组件内部使用div标签，导致不合法的DOM嵌套
   - 解决方案：
     1. 修改主题文件中的按钮样式配置，将渐变背景改为纯色背景
     2. 分别修改了亮色主题和暗色主题中的`containedPrimary`按钮样式
     3. 修改用户详情页面中的按钮组件，将动态颜色属性改为固定颜色和自定义样式
     4. 使用`color="inherit"`和`sx={{ color: ... }}`代替动态的`color`属性
     5. 重构账户状态显示部分，将Typography和Chip组件分开，使用Box组件作为容器
     6. 将Typography组件的component属性设置为"span"，避免使用p标签
   - 影响范围：所有使用Material UI按钮的页面，特别是用户详情页面

4. **双因素认证设置页面空白问题**
   - 问题：双因素认证设置页面显示为空白
   - 原因：
     1. `AuthLayout`组件被设计为使用`<Outlet />`渲染子组件，但在`TwoFactorSetup.jsx`中直接作为普通组件使用
     2. `setup-two-factor`和`confirm-two-factor`接口需要用户已完全登录，但首次登录时用户只有临时令牌
   - 解决方案：
     1. 修改`AuthLayout`组件，支持两种使用方式：`{children || <Outlet />}`
     2. 修改后端接口，移除`[Authorize]`属性，改为接受临时令牌作为参数
     3. 更新前端代码，在调用这些接口时传递临时令牌

5. **双因素认证设置失败问题**
   - 问题：点击"下一步"按钮后提示失败
   - 原因：
     1. 前端和后端参数名称不一致，前端使用`tempToken`，后端使用`TempToken`
     2. 后端返回的字段名称是`secretKey`和`qrCodeUrl`，而前端期望的字段名称是`qrCode`和`secret`
   - 解决方案：
     1. 修改前端API调用，使用与后端一致的参数名称：`TempToken`和`Code`
     2. 更新`api.js`中的`setupTwoFactor`和`confirmTwoFactor`方法，确保参数名称正确
     3. 修改`AuthContext.jsx`中的字段映射，兼容不同的字段名称
     4. 禁用自动跳转到登录页面的功能，方便调试错误信息

6. **双因素认证确认失败问题**
   - 问题：在设置双因素认证时，验证码验证失败，提示"用户未设置双因素认证密钥"
   - 原因：
     1. 在`setupTwoFactor`接口中设置的密钥没有正确保存到数据库，或者在保存后被覆盖
     2. 前端和后端之间的通信中，密钥信息丢失
   - 解决方案：
     1. 修改后端`ConfirmTwoFactor`方法，支持从请求体中获取密钥，添加`SecretKey`属性到`ConfirmTwoFactorRequest`类
     2. 修改前端代码，在`setupTwoFactor`成功后将密钥保存到`localStorage`
     3. 在`confirmTwoFactorSetup`方法中，从`localStorage`获取密钥并传递给后端
     4. 在验证成功后，清除`localStorage`中的临时密钥

7. **双因素认证设置二维码获取失败问题**
   - 问题：点击"下一步"按钮后，获取二维码时服务器返回500错误
   - 原因：
     1. 后端`SetupTwoFactor`方法在处理过程中可能出现异常，但没有足够的错误处理和日志记录
     2. 前端没有正确处理服务器返回的错误状态码
   - 解决方案：
     1. 修改后端`SetupTwoFactor`方法，添加更详细的错误处理和日志记录
     2. 修改前端API调用，添加`validateStatus`配置，允许处理非500错误
     3. 增强前端错误处理，显示更详细的错误信息
     4. 在`AuthContext.jsx`中添加更严格的响应数据验证

8. **浏览器自动填充时输入框标签位置问题**
   - 问题：当浏览器自动填充用户名和密码时，Material UI的浮动标签没有正确地移动到左上角
   - 原因：浏览器的自动填充机制与Material UI的浮动标签动画存在冲突
   - 解决方案：
     1. 在TextField组件中添加特定的CSS规则来处理自动填充情况：
     ```jsx
     <TextField
       sx={{
         // 处理自动填充的样式
         '& input:-webkit-autofill': {
           WebkitBoxShadow: '0 0 0 1000px white inset',
           transition: 'background-color 5000s ease-in-out 0s',
         },
         '& input:-webkit-autofill ~ label': {
           transform: 'translate(14px, -9px) scale(0.75)',
           background: '#fff',
           padding: '0 5px',
         },
         '& .MuiInputBase-input:-webkit-autofill + fieldset + .MuiInputLabel-root': {
           transform: 'translate(14px, -9px) scale(0.75)',
           background: '#fff',
           padding: '0 5px',
         },
       }}
     />
     ```
     2. 这两种选择器都会将标签移动到左上角，并添加白色背景和适当的内边距

## 最近修复的功能问题

1. **管理员重置用户密码失败问题**
   - 问题：在用户管理页面，管理员尝试重置用户密码时返回400错误
   - 原因：
     1. 前端使用了`changePassword`接口，该接口需要当前密码，而管理员不知道用户的当前密码
     2. 后端`UsersController`中的`ChangePasswordDto`要求提供`CurrentPassword`字段
   - 解决方案：
     1. 修改前端代码，使用`resetPassword`接口而不是`changePassword`接口
     2. 在`AuthController`中增强`ResetPassword`方法，支持管理员重置密码的特殊标记
     3. 添加权限检查，确保只有系统管理员和商户管理员可以重置密码
     4. 商户管理员只能重置自己商户下用户的密码
   - 影响范围：用户管理页面中的密码重置功能

2. **密码重置功能安全性问题**
   - 问题：普通用户可以通过重置密码接口重置任何用户的密码
   - 原因：
     1. `ResetPassword`方法没有检查当前用户是否只能重置自己的密码
     2. 忘记密码页面没有真正调用后端API，只是模拟了API调用
     3. 缺少重置密码页面，用于用户点击邮件中的链接后重置密码
   - 解决方案：
     1. 修改`ResetPassword`方法，添加权限检查，确保普通用户只能重置自己的密码
     2. 修改`ForgotPassword.jsx`，使其真正调用后端API
     3. 创建`ResetPassword.jsx`页面，用于用户点击邮件中的链接后重置密码
     4. 更新路由配置，添加重置密码页面的路由
   - 影响范围：密码重置功能的安全性和用户体验

3. **管理员重置用户密码时authAPI未定义问题**
   - 问题：在用户详情页面，管理员尝试重置用户密码时出现"authAPI is not defined"错误
   - 原因：
     1. 在`UserDetailView.jsx`中使用了`authAPI`，但没有导入它
     2. 导入语句中只包含了`userAPI`, `roleAPI`和`merchantAPI`，缺少`authAPI`
   - 解决方案：
     1. 修改导入语句，添加`authAPI`：`import { userAPI, roleAPI, merchantAPI, authAPI } from '../../services/api';`
   - 影响范围：用户管理页面中的密码重置功能

4. **移动端表格操作按钮无法点击问题**
   - 问题：在移动设备上访问用户管理、角色管理、商户管理等页面时，表格右侧的操作按钮无法点击
   - 原因：
     1. 表格在小屏幕上溢出容器，导致右侧内容被截断或无法操作
     2. 缺少针对移动端的响应式设计，表格列数过多导致内容挤压
   - 解决方案：
     1. 为表格容器添加水平滚动支持：`<TableContainer component={Paper} sx={{ overflowX: 'auto' }}>`
     2. 设置表格最小宽度，确保内容不会过度压缩：`<Table sx={{ minWidth: 650 }}>`
     3. 在小屏幕上隐藏次要列，只保留关键信息：`<TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>`
     4. 为操作列添加固定宽度和不换行属性：`<TableCell align="right" sx={{ minWidth: 120, whiteSpace: 'nowrap' }}>`
   - 影响范围：所有包含表格的页面，包括用户管理、角色管理、商户管理等

## 最近修复的安全问题

1. **双因素验证绕过漏洞**
   - 问题：用户在双因素验证页面不完成验证，直接访问主页面(`/`)可以绕过验证
   - 原因：
     1. 路由保护不完整，只检查了用户是否已认证，没有检查是否需要完成双因素验证
     2. 缺少专门的双因素验证路由守卫
   - 解决方案：
     1. 创建专门的`TwoFactorGuard`组件，检查`needTwoFactor`状态
     2. 在路由配置中使用`TwoFactorGuard`包装所有受保护的路由
     3. 修改`DashboardLayout`组件，增加对`needTwoFactor`状态的检查
     4. 使用`useEffect`在`TwoFactorVerify`组件中处理重定向逻辑

2. **临时令牌API访问漏洞**
   - 问题：用户可以使用临时令牌（未完成双因素验证）访问需要完全认证的API
   - 原因：
     1. 后端API控制器使用了`[Authorize]`属性，但没有检查令牌是否为临时令牌
     2. JWT配置中没有添加对临时令牌的特殊处理
   - 解决方案：
     1. 在JWT Bearer认证中间件的`OnTokenValidated`事件中添加临时令牌检查
     2. 定义允许临时令牌访问的路径列表（如`/api/auth/verify-code`等）
     3. 对于不在允许列表中的路径，如果使用临时令牌访问，则拒绝访问
     4. 记录临时令牌使用日志，便于审计和排查问题

3. **双因素认证密钥安全漏洞**
   - 问题：在双因素认证确认过程中，前端需要将密钥明文传回服务器
   - 原因：
     1. `ConfirmTwoFactor`方法接受前端传回的密钥，而不是从数据库获取
     2. 前端在localStorage中存储密钥并在确认时传回
   - 解决方案：
     1. 修改`ConfirmTwoFactorRequest`类，移除`SecretKey`字段
     2. 修改`ConfirmTwoFactor`方法，只从数据库获取密钥
     3. 修改前端`confirmTwoFactorSetup`方法，不再传递密钥
     4. 确保前端在完成设置后清除localStorage中的临时密钥

4. **JWT令牌声明映射问题**
   - 问题：用户第一次登录设置双因素认证时，系统无法从临时令牌中提取用户ID
   - 原因：
     1. JWT验证过程中，`sub`声明被映射为`ClaimTypes.NameIdentifier`而不是`JwtRegisteredClaimNames.Sub`
     2. 在生成令牌时使用`JwtRegisteredClaimNames.Sub`，但在验证后查找时也使用相同的标识符
     3. 由于映射规则不一致，导致无法找到用户ID声明
   - 解决方案：
     1. 在`TokenValidationParameters`中设置`NameClaimType`和`RoleClaimType`，确保正确映射声明
     2. 在JWT Bearer认证中间件的`OnTokenValidated`事件中添加代码，将`ClaimTypes.NameIdentifier`映射回`JwtRegisteredClaimNames.Sub`
     3. 修改`ValidateToken`方法，增强其查找用户ID的能力，支持多种声明类型
     4. 确保在所有使用临时令牌的地方都能正确提取用户ID

5. **JWT令牌角色声明处理问题**
   - 问题：前端无法正确识别JWT令牌中的角色信息，导致系统设置页面权限检查失败
   - 原因：
     1. 后端使用`ClaimTypes.Role`（即`http://schemas.microsoft.com/ws/2008/06/identity/claims/role`）添加角色声明
     2. 前端直接使用`user.roles`访问角色信息，但JWT令牌中没有这个属性
     3. 前端没有处理JWT令牌中的角色声明格式
   - 解决方案：
     1. 在前端添加`processUserFromToken`函数，处理JWT令牌中的角色信息
     2. 将`http://schemas.microsoft.com/ws/2008/06/identity/claims/role`声明转换为`roles`数组
     3. 在所有使用`jwtDecode`的地方改为使用`processUserFromToken`函数
     4. 确保前端可以正确识别用户角色，并根据角色显示相应的内容

## 最近添加的功能

1. **微信扫码登录功能**
   - 功能:
     - 用户可以在账户设置页面中绑定微信账号
     - 已绑定微信的用户可以使用微信扫码方式登录系统
     - 用户可以在账户设置页面中解绑微信账号
   - 实现文件:
     - 后端:
       - `SlzrCrossGate.Core\Models\ApplicationUser.cs` - 添加微信相关字段
       - `SlzrCrossGate.WebAdmin\Services\WechatAuthService.cs` - 微信认证服务
       - `SlzrCrossGate.WebAdmin\Controllers\AuthController.cs` - 微信相关API接口
     - 前端:
       - `SlzrCrossGate.WebAdmin\ClientApp\src\pages\account\WechatBindingSection.jsx` - 微信绑定组件
       - `SlzrCrossGate.WebAdmin\ClientApp\src\pages\auth\WechatLogin.jsx` - 微信登录页面
       - `SlzrCrossGate.WebAdmin\ClientApp\src\contexts\AuthContext.jsx` - 微信登录相关方法
   - API接口:
     - `GET /api/Auth/Wechat-Login` - 获取微信登录二维码
     - `GET /api/Auth/Wechat-Login-Status` - 检查微信登录状态
     - `GET /api/Auth/Wechat-Callback` - 处理微信授权回调
     - `POST /api/Auth/Bind-Wechat` - 绑定微信账号
     - `POST /api/Auth/Unbind-Wechat` - 解绑微信账号
     - `GET /api/Auth/Wechat-Binding` - 获取微信绑定状态
   - 配置:
     - 在`appsettings.json`中添加微信相关配置:
       ```json
       "Wechat": {
         "AppId": "wx123456789abcdef",
         "AppSecret": "your_app_secret_here",
         "RedirectUrl": "https://localhost:7296/api/auth/wechat-callback",
         "QrCodeExpiryMinutes": 5
       }
       ```
     - 实际使用时需要替换为真实的微信开放平台应用信息

2. **账户设置页面**
   - 路径: `/app/account`
   - 功能:
     - 查看和编辑个人信息（邮箱、真实姓名）
     - 修改密码（需要输入当前密码）
     - 查看双因素认证状态
     - 绑定/解绑微信账号
   - 实现文件:
     - `SlzrCrossGate.WebAdmin\ClientApp\src\pages\account\AccountView.jsx`
     - 使用现有的API接口 `/api/users/{id}` 和 `/api/users/{id}/change-password`
   - 修复问题:
     - 修改了`UsersController.cs`中的`UpdateUser`方法，允许普通用户更新自己的信息
     - 将`[Authorize(Roles = "SystemAdmin,MerchantAdmin")]`改为`[Authorize]`
     - 添加了权限检查，确保普通用户只能修改自己的信息，不能修改角色和商户ID
     - 在`UserDto`类中添加了`IsTwoFactorEnabled`属性，修复了双因素认证状态显示问题
     - 修复了右上角用户菜单中的账户设置链接，使其正确导航到账户设置页面

## 最近添加的功能

1. **管理员重置用户双因素认证功能**
   - 功能：允许管理员重置用户的双因素认证设置，以便用户遗忘后能重新绑定
   - 权限控制：
     - 系统管理员可以重置任何用户的双因素认证
     - 商户管理员只能重置其商户下用户的双因素认证
   - 实现文件：
     - 后端：`SlzrCrossGate.WebAdmin\Controllers\UsersController.cs` - 添加 `ResetTwoFactor` 方法
     - 前端：`SlzrCrossGate.WebAdmin\ClientApp\src\pages\users\UserDetailView.jsx` - 添加重置按钮和确认对话框
     - API：`SlzrCrossGate.WebAdmin\ClientApp\src\services\api.js` - 添加 `resetTwoFactor` 方法
   - API接口：
     - `POST /api/users/{id}/reset-two-factor` - 重置用户的双因素认证
   - 使用方式：
     - 在用户详情页面的"安全设置"标签页中，当用户已启用双因素认证时，显示"重置双因素认证"按钮
     - 点击按钮后弹出确认对话框，确认后重置用户的双因素认证设置
     - 重置后，用户的双因素认证将被禁用，用户需要重新设置才能继续使用

## 未来改进计划
1. 添加更多的单元测试和集成测试
2. 实现更完善的错误处理和日志记录
3. 优化应用性能，减少不必要的重新渲染
4. 增强安全性，实现更完善的认证和授权机制
5. 改进用户体验，添加更多的交互反馈和动画效果
6. 完善用户管理、角色管理和商户管理功能
7. 实现文件管理模块的上传、预览和版本控制功能
8. 优化移动端体验，提高响应式设计的适配性
   - 已完成表格组件的移动端优化，在小屏幕上隐藏次要列，保留关键信息
   - 确保操作按钮在移动端可见且可点击
   - 添加水平滚动支持，防止表格溢出容器
9. 实现微信扫码登录功能

## TCP服务部署问题诊断

### CentOS7环境TCP服务连接问题
- **问题现象**：ApiService在CentOS7上通过Docker Compose部署后，TCP服务有连接建立但立即断开的问题
- **问题分析**：
  1. **连接超时机制**：TcpConnectionHandler设置了30秒未认证连接超时，如果客户端连接后未发送有效ISO 8583消息会被断开
  2. **消息格式验证**：要求严格的ISO 8583消息格式，报文头必须为`6000000000`，消息长度至少7字节
  3. **环境差异**：CentOS7与Docker Desktop环境在网络配置、防火墙、资源限制等方面可能存在差异
- **诊断步骤**：
  1. 检查客户端是否发送了数据：`docker logs tcpserver-api --tail 100 | grep -E "(New connection|Connection closed|Error|Exception)"`
  2. 启用详细日志记录，查看接收到的原始数据
  3. 检查网络连通性：`telnet <server-ip> 8822`
  4. 检查防火墙设置：`firewall-cmd --list-ports`
  5. 监控网络流量：`tcpdump -i any port 8822`
- **临时解决方案**：
  1. 增加连接超时时间到300秒用于调试
  2. 添加详细的数据接收日志
  3. 添加连接保持机制
  4. 优化错误处理和日志记录

## 最近更新记录

### 2024-12-19
- **解决了前端时区显示问题**：
  - 问题：数据库存储的时间（如`2025-06-12T07:07:28.255875`）在前端显示时没有进行时区转换，导致显示的时间与用户期望的本地时间不符
  - 解决方案：
    1. 创建了统一的时间处理工具`src/utils/dateUtils.js`，提供以下功能：
       - `formatDateTime()`: 格式化日期时间，自动处理时区转换
       - `formatDate()`: 格式化日期（不包含时间）
       - `formatTime()`: 格式化时间（不包含日期）
       - `formatRelativeTime()`: 格式化相对时间（如：2小时前）
       - `isWithinMinutes()`: 检查时间是否在指定分钟内（用于判断在线状态）
       - `getTimezoneInfo()`: 获取当前时区信息
    2. 更新了所有相关页面，使用新的时间处理工具替代直接的`format()`调用：
       - `TerminalList.jsx`: 终端列表页面的最后活跃时间显示和在线状态判断
       - `TerminalEvents.jsx`: 终端事件页面的事件时间显示
       - `PlatformDashboard.jsx`: 平台仪表盘的服务器时间和事件统计
       - `MerchantDashboard.jsx`: 商户仪表盘的事件时间显示
       - `MessageList.jsx`: 消息列表的发送时间和读取时间显示
       - `FileVersionList.jsx`: 文件版本列表的上传时间显示
    3. 工具函数特点：
       - 自动处理ISO字符串和Date对象的转换
       - 使用浏览器的本地时区进行显示，无需手动配置
       - 统一的错误处理和日志记录
       - 支持中文本地化（使用date-fns的zhCN locale）
  - 影响：现在所有时间显示都会自动转换为用户的本地时区，解决了+8时区用户看到UTC时间的问题

- **解决了日期筛选的时区问题**：
  - 问题：用户在+8时区选择日期"2025-01-01"进行查询时，如果直接传递给后端，可能被误解为UTC时间，导致查询到错误的时间范围
  - 解决方案：
    1. 新增了`formatDateForAPI()`和`formatDateTimeForAPI()`函数，专门用于API查询时的日期格式化
    2. `formatDateForAPI(localDate, isStartOfDay)`功能：
       - `isStartOfDay=true`: 将本地日期转换为当天00:00:00对应的UTC时间
       - `isStartOfDay=false`: 将本地日期转换为当天23:59:59对应的UTC时间
    3. 更新了相关页面的日期筛选逻辑：
       - `TerminalEvents.jsx`: 事件查询的开始和结束日期
       - `MessageList.jsx`: 消息查询的开始和结束日期
    4. 创建了测试页面`TimezoneTest.jsx`用于验证时区转换功能
  - 示例：用户在+8时区选择"2025-01-01"查询：
    - 开始时间：`2025-01-01 00:00:00 +8` → `2024-12-31T16:00:00.000Z` (UTC)
    - 结束时间：`2025-01-01 23:59:59 +8` → `2025-01-01T15:59:59.999Z` (UTC)
  - 影响：确保用户的日期筛选查询到的是期望的本地时间范围内的数据，而不是错误的UTC时间范围

- **完成了后端时间统一调整**：
  - 调整：将后端所有 `DateTime.UtcNow` 替换为 `DateTime.Now`，统一使用服务器本地时间
  - 优势：
    1. 简化了时区处理逻辑，数据库存储的就是本地时间
    2. 开发和调试更直观，数据库中的时间一目了然
    3. 减少了前后端时区转换的复杂性
  - 前端配置：`dateUtils.js` 中的 `BACKEND_USES_LOCAL_TIME = true` 确保前端正确处理本地时间
  - 最终方案：后端使用 `DateTime.Now`（本地时间）+ 前端智能时间处理工具 = 完美的时区解决方案

- **优化了终端API返回商户名称**：
  - 问题：`GetTerminals` 和 `GetTerminal` API 只返回商户ID，前端显示时无法直接显示商户名称
  - 解决方案：
    1. 修改了 `TerminalsController` 中的查询逻辑，使用 JOIN 查询获取商户信息
    2. 在 `GetTerminals` 方法中：
       - 使用 `query.Join(_dbContext.Merchants, ...)` 关联查询商户表
       - 在 DTO 转换时设置 `MerchantName = tm.Merchant.Name ?? ""`
    3. 在 `GetTerminal` 方法中：
       - 同样使用 JOIN 查询获取单个终端的商户信息
       - 确保返回的 DTO 包含商户名称
    4. 处理了文件版本筛选的特殊情况，确保在内存筛选时也能获取商户名称
  - 影响：前端现在可以直接显示商户名称，提升用户体验，减少额外的API调用

- **修复了终端事件查询的时区转换异常**：
  - 问题：查询终端事件时出现 `System.ArgumentException: The conversion could not be completed because the supplied DateTime did not have the Kind property set correctly`
  - 根本原因：
    1. `TerminalEvent` 模型使用 `LocalTimeHelper.Now` 作为默认值
    2. EF Core 从数据库读取数据时会实例化模型对象，触发默认值计算
    3. `LocalTimeHelper.Now` 中的时区转换逻辑在某些情况下会因为 `DateTime.Kind` 不正确而失败
  - 解决方案：
    1. 修改 `TerminalEvent.EventTime` 的默认值从 `LocalTimeHelper.Now` 改为 `DateTime.Now`
    2. 简化 `LocalTimeHelper.Now` 的实现，直接返回 `DateTime.Now` 避免复杂的时区转换
    3. 确保所有模型的时间字段都使用简单的 `DateTime.Now` 作为默认值
  - 影响：解决了查询终端事件时的异常，确保系统稳定运行

- **清理了不必要的 LocalTimeHelper 类**：
  - 原因：既然后端统一使用 `DateTime.Now` 且服务器时区配置正确，`LocalTimeHelper` 变得多余
  - 清理内容：
    1. 删除了 `SlzrCrossGate.Core\Utils\LocalTimeHelper.cs` 文件
    2. 修改 `TimezoneMigrationHelper.cs` 中的引用，改为直接使用 `DateTime.Now` 和 `TimeZoneInfo.Local`
    3. 清理了 `TerminalEvent.cs` 中不需要的 using 语句
  - 影响：简化了代码结构，减少了不必要的复杂性，降低了维护成本

### 2024-12-19
- **实现了ASP.NET Core健康检查功能**：
  - 为ApiService和WebAdmin项目添加了健康检查支持
  - 健康检查端点：
    - `/health`：完整健康检查，包括数据库连接检查
    - `/alive`：基础存活检查，仅检查应用程序响应性
  - 集成的健康检查项目：
    - MySQL数据库连接检查（使用AspNetCore.HealthChecks.MySql 8.0.1）
    - 基础应用程序存活检查（ServiceDefaults内置）
  - RabbitMQ健康检查暂时移除，因为AspNetCore.HealthChecks.RabbitMQ 8.0.2与项目使用的RabbitMQ.Client 7.1.2版本不兼容
  - 修改了ServiceDefaults配置，使健康检查端点在所有环境（包括生产环境）中都可用，以支持Docker容器健康检查
  - Docker Compose配置中的健康检查现在可以正常工作：
    - ApiService: `http://localhost:8000/health`
    - WebAdmin: `http://localhost/health`

- **解决了MySQL utf8mb4字符集下Identity表索引长度超限问题**：
  - 问题：MySQL在utf8mb4字符集下，varchar(255)字段占用255×4=1020字节，超过767字节索引键长度限制
  - 原因：ASP.NET Core Identity默认使用varchar(255)作为ID字段长度，在utf8mb4字符集下会导致"Specified key was too long; max key length is 767 bytes"错误
  - 解决方案：
    1. 在TcpDbContext的OnModelCreating方法中配置Identity表的字符串长度限制为128字符
    2. 删除所有现有迁移文件，重新生成包含正确字符串长度的初始迁移
    3. 手动标记现有数据库的迁移状态，确保兼容性
    4. 新的迁移确保所有Identity表字段长度不超过128字符（128×4=512字节 < 767字节）
  - 影响：
    - 现有数据库：通过手动标记迁移状态，可以正常更新和运行
    - 新数据库：可以从零开始正常部署，不会遇到索引长度限制错误
    - 所有Identity相关功能：用户登录、角色管理、权限控制等功能正常工作
  - 配置的字段长度：
    - AspNetUsers/AspNetRoles的Id字段：varchar(128)
    - UserName/Email/NormalizedUserName/NormalizedEmail：varchar(128)
    - 外键字段（UserId/RoleId）：varchar(128)
    - LoginProvider/ProviderKey/Name等：varchar(128)

### 2024-12-19
- **实现了终端记录查询功能**：
  - 功能：为WebAdmin添加终端记录查询页面，用于查询和导出ConsumeData表中的交易记录
  - 后端实现：
    1. 创建了`ConsumeDataController`控制器，提供查询和导出API
    2. 创建了`ConsumeDataDto`数据传输对象，包含Buffer字段的HEX格式转换
    3. 扩展了`ConsumeDataService`服务，添加分页查询和权限控制功能
  - 前端实现：
    1. 创建了`TerminalRecords.jsx`页面，支持多条件筛选和分页查询
    2. 添加了路由配置`/app/terminal-records`
    3. 在侧边栏添加了"终端记录"菜单项
    4. 在`api.js`中添加了`consumeDataAPI`相关接口
  - 功能特性：
    - 支持商户筛选（非系统管理员只能查看自己商户的记录）
    - 支持出厂序列号（MachineID）和设备编号（MachineNO）筛选
    - 支持接收时间范围筛选
    - 支持分页查询和排序
    - 支持CSV导出，Buffer字段自动转换为HEX格式
    - 响应式设计，移动端友好
  - API端点：
    - `GET /api/ConsumeData` - 分页查询终端记录
    - `GET /api/ConsumeData/export` - 导出CSV文件
  - 权限控制：SystemAdmin和MerchantAdmin角色可访问，商户管理员只能查看自己商户的数据

- **创建了完整的服务器运维文档**：
  - 文件：`registry-deployment-guide.md`
  - 内容：详细的服务器部署、运行、维护指南，包括：
    1. 服务器环境要求和前置条件
    2. 部署准备和环境配置
    3. 服务部署和配置步骤
    4. 日常维护和服务管理命令
    5. 镜像更新和版本管理
    6. 监控和健康检查
    7. 故障排除和性能优化
    8. 安全配置和访问控制
    9. 备份和恢复策略
    10. 常用运维命令速查表
    11. 环境变量、端口映射、数据卷说明
    12. 私有镜像仓库管理
    13. 故障排除检查清单
  - 特点：
    - 涵盖了从部署到日常维护的完整运维流程
    - 提供了详细的命令示例和配置文件
    - 包含了监控脚本和自动化备份方案
    - 提供了完整的故障排除指南
    - 适用于生产环境的服务器运维
- **修复了大量C# 8.0可空引用类型警告**：
  - **SlzrCrossGate.Core项目**：为所有必需的字符串属性添加了`required`修饰符或默认值，修复了FormFile构造函数中的null参问题，解决了异步方法缺少await的警告，优化了MsgBoxRepository的主构造函数参数捕获问题，添加了缺失的Iso8583MessageType.MsgConfirmResponse常量
  - **SlzrCrossGate.WebAdmin项目**：修复了SystemSettingsService、UsersController、WechatAuthService、SystemSettingsController、TerminalsController、FileVersionsController、AuthController中的null引用问题
  - **总计修复了32个编译警告**，项目现在可以无警告构建
- **简化了数据保护配置**：
  - 移除了复杂的平台特定加密配置
  - 开发环境使用默认文件系统存储，生产环境可选配置X509证书加密
  - 统一了跨平台的数据保护策略，避免了Linux环境下的兼容性问题
- **优化了前端终端管理页面性能**：
  - 修复了重复API请求问题，分离了数据加载逻辑
  - 修复了MUI Autocomplete的警告，改进了商户选择组件
  - 使用Promise.all并行加载终端列表和统计数据
  - 使用useCallback优化函数重新创建，减少不必要的重渲染
  - 只在组件首次加载时获取消息类型和文件版本数据
- **修复了终端管理页面文件发布功能**：
  - 问题：发布文件时加载的是所有文件版本，而不是当前终端所在商户下的文件版本
  - 解决方案：
    1. 修改`loadFileVersions`方法，添加`merchantId`参数支持
    2. 修改`openFileDialog`方法，在打开对话框时根据终端的商户ID加载对应的文件版本
    3. 移除组件初始化时的文件版本加载，改为按需加载
  - 影响：确保用户只能看到和选择当前终端所在商户下的文件版本，提高了数据安全性和用户体验
- **修复了Docker部署配置问题**：
  - 问题：Dockerfile和docker-compose.yml中使用了错误的端口7296（开发环境端口）
  - 原因：7296端口来自launchSettings.json中的开发环境HTTPS配置，不应在生产容器中使用
  - 解决方案：
    1. 修改Dockerfile，将`EXPOSE 7296`改为`EXPOSE 80`和`EXPOSE 443`
    2. 添加正确的环境变量`ASPNETCORE_URLS=http://+:80;https://+:443`
    3. 修改docker-compose.yml，将端口映射改为`8080:80`和`8443:443`
    4. 更新appsettings.Production.json中的Kestrel配置，使用标准的80和443端口
    5. 修复健康检查URL，使用正确的容器内部端口
  - 影响：确保Docker容器使用标准的HTTP/HTTPS端口，符合生产环境最佳实践
- **优化了反向代理架构**：
  - 移除了容器内部的HTTPS重定向，改为在Nginx层处理HTTPS
  - 添加了`UseForwardedHeaders`中间件，正确处理反向代理的头部信息
  - 容器内部只监听HTTP端口80，HTTPS由Nginx反向代理处理
  - 修正了Nginx配置文件中的端口和语法错误
  - 这种架构更符合微服务部署的最佳实践，SSL终止在代理层
- **修复了ApiService项目的端口配置不一致问题**：
  - 问题：多个配置文件中的端口设置不一致，导致容器运行时端口冲突
  - 发现的冲突：
    1. Program.cs默认端口：8000/8001
    2. appsettings.Production.json：5000/5001
    3. docker-compose.yml映射：5000:5000, 5001:5001
    4. Dockerfile EXPOSE：8000/8001
  - 解决方案：
    1. 移除appsettings.Production.json中的Kestrel端点配置，使用Program.cs中的动态配置
    2. 修正docker-compose.yml端口映射为`5000:8000`和`5001:8001`
    3. 添加环境变量`HTTP_PORT=8000`和`TCP_PORT=8001`明确指定容器内部端口
    4. 修正健康检查URL使用正确的容器内部端口8000
    5. 移除ApiService中的HTTPS重定向，与WebAdmin保持一致
  - 影响：确保ApiService容器使用一致的端口配置，避免运行时端口冲突
- 修复了RabbitMQService的连接管理问题，改进了连接恢复机制
- 优化了消息发布的错误处理逻辑
- 添加了连接状态监控和自动重连功能
