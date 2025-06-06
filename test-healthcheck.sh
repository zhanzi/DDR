#!/bin/bash

# 健康检查测试脚本

echo "=== Docker Compose 健康检查测试 ==="

# 检查服务是否运行
echo "检查服务状态..."
docker-compose -f docker-compose-registry.yml ps

echo ""
echo "=== 详细健康检查 ==="

# 检查RabbitMQ健康状态
echo "1. RabbitMQ 健康检查:"
if docker ps --format "table {{.Names}}\t{{.Status}}" | grep slzr-rabbitmq | grep -q "healthy"; then
    echo "   ✅ Docker健康检查: 通过"
else
    echo "   ❌ Docker健康检查: 失败"
fi

# 手动测试RabbitMQ
echo "   手动测试RabbitMQ:"
if docker exec slzr-rabbitmq rabbitmq-diagnostics ping > /dev/null 2>&1; then
    echo "   ✅ rabbitmq-diagnostics ping: 成功"
else
    echo "   ❌ rabbitmq-diagnostics ping: 失败"
fi

if docker exec slzr-rabbitmq rabbitmqctl status > /dev/null 2>&1; then
    echo "   ✅ rabbitmqctl status: 成功"
else
    echo "   ❌ rabbitmqctl status: 失败"
fi

# 检查MinIO健康状态
echo ""
echo "2. MinIO 健康检查:"
if docker ps --format "table {{.Names}}\t{{.Status}}" | grep minio | grep -q "healthy"; then
    echo "   ✅ Docker健康检查: 通过"
else
    echo "   ❌ Docker健康检查: 失败"
fi

# 手动测试MinIO
echo "   手动测试MinIO:"
if curl -f http://localhost:9000/minio/health/live > /dev/null 2>&1; then
    echo "   ✅ MinIO health endpoint: 成功"
else
    echo "   ❌ MinIO health endpoint: 失败"
fi

# 检查应用服务健康状态
echo ""
echo "3. API Service 健康检查:"
if docker ps --format "table {{.Names}}\t{{.Status}}" | grep tcpserver-api | grep -q "healthy"; then
    echo "   ✅ Docker健康检查: 通过"
else
    echo "   ❌ Docker健康检查: 失败"
fi

echo ""
echo "4. WebAdmin 健康检查:"
if docker ps --format "table {{.Names}}\t{{.Status}}" | grep tcpserver-web | grep -q "healthy"; then
    echo "   ✅ Docker健康检查: 通过"
else
    echo "   ❌ Docker健康检查: 失败"
fi

# 显示详细的容器状态
echo ""
echo "=== 容器详细状态 ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 检查服务依赖
echo ""
echo "=== 服务依赖检查 ==="
echo "检查应用服务是否能连接到RabbitMQ..."

# 从api-service容器测试连接
if docker exec tcpserver-api ping -c 1 slzr-rabbitmq > /dev/null 2>&1; then
    echo "✅ API Service -> RabbitMQ: 网络连通"
else
    echo "❌ API Service -> RabbitMQ: 网络不通"
fi

# 从web-admin容器测试连接
if docker exec tcpserver-web ping -c 1 slzr-rabbitmq > /dev/null 2>&1; then
    echo "✅ WebAdmin -> RabbitMQ: 网络连通"
else
    echo "❌ WebAdmin -> RabbitMQ: 网络不通"
fi

# 测试MinIO连接
if docker exec tcpserver-api ping -c 1 minio > /dev/null 2>&1; then
    echo "✅ API Service -> MinIO: 网络连通"
else
    echo "❌ API Service -> MinIO: 网络不通"
fi

echo ""
echo "=== 测试完成 ==="

# 如果有失败的健康检查，显示日志
if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "unhealthy"; then
    echo ""
    echo "⚠️  发现不健康的容器，显示相关日志:"
    echo ""
    
    # 显示不健康容器的日志
    for container in $(docker ps --format "{{.Names}}" --filter "health=unhealthy"); do
        echo "=== $container 日志 ==="
        docker logs --tail 20 $container
        echo ""
    done
fi
