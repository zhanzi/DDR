#!/bin/bash

# TCP服务诊断脚本
# 用于诊断ApiService在CentOS7上的TCP服务问题

echo "=== TCP服务诊断脚本 ==="
echo "时间: $(date)"
echo

# 1. 检查Docker容器状态
echo "1. 检查Docker容器状态"
echo "========================"
docker ps | grep -E "(tcpserver-api|nginx)"
echo

# 2. 检查端口监听状态
echo "2. 检查端口监听状态"
echo "==================="
echo "检查8822端口 (Nginx TCP代理):"
netstat -tlnp | grep :8822 || echo "端口8822未监听"
echo
echo "检查容器内部端口:"
docker exec tcpserver-api netstat -tlnp | grep -E ":(8000|8001)" || echo "容器内部端口未监听"
echo

# 3. 检查防火墙状态
echo "3. 检查防火墙状态"
echo "================"
if command -v firewall-cmd &> /dev/null; then
    echo "防火墙状态:"
    firewall-cmd --state
    echo "开放的端口:"
    firewall-cmd --list-ports
    echo "检查8822端口是否开放:"
    firewall-cmd --query-port=8822/tcp && echo "8822/tcp 已开放" || echo "8822/tcp 未开放"
else
    echo "firewall-cmd 未找到，检查iptables:"
    iptables -L -n | grep 8822 || echo "未找到8822端口规则"
fi
echo

# 4. 检查Docker网络
echo "4. 检查Docker网络"
echo "================"
echo "Docker网络列表:"
docker network ls
echo
echo "检查slzr-network网络:"
docker network inspect slzr-network | grep -A 10 -B 5 "tcpserver-api\|nginx" || echo "网络信息获取失败"
echo

# 5. 检查ApiService日志
echo "5. 检查ApiService日志 (最近50行)"
echo "==============================="
docker logs tcpserver-api --tail 50 | grep -E "(New connection|Connection closed|Error|Exception|listening|Started)"
echo

# 6. 检查Nginx日志
echo "6. 检查Nginx日志"
echo "==============="
echo "Nginx错误日志:"
docker exec nginx tail -20 /var/log/nginx/error.log 2>/dev/null || echo "无法读取Nginx错误日志"
echo
echo "Nginx TCP代理日志:"
docker exec nginx tail -20 /var/log/nginx/stream_error.log 2>/dev/null || echo "无法读取Nginx TCP代理错误日志"
echo
echo "Nginx TCP代理访问日志:"
docker exec nginx tail -10 /var/log/nginx/stream_access.log 2>/dev/null || echo "无法读取Nginx TCP代理访问日志"
echo

# 7. 测试本地连接
echo "7. 测试本地连接"
echo "=============="
echo "测试连接到8822端口:"
timeout 5 telnet localhost 8822 < /dev/null && echo "连接成功" || echo "连接失败"
echo

# 8. 检查系统资源
echo "8. 检查系统资源"
echo "=============="
echo "内存使用:"
free -h
echo
echo "CPU负载:"
uptime
echo
echo "磁盘空间:"
df -h | grep -E "(/$|/var)"
echo

# 9. 检查Docker Compose配置
echo "9. 检查Docker Compose配置"
echo "========================"
echo "检查端口映射:"
docker-compose -f docker-compose-registry.yml ps
echo

# 10. 网络连通性测试
echo "10. 网络连通性测试"
echo "=================="
echo "测试容器间网络连通性:"
docker exec nginx ping -c 3 api-service 2>/dev/null || echo "无法ping通api-service"
echo

# 11. 检查ApiService健康状态
echo "11. 检查ApiService健康状态"
echo "========================="
echo "HTTP健康检查:"
curl -s http://localhost:5000/health | head -100 || echo "HTTP健康检查失败"
echo

# 12. 提供诊断建议
echo "12. 诊断建议"
echo "==========="
echo "如果发现问题，请尝试以下步骤:"
echo "1. 检查防火墙是否阻止了8822端口"
echo "2. 重启Docker容器: docker-compose -f docker-compose-registry.yml restart"
echo "3. 查看详细日志: docker logs tcpserver-api -f"
echo "4. 使用测试工具: python3 tcp-test-tool.py localhost 8822"
echo "5. 检查客户端发送的数据格式是否正确"
echo

echo "=== 诊断完成 ==="
