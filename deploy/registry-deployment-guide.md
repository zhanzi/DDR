# SlzrCrossGate 服务器运维文档

## 1. 概述

本文档详细介绍了如何在服务器上使用 `docker-compose-registry.yml` 部署和运行 SlzrCrossGate 项目。该项目包含以下主要服务：

- **API Service**: 核心业务API服务，提供HTTP API和TCP通信服务
- **WebAdmin**: 后台管理界面，基于React+.NET的Web应用
- **RabbitMQ**: 消息队列服务，用于异步消息处理
- **MinIO**: 对象存储服务，用于文件存储
- **Nginx**: 反向代理服务，统一入口和负载均衡

## 2. 前置条件

### 2.1 服务器环境要求
- **操作系统**: Linux (推荐 Ubuntu 20.04+ 或 CentOS 8+)
- **Docker**: 版本 20.10+
- **Docker Compose**: 版本 2.0+
- **内存**: 至少 8GB RAM
- **存储**: 至少 50GB 可用空间
- **网络**: 确保服务器可以访问私有镜像仓库

### 2.2 私有镜像仓库配置
- 私有仓库地址: `devtest.pointlife365.net:5180`
- 认证信息: 用户名 `slzr`, 密码 `slzr.12345`
- 确保服务器可以访问该私有仓库

### 2.3 外部依赖
- **MySQL数据库**: 项目使用外部MySQL数据库（通过host.docker.internal访问）
- 确保MySQL服务运行在宿主机的3306端口
- 数据库名称: `tcpserver`

## 3. 部署准备

### 3.1 登录私有镜像仓库

```bash
# 方式1: 直接登录（密码会出现在历史命令中）
docker login devtest.pointlife365.net:5180 -u slzr -p slzr.12345

# 方式2: 安全登录（推荐）
echo "slzr.12345" | docker login devtest.pointlife365.net:5180 -u slzr --password-stdin

# 方式3: 使用密码文件
cat registry-password.txt | docker login devtest.pointlife365.net:5180 -u slzr --password-stdin
```

### 3.2 创建项目目录结构

```bash
# 创建项目根目录
mkdir -p /opt/slzr-crossgate
cd /opt/slzr-crossgate

# 创建必要的子目录
mkdir -p nginx/conf.d nginx/logs
mkdir -p data/rabbitmq data/minio
mkdir -p logs/api logs/web

# 设置目录权限
chmod -R 755 nginx
chmod -R 777 data logs
```

### 3.3 配置环境变量

```bash
# 创建环境变量文件
cat > .env << 'EOF'
# 数据库配置
MYSQL_ROOT_PASSWORD=your_secure_mysql_password

# RabbitMQ配置
RABBITMQ_USER=admin
RABBITMQ_PASS=your_secure_rabbitmq_password

# JWT配置
JWT_KEY=your_32_character_jwt_secret_key_here_12345678

# MinIO配置
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=your_secure_minio_password
MINIO_BUCKET_NAME=slzr-files

# 文件存储配置
FILE_STORAGE_TYPE=MinIO
EOF

# 设置环境变量文件权限
chmod 600 .env
```

## 4. 服务部署

### 4.1 下载配置文件

```bash
# 下载 docker-compose-registry.yml 文件
# 如果从Git仓库获取
git clone <repository-url> .
# 或者手动创建配置文件（见下一节）
```

### 4.2 配置Nginx

```bash
# 创建Nginx主配置文件
cat > nginx/nginx.conf << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log notice;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

# HTTP 配置块
http {
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    keepalive_timeout 65;
    types_hash_max_size 4096;

    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # 包含HTTP配置文件
    include /etc/nginx/conf.d/*.conf;
}

# TCP/UDP 代理配置块（Stream模块）
stream {
    log_format basic '$remote_addr [$time_local] '
                     '$protocol $status $bytes_sent $bytes_received '
                     '$session_time';

    access_log /var/log/nginx/stream_access.log basic;
    error_log /var/log/nginx/stream_error.log;

    # TCP代理配置 - 代理到api-service的TCP服务
    upstream tcp_backend {
        server api-service:8001;
    }

    server {
        listen 8823;
        proxy_pass tcp_backend;
        proxy_timeout 10s;
        proxy_connect_timeout 5s;
        proxy_responses 1;
    }
}
EOF

# 创建HTTP站点配置
cat > nginx/conf.d/default.conf << 'EOF'
server {
    listen 80;
    #server_name localhost;

    location / {
        proxy_pass http://web-admin:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
    }

    location /api-service/ {
        proxy_pass http://api-service:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
}
EOF
```

### 4.3 启动服务

```bash
# 拉取最新镜像
docker compose -f docker-compose-registry.yml pull

# 启动所有服务
docker compose -f docker-compose-registry.yml up -d

# 查看服务状态
docker compose -f docker-compose-registry.yml ps
```

## 5. 服务访问

### 5.1 访问地址
部署完成后，可以通过以下地址访问各项服务：

- **WebAdmin管理界面**: http://服务器IP:18822
- **API服务**: http://服务器IP:18822/api-service/
- **TCP服务**: 服务器IP:8822 (用于终端设备连接)
- **RabbitMQ管理界面**: http://服务器IP:15673 (用户名/密码见.env文件)
- **MinIO管理界面**: http://服务器IP:9001 (用户名/密码见.env文件)

### 5.2 默认登录信息
- **WebAdmin系统管理员**:
  - 用户名: admin
  - 密码: Slzr!123456
  - 首次登录需要设置双因素认证

## 6. 日常维护

### 6.1 查看服务状态

```bash
# 查看所有服务状态
docker compose -f docker-compose-registry.yml ps

# 查看服务详细信息
docker compose -f docker-compose-registry.yml ps -a

# 查看服务资源使用情况
docker stats

# 查看特定服务的日志
docker compose -f docker-compose-registry.yml logs api-service
docker compose -f docker-compose-registry.yml logs web-admin
docker compose -f docker-compose-registry.yml logs rabbitmq
docker compose -f docker-compose-registry.yml logs minio
docker compose -f docker-compose-registry.yml logs nginx
```

### 6.2 服务管理命令

```bash
# 启动所有服务
docker compose -f docker-compose-registry.yml up -d

# 停止所有服务
docker compose -f docker-compose-registry.yml down

# 重启所有服务
docker compose -f docker-compose-registry.yml restart

# 重启特定服务
docker compose -f docker-compose-registry.yml restart api-service
docker compose -f docker-compose-registry.yml restart web-admin

# 停止特定服务
docker compose -f docker-compose-registry.yml stop api-service

# 启动特定服务
docker compose -f docker-compose-registry.yml start api-service

# 强制重新创建服务
docker compose -f docker-compose-registry.yml up -d --force-recreate api-service
```

### 6.3 日志管理

```bash
# 查看实时日志
docker compose -f docker-compose-registry.yml logs -f api-service

# 查看最近的日志（最后100行）
docker compose -f docker-compose-registry.yml logs --tail=100 api-service

# 查看特定时间段的日志
docker compose -f docker-compose-registry.yml logs --since="2024-01-01T00:00:00" api-service

# 清理日志（谨慎使用）
docker system prune -f
```

### 6.4 数据备份

```bash
# 备份RabbitMQ数据
docker run --rm -v slzrcrossgate_rabbitmq_data:/data -v $(pwd):/backup alpine tar czf /backup/rabbitmq-backup-$(date +%Y%m%d).tar.gz -C /data .

# 备份MinIO数据
docker run --rm -v slzrcrossgate_minio_data:/data -v $(pwd):/backup alpine tar czf /backup/minio-backup-$(date +%Y%m%d).tar.gz -C /data .

# 备份应用存储数据
docker run --rm -v slzrcrossgate_api_storage:/data -v $(pwd):/backup alpine tar czf /backup/api-storage-backup-$(date +%Y%m%d).tar.gz -C /data .
docker run --rm -v slzrcrossgate_webadmin_storage:/data -v $(pwd):/backup alpine tar czf /backup/webadmin-storage-backup-$(date +%Y%m%d).tar.gz -C /data .

# 备份MySQL数据（如果使用容器化MySQL）
docker exec mysql-container mysqldump -u root -p tcpserver > mysql-backup-$(date +%Y%m%d).sql
```

### 6.5 数据恢复

```bash
# 恢复RabbitMQ数据
docker run --rm -v slzrcrossgate_rabbitmq_data:/data -v $(pwd):/backup alpine tar xzf /backup/rabbitmq-backup-20240101.tar.gz -C /data

# 恢复MinIO数据
docker run --rm -v slzrcrossgate_minio_data:/data -v $(pwd):/backup alpine tar xzf /backup/minio-backup-20240101.tar.gz -C /data

# 恢复MySQL数据
docker exec -i mysql-container mysql -u root -p tcpserver < mysql-backup-20240101.sql
```

## 7. 镜像更新

### 7.1 检查镜像更新

```bash
# 检查私有仓库中的可用镜像版本
curl -u slzr:slzr.12345 http://devtest.pointlife365.net:5180/v2/slzr/tcpserver-api/tags/list
curl -u slzr:slzr.12345 http://devtest.pointlife365.net:5180/v2/slzr/tcpserver-web/tags/list

# 查看当前使用的镜像版本
docker compose -f docker-compose-registry.yml images
```

### 7.2 更新应用镜像

```bash
# 方式1: 拉取最新镜像并重启服务
docker compose -f docker-compose-registry.yml pull api-service web-admin
docker compose -f docker-compose-registry.yml up -d api-service web-admin

# 方式2: 零停机更新（逐个更新）
# 更新API服务
docker compose -f docker-compose-registry.yml pull api-service
docker compose -f docker-compose-registry.yml up -d --no-deps api-service

# 等待服务启动完成，然后更新Web服务
docker compose -f docker-compose-registry.yml pull web-admin
docker compose -f docker-compose-registry.yml up -d --no-deps web-admin

# 方式3: 使用特定版本标签
# 修改docker-compose-registry.yml中的镜像标签，然后执行
docker compose -f docker-compose-registry.yml up -d
```

### 7.3 回滚到之前版本

```bash
# 如果新版本有问题，可以回滚到之前的版本
# 1. 修改docker-compose-registry.yml中的镜像标签为之前的版本
# 2. 重新部署
docker compose -f docker-compose-registry.yml up -d api-service web-admin

# 或者使用特定版本
docker compose -f docker-compose-registry.yml up -d \
  --scale api-service=0 && \
docker run -d --name api-service-old \
  devtest.pointlife365.net:5180/slzr/tcpserver-api:previous-version
```

## 8. 监控和健康检查

### 8.1 服务健康检查

```bash
# 检查服务健康状态
docker compose -f docker-compose-registry.yml ps

# 手动执行健康检查
curl -f http://localhost:18822/health  # WebAdmin健康检查
curl -f http://localhost:18822/api-service/health  # API服务健康检查

# 检查MinIO健康状态
curl -f http://localhost:9000/minio/health/live
```

### 8.2 性能监控

```bash
# 查看容器资源使用情况
docker stats --no-stream

# 查看系统资源使用情况
top
htop
free -h
df -h

# 查看网络连接
netstat -tulpn | grep -E "(18822|8822|9000|9001|5673|15673)"
```

### 8.3 设置监控脚本

```bash
# 创建健康检查脚本
cat > /opt/slzr-crossgate/health-check.sh << 'EOF'
#!/bin/bash

# 检查服务状态
echo "=== 服务状态检查 ==="
cd /opt/slzr-crossgate
docker compose -f docker-compose-registry.yml ps

echo -e "\n=== 健康检查 ==="
# WebAdmin健康检查
if curl -f -s http://localhost:18822/health > /dev/null; then
    echo "✓ WebAdmin服务正常"
else
    echo "✗ WebAdmin服务异常"
fi

# API服务健康检查
if curl -f -s http://localhost:18822/api-service/health > /dev/null; then
    echo "✓ API服务正常"
else
    echo "✗ API服务异常"
fi

# MinIO健康检查
if curl -f -s http://localhost:9000/minio/health/live > /dev/null; then
    echo "✓ MinIO服务正常"
else
    echo "✗ MinIO服务异常"
fi

echo -e "\n=== 资源使用情况 ==="
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
EOF

chmod +x /opt/slzr-crossgate/health-check.sh

# 设置定时任务（每5分钟检查一次）
echo "*/5 * * * * /opt/slzr-crossgate/health-check.sh >> /var/log/slzr-health.log 2>&1" | crontab -
```

## 9. 故障排除

### 9.1 常见问题及解决方案

#### 9.1.1 服务无法启动

```bash
# 检查端口占用
netstat -tulpn | grep -E "(18822|8822|9000|9001|5673|15673)"

# 检查Docker服务状态
systemctl status docker

# 检查磁盘空间
df -h

# 检查内存使用
free -h

# 清理Docker资源
docker system prune -f
docker volume prune -f
```

#### 9.1.2 镜像拉取失败

```bash
# 检查私有仓库连接
curl -u slzr:slzr.12345 http://devtest.pointlife365.net:5180/v2/_catalog

# 重新登录私有仓库
docker logout devtest.pointlife365.net:5180
docker login devtest.pointlife365.net:5180 -u slzr -p slzr.12345
#更安全的方式登录，防止密码出现在历史命令中
cat registry-password.txt | docker login devtest.pointlife365.net:5180 -u slzr --password-stdin

# 手动拉取镜像
docker pull devtest.pointlife365.net:5180/slzr/tcpserver-api:latest
docker pull devtest.pointlife365.net:5180/slzr/tcpserver-web:latest
```

#### 9.1.3 数据库连接问题

```bash
# 检查MySQL服务状态（宿主机）
systemctl status mysql
systemctl status mysqld

# 检查MySQL端口
netstat -tulpn | grep 3306

# 测试数据库连接
mysql -h localhost -P 3306 -u root -p tcpserver

# 检查容器网络
docker network ls
docker network inspect slzrcrossgate_slzr-network
```

#### 9.1.4 RabbitMQ问题

```bash
# 检查RabbitMQ日志
docker compose -f docker-compose-registry.yml logs rabbitmq

# 重置RabbitMQ数据（谨慎使用）
docker compose -f docker-compose-registry.yml down
docker volume rm slzrcrossgate_rabbitmq_data
docker compose -f docker-compose-registry.yml up -d rabbitmq
```

#### 9.1.5 MinIO问题

```bash
# 检查MinIO日志
docker compose -f docker-compose-registry.yml logs minio

# 检查MinIO存储权限
docker exec -it minio ls -la /data

# 重新创建MinIO存储桶
docker exec -it minio mc mb /data/slzr-files
```

### 9.2 日志分析

```bash
# 查看应用错误日志
docker compose -f docker-compose-registry.yml logs api-service | grep -i error
docker compose -f docker-compose-registry.yml logs web-admin | grep -i error

# 查看Nginx访问日志
tail -f nginx/logs/access.log

# 查看Nginx错误日志
tail -f nginx/logs/error.log

# 查看系统日志
journalctl -u docker -f
```

### 9.3 性能优化

```bash
# 调整Docker资源限制
# 编辑docker-compose-registry.yml中的资源配置
# deploy:
#   resources:
#     limits:
#       cpus: "2.0"
#       memory: 4G
#     reservations:
#       cpus: "1.0"
#       memory: 2G

# 清理未使用的Docker资源
docker system prune -a -f

# 优化MySQL配置（宿主机）
# 编辑 /etc/mysql/mysql.conf.d/mysqld.cnf
# 添加或修改以下配置：
# innodb_buffer_pool_size = 2G
# max_connections = 200
# query_cache_size = 64M
```

## 10. 安全配置

### 10.1 防火墙配置

```bash
# 配置UFW防火墙（Ubuntu）
ufw allow 22/tcp      # SSH
ufw allow 18822/tcp   # WebAdmin
ufw allow 8822/tcp    # TCP服务
ufw enable

# 配置firewalld防火墙（CentOS）
firewall-cmd --permanent --add-port=22/tcp
firewall-cmd --permanent --add-port=18822/tcp
firewall-cmd --permanent --add-port=8822/tcp
firewall-cmd --reload
```

### 10.2 SSL/TLS配置

```bash
# 生成自签名证书（测试环境）
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/server.key \
  -out nginx/ssl/server.crt \
  -subj "/C=CN/ST=State/L=City/O=Organization/CN=localhost"

# 修改Nginx配置支持HTTPS
cat >> nginx/conf.d/default.conf << 'EOF'

server {
    listen 443 ssl;
    server_name _;

    ssl_certificate /etc/nginx/ssl/server.crt;
    ssl_certificate_key /etc/nginx/ssl/server.key;

    location / {
        proxy_pass http://web-admin:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
EOF
```

### 10.3 访问控制

```bash
# 限制管理界面访问（仅允许特定IP）
cat > nginx/conf.d/admin-access.conf << 'EOF'
# 限制RabbitMQ管理界面访问
location /rabbitmq/ {
    allow 192.168.1.0/24;  # 允许内网访问
    allow 10.0.0.0/8;      # 允许内网访问
    deny all;              # 拒绝其他访问

    proxy_pass http://rabbitmq:15672/;
}

# 限制MinIO管理界面访问
location /minio/ {
    allow 192.168.1.0/24;
    allow 10.0.0.0/8;
    deny all;

    proxy_pass http://minio:9001/;
}
EOF
```

## 11. 备份和恢复策略

### 11.1 自动备份脚本

```bash
# 创建自动备份脚本
cat > /opt/slzr-crossgate/backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/opt/backups/slzr-crossgate"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份配置文件
tar czf $BACKUP_DIR/config-$DATE.tar.gz \
  docker-compose-registry.yml .env nginx/

# 备份应用数据
docker run --rm \
  -v slzrcrossgate_rabbitmq_data:/data \
  -v $BACKUP_DIR:/backup \
  alpine tar czf /backup/rabbitmq-$DATE.tar.gz -C /data .

docker run --rm \
  -v slzrcrossgate_minio_data:/data \
  -v $BACKUP_DIR:/backup \
  alpine tar czf /backup/minio-$DATE.tar.gz -C /data .

docker run --rm \
  -v slzrcrossgate_api_storage:/data \
  -v $BACKUP_DIR:/backup \
  alpine tar czf /backup/api-storage-$DATE.tar.gz -C /data .

# 备份MySQL数据
mysqldump -h localhost -u root -p$MYSQL_ROOT_PASSWORD tcpserver > $BACKUP_DIR/mysql-$DATE.sql

# 清理7天前的备份
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete

echo "备份完成: $DATE"
EOF

chmod +x /opt/slzr-crossgate/backup.sh

# 设置每日凌晨2点自动备份
echo "0 2 * * * /opt/slzr-crossgate/backup.sh >> /var/log/slzr-backup.log 2>&1" | crontab -
```

### 11.2 灾难恢复流程

```bash
# 1. 停止所有服务
docker compose -f docker-compose-registry.yml down

# 2. 恢复配置文件
tar xzf /opt/backups/slzr-crossgate/config-20240101_020000.tar.gz

# 3. 恢复数据卷
docker run --rm \
  -v slzrcrossgate_rabbitmq_data:/data \
  -v /opt/backups/slzr-crossgate:/backup \
  alpine tar xzf /backup/rabbitmq-20240101_020000.tar.gz -C /data

# 4. 恢复MySQL数据
mysql -h localhost -u root -p tcpserver < /opt/backups/slzr-crossgate/mysql-20240101_020000.sql

# 5. 重新启动服务
docker compose -f docker-compose-registry.yml up -d
```

## 12. 常用运维命令速查

### 12.1 服务管理

```bash
# 启动服务
docker compose -f docker-compose-registry.yml up -d

# 停止服务
docker compose -f docker-compose-registry.yml down

# 重启服务
docker compose -f docker-compose-registry.yml restart

# 查看服务状态
docker compose -f docker-compose-registry.yml ps

# 查看服务日志
docker compose -f docker-compose-registry.yml logs -f [service_name]

# 进入容器
docker compose -f docker-compose-registry.yml exec api-service bash
docker compose -f docker-compose-registry.yml exec web-admin bash
```

### 12.2 镜像管理

```bash
# 拉取最新镜像
docker compose -f docker-compose-registry.yml pull

# 查看镜像信息
docker compose -f docker-compose-registry.yml images

# 清理未使用的镜像
docker image prune -f

# 查看镜像历史
docker history devtest.pointlife365.net:5180/slzr/tcpserver-api:latest
```

### 12.3 数据管理

```bash
# 查看数据卷
docker volume ls | grep slzrcrossgate

# 备份数据卷
docker run --rm -v slzrcrossgate_rabbitmq_data:/data -v $(pwd):/backup alpine tar czf /backup/rabbitmq-backup.tar.gz -C /data .

# 清理未使用的数据卷
docker volume prune -f
```

### 12.4 网络管理

```bash
# 查看网络
docker network ls | grep slzrcrossgate

# 查看网络详情
docker network inspect slzrcrossgate_slzr-network

# 测试网络连通性
docker run --rm --network slzrcrossgate_slzr-network alpine ping api-service
```

### 12.5 资源监控

```bash
# 查看资源使用
docker stats --no-stream

# 查看系统资源
free -h && df -h

# 查看端口占用
netstat -tulpn | grep -E "(18822|8822|9000|9001|5673|15673)"
```

## 13. 附录

### 13.1 环境变量说明

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| MYSQL_ROOT_PASSWORD | MySQL root密码 | - | 是 |
| RABBITMQ_USER | RabbitMQ用户名 | guest | 否 |
| RABBITMQ_PASS | RabbitMQ密码 | guest | 否 |
| JWT_KEY | JWT签名密钥 | - | 是 |
| MINIO_ROOT_USER | MinIO管理员用户名 | minioadmin | 否 |
| MINIO_ROOT_PASSWORD | MinIO管理员密码 | minioadmin123 | 否 |
| MINIO_BUCKET_NAME | MinIO存储桶名称 | slzr-files | 否 |
| FILE_STORAGE_TYPE | 文件存储类型 | MinIO | 否 |

### 13.2 端口映射说明

| 服务 | 容器端口 | 宿主机端口 | 说明 |
|------|----------|------------|------|
| nginx | 80 | 18822 | HTTP代理入口 |
| nginx | 8823 | 8822 | TCP代理入口 |
| api-service | 8000 | - | HTTP API（通过nginx代理） |
| api-service | 8001 | - | TCP服务（通过nginx代理） |
| web-admin | 80 | - | Web界面（通过nginx代理） |
| rabbitmq | 5672 | 5673 | AMQP协议 |
| rabbitmq | 15672 | 15673 | 管理界面 |
| minio | 9000 | 9000 | API接口 |
| minio | 9001 | 9001 | 管理界面 |

### 13.3 数据卷说明

| 数据卷名称 | 挂载路径 | 说明 |
|------------|----------|------|
| rabbitmq_data | /var/lib/rabbitmq | RabbitMQ数据 |
| rabbitmq_logs | /var/log/rabbitmq | RabbitMQ日志 |
| minio_data | /data | MinIO对象存储数据 |
| api_storage | /app/storage | API服务文件存储 |
| webadmin_storage | /app/storage | WebAdmin文件存储 |
| webadmin_keys | /app/Keys | WebAdmin加密密钥 |

### 13.4 私有镜像仓库管理

```bash
# 查看仓库中的所有镜像
curl -u slzr:slzr.12345 http://devtest.pointlife365.net:5180/v2/_catalog

# 查看特定镜像的标签
curl -u slzr:slzr.12345 http://devtest.pointlife365.net:5180/v2/slzr/tcpserver-api/tags/list
curl -u slzr:slzr.12345 http://devtest.pointlife365.net:5180/v2/slzr/tcpserver-web/tags/list

# 推送公有镜像到私有仓库
docker pull nginx:latest
docker tag nginx:latest devtest.pointlife365.net:5180/library/nginx:latest
docker push devtest.pointlife365.net:5180/library/nginx:latest

# 启动私有仓库管理界面
docker run -d -p 8090:80 --name registry-ui \
   -e NGINX_PROXY_PASS_URL=http://devtest.pointlife365.net:5180 \
   -e REGISTRY_USER=slzr \
   -e REGISTRY_PASS=slzr.12345 \
   -e CATALOG_ELEMENTS_LIMIT=100 \
   -e DELETE_IMAGES=true \
   joxit/docker-registry-ui:main
```

### 13.5 故障排除检查清单

1. **服务无法启动**
   - [ ] 检查端口是否被占用
   - [ ] 检查磁盘空间是否充足
   - [ ] 检查内存是否充足
   - [ ] 检查Docker服务是否正常
   - [ ] 检查镜像是否存在

2. **网络连接问题**
   - [ ] 检查防火墙设置
   - [ ] 检查Docker网络配置
   - [ ] 检查DNS解析
   - [ ] 检查代理设置

3. **数据库连接问题**
   - [ ] 检查MySQL服务状态
   - [ ] 检查数据库用户权限
   - [ ] 检查网络连通性
   - [ ] 检查连接字符串配置

4. **性能问题**
   - [ ] 检查CPU使用率
   - [ ] 检查内存使用率
   - [ ] 检查磁盘I/O
   - [ ] 检查网络带宽
   - [ ] 检查容器资源限制

---

**文档版本**: v1.0
**最后更新**: 2024-12-19
**维护人员**: 系统管理员

如有问题，请联系技术支持团队。
