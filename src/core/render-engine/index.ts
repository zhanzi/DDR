import { DOMRenderer } from './dom-renderer';
import { CanvasRenderer } from './canvas-renderer';
import { ColumnConfig } from '../../types';

/**
 * 渲染引擎工厂
 * 根据数据量和配置选择适合的渲染引擎
 */
export class RenderEngine {
  /**
   * 创建渲染引擎
   * @param container 容器元素
   * @param data 报表数据
   * @param columns 列配置
   * @param options 渲染选项
   * @returns 渲染引擎实例
   */
  static create(
    container: HTMLElement,
    data: any[],
    columns: ColumnConfig[],
    options: {
      mode?: 'auto' | 'dom' | 'canvas';
      rowHeight?: number;
      headerHeight?: number;
      formatters?: Record<string, Function>;
    } = {}
  ) {
    // 解构选项
    const {
      mode = 'auto',
      rowHeight = 40,
      headerHeight = 50,
      formatters = {}
    } = options;
    
    // 根据配置或数据量选择渲染模式
    let renderMode = mode;
    
    // 如果是自动模式，根据数据量决定使用DOM还是Canvas
    if (renderMode === 'auto') {
      renderMode = data.length > 5000 ? 'canvas' : 'dom';
    }
    
    // 创建相应的渲染引擎
    if (renderMode === 'canvas') {
      return new CanvasRenderer(container, data, columns, {
        rowHeight,
        headerHeight
      });
    } else {
      return new DOMRenderer(container, data, columns, formatters);
    }
  }
}
