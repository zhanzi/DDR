/**
 * 数据驱动报表(DDR)核心接口定义
 */

// 报表配置接口
export interface DDRConfig {
  // 元数据
  meta: {
    name: string;             // 报表名称
    version?: string;         // 版本号
    description?: string;     // 描述
    author?: string;          // 作者
  };

  // 数据源
  dataSource: {
    api?: string;             // API地址（可选）
    data?: any[];             // 直接提供的数据数组（可选）
    method?: "GET" | "POST";  // 请求方法
    params?: Record<string, any>; // 固定参数
    headers?: Record<string, string>; // 自定义请求头
    transform?: string;       // 数据转换函数名
    mock?: any[];             // 模拟数据(开发用)
    pageSize?: number;        // 分页大小
    metadataSource?: {        // 独立的元数据API(可选)
      api: string;
      method?: "GET" | "POST";
      params?: Record<string, any>;
    };
  };

  // 表头配置
  header?: {
    height?: number;          // 表头高度
    title?: string | {        // 表头标题(静态或动态)
      text: string;           // 静态标题文本
      style?: Record<string, any>; // 标题样式
      metadataPath?: string;  // 元数据中标题的路径
    };
    subtitle?: string;        // 副标题
    logo?: {                  // 报表Logo
      metadataKey?: string;   // 元数据中logo的键名，如"company.logo"
      url?: string;           // 静态图片URL
      width?: number;         // 宽度
      height?: number;        // 高度
      position?: "left" | "right" | "center"; // 位置
    };
    fields?: Array<{          // 表头字段
      key: string;            // 字段键名
      label: string;          // 字段标签
      value?: string;         // 静态值
      metadataPath?: string;  // 元数据中的路径，如"company.name"或"period.description"
      width?: number;         // 字段宽度
      position?: "left" | "right"; // 位置
      style?: Record<string, any>; // 样式
      formatter?: string;     // 格式化函数
    }>;
    layout?: "default" | "compact" | "custom"; // 布局方式
    customLayout?: string;    // 自定义布局HTML
    showOnExport?: boolean;   // 导出时显示
    showOnPrint?: boolean;    // 打印时显示
  };

  // 列定义
  columns: Array<ColumnConfig>;

  // 表尾配置
  footer?: {
    height?: number;          // 表尾高度
    fields?: Array<{          // 表尾字段
      key: string;            // 字段键名
      label: string;          // 字段标签
      value?: string;         // 静态值
      metadataPath?: string;  // 元数据中的路径，如"report.generateTime"
      width?: number;         // 字段宽度
      position?: "left" | "right" | "center"; // 位置
      style?: Record<string, any>; // 样式
      formatter?: string;     // 格式化函数
    }>;
    summary?: Array<{         // 汇总行
      column: string;         // 列名
      type: "sum" | "avg" | "count" | "custom"; // 汇总类型
      formatter?: string;     // 格式化函数
      metadataPath?: string;  // 可以使用后端返回的预计算汇总值
    }>;
    signatures?: Array<{      // 签名区域
      label: string;          // 签名标签
      name?: string;          // 静态签名人
      metadataPath?: string;  // 元数据中的路径，如"personnel.creator.name"
      dateMetadataPath?: string; // 元数据中的日期路径，如"personnel.creator.timestamp"
      showTimestamp?: boolean;// 是否显示日期/时间
      image?: boolean;        // 是否支持图片签名
      width?: number;         // 签名区宽度
    }>;
    notes?: string;           // 注释文本
    pageInfo?: {              // 页码信息
      format: string;         // 格式如: "第 {current} 页/共 {total} 页"
      position: "left" | "center" | "right"; // 位置
    };
    layout?: "default" | "compact" | "custom"; // 布局方式
    customLayout?: string;    // 自定义布局HTML
    showOnExport?: boolean;   // 导出时显示
    showOnPrint?: boolean;    // 打印时显示
    fixed?: boolean;          // 是否固定在底部
  };

  // 分组小计配置
  grouping?: {
    enabled: boolean;             // 是否启用分组功能
    groupBy: string | string[];   // 分组字段（单个字段或多级分组）
    subtotals: Array<{            // 小计配置
      field: string;              // 汇总字段
      type: "sum" | "avg" | "count" | "max" | "min"; // 汇总类型
      label?: string;             // 自定义标签
    }>;
    subtotalLabel?: string;       // 小计行标签（默认"小计"）
    showGrandTotal?: boolean;     // 是否显示总计行（默认true）
    grandTotalLabel?: string;     // 总计行标签（默认"总计"）
    multiLevel?: boolean;         // 是否多级分组（当groupBy为数组时）
    subtotalLabels?: string[];    // 多级分组时各级小计标签
    styles?: {                    // 分组样式配置
      subtotalRow?: Record<string, any>; // 小计行样式
      totalRow?: Record<string, any>;    // 总计行样式
      groupColumn?: Record<string, any>; // 分组列样式
    };
  };

    // 功能特性
  features?: {
    exportExcel?: boolean;    // Excel导出
    exportPdf?: boolean;      // PDF导出
    watermark?: string;       // 水印文本
    pagination?: boolean;     // 是否分页
    loading?: {               // 加载配置
      text?: string;          // 加载文本
      spinner?: string;       // 加载动画
    };
    emptyText?: string;       // 空数据文本
    footerSummary?: boolean | Array<{  // 表尾汇总行
      column: string;         // 列名
      type: "sum" | "avg" | "count" | "custom";
      formatter?: string;     // 格式化函数
    }>;
    pdfConfig?: {             // PDF配置
      orientation?: "portrait" | "landscape"; // 页面方向
      pageSize?: string;      // 页面大小："A4", "Letter"等
      margins?: {             // 页面边距(mm)
        top?: number;
        right?: number;
        bottom?: number;
        left?: number;
      };
      multiPage?: boolean;    // 是否支持多页
      quality?: number;       // 图像质量(0-1)
      relayout?: boolean;     // 是否重新排版(true)而不是缩放(false)
    };
  };

  // 布局和样式
  layout?: {
    height?: number | "auto"; // 高度
    headerHeight?: number;    // 表头高度
    rowHeight?: number;       // 行高
    stripe?: boolean;         // 斑马线
    bordered?: boolean;       // 显示边框
    hover?: boolean;          // 鼠标悬停效果
  };
}

// 列配置接口
export interface ColumnConfig {
  key: string;              // 数据键名
  title: string;            // 显示标题
  width?: number | string;  // 宽度
  align?: "left" | "center" | "right"; // 对齐方式
  fixed?: "left" | "right"; // 固定列
  visible?: boolean;        // 是否可见
  merge?: "vertical" | "horizontal" | boolean; // 合并单元格
  sort?: boolean;           // 是否可排序
  formatter?: string | {     // 格式化
    type: "date" | "currency" | "number" | "custom";
    params?: any;           // 格式化参数
  };
  style?: {                 // 样式
    color?: string;
    backgroundColor?: string;
    fontWeight?: string;
    conditional?: Array<{   // 条件样式
      when: string;         // 条件表达式
      style: Record<string, any>; // 应用样式
    }>;
  };
  children?: Array<ColumnConfig>; // 嵌套表头
}

// 报表初始化选项接口
export interface DDROptions {
  container: string | HTMLElement;  // 容器选择器或DOM元素
  config: string | DDRConfig;       // 配置路径或对象
  theme?: string;                   // 主题："default" | "dark" | "compact"
  mode?: "auto" | "dom" | "canvas"; // 渲染模式
  lang?: string;                    // 语言："zh-CN" | "en-US"
  debug?: boolean;                  // 调试模式
  metadata?: Record<string, any>;   // 初始化时提供的元数据
  onLoad?: () => void;              // 加载完成回调
  onError?: (error: Error) => void; // 错误处理回调
}

// 导出选项接口
export interface ExportOptions {
  fileName?: string;               // 文件名称
  sheetName?: string;              // Excel工作表名称
  includeHeader?: boolean;         // 是否包含表头
  includeFooter?: boolean;         // 是否包含表尾
  includeHidden?: boolean;         // 是否包含隐藏列
  password?: string;               // 文件密码保护
  watermark?: string;              // 水印文本
  styles?: {                       // Excel样式设置
    header?: {                     // 表头样式
      font?: Record<string, any>;
      fill?: Record<string, any>;
      alignment?: Record<string, any>;
      border?: Record<string, any>;
    };
    cell?: {                       // 单元格样式
      font?: Record<string, any>;
      fill?: Record<string, any>;
      alignment?: Record<string, any>;
      border?: Record<string, any>;
    };
    alternateRows?: boolean;       // 是否使用交替行颜色
  };
  pdf?: {                          // PDF导出设置
    pageSize?: string;             // 页面大小："A4", "Letter"等
    orientation?: "portrait" | "landscape"; // 页面方向
    margins?: {                    // 页面边距(mm)
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };
    multiPage?: boolean;           // 是否支持多页
    quality?: number;              // 图像质量(0-1)
    relayout?: boolean;            // 是否重新排版(true)而不是缩放(false)
    repeatTableHeader?: boolean;   // 是否在每页重复表格标题行
  };
}

// API响应接口
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

// 事件类型
export type DDREvent =
  | "data-loaded"      // 数据加载完成
  | "render-complete"  // 渲染完成
  | "export-start"     // 导出开始
  | "export-complete"  // 导出完成
  | "metadata-updated" // 元数据更新
  | "error";           // 错误事件

// 报表实例接口
export interface DDRInstance {
  // 重新加载数据
  reload(params?: Record<string, any>): Promise<void>;

  // 刷新元数据
  refreshMetadata(): Promise<void>;

  // 更新元数据
  updateMetadata(metadata: Record<string, any>): void;

  // 导出功能
  exportTo(type: "excel" | "pdf", options?: ExportOptions): Promise<void>;

  // 销毁实例并清理资源
  destroy(): void;

  // 设置过滤条件
  setFilter(filters: Record<string, any>): void;

  // 事件监听
  on(event: DDREvent, callback: Function): void;
  off(event: DDREvent, callback: Function): void;

  // 打印
  print(): void;

  // 获取原始数据
  getData(): any[];

  // 获取元数据
  getMetadata(): Record<string, any>;
}
