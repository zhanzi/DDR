import { ColumnConfig } from '../../types';

/**
 * Canvas渲染引擎
 * 用于高性能渲染大数据量报表
 */
export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private container: HTMLElement;
  private data: any[];
  private columns: ColumnConfig[];
  private rowHeight: number;
  private headerHeight: number;
  private visibleRows: number;
  private totalRows: number;
  private scrollTop: number = 0;
  private scrollLeft: number = 0;
  private containerWidth: number;
  private containerHeight: number;
  private totalWidth: number;
  private cellWidths: number[] = [];
  private hoveredRow: number = -1;
  private styleCache: Map<string, any> = new Map();

  /**
   * 创建Canvas渲染引擎
   * @param container 容器元素
   * @param data 报表数据
   * @param columns 列配置
   * @param options 渲染选项
   */
  constructor(
    container: HTMLElement,
    data: any[],
    columns: ColumnConfig[],
    options: {
      rowHeight?: number;
      headerHeight?: number;
    } = {}
  ) {
    this.container = container;
    this.data = data;
    this.columns = columns;
    
    // 设置默认值
    this.rowHeight = options.rowHeight || 40;
    this.headerHeight = options.headerHeight || 50;
    this.totalRows = data.length;
    
    // 获取容器尺寸
    this.containerWidth = container.clientWidth;
    this.containerHeight = container.clientHeight;
    
    // 计算可见行数
    this.visibleRows = Math.ceil(this.containerHeight / this.rowHeight);
    
    // 创建canvas元素
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.containerWidth;
    this.canvas.height = this.containerHeight;
    this.canvas.style.display = 'block';
    
    // 获取绘图上下文
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('无法创建Canvas绘图上下文');
    }
    this.ctx = ctx;
    
    // 计算列宽和总宽度
    this.calculateColumnWidths();
    
    // 添加到容器
    this.container.appendChild(this.canvas);
    
    // 绑定事件
    this.bindEvents();
    
    // 初始渲染
    this.render();
  }

  /**
   * 计算列宽和总宽度
   */
  private calculateColumnWidths(): void {
    let totalWidth = 0;
    
    // 计算每列的宽度
    this.cellWidths = this.columns.map(column => {
      // 如果指定了宽度，则使用指定的宽度
      let width: number = 100; // 默认宽度
      
      if (typeof column.width === 'number') {
        width = column.width;
      } else if (typeof column.width === 'string') {
        // 转换百分比为像素
        if (column.width.endsWith('%')) {
          const percent = parseFloat(column.width) / 100;
          width = this.containerWidth * percent;
        } else {
          width = parseFloat(column.width) || 100;
        }
      }
      
      totalWidth += width;
      return width;
    });
    
    this.totalWidth = Math.max(totalWidth, this.containerWidth);
  }

  /**
   * 绑定事件处理
   */
  private bindEvents(): void {
    // 鼠标滚轮事件(垂直滚动)
    this.container.addEventListener('wheel', (e) => {
      e.preventDefault();
      const deltaY = e.deltaY;
      this.scrollTop = Math.max(0, Math.min(this.scrollTop + deltaY, this.getMaxScrollTop()));
      this.render();
    });
    
    // 鼠标移动事件(行悬停效果)
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const y = e.clientY - rect.top;
      
      // 计算悬停的行索引
      if (y > this.headerHeight) {
        const rowIndex = Math.floor((y - this.headerHeight + this.scrollTop) / this.rowHeight);
        if (rowIndex !== this.hoveredRow && rowIndex < this.totalRows) {
          this.hoveredRow = rowIndex;
          this.render();
        }
      } else {
        if (this.hoveredRow !== -1) {
          this.hoveredRow = -1;
          this.render();
        }
      }
    });
    
    // 鼠标离开事件
    this.canvas.addEventListener('mouseleave', () => {
      this.hoveredRow = -1;
      this.render();
    });
    
    // 添加水平滚动支持
    let isDragging = false;
    let lastX = 0;
    
    // 鼠标按下开始拖动
    this.canvas.addEventListener('mousedown', (e) => {
      isDragging = true;
      lastX = e.clientX;
    });
    
    // 鼠标移动时滚动
    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        const deltaX = e.clientX - lastX;
        this.scrollLeft = Math.max(0, Math.min(this.scrollLeft - deltaX, this.getMaxScrollLeft()));
        lastX = e.clientX;
        this.render();
      }
    });
    
    // 鼠标抬起停止拖动
    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
    
    // 窗口大小改变时重新计算尺寸
    window.addEventListener('resize', this.resize.bind(this));
  }

  /**
   * 获取最大垂直滚动位置
   */
  private getMaxScrollTop(): number {
    return Math.max(0, this.totalRows * this.rowHeight - (this.containerHeight - this.headerHeight));
  }

  /**
   * 获取最大水平滚动位置
   */
  private getMaxScrollLeft(): number {
    return Math.max(0, this.totalWidth - this.containerWidth);
  }

  /**
   * 调整大小
   */
  public resize(): void {
    // 获取新的容器尺寸
    this.containerWidth = this.container.clientWidth;
    this.containerHeight = this.container.clientHeight;
    
    // 调整canvas尺寸
    this.canvas.width = this.containerWidth;
    this.canvas.height = this.containerHeight;
    
    // 重新计算可见行数和列宽
    this.visibleRows = Math.ceil(this.containerHeight / this.rowHeight);
    this.calculateColumnWidths();
    
    // 确保滚动位置有效
    this.scrollTop = Math.max(0, Math.min(this.scrollTop, this.getMaxScrollTop()));
    this.scrollLeft = Math.max(0, Math.min(this.scrollLeft, this.getMaxScrollLeft()));
    
    // 重新渲染
    this.render();
  }

  /**
   * 渲染报表
   */
  public render(): void {
    // 清空画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 渲染表头
    this.renderHeader();
    
    // 渲染数据行
    this.renderRows();
    
    // 渲染滚动条
    this.renderScrollbars();
  }

  /**
   * 渲染表头
   */
  private renderHeader(): void {
    // 设置表头样式
    this.ctx.fillStyle = '#f2f2f2';
    this.ctx.fillRect(0, 0, this.canvas.width, this.headerHeight);
    
    // 绘制表头分隔线
    this.ctx.fillStyle = '#ddd';
    this.ctx.fillRect(0, this.headerHeight - 1, this.canvas.width, 1);
    
    // 绘制列标题
    this.ctx.font = 'bold 14px Arial';
    this.ctx.fillStyle = '#333';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'middle';
    
    let x = -this.scrollLeft;
    this.columns.forEach((column, colIndex) => {
      const width = this.cellWidths[colIndex];
      
      // 检查列是否在可视区域内
      if (x + width > 0 && x < this.containerWidth) {
        const title = column.title;
        
        // 绘制标题
        this.ctx.fillText(
          title,
          x + 10,
          this.headerHeight / 2,
          width - 20
        );
      }
      
      // 更新x坐标
      x += width;
    });
  }

  /**
   * 渲染数据行
   */
  private renderRows(): void {
    // 计算起始行和结束行
    const startRow = Math.floor(this.scrollTop / this.rowHeight);
    const endRow = Math.min(startRow + this.visibleRows + 1, this.totalRows);
    
    // 遍历可见行
    for (let rowIndex = startRow; rowIndex < endRow; rowIndex++) {
      const y = this.headerHeight + rowIndex * this.rowHeight - this.scrollTop;
      
      // 设置行背景色(斑马线、悬停效果)
      if (rowIndex === this.hoveredRow) {
        this.ctx.fillStyle = '#e6f7ff'; // 悬停行颜色
      } else if (rowIndex % 2 === 0) {
        this.ctx.fillStyle = '#ffffff'; // 偶数行颜色
      } else {
        this.ctx.fillStyle = '#f9f9f9'; // 奇数行颜色
      }
      this.ctx.fillRect(0, y, this.canvas.width, this.rowHeight);
      
      // 获取行数据
      const rowData = this.data[rowIndex];
      
      // 绘制单元格
      let x = -this.scrollLeft;
      this.columns.forEach((column, colIndex) => {
        const width = this.cellWidths[colIndex];
        
        // 检查单元格是否在可视区域内
        if (x + width > 0 && x < this.containerWidth) {
          const cellValue = rowData[column.key];
          const formattedValue = this.formatCellValue(cellValue, column);
          
          // 绘制单元格内容
          this.ctx.font = '14px Arial';
          this.ctx.fillStyle = '#333';
          this.ctx.textAlign = column.align === 'right' ? 'right' : 
                               column.align === 'center' ? 'center' : 'left';
          const textX = column.align === 'right' ? x + width - 10 : 
                        column.align === 'center' ? x + width / 2 : x + 10;
          
          this.ctx.fillText(
            formattedValue,
            textX,
            y + this.rowHeight / 2,
            width - 20
          );
          
          // 绘制单元格边框
          this.ctx.strokeStyle = '#eee';
          this.ctx.lineWidth = 1;
          this.ctx.beginPath();
          this.ctx.moveTo(x, y);
          this.ctx.lineTo(x + width, y);
          this.ctx.stroke();
        }
        
        // 更新x坐标
        x += width;
      });
    }
    
    // 绘制竖线
    this.ctx.strokeStyle = '#eee';
    this.ctx.lineWidth = 1;
    let x = -this.scrollLeft;
    this.cellWidths.forEach(width => {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.containerHeight);
      this.ctx.stroke();
      x += width;
    });
  }

  /**
   * 渲染滚动条
   */
  private renderScrollbars(): void {
    const scrollbarHeight = 10;
    const scrollbarWidth = 10;
    
    // 计算滚动条位置和尺寸
    const verticalScrollBarHeight = Math.max(30, (this.containerHeight / (this.totalRows * this.rowHeight + this.headerHeight)) * this.containerHeight);
    const verticalScrollBarY = (this.scrollTop / this.getMaxScrollTop()) * (this.containerHeight - verticalScrollBarHeight);
    
    const horizontalScrollBarWidth = Math.max(30, (this.containerWidth / this.totalWidth) * this.containerWidth);
    const horizontalScrollBarX = (this.scrollLeft / this.getMaxScrollLeft()) * (this.containerWidth - horizontalScrollBarWidth);
    
    // 垂直滚动条
    if (this.totalRows * this.rowHeight > this.containerHeight - this.headerHeight) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      this.ctx.roundRect(
        this.containerWidth - scrollbarWidth,
        verticalScrollBarY,
        scrollbarWidth,
        verticalScrollBarHeight,
        [5]
      );
      this.ctx.fill();
    }
    
    // 水平滚动条
    if (this.totalWidth > this.containerWidth) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      this.ctx.roundRect(
        horizontalScrollBarX,
        this.containerHeight - scrollbarHeight,
        horizontalScrollBarWidth,
        scrollbarHeight,
        [5]
      );
      this.ctx.fill();
    }
  }

  /**
   * 格式化单元格值
   */
  private formatCellValue(value: any, column: ColumnConfig): string {
    if (value === undefined || value === null) {
      return '';
    }
    
    // 如果列有格式化配置
    if (column.formatter) {
      if (typeof column.formatter === 'string') {
        // 基本内置格式化器
        switch (column.formatter) {
          case 'date':
            return new Date(value).toLocaleDateString();
          case 'currency':
            return new Intl.NumberFormat('zh-CN', {
              style: 'currency',
              currency: 'CNY'
            }).format(Number(value));
          case 'number':
            return new Intl.NumberFormat('zh-CN').format(Number(value));
          case 'percentage':
            return new Intl.NumberFormat('zh-CN', {
              style: 'percent',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            }).format(Number(value));
          default:
            return String(value);
        }
      } else if (typeof column.formatter === 'object') {
        // 复杂格式化器
        const { type, params } = column.formatter;
        switch (type) {
          case 'date':
            return new Date(value).toLocaleDateString();
          case 'currency':
            return new Intl.NumberFormat('zh-CN', {
              style: 'currency',
              currency: (params?.currency as string) || 'CNY'
            }).format(Number(value));
          case 'number':
            return new Intl.NumberFormat('zh-CN', {
              minimumFractionDigits: params?.precision || 0,
              maximumFractionDigits: params?.precision || 0,
              useGrouping: params?.thousandSeparator !== false
            }).format(Number(value));
          default:
            return String(value);
        }
      }
    }
    
    // 默认直接转为字符串
    return String(value);
  }

  /**
   * 设置数据
   * @param data 新数据
   */
  public setData(data: any[]): void {
    this.data = data;
    this.totalRows = data.length;
    this.scrollTop = 0; // 重置滚动位置
    this.render();
  }

  /**
   * 销毁资源
   */
  public destroy(): void {
    // 移除事件监听器
    window.removeEventListener('resize', this.resize.bind(this));
    
    // 移除canvas
    this.canvas.remove();
  }
}
