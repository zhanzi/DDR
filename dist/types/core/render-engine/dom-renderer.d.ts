import { ColumnConfig } from '../../types';
/**
 * DOM渲染引擎
 * 适合中小数据量的报表渲染
 */
export declare class DOMRenderer {
    private container;
    private data;
    private columns;
    private headerElement;
    private bodyElement;
    private tableElement;
    private formatters;
    /**
     * 创建DOM渲染引擎
     * @param container 容器元素
     * @param data 报表数据
     * @param columns 列配置
     * @param formatters 格式化函数
     */
    constructor(container: HTMLElement, data: any[], columns: ColumnConfig[], formatters?: Record<string, Function>);
    /**
     * 渲染报表
     */
    render(): void;
    /**
     * 渲染表头
     */
    private renderHeader;
    /**
     * 处理排序
     * @param key 排序字段
     */
    private handleSort;
    /**
     * 排序数据
     * @param key 排序字段
     * @param direction 排序方向
     */
    private sortData;
    /**
     * 恢复原始顺序
     */
    private restoreOriginalOrder;
    /**
     * 渲染表格体
     */
    private renderBody;
    /**
     * 处理单元格合并
     */
    private handleCellMerge;
    /**
     * 应用条件样式
     */
    private applyConditionalStyle;
    /**
     * 评估条件表达式
     * 支持简单的条件语法，如: "amount > 50000" 或 "status === 'completed'"
     */
    private evaluateCondition;
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
