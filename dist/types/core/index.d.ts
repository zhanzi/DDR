import { DDRInstance, DDROptions, DDREvent, ExportOptions } from "../types";
/**
 * DDR核心类
 * 数据驱动报表的主要实现
 */
declare class DDR implements DDRInstance {
    private container;
    private config;
    private data;
    private metadata;
    private pagination;
    private filters;
    private options;
    private eventListeners;
    private formatters;
    private initialized;
    /**
     * 创建DDR实例
     * @param options 初始化选项
     * @returns DDR实例
     */
    static create(options: DDROptions): DDRInstance;
    /**
     * 注册自定义格式化函数
     * @param name 格式化函数名称
     * @param formatter 格式化函数
     */
    static registerFormatter(name: string, formatter: Function): void;
    private static globalFormatters;
    constructor(options: DDROptions);
    /**
     * 初始化报表
     */
    init(): Promise<void>;
    /**
     * 重新加载数据
     * @param params 额外的查询参数
     */
    reload(params?: Record<string, any>): Promise<void>;
    /**
     * 刷新元数据
     */
    refreshMetadata(): Promise<void>;
    /**
     * 更新元数据
     * @param metadata 要更新的元数据
     */
    updateMetadata(metadata: Record<string, any>): void;
    /**
     * 导出为Excel或PDF
     * @param type 导出类型
     * @param options 导出选项
     */
    exportTo(type: "excel" | "pdf", options?: ExportOptions): Promise<void>;
    /**
     * 销毁实例并清理资源
     */
    destroy(): void;
    /**
     * 设置过滤条件
     * @param filters 过滤条件
     */
    setFilter(filters: Record<string, any>): void;
    /**
     * 添加事件监听
     * @param event 事件名称
     * @param callback 回调函数
     */
    on(event: DDREvent, callback: Function): void;
    /**
     * 移除事件监听
     * @param event 事件名称
     * @param callback 回调函数
     */
    off(event: DDREvent, callback: Function): void;
    /**
     * 执行打印 - 使用与PDF导出一致的逻辑
     */
    print(): Promise<void>;
    /**
     * 简单打印方式（降级方案）
     */
    private _simplePrint;
    /**
     * 获取原始数据
     * @returns 数据数组
     */
    getData(): any[];
    /**
     * 获取元数据
     * @returns 元数据对象
     */
    getMetadata(): Record<string, any>;
    /**
     * 从元数据中根据路径获取值
     * @param path 路径，例如："company.name"
     * @returns 找到的值或undefined
     */
    private _getValueByPath;
    /**
     * 加载配置
     * @param config 配置路径或对象
     * @returns 加载后的配置
     */
    private _loadConfig;
    /**
     * 获取数据
     * @param dataSource 数据源配置
     * @param extraParams 额外的查询参数
     * @returns API响应对象
     */
    private _fetchData;
    /**
     * 获取元数据
     * @param metadataSource 元数据源配置
     * @returns 元数据对象
     */
    private _fetchMetadata;
    /**
     * 渲染报表
     */
    private _render; /**
     * 渲染表头和表尾
     * @param container 容器元素
     */
    private _renderHeaderFooter;
    /**
   * 创建表头
   * @param headerConfig 表头配置
   * @returns 表头元素
   */
    private _createHeader;
    /**
     * 创建表尾
     * @param footerConfig 表尾配置
     * @returns 表尾元素
     */ private _createFooter;
    /**
     * 计算汇总值
     * @param data 数据数组
     * @param summary 汇总配置
     * @returns 汇总值
     */
    private _calculateSummary;
    /**
     * 确定渲染模式
     * @returns 渲染模式 'dom' 或 'canvas'
     */
    private _determineRenderMode;
    /**
   * DOM模式渲染
   * @param container 容器元素
   */ private _renderDOM;
    /**
     * Canvas模式渲染(大数据量)
     * @param container 容器元素
     */
    private _renderCanvas;
    /**
     * 创建表头
     * @param columns 列配置
     * @returns 表头元素
     */
    private _createTableHeader;
    /**
     * 计算表头行数
     * @param columns 列配置
     * @returns 行数
     */
    private _calculateHeaderRowCount;
    /**
     * 填充表头单元格
     * @param columns 列配置
     * @param rows 行元素数组
     * @param rowIndex 当前行索引
     * @param colIndex 当前列索引
     * @returns 占用的列数
     */
    private _fillHeaderCells;
    /**
     * 创建表体
     * @param columns 列配置
     * @param data 数据数组
     * @returns 表体元素
     */
    private _createTableBody;
    /**
     * 处理单元格合并
     */
    private _handleCellMerge;
    /**
     * 评估条件表达式
     * @param condition 条件表达式
     * @param context 上下文对象
     * @returns 条件结果
     */
    private _evaluateCondition;
    /**
     * 获取扁平化的列配置
     * @param columns 列配置
     * @returns 扁平化后的列配置
     */
    private _getFlatColumns;
    /**
     * 创建分页组件
     * @param pagination 分页信息
     * @returns 分页元素
     */
    private _createPagination;
    /**
   * 添加水印
   * @param container 容器元素
   * @param text 水印文本
   */
    private _addWatermark;
    /**
     * 准备导出数据
     * @param options 导出选项
     * @returns 导出数据
     */
    private _prepareExportData;
    /**
     * 触发事件
     * @param event 事件名称
     * @param data 事件数据
     */
    private _emitEvent;
}
export default DDR;
