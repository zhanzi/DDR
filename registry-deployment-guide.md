# SlzrCrossGate 项目使用私有镜像仓库的部署指南

## 1. 前置条件

在本指南中，我们假设您已经：
- 在本地Docker Desktop上安装并启动了Docker
- 配置了一个本地私有Docker镜像仓库，运行在localhost:5180端口
- 设置了私有仓库的认证信息(用户名: slzr, 密码: slzr.1234)
- 遇到了Docker镜像下载超时的问题

## 2. 构建和推送镜像到私有仓库

使用本地构建的方式，然后将镜像推送到本地私有仓库，可以避免从互联网下载基础镜像的超时问题。

### 2.1 登录到私有仓库

```bash
# 登录到私有仓库
docker login devtest.pointlife365.net:5180 -u slzr -p slzr.12345
#更安全的方式登录，防止密码出现在历史命令中
cat registry-password.txt | docker login devtest.pointlife365.net:5180 -u slzr --password-stdin
```

### 2.2 构建ApiService镜像

```bash
# 进入项目根目录
cd 你的项目路径/SlzrCrossGate

# 构建ApiService镜像
docker build -t devtest.pointlife365.net:5180/slzr-api-service:latest -f SlzrCrossGate.ApiService/Dockerfile .

# 推送到私有仓库
docker push devtest.pointlife365.net:5180/slzr-api-service:latest
```

### 2.3 构建WebAdmin镜像

```bash
# 构建WebAdmin镜像
docker build -t devtest.pointlife365.net:5180/slzr-web-admin:latest -f SlzrCrossGate.WebAdmin/Dockerfile .

# 推送到私有仓库
docker push devtest.pointlife365.net:5180/slzr-web-admin:latest
```

## 3. 使用私有仓库镜像启动应用

我们修改了docker-compose文件，使其使用私有仓库中的镜像，而不是每次都重新构建。

### 3.1 使用修改后的docker-compose-registry.yml文件

```bash
# 创建必要的目录
mkdir -p nginx/conf.d nginx/ssl nginx/logs

# 创建Nginx配置文件
cat > nginx/conf.d/default.conf << EOF
server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://web-admin:7296;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    location /api-service/ {
        proxy_pass http://api-service:5000/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# 启动应用
docker-compose -f docker-compose-registry.yml up -d
```

### 3.2 使用环境变量设置敏感信息

```bash
# 创建环境变量文件
cat > .env << EOF
MYSQL_ROOT_PASSWORD=安全密码123
RABBITMQ_USER=admin
RABBITMQ_PASS=安全密码456
JWT_KEY=至少32字符的安全密钥12345678901234567890
EOF

# 启动应用并使用环境变量文件
docker-compose -f docker-compose-registry.yml --env-file .env up -d
```

## 4. 应用访问

应用启动后，可以通过以下地址访问：

- WebAdmin界面: http://localhost:80
- API服务: http://localhost:5000

## 5. 镜像更新流程

当应用代码有更新时，您需要重新构建镜像并推送到私有仓库：

```bash
# 重新构建ApiService并推送
docker build -t devtest.pointlife365.net:5180/slzr-api-service:latest -f SlzrCrossGate.ApiService/Dockerfile .
docker push devtest.pointlife365.net:5180/slzr-api-service:latest

# 重新构建WebAdmin并推送
docker build -t devtest.pointlife365.net:5180/slzr-web-admin:latest -f SlzrCrossGate.WebAdmin/Dockerfile .
docker push devtest.pointlife365.net:5180/slzr-web-admin:latest

# 更新运行中的容器
docker-compose -f docker-compose-registry.yml pull
docker-compose -f docker-compose-registry.yml up -d
```

## 6. 常见问题

### 6.1 访问私有仓库的证书问题

如果遇到类似"x509: certificate signed by unknown authority"的错误，这是因为本地私有仓库使用了自签名证书。解决方法：

```bash
# 创建或编辑Docker守护进程配置文件
cat > /etc/docker/daemon.json << EOF
{
  "insecure-registries": ["localhost:5180"]
}
EOF

# 重启Docker服务
systemctl restart docker
```

### 6.2 Docker登录问题

如果登录私有仓库时出现问题，可以检查认证文件：

```bash
# 检查认证文件格式
cat auth/htpasswd

# 如果需要，重新生成认证文件
docker run --entrypoint htpasswd httpd:2 -Bbn slzr 'slzr.1234' > auth/htpasswd
```

### 6.3 Docker Compose找不到镜像

如果启动时提示找不到镜像，请确认：

1. 镜像已经成功推送到私有仓库
2. docker-compose.yml文件中的镜像名称正确
3. 已经登录到私有仓库

```bash
# 检查镜像是否存在于私有仓库
curl -u slzr:slzr.1234 http://devtest.pointlife365.net:5180/v2/_catalog
curl -u slzr:slzr.1234 http://devtest.pointlife365.net:5180/v2/slzr-api-service/tags/list
curl -u slzr:slzr.1234 http://devtest.pointlife365.net:5180/v2/slzr-web-admin/tags/list
```

## 7. 备注

- 本方案适用于Docker Desktop环境，也可以在Linux服务器上使用
- 在生产环境部署时，请确保使用更强的密码
- 考虑添加健康检查，以确保应用正常运行
- 定期备份MySQL数据和应用数据
