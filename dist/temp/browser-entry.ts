/**
 * 浏览器专用入口文件
 * 确保在IIFE模式下正确导出DDR对象和它的静态方法
 */
import DDRCore from './core';
import { DDROptions, DDRInstance } from './types';

// 为浏览器环境创建一个带静态方法的Constructor函数
function DDR(options: DDROptions): DDRInstance {
  return new DDRCore(options);
}

// 复制所有静态方法
DDR.create = function(options: DDROptions): DDRInstance {
  return DDRCore.create(options);
};

DDR.registerFormatter = function(name: string, formatter: Function): void {
  return DDRCore.registerFormatter(name, formatter);
};

// 导出
export default DDR;
