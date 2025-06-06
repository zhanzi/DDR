# MinIO 对象存储部署指南

## 概述

本项目已集成MinIO对象存储服务，支持在Docker环境中统一管理文件存储。ApiService和WebAdmin都可以使用同一个MinIO实例进行文件存储和访问。

## 配置说明

### 1. Docker Compose 配置

已在 `docker-compose-registry.yml` 中添加了MinIO服务：

```yaml
minio:
  image: devtest.pointlife365.net:5180/library/minio:latest
  container_name: slzr-minio
  command: server /data --console-address ":9001"
  volumes:
    - minio_data:/data
  environment:
    - MINIO_ROOT_USER=${MINIO_ROOT_USER:-minioadmin}
    - MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD:-minioadmin123}
  ports:
    - "9000:9000"   # MinIO API端口
    - "9001:9001"   # MinIO Console端口
  networks:
    - slzr-network
  restart: unless-stopped
```

### 2. 环境变量配置

创建 `.env` 文件（基于 `.env.example`）：

```bash
# MinIO配置
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123
MINIO_BUCKET_NAME=slzr-files

# 文件存储类型配置 (Local 或 MinIO)
FILE_STORAGE_TYPE=MinIO
```

### 3. 应用程序配置

ApiService和WebAdmin的环境变量已自动配置：

```yaml
environment:
  - FileService__DefaultStorageType=${FILE_STORAGE_TYPE:-MinIO}
  - FileService__LocalFilePath=/app/storage/files
  - FileService__MinIO__Endpoint=minio:9000
  - FileService__MinIO__AccessKey=${MINIO_ROOT_USER:-minioadmin}
  - FileService__MinIO__SecretKey=${MINIO_ROOT_PASSWORD:-minioadmin123}
  - FileService__MinIO__BucketName=${MINIO_BUCKET_NAME:-slzr-files}
```

## 部署步骤

### 1. 准备环境变量文件

```bash
# 复制示例文件
cp .env.example .env

# 根据需要修改配置
nano .env
```

### 2. 启动服务

```bash
# 启动所有服务
docker-compose -f docker-compose-registry.yml up -d

# 查看服务状态
docker-compose -f docker-compose-registry.yml ps
```

### 3. 验证MinIO服务

- **API访问**: http://localhost:9000
- **管理控制台**: http://localhost:9001
- **默认账号**: minioadmin / minioadmin123

### 4. 切换存储模式

通过修改环境变量 `FILE_STORAGE_TYPE` 可以在本地存储和MinIO存储之间切换：

```bash
# 使用MinIO存储
FILE_STORAGE_TYPE=MinIO

# 使用本地存储
FILE_STORAGE_TYPE=Local
```

## 功能特性

### 1. 自动Bucket创建

MinioFileStorage类会自动检查并创建所需的bucket，无需手动创建。

### 2. 文件路径管理

- **MinIO存储**: 文件路径前缀为 `minio://`，按年月自动分目录存储
- **本地存储**: 直接存储在指定的本地路径

### 3. 统一接口

ApiService和WebAdmin使用相同的FileService接口，可以无缝切换存储方式。

## 监控和维护

### 1. 健康检查

MinIO服务配置了健康检查：

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
  interval: 30s
  timeout: 20s
  retries: 3
```

### 2. 数据持久化

MinIO数据存储在Docker卷 `minio_data` 中，确保数据持久化。

### 3. 备份建议

- 定期备份 `minio_data` 卷
- 可以使用MinIO的复制功能进行异地备份

## 故障排除

### 1. 连接问题

检查网络配置和端口映射：

```bash
# 检查MinIO容器状态
docker logs slzr-minio

# 检查网络连接
docker exec -it tcpserver-api curl -f http://minio:9000/minio/health/live
```

### 2. 权限问题

确保MinIO的访问密钥配置正确，检查环境变量设置。

### 3. Bucket创建失败

如果自动创建bucket失败，可以手动创建：

```bash
# 进入MinIO容器
docker exec -it slzr-minio mc mb /data/slzr-files
```

## 性能优化

1. **缓存配置**: FileService已集成内存缓存，缓存时间10分钟
2. **网络优化**: 使用Docker内部网络通信，减少网络延迟
3. **存储优化**: 按年月分目录存储，便于管理和查找

## 安全建议

1. 修改默认的MinIO访问密钥
2. 在生产环境中使用HTTPS
3. 配置适当的bucket策略
4. 定期更新MinIO镜像版本
