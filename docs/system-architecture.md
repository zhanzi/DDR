# WebAdmin 系统架构设计文档

## 文档信息

- **项目名称**: SlzrCrossGate WebAdmin 终端管理系统
- **文档版本**: v1.0
- **创建日期**: 2024-12-20
- **文档类型**: 系统架构设计
- **适用范围**: 开发团队、运维团队、技术决策

## 目录

1. [系统概述](#1-系统概述)
2. [架构设计](#2-架构设计)
3. [技术选型](#3-技术选型)
4. [模块设计](#4-模块设计)
5. [数据架构](#5-数据架构)
6. [接口设计](#6-接口设计)
7. [安全架构](#7-安全架构)
8. [部署架构](#8-部署架构)
9. [性能设计](#9-性能设计)
10. [扩展性设计](#10-扩展性设计)

---

## 1. 系统概述

### 1.1 业务背景

WebAdmin是一个面向终端设备管理的后台管理系统，主要服务于支付终端、公交刷卡终端等设备的集中管理。系统支持多商户模式，提供设备监控、文件分发、消息通信、用户权限管理等核心功能。

### 1.2 系统目标

- **高可用性**: 7×24小时稳定运行，系统可用性≥99.9%
- **高并发**: 支持1000+终端设备同时在线
- **安全性**: 多层安全防护，支持双因素认证
- **可扩展性**: 模块化设计，支持水平扩展
- **易维护性**: 清晰的架构分层，完善的监控体系

### 1.3 核心功能

```
核心业务功能
├── 用户权限管理
│   ├── 用户注册/登录
│   ├── 角色权限控制
│   ├── 双因素认证
│   └── 微信扫码登录
├── 商户管理
│   ├── 多商户支持
│   ├── 数据隔离
│   └── 商户配置
├── 终端设备管理
│   ├── 设备注册
│   ├── 状态监控
│   ├── 远程控制
│   └── 事件记录
├── 文件管理
│   ├── 文件上传
│   ├── 版本控制
│   ├── 分发管理
│   └── 发布历史
├── 消息通信
│   ├── 消息发送
│   ├── 类型管理
│   ├── 历史记录
│   └── 状态跟踪
└── 数据分析
    ├── 实时监控
    ├── 统计报表
    ├── 趋势分析
    └── 告警通知
```

---

## 2. 架构设计

### 2.1 总体架构

采用**微服务架构**和**前后端分离**的设计模式：

```
┌─────────────────────────────────────────────────────────────┐
│                        表示层                                │
├─────────────────────────────────────────────────────────────┤
│  React前端应用  │  移动端H5  │  第三方集成  │  管理后台      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        网关层                                │
├─────────────────────────────────────────────────────────────┤
│              Nginx (负载均衡 + SSL终止)                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        应用服务层                            │
├─────────────────────────────────────────────────────────────┤
│  WebAdmin服务  │  ApiService服务  │  TCP通信服务  │  文件服务 │
│  (Web管理)     │  (业务API)       │  (设备通信)   │  (MinIO)  │
│  Port: 8080    │  Port: 5000      │  Port: 8822   │  Port: 9000│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        中间件层                              │
├─────────────────────────────────────────────────────────────┤
│    RabbitMQ消息队列    │    Redis缓存    │    日志服务       │
│    Port: 5672          │   Port: 6379    │    ELK Stack      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        数据持久层                            │
├─────────────────────────────────────────────────────────────┤
│              MySQL 8.0 主从集群 (Port: 3306)                │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 架构特点

#### 2.2.1 分层架构
- **表示层**: 负责用户交互和界面展示
- **网关层**: 负责请求路由、负载均衡、SSL终止
- **应用服务层**: 负责业务逻辑处理和服务编排
- **中间件层**: 负责消息队列、缓存、日志等基础服务
- **数据持久层**: 负责数据存储和持久化

#### 2.2.2 服务化架构
- **WebAdmin服务**: Web管理界面和用户认证
- **ApiService服务**: 核心业务API和数据处理
- **TCP通信服务**: 终端设备通信和协议处理
- **文件服务**: 文件存储和分发管理

#### 2.2.3 数据流设计

```
用户操作 → WebAdmin → ApiService → 业务处理 → 数据库
                          ↓
                    消息队列 → TCP服务 → 终端设备
                          ↓
                    文件服务 → MinIO存储
```

---

## 3. 技术选型

### 3.1 技术选型原则

- **成熟稳定**: 选择经过生产验证的成熟技术
- **性能优先**: 优先考虑高性能的技术方案
- **生态完善**: 选择生态系统完善的技术栈
- **团队熟悉**: 考虑团队技术储备和学习成本
- **长期支持**: 选择有长期技术支持的方案

### 3.2 后端技术栈

| 技术领域 | 选择方案 | 版本 | 选型理由 |
|---------|---------|------|---------|
| 开发框架 | .NET 8.0 | 8.0 LTS | 高性能、跨平台、长期支持 |
| Web框架 | ASP.NET Core | 8.0 | 成熟的Web API框架 |
| ORM框架 | Entity Framework Core | 8.0.14 | 官方ORM，功能完善 |
| 数据库 | MySQL | 8.0+ | 开源、高性能、成熟稳定 |
| 缓存 | Redis | 7.0+ | 高性能内存数据库 |
| 消息队列 | RabbitMQ | 3.12+ | 可靠的消息中间件 |
| 文件存储 | MinIO | Latest | 兼容S3的对象存储 |
| 认证授权 | JWT + Identity | 8.0 | 标准的认证授权方案 |

### 3.3 前端技术栈

| 技术领域 | 选择方案 | 版本 | 选型理由 |
|---------|---------|------|---------|
| 前端框架 | React | 18.2+ | 主流前端框架，生态完善 |
| 构建工具 | Vite | 5.1+ | 快速的构建工具 |
| UI框架 | Material UI | 5.15+ | 成熟的React UI组件库 |
| 状态管理 | React Context + Hooks | - | 轻量级状态管理方案 |
| 路由管理 | React Router | 6.22+ | 标准的React路由库 |
| HTTP客户端 | Axios | 1.6+ | 功能强大的HTTP库 |
| 表单处理 | Formik + Yup | 2.4+ / 1.3+ | 表单管理和验证 |
| 图表组件 | Chart.js + Recharts | 4.4+ / 2.15+ | 丰富的图表组件 |

### 3.4 基础设施技术栈

| 技术领域 | 选择方案 | 版本 | 选型理由 |
|---------|---------|------|---------|
| 容器化 | Docker | 24.0+ | 标准的容器化方案 |
| 容器编排 | Docker Compose | 2.20+ | 简单的多容器编排 |
| 反向代理 | Nginx | 1.24+ | 高性能的Web服务器 |
| 监控 | Prometheus + Grafana | Latest | 开源监控解决方案 |
| 日志 | ELK Stack | 8.0+ | 完整的日志分析平台 |
| CI/CD | GitHub Actions | - | 自动化构建部署 |

---

## 4. 模块设计

### 4.1 模块划分

系统采用**领域驱动设计(DDD)**的思想进行模块划分：

```
SlzrCrossGate 解决方案
├── SlzrCrossGate.Common          # 公共工具模块
├── SlzrCrossGate.Core            # 核心业务模块
├── SlzrCrossGate.Tcp             # TCP通信模块
├── SlzrCrossGate.ApiService      # API服务模块
├── SlzrCrossGate.WebAdmin        # Web管理模块
└── SlzrCrossGate.ServiceDefaults # 服务默认配置
```

### 4.2 核心模块设计

#### 4.2.1 Common模块 (公共工具)
```
SlzrCrossGate.Common/
├── CRC.cs              # CRC校验算法
├── DataConvert.cs      # 数据转换工具
└── Encrypts.cs         # 加密解密工具
```

**职责**: 提供系统通用的工具类和算法实现

#### 4.2.2 Core模块 (核心业务)
```
SlzrCrossGate.Core/
├── Models/             # 领域模型
│   ├── ApplicationUser.cs    # 用户模型
│   ├── Terminal.cs          # 终端模型
│   ├── Merchant.cs          # 商户模型
│   ├── FileVer.cs           # 文件版本模型
│   └── Message.cs           # 消息模型
├── Database/           # 数据访问
│   ├── TcpDbContext.cs      # 数据库上下文
│   └── SeedData.cs          # 种子数据
├── Repositories/       # 数据仓储
├── Services/           # 领域服务
└── DTOs/              # 数据传输对象
```

**职责**: 定义核心业务模型、数据访问和领域服务

#### 4.2.3 Tcp模块 (TCP通信)
```
SlzrCrossGate.Tcp/
├── Protocol/           # 协议定义
│   ├── Iso8583Message.cs        # ISO 8583消息
│   ├── Iso8583MessageType.cs    # 消息类型
│   └── Iso8583Field.cs          # 消息字段
├── Handler/            # 消息处理器
│   ├── SignInMessageHandler.cs  # 签到处理
│   ├── HeartbeatMessageHandler.cs # 心跳处理
│   └── FileDownloadMessageHandler.cs # 文件下载处理
├── Service/            # TCP服务
└── TcpConnectionManager.cs      # 连接管理
```

**职责**: 处理终端设备的TCP通信和ISO 8583协议

#### 4.2.4 ApiService模块 (API服务)
```
SlzrCrossGate.ApiService/
├── Controllers/        # API控制器
├── Services/          # 业务服务
└── Program.cs         # 服务入口
```

**职责**: 提供HTTP API接口和业务逻辑处理

#### 4.2.5 WebAdmin模块 (Web管理)
```
SlzrCrossGate.WebAdmin/
├── Controllers/        # Web API控制器
├── Services/          # Web业务服务
├── DTOs/              # Web数据传输对象
├── Middleware/        # 中间件
├── ClientApp/         # React前端应用
│   ├── src/
│   │   ├── components/    # 通用组件
│   │   ├── pages/         # 页面组件
│   │   ├── services/      # API服务
│   │   └── contexts/      # React上下文
│   └── package.json
└── Program.cs         # Web服务入口
```

**职责**: 提供Web管理界面和用户认证服务

### 4.3 模块间通信

```
模块通信方式:
├── 同步通信
│   ├── HTTP API调用 (WebAdmin ↔ ApiService)
│   ├── 数据库共享 (Core模块)
│   └── 直接引用 (Common模块)
└── 异步通信
    ├── 消息队列 (RabbitMQ)
    ├── TCP连接 (终端设备)
    └── 事件驱动 (领域事件)
```

---

## 5. 数据架构

### 5.1 数据库设计原则

- **规范化设计**: 遵循第三范式，减少数据冗余
- **性能优化**: 合理设计索引，优化查询性能
- **数据隔离**: 支持多商户数据隔离
- **扩展性**: 预留扩展字段，支持业务发展
- **一致性**: 保证数据的完整性和一致性

### 5.2 核心数据模型

#### 5.2.1 用户权限模型
```sql
-- 用户表 (基于ASP.NET Core Identity)
AspNetUsers {
    Id: varchar(128) PK
    UserName: varchar(128)
    Email: varchar(128)
    RealName: varchar(100)
    MerchantID: varchar(50) FK
    TwoFactorSecretKey: varchar(255)
    WechatOpenId: varchar(100)
    CreatedAt: datetime
}

-- 角色表
AspNetRoles {
    Id: varchar(128) PK
    Name: varchar(128)
    Description: varchar(500)
}

-- 用户角色关联表
AspNetUserRoles {
    UserId: varchar(128) FK
    RoleId: varchar(128) FK
}
```

#### 5.2.2 商户管理模型
```sql
-- 商户表
Merchants {
    ID: varchar(50) PK
    Name: varchar(100)
    ContactPerson: varchar(50)
    ContactPhone: varchar(20)
    Address: varchar(200)
    IsActive: bit
    CreatedAt: datetime
    UpdatedAt: datetime
}
```

#### 5.2.3 终端设备模型
```sql
-- 终端表
Terminals {
    ID: varchar(50) PK
    MerchantID: varchar(50) FK
    MachineID: varchar(50)      -- 出厂序列号
    MachineNO: varchar(50)      -- 设备编号
    LineNO: varchar(20)         -- 线路编号
    TerminalType: varchar(20)   -- 终端类型
    IsDeleted: bit
    CreatedAt: datetime
    UpdatedAt: datetime
}

-- 终端状态表
TerminalStatuses {
    ID: int PK
    TerminalID: varchar(50) FK
    ActiveStatus: int           -- 活跃状态
    LastActiveTime: datetime    -- 最后活跃时间
    OnlineStatus: int          -- 在线状态
    UpdatedAt: datetime
}

-- 终端事件表
TerminalEvents {
    ID: bigint PK
    TerminalID: varchar(50) FK
    EventType: varchar(50)
    EventData: text
    EventTime: datetime
}
```

#### 5.2.4 文件管理模型
```sql
-- 文件类型表
FileTypes {
    ID: int PK
    MerchantID: varchar(50) FK
    Code: varchar(10)
    Name: varchar(100)
    Description: varchar(500)
    IsActive: bit
}

-- 文件版本表
FileVers {
    ID: int PK
    MerchantID: varchar(50) FK
    FileTypeID: int FK
    FileParameter: varchar(50)
    Version: varchar(10)
    FileName: varchar(255)
    FilePath: varchar(500)
    FileSize: bigint
    FileCRC: varchar(20)
    UploadedBy: varchar(128) FK
    CreatedAt: datetime
}

-- 文件发布表
FilePublishes {
    ID: int PK
    FileVersionID: int FK
    PublishType: int           -- 发布类型(线路/终端)
    TargetID: varchar(50)      -- 目标ID
    Status: int               -- 发布状态
    PublishedBy: varchar(128) FK
    PublishedAt: datetime
}
```

#### 5.2.5 消息通信模型
```sql
-- 消息类型表
MessageTypes {
    ID: varchar(10) PK
    MerchantID: varchar(50) FK
    Name: varchar(100)
    Code: varchar(10)
    EncodingType: varchar(20)
    Remarks: varchar(500)
    Example: text
}

-- 消息表
Messages {
    ID: int PK
    MerchantID: varchar(50) FK
    TerminalID: varchar(50) FK
    MsgTypeCode: varchar(10) FK
    Content: text
    Status: int
    SentAt: datetime
    ReadAt: datetime
    SentBy: varchar(128) FK
}
```

### 5.3 数据关系图

```
Merchants (1) ──→ (N) Users
    │
    ├── (1) ──→ (N) Terminals ──→ (1) TerminalStatuses
    │                    │
    │                    └── (1) ──→ (N) TerminalEvents
    │
    ├── (1) ──→ (N) FileTypes ──→ (1) ──→ (N) FileVers
    │                                        │
    │                                        └── (1) ──→ (N) FilePublishes
    │
    ├── (1) ──→ (N) MessageTypes
    │
    └── (1) ──→ (N) Messages
```

### 5.4 数据库优化策略

#### 5.4.1 索引设计
```sql
-- 主要索引
CREATE INDEX IX_Terminals_MerchantID ON Terminals(MerchantID);
CREATE INDEX IX_Terminals_MachineID ON Terminals(MachineID);
CREATE INDEX IX_Terminals_LineNO ON Terminals(LineNO);
CREATE INDEX IX_TerminalStatuses_TerminalID ON TerminalStatuses(TerminalID);
CREATE INDEX IX_TerminalStatuses_LastActiveTime ON TerminalStatuses(LastActiveTime);
CREATE INDEX IX_Messages_MerchantID_SentAt ON Messages(MerchantID, SentAt);
CREATE INDEX IX_FileVers_MerchantID_FileTypeID ON FileVers(MerchantID, FileTypeID);
```

#### 5.4.2 分区策略
```sql
-- 按时间分区大表
ALTER TABLE TerminalEvents
PARTITION BY RANGE (YEAR(EventTime)) (
    PARTITION p2023 VALUES LESS THAN (2024),
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026)
);
```

---

## 6. 接口设计

### 6.1 API设计原则

- **RESTful风格**: 遵循REST架构风格
- **统一规范**: 统一的请求/响应格式
- **版本控制**: 支持API版本管理
- **幂等性**: 确保操作的幂等性
- **安全性**: 完善的认证和授权机制

### 6.2 API规范

#### 6.2.1 URL设计规范
```
基础URL: https://api.example.com/api/v1

资源命名:
├── /users              # 用户资源
├── /merchants          # 商户资源
├── /terminals          # 终端资源
├── /files              # 文件资源
└── /messages           # 消息资源

HTTP方法:
├── GET     # 查询资源
├── POST    # 创建资源
├── PUT     # 更新资源
├── DELETE  # 删除资源
└── PATCH   # 部分更新
```

#### 6.2.2 请求格式
```json
{
  "method": "POST",
  "url": "/api/users",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer {token}"
  },
  "body": {
    "userName": "testuser",
    "email": "test@example.com",
    "realName": "测试用户",
    "merchantId": "MERCHANT001"
  }
}
```

#### 6.2.3 响应格式
```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "userName": "testuser",
    "email": "test@example.com",
    "createdAt": "2024-12-20T10:00:00Z"
  },
  "message": "用户创建成功",
  "timestamp": "2024-12-20T10:00:00Z"
}
```

#### 6.2.4 分页响应
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "pageIndex": 1,
      "pageSize": 10,
      "totalCount": 100,
      "totalPages": 10,
      "hasNext": true,
      "hasPrevious": false
    }
  }
}
```

### 6.3 核心API接口

#### 6.3.1 认证授权API
```http
POST /api/auth/login           # 用户登录
POST /api/auth/verify-code     # 双因素认证
POST /api/auth/refresh-token   # 刷新令牌
POST /api/auth/logout          # 用户登出
GET  /api/auth/current-user    # 获取当前用户
```

#### 6.3.2 用户管理API
```http
GET    /api/users              # 获取用户列表
GET    /api/users/{id}         # 获取用户详情
POST   /api/users              # 创建用户
PUT    /api/users/{id}         # 更新用户
DELETE /api/users/{id}         # 删除用户
POST   /api/users/{id}/reset-password  # 重置密码
```

#### 6.3.3 终端管理API
```http
GET    /api/terminals          # 获取终端列表
GET    /api/terminals/{id}     # 获取终端详情
POST   /api/terminals          # 创建终端
PUT    /api/terminals/{id}     # 更新终端
DELETE /api/terminals/{id}     # 删除终端
GET    /api/terminals/stats    # 获取终端统计
POST   /api/terminals/{id}/send-message    # 发送消息
POST   /api/terminals/{id}/publish-file    # 发布文件
```

#### 6.3.4 文件管理API
```http
GET    /api/files              # 获取文件列表
GET    /api/files/{id}         # 获取文件详情
POST   /api/files/upload       # 上传文件
DELETE /api/files/{id}         # 删除文件
GET    /api/files/types        # 获取文件类型
POST   /api/files/publish      # 发布文件
```

---

## 7. 安全架构

### 7.1 安全设计原则

- **纵深防御**: 多层安全防护机制
- **最小权限**: 用户只能访问必需的资源
- **数据保护**: 敏感数据加密存储和传输
- **审计跟踪**: 完整的操作日志记录
- **威胁检测**: 实时安全威胁监控

### 7.2 认证架构

#### 7.2.1 多因素认证流程
```
用户登录流程:
1. 用户名密码验证
   ├── 成功 → 检查是否需要2FA
   └── 失败 → 记录失败次数，可能锁定账户

2. 双因素认证 (可选)
   ├── 生成临时Token
   ├── 用户输入TOTP验证码
   ├── 验证成功 → 生成完整Token
   └── 验证失败 → 记录失败次数

3. 微信扫码登录 (可选)
   ├── 生成二维码和状态码
   ├── 用户扫码授权
   ├── 验证微信用户信息
   └── 绑定或登录账户
```

#### 7.2.2 JWT Token设计
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user-id",
    "name": "用户名",
    "email": "user@example.com",
    "roles": ["MerchantAdmin"],
    "merchantId": "MERCHANT001",
    "isTemporary": false,
    "iat": 1703001600,
    "exp": 1703088000
  }
}
```

### 7.3 授权架构

#### 7.3.1 RBAC权限模型
```
权限模型:
用户(User) → 角色(Role) → 权限(Permission) → 资源(Resource)

角色定义:
├── SystemAdmin     # 系统管理员 (全部权限)
├── MerchantAdmin   # 商户管理员 (商户内权限)
└── User           # 普通用户 (只读权限)

权限类型:
├── Read           # 读取权限
├── Write          # 写入权限
├── Delete         # 删除权限
└── Admin          # 管理权限

资源范围:
├── 全局资源       # 系统级别资源
├── 商户资源       # 商户级别资源
└── 用户资源       # 用户级别资源
```

#### 7.3.2 数据权限控制
```csharp
// 商户数据隔离示例
public async Task<IQueryable<T>> ApplyTenantFilter<T>(
    IQueryable<T> query,
    ClaimsPrincipal user) where T : ITenantEntity
{
    var userRoles = user.FindAll(ClaimTypes.Role).Select(c => c.Value);

    // 系统管理员可以访问所有数据
    if (userRoles.Contains("SystemAdmin"))
        return query;

    // 商户管理员只能访问自己商户的数据
    var merchantId = user.FindFirst("MerchantId")?.Value;
    if (string.IsNullOrEmpty(merchantId))
        return query.Where(x => false);

    return query.Where(x => x.MerchantID == merchantId);
}
```

### 7.4 数据安全

#### 7.4.1 加密策略
```
数据加密:
├── 传输加密
│   ├── HTTPS/TLS 1.3
│   ├── WebSocket Secure (WSS)
│   └── TCP over TLS
├── 存储加密
│   ├── 密码: BCrypt Hash
│   ├── 2FA密钥: AES-256加密
│   ├── 敏感配置: Data Protection API
│   └── 数据库: 透明数据加密(TDE)
└── 应用层加密
    ├── JWT签名: HMAC-SHA256
    ├── API密钥: RSA-2048
    └── 文件校验: CRC32/MD5
```

#### 7.4.2 安全配置
```csharp
// 数据保护配置
services.AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo("/app/keys"))
    .SetApplicationName("WebAdmin")
    .SetDefaultKeyLifetime(TimeSpan.FromDays(90));

// JWT配置
services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = configuration["Jwt:Issuer"],
            ValidAudience = configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(configuration["Jwt:Key"])),
            ClockSkew = TimeSpan.Zero
        };
    });
```

### 7.5 安全监控

#### 7.5.1 安全事件记录
```csharp
// 安全事件类型
public enum SecurityEventType
{
    LoginSuccess,           // 登录成功
    LoginFailure,           // 登录失败
    TwoFactorSuccess,       // 2FA验证成功
    TwoFactorFailure,       // 2FA验证失败
    UnauthorizedAccess,     // 未授权访问
    PasswordReset,          // 密码重置
    AccountLocked,          // 账户锁定
    SuspiciousActivity      // 可疑活动
}

// 安全日志记录
public void LogSecurityEvent(SecurityEventType eventType,
    string userId, string details, string ipAddress)
{
    _logger.LogWarning("安全事件: {EventType}, 用户: {UserId}, " +
        "详情: {Details}, IP: {IPAddress}",
        eventType, userId, details, ipAddress);
}
```

---

## 8. 部署架构

### 8.1 部署模式

#### 8.1.1 开发环境
```
开发环境 (单机部署):
├── 本地开发机
│   ├── .NET 8.0 SDK
│   ├── Node.js 18+
│   ├── MySQL 8.0 (本地)
│   ├── RabbitMQ (Docker)
│   └── MinIO (Docker)
└── 开发工具
    ├── Visual Studio 2022
    ├── VS Code
    └── Git
```

#### 8.1.2 测试环境
```
测试环境 (Docker Compose):
├── 应用服务
│   ├── webadmin:test
│   └── apiservice:test
├── 基础服务
│   ├── mysql:8.0
│   ├── rabbitmq:3-management
│   ├── minio:latest
│   └── nginx:alpine
└── 监控服务
    ├── prometheus
    └── grafana
```

#### 8.1.3 生产环境
```
生产环境 (Kubernetes集群):
├── 应用层
│   ├── WebAdmin Pod (3副本)
│   ├── ApiService Pod (3副本)
│   └── TCP Service Pod (2副本)
├── 数据层
│   ├── MySQL主从集群
│   ├── Redis集群
│   └── MinIO集群
├── 中间件层
│   ├── RabbitMQ集群
│   └── Nginx Ingress
└── 监控层
    ├── Prometheus
    ├── Grafana
    ├── ELK Stack
    └── Jaeger
```

### 8.2 容器化设计

#### 8.2.1 Docker镜像设计
```dockerfile
# WebAdmin Dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80 443

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["SlzrCrossGate.WebAdmin/SlzrCrossGate.WebAdmin.csproj", "SlzrCrossGate.WebAdmin/"]
RUN dotnet restore "SlzrCrossGate.WebAdmin/SlzrCrossGate.WebAdmin.csproj"

COPY . .
WORKDIR "/src/SlzrCrossGate.WebAdmin"
RUN dotnet build "SlzrCrossGate.WebAdmin.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "SlzrCrossGate.WebAdmin.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "SlzrCrossGate.WebAdmin.dll"]
```

#### 8.2.2 Docker Compose配置
```yaml
version: '3.8'

services:
  webadmin:
    image: webadmin:latest
    ports:
      - "8080:80"
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ConnectionStrings__DefaultConnection=Server=mysql;Database=SlzrCrossGate;Uid=root;Pwd=${MYSQL_ROOT_PASSWORD}
    depends_on:
      - mysql
      - rabbitmq
    networks:
      - app-network

  apiservice:
    image: apiservice:latest
    ports:
      - "5000:8000"
      - "8822:8001"
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - HTTP_PORT=8000
      - TCP_PORT=8001
    depends_on:
      - mysql
      - rabbitmq
    networks:
      - app-network

  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
      - MYSQL_DATABASE=SlzrCrossGate
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"
    networks:
      - app-network

  rabbitmq:
    image: rabbitmq:3-management
    environment:
      - RABBITMQ_DEFAULT_USER=${RABBITMQ_USER}
      - RABBITMQ_DEFAULT_PASS=${RABBITMQ_PASSWORD}
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    ports:
      - "5672:5672"
      - "15672:15672"
    networks:
      - app-network

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      - MINIO_ROOT_USER=${MINIO_ROOT_USER}
      - MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD}
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"
      - "9001:9001"
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - webadmin
      - apiservice
    networks:
      - app-network

volumes:
  mysql_data:
  rabbitmq_data:
  minio_data:

networks:
  app-network:
    driver: bridge
```

### 8.3 高可用设计

#### 8.3.1 负载均衡架构
```
负载均衡架构:
                    ┌─────────────┐
                    │   Nginx LB  │
                    │  (主负载)    │
                    └─────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌─────────┐        ┌─────────┐        ┌─────────┐
   │WebAdmin1│        │WebAdmin2│        │WebAdmin3│
   │ (主节点) │        │ (从节点) │        │ (从节点) │
   └─────────┘        └─────────┘        └─────────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                  ┌─────────────┐
                  │MySQL Cluster│
                  │  (主从复制)  │
                  └─────────────┘
```

#### 8.3.2 故障转移机制
```
故障转移策略:
├── 应用层故障转移
│   ├── 健康检查: /health 端点
│   ├── 自动重启: Docker restart policy
│   ├── 负载均衡: Nginx upstream
│   └── 服务发现: Consul/Eureka
├── 数据层故障转移
│   ├── MySQL主从切换
│   ├── Redis哨兵模式
│   └── 数据备份恢复
└── 网络层故障转移
    ├── DNS故障转移
    ├── CDN故障转移
    └── 多机房部署
```

---

## 9. 性能设计

### 9.1 性能目标

| 性能指标 | 目标值 | 说明 |
|---------|--------|------|
| 响应时间 | <200ms | API平均响应时间 |
| 吞吐量 | >1000 QPS | 系统并发处理能力 |
| 并发用户 | >500 | 同时在线用户数 |
| 终端连接 | >1000 | 同时连接终端数 |
| 可用性 | >99.9% | 系统可用性 |
| 数据库连接 | <100ms | 数据库连接时间 |

### 9.2 性能优化策略

#### 9.2.1 数据库优化
```sql
-- 索引优化
CREATE INDEX IX_Terminals_Composite ON Terminals(MerchantID, IsDeleted, LineNO);
CREATE INDEX IX_Messages_Query ON Messages(MerchantID, SentAt DESC);

-- 查询优化
SELECT t.ID, t.MachineID, m.Name as MerchantName,
       CASE WHEN ts.ActiveStatus = 1 AND ts.LastActiveTime > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
            THEN 1 ELSE 0 END as IsOnline
FROM Terminals t
INNER JOIN Merchants m ON t.MerchantID = m.ID
LEFT JOIN TerminalStatuses ts ON t.ID = ts.TerminalID
WHERE t.MerchantID = ? AND t.IsDeleted = 0
ORDER BY t.LineNO, t.MachineNO
LIMIT 20 OFFSET 0;

-- 批量操作优化
INSERT INTO TerminalStatuses (TerminalID, LastActiveTime, UpdatedAt)
VALUES
  ('TERM001', NOW(), NOW()),
  ('TERM002', NOW(), NOW())
ON DUPLICATE KEY UPDATE
  LastActiveTime = VALUES(LastActiveTime),
  UpdatedAt = VALUES(UpdatedAt);
```

#### 9.2.2 缓存策略
```csharp
// 多级缓存架构
public class CacheService
{
    private readonly IMemoryCache _memoryCache;
    private readonly IDistributedCache _distributedCache;

    // L1缓存: 内存缓存 (毫秒级)
    public async Task<T> GetFromMemoryAsync<T>(string key)
    {
        return _memoryCache.Get<T>(key);
    }

    // L2缓存: Redis分布式缓存 (毫秒级)
    public async Task<T> GetFromRedisAsync<T>(string key)
    {
        var json = await _distributedCache.GetStringAsync(key);
        return json == null ? default(T) : JsonSerializer.Deserialize<T>(json);
    }

    // 缓存策略
    public async Task<T> GetWithFallbackAsync<T>(string key, Func<Task<T>> factory, TimeSpan expiry)
    {
        // 1. 尝试从内存缓存获取
        if (_memoryCache.TryGetValue(key, out T value))
            return value;

        // 2. 尝试从Redis获取
        value = await GetFromRedisAsync<T>(key);
        if (value != null)
        {
            _memoryCache.Set(key, value, TimeSpan.FromMinutes(5));
            return value;
        }

        // 3. 从数据源获取并缓存
        value = await factory();
        if (value != null)
        {
            await SetAsync(key, value, expiry);
            _memoryCache.Set(key, value, TimeSpan.FromMinutes(5));
        }

        return value;
    }
}
```

#### 9.2.3 异步处理
```csharp
// 异步消息处理
public class AsyncMessageProcessor
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<AsyncMessageProcessor> _logger;

    public async Task ProcessMessageAsync(string message)
    {
        using var scope = _serviceProvider.CreateScope();
        var processor = scope.ServiceProvider.GetRequiredService<IMessageProcessor>();

        try
        {
            await processor.ProcessAsync(message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "消息处理失败: {Message}", message);
            // 重试机制或死信队列
        }
    }
}

// 批量操作优化
public async Task BatchUpdateTerminalStatus(Dictionary<string, DateTime> updates)
{
    const int batchSize = 100;
    var batches = updates.Chunk(batchSize);

    foreach (var batch in batches)
    {
        var entities = batch.Select(kvp => new TerminalStatus
        {
            TerminalID = kvp.Key,
            LastActiveTime = kvp.Value
        }).ToList();

        // 使用EFCore.BulkExtensions进行批量更新
        await _context.BulkUpdateAsync(entities, options =>
            options.ColumnsToUpdate = new[] { nameof(TerminalStatus.LastActiveTime) });
    }
}
```

---

## 10. 扩展性设计

### 10.1 水平扩展

#### 10.1.1 无状态设计
```
无状态服务设计:
├── Web服务无状态
│   ├── Session存储在Redis
│   ├── 文件存储在MinIO
│   └── 配置外部化
├── API服务无状态
│   ├── JWT Token认证
│   ├── 数据库连接池
│   └── 缓存外部化
└── 负载均衡
    ├── Round Robin
    ├── Least Connections
    └── IP Hash
```

#### 10.1.2 微服务拆分
```
微服务拆分策略:
├── 用户服务 (User Service)
│   ├── 用户管理
│   ├── 认证授权
│   └── 权限控制
├── 终端服务 (Terminal Service)
│   ├── 终端管理
│   ├── 状态监控
│   └── 事件处理
├── 文件服务 (File Service)
│   ├── 文件上传
│   ├── 版本管理
│   └── 分发控制
├── 消息服务 (Message Service)
│   ├── 消息发送
│   ├── 类型管理
│   └── 历史记录
└── 通知服务 (Notification Service)
    ├── 实时通知
    ├── 邮件通知
    └── 短信通知
```

### 10.2 垂直扩展

#### 10.2.1 数据库扩展
```
数据库扩展策略:
├── 读写分离
│   ├── 主库: 写操作
│   ├── 从库: 读操作
│   └── 读写路由
├── 分库分表
│   ├── 按商户分库
│   ├── 按时间分表
│   └── 分片路由
└── 缓存分层
    ├── 应用缓存
    ├── 数据库缓存
    └── CDN缓存
```

#### 10.2.2 存储扩展
```
存储扩展方案:
├── 对象存储
│   ├── MinIO集群
│   ├── 自动扩容
│   └── 数据冗余
├── 文件系统
│   ├── 分布式文件系统
│   ├── 网络存储(NAS)
│   └── 块存储(SAN)
└── 备份策略
    ├── 增量备份
    ├── 异地备份
    └── 灾难恢复
```

### 10.3 技术演进

#### 10.3.1 架构演进路径
```
架构演进:
Phase 1: 单体应用
├── 快速开发
├── 简单部署
└── 功能验证

Phase 2: 前后端分离
├── 技术栈分离
├── 团队分工
└── 独立部署

Phase 3: 微服务架构
├── 服务拆分
├── 容器化
└── 服务治理

Phase 4: 云原生架构
├── Kubernetes
├── Service Mesh
└── Serverless
```

#### 10.3.2 技术选型演进
```
技术演进路径:
├── 数据库
│   ├── MySQL → MySQL集群
│   ├── 单库 → 分库分表
│   └── 关系型 → 混合存储
├── 缓存
│   ├── 内存缓存 → Redis
│   ├── 单节点 → 集群
│   └── 简单缓存 → 多级缓存
├── 消息队列
│   ├── 内存队列 → RabbitMQ
│   ├── 单节点 → 集群
│   └── 简单队列 → 流处理
└── 监控
    ├── 日志文件 → ELK Stack
    ├── 简单监控 → Prometheus
    └── 手动运维 → 自动化运维
```

---

## 总结

本系统架构设计文档从业务需求出发，采用现代化的技术栈和架构模式，设计了一个高可用、高性能、可扩展的终端管理系统。

### 核心特点

1. **模块化设计**: 清晰的模块划分和职责分离
2. **微服务架构**: 支持独立开发、部署和扩展
3. **容器化部署**: 标准化的部署和运维流程
4. **多层安全**: 完善的安全防护机制
5. **性能优化**: 多级缓存和批量处理优化
6. **可扩展性**: 支持水平和垂直扩展

### 技术优势

- **成熟技术栈**: 基于.NET 8.0和React 18的现代化技术栈
- **高性能**: 异步编程、批量操作、多级缓存
- **高可用**: 负载均衡、故障转移、健康检查
- **安全可靠**: 多因素认证、权限控制、数据加密
- **易于维护**: 清晰的架构分层、完善的监控体系

该架构设计为系统的长期发展奠定了坚实的技术基础，能够满足当前业务需求并支持未来的业务扩展。
