# 分步构建与推送脚本 - PowerShell版本

# 定义变量
$REGISTRY = "devtest.pointlife365.net:5180"
$PROJECT = "slzr"
$API_IMAGE = "tcpserver-api"
$WEB_IMAGE = "tcpserver-web"
$TAG = "latest"
$VERSION = Get-Date -Format "yyyyMMdd-HHmmss"

# 确保在项目根目录执行
$currentDir = Get-Location
if (-not (Test-Path "SlzrCrossGate.ApiService" -PathType Container) -or -not (Test-Path "SlzrCrossGate.WebAdmin" -PathType Container)) {
    Write-Error "错误：请在SlzrCrossGate项目根目录运行此脚本"
    exit 1
}

# 创建 .dockerignore 文件（如果不存在）
if (-not (Test-Path ".dockerignore")) {
    Write-Host "创建 .dockerignore 文件..."
    @"
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
"@ | Out-File -FilePath ".dockerignore" -Encoding utf8
}

# 登录到私有仓库
Write-Host "正在登录到私有镜像仓库 $REGISTRY..." -ForegroundColor Cyan
docker login $REGISTRY -u slzr -p "slzr.12345"

if ($LASTEXITCODE -ne 0) {
    Write-Error "登录失败，请检查仓库地址和认证信息"
    exit 1
}

Write-Host "登录成功！" -ForegroundColor Green

# 函数：带有重试功能的推送
function Push-ImageWithRetry {
    param (
        [string]$Image,
        [int]$MaxRetries = 3,
        [int]$RetryDelay = 5
    )
    
    $retryCount = 0
    $success = $false
    
    while (-not $success -and $retryCount -lt $MaxRetries) {
        Write-Host "正在推送镜像 $Image... (尝试 $($retryCount+1)/$MaxRetries)" -ForegroundColor Cyan
        docker push $Image
        
        if ($LASTEXITCODE -eq 0) {
            $success = $true
            Write-Host "镜像 $Image 推送成功！" -ForegroundColor Green
        }
        else {
            $retryCount++
            if ($retryCount -lt $MaxRetries) {
                Write-Host "推送失败，${RetryDelay}秒后重试..." -ForegroundColor Yellow
                Start-Sleep -Seconds $RetryDelay
            }
        }
    }
    
    return $success
}

# 构建和推送 API 服务镜像
Write-Host "===== 开始 ApiService 镜像构建 =====" -ForegroundColor Magenta
Write-Host "构建命令: docker build -t $REGISTRY/$PROJECT/$API_IMAGE:$TAG -t $REGISTRY/$PROJECT/$API_IMAGE:$VERSION -f SlzrCrossGate.ApiService/Dockerfile ." -ForegroundColor Gray
docker build -t "$REGISTRY/$PROJECT/$API_IMAGE`:$TAG" -t "$REGISTRY/$PROJECT/$API_IMAGE`:$VERSION" -f SlzrCrossGate.ApiService/Dockerfile .

if ($LASTEXITCODE -ne 0) {
    Write-Error "ApiService 镜像构建失败"
    exit 1
}

Write-Host "正在推送 ApiService 镜像到 $REGISTRY..." -ForegroundColor Cyan
# 单独推送每个标签，提高成功率
$tagSuccess = Push-ImageWithRetry -Image "$REGISTRY/$PROJECT/$API_IMAGE`:$TAG"
$versionSuccess = Push-ImageWithRetry -Image "$REGISTRY/$PROJECT/$API_IMAGE`:$VERSION"

if ($tagSuccess -or $versionSuccess) {
    Write-Host "ApiService 镜像至少有一个标签推送成功！" -ForegroundColor Green
}
else {
    Write-Host "警告: ApiService 镜像推送全部失败，但将继续尝试构建和推送WebAdmin镜像" -ForegroundColor Yellow
}

# 构建和推送 WebAdmin 服务镜像
Write-Host "===== 开始 WebAdmin 镜像构建 =====" -ForegroundColor Magenta
Write-Host "构建命令: docker build -t $REGISTRY/$PROJECT/$WEB_IMAGE:$TAG -t $REGISTRY/$PROJECT/$WEB_IMAGE:$VERSION -f SlzrCrossGate.WebAdmin/Dockerfile ." -ForegroundColor Gray
docker build -t "$REGISTRY/$PROJECT/$WEB_IMAGE`:$TAG" -t "$REGISTRY/$PROJECT/$WEB_IMAGE`:$VERSION" -f SlzrCrossGate.WebAdmin/Dockerfile .

if ($LASTEXITCODE -ne 0) {
    Write-Error "WebAdmin 镜像构建失败"
    exit 1
}

Write-Host "正在推送 WebAdmin 镜像到 $REGISTRY..." -ForegroundColor Cyan
$tagSuccess = Push-ImageWithRetry -Image "$REGISTRY/$PROJECT/$WEB_IMAGE`:$TAG"
$versionSuccess = Push-ImageWithRetry -Image "$REGISTRY/$PROJECT/$WEB_IMAGE`:$VERSION"

if ($tagSuccess -or $versionSuccess) {
    Write-Host "WebAdmin 镜像至少有一个标签推送成功！" -ForegroundColor Green
}
else {
    Write-Host "警告: WebAdmin 镜像推送全部失败" -ForegroundColor Red
    exit 1
}

Write-Host "===== 镜像推送完成 =====" -ForegroundColor Green
Write-Host "版本标签: $VERSION" -ForegroundColor Yellow
Write-Host "最新标签: latest" -ForegroundColor Yellow
Write-Host "拉取命令:" -ForegroundColor Cyan
Write-Host "  docker pull $REGISTRY/$PROJECT/$API_IMAGE`:$VERSION" -ForegroundColor White
Write-Host "  docker pull $REGISTRY/$PROJECT/$WEB_IMAGE`:$VERSION" -ForegroundColor White
Write-Host ""
Write-Host "您现在可以使用 docker-compose -f docker-compose-registry.yml up -d 启动应用" -ForegroundColor Green
