
# 遵循以下内容：
1. 使用中文回答 
2. 每个会话开始前，请先查看开发备忘录NOTES.MD，如不存在请创建。
3. 请保持每个前端项目中页面风格、样式、布局、路由规则的一致性，后端接口的逻辑正确性，接口风格一致性。 
4. 每次有重要更新或调整后，请主动更新备忘录 NOTES.MD
5. 对生成的代码写好注释
6. 生成的代码需要遵循基本软件设计原则，如 DRY,SOLID
7. 使用思维链推理来进行代码 DEBUG
8. 每处的修改需要从整体上审视相关依赖，所有涉及到的地方都需要同步修改，不可漏改，漏删，也不可多改
9. 每次修改代码之前，不清楚的地方及时提问
10. 不要修改未提及的功能

# WebAdmin项目概述
- 用户正在开发WebAdmin项目，需要实现终端后台管理功能，技术栈为React+Material UI前端和.NET 8.0+Identity后端，要求科技感/简约设计风格，包含用户角色管理、商户管理、终端管理、文件管理、消息管理和仪表盘等多个核心功能模块。
- 用户希望WebAdmin项目中所有页面（包括404错误页面）都保持统一的布局、菜单和风格。
- 用户正在考虑从WebAdmin项目中移除MainLayout目录及其文件。
- 用户希望完成WebAdmin项目中app/users, app/roles, 和 app/merchants 页面的开发和功能实现。
- WebAdmin项目中的文件管理页面尚未实现。
- WebAdmin项目中应移除侧边栏底部的帮助信息区域。
- WebAdmin项目采用前后端分离部署，前端和后端需要单独运行，且可能存在前端请求后端地址配置问题。
- WebAdmin项目中的后端API使用HTTPS协议(https://localhost:7296)而非HTTP。
- WebAdmin项目中存在登录成功后仍有组件继续请求登录地址的问题。
- WebAdmin项目需要添加用户手动登出功能，目前用户无法手动登出系统。
- WebAdmin项目需要实现用户账户页面，支持用户修改自己的密码功能。
- WebAdmin项目中用户管理页面的密码修改功能应使用密码重置接口，而非用户自己修改密码的接口。
- In the WebAdmin project, ordinary users should only be able to reset their own passwords, while administrators can reset passwords for other users.
- WebAdmin项目需要优化移动端用户管理页面的按钮布局，确保右侧按钮在移动设备上可操作。
- WebAdmin项目前端调用了获取当前用户信息的接口，但后端尚未实现该接口，需要添加。
- WebAdmin项目使用MySQL数据库，用户已经启动好数据库服务，不应修改数据库连接配置。
- User's account already has SystemAdmin role in the WebAdmin project.
- WebAdmin项目需要增加管理员重置用户双因素认证密钥的功能，系统管理员可操作所有用户，商户管理员仅可操作本商户用户。

# WebAdmin UI设计规范
- WebAdmin项目UI需要改进：侧边栏应可折叠、移动端需优化导航、增加明暗主题切换功能、整体设计需更现代化精美。
- WebAdmin项目UI设计偏好为玻璃拟态+微立体感风格，深色模式为基础，主色使用#7E22CE，所有组件需有动画效果，包含特定的DataGrid、AppBar、按钮和卡片样式规范，禁止使用纯色背景卡片、直角边框和线性渐变。
- 用户偏好之前的UI布局方式，认为之前的设计更美观。
- WebAdmin项目中的输入框应保留Material UI的浮动标签动画效果，即初始显示占位符文本，输入时标签浮动到左上方。
- WebAdmin项目中的输入框应保持Material UI的原始标签动画效果。
- In the WebAdmin project, when browser autofill populates username/password fields, the Material UI floating labels don't automatically move to the top-left corner as they should.
- WebAdmin项目中密码框在自动填充状态下的标签位置问题暂时搁置，等有更好的解决方案再处理。

# WebAdmin React项目配置
- The WebAdmin React project uses Vite and requires JSX configuration for .js files, needing 'loader: { '.js': 'jsx' }' in the Vite config.
- WebAdmin前端项目应使用3000端口启动，而非其他端口。
- 安装依赖包时需要先检查版本兼容性，确保与当前项目版本兼容。
- WebAdmin项目中TwoFactorSetup组件已经实现了二维码显示功能，可以作为双因素认证二维码显示的参考实现。

# WebAdmin .NET后端开发注意事项
- 在.NET控制器中应避免使用导航属性，而应使用显式的联结查询，尤其是在FilePublishController.cs中。
- RabbitMQService被设计为单例模式，使用单一_channel实例供所有服务共享，用户对此设计模式有疑虑。用户希望RabbitMQService更健壮，性能更好，并能从断开连接中自动恢复，同时保持当前功能。
- Backend APIs should check if the current token is a temporary token to maintain proper security in the authentication flow.
- WebAdmin项目中所有带[Authorize]特性的后端API接口都应检查token是否为临时token，以确保双因素认证的安全性。
- 在JWT令牌验证过程中，原始令牌中的JwtRegisteredClaimNames.Sub声明在验证后的principal中丢失，当前的解决方案不够优雅，需要找出根本原因。
- User prefers to remove the 'AspNet' prefix from Identity framework's automatically generated user and role tables.
- 项目使用.NET 8和EntityFramework Core 8，安装依赖时需确保版本兼容性。
- API endpoints in the WebAdmin project use PascalCase naming convention (e.g., 'api/SystemSettings') rather than kebab-case (e.g., 'api/system-settings').
- WebAdmin项目后端应使用HTTPS协议启动，而非HTTP。

# WebAdmin 登录需求与安全
- WebAdmin项目的登录需求包括双因素验证（用户名密码+动态口令）、可针对用户开关动态口令功能、新用户首次登录需引导绑定动态口令，以及微信扫码登录功能（无需动态口令验证）。
- WebAdmin项目中新用户首次登录需要先进行动态密码绑定，除非系统全局禁用了强制双因素认证。
- In the WebAdmin project, if system-wide forced two-factor authentication is disabled, new users should not be required to set up 2FA and users should be able to choose whether to enable it themselves.
- WebAdmin项目中用户应能够在账户设置中自行启用/禁用双因素认证，除非系统设置强制启用双因素认证，或者管理员已专门为该用户要求启用双因素认证。
- WebAdmin项目的AuthController中login接口需要实现双因素认证相关的判断和返回功能。
- WebAdmin项目存在安全漏洞，用户可以在双因素认证验证步骤通过直接访问首页绕过验证。
- In the two-factor authentication flow, the secret key should not be sent from frontend to backend during confirmation, but should be retrieved from the database for security.
- User prefers simpler code in AuthController's SetupTwoFactor and ConfirmTwoFactor methods, specifically for user ID retrieval logic.
- WebAdmin项目需要实现微信扫码登录功能，允许用户在账户设置页面中绑定微信账号。
- User prefers to use WeChat Open Platform for authentication in the WebAdmin project.
- 用户对每增加一种登录方式都需要修改ApplicationUser表的做法表示疑虑，暗示可能需要考虑更灵活的身份验证架构设计。
- User prefers to keep login methods directly in ApplicationUser table rather than creating a separate external login table structure, as they believe extension possibilities are limited.
- User is interested in WeChat Official Account integration rather than WeChat Open Platform for authentication.
- WebAdmin项目需要一个系统设置页面，用于全局启用/禁用强制双因素认证和微信登录，并允许超级管理员为单个用户切换强制双因素认证。
- WebAdmin项目中用户管理页面不需要提供启用双因素认证的功能。

# WebAdmin开发备忘录
- The WebAdmin project already has a development memo file in markdown format.
- WebAdmin项目需要更新开发备忘录，确保前端项目的样式布局、路由风格的统一性，以及后端API的一致性。
- WebAdmin项目需要创建开发备忘录，记录页面样式风格和常见路径异常问题，以便快速恢复工作状态。
- WebAdmin项目开发备忘录应只使用NOTES.md一个文件，不再使用BACKEND_NOTES.md和clientApp/DEVELOPMENT_NOTES.md