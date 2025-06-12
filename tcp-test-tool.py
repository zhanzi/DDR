#!/usr/bin/env python3
"""
TCP连接测试工具
用于测试ApiService的TCP服务连接和数据传输
"""

import socket
import time
import sys
import argparse
from datetime import datetime

def create_iso8583_test_message():
    """创建一个简单的ISO 8583测试消息"""
    # 简单的签到消息格式 (0800)
    # 报文头: 6000000000 (5字节)
    # 消息类型: 0800 (2字节)
    # 其他字段...
    
    # 这里创建一个最简单的测试消息
    header = bytes([0x60, 0x00, 0x00, 0x00, 0x00])  # TPDU头
    msg_type = b'\x08\x00'  # 消息类型 0800 (签到)
    
    # 简单的消息体（实际应该包含更多字段）
    body = header + msg_type + b'\x00' * 10  # 添加一些填充数据
    
    # 计算长度并添加长度头
    length = len(body)
    length_header = bytes([length >> 8, length & 0xFF])
    
    return length_header + body

def test_tcp_connection(host, port, send_data=True, keep_alive=False):
    """测试TCP连接"""
    print(f"[{datetime.now()}] 开始测试TCP连接: {host}:{port}")
    
    try:
        # 创建socket
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(10)  # 10秒超时
        
        print(f"[{datetime.now()}] 正在连接...")
        
        # 连接
        start_time = time.time()
        sock.connect((host, port))
        connect_time = time.time() - start_time
        
        print(f"[{datetime.now()}] 连接成功! 耗时: {connect_time:.3f}秒")
        
        if send_data:
            # 发送测试数据
            test_message = create_iso8583_test_message()
            print(f"[{datetime.now()}] 发送测试消息 ({len(test_message)} 字节): {test_message.hex()}")
            
            sock.send(test_message)
            print(f"[{datetime.now()}] 消息发送完成")
            
            # 尝试接收响应
            try:
                sock.settimeout(5)  # 5秒接收超时
                response = sock.recv(1024)
                if response:
                    print(f"[{datetime.now()}] 收到响应 ({len(response)} 字节): {response.hex()}")
                else:
                    print(f"[{datetime.now()}] 未收到响应")
            except socket.timeout:
                print(f"[{datetime.now()}] 接收响应超时")
        
        if keep_alive:
            print(f"[{datetime.now()}] 保持连接30秒...")
            time.sleep(30)
        
        print(f"[{datetime.now()}] 关闭连接")
        sock.close()
        
        return True
        
    except socket.timeout:
        print(f"[{datetime.now()}] 连接超时")
        return False
    except ConnectionRefusedError:
        print(f"[{datetime.now()}] 连接被拒绝")
        return False
    except Exception as e:
        print(f"[{datetime.now()}] 连接错误: {e}")
        return False

def test_raw_connection(host, port):
    """测试原始连接（不发送数据）"""
    print(f"[{datetime.now()}] 开始测试原始连接: {host}:{port}")
    
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(10)
        
        print(f"[{datetime.now()}] 正在连接...")
        start_time = time.time()
        sock.connect((host, port))
        connect_time = time.time() - start_time
        
        print(f"[{datetime.now()}] 连接成功! 耗时: {connect_time:.3f}秒")
        print(f"[{datetime.now()}] 保持连接10秒不发送任何数据...")
        
        time.sleep(10)
        
        print(f"[{datetime.now()}] 关闭连接")
        sock.close()
        
        return True
        
    except Exception as e:
        print(f"[{datetime.now()}] 连接错误: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description='TCP连接测试工具')
    parser.add_argument('host', help='服务器地址')
    parser.add_argument('port', type=int, help='端口号')
    parser.add_argument('--no-data', action='store_true', help='不发送数据，只测试连接')
    parser.add_argument('--keep-alive', action='store_true', help='保持连接')
    parser.add_argument('--raw', action='store_true', help='原始连接测试（不发送任何数据）')
    parser.add_argument('--repeat', type=int, default=1, help='重复测试次数')
    
    args = parser.parse_args()
    
    success_count = 0
    
    for i in range(args.repeat):
        if args.repeat > 1:
            print(f"\n=== 第 {i+1}/{args.repeat} 次测试 ===")
        
        if args.raw:
            success = test_raw_connection(args.host, args.port)
        else:
            success = test_tcp_connection(
                args.host, 
                args.port, 
                send_data=not args.no_data,
                keep_alive=args.keep_alive
            )
        
        if success:
            success_count += 1
        
        if i < args.repeat - 1:
            time.sleep(1)  # 测试间隔
    
    print(f"\n=== 测试结果 ===")
    print(f"成功: {success_count}/{args.repeat}")
    print(f"成功率: {success_count/args.repeat*100:.1f}%")

if __name__ == "__main__":
    main()
