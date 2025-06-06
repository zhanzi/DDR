# RabbitMQ 故障排除指南

## 用户数据丢失问题解决方案

### 问题原因

RabbitMQ用户数据丢失通常由以下原因造成：

1. **节点名称不一致** - RabbitMQ使用节点名称来识别数据，如果节点名称变化，会导致数据无法识别
2. **hostname变化** - Docker容器重启时hostname可能变化
3. **数据卷配置不当** - 数据没有正确持久化
4. **网络配置问题** - 容器间通信配置错误

### 已修复的配置

#### 1. 固定hostname和节点名称

```yaml
rabbitmq:
  hostname: slzr-rabbitmq  # 固定hostname
  environment:
    - RABBITMQ_NODENAME=rabbit@slzr-rabbitmq  # 固定节点名称
    - RABBITMQ_USE_LONGNAME=true  # 使用长名称确保稳定性
  healthcheck:
    test: ["CMD", "rabbitmq-diagnostics", "ping"]  # 使用更可靠的健康检查
```

#### 2. 完整的数据持久化

```yaml
volumes:
  - rabbitmq_data:/var/lib/rabbitmq  # 数据持久化
  - rabbitmq_logs:/var/log/rabbitmq  # 日志持久化
```

#### 3. 正确的端口映射

```yaml
ports:
  - "5672:5672"   # AMQP端口
  - "15672:15672" # 管理界面端口
```

#### 4. 应用程序连接配置

```yaml
environment:
  - RabbitMQ__HostName=slzr-rabbitmq  # 使用容器名称而非host.docker.internal
```

## 使用指南

### 1. 启动RabbitMQ服务

```bash
# 启动所有服务
docker-compose -f docker-compose-registry.yml up -d

# 仅启动RabbitMQ
docker-compose -f docker-compose-registry.yml up -d rabbitmq
```

### 2. 访问管理界面

- **URL**: http://localhost:15672
- **默认账号**: guest / guest
- **自定义账号**: 通过环境变量配置

### 3. 创建自定义用户

#### 方法1: 使用初始化脚本

```bash
# 运行初始化脚本
./scripts/init-rabbitmq.sh
```

#### 方法2: 手动创建

```bash
# 进入容器
docker exec -it slzr-rabbitmq bash

# 创建用户
rabbitmqctl add_user myuser mypassword

# 设置管理员权限
rabbitmqctl set_user_tags myuser administrator

# 设置权限
rabbitmqctl set_permissions -p / myuser ".*" ".*" ".*"
```

### 4. 验证数据持久化

```bash
# 查看用户列表
docker exec slzr-rabbitmq rabbitmqctl list_users

# 停止服务
docker-compose -f docker-compose-registry.yml down

# 重新启动
docker-compose -f docker-compose-registry.yml up -d

# 再次查看用户列表（应该保持一致）
docker exec slzr-rabbitmq rabbitmqctl list_users
```

## 故障排除

### 1. 检查服务状态

```bash
# 查看容器状态
docker-compose -f docker-compose-registry.yml ps

# 查看RabbitMQ日志
docker logs slzr-rabbitmq

# 检查RabbitMQ状态
docker exec slzr-rabbitmq rabbitmq-diagnostics ping
docker exec slzr-rabbitmq rabbitmqctl status
```

### 2. 数据卷问题

```bash
# 查看数据卷
docker volume ls | grep rabbitmq

# 检查数据卷内容
docker run --rm -v rabbitmq_data:/data alpine ls -la /data
```

### 3. 网络连接问题

```bash
# 从应用容器测试连接
docker exec tcpserver-api ping slzr-rabbitmq

# 测试端口连接
docker exec tcpserver-api telnet slzr-rabbitmq 5672
```

### 4. 重置RabbitMQ数据

如果需要完全重置RabbitMQ数据：

```bash
# 停止服务
docker-compose -f docker-compose-registry.yml down

# 删除数据卷
docker volume rm slzrcrossgate_rabbitmq_data
docker volume rm slzrcrossgate_rabbitmq_logs

# 重新启动
docker-compose -f docker-compose-registry.yml up -d
```

## 最佳实践

### 1. 环境变量配置

在 `.env` 文件中配置：

```bash
# RabbitMQ基础配置
RABBITMQ_USER=admin
RABBITMQ_PASS=secure_password

# 自定义用户
RABBITMQ_CUSTOM_USER=app_user
RABBITMQ_CUSTOM_PASS=app_password
```

### 2. 备份策略

```bash
# 备份RabbitMQ配置
docker exec slzr-rabbitmq rabbitmqctl export_definitions /tmp/definitions.json
docker cp slzr-rabbitmq:/tmp/definitions.json ./backup/

# 恢复配置
docker cp ./backup/definitions.json slzr-rabbitmq:/tmp/
docker exec slzr-rabbitmq rabbitmqctl import_definitions /tmp/definitions.json
```

### 3. 监控和维护

- 定期检查队列状态
- 监控内存和磁盘使用
- 定期备份配置和重要数据
- 更新RabbitMQ版本时注意兼容性

## 常见错误

### 1. "Node with name already exists"

**原因**: 节点名称冲突
**解决**: 确保RABBITMQ_NODENAME唯一且一致

### 2. "Connection refused"

**原因**: 网络配置或端口映射问题
**解决**: 检查网络配置和端口映射

### 3. "Authentication failed"

**原因**: 用户名密码错误或用户不存在
**解决**: 检查用户配置和权限设置
