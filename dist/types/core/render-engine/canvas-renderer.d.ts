import { ColumnConfig } from '../../types';
/**
 * Canvas渲染引擎
 * 用于高性能渲染大数据量报表
 */
export declare class CanvasRenderer {
    private canvas;
    private ctx;
    private container;
    private data;
    private columns;
    private rowHeight;
    private headerHeight;
    private visibleRows;
    private totalRows;
    private scrollTop;
    private scrollLeft;
    private containerWidth;
    private containerHeight;
    private totalWidth;
    private cellWidths;
    private hoveredRow;
    private styleCache;
    /**
     * 创建Canvas渲染引擎
     * @param container 容器元素
     * @param data 报表数据
     * @param columns 列配置
     * @param options 渲染选项
     */
    constructor(container: HTMLElement, data: any[], columns: ColumnConfig[], options?: {
        rowHeight?: number;
        headerHeight?: number;
    });
    /**
     * 计算列宽和总宽度
     */
    private calculateColumnWidths;
    /**
     * 绑定事件处理
     */
    private bindEvents;
    /**
     * 获取最大垂直滚动位置
     */
    private getMaxScrollTop;
    /**
     * 获取最大水平滚动位置
     */
    private getMaxScrollLeft;
    /**
     * 调整大小
     */
    resize(): void;
    /**
     * 渲染报表
     */
    render(): void;
    /**
     * 渲染表头
     */
    private renderHeader;
    /**
     * 渲染数据行
     */
    private renderRows;
    /**
     * 渲染滚动条
     */
    private renderScrollbars;
    /**
     * 格式化单元格值
     */
    private formatCellValue;
    /**
     * 设置数据
     * @param data 新数据
     */
    setData(data: any[]): void;
    /**
     * 销毁资源
     */
    destroy(): void;
}
