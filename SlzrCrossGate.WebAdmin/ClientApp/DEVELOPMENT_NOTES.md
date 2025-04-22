# WebAdmin 项目开发备忘录

## 项目概述

WebAdmin 是一个终端后台管理系统，使用 React + Material UI 作为前端技术栈，.NET 8.0 + Identity 作为后端技术栈。项目采用科技感/简约设计风格，包含用户角色管理、商户管理、终端管理、文件管理、消息管理和仪表盘等多个核心功能模块。

## 前端技术栈

- React 18
- Material UI 5
- Vite 5.4.18 (构建工具)
- React Router 6 (路由)
- Formik + Yup (表单处理和验证)
- Notistack (通知提示)
- React Feather (图标库)

## 项目结构

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

## 样式风格指南

### 设计风格

项目采用玻璃拟态+微立体感风格，主要特点如下：

1. **基础风格**
   - 以深色模式为基础
   - 主色使用 #7E22CE（紫色）
   - 所有组件需有动画效果

2. **组件规范**
   - DataGrid: 带有半透明背景、圆角边框和阴影
   - AppBar: 半透明模糊背景，带有细微的边框
   - 按钮: 带有悬停和点击动画效果
   - 卡片: 半透明背景，带有模糊效果和细微阴影

3. **禁止事项**
   - 禁止使用纯色背景卡片
   - 禁止使用直角边框
   - 禁止使用线性渐变

### 布局

1. **主应用布局 (DashboardLayout)**
   - 左侧固定侧边栏 (宽度: 280px)
   - 顶部有 64px 的空间预留给未来可能添加的顶部导航栏
   - 内容区域自适应宽度，有适当的内边距

2. **认证页面布局 (AuthLayout)**
   - 居中显示的卡片式布局
   - 使用 Paper 组件提供阴影和边框
   - 内容垂直和水平居中

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

5. **图标**
   - 主要使用 React Feather 图标库
   - 图标大小通常为 `fontSize="small"` 或 `fontSize="medium"`
   - 在按钮中使用图标时，添加适当的 margin

### 响应式设计

- 使用 Material UI 的 Grid 系统进行响应式布局
- 使用 `useMediaQuery` 钩子检测屏幕尺寸
- 在小屏幕上隐藏侧边栏或使用抽屉式导航
- 表格在小屏幕上可能需要水平滚动

## 常见问题和解决方案

### 1. JSX 语法错误

**问题**: 使用 .js 扩展名的文件中的 JSX 语法无法被正确解析。

**解决方案**:
- 将包含 JSX 的文件重命名为 .jsx 扩展名
- 或者在 vite.config.js 中添加配置:
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

### 2. 路径问题

**问题**: 路由路径不匹配或导航链接错误。

**解决方案**:
- 确保路由定义中的路径与导航链接一致
- 认证相关页面的路径为: `/login`, `/register`, `/forgot-password`
- 应用内页面的路径格式为: `/app/[module]`
- 404 页面的路径为: `/app/404`
- 使用 `<Navigate to="/app/dashboard" />` 进行重定向

### 3. 导航属性查询问题

**问题**: 在 .NET 控制器中使用导航属性进行查询可能导致性能问题。

**解决方案**:
- 避免使用导航属性，改用显式的联结查询
- 例如，将 `query.Include(m => m.MsgContent).ThenInclude(c => c.MsgType)`
  改为 LINQ 联结查询:
  ```csharp
  var query = from msgBox in _dbContext.MsgBoxes
              join msgContent in _dbContext.MsgContents on msgBox.MsgContentID equals msgContent.ID
              join msgType in _dbContext.MsgTypes on msgContent.MsgTypeID equals msgType.ID
              select new { ... };
  ```

### 4. 组件导入问题

**问题**: 找不到导入的组件或模块。

**解决方案**:
- 检查导入路径是否正确
- 确保已安装相关依赖
- 对于第三方库，可能需要安装特定版本，例如:
  ```bash
  npm install react-feather --save
  ```

### 5. 布局一致性问题

**问题**: 某些页面的布局与应用的其他部分不一致。

**解决方案**:
- 确保所有页面都使用正确的布局组件
- 主应用页面应使用 DashboardLayout
- 认证页面应使用 AuthLayout
- 错误页面 (如 404) 应使用 DashboardLayout 以保持一致性

## 开发最佳实践

1. **文件命名**
   - React 组件文件使用 .jsx 扩展名
   - 组件名使用 PascalCase (如 UserDetail.jsx)
   - 工具函数文件使用 .js 扩展名
   - 工具函数名使用 camelCase

2. **组件结构**
   - 使用函数组件和 React Hooks
   - 将大型组件拆分为更小的可复用组件
   - 使用 Context API 管理全局状态

3. **样式管理**
   - 使用 Material UI 的 sx 属性进行样式定制
   - 对于复杂组件，使用 styled 函数创建样式化组件
   - 保持样式的一致性，遵循项目的样式风格指南

4. **API 调用**
   - 使用服务模块封装 API 调用
   - 处理加载状态和错误状态
   - 使用 try/catch 块捕获异常

5. **表单处理**
   - 使用 Formik 管理表单状态
   - 使用 Yup 进行表单验证
   - 提供清晰的错误消息和视觉反馈

6. **路由管理**
   - 在 routes.jsx 中集中管理路由
   - 使用嵌套路由组织相关页面
   - 实现路由守卫保护需要认证的路由

## 部署注意事项

1. 构建前端应用:
   ```bash
   npm run build
   ```

2. 构建输出位于 `dist` 目录，需要将其内容复制到 .NET 项目的 `wwwroot` 目录

3. 确保 .NET 后端正确配置了静态文件中间件和 SPA 回退路由

4. 对于 API 路径，确保在生产环境中使用正确的基础 URL

## 登录系统与双因素验证

### 登录流程

1. **用户名密码登录**
   - 用户输入用户名和密码
   - 后端验证成功后，根据用户配置返回不同的响应：
     - 如果用户已启用双因素验证，返回 `requireTwoFactor: true` 和临时令牌 `tempToken`
     - 如果是新用户首次登录需要设置双因素验证，返回 `setupTwoFactor: true` 和临时令牌 `tempToken`
     - 如果不需要双因素验证，直接返回完整的 `token`

2. **双因素验证**
   - 用户输入动态口令（6位数字）
   - 后端验证成功后，返回完整的 `token`
   - 验证页面路径：`/two-factor-verify`

3. **双因素验证设置**
   - 新用户首次登录时，引导设置双因素验证
   - 设置流程包括三个步骤：下载验证器应用、扫描二维码、验证设置
   - 设置页面路径：`/two-factor-setup`

4. **微信扫码登录**
   - 用户选择微信扫码登录选项
   - 显示微信登录二维码
   - 用户扫码后，前端定期检查登录状态
   - 登录成功后，直接获取完整的 `token`，无需双因素验证
   - 微信登录页面路径：`/wechat-login`

### 相关组件和文件

1. **认证上下文**
   - 文件路径：`src/contexts/AuthContext.jsx`
   - 主要状态：
     - `isAuthenticated`: 用户是否已认证
     - `user`: 当前用户信息
     - `token`: JWT 令牌
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

### 后端 API 需求

1. `/api/auth/login`
   - 方法：POST
   - 参数：`username`, `password`
   - 返回：
     - 正常登录：`{ token: "...", isTwoFactorEnabled: false }`
     - 需要双因素验证：`{ requireTwoFactor: true, tempToken: "..." }`
     - 需要设置双因素验证：`{ setupTwoFactor: true, tempToken: "..." }`

2. `/api/auth/verify-two-factor`
   - 方法：POST
   - 参数：`code`, `tempToken`
   - 返回：`{ token: "...", isTwoFactorEnabled: true }`

3. `/api/auth/setup-two-factor`
   - 方法：POST
   - 参数：`tempToken`
   - 返回：`{ qrCode: "data:image/png;base64,...", secret: "ABCDEF123456" }`

4. `/api/auth/confirm-two-factor`
   - 方法：POST
   - 参数：`code`, `tempToken`
   - 返回：`{ token: "..." }`

5. `/api/auth/wechat-login`
   - 方法：GET
   - 返回：`{ qrCodeUrl: "data:image/png;base64,...", loginId: "unique-id" }`

6. `/api/auth/wechat-login-status`
   - 方法：GET
   - 参数：`loginId`
   - 返回：
     - 等待扫码：`{ status: "waiting" }`
     - 已扫码未确认：`{ status: "scanned" }`
     - 登录成功：`{ status: "success", token: "..." }`
     - 二维码过期：`{ status: "expired" }`

## 移动端适配

### 侧边栏导航

1. **移动端侧边栏实现**
   - 使用 Material UI 的 Drawer 组件，设置 `variant="temporary"`
   - 通过 `openMobile` 状态控制侧边栏的显示和隐藏
   - 点击菜单按钮打开侧边栏，点击外部区域或关闭按钮关闭侧边栏

2. **关键文件**
   - `src/layouts/DashboardLayout.jsx`: 管理侧边栏状态
   - `src/layouts/DashboardSidebar.jsx`: 侧边栏组件
   - `src/layouts/DashboardNavbar.jsx`: 顶部导航栏，包含菜单按钮

3. **注意事项**
   - 使用 `useRef` 跟踪路由变化，避免在组件挂载时关闭侧边栏
   - 在路由变化时关闭侧边栏，但不在 `openMobile` 状态变化时触发关闭
   - 使用 `e.stopPropagation()` 阻止事件冒泡，避免意外关闭
   - 设置适当的 `zIndex` 确保侧边栏在正确的层级显示

## 未来改进计划

1. 添加更多的单元测试和集成测试
2. 实现更完善的错误处理和日志记录
3. 优化应用性能，减少不必要的重新渲染
4. 增强安全性，实现更完善的认证和授权机制
5. 改进用户体验，添加更多的交互反馈和动画效果
6. 完善用户管理、角色管理和商户管理功能
7. 实现文件管理模块的上传、预览和版本控制功能
8. 优化移动端体验，提高响应式设计的适配性
