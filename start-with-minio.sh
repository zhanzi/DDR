#!/bin/bash

# SlzrCrossGate 项目启动脚本 - 包含MinIO对象存储

echo "=== SlzrCrossGate 项目启动 (包含MinIO) ==="

# 检查环境变量文件
if [ ! -f ".env" ]; then
    echo "创建环境变量文件..."
    cp .env.example .env
    echo "请编辑 .env 文件配置您的环境变量"
    echo "默认配置已设置为使用MinIO存储"
fi

# 显示当前配置
echo ""
echo "当前配置:"
echo "- 文件存储类型: ${FILE_STORAGE_TYPE:-MinIO}"
echo "- MinIO用户: ${MINIO_ROOT_USER:-minioadmin}"
echo "- MinIO Bucket: ${MINIO_BUCKET_NAME:-slzr-files}"
echo ""

# 启动服务
echo "启动Docker服务..."
docker-compose -f docker-compose-registry.yml up -d

# 等待服务启动
echo "等待服务启动..."
sleep 10

# 检查服务状态
echo ""
echo "=== 服务状态 ==="
docker-compose -f docker-compose-registry.yml ps

# 显示访问信息
echo ""
echo "=== 访问信息 ==="
echo "MinIO API: http://localhost:9000"
echo "MinIO 控制台: http://localhost:9001"
echo "默认账号: minioadmin / minioadmin123"
echo ""
echo "RabbitMQ 管理界面: http://localhost:15672"
echo "默认账号: guest / guest"
echo ""
echo "应用访问: http://localhost:18822"
echo ""

# 检查服务健康状态
echo "检查服务状态..."

# 检查RabbitMQ
echo "检查RabbitMQ服务..."
for i in {1..30}; do
    if docker exec slzr-rabbitmq rabbitmq-diagnostics ping > /dev/null 2>&1; then
        echo "✓ RabbitMQ服务已就绪"
        break
    else
        echo "等待RabbitMQ启动... ($i/30)"
        sleep 2
    fi
done

# 检查MinIO
echo "检查MinIO服务..."
for i in {1..30}; do
    if curl -f http://localhost:9000/minio/health/live > /dev/null 2>&1; then
        echo "✓ MinIO服务已就绪"
        break
    else
        echo "等待MinIO启动... ($i/30)"
        sleep 2
    fi
done

echo ""
echo "=== 启动完成 ==="
echo "您可以通过以下方式管理服务:"
echo "- 查看日志: docker-compose -f docker-compose-registry.yml logs -f"
echo "- 停止服务: docker-compose -f docker-compose-registry.yml down"
echo "- 重启服务: docker-compose -f docker-compose-registry.yml restart"
