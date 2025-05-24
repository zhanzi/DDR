import { DOMRenderer } from './dom-renderer';
import { CanvasRenderer } from './canvas-renderer';
import { ColumnConfig } from '../../types';
/**
 * 渲染引擎工厂
 * 根据数据量和配置选择适合的渲染引擎
 */
export declare class RenderEngine {
    /**
     * 创建渲染引擎
     * @param container 容器元素
     * @param data 报表数据
     * @param columns 列配置
     * @param options 渲染选项
     * @returns 渲染引擎实例
     */
    static create(container: HTMLElement, data: any[], columns: ColumnConfig[], options?: {
        mode?: 'auto' | 'dom' | 'canvas';
        rowHeight?: number;
        headerHeight?: number;
        formatters?: Record<string, Function>;
    }): CanvasRenderer | DOMRenderer;
}
