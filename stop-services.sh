#!/bin/bash

# SlzrCrossGate 项目停止脚本

echo "=== 停止 SlzrCrossGate 服务 ==="

# 停止所有服务
echo "停止Docker服务..."
docker-compose -f docker-compose-registry.yml down

echo ""
echo "=== 服务已停止 ==="
echo ""
echo "如需完全清理（包括数据卷），请运行:"
echo "docker-compose -f docker-compose-registry.yml down -v"
echo ""
echo "如需重新启动，请运行:"
echo "./start-with-minio.sh"
