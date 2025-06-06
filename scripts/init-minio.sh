#!/bin/bash

# MinIO 初始化脚本
# 等待MinIO服务启动并创建必要的bucket

echo "等待MinIO服务启动..."

# 等待MinIO API可用
until curl -f http://localhost:9000/minio/health/live > /dev/null 2>&1; do
    echo "等待MinIO启动..."
    sleep 5
done

echo "MinIO已启动，开始初始化..."

# 设置MinIO客户端别名
mc alias set myminio http://localhost:9000 ${MINIO_ROOT_USER:-minioadmin} ${MINIO_ROOT_PASSWORD:-minioadmin123}

# 创建bucket
BUCKET_NAME=${MINIO_BUCKET_NAME:-slzr-files}
if mc ls myminio/$BUCKET_NAME > /dev/null 2>&1; then
    echo "Bucket '$BUCKET_NAME' 已存在"
else
    echo "创建bucket: $BUCKET_NAME"
    mc mb myminio/$BUCKET_NAME
    echo "Bucket '$BUCKET_NAME' 创建成功"
fi

# 设置bucket策略（可选，根据需要调整）
# mc policy set public myminio/$BUCKET_NAME

echo "MinIO初始化完成"
