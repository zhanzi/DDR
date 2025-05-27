# 阶段 1: 构建前端
FROM devtest.pointlife365.net:5180/library/node:18-alpine AS frontend-build
WORKDIR /app
# 确保package.json文件路径正确
COPY ["SlzrCrossGate.WebAdmin/ClientApp/package*.json", "./"]
RUN npm ci
COPY ["SlzrCrossGate.WebAdmin/ClientApp/", "./"]
# 设置环境变量控制输出目录
ENV NODE_ENV=production
# 添加调试信息
RUN npm run build && echo "前端构建完成" && ls -la

# 阶段 2: 构建后端
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["SlzrCrossGate.WebAdmin/SlzrCrossGate.WebAdmin.csproj", "SlzrCrossGate.WebAdmin/"]
COPY ["SlzrCrossGate.Core/SlzrCrossGate.Core.csproj", "SlzrCrossGate.Core/"]
COPY ["SlzrCrossGate.Common/SlzrCrossGate.Common.csproj", "SlzrCrossGate.Common/"]
COPY ["SlzrCrossGate.ServiceDefaults/SlzrCrossGate.ServiceDefaults.csproj", "SlzrCrossGate.ServiceDefaults/"]
RUN dotnet restore "SlzrCrossGate.WebAdmin/SlzrCrossGate.WebAdmin.csproj"
COPY . .
WORKDIR "/src/SlzrCrossGate.WebAdmin"
RUN dotnet build "SlzrCrossGate.WebAdmin.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "SlzrCrossGate.WebAdmin.csproj" -c Release -o /app/publish

# 阶段 3: 最终镜像
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
EXPOSE 7296
COPY --from=publish /app/publish .
# 创建wwwroot目录（如果不存在）
RUN mkdir -p ./wwwroot
# 复制前端构建结果 - 现在使用标准的dist目录
COPY --from=frontend-build /app/dist/ ./wwwroot/
# 创建文件存储目录
RUN mkdir -p /app/storage/files && chmod -R 755 /app/storage
# 创建数据保护密钥目录并设置权限
RUN mkdir -p /app/Keys && chmod -R 755 /app/Keys

# 定义持久卷
VOLUME ["/app/Keys"]
ENTRYPOINT ["dotnet", "SlzrCrossGate.WebAdmin.dll"]