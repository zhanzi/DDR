# RabbitMQ 健康检查指南

## 健康检查配置说明

### 当前配置

```yaml
healthcheck:
  test: ["CMD-SHELL", "rabbitmq-diagnostics ping || rabbitmqctl node_health_check || exit 1"]
  interval: 30s
  timeout: 10s
  retries: 5
  start_period: 60s
```

### 健康检查命令说明

#### 1. `rabbitmq-diagnostics ping`
- **用途**: 检查RabbitMQ节点是否响应
- **优点**: 快速、轻量级检查
- **适用版本**: RabbitMQ 3.7+

#### 2. `rabbitmqctl node_health_check`
- **用途**: 全面的节点健康检查
- **优点**: 检查更全面，包括内存、磁盘等
- **适用版本**: 所有版本

#### 3. 组合检查
当前配置使用 `||` 操作符，优先使用 `rabbitmq-diagnostics ping`，如果失败则回退到 `rabbitmqctl node_health_check`。

## 替代健康检查方案

### 方案1: 简单状态检查
```yaml
healthcheck:
  test: ["CMD", "rabbitmqctl", "status"]
  interval: 30s
  timeout: 10s
  retries: 5
  start_period: 60s
```

### 方案2: 端口连接检查
```yaml
healthcheck:
  test: ["CMD-SHELL", "nc -z localhost 5672 || exit 1"]
  interval: 30s
  timeout: 10s
  retries: 5
  start_period: 60s
```

### 方案3: HTTP管理接口检查
```yaml
healthcheck:
  test: ["CMD-SHELL", "curl -f http://localhost:15672/api/aliveness-test/%2F -u guest:guest || exit 1"]
  interval: 30s
  timeout: 10s
  retries: 5
  start_period: 60s
```

## 测试健康检查

### 1. 查看容器健康状态
```bash
# 查看所有容器状态
docker ps

# 查看特定容器健康状态
docker inspect slzr-rabbitmq --format='{{.State.Health.Status}}'

# 查看健康检查历史
docker inspect slzr-rabbitmq --format='{{range .State.Health.Log}}{{.Start}}: {{.Output}}{{end}}'
```

### 2. 手动执行健康检查
```bash
# 测试当前健康检查命令
docker exec slzr-rabbitmq sh -c "rabbitmq-diagnostics ping || rabbitmqctl node_health_check || exit 1"

# 测试各个命令
docker exec slzr-rabbitmq rabbitmq-diagnostics ping
docker exec slzr-rabbitmq rabbitmqctl node_health_check
docker exec slzr-rabbitmq rabbitmqctl status
```

### 3. 使用测试脚本
```bash
# 运行健康检查测试
./test-healthcheck.sh
```

## 故障排除

### 1. 健康检查失败的常见原因

#### 启动时间过长
- **症状**: 容器显示为 `starting` 状态很长时间
- **解决**: 增加 `start_period` 时间

```yaml
healthcheck:
  start_period: 120s  # 增加到2分钟
```

#### 内存不足
- **症状**: 健康检查间歇性失败
- **解决**: 检查容器内存限制和系统资源

#### 网络问题
- **症状**: 健康检查超时
- **解决**: 检查网络配置和防火墙设置

### 2. 调试健康检查

#### 查看详细日志
```bash
# 查看容器日志
docker logs slzr-rabbitmq

# 实时查看日志
docker logs -f slzr-rabbitmq

# 查看健康检查输出
docker inspect slzr-rabbitmq | jq '.[0].State.Health'
```

#### 进入容器调试
```bash
# 进入容器
docker exec -it slzr-rabbitmq bash

# 手动执行健康检查命令
rabbitmq-diagnostics ping
rabbitmqctl node_health_check
rabbitmqctl status

# 检查进程状态
ps aux | grep rabbit

# 检查端口监听
netstat -tlnp | grep 5672
```

### 3. 性能优化

#### 调整检查频率
```yaml
healthcheck:
  interval: 60s     # 降低检查频率
  timeout: 15s      # 增加超时时间
  retries: 3        # 减少重试次数
```

#### 使用轻量级检查
对于生产环境，可以使用更轻量级的检查：

```yaml
healthcheck:
  test: ["CMD-SHELL", "nc -z localhost 5672"]
  interval: 30s
  timeout: 5s
  retries: 3
  start_period: 60s
```

## 最佳实践

### 1. 环境特定配置
- **开发环境**: 使用详细的健康检查，便于调试
- **生产环境**: 使用轻量级检查，减少资源消耗

### 2. 监控集成
- 配置外部监控系统监控健康检查状态
- 设置告警规则，及时发现问题

### 3. 日志管理
- 定期清理健康检查日志
- 配置日志轮转，避免磁盘空间不足

## 常见错误及解决方案

### 1. "command not found"
**原因**: 健康检查命令在容器中不存在
**解决**: 使用容器支持的命令，或更新镜像版本

### 2. "connection refused"
**原因**: RabbitMQ服务未完全启动
**解决**: 增加 `start_period` 时间，或检查服务配置

### 3. "timeout"
**原因**: 健康检查执行时间过长
**解决**: 增加 `timeout` 时间，或使用更快的检查方法

### 4. "unhealthy"
**原因**: 健康检查连续失败
**解决**: 检查服务状态、资源使用情况和配置
