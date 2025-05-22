#!/bin/bash
# SlzrCrossGate 项目分步构建与推送脚本

# 定义变量
REGISTRY="devtest.pointlife365.net:5180"
PROJECT="slzr"
API_IMAGE="tcpserver-api"
WEB_IMAGE="tcpserver-web"
TAG="latest"
VERSION=${1:-$(date +%Y%m%d-%H%M%S)}  # 默认使用时间戳作为版本号

# 确保脚本在项目根目录执行
if [ ! -d "SlzrCrossGate.ApiService" ] || [ ! -d "SlzrCrossGate.WebAdmin" ]; then
  echo "错误：请在SlzrCrossGate项目根目录运行此脚本"
  exit 1
fi

# 创建 .dockerignore 文件（如果不存在）
if [ ! -f ".dockerignore" ]; then
  echo "创建 .dockerignore 文件..."
  cat > ".dockerignore" << EOF
# 忽略构建输出和临时文件
**/bin/
**/obj/
**/out/
**/node_modules/
**/npm-debug.log
**/.git/
**/.vs/
**/.vscode/
**/*.md
**/*.user

# 不忽略特定的项目文件
!**/SlzrCrossGate.*/bin/
!**/SlzrCrossGate.*/obj/
EOF
fi

# 登录到私有仓库
echo "正在登录到私有镜像仓库 $REGISTRY..."
docker login $REGISTRY -u slzr -p slzr.12345

if [ $? -ne 0 ]; then
  echo "登录失败，请检查仓库地址和认证信息"
  exit 1
fi

echo "登录成功！"

# 函数：带有重试功能的推送
push_with_retry() {
  local image=$1
  local max_retries=${2:-3}
  local retry_delay=${3:-5}
  local retry_count=0
  local success=false
  
  while [ "$success" = false ] && [ $retry_count -lt $max_retries ]; do
    echo "正在推送镜像 $image... (尝试 $((retry_count+1))/$max_retries)"
    docker push $image
    
    if [ $? -eq 0 ]; then
      success=true
      echo "镜像 $image 推送成功！"
    else
      retry_count=$((retry_count+1))
      if [ $retry_count -lt $max_retries ]; then
        echo "推送失败，${retry_delay}秒后重试..."
        sleep $retry_delay
      fi
    fi
  done
  
  return $([ "$success" = true ] && echo 0 || echo 1)
}

# 构建和推送 API 服务镜像
echo "===== 开始 ApiService 镜像构建 ====="
docker build -t $REGISTRY/$PROJECT/$API_IMAGE:$TAG -t $REGISTRY/$PROJECT/$API_IMAGE:$VERSION -f SlzrCrossGate.ApiService/Dockerfile .

if [ $? -ne 0 ]; then
  echo "ApiService 镜像构建失败"
  exit 1
fi

echo "正在推送 ApiService 镜像到 $REGISTRY..."
# 单独推送每个标签，提高成功率
push_with_retry $REGISTRY/$PROJECT/$API_IMAGE:$TAG
tag_success=$?
push_with_retry $REGISTRY/$PROJECT/$API_IMAGE:$VERSION
version_success=$?

if [ $tag_success -eq 0 ] || [ $version_success -eq 0 ]; then
  echo "ApiService 镜像至少有一个标签推送成功！"
else
  echo "警告: ApiService 镜像推送全部失败，但将继续尝试构建和推送WebAdmin镜像"
fi

# 构建和推送 WebAdmin 服务镜像
echo "===== 开始 WebAdmin 镜像构建 ====="
docker build -t $REGISTRY/$PROJECT/$WEB_IMAGE:$TAG -t $REGISTRY/$PROJECT/$WEB_IMAGE:$VERSION -f SlzrCrossGate.WebAdmin/Dockerfile .

if [ $? -ne 0 ]; then
  echo "WebAdmin 镜像构建失败"
  exit 1
fi

echo "正在推送 WebAdmin 镜像到 $REGISTRY..."
push_with_retry $REGISTRY/$PROJECT/$WEB_IMAGE:$TAG
tag_success=$?
push_with_retry $REGISTRY/$PROJECT/$WEB_IMAGE:$VERSION
version_success=$?

if [ $tag_success -eq 0 ] || [ $version_success -eq 0 ]; then
  echo "WebAdmin 镜像至少有一个标签推送成功！"
else
  echo "警告: WebAdmin 镜像推送全部失败"
  exit 1
fi

echo "===== 镜像推送完成 ====="
echo "版本标签: $VERSION"
echo "最新标签: latest"
echo "拉取命令:"
echo "  docker pull $REGISTRY/$PROJECT/$API_IMAGE:$VERSION"
echo "  docker pull $REGISTRY/$PROJECT/$WEB_IMAGE:$VERSION"
echo ""
echo "您现在可以使用 docker-compose -f docker-compose-registry.yml up -d 启动应用"
echo "可以使用 docker-compose -f docker-compose-registry.yml down 停止应用"
