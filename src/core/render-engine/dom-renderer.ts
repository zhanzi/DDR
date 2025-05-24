import { ColumnConfig } from '../../types';

/**
 * DOM渲染引擎
 * 适合中小数据量的报表渲染
 */
export class DOMRenderer {
  private container: HTMLElement;
  private data: any[];
  private columns: ColumnConfig[];
  private headerElement: HTMLElement;
  private bodyElement: HTMLElement;
  private tableElement: HTMLElement;
  private formatters: Record<string, Function> = {};

  /**
   * 创建DOM渲染引擎
   * @param container 容器元素
   * @param data 报表数据
   * @param columns 列配置
   * @param formatters 格式化函数
   */
  constructor(
    container: HTMLElement,
    data: any[],
    columns: ColumnConfig[],
    formatters: Record<string, Function> = {}
  ) {
    this.container = container;
    this.data = data;
    this.columns = columns;
    this.formatters = formatters;
    
    // 创建表格结构
    this.tableElement = document.createElement('table');
    this.tableElement.className = 'ddr-table';
    
    this.headerElement = document.createElement('thead');
    this.headerElement.className = 'ddr-table-header';
    
    this.bodyElement = document.createElement('tbody');
    this.bodyElement.className = 'ddr-table-body';
    
    this.tableElement.appendChild(this.headerElement);
    this.tableElement.appendChild(this.bodyElement);
    
    // 添加到容器
    this.container.appendChild(this.tableElement);
    
    // 渲染表格
    this.render();
  }

  /**
   * 渲染报表
   */
  public render(): void {
    this.renderHeader();
    this.renderBody();
  }

  /**
   * 渲染表头
   */
  private renderHeader(): void {
    // 清空表头
    this.headerElement.innerHTML = '';
    
    // 创建表头行
    const headerRow = document.createElement('tr');
    
    // 创建表头单元格
    this.columns.forEach(column => {
      if (column.visible !== false) {
        const th = document.createElement('th');
        th.className = 'ddr-table-cell ddr-table-header-cell';
        th.textContent = column.title;
        
        // 设置单元格宽度
        if (column.width) {
          th.style.width = typeof column.width === 'number' ? `${column.width}px` : column.width;
        }
        
        // 设置对齐方式
        if (column.align) {
          th.style.textAlign = column.align;
        }
        
        // 设置固定列
        if (column.fixed) {
          th.classList.add(`ddr-table-fixed-${column.fixed}`);
        }
        
        // 添加排序功能(如果配置了)
        if (column.sort) {
          th.classList.add('ddr-table-sortable');
          th.addEventListener('click', () => this.handleSort(column.key));
        }
        
        headerRow.appendChild(th);
      }
    });
    
    this.headerElement.appendChild(headerRow);
  }

  /**
   * 处理排序
   * @param key 排序字段
   */
  private handleSort(key: string): void {
    // 获取当前排序方向
    const headerCell = Array.from(this.headerElement.querySelectorAll('th'))
      .find(th => th.getAttribute('data-key') === key);
    
    if (!headerCell) return;
    
    const currentDirection = headerCell.getAttribute('data-sort-direction');
    let newDirection: 'asc' | 'desc' | null = null;
    
    // 切换排序方向
    if (currentDirection === 'asc') {
      newDirection = 'desc';
    } else if (currentDirection === 'desc') {
      newDirection = null;
    } else {
      newDirection = 'asc';
    }
    
    // 重置所有列的排序状态
    this.headerElement.querySelectorAll('th').forEach(th => {
      th.removeAttribute('data-sort-direction');
      th.classList.remove('ddr-table-sort-asc', 'ddr-table-sort-desc');
    });
    
    // 设置当前列的排序状态
    if (newDirection) {
      headerCell.setAttribute('data-sort-direction', newDirection);
      headerCell.classList.add(`ddr-table-sort-${newDirection}`);
      
      // 排序数据
      this.sortData(key, newDirection);
    } else {
      // 恢复原始顺序
      this.restoreOriginalOrder();
    }
  }

  /**
   * 排序数据
   * @param key 排序字段
   * @param direction 排序方向
   */
  private sortData(key: string, direction: 'asc' | 'desc'): void {
    // 复制数据进行排序
    const sortedData = [...this.data].sort((a, b) => {
      const valueA = a[key];
      const valueB = b[key];
      
      // 处理null和undefined
      if (valueA == null && valueB == null) return 0;
      if (valueA == null) return direction === 'asc' ? -1 : 1;
      if (valueB == null) return direction === 'asc' ? 1 : -1;
      
      // 比较值
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return direction === 'asc' ? valueA - valueB : valueB - valueA;
      } else {
        const strA = String(valueA).toLowerCase();
        const strB = String(valueB).toLowerCase();
        return direction === 'asc' ? 
          strA.localeCompare(strB) : 
          strB.localeCompare(strA);
      }
    });
    
    // 更新数据并重新渲染表格体
    this.data = sortedData;
    this.renderBody();
  }

  /**
   * 恢复原始顺序
   */
  private restoreOriginalOrder(): void {
    // 这里需要有原始数据的备份，或者重新获取数据
    // 为简化示例，假设数据会重新加载
    this.renderBody();
  }

  /**
   * 渲染表格体
   */
  private renderBody(): void {
    // 清空表格体
    this.bodyElement.innerHTML = '';
    
    // 没有数据时显示空状态
    if (this.data.length === 0) {
      const emptyRow = document.createElement('tr');
      const emptyCell = document.createElement('td');
      emptyCell.className = 'ddr-table-empty';
      emptyCell.colSpan = this.columns.filter(col => col.visible !== false).length;
      emptyCell.textContent = '暂无数据';
      
      emptyRow.appendChild(emptyCell);
      this.bodyElement.appendChild(emptyRow);
      return;
    }
    
    // 记录需要合并的单元格
    const merges: Map<string, { rowSpan: number, colSpan: number }> = new Map();
    
    // 遍历数据创建行
    this.data.forEach((rowData, rowIndex) => {
      const row = document.createElement('tr');
      row.className = 'ddr-table-row';
      
      // 添加斑马纹样式
      if (rowIndex % 2 === 1) {
        row.classList.add('ddr-table-row-striped');
      }
      
      // 创建单元格
      let colIndex = 0;
      this.columns.forEach(column => {
        if (column.visible !== false) {
          // 检查是否已经被合并跳过
          const cellKey = `${rowIndex}-${colIndex}`;
          if (merges.has(cellKey) && merges.get(cellKey)?.rowSpan === 0) {
            colIndex++;
            return;
          }
          
          const cellValue = rowData[column.key];
          const formattedValue = this.formatCellValue(cellValue, column);
          
          const td = document.createElement('td');
          td.className = 'ddr-table-cell';
          td.innerHTML = formattedValue;
          
          // 设置对齐方式
          if (column.align) {
            td.style.textAlign = column.align;
          }
          
          // 设置固定列
          if (column.fixed) {
            td.classList.add(`ddr-table-fixed-${column.fixed}`);
          }
          
          // 处理单元格合并
          if (column.merge) {
            this.handleCellMerge(td, rowData, column, rowIndex, colIndex, merges);
          }
          
          // 应用条件样式
          if (column.style?.conditional) {
            this.applyConditionalStyle(td, rowData, column);
          }
          
          row.appendChild(td);
          colIndex++;
        }
      });
      
      this.bodyElement.appendChild(row);
    });
  }

  /**
   * 处理单元格合并
   */
  private handleCellMerge(
    td: HTMLTableCellElement,
    rowData: any,
    column: ColumnConfig,
    rowIndex: number,
    colIndex: number,
    merges: Map<string, { rowSpan: number, colSpan: number }>
  ): void {
    // 只处理垂直合并(相同值的行合并)
    if (column.merge === 'vertical') {
      const currentValue = rowData[column.key];
      let rowSpan = 1;
      
      // 向下查找相同值的连续单元格
      for (let i = rowIndex + 1; i < this.data.length; i++) {
        const nextValue = this.data[i][column.key];
        
        if (nextValue === currentValue) {
          rowSpan++;
          
          // 标记被合并的单元格，后面遇到时跳过
          const skipKey = `${i}-${colIndex}`;
          merges.set(skipKey, { rowSpan: 0, colSpan: 0 });
        } else {
          break;
        }
      }
      
      if (rowSpan > 1) {
        td.rowSpan = rowSpan;
      }
    }
  }

  /**
   * 应用条件样式
   */
  private applyConditionalStyle(td: HTMLTableCellElement, rowData: any, column: ColumnConfig): void {
    if (!column.style?.conditional) return;
    
    for (const condition of column.style.conditional) {
      const { when, style } = condition;
      
      // 简单的条件解析和执行
      try {
        const result = this.evaluateCondition(when, rowData);
        if (result) {
          // 应用样式
          Object.entries(style).forEach(([prop, value]) => {
            td.style[prop as any] = value as string;
          });
          break; // 只应用第一个匹配的条件
        }
      } catch (error) {
        console.error('条件表达式解析错误:', error);
      }
    }
  }
  /**
   * 评估条件表达式
   * 支持简单的条件语法，如: "amount > 50000" 或 "status === 'completed'"
   */
  private evaluateCondition(condition: string, rowData: any): boolean {
    try {
      // 使用更安全的方式解析条件表达式
      // 支持的操作符
      const operators = {
        '>': (a: any, b: any) => Number(a) > Number(b),
        '<': (a: any, b: any) => Number(a) < Number(b),
        '>=': (a: any, b: any) => Number(a) >= Number(b),
        '<=': (a: any, b: any) => Number(a) <= Number(b),
        '===': (a: any, b: any) => a === b,
        '!==': (a: any, b: any) => a !== b,
        '==': (a: any, b: any) => a == b,
        '!=': (a: any, b: any) => a != b
      };
      
      // 解析表达式 - 示例: "amount > 50000" 或 "quantity < 10"
      // 匹配 字段 + 操作符 + 值
      const matches = condition.match(/^\s*(\w+)\s*(===|!==|==|!=|>=|<=|>|<)\s*([\d.]+|['"][^'"]*['"])\s*$/);
      
      if (matches) {
        const [, field, operator, rawValue] = matches;
        
        // 确保字段存在于行数据中
        if (field in rowData) {
          const fieldValue = rowData[field];
            // 解析值（处理字符串值）
          let value: string | number = rawValue;
          if (rawValue.startsWith("'") || rawValue.startsWith('"')) {
            value = rawValue.slice(1, -1); // 移除引号
          } else {
            value = Number(rawValue);
          }
          
          // 应用操作符
          if (operator in operators) {
            return operators[operator as keyof typeof operators](fieldValue, value);
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error('条件表达式执行错误:', error, condition);
      return false;
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
        // 检查是否有注册的格式化函数
        if (this.formatters[column.formatter]) {
          return this.formatters[column.formatter](value);
        }
        
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
    this.renderBody();
  }

  /**
   * 销毁资源
   */
  public destroy(): void {
    // 移除表格
    this.tableElement.remove();
  }
}
