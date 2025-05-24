/**
 * 表头表尾渲染器
 * 负责渲染报表的表头和表尾部分
 */
export declare class ReportHeaderFooter {
    /**
     * 渲染表头
     * @param container 容器元素
     * @param config 表头配置
     * @param data 表头数据
     */
    static renderHeader(container: HTMLElement, config: any, data: Record<string, any>): HTMLElement;
    /**
     * 渲染表尾
     * @param container 容器元素
     * @param config 表尾配置
     * @param data 表尾数据
     */
    static renderFooter(container: HTMLElement, config: any, data: Record<string, any>): HTMLElement;
    /**
     * 处理模板字符串
     * 替换模板中的变量为实际数据
     * @param template 模板字符串
     * @param data 数据对象
     */
    private static processTemplate;
}
