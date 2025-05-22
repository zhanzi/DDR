# Dockerfile 调试脚本

# 使用此脚本测试前端构建输出目录结构
$ErrorActionPreference = "Stop"

# 检查是否为管理员权限
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Warning "建议以管理员权限运行此脚本以避免潜在的权限问题"
}

# 确保在项目根目录执行
if (-not (Test-Path "SlzrCrossGate.WebAdmin" -PathType Container)) {
    Write-Error "错误：请在SlzrCrossGate项目根目录运行此脚本"
    exit 1
}

Write-Host "===== 开始检测前端构建输出 =====" -ForegroundColor Magenta

# 创建一个简单的Dockerfile来测试前端构建输出
$testDockerfile = @"
# 测试前端构建输出的Dockerfile
FROM devtest.pointlife365.net:5180/library/node:18-alpine
WORKDIR /app
COPY ["SlzrCrossGate.WebAdmin/ClientApp/package*.json", "./"]
RUN npm ci
COPY ["SlzrCrossGate.WebAdmin/ClientApp/", "./"]
# 构建前端
RUN npm run build
# 列出所有文件和目录
RUN ls -la
RUN find / -name "wwwroot" 2>/dev/null || echo "No wwwroot directory found"
RUN find / -name "build" 2>/dev/null || echo "No build directory found"
RUN find / -name "dist" 2>/dev/null || echo "No dist directory found"
# 保持容器运行
CMD ["sh", "-c", "while true; do sleep 1000; done"]
"@

# 创建临时Dockerfile
$testDockerfile | Out-File -FilePath "frontend-test.Dockerfile" -Encoding utf8

# 构建测试镜像
Write-Host "正在构建测试镜像..." -ForegroundColor Cyan
docker build -t frontend-build-test -f frontend-test.Dockerfile .

if ($LASTEXITCODE -ne 0) {
    Write-Error "测试镜像构建失败"
    exit 1
}

# 创建并运行容器来查看结构
Write-Host "创建容器查看构建输出结构..." -ForegroundColor Cyan
docker run --name frontend-test -d frontend-build-test

# 获取构建输出信息
Write-Host "`n前端构建输出结构:" -ForegroundColor Green
docker exec frontend-test ls -la /app

Write-Host "`n查找wwwroot目录:" -ForegroundColor Green
docker exec frontend-test find /app -name "wwwroot" 2>/dev/null || echo "未找到wwwroot目录"

Write-Host "`n查找build目录:" -ForegroundColor Green
docker exec frontend-test find /app -name "build" 2>/dev/null || echo "未找到build目录"

Write-Host "`n查找dist目录:" -ForegroundColor Green
docker exec frontend-test find /app -name "dist" 2>/dev/null || echo "未找到dist目录"

# 清理
Write-Host "`n清理资源..." -ForegroundColor Yellow
docker stop frontend-test
docker rm frontend-test
docker rmi frontend-build-test
Remove-Item -Path "frontend-test.Dockerfile" -Force

Write-Host "`n根据输出结果修改Dockerfile中的前端构建输出路径" -ForegroundColor Magenta
Write-Host "检测完成！" -ForegroundColor Green
