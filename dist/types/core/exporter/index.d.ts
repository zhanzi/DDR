import { ExportOptions } from '../../types';
/**
 * 报表导出模块
 * 支持Excel和PDF格式导出
 */
export declare class Exporter {
    /**
     * 导出为Excel（增强版，支持配置和DOM两种方式）
     * @param data 报表数据或DOM元素
     * @param options 导出选项
     * @param config 可选的DDR配置（如果提供，将使用基于配置的导出）
     * @param reportData 可选的报表数据（配合config使用）
     */
    static toExcel(data: any[] | HTMLElement, options?: ExportOptions, config?: any, reportData?: any): Promise<void>;
    /**
     * 从DOM元素提取数据
     * @param element DOM元素
     */
    static extractDataFromDOM(element: HTMLElement): any[][];
    /**
     * 从表格行中提取数据
     * @param row 表格行元素
     */
    static extractRowData(row: HTMLTableRowElement): string[];
    /**
     * 将DOM样式应用到Excel
     * @param ws 工作表
     * @param data 数据
     * @param element DOM元素
     */
    static applyDOMStylesToExcel(ws: any, data: any[][], element: HTMLElement): void;
    /**
     * 从DOM元素中提取样式定义 - 使用真实的CSS变量和计算样式
     */
    static _getExcelStylesFromDOM(element: HTMLElement): any;
    /**
     * 设置自适应列宽
     */
    static _setAutoColumnWidths(ws: any, data: any[][], element: HTMLElement): void;
    /**
     * 设置元数据行右对齐
     */
    static _setMetadataAlignment(ws: any, data: any[][]): void;
    /**
     * 获取行类型
     */
    static _getRowType(row: HTMLElement): string;
    /**
     * 检查单元格是否被合并覆盖
     */
    static _isCellMerged(merges: any[], row: number, col: number): boolean;
    /**
     * 颜色转十六进制（支持多种格式）
     */
    static _rgbToHex(color: string): string;
    /**
     * 应用基础样式到Excel（兼容性更好的方法）
     */
    static applyBasicStylesToExcel(ws: any, data: any[][]): void;
    /**
     * 应用增强样式到Excel（使用更多样式特性）
     */
    static applyEnhancedStylesToExcel(ws: any, data: any[][]): void;
    /**
     * 将RGB颜色转换为十六进制
     */
    static rgbToHex(rgb: string): string;
    /**
     * 将CSS文本对齐转换为Excel对齐
     */
    static getExcelAlignment(textAlign: string): string;
    /**
     * 导出为PDF
     * @param element 要导出的DOM元素
     * @param config 报表配置
     * @param options 导出选项
     */
    static toPDF(element: HTMLElement, config?: any, options?: ExportOptions): Promise<void>;
    /**
     * 打印功能 - 重用PDF绘制逻辑
     * @param element 要打印的DOM元素
     * @param config 报表配置
     * @param options 打印选项
     */
    static toPrint(element: HTMLElement, config?: any, options?: ExportOptions): Promise<void>;
    /**
     * 创建打印专用容器
     */
    private static _createPrintContainer;
    /**
     * 应用打印表格布局 - 重用PDF的列宽逻辑
     */
    private static _applyPrintTableLayout;
    /**
     * 获取扁平化的列配置（重用PDF逻辑）
     */
    private static _getFlatColumns;
    /**
     * 创建打印样式
     */
    private static _createPrintStyle;
    /**
     * 添加统一的全页面打印水印
     */
    private static _addPrintWatermark;
}
