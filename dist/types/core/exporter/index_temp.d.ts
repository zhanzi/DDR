import { ExportOptions } from '../../types';
/**
 * 报表导出模块
 * 支持Excel和PDF格式导出
 */
export declare class Exporter {
    static toExcel(data: any[], options?: ExportOptions): Promise<void>;
    /**
     * 导出为PDF
     * @param element 要导出的DOM元素
     * @param options 导出选项
     */ static toPDF(element: HTMLElement, options?: ExportOptions): Promise<void>;
}
