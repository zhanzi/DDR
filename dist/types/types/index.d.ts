/**
 * 数据驱动报表(DDR)核心接口定义
 */
export interface DDRConfig {
    meta: {
        name: string;
        version?: string;
        description?: string;
        author?: string;
    };
    dataSource: {
        api?: string;
        data?: any[];
        method?: "GET" | "POST";
        params?: Record<string, any>;
        headers?: Record<string, string>;
        transform?: string;
        mock?: any[];
        pageSize?: number;
        metadataSource?: {
            api: string;
            method?: "GET" | "POST";
            params?: Record<string, any>;
        };
    };
    header?: {
        height?: number;
        title?: string | {
            text: string;
            style?: Record<string, any>;
            metadataPath?: string;
        };
        subtitle?: string;
        logo?: {
            metadataKey?: string;
            url?: string;
            width?: number;
            height?: number;
            position?: "left" | "right" | "center";
        };
        fields?: Array<{
            key: string;
            label: string;
            value?: string;
            metadataPath?: string;
            width?: number;
            position?: "left" | "right";
            style?: Record<string, any>;
            formatter?: string;
        }>;
        layout?: "default" | "compact" | "custom";
        customLayout?: string;
        showOnExport?: boolean;
        showOnPrint?: boolean;
    };
    columns: Array<ColumnConfig>;
    footer?: {
        height?: number;
        fields?: Array<{
            key: string;
            label: string;
            value?: string;
            metadataPath?: string;
            width?: number;
            position?: "left" | "right" | "center";
            style?: Record<string, any>;
            formatter?: string;
        }>;
        summary?: Array<{
            column: string;
            type: "sum" | "avg" | "count" | "custom";
            formatter?: string;
            metadataPath?: string;
        }>;
        summaryAlign?: "left" | "center" | "right";
        signatures?: Array<{
            label: string;
            name?: string;
            metadataPath?: string;
            dateMetadataPath?: string;
            showTimestamp?: boolean;
            image?: boolean;
            width?: number;
        }>;
        notes?: string;
        pageInfo?: {
            format: string;
            position: "left" | "center" | "right";
        };
        layout?: "default" | "compact" | "custom";
        customLayout?: string;
        showOnExport?: boolean;
        showOnPrint?: boolean;
        fixed?: boolean;
    };
    grouping?: {
        enabled: boolean;
        groupBy: string | string[];
        subtotals: Array<{
            field: string;
            type: "sum" | "avg" | "count" | "max" | "min";
            label?: string;
        }>;
        subtotalLabel?: string;
        showGrandTotal?: boolean;
        grandTotalLabel?: string;
        multiLevel?: boolean;
        subtotalLabels?: string[];
        styles?: {
            subtotalRow?: Record<string, any>;
            totalRow?: Record<string, any>;
            groupColumn?: Record<string, any>;
        };
    };
    features?: {
        exportExcel?: boolean;
        exportPdf?: boolean;
        watermark?: string;
        pagination?: boolean;
        loading?: {
            text?: string;
            spinner?: string;
        };
        emptyText?: string;
        footerSummary?: boolean | Array<{
            column: string;
            type: "sum" | "avg" | "count" | "custom";
            formatter?: string;
        }>;
        pdfConfig?: {
            orientation?: "portrait" | "landscape";
            pageSize?: string;
            margins?: {
                top?: number;
                right?: number;
                bottom?: number;
                left?: number;
            };
            multiPage?: boolean;
            quality?: number;
            relayout?: boolean;
        };
    };
    layout?: {
        height?: number | "auto";
        headerHeight?: number;
        rowHeight?: number;
        stripe?: boolean;
        bordered?: boolean;
        hover?: boolean;
    };
}
export interface ColumnConfig {
    key: string;
    title: string;
    width?: number | string;
    align?: "left" | "center" | "right";
    fixed?: "left" | "right";
    visible?: boolean;
    merge?: "vertical" | "horizontal" | boolean;
    sort?: boolean;
    formatter?: string | {
        type: "date" | "currency" | "number" | "custom";
        params?: any;
    };
    style?: {
        color?: string;
        backgroundColor?: string;
        fontWeight?: string;
        conditional?: Array<{
            when: string;
            style: Record<string, any>;
        }>;
    };
    children?: Array<ColumnConfig>;
}
export interface DDROptions {
    container: string | HTMLElement;
    config: string | DDRConfig;
    theme?: string;
    mode?: "auto" | "dom" | "canvas";
    lang?: string;
    debug?: boolean;
    metadata?: Record<string, any>;
    onLoad?: () => void;
    onError?: (error: Error) => void;
}
export interface ExportOptions {
    fileName?: string;
    sheetName?: string;
    includeHeader?: boolean;
    includeFooter?: boolean;
    includeHidden?: boolean;
    password?: string;
    watermark?: string;
    styles?: {
        header?: {
            font?: Record<string, any>;
            fill?: Record<string, any>;
            alignment?: Record<string, any>;
            border?: Record<string, any>;
        };
        cell?: {
            font?: Record<string, any>;
            fill?: Record<string, any>;
            alignment?: Record<string, any>;
            border?: Record<string, any>;
        };
        alternateRows?: boolean;
    };
    pdf?: {
        pageSize?: string;
        orientation?: "portrait" | "landscape";
        margins?: {
            top?: number;
            right?: number;
            bottom?: number;
            left?: number;
        };
        multiPage?: boolean;
        quality?: number;
        relayout?: boolean;
        repeatTableHeader?: boolean;
    };
}
export interface APIResponse {
    success: boolean;
    code: number;
    message?: string;
    data: {
        records: any[];
        metadata?: Record<string, any>;
        pagination?: {
            pageSize: number;
            pageNumber: number;
            total: number;
            totalPages: number;
        };
    };
    timestamp?: number;
}
export type DDREvent = "data-loaded" | "render-complete" | "export-start" | "export-complete" | "metadata-updated" | "error";
export interface DDRInstance {
    reload(params?: Record<string, any>): Promise<void>;
    refreshMetadata(): Promise<void>;
    updateMetadata(metadata: Record<string, any>): void;
    exportTo(type: "excel" | "pdf", options?: ExportOptions): Promise<void>;
    destroy(): void;
    setFilter(filters: Record<string, any>): void;
    on(event: DDREvent, callback: Function): void;
    off(event: DDREvent, callback: Function): void;
    print(): void;
    getData(): any[];
    getMetadata(): Record<string, any>;
    setTheme(theme: string): void;
}
