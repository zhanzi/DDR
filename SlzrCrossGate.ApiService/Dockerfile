FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8000
EXPOSE 8001

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["SlzrCrossGate.ApiService/SlzrCrossGate.ApiService.csproj", "SlzrCrossGate.ApiService/"]
COPY ["SlzrCrossGate.Core/SlzrCrossGate.Core.csproj", "SlzrCrossGate.Core/"]
COPY ["SlzrCrossGate.Common/SlzrCrossGate.Common.csproj", "SlzrCrossGate.Common/"]
COPY ["SlzrCrossGate.ServiceDefaults/SlzrCrossGate.ServiceDefaults.csproj", "SlzrCrossGate.ServiceDefaults/"]
COPY ["SlzrCrossGate.Tcp/SlzrCrossGate.Tcp.csproj", "SlzrCrossGate.Tcp/"]
RUN dotnet restore "SlzrCrossGate.ApiService/SlzrCrossGate.ApiService.csproj"
COPY . .
WORKDIR "/src/SlzrCrossGate.ApiService"
RUN dotnet build "SlzrCrossGate.ApiService.csproj" -c Release -o /app/build

FROM build AS publish
# 解决schema.xml冲突问题 - 使用特定的发布参数指定哪些文件应该包括在发布中
RUN dotnet publish "SlzrCrossGate.ApiService.csproj" -c Release -o /app/publish  
#/p:UseAppHost=false
# 手动删除冲突的文件（如果仍然存在）
#RUN find /app/publish -name "schema.xml" -not -path "*/SlzrCrossGate.ApiService/*" -delete

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
# 创建文件存储目录
RUN mkdir -p /app/storage/files && chmod -R 755 /app/storage
ENTRYPOINT ["dotnet", "SlzrCrossGate.ApiService.dll"]