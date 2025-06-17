import { ExportOptions } from '../../types';
/**
 * 基于配置的Excel导出器
 * 直接使用DDR配置和数据源，避免DOM抓取的问题
 */
export declare class ConfigBasedExporter {
    /**
     * 基于DDR配置和数据源导出Excel
     * @param config DDR报表配置
     * @param data 报表数据（包含records、metadata等）
     * @param options 导出选项
     */
    static exportExcel(config: any, data: any, options?: ExportOptions): Promise<void>;
    /**
     * 构建Excel数据结构
     */
    private static _buildExcelData;
    /**
     * 处理分组数据
     */
    private static _processGrouping;
    /**
     * 解析元数据值
     */
    private static _resolveMetadataValue;
    /**
     * 格式化单元格值
     */
    private static _formatCellValue;
    /**
     * 应用样式
     */
    private static _applyStyles;
    /**
     * 验证并清理合并单元格
     */
    private static _validateAndCleanMerges;
    /**
     * 应用基础样式（简化版，避免文件损坏）
     */
    private static _applyBasicStyles;
}
