import { DDRInstance, DDROptions, DDRConfig, APIResponse, DDREvent, ExportOptions } from "../types";

/**
 * DDR核心类
 * 数据驱动报表的主要实现
 */
class DDR implements DDRInstance {
  private container: HTMLElement;
  private config: DDRConfig;
  private data: any[] = [];
  private metadata: Record<string, any> = {};
  private pagination: Record<string, any> | null = null;
  private filters: Record<string, any> = {};
  private options: DDROptions;
  private eventListeners: Map<DDREvent, Function[]> = new Map();
  private formatters: Record<string, Function> = {};
  private initialized: boolean = false;

  /**
   * 创建DDR实例
   * @param options 初始化选项
   * @returns DDR实例
   */
  static create(options: DDROptions): DDRInstance {
    const instance = new DDR(options);
    instance.init().catch(error => {
      if (options.onError) {
        options.onError(error);
      } else {
        console.error('DDR初始化失败:', error);
      }
    });
    return instance;
  }

  /**
   * 注册自定义格式化函数
   * @param name 格式化函数名称
   * @param formatter 格式化函数
   */
  static registerFormatter(name: string, formatter: Function): void {
    DDR.globalFormatters[name] = formatter;
  }

  // 全局格式化函数
  private static globalFormatters: Record<string, Function> = {
    // 内置格式化函数
    date: (value: string | number | Date) => {
      const date = new Date(value);
      return date.toLocaleDateString();
    },
    currency: (value: number, params?: { currency?: string, locale?: string }) => {
      const { currency = 'CNY', locale = 'zh-CN' } = params || {};
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency
      }).format(value);
    },
    number: (value: number, params?: { precision?: number, thousandSeparator?: boolean }) => {
      const { precision = 2, thousandSeparator = true } = params || {};
      const options = {
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
        useGrouping: thousandSeparator
      };
      return new Intl.NumberFormat(undefined, options).format(value);
    },
    percentage: (value: number, params?: { precision?: number }) => {
      const { precision = 2 } = params || {};
      return new Intl.NumberFormat(undefined, {
        style: 'percent',
        minimumFractionDigits: precision,
        maximumFractionDigits: precision
      }).format(value);
    }
  };

  constructor(options: DDROptions) {
    this.options = options;

    // 获取容器元素
    if (typeof options.container === 'string') {
      const el = document.querySelector(options.container);
      if (!el) {
        throw new Error(`找不到容器元素: ${options.container}`);
      }
      this.container = el as HTMLElement;
    } else if (options.container instanceof HTMLElement) {
      this.container = options.container;
    } else {
      throw new Error('无效的容器元素');
    }

    // 应用容器样式
    this.container.classList.add('ddr-container');
    if (options.theme) {
      this.container.classList.add(`ddr-theme-${options.theme}`);
    } else {
      this.container.classList.add('ddr-theme-default');
    }

    // 合并本地和全局格式化函数
    this.formatters = { ...DDR.globalFormatters };

    // 初始化元数据
    if (options.metadata) {
      this.metadata = { ...options.metadata };
    }
  }

  /**
   * 初始化报表
   */
  async init(): Promise<void> {
    try {
      // 加载配置
      this.config = await this._loadConfig(this.options.config);

      // 获取数据
      const apiResponse = await this._fetchData(this.config.dataSource);
      this.data = apiResponse.records;
      this.metadata = apiResponse.metadata || this.metadata;
      this.pagination = apiResponse.pagination || null;

      // 渲染报表
      this._render();

      this.initialized = true;
      this._emitEvent('data-loaded', { data: this.data });

      if (this.options.onLoad) {
        this.options.onLoad();
      }
    } catch (error) {
      this._emitEvent('error', { error });
      throw error;
    }
  }

  /**
   * 重新加载数据
   * @param params 额外的查询参数
   */
  async reload(params?: Record<string, any>): Promise<void> {
    if (!this.initialized) {
      throw new Error('DDR尚未初始化');
    }

    try {
      const apiResponse = await this._fetchData(this.config.dataSource, params);
      this.data = apiResponse.records;

      // 只有在API返回了元数据时才更新
      if (apiResponse.metadata) {
        this.metadata = apiResponse.metadata;
        this._emitEvent('metadata-updated', { metadata: this.metadata });
      }

      this.pagination = apiResponse.pagination || null;

      // 重新渲染
      this._render();
      this._emitEvent('data-loaded', { data: this.data });
    } catch (error) {
      this._emitEvent('error', { error });
      throw error;
    }
  }

  /**
   * 刷新元数据
   */
  async refreshMetadata(): Promise<void> {
    if (!this.initialized) {
      throw new Error('DDR尚未初始化');
    }

    try {
      // 如果配置了独立的元数据API则使用它
      if (this.config.dataSource.metadataSource) {
        const response = await this._fetchMetadata(this.config.dataSource.metadataSource);
        this.metadata = response.metadata || {};
      } else {
        // 否则重新获取所有数据
        const apiResponse = await this._fetchData(this.config.dataSource);
        if (apiResponse.metadata) {
          this.metadata = apiResponse.metadata;
        }
      }

      // 重新渲染表头和表尾
      this._renderHeaderFooter();
      this._emitEvent('metadata-updated', { metadata: this.metadata });
    } catch (error) {
      this._emitEvent('error', { error });
      throw error;
    }
  }

  /**
   * 更新元数据
   * @param metadata 要更新的元数据
   */
  updateMetadata(metadata: Record<string, any>): void {
    this.metadata = { ...this.metadata, ...metadata };

    if (this.initialized) {
      // 重新渲染表头和表尾
      this._renderHeaderFooter();
      this._emitEvent('metadata-updated', { metadata: this.metadata });
    }
  }

  /**
   * 导出为Excel或PDF
   * @param type 导出类型
   * @param options 导出选项
   */
  async exportTo(type: "excel" | "pdf", options?: ExportOptions): Promise<void> {
    if (!this.initialized) {
      throw new Error('DDR尚未初始化');
    }

    try {
      this._emitEvent('export-start', { type, options });
        // 导入导出模块，按需加载以减小包体积
      // 修改为使用静态导入，避免代码拆分
      const { Exporter } = await import('../core/exporter');

      // 执行导出
      if (type === 'excel') {
        // Excel导出传递DOM元素以保留样式
        await Exporter.toExcel(this.container, options);
      } else if (type === 'pdf') {
        // PDF导出传递DOM元素和配置
        await Exporter.toPDF(this.container, this.config, options);
      }

      this._emitEvent('export-complete', {
        type,
        fileName: options?.fileName || `${this.config.meta.name}.${type === 'excel' ? 'xlsx' : 'pdf'}`
      });
    } catch (error) {
      this._emitEvent('error', { error });
      throw error;
    }
  }

  /**
   * 销毁实例并清理资源
   */
  destroy(): void {
    // 清除DOM
    this.container.innerHTML = '';

    // 移除事件监听器
    this.eventListeners.clear();

    // 清除引用
    this.data = [];
    this.metadata = {};
    this.initialized = false;
  }

  /**
   * 设置过滤条件
   * @param filters 过滤条件
   */
  setFilter(filters: Record<string, any>): void {
    this.filters = { ...this.filters, ...filters };
  }

  /**
   * 添加事件监听
   * @param event 事件名称
   * @param callback 回调函数
   */
  on(event: DDREvent, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * 移除事件监听
   * @param event 事件名称
   * @param callback 回调函数
   */
  off(event: DDREvent, callback: Function): void {
    if (this.eventListeners.has(event)) {
      const callbacks = this.eventListeners.get(event)!;
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * 执行打印
   */
  print(): void {
    // 创建打印样式
    const style = document.createElement('style');
    style.textContent = `
      @media print {
        body * {
          visibility: hidden;
        }
        .ddr-container, .ddr-container * {
          visibility: visible;
        }
        .ddr-container {
          position: absolute;
          left: 0;
          top: 0;
        }
      }
    `;
    document.head.appendChild(style);

    // 执行打印
    window.print();

    // 移除打印样式
    document.head.removeChild(style);
  }

  /**
   * 获取原始数据
   * @returns 数据数组
   */
  getData(): any[] {
    return [...this.data];
  }

  /**
   * 获取元数据
   * @returns 元数据对象
   */
  getMetadata(): Record<string, any> {
    return { ...this.metadata };
  }

  /**
   * 从元数据中根据路径获取值
   * @param path 路径，例如："company.name"
   * @returns 找到的值或undefined
   */
  private _getValueByPath(path?: string): any {
    if (!path) return undefined;
    return path.split('.').reduce((acc, part) =>
      acc && acc[part] !== undefined ? acc[part] : undefined, this.metadata);
  }

  /**
   * 加载配置
   * @param config 配置路径或对象
   * @returns 加载后的配置
   */
  private async _loadConfig(config: string | DDRConfig): Promise<DDRConfig> {
    if (typeof config === 'string') {
      // 支持本地JSON或远程API
      if (config.startsWith('http')) {
        const response = await fetch(config);
        if (!response.ok) {
          throw new Error(`加载配置失败: ${response.statusText}`);
        }
        return await response.json();
      } else {
        // 在实际项目中，可能需要根据环境调整导入方式
        // 这里简化处理
        try {
          // 尝试从相对路径加载
          const response = await fetch(config);
          if (!response.ok) {
            throw new Error(`加载配置失败: ${response.statusText}`);
          }
          return await response.json();
        } catch (error) {
          throw new Error(`加载配置失败: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    } else {
      return config;
    }
  }

  /**
   * 获取数据
   * @param dataSource 数据源配置
   * @param extraParams 额外的查询参数
   * @returns API响应对象
   */
  private async _fetchData(
    dataSource: DDRConfig['dataSource'],
    extraParams?: Record<string, any>
  ): Promise<{
    records: any[];
    metadata?: Record<string, any>;
    pagination?: Record<string, any>;
  }> {
    // 如果有模拟数据则使用模拟数据
    if (dataSource.mock && (!this.options.debug || window.location.hostname === 'localhost')) {
      return {
        records: dataSource.mock,
        metadata: this.metadata
      };
    }

    // 合并参数
    const params = { ...dataSource.params, ...this.filters, ...extraParams };

    // 构建请求选项
    const options: RequestInit = {
      method: dataSource.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(dataSource.headers || {})
      }
    };

    // 对于POST请求，添加body
    if (options.method === 'POST') {
      options.body = JSON.stringify(params);
    }

    // 对于GET请求，添加查询参数
    let url = dataSource.api;
    if (options.method === 'GET' && Object.keys(params).length > 0) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        queryParams.append(key, String(value));
      });
      url += `?${queryParams.toString()}`;
    }

    // 发送请求
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.statusText}`);
    }

    // 解析响应
    const result: APIResponse = await response.json();

    // 检查API返回状态
    if (!result.success) {
      throw new Error(`API错误: ${result.message || `状态码 ${result.code}`}`);
    }

    // 提取数据
    return {
      records: result.data.records || [],
      metadata: result.data.metadata,
      pagination: result.data.pagination
    };
  }

  /**
   * 获取元数据
   * @param metadataSource 元数据源配置
   * @returns 元数据对象
   */
  private async _fetchMetadata(metadataSource: DDRConfig['dataSource']['metadataSource']): Promise<{
    metadata: Record<string, any>;
  }> {
    if (!metadataSource) {
      throw new Error('未配置元数据源');
    }

    // 构建请求选项
    const options: RequestInit = {
      method: metadataSource.method || 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    // 对于POST请求，添加body
    if (options.method === 'POST' && metadataSource.params) {
      options.body = JSON.stringify(metadataSource.params);
    }

    // 对于GET请求，添加查询参数
    let url = metadataSource.api;
    if (options.method === 'GET' && metadataSource.params && Object.keys(metadataSource.params).length > 0) {
      const queryParams = new URLSearchParams();
      Object.entries(metadataSource.params).forEach(([key, value]) => {
        queryParams.append(key, String(value));
      });
      url += `?${queryParams.toString()}`;
    }

    // 发送请求
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`元数据API请求失败: ${response.statusText}`);
    }

    // 解析响应
    const result: APIResponse = await response.json();

    // 检查API返回状态
    if (!result.success) {
      throw new Error(`元数据API错误: ${result.message || `状态码 ${result.code}`}`);
    }

    // 提取元数据
    return {
      metadata: result.data.metadata || {}
    };
  }

  /**
   * 渲染报表
   */
  private _render(): void {
    // 清空容器
    this.container.innerHTML = '';

    // 创建包装器
    const wrapper = document.createElement('div');
    wrapper.className = 'ddr-wrapper';

    // 应用布局设置
    if (this.config.layout) {
      if (this.config.layout.height) {
        wrapper.style.height = typeof this.config.layout.height === 'number'
          ? `${this.config.layout.height}px`
          : this.config.layout.height;
      }

      if (this.config.layout.bordered) {
        wrapper.classList.add('ddr-bordered');
      }
    }

    this.container.appendChild(wrapper);

    // 根据数据量选择渲染模式
    const renderMode = this._determineRenderMode();
    wrapper.setAttribute('data-render-mode', renderMode);

    // 渲染表头和表尾
    this._renderHeaderFooter(wrapper);

    // 渲染数据表格
    if (renderMode === 'canvas') {
      this._renderCanvas(wrapper);
    } else {
      this._renderDOM(wrapper);
    }

    // 添加水印
    if (this.config.features?.watermark) {
      this._addWatermark(wrapper, this.config.features.watermark);
    }

    this._emitEvent('render-complete');
  }  /**
   * 渲染表头和表尾
   * @param container 容器元素
   */
  private _renderHeaderFooter(container?: HTMLElement): void {
    const wrapper = container || this.container.querySelector('.ddr-wrapper') as HTMLElement;
    if (!wrapper) return;

    // 移除旧的表头和表尾
    const oldHeader = wrapper.querySelector('.ddr-report-header');
    const oldFooter = wrapper.querySelector('.ddr-report-footer');

    if (oldHeader) {
      wrapper.removeChild(oldHeader);
    }

    if (oldFooter) {
      wrapper.removeChild(oldFooter);
    }

    // 添加新的表头
    if (this.config.header) {
      const header = this._createHeader(this.config.header);
      if (header) {
        wrapper.insertBefore(header, wrapper.firstChild);

        // 使用MutationObserver监听表头高度变化
        const resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            // 获取准确的header高度
            const headerHeight = entry.contentRect.height;
            wrapper.style.setProperty('--header-height', `${headerHeight}px`);

            // 确保表格容器的位置和高度正确
            const tableContainer = wrapper.querySelector('.ddr-table-container') as HTMLElement;
            if (tableContainer) {
              // 不再直接设置top，使用margin来控制位置，避免绝对定位导致的重叠
              tableContainer.style.marginTop = '10px';
              tableContainer.style.maxHeight = `calc(100% - ${headerHeight + 10}px - var(--footer-height, 0px))`;
            }
          }
        });

        // 开始监听表头尺寸变化
        resizeObserver.observe(header);

        // 立即执行一次计算
        const headerHeight = header.getBoundingClientRect().height;
        wrapper.style.setProperty('--header-height', `${headerHeight}px`);

        // 确保表格容器的高度和位置正确
        const tableContainer = wrapper.querySelector('.ddr-table-container') as HTMLElement;
        if (tableContainer) {
          tableContainer.style.marginTop = '10px';
          tableContainer.style.maxHeight = `calc(100% - ${headerHeight + 10}px - var(--footer-height, 0px))`;
        }
      }
    }
      // 表尾现在在_renderDOM中处理
    // 初始渲染时不再在这里添加页脚，而是在渲染完表格后添加
    // 这样可以确保页脚放置在表格容器之后
    if (this.config.footer && this.initialized) {
      // 只在刷新元数据时添加页脚
      const footer = this._createFooter(this.config.footer);
      if (footer) {
        // 尝试查找表格容器，如果找到则在其后添加页脚
        const tableContainer = wrapper.querySelector('.ddr-table-container');
        if (tableContainer) {
          wrapper.insertBefore(footer, tableContainer.nextSibling);
        } else {
          wrapper.appendChild(footer);
        }
      }
    }
  }
    /**
   * 创建表头
   * @param headerConfig 表头配置
   * @returns 表头元素
   */
  private _createHeader(headerConfig: DDRConfig['header']): HTMLElement | null {
    if (!headerConfig) return null;

    const headerElement = document.createElement('div');
    headerElement.className = 'ddr-report-header';
    // 不再设置固定高度，改为最小高度，让其自动适应内容
    headerElement.style.minHeight = `${headerConfig.height || 80}px`;

    // 创建顶部区域容器（Logo + 标题）
    const topContainer = document.createElement('div');
    topContainer.className = 'ddr-header-top';

    // 渲染Logo
    if (headerConfig.logo) {
      const logoContainer = document.createElement('div');
      logoContainer.className = `ddr-header-logo ddr-header-logo-${headerConfig.logo.position || 'left'}`;

      const logoImg = document.createElement('img');
      logoImg.alt = 'Logo';
      // 优先使用元数据中的logo
      logoImg.src = headerConfig.logo.metadataKey
        ? this._getValueByPath(headerConfig.logo.metadataKey) || headerConfig.logo.url || ''
        : headerConfig.logo.url || '';

      if (headerConfig.logo.width) {
        logoImg.width = headerConfig.logo.width;
      }

      if (headerConfig.logo.height) {
        logoImg.height = headerConfig.logo.height;
      }

      logoContainer.appendChild(logoImg);
      topContainer.appendChild(logoContainer);
    }

    // 创建中间标题区域
    const centerContainer = document.createElement('div');
    centerContainer.className = 'ddr-header-center';

    // 渲染标题到中间区域
    if (headerConfig.title) {
      const titleText = typeof headerConfig.title === 'string'
        ? headerConfig.title
        : headerConfig.title.metadataPath
          ? this._getValueByPath(headerConfig.title.metadataPath) || headerConfig.title.text
          : headerConfig.title.text;

      const titleElement = document.createElement('h2');
      titleElement.className = 'ddr-header-title';
      titleElement.textContent = titleText;

      if (typeof headerConfig.title === 'object' && headerConfig.title.style) {
        Object.assign(titleElement.style, headerConfig.title.style);
      }

      centerContainer.appendChild(titleElement);
    }

    // 渲染副标题到中间区域
    if (headerConfig.subtitle) {
      const subtitleElement = document.createElement('div');
      subtitleElement.className = 'ddr-header-subtitle';
      subtitleElement.textContent = headerConfig.subtitle;
      centerContainer.appendChild(subtitleElement);
    }

    topContainer.appendChild(centerContainer);
    headerElement.appendChild(topContainer);

    // 渲染字段
    if (headerConfig.fields && headerConfig.fields.length > 0) {
      const fieldsContainer = document.createElement('div');
      fieldsContainer.className = 'ddr-header-fields';

      const leftFields = document.createElement('div');
      leftFields.className = 'ddr-header-fields-left';

      const rightFields = document.createElement('div');
      rightFields.className = 'ddr-header-fields-right';

      headerConfig.fields.forEach(field => {
        const fieldElement = document.createElement('div');
        fieldElement.className = 'ddr-header-field';

        // 创建标签
        const labelElement = document.createElement('span');
        labelElement.className = 'ddr-field-label';
        labelElement.textContent = field.label || '';
        fieldElement.appendChild(labelElement);

        // 创建值
        const valueElement = document.createElement('span');
        valueElement.className = 'ddr-field-value';

        // 优先从元数据获取值
        let value = field.metadataPath
          ? this._getValueByPath(field.metadataPath)
          : field.value || '';

        // 应用格式化函数(如果有)
        if (value !== undefined && field.formatter && this.formatters[field.formatter]) {
          value = this.formatters[field.formatter](value);
        }

        valueElement.textContent = value !== undefined ? String(value) : '';
        fieldElement.appendChild(valueElement);

        // 应用自定义样式
        if (field.style) {
          Object.assign(fieldElement.style, field.style);
        }

        // 根据位置添加到左侧或右侧
        if (field.position === 'right') {
          rightFields.appendChild(fieldElement);
        } else {
          leftFields.appendChild(fieldElement);
        }
      });

      fieldsContainer.appendChild(leftFields);
      fieldsContainer.appendChild(rightFields);
      headerElement.appendChild(fieldsContainer);
    }

    return headerElement;
  }

  /**
   * 创建表尾
   * @param footerConfig 表尾配置
   * @returns 表尾元素
   */  private _createFooter(footerConfig: DDRConfig['footer']): HTMLElement | null {
    if (!footerConfig) return null;

    const footerElement = document.createElement('div');
    footerElement.className = 'ddr-report-footer';
    // 改为最小高度而不是固定高度，允许内容增加时自动扩展
    footerElement.style.minHeight = `${footerConfig.height || 100}px`;

    // 如果需要固定在底部
    if (footerConfig.fixed) {
      footerElement.classList.add('ddr-footer-fixed');
    }

    // 渲染汇总行
    if (footerConfig.summary && footerConfig.summary.length > 0) {
      const summaryElement = document.createElement('div');
      summaryElement.className = 'ddr-footer-summary';

      footerConfig.summary.forEach(summaryConfig => {
        const summaryItem = document.createElement('div');
        summaryItem.className = 'ddr-summary-item';

        const labelElement = document.createElement('span');
        labelElement.className = 'ddr-summary-label';
        labelElement.textContent = `${summaryConfig.column}合计:`;

        const valueElement = document.createElement('span');
        valueElement.className = 'ddr-summary-value';

        // 获取汇总值，优先使用元数据中的预计算值
        let summaryValue;
        if (summaryConfig.metadataPath) {
          summaryValue = this._getValueByPath(summaryConfig.metadataPath);
        } else {
          // 前端计算汇总值
          summaryValue = this._calculateSummary(this.data, summaryConfig);
        }

        // 应用格式化函数(如果有)
        if (summaryConfig.formatter && this.formatters[summaryConfig.formatter]) {
          summaryValue = this.formatters[summaryConfig.formatter](summaryValue);
        }

        valueElement.textContent = summaryValue !== undefined ? String(summaryValue) : '';

        summaryItem.appendChild(labelElement);
        summaryItem.appendChild(valueElement);
        summaryElement.appendChild(summaryItem);
      });

      footerElement.appendChild(summaryElement);
    }

    // 渲染字段
    if (footerConfig.fields && footerConfig.fields.length > 0) {
      const fieldsContainer = document.createElement('div');
      fieldsContainer.className = 'ddr-footer-fields';

      footerConfig.fields.forEach(field => {
        const fieldElement = document.createElement('div');
        fieldElement.className = `ddr-footer-field ddr-align-${field.position || 'left'}`;

        // 创建标签
        const labelElement = document.createElement('span');
        labelElement.className = 'ddr-field-label';
        labelElement.textContent = field.label || '';
        fieldElement.appendChild(labelElement);

        // 创建值
        const valueElement = document.createElement('span');
        valueElement.className = 'ddr-field-value';

        // 优先从元数据获取值
        let value = field.metadataPath
          ? this._getValueByPath(field.metadataPath)
          : field.value || '';

        // 应用格式化函数(如果有)
        if (value !== undefined && field.formatter && this.formatters[field.formatter]) {
          value = this.formatters[field.formatter](value);
        }

        valueElement.textContent = value !== undefined ? String(value) : '';
        fieldElement.appendChild(valueElement);

        // 应用自定义样式
        if (field.style) {
          Object.assign(fieldElement.style, field.style);
        }

        fieldsContainer.appendChild(fieldElement);
      });

      footerElement.appendChild(fieldsContainer);
    }

    // 渲染签名区域
    if (footerConfig.signatures && footerConfig.signatures.length > 0) {
      const signaturesElement = document.createElement('div');
      signaturesElement.className = 'ddr-footer-signatures';

      footerConfig.signatures.forEach(signature => {
        const signatureItem = document.createElement('div');
        signatureItem.className = 'ddr-signature-item';

        // 签名标签
        const labelElement = document.createElement('div');
        labelElement.className = 'ddr-signature-label';
        labelElement.textContent = signature.label || '';
        signatureItem.appendChild(labelElement);

        // 签名人
        const nameElement = document.createElement('div');
        nameElement.className = 'ddr-signature-name';

        // 优先从元数据获取签名人
        const name = signature.metadataPath
          ? this._getValueByPath(signature.metadataPath)
          : signature.name || '';

        nameElement.textContent = name || '';
        signatureItem.appendChild(nameElement);

        // 日期
        if (signature.showTimestamp) {
          const dateElement = document.createElement('div');
          dateElement.className = 'ddr-signature-date';

          // 获取时间戳
          const timestamp = signature.dateMetadataPath
            ? this._getValueByPath(signature.dateMetadataPath)
            : null;

          if (timestamp) {
            dateElement.textContent = new Date(timestamp).toLocaleDateString();
          }

          signatureItem.appendChild(dateElement);
        }

        if (signature.width) {
          signatureItem.style.width = `${signature.width}px`;
        }

        signaturesElement.appendChild(signatureItem);
      });

      footerElement.appendChild(signaturesElement);
    }

    // 渲染注释
    if (footerConfig.notes) {
      const notesElement = document.createElement('div');
      notesElement.className = 'ddr-footer-notes';
      notesElement.textContent = footerConfig.notes;
      footerElement.appendChild(notesElement);
    }

    // 渲染页码信息
    if (footerConfig.pageInfo && this.pagination) {
      const pageElement = document.createElement('div');
      pageElement.className = `ddr-footer-page ddr-align-${footerConfig.pageInfo.position || 'right'}`;

      // 格式化页码
      const pageText = footerConfig.pageInfo.format
        .replace('{current}', String(this.pagination.pageNumber || 1))
        .replace('{total}', String(this.pagination.totalPages || 1));

      pageElement.textContent = pageText;
      footerElement.appendChild(pageElement);
    }

    return footerElement;
  }

  /**
   * 计算汇总值
   * @param data 数据数组
   * @param summary 汇总配置
   * @returns 汇总值
   */
  private _calculateSummary(data: any[], summary: { column: string; type: string; }): any {
    if (!data.length) return 0;

    const values = data.map(item => {
      const value = item[summary.column];
      return typeof value === 'number' ? value : 0;
    });

    switch (summary.type) {
      case 'sum':
        return values.reduce((sum, val) => sum + val, 0);
      case 'avg':
        return values.reduce((sum, val) => sum + val, 0) / values.length;
      case 'count':
        return values.length;
      default:
        return 0;
    }
  }

  /**
   * 确定渲染模式
   * @returns 渲染模式 'dom' 或 'canvas'
   */
  private _determineRenderMode(): 'dom' | 'canvas' {
    // 如果用户指定了渲染模式
    if (this.options.mode === 'dom' || this.options.mode === 'canvas') {
      return this.options.mode;
    }

    // 根据数据量自动选择
    if (this.data.length > 5000) {
      return 'canvas';
    }

    return 'dom';
  }
    /**
   * DOM模式渲染
   * @param container 容器元素
   */  private _renderDOM(container: HTMLElement): void {
    // 创建表格容器
    const tableContainer = document.createElement('div');
    tableContainer.className = 'ddr-table-container';    // 检查是否有报表头部，如果有，确保表格容器有正确的top值
    const headerElement = container.querySelector('.ddr-report-header') as HTMLElement;
    if (headerElement) {
      // 使用ResizeObserver监听表头实际高度变化
      if (window.ResizeObserver) {
        const resizeObserver = new ResizeObserver(entries => {
          for (const entry of entries) {
            if (entry.target === headerElement) {
              const contentRect = entry.contentRect;
              const headerHeight = contentRect.height;
              // 更新CSS变量
              container.style.setProperty('--header-height', `${headerHeight}px`);
              container.style.setProperty('--table-offset-top', `${headerHeight}px`);
              // 确保表格容器有足够的间距
              tableContainer.style.marginTop = '20px';
            }
          }
        });
        resizeObserver.observe(headerElement);
      } else {
        // 兼容性方案：使用getBoundingClientRect和resize事件监听
        const updateHeaderSize = () => {
          const headerHeight = headerElement.getBoundingClientRect().height;
          container.style.setProperty('--header-height', `${headerHeight}px`);
          container.style.setProperty('--table-offset-top', `${headerHeight}px`);
          tableContainer.style.marginTop = '20px';
        };

        updateHeaderSize(); // 立即执行一次
        window.addEventListener('resize', updateHeaderSize);
      }
    }

    const tableWrapper = document.createElement('div');
    tableWrapper.className = 'ddr-table-wrapper';

    const table = document.createElement('table');
    table.className = 'ddr-table';

    // 应用表格样式
    if (this.config.layout) {
      if (this.config.layout.stripe) {
        table.classList.add('ddr-table-stripe');
      }

      if (this.config.layout.hover) {
        table.classList.add('ddr-table-hover');
      }
    }

    // 创建表头
    const thead = this._createTableHeader(this.config.columns);
    table.appendChild(thead);

    // 创建表体
    const tbody = this._createTableBody(this.config.columns, this.data);
    table.appendChild(tbody);
      tableWrapper.appendChild(table);
    tableContainer.appendChild(tableWrapper);
    container.appendChild(tableContainer);
      // 如果需要分页
    if (this.config.features?.pagination && this.pagination) {
      const paginationElement = this._createPagination(this.pagination);
      container.appendChild(paginationElement);
    }

    // 在渲染完表格后，单独处理页脚添加
    if (this.config.footer) {
      const footer = this._createFooter(this.config.footer);
      if (footer) {
        // 确保页脚在表格容器之后添加，而不是包装在ddr-table-container内部
        container.appendChild(footer);
      }
    }
  }

  /**
   * Canvas模式渲染(大数据量)
   * @param container 容器元素
   */
  private _renderCanvas(container: HTMLElement): void {
    // 对于实际项目，可能需要引入专门的Canvas渲染库
    // 这里简化处理，仅显示一个提示信息
    const placeholder = document.createElement('div');
    placeholder.className = 'ddr-canvas-placeholder';
    placeholder.textContent = `使用Canvas模式渲染${this.data.length}行数据`;
    container.appendChild(placeholder);

    console.log('实际项目中需要实现Canvas渲染引擎');

    // 在实际应用中，这里会引入Canvas渲染引擎
    // 例如: await import('../core/render-engine/canvas-renderer')
  }

  /**
   * 创建表头
   * @param columns 列配置
   * @returns 表头元素
   */
  private _createTableHeader(columns: Array<any>): HTMLElement {
    const thead = document.createElement('thead');
    thead.className = 'ddr-thead';

    // 处理嵌套表头的情况
    const rowCount = this._calculateHeaderRowCount(columns);
    const rows: HTMLElement[] = Array(rowCount).fill(null).map(() => {
      const tr = document.createElement('tr');
      tr.className = 'ddr-header-row';
      return tr;
    });

    // 填充表头单元格
    this._fillHeaderCells(columns, rows, 0, 0);

    // 将行添加到表头
    rows.forEach(row => {
      thead.appendChild(row);
    });

    return thead;
  }

  /**
   * 计算表头行数
   * @param columns 列配置
   * @returns 行数
   */
  private _calculateHeaderRowCount(columns: Array<any>): number {
    let maxDepth = 1;

    const traverse = (cols: Array<any>, currentDepth: number = 1): void => {
      cols.forEach(col => {
        if (col.children && col.children.length) {
          maxDepth = Math.max(maxDepth, currentDepth + 1);
          traverse(col.children, currentDepth + 1);
        }
      });
    };

    traverse(columns);
    return maxDepth;
  }

  /**
   * 填充表头单元格
   * @param columns 列配置
   * @param rows 行元素数组
   * @param rowIndex 当前行索引
   * @param colIndex 当前列索引
   * @returns 占用的列数
   */
  private _fillHeaderCells(
    columns: Array<any>,
    rows: HTMLElement[],
    rowIndex: number,
    colIndex: number
  ): number {
    let currentColIndex = colIndex;

    columns.forEach(column => {
      const cell = document.createElement('th');
      cell.className = 'ddr-header-cell';
      cell.textContent = column.title;

      // 设置单元格样式
      if (column.align) {
        cell.style.textAlign = column.align;
      }

      if (column.width) {
        cell.style.width = typeof column.width === 'number' ? `${column.width}px` : column.width;
      }

      // 如果有子列，则设置colspan和rowspan
      if (column.children && column.children.length) {
        const childColSpan = this._fillHeaderCells(column.children, rows, rowIndex + 1, currentColIndex);
        cell.colSpan = childColSpan;
        cell.rowSpan = 1;
        currentColIndex += childColSpan;
      } else {
        cell.colSpan = 1;
        cell.rowSpan = rows.length - rowIndex;
        currentColIndex += 1;
      }

      rows[rowIndex].appendChild(cell);
    });

    return currentColIndex - colIndex;
  }

  /**
   * 创建表体
   * @param columns 列配置
   * @param data 数据数组
   * @returns 表体元素
   */
  private _createTableBody(columns: Array<any>, data: Array<any>): HTMLElement {
    const tbody = document.createElement('tbody');
    tbody.className = 'ddr-tbody';

    // 获取扁平化的列
    const flatColumns = this._getFlatColumns(columns);

    // 如果没有数据，显示空表格提示
    if (!data.length) {
      const emptyRow = document.createElement('tr');
      emptyRow.className = 'ddr-empty-row';

      const emptyCell = document.createElement('td');
      emptyCell.className = 'ddr-empty-cell';
      emptyCell.colSpan = flatColumns.length;
      emptyCell.textContent = this.config.features?.emptyText || '暂无数据';

      emptyRow.appendChild(emptyCell);
      tbody.appendChild(emptyRow);
      return tbody;
    }

    // 创建行
    data.forEach((rowData, rowIndex) => {
      const row = document.createElement('tr');
      row.className = 'ddr-body-row';
      row.setAttribute('data-index', String(rowIndex));

      // 创建单元格
      flatColumns.forEach(column => {
        // 跳过隐藏列
        if (column.visible === false) {
          return;
        }

        // 检查是否需要合并单元格
        if (column.merge) {
          // 需要实现单元格合并逻辑
          // 这里简化处理
        }

        const cell = document.createElement('td');
        cell.className = 'ddr-body-cell';

        // 获取单元格值
        let value = rowData[column.key];

        // 应用格式化函数
        if (column.formatter) {
          if (typeof column.formatter === 'string' && this.formatters[column.formatter]) {
            value = this.formatters[column.formatter](value);
          } else if (typeof column.formatter === 'object') {
            const formatterFunc = this.formatters[column.formatter.type];
            if (formatterFunc) {
              value = formatterFunc(value, column.formatter.params);
            }
          }
        }

        // 设置单元格内容
        cell.textContent = value !== undefined && value !== null ? String(value) : '';

        // 设置单元格样式
        if (column.align) {
          cell.style.textAlign = column.align;
        }

        // 应用条件样式
        if (column.style?.conditional) {
          column.style.conditional.forEach((condition: { when: string; style: Record<string, any> }) => {
            // 简单条件表达式解析
            // 实际项目中可能需要更复杂的表达式解析
            const valueToCheck = rowData[column.key];
            try {
              const result = this._evaluateCondition(condition.when, { value: valueToCheck, row: rowData });
              if (result) {
                Object.assign(cell.style, condition.style);
              }
            } catch (e) {
              console.error('条件解析错误:', e);
            }
          });
        }

        row.appendChild(cell);
      });

      tbody.appendChild(row);
    });

    return tbody;
  }

  /**
   * 评估条件表达式
   * @param condition 条件表达式
   * @param context 上下文对象
   * @returns 条件结果
   */
  private _evaluateCondition(condition: string, context: Record<string, any>): boolean {
    // 简化版条件表达式解析
    // 实际项目中可能需要更复杂的表达式解析
    try {
      // 简单替换，支持value和row变量
      let expression = condition;

      // 替换 value 变量
      expression = expression.replace(/value/g, JSON.stringify(context.value));

      // 替换 row.xxx 变量
      const rowVarMatches = expression.match(/row\.\w+/g);
      if (rowVarMatches) {
        rowVarMatches.forEach(match => {
          const prop = match.split('.')[1];
          expression = expression.replace(match, JSON.stringify(context.row[prop]));
        });
      }

      // 使用Function构造函数执行表达式
      // 注意：这种方式在实际项目中可能存在安全风险
      return new Function(`return ${expression}`)();
    } catch (e) {
      console.error('条件解析错误:', e, condition);
      return false;
    }
  }

  /**
   * 获取扁平化的列配置
   * @param columns 列配置
   * @returns 扁平化后的列配置
   */
  private _getFlatColumns(columns: Array<any>): Array<any> {
    const result: Array<any> = [];

    const flatten = (cols: Array<any>) => {
      cols.forEach(col => {
        if (col.children && col.children.length) {
          flatten(col.children);
        } else {
          result.push(col);
        }
      });
    };

    flatten(columns);
    return result;
  }

  /**
   * 创建分页组件
   * @param pagination 分页信息
   * @returns 分页元素
   */
  private _createPagination(pagination: Record<string, any>): HTMLElement {
    const paginationElement = document.createElement('div');
    paginationElement.className = 'ddr-pagination';

    const pageInfo = document.createElement('span');
    pageInfo.className = 'ddr-pagination-info';
    pageInfo.textContent = `第${pagination.pageNumber || 1}页/共${pagination.totalPages || 1}页`;
    paginationElement.appendChild(pageInfo);

    // 上一页按钮
    const prevBtn = document.createElement('button');
    prevBtn.className = 'ddr-pagination-prev';
    prevBtn.textContent = '上一页';
    prevBtn.disabled = (pagination.pageNumber || 1) <= 1;
    prevBtn.onclick = () => {
      this.reload({ ...this.filters, pageNumber: (pagination.pageNumber || 1) - 1 });
    };
    paginationElement.appendChild(prevBtn);

    // 页码按钮
    const totalPages = pagination.totalPages || 1;
    const currentPage = pagination.pageNumber || 1;

    // 简单分页逻辑
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);

    // 调整startPage
    startPage = Math.max(1, endPage - 4);

    for (let i = startPage; i <= endPage; i++) {
      const pageBtn = document.createElement('button');
      pageBtn.className = `ddr-pagination-page${i === currentPage ? ' active' : ''}`;
      pageBtn.textContent = String(i);
      pageBtn.onclick = () => {
        if (i !== currentPage) {
          this.reload({ ...this.filters, pageNumber: i });
        }
      };
      paginationElement.appendChild(pageBtn);
    }

    // 下一页按钮
    const nextBtn = document.createElement('button');
    nextBtn.className = 'ddr-pagination-next';
    nextBtn.textContent = '下一页';
    nextBtn.disabled = (pagination.pageNumber || 1) >= (pagination.totalPages || 1);
    nextBtn.onclick = () => {
      this.reload({ ...this.filters, pageNumber: (pagination.pageNumber || 1) + 1 });
    };
    paginationElement.appendChild(nextBtn);

    // 每页条数选择
    const sizeSelect = document.createElement('select');
    sizeSelect.className = 'ddr-pagination-size';
    [10, 20, 50, 100].forEach(size => {
      const option = document.createElement('option');
      option.value = String(size);
      option.textContent = `${size}条/页`;
      option.selected = size === (pagination.pageSize || 20);
      sizeSelect.appendChild(option);
    });
    sizeSelect.onchange = (e) => {
      const pageSize = Number((e.target as HTMLSelectElement).value);
      this.reload({ ...this.filters, pageSize, pageNumber: 1 });
    };
    paginationElement.appendChild(sizeSelect);

    return paginationElement;
  }
    /**
   * 添加水印
   * @param container 容器元素
   * @param text 水印文本
   */
  private _addWatermark(container: HTMLElement, text: string): void {
    // 移除现有水印
    const existingWatermark = container.querySelector('.ddr-watermark');
    if (existingWatermark) {
      container.removeChild(existingWatermark);
    }

    const watermark = document.createElement('div');
    watermark.className = 'ddr-watermark';

    // 确保水印始终可见
    watermark.style.zIndex = '10';

    // 处理动态替换
    if (text.includes('${')) {
      text = text.replace(/\${([^}]+)}/g, (match, key) => {
        return String(this._getValueByPath(key) || match);
      });
    }

    // 计算需要创建多少行和列的水印
    const rows = 5;
    const cols = 4;

    // 创建水印网格
    for (let i = 0; i < rows * cols; i++) {
      const content = document.createElement('div');
      content.className = 'ddr-watermark-content';
      content.textContent = text;
      // 增加不透明度，提高可见性
      content.style.opacity = '0.2';
      content.style.color = 'rgba(0, 0, 0, 0.25)';
      content.style.fontSize = '18px';
      watermark.appendChild(content);
    }

    // 设置水印层的位置并防止水印被篡改
    Object.defineProperty(watermark.style, 'pointerEvents', {
      value: 'none',
      writable: false
    });

    container.appendChild(watermark);
      // 增强版：防止水印被删除或修改的监视器
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        // 检查水印是否被移除
        if (mutation.type === 'childList' &&
            Array.from(mutation.removedNodes).some(node =>
              node === watermark ||
              (node instanceof Element && node.querySelector('.ddr-watermark')))
           ) {
          if (!container.contains(watermark)) {
            // 如果水印被移除，重新添加它
            const newWatermark = watermark.cloneNode(true) as HTMLElement;
            setTimeout(() => container.appendChild(newWatermark), 100);
          }
        }

        // 检查水印样式是否被修改
        if (mutation.type === 'attributes' &&
            mutation.target === watermark &&
            (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
          // 恢复水印样式
          watermark.className = 'ddr-watermark';
          watermark.style.zIndex = '10';
          watermark.style.opacity = '0.8';
        }
      });
    });

    // 监视子元素变化和属性变化
    observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
  }

  /**
   * 准备导出数据
   * @param options 导出选项
   * @returns 导出数据
   */
  private _prepareExportData(options?: ExportOptions): any[] {
    // 获取扁平化的列
    const flatColumns = this._getFlatColumns(this.config.columns);

    // 过滤隐藏列
    const visibleColumns = flatColumns.filter(col =>
      col.visible !== false && (options?.includeHidden || col.visible !== false)
    );

    // 准备表头
    const result = [];

    // 添加表头信息(如果需要)
    if (options?.includeHeader !== false && this.config.header?.showOnExport !== false) {
      if (this.config.header?.title) {
        const titleText = typeof this.config.header.title === 'string'
          ? this.config.header.title
          : this.config.header.title.text;

        result.push([titleText]);
        result.push([]); // 空行
      }

      if (this.config.header?.fields?.length) {
        this.config.header.fields.forEach(field => {
          const value = field.metadataPath
            ? this._getValueByPath(field.metadataPath)
            : field.value || '';

          result.push([`${field.label || ''}`, value]);
        });

        result.push([]); // 空行
      }
    }

    // 添加表格标题行
    const headers = visibleColumns.map(col => col.title);
    result.push(headers);

    // 添加数据行
    this.data.forEach(rowData => {
      const row = visibleColumns.map(column => {
        let value = rowData[column.key];

        // 应用格式化函数
        if (column.formatter) {
          if (typeof column.formatter === 'string' && this.formatters[column.formatter]) {
            value = this.formatters[column.formatter](value);
          } else if (typeof column.formatter === 'object') {
            const formatterFunc = this.formatters[column.formatter.type];
            if (formatterFunc) {
              value = formatterFunc(value, column.formatter.params);
            }
          }
        }

        return value;
      });

      result.push(row);
    });

    // 添加表尾信息(如果需要)
    if (options?.includeFooter !== false && this.config.footer?.showOnExport !== false) {
      result.push([]); // 空行

      // 添加汇总信息
      if (this.config.footer?.summary?.length) {
        this.config.footer.summary.forEach(sum => {
          let summaryValue;
          if (sum.metadataPath) {
            summaryValue = this._getValueByPath(sum.metadataPath);
          } else {
            summaryValue = this._calculateSummary(this.data, sum);
          }

          if (sum.formatter && this.formatters[sum.formatter]) {
            summaryValue = this.formatters[sum.formatter](summaryValue);
          }

          result.push([`${sum.column}合计:`, summaryValue]);
        });

        result.push([]); // 空行
      }

      // 添加表尾字段
      if (this.config.footer?.fields?.length) {
        this.config.footer.fields.forEach(field => {
          const value = field.metadataPath
            ? this._getValueByPath(field.metadataPath)
            : field.value || '';

          result.push([field.label || '', value]);
        });
      }
        // 添加签名信息
      if (this.config.footer?.signatures?.length) {
        const signatureRow: string[] = [];

        this.config.footer.signatures.forEach(signature => {
          signatureRow.push(signature.label || '');

          const name = signature.metadataPath
            ? this._getValueByPath(signature.metadataPath)
            : signature.name || '';

          signatureRow.push(name);
        });

        result.push(signatureRow);
      }

      // 添加注释
      if (this.config.footer?.notes) {
        result.push([this.config.footer.notes]);
      }
    }

    return result;
  }

  /**
   * 触发事件
   * @param event 事件名称
   * @param data 事件数据
   */
  private _emitEvent(event: DDREvent, data?: any): void {
    if (this.eventListeners.has(event)) {
      const callbacks = this.eventListeners.get(event)!;
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`事件${event}处理错误:`, error);
        }
      });
    }
  }
}

export default DDR;
