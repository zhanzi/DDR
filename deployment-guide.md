# SlzrCrossGate 项目 Linux 部署方案

## 1. 部署方式选择

我们提供两种部署方案，根据您的需求和环境，您可以选择最适合的方法。

### 方案一：Docker 容器化部署（推荐）

优点：
- 环境一致性，减少"在我机器上能跑"的问题
- 简化依赖项管理
- 更好的应用隔离
- 方便的横向扩展
- 更简单的版本回滚

### 方案二：直接部署到 Linux 服务器

优点：
- 更直接的服务器访问和控制
- 可能略低的资源消耗
- 更简单的初始设置（对于不熟悉 Docker 的团队）

## 2. 环境准备

### Linux 服务器要求

- 推荐配置：至少 4GB RAM，2+ CPU 核心
- 操作系统：Ubuntu 22.04 LTS / CentOS 8 / Debian 11 或更新版本
- 至少 20GB 可用磁盘空间（取决于预期数据量）

### 安装必要软件

#### Docker 部署所需软件

```bash
# 安装 Docker 和 Docker Compose
sudo apt update
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
sudo apt update
sudo apt install -y docker-ce docker-compose-plugin
sudo usermod -aG docker $USER

# 安装 Nginx（作为反向代理）
sudo apt install -y nginx
```

#### 直接部署所需软件

```bash

# 安装依赖项
sudo yum install -y wget

# 添加 Microsoft 仓库
sudo rpm -Uvh https://packages.microsoft.com/config/centos/8/packages-microsoft-prod.rpm
sudo yum install dotnet-sdk-8.0


# 安装 Nginx（作为反向代理）
sudo apt install -y nginx

# 安装 Node.js 18（用于构建前端）
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 数据库和消息队列准备

```bash
# 使用 Docker 运行 MySQL 8.0
docker run -d \
  --name mysql-slzr \
  -e MYSQL_ROOT_PASSWORD=slzr!12345 \
  -e MYSQL_DATABASE=tcpserver \
  -v /data/mysql:/var/lib/mysql \
  -p 3306:3306 \
  --restart unless-stopped \
  mysql:8.0 \
  --default-authentication-plugin=mysql_native_password


# 使用 Docker 运行 RabbitMQ
docker run -d \
  --name my-rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  -e RABBITMQ_DEFAULT_USER=slzr \
  -e RABBITMQ_DEFAULT_PASS='slzr!12345' \
  -v /data/rabbitmq:/var/lib/rabbitmq \
  --restart unless-stopped \
  rabbitmq:management
```

### 手动安装RabbitMQ（可选）
```bash
# 安装 RabbitMQ 的依赖
sudo apt-get install -y erlang
# 添加 RabbitMQ 的 APT 源
echo "deb https://dl.bintray.com/rabbitmq/debian buster main" | sudo tee /etc/apt/sources.list.d/rabbitmq.list
# 安装 RabbitMQ
sudo apt-get update
sudo apt-get install -y rabbitmq-server

# 启动 RabbitMQ 服务
sudo systemctl start rabbitmq-server
sudo systemctl enable rabbitmq-server

# 访问管理界面
http://localhost:15672
```


## 3. 应用配置调整

### 创建生产环境配置文件

#### ApiService 的 appsettings.Production.json

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "ConnectionStrings": {
    "DefaultConnection": "Server=mysql-server;Port=3306;Database=tcpserver;User=root;Password=your-secure-password;SslMode=Required;"
  },
  "DatabaseProvider": "MySql",
  "RabbitMQ": {
    "HostName": "rabbitmq-server",
    "UserName": "guest",
    "Password": "guest",
    "Port": 5672
  },
  "FileService": {
    "DefaultStorageType": "Local", 
    "LocalFilePath": "/app/storage/files",
    "MinIO": {
      "Endpoint": "minio.example.com",
      "AccessKey": "your-access-key",
      "SecretKey": "your-secret-key",
      "BucketName": "your-bucket-name"
    }
  },
  "Kestrel": {
    "EndpointDefaults": {
      "Protocols": "Http1AndHttp2"
    },
    "Endpoints": {
      "Http": {
        "Url": "http://0.0.0.0:5000"
      },
      "Tcp": {
        "Url": "http://0.0.0.0:5001"
      }
    }
  }
}
```

#### WebAdmin 的 appsettings.Production.json

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "ConnectionStrings": {
    "DefaultConnection": "Server=mysql-server;Port=3306;Database=tcpserver;User=root;Password=your-secure-password;SslMode=Required;"
  },
  "DatabaseProvider": "MySql",
  "RabbitMQ": {
    "HostName": "rabbitmq-server",
    "UserName": "guest",
    "Password": "guest",
    "Port": 5672
  },
  "Jwt": {
    "Key": "your-secure-key-replace-this-with-strong-key",
    "Issuer": "WebAdmin",
    "Audience": "WebAdmin",
    "ExpiresInHours": 24
  },
  "Wechat": {
    "AppId": "your-wechat-appid",
    "AppSecret": "your-wechat-secret",
    "RedirectUrl": "https://your-domain.com/api/auth/wechat-callback",
    "QrCodeExpiryMinutes": 5
  },
  "FileService": {
    "DefaultStorageType": "Local", 
    "LocalFilePath": "/app/storage/files",
    "MinIO": {
      "Endpoint": "minio.example.com",
      "AccessKey": "your-access-key",
      "SecretKey": "your-secret-key",
      "BucketName": "your-bucket-name"
    }
  },
  "Kestrel": {
    "EndpointDefaults": {
      "Protocols": "Http1AndHttp2"
    },
    "Endpoints": {
      "Http": {
        "Url": "http://0.0.0.0:7296"
      }
    }
  }
}
```

### 环境变量和敏感信息处理

对于生产环境，建议使用环境变量覆盖配置中的敏感信息：

```bash
# 数据库连接字符串
export ConnectionStrings__DefaultConnection="Server=mysql-server;Port=3306;Database=tcpserver;User=root;Password=your-secure-password;SslMode=Required;"

# JWT 密钥
export Jwt__Key="your-secure-jwt-key-with-sufficient-length"

# RabbitMQ 连接信息
export RabbitMQ__UserName="production-user"
export RabbitMQ__Password="production-password"
```

## 4. 前端构建和部署

### 创建前端环境变量配置

在 `SlzrCrossGate.WebAdmin/ClientApp` 目录下创建 `.env.production` 文件：

```
VITE_API_BASE_URL=/api
```

### 构建前端项目

```bash
# 进入前端项目目录
cd SlzrCrossGate.WebAdmin/ClientApp

# 安装依赖
npm install

# 构建项目
npm run build
```

构建后的文件将输出到 `SlzrCrossGate.WebAdmin/wwwroot` 目录。

## 5. Docker 容器化配置

### ApiService 的 Dockerfile

创建文件 `SlzrCrossGate.ApiService/Dockerfile`：

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 5000
EXPOSE 5001

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["SlzrCrossGate.ApiService/SlzrCrossGate.ApiService.csproj", "SlzrCrossGate.ApiService/"]
COPY ["SlzrCrossGate.Core/SlzrCrossGate.Core.csproj", "SlzrCrossGate.Core/"]
COPY ["SlzrCrossGate.Common/SlzrCrossGate.Common.csproj", "SlzrCrossGate.Common/"]
COPY ["SlzrCrossGate.ServiceDefaults/SlzrCrossGate.ServiceDefaults.csproj", "SlzrCrossGate.ServiceDefaults/"]
COPY ["SlzrCrossGate.Tcp/SlzrCrossGate.Tcp.csproj", "SlzrCrossGate.Tcp/"]
RUN dotnet restore "SlzrCrossGate.ApiService/SlzrCrossGate.ApiService.csproj"
COPY . .
WORKDIR "/src/SlzrCrossGate.ApiService"
RUN dotnet build "SlzrCrossGate.ApiService.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "SlzrCrossGate.ApiService.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
# 创建文件存储目录
RUN mkdir -p /app/storage/files && chmod -R 755 /app/storage
ENTRYPOINT ["dotnet", "SlzrCrossGate.ApiService.dll"]
```

### WebAdmin 的 Dockerfile

创建文件 `SlzrCrossGate.WebAdmin/Dockerfile`：

```dockerfile
# 阶段 1: 构建前端
FROM node:18-alpine AS frontend-build
WORKDIR /app
COPY SlzrCrossGate.WebAdmin/ClientApp/package*.json ./
RUN npm ci
COPY SlzrCrossGate.WebAdmin/ClientApp/ ./
RUN npm run build

# 阶段 2: 构建后端
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["SlzrCrossGate.WebAdmin/SlzrCrossGate.WebAdmin.csproj", "SlzrCrossGate.WebAdmin/"]
COPY ["SlzrCrossGate.Core/SlzrCrossGate.Core.csproj", "SlzrCrossGate.Core/"]
COPY ["SlzrCrossGate.Common/SlzrCrossGate.Common.csproj", "SlzrCrossGate.Common/"]
COPY ["SlzrCrossGate.ServiceDefaults/SlzrCrossGate.ServiceDefaults.csproj", "SlzrCrossGate.ServiceDefaults/"]
RUN dotnet restore "SlzrCrossGate.WebAdmin/SlzrCrossGate.WebAdmin.csproj"
COPY . .
WORKDIR "/src/SlzrCrossGate.WebAdmin"
RUN dotnet build "SlzrCrossGate.WebAdmin.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "SlzrCrossGate.WebAdmin.csproj" -c Release -o /app/publish /p:UseAppHost=false

# 阶段 3: 最终镜像
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
EXPOSE 7296
COPY --from=publish /app/publish .
# 复制前端构建结果
COPY --from=frontend-build /app/dist/ ./wwwroot/
# 创建文件存储目录
RUN mkdir -p /app/storage/files && chmod -R 755 /app/storage
ENTRYPOINT ["dotnet", "SlzrCrossGate.WebAdmin.dll"]
```

### Docker Compose 配置

创建 `docker-compose.yml` 文件：

```yaml
version: '3.8'

services:
  # MySQL 数据库
  mysql:
    image: mysql:8.0
    container_name: slzr-mysql
    command: --default-authentication-plugin=mysql_native_password
    volumes:
      - mysql_data:/var/lib/mysql
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD:-slzr!12345}
      MYSQL_DATABASE: tcpserver
    ports:
      - "3306:3306"
    networks:
      - slzr-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p${MYSQL_ROOT_PASSWORD:-slzr!12345}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # RabbitMQ 消息队列
  rabbitmq:
    image: rabbitmq:3.12-management
    container_name: slzr-rabbitmq
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    environment:
      - RABBITMQ_DEFAULT_USER=${RABBITMQ_USER:-guest}
      - RABBITMQ_DEFAULT_PASS=${RABBITMQ_PASS:-guest}
    ports:
      - "5672:5672"
      - "15672:15672"
    networks:
      - slzr-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "rabbitmqctl", "status"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ApiService 服务
  api-service:
    build:
      context: .
      dockerfile: SlzrCrossGate.ApiService/Dockerfile
    container_name: slzr-api-service
    depends_on:
      mysql:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    ports:
      - "5000:5000"  # HTTP API
      - "5001:5001"  # TCP 服务
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ConnectionStrings__DefaultConnection=Server=mysql;Port=3306;Database=tcpserver;User=root;Password=${MYSQL_ROOT_PASSWORD:-slzr!12345};SslMode=Required;
      - RabbitMQ__HostName=rabbitmq
      - RabbitMQ__UserName=${RABBITMQ_USER:-guest}
      - RabbitMQ__Password=${RABBITMQ_PASS:-guest}
    volumes:
      - api_storage:/app/storage
    networks:
      - slzr-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # WebAdmin 服务
  web-admin:
    build:
      context: .
      dockerfile: SlzrCrossGate.WebAdmin/Dockerfile
    container_name: slzr-web-admin
    depends_on:
      mysql:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    ports:
      - "7296:7296"
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ConnectionStrings__DefaultConnection=Server=mysql;Port=3306;Database=tcpserver;User=root;Password=${MYSQL_ROOT_PASSWORD:-slzr!12345};SslMode=Required;
      - RabbitMQ__HostName=rabbitmq
      - RabbitMQ__UserName=${RABBITMQ_USER:-guest}
      - RabbitMQ__Password=${RABBITMQ_PASS:-guest}
      - Jwt__Key=${JWT_KEY:-YourSecretKeyHere12345678901234567890}
    volumes:
      - webadmin_storage:/app/storage
    networks:
      - slzr-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:7296/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Nginx 反向代理
  nginx:
    image: nginx:latest
    container_name: slzr-nginx
    depends_on:
      - api-service
      - web-admin
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./nginx/ssl:/etc/nginx/ssl
      - ./nginx/logs:/var/log/nginx
    networks:
      - slzr-network
    restart: unless-stopped

networks:
  slzr-network:
    driver: bridge

volumes:
  mysql_data:
  rabbitmq_data:
  api_storage:
  webadmin_storage:
```

## 6. Nginx 反向代理配置

### 创建 Nginx 配置目录和文件

```bash
mkdir -p nginx/conf.d nginx/ssl nginx/logs
```

### 基本 HTTP 配置

创建 `nginx/conf.d/default.conf` 文件：

```nginx
server {
    listen 80;
    server_name _;

    # 重定向到HTTPS（生产环境使用）
    # return 301 https://$host$request_uri;
    
    # 如果没有配置SSL，可以先使用HTTP
    location / {
        proxy_pass http://web-admin:7296;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://web-admin:7296/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api-service/ {
        proxy_pass http://api-service:5000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
}
```

### HTTPS 配置（生产环境）

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # 前端应用
    location / {
        proxy_pass http://web-admin:7296;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebAdmin API
    location /api/ {
        proxy_pass http://web-admin:7296/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # ApiService API
    location /api-service/ {
        proxy_pass http://api-service:5000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
}
```

## 7. 数据库迁移

### 生成 SQL 脚本（在开发环境执行）

```powershell
# 确保安装了 EF Core 工具
dotnet tool install --global dotnet-ef --version 8.0.14

# 生成全量 SQL 脚本
dotnet ef migrations script `
  --project SlzrCrossGate.Core `
  --startup-project SlzrCrossGate.ApiService `
  --idempotent `
  --output db-migration.sql
```

### 应用迁移（两种方法）

#### 方法 1：使用生成的 SQL 脚本

```bash
# 复制 SQL 脚本到服务器
scp db-migration.sql user@server:/tmp/

# 在服务器上连接到 MySQL 容器执行脚本
docker exec -i slzr-mysql mysql -uroot -p"slzr!12345" tcpserver < /tmp/db-migration.sql
```

#### 方法 2：使用 EF Core 命令行（Docker 环境中）

```bash
# 进入 API Service 容器
docker exec -it slzr-api-service bash

# 安装 EF Core 工具
dotnet tool install --global dotnet-ef --version 8.0.14

# 导出 PATH
export PATH="$PATH:$HOME/.dotnet/tools"

# 应用迁移
cd /app
dotnet ef database update --project SlzrCrossGate.Core --startup-project SlzrCrossGate.ApiService
```

## 8. 部署脚本

### 创建自动化部署脚本

`deploy.sh`:

```bash
#!/bin/bash

# 停止并移除旧容器
docker-compose down

# 拉取最新代码
git pull

# 设置环境变量（从环境文件读取）
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# 构建并启动新容器
docker-compose up -d --build

# 等待容器启动
echo "等待服务启动..."
sleep 30

# 检查服务健康状态
echo "检查服务健康状态..."
curl -f http://localhost:5000/health || echo "API 服务未正常响应"
curl -f http://localhost:7296/health || echo "WebAdmin 服务未正常响应"

echo "部署完成！"
```

### 创建环境变量文件

`.env`:

```
# MySQL配置
MYSQL_ROOT_PASSWORD=secure_password_here

# RabbitMQ配置
RABBITMQ_USER=production_user
RABBITMQ_PASS=secure_password_here

# JWT配置
JWT_KEY=secure_jwt_key_with_at_least_32_characters

# 微信配置（如果需要）
WECHAT_APP_ID=your_wechat_app_id
WECHAT_APP_SECRET=your_wechat_app_secret
```

## 9. 直接部署到 Linux（非 Docker 选项）

如果选择不使用 Docker，可以按照以下步骤直接部署：

### 准备发布包

在开发机器上：

```powershell
# 发布 ApiService
dotnet publish SlzrCrossGate.ApiService -c Release -o ./publish/ApiService

# 准备前端并发布 WebAdmin
cd SlzrCrossGate.WebAdmin/ClientApp
npm install
npm run build
cd ../..
dotnet publish SlzrCrossGate.WebAdmin -c Release -o ./publish/WebAdmin
```

### 配置 Systemd 服务

#### ApiService 服务

创建 `/etc/systemd/system/slzr-apiservice.service`：

```ini
[Unit]
Description=SlzrCrossGate ApiService
After=network.target

[Service]
WorkingDirectory=/var/www/slzr/ApiService
ExecStart=/usr/bin/dotnet SlzrCrossGate.ApiService.dll
Restart=always
RestartSec=10
User=www-data
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=ASPNETCORE_URLS=http://0.0.0.0:5000;http://0.0.0.0:5001
Environment=ConnectionStrings__DefaultConnection=Server=localhost;Port=3306;Database=tcpserver;User=root;Password=secure_password_here;SslMode=Required;
Environment=RabbitMQ__HostName=localhost
Environment=RabbitMQ__UserName=guest
Environment=RabbitMQ__Password=guest

[Install]
WantedBy=multi-user.target
```

#### WebAdmin 服务

创建 `/etc/systemd/system/slzr-webadmin.service`：

```ini
[Unit]
Description=SlzrCrossGate WebAdmin
After=network.target

[Service]
WorkingDirectory=/var/www/slzr/WebAdmin
ExecStart=/usr/bin/dotnet SlzrCrossGate.WebAdmin.dll
Restart=always
RestartSec=10
User=www-data
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=ASPNETCORE_URLS=http://0.0.0.0:7296
Environment=ConnectionStrings__DefaultConnection=Server=localhost;Port=3306;Database=tcpserver;User=root;Password=secure_password_here;SslMode=Required;
Environment=RabbitMQ__HostName=localhost
Environment=RabbitMQ__UserName=guest
Environment=RabbitMQ__Password=guest
Environment=Jwt__Key=secure_jwt_key_with_at_least_32_characters

[Install]
WantedBy=multi-user.target
```

### 启动服务

```bash
sudo systemctl enable slzr-apiservice
sudo systemctl start slzr-apiservice
sudo systemctl enable slzr-webadmin
sudo systemctl start slzr-webadmin
```

### 配置 Nginx

与 Docker 部署中的 Nginx 配置类似，但需要更改代理目标：

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:7296;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api-service/ {
        proxy_pass http://localhost:5000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 10. SSL 证书配置（推荐用于生产环境）

### 使用 Let's Encrypt 获取免费 SSL 证书

```bash
# 安装 Certbot
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# 获取并安装证书（确保 Nginx 已经启动并配置了域名）
sudo certbot --nginx -d yourdomain.com

# 自动续期设置（Certbot 已自动配置）
sudo systemctl status certbot.timer
```

### 手动配置 SSL 证书（如果已有证书）

```bash
# 复制证书文件到 Nginx 目录
sudo mkdir -p /etc/nginx/ssl
sudo cp /path/to/fullchain.pem /etc/nginx/ssl/
sudo cp /path/to/privkey.pem /etc/nginx/ssl/
sudo chmod 600 /etc/nginx/ssl/*.pem

# 配置 Nginx 使用 SSL
# 使用前面提供的 HTTPS Nginx 配置
```

## 11. 监控和日志配置

### 添加日志收集

使用 Seq 可以集中收集和查询日志：

```yaml
# 在 docker-compose.yml 中添加
seq:
  image: datalust/seq:latest
  environment:
    - ACCEPT_EULA=Y
  ports:
    - "5341:80"
  volumes:
    - seq_data:/data
  networks:
    - slzr-network

volumes:
  seq_data:
```

在应用配置中添加 Seq 日志提供程序：

```json
{
  "Serilog": {
    "Using": [ "Serilog.Sinks.Console", "Serilog.Sinks.Seq" ],
    "MinimumLevel": {
      "Default": "Information",
      "Override": {
        "Microsoft": "Warning",
        "System": "Warning"
      }
    },
    "WriteTo": [
      {
        "Name": "Console"
      },
      {
        "Name": "Seq",
        "Args": {
          "serverUrl": "http://seq:5341"
        }
      }
    ],
    "Enrich": [ "FromLogContext", "WithMachineName", "WithThreadId" ]
  }
}
```


## 总结

以上就是 SlzrCrossGate 项目的 Linux 部署方案。根据您的需求和偏好，可以选择 Docker 容器化部署或直接部署到 Linux 服务器。Docker 部署更加简单和灵活，推荐用于生产环境。对于配置文件中的敏感信息（如密码、密钥等），建议使用环境变量或安全的配置存储方案进行管理。

如果有其他需要或问题，请随时提出。

```bash

$env:HTTP_PROXY = "http://127.0.0.1:10808"
$env:HTTPS_PROXY = "http://127.0.0.1:10808"
$env:NO_PROXY = "localhost,127.0.0.1"



# 镜像管理： 下载离线安装包（社区版）-生产环境推荐
wget https://github.com/goharbor/harbor/releases/download/v2.13.1/harbor-offline-installer-v2.13.1.tgz

# 解压并配置
tar xvf harbor-offline-installer-*.tgz
cd harbor
./install.sh

# 镜像管理：docker registry  

# 创建 docker registry
mkdir -p /data/registry
docker run -d \
  -p 5000:5000 \
  --name registry \
  --restart=always \
  -v /data/registry:/var/lib/registry \
  registry:2


# 生成用户名密码文件
mkdir auth

export HTTP_PROXY=http://localhost:10808
export HTTPS_PROXY=http://localhost:10808
docker run --entrypoint htpasswd httpd:2 -Bbn slzr 'slzr.12345' > auth/htpasswd

# 启动带认证的仓库
docker run -d \
  -p 5180:5000 \
  -v /e/registry:/var/lib/registry \
  -v $(pwd)/auth:/auth \
  -e "REGISTRY_AUTH=htpasswd" \
  -e "REGISTRY_AUTH_HTPASSWD_REALM=Registry Realm" \
  -e "REGISTRY_AUTH_HTPASSWD_PATH=/auth/htpasswd" \
  registry:2




# 递归修改所有权（使用现有lighthouse用户）
sudo chown -R 1000:1000 /home/slzr/test/registry/data

# 设置安全权限（目录755，文件644）
sudo find /home/slzr/test/registry/data -type d -exec chmod 755 {} \;
sudo find /home/slzr/test/registry/data -type f -exec chmod 644 {} \;

mkdir -p /home/slzr/test/registry-proxy/data
sudo chown -R 1000:1000 /home/slzr/test/registry-proxy/data

sudo find /home/slzr/test/registry-proxy/data -type d -exec chmod 755 {} \;
sudo find /home/slzr/test/registry-proxy/data -type f -exec chmod 644 {} \;

# 验证
ls -ld /home/slzr/test/registry/data/
#创建config.yml
/etc/docker/registry/config.yml
version: 0.1
storage:
filesystem:
    rootdirectory: /var/lib/registry
delete:
    enabled: true
proxy:
    remoteurl: https://mirror.ccs.tencentyun.com
    uploads:
        allow: false
http:
addr: :5000
tls:
    certificate: /certs/pointlife365.net_bundle.crt
    key: /certs/pointlife365.net.key
auth:
htpasswd:
    realm: Registry Realm
    path: /auth/htpasswd 

 

# 停止并重建 Registry 容器
docker stop registry && docker rm registry



docker run -d \
  --name registry \
  -p 5180:5000 \
  --user 1000:1000 \
  -v /home/slzr/test/registry/config.yml:/etc/docker/registry/config.yml \
  -v /home/slzr/test/registry/ssl:/certs:ro \
  -v /home/slzr/test/registry/data:/var/lib/registry \
  -v /home/slzr/test/auth:/auth \
  --network registry-net \
  registry:2.8.2



# 配置文件 /home/slzr/test/proxy-config.yml
version: 0.1
proxy:
  remoteurl: https://mirror.ccs.tencentyun.com
  pullthrough: true
storage:
  filesystem:
    rootdirectory: /var/lib/registry
http:
  addr: :5000
  tls:
    certificate: /certs/pointlife365.net_bundle.crt
    key: /certs/pointlife365.net.key

docker run -d \
  --name registry-proxy \
  -p 5180:5000 \
  --user 1000:1000 \
  -v /home/slzr/test/registry-proxy/config.yml:/etc/docker/registry/config.yml \
  -v /home/slzr/test/registry/ssl:/certs:ro \
  -v /home/slzr/test/registry-proxy/data:/var/lib/registry \
  -v /home/slzr/test/auth:/auth \
  --network registry-net \
  registry:2.8.2

  ```





```bash
# 停止并重建 Registry 容器
docker stop registry && docker rm registry
docker stop registry-proxy && docker rm registry-proxy


docker network create registry-net
docker run -d \
  --name registry \
  --user 1000:1000 \
  -e REGISTRY_HTTP_HOST="" \
  -v /home/slzr/test/registry/config.yml:/etc/docker/registry/config.yml \
  -v /home/slzr/test/registry/data:/var/lib/registry \
  -v /home/slzr/test/auth:/auth \
  --network registry-net \
  registry:2.8.2

docker run -d \
  --name registry-proxy \
  --user 1000:1000 \
  -e REGISTRY_HTTP_HOST="" \
  -v /home/slzr/test/registry-proxy/config.yml:/etc/docker/registry/config.yml \
  -v /home/slzr/test/registry-proxy/data:/var/lib/registry \
  -v /home/slzr/test/auth:/auth \
  --network registry-net \
  registry:2.8.2


docker run -d --name nginx \
  -p 5180:443 \
  -v /home/slzr/test/nginx/nginx.conf:/etc/nginx/nginx.conf:ro \
  -v /home/slzr/test/nginx/conf.d:/etc/nginx/conf.d \
  -v /home/slzr/test/ssl:/etc/nginx/ssl \
  -v /home/slzr/test/nginx/cache:/var/cache/nginx \
  --network registry-net \
  nginx:1.23-alpine

    -v /home/slzr/test/auth:/etc/nginx/auth \

cat <<EOF > ~/nginx-config/conf.d/registry.conf
server {
    listen 5180 ssl;
    server_name devtest.pointlife365.net;

    # SSL 配置（证书需提前放入ssl目录）
    ssl_certificate /etc/nginx/ssl/pointlife365.net_bundle.crt;
    ssl_certificate_key /etc/nginx/ssl/pointlife365.net.key;
    ssl_protocols TLSv1.2 TLSv1.3;

    # 全局基础认证
    auth_basic "Registry Realm";
    auth_basic_user_file /etc/nginx/auth/htpasswd;

    # 代理到主Registry（推送）
    location /v2/ {
        proxy_pass http://registry:5000;
        proxy_set_header Host \$host;
        proxy_set_header Authorization \$http_authorization;
    }

    # 代理到镜像缓存（拉取公共镜像）
    location /v2/library/ {
        proxy_pass http://registry-proxy:5000;
        proxy_set_header Host \$host;
        proxy_set_header Authorization \$http_authorization;
    }
}
EOF


```











```bash
#登录私有仓库
docker login devtest.pointlife365.net:5180 -u slzr -p slzr.12345
#更安全的方式登录，防止密码出现在历史命令中
cat registry-password.txt | docker login devtest.pointlife365.net:5180 -u slzr --password-stdin

#退出登录 
docker logout devtest.pointlife365.net:5180




```


# 构建时同时打两个标签
docker build -t myregistry.com/app:1.2.0 -t myregistry.com/app:latest .

# 推送
docker push myregistry.com/app:1.2.0
docker push myregistry.com/app:latest