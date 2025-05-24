import { ExportOptions } from '../../types';
/**
 * 报表导出模块
 * 支持Excel和PDF格式导出
 */
export declare class Exporter {
    /**
     * 导出为Excel
     * @param data 报表数据或DOM元素
     * @param options 导出选项
     */
    static toExcel(data: any[] | HTMLElement, options?: ExportOptions): Promise<void>;
    /**
     * 从DOM元素提取数据
     * @param element DOM元素
     */
    static extractDataFromDOM(element: HTMLElement): any[][];
    /**
     * 将DOM样式应用到Excel
     * @param ws 工作表
     * @param data 数据
     * @param element DOM元素
     */
    static applyDOMStylesToExcel(ws: any, data: any[][], element: HTMLElement): void;
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
}
