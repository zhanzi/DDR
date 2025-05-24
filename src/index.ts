// 导出主入口文件
import DDRCore from './core';
import { DDRInstance, DDROptions, DDRConfig, DDREvent, ExportOptions } from './types';
// 导入导出器，避免代码拆分
import './core/exporter';

// 导出类型定义
export type {
  DDRInstance,
  DDROptions,
  DDRConfig,
  DDREvent,
  ExportOptions
};

// 导出DDR核心类和默认实例
export { DDRCore as DDR };
export default DDRCore;
