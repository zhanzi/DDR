#!/bin/bash

# RabbitMQ 初始化脚本
# 用于创建自定义用户和设置权限

echo "等待RabbitMQ服务启动..."

# 等待RabbitMQ服务可用
until docker exec slzr-rabbitmq rabbitmqctl status > /dev/null 2>&1; do
    echo "等待RabbitMQ启动..."
    sleep 5
done

echo "RabbitMQ已启动，开始初始化..."

# 创建自定义用户（如果需要）
CUSTOM_USER=${RABBITMQ_CUSTOM_USER:-slzr_user}
CUSTOM_PASS=${RABBITMQ_CUSTOM_PASS:-slzr_pass123}

echo "创建用户: $CUSTOM_USER"
docker exec slzr-rabbitmq rabbitmqctl add_user $CUSTOM_USER $CUSTOM_PASS || echo "用户可能已存在"

echo "设置用户标签为管理员"
docker exec slzr-rabbitmq rabbitmqctl set_user_tags $CUSTOM_USER administrator

echo "设置用户权限"
docker exec slzr-rabbitmq rabbitmqctl set_permissions -p / $CUSTOM_USER ".*" ".*" ".*"

echo "列出所有用户:"
docker exec slzr-rabbitmq rabbitmqctl list_users

echo "RabbitMQ初始化完成"
echo "管理界面: http://localhost:15672"
echo "默认用户: ${RABBITMQ_USER:-guest} / ${RABBITMQ_PASS:-guest}"
echo "自定义用户: $CUSTOM_USER / $CUSTOM_PASS"
