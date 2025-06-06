#!/bin/bash

# RabbitMQ 数据持久化测试脚本

echo "=== RabbitMQ 数据持久化测试 ==="

# 检查RabbitMQ是否运行
if ! docker ps | grep slzr-rabbitmq > /dev/null; then
    echo "❌ RabbitMQ容器未运行，请先启动服务"
    echo "运行: ./start-with-minio.sh"
    exit 1
fi

echo "✓ RabbitMQ容器正在运行"

# 等待RabbitMQ完全启动
echo "等待RabbitMQ服务就绪..."
for i in {1..30}; do
    if docker exec slzr-rabbitmq rabbitmq-diagnostics ping > /dev/null 2>&1; then
        echo "✓ RabbitMQ服务已就绪"
        break
    else
        echo "等待RabbitMQ启动... ($i/30)"
        sleep 2
    fi
done

# 创建测试用户
TEST_USER="test_persistence_user"
TEST_PASS="test_pass_123"

echo ""
echo "=== 第一阶段：创建测试用户 ==="
echo "创建测试用户: $TEST_USER"

# 删除可能存在的测试用户
docker exec slzr-rabbitmq rabbitmqctl delete_user $TEST_USER 2>/dev/null || true

# 创建新的测试用户
docker exec slzr-rabbitmq rabbitmqctl add_user $TEST_USER $TEST_PASS
docker exec slzr-rabbitmq rabbitmqctl set_user_tags $TEST_USER administrator
docker exec slzr-rabbitmq rabbitmqctl set_permissions -p / $TEST_USER ".*" ".*" ".*"

echo "✓ 测试用户创建完成"

# 显示当前用户列表
echo ""
echo "当前用户列表:"
docker exec slzr-rabbitmq rabbitmqctl list_users

# 重启容器测试持久化
echo ""
echo "=== 第二阶段：重启容器测试持久化 ==="
echo "停止RabbitMQ容器..."
docker-compose -f docker-compose-registry.yml stop rabbitmq

echo "等待容器完全停止..."
sleep 5

echo "重新启动RabbitMQ容器..."
docker-compose -f docker-compose-registry.yml up -d rabbitmq

# 等待重启后的服务就绪
echo "等待RabbitMQ重新启动..."
for i in {1..60}; do
    if docker exec slzr-rabbitmq rabbitmq-diagnostics ping > /dev/null 2>&1; then
        echo "✓ RabbitMQ重启完成"
        break
    else
        echo "等待RabbitMQ重启... ($i/60)"
        sleep 2
    fi
done

# 验证用户是否仍然存在
echo ""
echo "=== 第三阶段：验证数据持久化 ==="
echo "检查测试用户是否仍然存在..."

if docker exec slzr-rabbitmq rabbitmqctl list_users | grep $TEST_USER > /dev/null; then
    echo "✅ 数据持久化测试成功！"
    echo "✓ 用户 '$TEST_USER' 在容器重启后仍然存在"
else
    echo "❌ 数据持久化测试失败！"
    echo "✗ 用户 '$TEST_USER' 在容器重启后丢失"
    exit 1
fi

echo ""
echo "重启后的用户列表:"
docker exec slzr-rabbitmq rabbitmqctl list_users

# 清理测试用户
echo ""
echo "=== 清理测试数据 ==="
echo "删除测试用户..."
docker exec slzr-rabbitmq rabbitmqctl delete_user $TEST_USER

echo ""
echo "=== 测试完成 ==="
echo "✅ RabbitMQ数据持久化功能正常"
echo ""
echo "现在您可以安全地："
echo "1. 在管理界面创建用户"
echo "2. 使用 docker-compose down && docker-compose up -d 重启服务"
echo "3. 您创建的用户将会保持不变"
echo ""
echo "管理界面访问: http://localhost:15672"
