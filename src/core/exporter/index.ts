import * as XLSX from 'xlsx';
// 直接导入支持样式的XLSX库
import * as XLSXStyle from 'xlsx-js-style';
import { ConfigBasedExporter } from './config-based-exporter';

console.log('使用内置的支持样式的XLSX库');
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { ExportOptions } from '../../types';
import { fixPDFExport, setupChineseSupport } from './pdf-fixes';

// 应用PDF导出修复
if (typeof window !== 'undefined') {
  setTimeout(() => {
    try {
      console.log('jsPDF库已内置到组件中');
      fixPDFExport();
    } catch (e) {
      console.warn('应用PDF导出修复失败:', e);
    }
  }, 0);
}

// 定义行信息接口
interface RowInfo {
  index: number;
  height: number;
  top: number;
  isHeader: boolean;
  content: string;
}

// 定义分页点接口
interface PageBreakPoint {
  rowIndex: number;
  yPercent: number;
}

/**
 * 报表导出模块
 * 支持Excel和PDF格式导出
 */
export class Exporter {
  // 移除exportExcelFromConfig方法，使用ConfigBasedExporter代替

  /**
   * 导出为Excel（增强版，支持配置和DOM两种方式）
   * @param data 报表数据或DOM元素
   * @param options 导出选项
   * @param config 可选的DDR配置（如果提供，将使用基于配置的导出）
   * @param reportData 可选的报表数据（配合config使用）
   */
  static async toExcel(
    data: any[] | HTMLElement,
    options: ExportOptions = {},
    config?: any,
    reportData?: any
  ): Promise<void> {
    try {
      console.log('🚀 开始Excel导出');

      // 如果提供了配置和报表数据，使用新的基于配置的导出器
      if (config && reportData) {
        console.log('📊 使用基于配置的Excel导出');
        return ConfigBasedExporter.exportExcel(config, reportData, options);
      }

      // 否则使用原有的DOM抓取方式（保持兼容性）
      console.log('⚠️ 使用DOM抓取方式导出Excel');

      // 默认选项
      const {
        fileName = '报表',
        sheetName = 'Sheet1',
        includeHidden = false,
        styles = {} // 自定义样式选项
      } = options;

      let excelData: any[][];
      let domElement: HTMLElement | null = null;

      // 判断输入类型
      if (data instanceof HTMLElement) {
        domElement = data;
        excelData = this.extractDataFromDOM(data);
      } else {
        excelData = data;
      }

      // 创建工作表 - 使用支持样式的库
      const ws = XLSXStyle.utils.aoa_to_sheet(excelData);

      // 设置列宽
      const wscols = [];
      if (excelData.length > 0) {
        for (let i = 0; i < excelData[0].length; i++) {
          // 计算最大宽度
          let maxWidth = 10; // 默认宽度
          excelData.forEach(row => {
            if (row[i] && String(row[i]).length > maxWidth) {
              maxWidth = Math.min(50, String(row[i]).length); // 限制最大宽度
            }
          });
          wscols.push({ wch: maxWidth });
        }
        ws['!cols'] = wscols;
      }

      // 使用增强的样式功能
      console.log('Excel导出数据结构:', {
        dataRows: excelData.length,
        hasDOMElement: !!domElement,
        firstRow: excelData[0],
        lastRow: excelData[excelData.length - 1]
      });

      // 检查工作表数据
      console.log('📊 工作表数据检查:');
      const range = XLSXStyle.utils.decode_range(ws['!ref'] || 'A1');
      console.log(`  工作表范围: ${ws['!ref']}`);
      console.log(`  行数: ${range.e.r + 1}, 列数: ${range.e.c + 1}`);

      // 检查前几行的数据
      for (let r = 0; r <= Math.min(range.e.r, 9); r++) {
        const rowData: string[] = [];
        for (let c = 0; c <= Math.min(range.e.c, 8); c++) {
          const cellRef = XLSXStyle.utils.encode_cell({ r, c });
          const cell = ws[cellRef];
          rowData.push(cell ? (cell.v || '').toString() : '空');
        }
        console.log(`  行${r}: ${rowData.join(' | ')}`);
      }

      // 优先使用DOM样式，如果有DOM元素的话
      if (domElement) {
        console.log('使用DOM样式应用到Excel');
        try {
          this.applyDOMStylesToExcel(ws, excelData, domElement);
          console.log('DOM样式应用成功');
        } catch (domError) {
          console.warn('DOM样式应用失败，回退到增强样式:', domError);
          try {
            this.applyEnhancedStylesToExcel(ws, excelData);
            console.log('增强样式应用成功');
          } catch (enhancedError) {
            console.warn('增强样式应用失败，回退到基础样式:', enhancedError);
            this.applyBasicStylesToExcel(ws, excelData);
          }
        }
      } else {
        // 没有DOM元素时使用增强样式
        console.log('使用增强样式应用到Excel');
        try {
          this.applyEnhancedStylesToExcel(ws, excelData);
          console.log('增强样式应用成功');
        } catch (enhancedError) {
          console.warn('增强样式应用失败，回退到基础样式:', enhancedError);
          this.applyBasicStylesToExcel(ws, excelData);
        }
      }

      // 检查样式是否被应用
      const sampleCells = ['A1', 'A2', 'B1', 'B2'];
      sampleCells.forEach(cellRef => {
        if (ws[cellRef]) {
          console.log(`单元格 ${cellRef} 样式:`, ws[cellRef].s);
        }
      });

      // 创建工作簿 - 使用支持样式的库
      const wb = XLSXStyle.utils.book_new();
      XLSXStyle.utils.book_append_sheet(wb, ws, sheetName);

      // 设置工作簿属性以支持样式
      if (!wb.Workbook) wb.Workbook = {};
      if (!wb.Workbook.Views) wb.Workbook.Views = [];
      wb.Workbook.Views[0] = { RTL: false };

      // 导出文件 - 使用支持样式的格式
      try {
        // 检查是否有样式信息
        let hasStyles = false;
        const sampleCells = ['A1', 'A2', 'B1'];
        for (const cellRef of sampleCells) {
          if (ws[cellRef] && ws[cellRef].s) {
            hasStyles = true;
            break;
          }
        }

        console.log(`Excel导出信息: 工作表包含${Object.keys(ws).length}个单元格, 样式信息: ${hasStyles ? '有' : '无'}`);

        // 设置工作簿属性以支持样式
        wb.Props = {
          Title: fileName,
          Subject: "报表数据",
          Author: "DDR报表组件",
          CreatedDate: new Date()
        };

        // 尝试多种导出方式以确保样式生效
        try {
          // 方式1：使用支持样式的导出选项 - 关闭压缩避免兼容性问题
          const writeOptions = {
            bookType: 'xlsx' as const,
            type: 'buffer' as const,
            cellStyles: true, // 启用样式支持
            sheetStubs: false,
            compression: false // 关闭压缩以避免兼容性问题
          };

          // 生成文件数据 - 使用支持样式的库
          const excelBuffer = XLSXStyle.write(wb, writeOptions);

          // 创建Blob并下载
          const blob = new Blob([excelBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          });

          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${fileName}.xlsx`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          console.log('Excel导出完成（Blob方式，支持样式）');
        } catch (blobError) {
          console.warn('Blob导出失败，尝试直接导出:', blobError);

          // 方式2：直接使用writeFile（可能样式支持更好） - 关闭压缩
          XLSXStyle.writeFile(wb, `${fileName}.xlsx`, {
            cellStyles: true,
            compression: false // 关闭压缩以避免兼容性问题
          });
          console.log('Excel导出完成（直接导出方式）');
        }
      } catch (error) {
        console.error('Excel导出失败:', error);
        // 降级到基础导出
        try {
          XLSXStyle.writeFile(wb, `${fileName}.xlsx`);
          console.log('Excel导出完成（基础模式）');
        } catch (fallbackError) {
          console.error('Excel基础导出也失败:', fallbackError);
          throw fallbackError;
        }
      }

      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * 从DOM元素提取数据
   * @param element DOM元素
   */
  static extractDataFromDOM(element: HTMLElement): any[][] {
    const result: any[][] = [];
    console.log('🔍 开始从DOM提取数据');

    // 先获取表格的列数来确定行格式
    const table = element.querySelector('table');
    let tableColumnCount = 0;
    if (table) {
      const firstRow = table.querySelector('tr');
      if (firstRow) {
        const cells = firstRow.querySelectorAll('td, th');
        cells.forEach(cell => {
          const colSpan = (cell as HTMLTableCellElement).colSpan || 1;
          tableColumnCount += colSpan;
        });
      }
    }
    console.log(`📊 表格列数: ${tableColumnCount}`);

    // 提取报表标题
    const titleElement = element.querySelector('.ddr-report-header .ddr-header-title');
    if (titleElement) {
      const titleRow: string[] = [titleElement.textContent?.trim() || ''];
      // 填充其余列为空，以便后续合并
      for (let i = 1; i < Math.max(tableColumnCount, 1); i++) {
        titleRow.push('');
      }
      result.push(titleRow);
      result.push([]); // 空行分隔
    }

    // 提取元数据字段 - 改为按表格列数对齐
    const fieldsElements = element.querySelectorAll('.ddr-header-fields .ddr-header-field');
    if (fieldsElements.length > 0) {
      // 创建元数据行，将所有元数据信息合并到第一列
      const metadataTexts: string[] = [];
      fieldsElements.forEach(field => {
        const label = field.querySelector('.ddr-field-label')?.textContent?.trim() || '';
        const value = field.querySelector('.ddr-field-value')?.textContent?.trim() || '';
        if (label && value) {
          metadataTexts.push(`${label} ${value}`);
        }
      });

      if (metadataTexts.length > 0) {
        // 将所有元数据合并到第一列，其他列留空
        const metadataRow: string[] = [metadataTexts.join('  ')];
        // 填充其余列为空
        for (let i = 1; i < Math.max(tableColumnCount, 1); i++) {
          metadataRow.push('');
        }
        result.push(metadataRow);
        result.push([]); // 空行分隔
      }
    }

    // 提取表格数据 - 重用之前获取的table变量
    if (table) {
      console.log('开始提取表格数据');

      // 分别处理表头和表体
      const thead = table.querySelector('thead');
      const tbody = table.querySelector('tbody');

      // 如果有明确的thead和tbody结构
      if (thead && tbody) {
        console.log('发现thead和tbody结构');

        // 提取表头
        const headerRows = thead.querySelectorAll('tr');
        headerRows.forEach(row => {
          const headerData = this.extractRowData(row);
          if (headerData.length > 0) {
            result.push(headerData);
          }
        });

        // 提取表体数据
        const bodyRows = tbody.querySelectorAll('tr');
        bodyRows.forEach(row => {
          const rowData = this.extractRowData(row);
          if (rowData.length > 0) {
            result.push(rowData);
          }
        });
      } else {
        // 没有明确的thead/tbody结构，按行处理
        console.log('没有thead/tbody结构，按行处理');
        const rows = table.querySelectorAll('tr');

        rows.forEach((row, index) => {
          const rowData = this.extractRowData(row);
          if (rowData.length > 0) {
            result.push(rowData);
          }
        });
      }
    }

    // 提取表尾信息
    const footerElement = element.querySelector('.ddr-report-footer');
    if (footerElement) {
      result.push([]); // 空行分隔

      // 提取汇总信息
      const summaryElements = footerElement.querySelectorAll('.ddr-footer-summary .ddr-summary-item');
      if (summaryElements.length > 0) {
        const summaryRow: string[] = [];
        summaryElements.forEach(item => {
          const label = item.querySelector('.ddr-summary-label')?.textContent?.trim() || '';
          const value = item.querySelector('.ddr-summary-value')?.textContent?.trim() || '';
          if (label && value) {
            summaryRow.push(`${label} ${value}`);
          }
        });
        if (summaryRow.length > 0) {
          result.push(summaryRow);
        }
      }

      // 提取其他表尾字段
      const footerFields = footerElement.querySelectorAll('.ddr-footer-fields .ddr-footer-field');
      if (footerFields.length > 0) {
        const footerRow: string[] = [];
        footerFields.forEach(field => {
          const label = field.querySelector('.ddr-field-label')?.textContent?.trim() || '';
          const value = field.querySelector('.ddr-field-value')?.textContent?.trim() || '';
          if (label && value) {
            footerRow.push(`${label} ${value}`);
          }
        });
        if (footerRow.length > 0) {
          result.push(footerRow);
        }
      }
    }

    console.log('📋 数据提取完成，总行数:', result.length);
    console.log('📋 前5行数据:', result.slice(0, 5));
    console.log('📋 详细数据检查:');
    result.slice(0, 10).forEach((row, index) => {
      console.log(`  行${index}: [${row.length}列] ${JSON.stringify(row.slice(0, 3))}...`);
    });
    return result;
  }

  /**
   * 从表格行中提取数据
   * @param row 表格行元素
   */
  static extractRowData(row: HTMLTableRowElement): string[] {
    const cells = row.querySelectorAll('td, th');
    const rowData: string[] = [];

    cells.forEach((cell, cellIndex) => {
      const cellValue = cell.textContent?.trim() || '';
      const colSpan = (cell as HTMLTableCellElement).colSpan || 1;
      const rowSpan = (cell as HTMLTableCellElement).rowSpan || 1;

      // 对于合并的列，只添加一次值，不重复
      // 这样可以保持列数的一致性
      if (rowSpan > 1) {
        // 如果是跨行合并的单元格，只在第一行添加值
        rowData.push(cellValue);
      } else {
        // 普通单元格或跨列合并的单元格
        for (let i = 0; i < colSpan; i++) {
          rowData.push(i === 0 ? cellValue : ''); // 只在第一列填入值，其他列为空
        }
      }
    });

    return rowData;
  }

  /**
   * 将DOM样式应用到Excel
   * @param ws 工作表
   * @param data 数据
   * @param element DOM元素
   */
  static applyDOMStylesToExcel(ws: any, data: any[][], element: HTMLElement): void {
    console.log('开始应用DOM样式到Excel');

    try {
      // 查找表格元素
      const table = element.querySelector('table');
      if (!table) {
        console.log('未找到表格，使用默认样式');
        this.applyBasicStylesToExcel(ws, data);
        return;
      }

      // 分析DOM结构
      const titleElement = element.querySelector('.ddr-report-header .ddr-header-title');
      const hasTitle = !!titleElement;
      const hasMetadata = element.querySelectorAll('.ddr-header-fields .ddr-header-field').length > 0;

      // 计算表格列数
      let tableColumnCount = 0;
      const firstRow = table.querySelector('tr');
      if (firstRow) {
        const cells = firstRow.querySelectorAll('td, th');
        cells.forEach(cell => {
          const colSpan = (cell as HTMLTableCellElement).colSpan || 1;
          tableColumnCount += colSpan;
        });
      }

      console.log('DOM结构分析:', { hasTitle, hasMetadata, tableColumnCount });

      // 计算各部分在Excel中的行索引
      let currentRowIndex = 0;

      // 如果有标题，跳过标题行和空行
      if (hasTitle) {
        currentRowIndex += 2; // 标题行 + 空行
      }

      // 如果有元数据，跳过元数据行和空行
      if (hasMetadata) {
        currentRowIndex += 2; // 元数据行 + 空行
      }

      console.log(`📍 表格数据在Excel中的起始行索引: ${currentRowIndex}`);

      // 定义样式 - 与页面样式保持一致
      const styles = this._getExcelStylesFromDOM(element);

      // 为标题行和元数据行应用样式
      let excelRowIndex = 0;

      // 应用标题行样式 - 更接近PDF效果
      if (hasTitle) {
        for (let col = 0; col < tableColumnCount; col++) {
          const cellRef = XLSXStyle.utils.encode_cell({ r: excelRowIndex, c: col });
          if (ws[cellRef]) {
            ws[cellRef].s = {
              font: { bold: true, sz: 16, color: { rgb: "000000" } },
              alignment: { horizontal: "center", vertical: "center" },
              fill: { fgColor: { rgb: "FFFFFF" } },
              border: {
                bottom: { style: "thin", color: { rgb: "CCCCCC" } }
              }
            };
          }
        }
        excelRowIndex += 2; // 标题行 + 空行
      }

      // 应用元数据行样式 - 更接近PDF效果
      if (hasMetadata) {
        for (let col = 0; col < tableColumnCount; col++) {
          const cellRef = XLSXStyle.utils.encode_cell({ r: excelRowIndex, c: col });
          if (ws[cellRef]) {
            ws[cellRef].s = {
              font: { sz: 10, color: { rgb: "666666" } },
              alignment: { horizontal: "left", vertical: "center" },
              fill: { fgColor: { rgb: "FFFFFF" } },
              border: {
                bottom: { style: "thin", color: { rgb: "CCCCCC" } }
              }
            };
          }
        }
        excelRowIndex += 2; // 元数据行 + 空行
      }

      // 添加标题行和元数据行的合并单元格
      const merges: any[] = []; // 存储合并单元格信息

      // 标题行合并（第1行，A1:I1） - 添加安全检查
      if (hasTitle && tableColumnCount > 1 && tableColumnCount <= 256) {
        const mergeRange = {
          s: { r: 0, c: 0 },
          e: { r: 0, c: tableColumnCount - 1 }
        };

        // 验证合并范围的有效性
        if (mergeRange.s.r <= mergeRange.e.r && mergeRange.s.c <= mergeRange.e.c) {
          merges.push(mergeRange);
          console.log(`📋 添加标题行合并: A1:${String.fromCharCode(65 + tableColumnCount - 1)}1`);
        }
      }

      // 元数据行合并（第3行，A3:I3）
      if (hasMetadata && tableColumnCount > 1) {
        const metadataRowIndex = hasTitle ? 2 : 0; // 如果有标题，元数据在第3行；否则在第1行
        merges.push({
          s: { r: metadataRowIndex, c: 0 },
          e: { r: metadataRowIndex, c: tableColumnCount - 1 }
        });
        console.log(`📋 添加元数据行合并: A${metadataRowIndex + 1}:${String.fromCharCode(65 + tableColumnCount - 1)}${metadataRowIndex + 1}`);
      }

      // 处理表格行和合并单元格
      const rows = table.querySelectorAll('tr');
      let isFirstRow = true;

      rows.forEach((row, rowIndex) => {
        const cells = row.querySelectorAll('td, th');
        const isHeader = row.querySelector('th') !== null || isFirstRow;
        const rowType = this._getRowType(row as HTMLElement);
        const excelRowIndex = currentRowIndex + rowIndex;

        let cellIndex = 0; // 实际的列索引，考虑合并单元格的影响

        cells.forEach((cell, originalCellIndex) => {
          // 跳过被合并覆盖的单元格位置
          while (this._isCellMerged(merges, excelRowIndex, cellIndex)) {
            cellIndex++;
          }

          const cellRef = XLSXStyle.utils.encode_cell({ r: excelRowIndex, c: cellIndex });

          // 确保单元格存在
          if (!ws[cellRef]) {
            ws[cellRef] = { v: cell.textContent || '', t: 's' };
          }

          // 处理合并单元格
          const htmlCell = cell as HTMLTableCellElement;
          const rowSpan = htmlCell.rowSpan || 1;
          const colSpan = htmlCell.colSpan || 1;

          if (rowSpan > 1 || colSpan > 1) {
            const merge = {
              s: { r: excelRowIndex, c: cellIndex },
              e: { r: excelRowIndex + rowSpan - 1, c: cellIndex + colSpan - 1 }
            };
            merges.push(merge);
            console.log(`📋 添加合并单元格: ${cellRef} (${rowSpan}x${colSpan}) - 原始列${originalCellIndex}`);
          }

          // 应用样式
          let cellStyle;
          if (isHeader) {
            cellStyle = styles.header;
          } else if (rowType === 'subtotal') {
            cellStyle = styles.subtotal;
          } else if (rowType === 'total') {
            cellStyle = styles.total;
          } else {
            // 普通数据行，检查是否是奇偶行
            const dataRowIndex = rowIndex - (isFirstRow ? 1 : 0);
            const isAlternateRow = dataRowIndex % 2 === 1;
            cellStyle = isAlternateRow ? styles.alternateRow : styles.dataRow;
          }

          ws[cellRef].s = cellStyle;

          // 移动到下一个列位置
          cellIndex += colSpan;
        });

        if (isFirstRow && isHeader) {
          isFirstRow = false;
        }
      });

      // 验证并清理合并单元格
      const validMerges = this._validateMerges(merges, ws);

      // 应用合并单元格
      if (validMerges.length > 0) {
        ws['!merges'] = validMerges;
        console.log(`✅ 应用了 ${validMerges.length} 个有效合并单元格（原始${merges.length}个）`);
      } else {
        console.log(`⚠️ 没有有效的合并单元格可应用`);
      }

      // 设置自适应列宽
      this._setAutoColumnWidths(ws, data, element);

      // 设置元数据行右对齐
      this._setMetadataAlignment(ws, data);

      console.log('DOM样式和合并应用完成');
    } catch (error) {
      console.error('应用DOM样式失败:', error);
      // 降级到默认样式
      this.applyBasicStylesToExcel(ws, data);
    }
  }

  /**
   * 从DOM元素中提取样式定义 - 使用真实的CSS变量和计算样式
   */
  static _getExcelStylesFromDOM(element: HTMLElement): any {
    // 获取CSS计算样式
    const getComputedColor = (selector: string, property: string = 'backgroundColor'): string => {
      const el = element.querySelector(selector);
      if (el) {
        const computed = window.getComputedStyle(el);
        const color = computed.getPropertyValue(property);
        return this._rgbToHex(color);
      }
      return 'FFFFFF';
    };

    // 获取CSS变量值
    const getCSSVariable = (varName: string, fallback: string = '#FFFFFF'): string => {
      const computed = window.getComputedStyle(element);
      let value = computed.getPropertyValue(varName).trim();

      // 如果没有获取到值，尝试从根元素获取
      if (!value) {
        const rootComputed = window.getComputedStyle(document.documentElement);
        value = rootComputed.getPropertyValue(varName).trim();
      }

      // 如果还是没有值，尝试从body获取
      if (!value) {
        const bodyComputed = window.getComputedStyle(document.body);
        value = bodyComputed.getPropertyValue(varName).trim();
      }

      console.log(`CSS变量 ${varName}: "${value}" (fallback: ${fallback})`);
      const finalValue = value || fallback;
      const hexResult = this._rgbToHex(finalValue);
      console.log(`  转换结果: "${finalValue}" -> "${hexResult}"`);
      return hexResult;
    };

    // 从实际DOM样式中提取颜色
    const tableHeaderBg = getCSSVariable('--ddr-table-header-bg', '#f2f2f2');
    const tableOddRow = getCSSVariable('--ddr-table-odd-row', '#fff');
    const tableEvenRow = getCSSVariable('--ddr-table-even-row', '#f9f9f9');
    const borderColor = getCSSVariable('--ddr-border-color', '#e8e8e8');
    const textColor = getCSSVariable('--ddr-text-color', '#333');
    const primaryColor = getCSSVariable('--ddr-primary-color', '#1890ff');

    console.log('🎨 提取的DOM样式变量:', {
      tableHeaderBg, tableOddRow, tableEvenRow, borderColor, textColor, primaryColor
    });

    return {
      header: {
        font: { bold: true, sz: 11, color: { rgb: textColor } }, // 使用文本颜色而不是主色
        fill: { fgColor: { rgb: tableHeaderBg } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: borderColor } },
          bottom: { style: "thin", color: { rgb: borderColor } },
          left: { style: "thin", color: { rgb: borderColor } },
          right: { style: "thin", color: { rgb: borderColor } }
        }
      },
      dataRow: {
        font: { sz: 10, color: { rgb: textColor } },
        alignment: { vertical: "center" },
        fill: { fgColor: { rgb: tableOddRow } },
        border: {
          top: { style: "thin", color: { rgb: borderColor } },
          bottom: { style: "thin", color: { rgb: borderColor } },
          left: { style: "thin", color: { rgb: borderColor } },
          right: { style: "thin", color: { rgb: borderColor } }
        }
      },
      alternateRow: {
        font: { sz: 10, color: { rgb: textColor } },
        alignment: { vertical: "center" },
        fill: { fgColor: { rgb: tableEvenRow } },
        border: {
          top: { style: "thin", color: { rgb: borderColor } },
          bottom: { style: "thin", color: { rgb: borderColor } },
          left: { style: "thin", color: { rgb: borderColor } },
          right: { style: "thin", color: { rgb: borderColor } }
        }
      },
      subtotal: {
        font: { bold: true, sz: 10, color: { rgb: textColor } }, // 使用文本颜色
        alignment: { vertical: "center" },
        fill: { fgColor: { rgb: "F5F5F5" } }, // 对应CSS中的 #f5f5f5
        border: {
          top: { style: "thin", color: { rgb: "D9D9D9" } }, // 对应CSS中的 #d9d9d9
          bottom: { style: "thin", color: { rgb: borderColor } },
          left: { style: "thin", color: { rgb: borderColor } },
          right: { style: "thin", color: { rgb: borderColor } }
        }
      },
      total: {
        font: { bold: true, sz: 10, color: { rgb: textColor } }, // 使用文本颜色而不是主色调
        alignment: { vertical: "center" },
        fill: { fgColor: { rgb: "E6F7FF" } }, // 对应CSS中的 #e6f7ff
        border: {
          top: { style: "medium", color: { rgb: primaryColor } },
          bottom: { style: "medium", color: { rgb: primaryColor } },
          left: { style: "thin", color: { rgb: borderColor } },
          right: { style: "thin", color: { rgb: borderColor } }
        }
      }
    };
  }

  // 移除未实现的方法，这些功能已经在ConfigBasedExporter中实现

  // 移除_applyConfigBasedStyles方法，使用ConfigBasedExporter代替

  /**
   * 设置自适应列宽
   */
  static _setAutoColumnWidths(ws: any, data: any[][], element: HTMLElement): void {
    try {
      console.log('📏 开始设置自适应列宽');

      const range = XLSXStyle.utils.decode_range(ws['!ref'] || 'A1');
      if (!ws['!cols']) ws['!cols'] = [];

      // 计算每列的最大内容宽度
      for (let col = range.s.c; col <= range.e.c; col++) {
        let maxWidth = 8; // 最小宽度

        for (let row = range.s.r; row <= range.e.r; row++) {
          const cellRef = XLSXStyle.utils.encode_cell({ r: row, c: col });
          if (ws[cellRef] && ws[cellRef].v) {
            const cellValue = String(ws[cellRef].v);
            // 计算字符宽度（中文字符按2个字符计算）
            const charWidth = cellValue.replace(/[^\x00-\xff]/g, "**").length;
            maxWidth = Math.max(maxWidth, charWidth);
          }
        }

        // 设置列宽，限制最大宽度避免过宽
        const finalWidth = Math.min(maxWidth + 2, 30); // 加2个字符的缓冲，最大30字符
        ws['!cols'][col] = { wch: finalWidth };
        console.log(`📏 列${col}宽度设置为: ${finalWidth}字符`);
      }

      console.log('📏 自适应列宽设置完成');
    } catch (error) {
      console.error('设置自适应列宽失败:', error);
    }
  }

  /**
   * 设置元数据行右对齐
   */
  static _setMetadataAlignment(ws: any, data: any[][]): void {
    try {
      console.log('📐 开始设置元数据行对齐');

      const range = XLSXStyle.utils.decode_range(ws['!ref'] || 'A1');

      // 查找元数据行（通常是第3行，包含"报表日期"等信息）
      for (let row = range.s.r; row <= Math.min(range.s.r + 5, range.e.r); row++) {
        const firstCellRef = XLSXStyle.utils.encode_cell({ r: row, c: range.s.c });
        if (ws[firstCellRef] && ws[firstCellRef].v) {
          const cellValue = String(ws[firstCellRef].v);

          // 检查是否是元数据行（包含"报表日期"、"数据条数"等）
          if (cellValue.includes('报表日期') || cellValue.includes('数据条数')) {
            console.log(`📐 发现元数据行: 第${row + 1}行`);

            // 设置该行的对齐方式为右对齐
            for (let col = range.s.c; col <= range.e.c; col++) {
              const cellRef = XLSXStyle.utils.encode_cell({ r: row, c: col });
              if (ws[cellRef]) {
                if (!ws[cellRef].s) ws[cellRef].s = {};
                if (!ws[cellRef].s.alignment) ws[cellRef].s.alignment = {};
                ws[cellRef].s.alignment.horizontal = 'right';
                console.log(`📐 设置单元格${cellRef}右对齐`);
              }
            }
            break; // 找到一行就够了
          }
        }
      }

      console.log('📐 元数据行对齐设置完成');
    } catch (error) {
      console.error('设置元数据行对齐失败:', error);
    }
  }

  /**
   * 获取行类型
   */
  static _getRowType(row: HTMLElement): string {
    if (row.hasAttribute('data-row-type')) {
      return row.getAttribute('data-row-type') || 'data';
    }

    // 检查CSS类名
    if (row.classList.contains('ddr-subtotal-row')) {
      return 'subtotal';
    }
    if (row.classList.contains('ddr-total-row')) {
      return 'total';
    }

    return 'data';
  }

  /**
   * 检查单元格是否被合并覆盖
   */
  static _isCellMerged(merges: any[], row: number, col: number): boolean {
    return merges.some(merge => {
      return row >= merge.s.r && row <= merge.e.r &&
             col >= merge.s.c && col <= merge.e.c &&
             !(row === merge.s.r && col === merge.s.c); // 排除合并的起始单元格
    });
  }

  /**
   * 验证合并单元格的有效性
   */
  static _validateMerges(merges: any[], ws: any): any[] {
    const validMerges: any[] = [];

    if (!ws['!ref']) {
      console.warn('工作表没有有效范围，跳过合并单元格验证');
      return validMerges;
    }

    const range = XLSXStyle.utils.decode_range(ws['!ref']);

    for (const merge of merges) {
      try {
        // 基本结构检查
        if (!merge || !merge.s || !merge.e) {
          console.warn('跳过无效合并单元格：缺少起始或结束位置', merge);
          continue;
        }

        const { s, e } = merge;

        // 检查坐标类型
        if (typeof s.r !== 'number' || typeof s.c !== 'number' ||
            typeof e.r !== 'number' || typeof e.c !== 'number') {
          console.warn('跳过无效合并单元格：坐标不是数字', merge);
          continue;
        }

        // 检查坐标范围
        if (s.r < 0 || s.c < 0 || e.r < 0 || e.c < 0) {
          console.warn('跳过无效合并单元格：坐标为负数', merge);
          continue;
        }

        // 检查是否超出工作表范围
        if (s.r > range.e.r || s.c > range.e.c || e.r > range.e.r || e.c > range.e.c) {
          console.warn('跳过无效合并单元格：超出工作表范围', merge);
          continue;
        }

        // 检查起始位置是否小于等于结束位置
        if (s.r > e.r || s.c > e.c) {
          console.warn('跳过无效合并单元格：起始位置大于结束位置', merge);
          continue;
        }

        // 检查是否是单个单元格
        if (s.r === e.r && s.c === e.c) {
          console.warn('跳过单个单元格合并：', merge);
          continue;
        }

        // 检查Excel限制
        if (s.r >= 1048576 || s.c >= 16384 || e.r >= 1048576 || e.c >= 16384) {
          console.warn('跳过超出Excel限制的合并单元格：', merge);
          continue;
        }

        // 通过所有检查
        validMerges.push(merge);
        console.log(`✅ 有效合并单元格：${XLSXStyle.utils.encode_cell(s)}:${XLSXStyle.utils.encode_cell(e)}`);

      } catch (error) {
        console.warn('验证合并单元格时出错：', error, merge);
      }
    }

    return validMerges;
  }

  /**
   * 颜色转十六进制（支持多种格式）
   */
  static _rgbToHex(color: string): string {
    if (!color || color === 'transparent') return 'FFFFFF';

    // 如果已经是十六进制格式，直接处理
    if (color.startsWith('#')) {
      let hex = color.substring(1);

      // 处理3位十六进制颜色（如 #fff -> #ffffff）
      if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
      }

      return hex.toUpperCase().padStart(6, '0');
    }

    // 处理rgb格式
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1]);
      const g = parseInt(rgbMatch[2]);
      const b = parseInt(rgbMatch[3]);
      return ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0').toUpperCase();
    }

    // 处理rgba格式
    const rgbaMatch = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/);
    if (rgbaMatch) {
      const r = parseInt(rgbaMatch[1]);
      const g = parseInt(rgbaMatch[2]);
      const b = parseInt(rgbaMatch[3]);
      return ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0').toUpperCase();
    }

    // 处理命名颜色
    const namedColors: { [key: string]: string } = {
      'white': 'FFFFFF',
      'black': '000000',
      'red': 'FF0000',
      'green': '008000',
      'blue': '0000FF',
      'gray': '808080',
      'grey': '808080'
    };

    if (namedColors[color.toLowerCase()]) {
      return namedColors[color.toLowerCase()];
    }

    console.warn(`无法解析颜色: "${color}", 使用默认白色`);
    return 'FFFFFF';
  }

  /**
   * 应用基础样式到Excel（兼容性更好的方法）
   */
  static applyBasicStylesToExcel(ws: any, data: any[][]): void {
    console.log('开始应用基础样式到Excel');

    try {
      // 获取数据范围
      const range = XLSXStyle.utils.decode_range(ws['!ref'] || 'A1');

      // 应用表头样式（第一行）
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellRef = XLSXStyle.utils.encode_cell({ r: 0, c: col });
        if (ws[cellRef]) {
          ws[cellRef].s = {
            font: { bold: true, sz: 12 },
            fill: { fgColor: { rgb: "DDDDDD" } },
            alignment: { horizontal: "center", vertical: "center" }
          };
          console.log(`应用表头样式到 ${cellRef}`);
        }
      }

      // 应用数据行样式
      for (let row = 1; row <= range.e.r; row++) {
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellRef = XLSXStyle.utils.encode_cell({ r: row, c: col });
          if (ws[cellRef]) {
            ws[cellRef].s = {
              font: { sz: 10 },
              alignment: { vertical: "center" }
            };
          }
        }
      }

      console.log('基础样式应用完成');
    } catch (error) {
      console.error('应用基础样式失败:', error);
    }
  }

  /**
   * 应用增强样式到Excel（使用更多样式特性）
   */
  static applyEnhancedStylesToExcel(ws: any, data: any[][]): void {
    console.log('开始应用增强样式到Excel');

    try {
      // 获取数据范围
      const range = XLSXStyle.utils.decode_range(ws['!ref'] || 'A1');

      // 定义样式
      const headerStyle = {
        font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4472C4" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
        }
      };

      const dataStyle = {
        font: { sz: 10 },
        alignment: { vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "CCCCCC" } },
          bottom: { style: "thin", color: { rgb: "CCCCCC" } },
          left: { style: "thin", color: { rgb: "CCCCCC" } },
          right: { style: "thin", color: { rgb: "CCCCCC" } }
        }
      };

      const alternateRowStyle = {
        font: { sz: 10 },
        fill: { fgColor: { rgb: "F8F9FA" } },
        alignment: { vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "CCCCCC" } },
          bottom: { style: "thin", color: { rgb: "CCCCCC" } },
          left: { style: "thin", color: { rgb: "CCCCCC" } },
          right: { style: "thin", color: { rgb: "CCCCCC" } }
        }
      };

      // 应用表头样式（第一行）
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellRef = XLSXStyle.utils.encode_cell({ r: 0, c: col });
        if (ws[cellRef]) {
          ws[cellRef].s = headerStyle;
          console.log(`应用增强表头样式到 ${cellRef}`);
        }
      }

      // 应用数据行样式（交替行颜色）
      for (let row = 1; row <= range.e.r; row++) {
        const isAlternateRow = row % 2 === 0;
        const rowStyle = isAlternateRow ? alternateRowStyle : dataStyle;

        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellRef = XLSXStyle.utils.encode_cell({ r: row, c: col });
          if (ws[cellRef]) {
            ws[cellRef].s = rowStyle;
          }
        }
      }

      // 设置列宽
      if (!ws['!cols']) ws['!cols'] = [];
      for (let col = range.s.c; col <= range.e.c; col++) {
        ws['!cols'][col] = { wch: 15 }; // 设置列宽为15字符
      }

      console.log('增强样式应用完成');
    } catch (error) {
      console.error('应用增强样式失败，回退到基础样式:', error);
      // 回退到基础样式
      this.applyBasicStylesToExcel(ws, data);
    }
  }

  /**
   * 将RGB颜色转换为十六进制
   */
  static rgbToHex(rgb: string): string {
    if (!rgb || rgb === 'transparent') return 'FFFFFF';

    const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      const r = parseInt(match[1]);
      const g = parseInt(match[2]);
      const b = parseInt(match[3]);
      return ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0').toUpperCase();
    }

    return 'FFFFFF';
  }

  /**
   * 将CSS文本对齐转换为Excel对齐
   */
  static getExcelAlignment(textAlign: string): string {
    switch (textAlign) {
      case 'center': return 'center';
      case 'right': return 'right';
      case 'justify': return 'justify';
      default: return 'left';
    }
  }

  /**
   * 导出为PDF
   * @param element 要导出的DOM元素
   * @param config 报表配置
   * @param options 导出选项
   */
  static async toPDF(element: HTMLElement, config?: any, options: ExportOptions = {}): Promise<void> {
    try {
      console.log('PDF导出开始，使用内置jsPDF库');

      // 默认选项
      const {
        fileName = '报表',
        watermark,  // 不设置默认值，让后续逻辑处理
        pdf: pdfOptions = {}
      } = options;

      // 从配置中获取PDF设置，选项可以覆盖配置
      const configPdfSettings = config?.features?.pdfConfig || {};
      const mergedPdfOptions = { ...configPdfSettings, ...pdfOptions };

      // 水印处理：优先使用方法参数，其次使用配置，最后使用空字符串
      const finalWatermark = watermark !== undefined ? watermark : (config?.features?.watermark || '');

      // 调试信息：输出PDF配置和水印处理
      console.log('PDF导出配置:', {
        configPdfSettings,
        pdfOptions,
        mergedPdfOptions
      });
      console.log('水印处理:', {
        '方法参数watermark': watermark,
        '配置中的watermark': config?.features?.watermark,
        '最终使用的watermark': finalWatermark
      });

      // PDF配置
      const pageSize = mergedPdfOptions.pageSize || 'A4';
      const orientation = mergedPdfOptions.orientation || 'portrait';
      const quality = mergedPdfOptions.quality || 0.95;
      const multiPage = mergedPdfOptions.multiPage !== false;
      const relayout = mergedPdfOptions.relayout !== false; // 默认重新排版

      console.log(`PDF设置 - 页面大小: ${pageSize}, 方向: ${orientation}, 重新排版: ${relayout}`);

      // 设置页边距(mm)
      const margins = {
        top: mergedPdfOptions.margins?.top || 15,
        right: mergedPdfOptions.margins?.right || 15,
        bottom: mergedPdfOptions.margins?.bottom || 15,
        left: mergedPdfOptions.margins?.left || 15
      };

      // 保存原始滚动位置
      const originalScrollTop = element.scrollTop;

      // 创建临时容器
      const tempContainer = element.cloneNode(true) as HTMLElement;
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.overflow = 'visible';
      tempContainer.style.height = 'auto';

      // 如果启用重新排版，设置PDF适合的宽度
      if (relayout) {
        // 根据PDF页面方向设置合适的宽度
        const pdfWidth = orientation === 'landscape' ?
          (pageSize === 'A4' ? 297 : 279) : // A4横版297mm, Letter横版279mm
          (pageSize === 'A4' ? 210 : 216);  // A4竖版210mm, Letter竖版216mm

        // 考虑页边距，设置内容宽度(转换为px，假设96dpi)
        const contentWidthMm = pdfWidth - margins.left - margins.right;
        // 调整DPI比例，使横版能显示更多内容
        const dpiRatio = orientation === 'landscape' ? 4.0 : 3.78; // 横版使用稍高的DPI
        const contentWidthPx = Math.floor(contentWidthMm * dpiRatio);

        tempContainer.style.width = contentWidthPx + 'px';
        tempContainer.style.maxWidth = contentWidthPx + 'px';

        // 强制表格重新计算布局，应用横/竖版适当的样式
        const tableElements = tempContainer.querySelectorAll('table');
        tableElements.forEach(table => {
          const tableElem = table as HTMLElement;
          tableElem.style.width = '100%';
          tableElem.style.tableLayout = 'fixed';

          // 横版时特殊处理，使表格更合理利用空间
          if (orientation === 'landscape') {
            // 横版时调整单元格尺寸，使文本更紧凑
            const cells = tableElem.querySelectorAll('td, th');
            cells.forEach(cell => {
              (cell as HTMLElement).style.padding = '3px 4px'; // 减小内边距
            });
          }
        });
      } else {
        // 缩放模式：保持原始宽度，但确保等比例缩放
        tempContainer.style.width = element.clientWidth + 'px';
        console.log('使用缩放模式，保持原始宽度:', element.clientWidth + 'px');
      }

      document.body.appendChild(tempContainer);

      // 确保所有内容可见
      const headerElement = tempContainer.querySelector('.ddr-report-header') as HTMLElement;
      const footerElement = tempContainer.querySelector('.ddr-report-footer') as HTMLElement;
      const tableContainer = tempContainer.querySelector('.ddr-table-container') as HTMLElement;

      // 检查必要的元素是否存在
      if (!tableContainer) {
        console.warn('未找到表格容器元素，导出可能不完整');
      }

      // 优化DOM结构以便更好地导出
      if (tableContainer) {
        tableContainer.style.maxHeight = 'none';
        tableContainer.style.height = 'auto';
        tableContainer.style.overflow = 'visible';

        // 确保表格内容正确显示
        const tableElement = tableContainer.querySelector('table');
        if (tableElement) {
          // 确保表格宽度正确
          tableElement.style.width = '100%';

          // 确保所有单元格都有适当的边框
          const cells = tableElement.querySelectorAll('td, th');
          cells.forEach(cell => {
            (cell as HTMLElement).style.border = '1px solid #ddd';
          });
        }
      }

      // 优化表头和表尾
      if (headerElement) {
        headerElement.style.position = 'relative';
        headerElement.style.height = 'auto';
        headerElement.style.overflow = 'visible';
      }

      if (footerElement) {
        footerElement.style.position = 'relative';
        footerElement.style.height = 'auto';
        footerElement.style.overflow = 'visible';
      }
        // 初始化PDF
      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format: pageSize
      });

      // 设置中文支持
      setupChineseSupport(pdf);

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // 内容区域高度（减去页边距）
      const contentHeight = pageHeight - margins.top - margins.bottom;
      const contentWidth = pageWidth - margins.left - margins.right;

      // 设置字体大小
      pdf.setFontSize(12);

      if (multiPage) {
        // -------------- 多页处理 --------------

        // 表头高度(如果有) - 优先使用配置，其次精确测量实际高度
        let headerHeight = 0;
        let headerCanvas;
        if (headerElement) {
          try {
            // 首先获取元素的实际像素尺寸
            const headerRect = headerElement.getBoundingClientRect();
            console.log(`📏 报表头DOM尺寸：${Math.round(headerRect.width)}px × ${Math.round(headerRect.height)}px`);

            headerCanvas = await html2canvas(headerElement, {
              scale: 2.0, // 适中的清晰度
              useCORS: true,
              logging: false,
              allowTaint: true,
              backgroundColor: '#FFFFFF' // 确保背景色一致
            });

            // 优先使用layout.headerHeight配置
            if (config?.layout?.headerHeight) {
              const configHeaderHeightPx = typeof config.layout.headerHeight === 'number'
                ? config.layout.headerHeight
                : parseInt(config.layout.headerHeight);
              headerHeight = (configHeaderHeightPx * 25.4) / 96; // 像素转毫米
              console.log(`📏 使用配置表头高度：${configHeaderHeightPx}px → ${Math.round(headerHeight * 100) / 100}mm`);
            } else {
              // 回退到基于Canvas和DOM的比例关系计算PDF中的实际高度
              headerHeight = (headerCanvas.height / headerCanvas.width) * contentWidth;
              console.log(`📏 使用自动计算表头高度：${Math.round(headerHeight * 100) / 100}mm`);
            }

            console.log(`📏 报表头Canvas尺寸：${headerCanvas.width}px × ${headerCanvas.height}px`);
            console.log(`📏 报表头最终高度：${Math.round(headerHeight * 100) / 100}mm`);
          } catch (e) {
            console.warn('渲染表头时出错:', e);
          }
        }

        // 表尾高度(如果有) - 精确测量实际高度
        let footerHeight = 0;
        let footerCanvas;
        if (footerElement) {
          try {
            // 首先获取元素的实际像素尺寸
            const footerRect = footerElement.getBoundingClientRect();
            console.log(`📏 报表尾DOM尺寸：${Math.round(footerRect.width)}px × ${Math.round(footerRect.height)}px`);

            footerCanvas = await html2canvas(footerElement, {
              scale: 2.0, // 适中的清晰度
              useCORS: true,
              logging: false,
              allowTaint: true,
              backgroundColor: '#FFFFFF' // 确保背景色一致
            });

            // 基于Canvas和DOM的比例关系计算PDF中的实际高度
            // 这样可以避免DPI假设的问题
            footerHeight = (footerCanvas.height / footerCanvas.width) * contentWidth;

            console.log(`📏 报表尾Canvas尺寸：${footerCanvas.width}px × ${footerCanvas.height}px`);
            console.log(`📏 报表尾实际高度：${Math.round(footerHeight * 100) / 100}mm`);
          } catch (e) {
            console.warn('渲染表尾时出错:', e);
          }
        }

        // 提取表格部分
        const tableElement = tableContainer?.querySelector('table') || tableContainer;
        if (!tableElement) {
          throw new Error('找不到表格元素');
        }

        // 获取表格的实际DOM尺寸
        const tableRect = tableElement.getBoundingClientRect();
        console.log(`📏 表格DOM尺寸：${Math.round(tableRect.width)}px × ${Math.round(tableRect.height)}px`);

        // 将表格转换为canvas，提高清晰度
        let tableCanvas;
        let tableWidth;
        let tableHeight;

        try {
          tableCanvas = await html2canvas(tableElement, {
            scale: 2.0, // 适中的清晰度
            useCORS: true,
            logging: false,
            allowTaint: true,
            backgroundColor: '#FFFFFF' // 确保背景色一致
          });

          // 基于Canvas和DOM的比例关系计算PDF中的实际尺寸
          tableWidth = contentWidth; // PDF内容区域宽度
          tableHeight = (tableCanvas.height / tableCanvas.width) * tableWidth; // 基于Canvas比例计算

          console.log(`📏 表格Canvas尺寸：${tableCanvas.width}px × ${tableCanvas.height}px`);
          console.log(`📏 表格实际高度：${Math.round(tableHeight * 100) / 100}mm`);

          // 计算表格行数信息
          const rows = tableElement.querySelectorAll('tr');
          const totalRows = rows.length;

          // 计算表头行数
          let headerRowCount = 0;
          for (let i = 0; i < rows.length; i++) {
            if (rows[i].querySelector('th')) {
              headerRowCount++;
            } else {
              break; // 遇到第一个非表头行就停止
            }
          }

          const dataRowCount = totalRows - headerRowCount;
          console.log(`📊 表格行数统计：总行数=${totalRows}, 表头行数=${headerRowCount}, 数据行数=${dataRowCount}`);

          // 重构分页算法 - 精确计算每页可用空间和行数
          console.log(`🔍 开始重构PDF分页算法...`);

          // 1. 精确测量各部分实际高度（毫米）
          let actualHeaderHeightMM = 0;
          let actualFooterHeightMM = 0;

          if (headerCanvas) {
            actualHeaderHeightMM = headerHeight;
            console.log(`📏 报表头实际高度：${Math.round(actualHeaderHeightMM)}mm`);
          }

          if (footerCanvas) {
            actualFooterHeightMM = footerHeight;
            console.log(`📏 报表尾实际高度：${Math.round(actualFooterHeightMM)}mm`);
          }

          // 2. 计算单行数据高度 - 保守但准确的方式
          let dataRowHeightMM: number;

          // 使用Canvas中的平均行高，这与实际渲染更一致
          const avgRowHeightCanvas = tableCanvas.height / totalRows;
          dataRowHeightMM = (avgRowHeightCanvas / tableCanvas.height) * tableHeight;

          console.log(`📏 Canvas行高计算：总高度${tableCanvas.height}px ÷ ${totalRows}行 = ${Math.round(avgRowHeightCanvas * 100) / 100}px/行`);
          console.log(`📏 PDF行高：${Math.round(dataRowHeightMM * 100) / 100}mm/行`);

          // 如果有配置的行高，进行对比但不直接使用（避免溢出）
          if (config?.layout?.rowHeight) {
            const configRowHeightPx = typeof config.layout.rowHeight === 'number'
              ? config.layout.rowHeight
              : parseInt(config.layout.rowHeight);
            const configRowHeightMM = (configRowHeightPx * 25.4) / 96;

            console.log(`📏 配置行高：${configRowHeightPx}px → ${Math.round(configRowHeightMM * 100) / 100}mm`);
            console.log(`📏 Canvas行高：${Math.round(dataRowHeightMM * 100) / 100}mm`);
            console.log(`📏 使用Canvas行高以确保数据完整性`);
          }

          // 3. 页面布局常量 - 保守的空间配置
          const pageNumberReserve = 15; // 页码预留空间(mm) - 适中预留
          const contentGap = 0; // 内容间距(mm) - 移除间距实现无缝连接
          const safetyMargin = 3; // 安全边距(mm) - 适中安全边距

          console.log(`📐 页面布局参数：`);
          console.log(`- 页面总高度：${Math.round(pageHeight)}mm`);
          console.log(`- 上下边距：${margins.top + margins.bottom}mm`);
          console.log(`- 页码预留：${pageNumberReserve}mm`);
          console.log(`- 安全边距：${safetyMargin}mm`);

          // 4. 计算各页类型的可用数据高度
          const baseAvailableHeight = pageHeight - margins.top - margins.bottom - pageNumberReserve - safetyMargin;

          const firstPageDataHeight = baseAvailableHeight - actualHeaderHeightMM - contentGap;
          const middlePageDataHeight = baseAvailableHeight;
          const lastPageDataHeight = baseAvailableHeight - actualFooterHeightMM - contentGap;

          console.log(`📐 各页可用数据高度：`);
          console.log(`- 第一页数据区：${Math.round(firstPageDataHeight)}mm`);
          console.log(`- 中间页数据区：${Math.round(middlePageDataHeight)}mm`);
          console.log(`- 最后页数据区：${Math.round(lastPageDataHeight)}mm`);

          // 5. 保守计算各页最大行数 - 确保数据完整性
          const firstPageMaxRows = Math.floor(firstPageDataHeight / dataRowHeightMM);
          const middlePageMaxRows = Math.floor(middlePageDataHeight / dataRowHeightMM);
          const lastPageMaxRows = Math.floor(lastPageDataHeight / dataRowHeightMM);

          console.log(`📊 保守计算的各页最大行数：`);
          console.log(`- 第一页：${firstPageMaxRows}行 (${Math.round(firstPageDataHeight)}mm ÷ ${Math.round(dataRowHeightMM * 100) / 100}mm)`);
          console.log(`- 中间页：${middlePageMaxRows}行 (${Math.round(middlePageDataHeight)}mm ÷ ${Math.round(dataRowHeightMM * 100) / 100}mm)`);
          console.log(`- 最后页：${lastPageMaxRows}行 (${Math.round(lastPageDataHeight)}mm ÷ ${Math.round(dataRowHeightMM * 100) / 100}mm)`);

          // 验证计算准确性
          console.log(`🔍 空间利用率验证：`);
          console.log(`- 第一页：${firstPageMaxRows}行 × ${Math.round(dataRowHeightMM * 100) / 100}mm = ${Math.round(firstPageMaxRows * dataRowHeightMM)}mm，可用${Math.round(firstPageDataHeight)}mm，利用率${Math.round((firstPageMaxRows * dataRowHeightMM / firstPageDataHeight) * 100)}%`);
          console.log(`- 中间页：${middlePageMaxRows}行 × ${Math.round(dataRowHeightMM * 100) / 100}mm = ${Math.round(middlePageMaxRows * dataRowHeightMM)}mm，可用${Math.round(middlePageDataHeight)}mm，利用率${Math.round((middlePageMaxRows * dataRowHeightMM / middlePageDataHeight) * 100)}%`);

          // 6. 重构分页算法 - 确保数据完整性
          const pageBreakPoints: Array<{yPercent: number; endRow: number}> = [];
          let processedRows = 0;
          let pageIndex = 0;

          console.log(`🔄 开始智能分页算法，总数据行数：${dataRowCount}`);

          while (processedRows < dataRowCount) {
            let maxRowsThisPage: number;

            if (pageIndex === 0) {
              // 第一页：包含报表头
              maxRowsThisPage = firstPageMaxRows;
              console.log(`📄 第${pageIndex + 1}页（首页）：最大可容纳${maxRowsThisPage}行`);
            } else {
              // 检查是否为最后一页
              const remainingRows = dataRowCount - processedRows;

              if (remainingRows <= lastPageMaxRows) {
                // 最后一页：需要容纳报表尾
                maxRowsThisPage = remainingRows;
                console.log(`📄 第${pageIndex + 1}页（末页）：显示剩余${remainingRows}行`);
              } else {
                // 中间页：全部用于数据
                maxRowsThisPage = middlePageMaxRows;
                console.log(`📄 第${pageIndex + 1}页（中间页）：最大可容纳${maxRowsThisPage}行`);
              }
            }

            const rowsThisPage = Math.min(maxRowsThisPage, dataRowCount - processedRows);
            processedRows += rowsThisPage;

            console.log(`📊 第${pageIndex + 1}页实际显示：${rowsThisPage}行，累计处理：${processedRows}/${dataRowCount}行`);

            // 如果还有剩余数据，创建分页点
            if (processedRows < dataRowCount) {
              // 精确计算分页点位置
              const headerHeightRatio = actualHeaderHeightMM / tableHeight;
              const dataAreaHeightRatio = 1 - headerHeightRatio - (actualFooterHeightMM / tableHeight);
              const processedRowsRatio = processedRows / dataRowCount;
              const breakYPercent = headerHeightRatio + (processedRowsRatio * dataAreaHeightRatio);

              pageBreakPoints.push({
                yPercent: breakYPercent,
                endRow: processedRows
              });

              console.log(`📍 创建分页点${pageIndex + 1}：第${processedRows}行结束，Y=${Math.round(breakYPercent * 100)}%`);
            }

            pageIndex++;
          }

          console.log(`✅ 分页算法完成：共${pageIndex}页，处理${processedRows}行数据，创建${pageBreakPoints.length}个分页点`);

          // 计算总页数
          const pagesNeeded = pageBreakPoints.length + 1;
          console.log(`📊 总计需要 ${pagesNeeded} 页显示 ${dataRowCount} 行数据`);

          // 表格各部分的图像数据
          const headerImgData = headerCanvas ? headerCanvas.toDataURL('image/jpeg', quality) : null;
          const footerImgData = footerCanvas ? footerCanvas.toDataURL('image/jpeg', quality) : null;

          // 检查最后一页是否需要额外页面显示报表尾
          if (footerImgData) {
            const lastPageRows = pageBreakPoints.length > 0 ?
              dataRowCount - pageBreakPoints[pageBreakPoints.length - 1].endRow :
              dataRowCount;
            const lastPageDataHeightUsed = lastPageRows * dataRowHeightMM;
            const lastPageRemainingHeight = lastPageDataHeight - lastPageDataHeightUsed;

            console.log(`📋 报表尾检查：`);
            console.log(`- 最后一页数据行数：${lastPageRows}`);
            console.log(`- 最后一页数据占用高度：${Math.round(lastPageDataHeightUsed)}mm`);
            console.log(`- 最后一页剩余高度：${Math.round(lastPageRemainingHeight)}mm`);
            console.log(`- 报表尾需要高度：${Math.round(actualFooterHeightMM + contentGap)}mm`);

            if (lastPageRemainingHeight < actualFooterHeightMM + contentGap) {
              console.log(`⚠️ 最后一页空间不足，报表尾将在新页显示`);
            } else {
              console.log(`✅ 最后一页空间充足，报表尾将在当前页显示`);
            }
          }

          // 逐页添加内容
          for (let page = 0; page < pagesNeeded; page++) {
            // 如果不是第一页，创建新页
            if (page > 0) {
              pdf.addPage();
            }

            let yOffset = margins.top;

            // 添加报表头（只在第一页显示）
            if (headerImgData && page === 0) {
              pdf.addImage(
                headerImgData,
                'JPEG',
                margins.left,
                yOffset,
                contentWidth,
                headerHeight
              );
              yOffset += headerHeight; // 移除额外间距，实现无缝连接
            }

            // 添加表格标题行（根据配置决定是否在每页显示）
            const repeatTableHeader = mergedPdfOptions.repeatTableHeader !== false; // 默认为true
            if (repeatTableHeader && page > 0 && headerRowCount > 0) {
              // 在非首页添加表格标题行
              try {
                console.log(`📄 第${page + 1}页添加表格标题行`);

                // 创建只包含表头的临时canvas（精确控制）
                const headerOnlyCanvas = document.createElement('canvas');
                headerOnlyCanvas.width = tableCanvas.width;

                // 精确计算表头高度
                const headerHeightInCanvas = (headerRowCount / totalRows) * tableCanvas.height;
                headerOnlyCanvas.height = Math.ceil(headerHeightInCanvas);

                const headerCtx = headerOnlyCanvas.getContext('2d');
                if (headerCtx) {
                  // 设置白色背景
                  headerCtx.fillStyle = '#ffffff';
                  headerCtx.fillRect(0, 0, headerOnlyCanvas.width, headerOnlyCanvas.height);

                  // 从原表格canvas中精确复制表头部分
                  headerCtx.drawImage(
                    tableCanvas,
                    0, 0, tableCanvas.width, headerHeightInCanvas,
                    0, 0, headerOnlyCanvas.width, headerOnlyCanvas.height
                  );

                  // 计算表头在PDF中的高度
                  const headerHeightInPDF = (headerOnlyCanvas.height / tableCanvas.height) * tableHeight;

                  // 将表头添加到PDF
                  const headerImgData = headerOnlyCanvas.toDataURL('image/jpeg', quality);
                  pdf.addImage(
                    headerImgData,
                    'JPEG',
                    margins.left,
                    yOffset,
                    contentWidth,
                    headerHeightInPDF
                  );

                  yOffset += headerHeightInPDF; // 不添加额外间距，确保与数据行紧密连接
                  console.log(`📄 第${page + 1}页表格标题行添加完成，高度：${Math.round(headerHeightInPDF)}mm`);
                }
              } catch (e) {
                console.warn(`第${page + 1}页添加表格标题行失败:`, e);
              }
            }

            // 计算当前页表格部分的起始位置和结束位置
            let tableStartPercent = 0;
            let tableEndPercent = 1;

            // 根据分页点计算每页内容范围
            if (pageBreakPoints.length > 0) {
              if (page === 0) {
                // 第一页：从开始到第一个分页点
                tableStartPercent = 0;
                tableEndPercent = pageBreakPoints[0].yPercent;

                const endRow = pageBreakPoints[0].endRow;
                console.log(`📄 第1页：显示表头+第1-${endRow}行，Y范围：0% 到 ${Math.round(pageBreakPoints[0].yPercent * 100)}%`);
              } else {
                // 后续页：从前一个分页点到当前分页点（或结束）
                tableStartPercent = pageBreakPoints[page - 1].yPercent;
                tableEndPercent = page < pageBreakPoints.length ? pageBreakPoints[page].yPercent : 1;

                const startRow = pageBreakPoints[page - 1].endRow + 1;
                const endRow = page < pageBreakPoints.length ? pageBreakPoints[page].endRow : dataRowCount;
                console.log(`📄 第${page + 1}页：显示第${startRow}-${endRow}行，Y范围：${Math.round(tableStartPercent * 100)}% 到 ${Math.round(tableEndPercent * 100)}%`);
              }
            } else {
              // 单页显示所有内容
              console.log(`📄 第${page + 1}页：显示所有内容（单页模式）`);
            }

            // 根据分页计算精确裁剪源图像
            let sourceY: number;
            let sourceHeight: number;
            let tablePartHeight: number;

            if (pageBreakPoints.length > 0) {
              // 多页模式：基于行边界进行精确裁剪
              if (page === 0) {
                // 第一页：从顶部开始到第一个分页点
                const endRow = pageBreakPoints[0].endRow;
                sourceY = 0; // 从表头开始

                // 基于行边界计算：表头 + 指定行数的数据
                const headerRowHeightCanvas = (headerRowCount / totalRows) * tableCanvas.height;
                const dataRowHeightCanvas = tableCanvas.height / totalRows; // 单行在Canvas中的高度
                const endRowHeightCanvas = headerRowHeightCanvas + (endRow * dataRowHeightCanvas);

                sourceHeight = Math.floor(endRowHeightCanvas);
                tablePartHeight = (sourceHeight / tableCanvas.height) * tableHeight;

                console.log(`📐 第1页行边界裁剪：表头${headerRowCount}行+数据${endRow}行，Canvas高度=${Math.round(sourceHeight)}px，PDF高度=${Math.round(tablePartHeight)}mm`);
              } else {
                // 后续页：只裁剪数据行部分（表头已单独添加）
                const startRow = pageBreakPoints[page - 1].endRow;
                const endRow = page < pageBreakPoints.length ? pageBreakPoints[page].endRow : dataRowCount;
                const rowsThisPage = endRow - startRow;

                console.log(`📐 第${page + 1}页数据行：第${startRow + 1}-${endRow}行（${rowsThisPage}行）`);

                // 计算数据行的裁剪范围（不包含表头）
                const headerRowHeightCanvas = (headerRowCount / totalRows) * tableCanvas.height;
                const dataRowHeightCanvas = tableCanvas.height / totalRows;

                // 从数据行开始裁剪，不包含表头，精确计算避免多余内容
                const startRowHeightCanvas = headerRowHeightCanvas + (startRow * dataRowHeightCanvas);
                const endRowHeightCanvas = headerRowHeightCanvas + (endRow * dataRowHeightCanvas);

                // 更精确的裁剪位置计算
                if (startRow === 0) {
                  // 如果是第一批数据行，从表头结束位置开始，但要包含第一行的完整上边框
                  sourceY = Math.floor(headerRowHeightCanvas - 1); // 向前包含1px确保边框完整
                } else {
                  // 非第一批数据行，精确从行开始位置裁剪
                  sourceY = Math.floor(startRowHeightCanvas);
                }

                // 精确计算结束位置，避免包含多余的竖线
                const endY = Math.floor(endRowHeightCanvas); // 精确到行结束位置，不包含额外内容
                sourceHeight = Math.min(endY - sourceY, tableCanvas.height - sourceY);
                tablePartHeight = (sourceHeight / tableCanvas.height) * tableHeight;

                console.log(`📐 第${page + 1}页数据行裁剪：第${startRow + 1}-${endRow}行，Canvas范围=${Math.round(sourceY)}-${Math.round(sourceY + sourceHeight)}px，PDF高度=${Math.round(tablePartHeight)}mm`);
              }
            } else {
              // 单页模式：使用原有逻辑
              sourceY = Math.floor(tableStartPercent * tableCanvas.height);
              sourceHeight = Math.ceil((tableEndPercent - tableStartPercent) * tableCanvas.height);
              tablePartHeight = (sourceHeight / tableCanvas.height) * tableHeight;

              console.log(`📐 单页模式：源高度=${Math.round(sourceHeight)}px，目标高度=${Math.round(tablePartHeight)}mm`);
            }

            // 验证可用空间并动态调整（更智能的空间利用）
            const maxAllowedHeight = pageHeight - yOffset - margins.bottom - pageNumberReserve;

            if (tablePartHeight > maxAllowedHeight) {
              console.warn(`⚠️ 第${page + 1}页内容高度${Math.round(tablePartHeight)}mm超出可用空间${Math.round(maxAllowedHeight)}mm`);
              // 动态调整：如果超出不多，可以压缩页码预留空间
              const overflow = tablePartHeight - maxAllowedHeight;
              if (overflow <= 8) { // 如果超出不超过8mm，可以压缩页码空间
                console.log(`📐 动态调整：压缩页码预留空间${Math.round(overflow)}mm`);
                // 继续使用原始高度，页码位置会自动调整
              }
            }

            try {
              // 创建临时canvas来保存裁剪的表格部分
              const pageTableCanvas = document.createElement('canvas');
              pageTableCanvas.width = tableCanvas.width;
              pageTableCanvas.height = sourceHeight;

              const pageTableCtx = pageTableCanvas.getContext('2d');
              if (pageTableCtx) {
                // 设置白色背景
                pageTableCtx.fillStyle = '#ffffff';
                pageTableCtx.fillRect(0, 0, pageTableCanvas.width, pageTableCanvas.height);

                // 将表格对应部分裁剪到新canvas
                pageTableCtx.drawImage(
                  tableCanvas,
                  0, sourceY, tableCanvas.width, sourceHeight,
                  0, 0, pageTableCanvas.width, pageTableCanvas.height
                );

                // 如果是非首页且没有表头，需要在顶部添加边框线
                if (page > 0 && (!repeatTableHeader || headerRowCount === 0)) {
                  // 在数据行顶部绘制边框线，补充被裁剪掉的上边框
                  pageTableCtx.strokeStyle = '#ddd';
                  pageTableCtx.lineWidth = 1;
                  pageTableCtx.beginPath();
                  pageTableCtx.moveTo(0, 0.5);
                  pageTableCtx.lineTo(pageTableCanvas.width, 0.5);
                  pageTableCtx.stroke();
                  console.log(`📄 第${page + 1}页添加顶部边框线（无表头模式）`);
                }

                // 将裁剪后的表格部分转换为图像数据
                const pageTableImgData = pageTableCanvas.toDataURL('image/jpeg', quality);

                // 添加裁剪后的表格部分
                pdf.addImage(
                  pageTableImgData,
                  'JPEG',
                  margins.left,
                  yOffset,
                  contentWidth,
                  tablePartHeight
                );

                yOffset += tablePartHeight;
              }
            } catch (e) {
              console.warn('处理表格页码时出错:', e);
            }

            // 添加页码（如果页数大于1）
            if (pagesNeeded > 1) {
              // 使用英文格式页码，避免中文乱码问题
              try {
                pdf.setFontSize(10);
                pdf.setTextColor(80, 80, 80);

                // 智能页码位置：根据内容高度动态调整
                const contentBottom = yOffset;
                const minPageNumberY = contentBottom + 5; // 内容下方至少5mm
                const maxPageNumberY = pageHeight - margins.bottom + 3; // 在底部边距内
                const pageNumberY = Math.min(maxPageNumberY, Math.max(minPageNumberY, pageHeight - 8));

                pdf.text(
                  `Page ${page + 1} / ${pagesNeeded}`,
                  pageWidth / 2,
                  pageNumberY,
                  { align: 'center' }
                );

                console.log(`第${page + 1}页添加页码，内容底部：${Math.round(contentBottom)}mm，页码位置：Y=${Math.round(pageNumberY)}mm`);
              } catch (e) {
                console.warn('页码渲染失败:', e);
              }
            }

            // 添加表尾（只在最后一页显示）
            if (footerImgData && page === pagesNeeded - 1) {
              // 计算表尾位置，确保不覆盖表格内容和页码
              const minFooterY = yOffset; // 表格内容下方无间距，实现无缝连接
              const maxFooterY = pageHeight - margins.bottom - pageNumberReserve - footerHeight; // 考虑页码空间

              const footerY = Math.max(minFooterY, maxFooterY);

              // 如果当前页没有足够空间显示表尾，则创建新页
              if (footerY + footerHeight > pageHeight - margins.bottom - pageNumberReserve) {
                console.log(`📄 表尾需要新页显示，当前页剩余空间不足`);
                pdf.addPage();

                // 在新页添加表尾
                pdf.addImage(
                  footerImgData,
                  'JPEG',
                  margins.left,
                  margins.top,
                  contentWidth,
                  footerHeight
                );

                // 在新页添加页码
                if (pagesNeeded > 1) {
                  const newPageNumber = pagesNeeded + 1; // 新增的表尾页
                  pdf.setFontSize(10);
                  pdf.setTextColor(80, 80, 80);
                  const pageNumberY = pageHeight - margins.bottom + 3;
                  pdf.text(
                    `Page ${newPageNumber} / ${newPageNumber}`,
                    pageWidth / 2,
                    pageNumberY,
                    { align: 'center' }
                  );
                }

                // 在新页添加水印
                if (finalWatermark) {
                  try {
                    const watermarkCanvas = document.createElement('canvas');
                    watermarkCanvas.width = 400;
                    watermarkCanvas.height = 100;
                    const ctx = watermarkCanvas.getContext('2d');

                    if (ctx) {
                      ctx.font = '40px Arial, sans-serif';
                      ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
                      ctx.textAlign = 'center';
                      ctx.textBaseline = 'middle';
                      ctx.translate(200, 50);
                      ctx.rotate(45 * Math.PI / 180);
                      ctx.fillText(finalWatermark, 0, 0);

                      const watermarkImgData = watermarkCanvas.toDataURL('image/png');
                      pdf.addImage(
                        watermarkImgData,
                        'PNG',
                        pageWidth / 2 - 50,
                        pageHeight / 2 - 12.5,
                        100,
                        25,
                        undefined,
                        'NONE'
                      );
                    }
                  } catch (e) {
                    console.warn('新页水印添加失败:', e);
                  }
                }
              } else {
                // 在当前页添加表尾
                console.log(`📄 在第${page + 1}页添加表尾，位置：Y=${Math.round(footerY)}mm`);
                pdf.addImage(
                  footerImgData,
                  'JPEG',
                  margins.left,
                  footerY,
                  contentWidth,
                  footerHeight
                );
              }
            }

            // 在每页添加水印 - 改进版：全页面平铺水印
            if (finalWatermark) {
              try {
                console.log(`第${page + 1}页开始添加全页面水印: "${finalWatermark}"`);

                // 创建全页面水印Canvas
                const watermarkCanvas = document.createElement('canvas');

                // 根据PDF页面尺寸设置Canvas尺寸（提高分辨率）
                const scale = 2; // 提高清晰度
                watermarkCanvas.width = pageWidth * scale * 4; // 转换为像素并放大
                watermarkCanvas.height = pageHeight * scale * 4;

                const ctx = watermarkCanvas.getContext('2d');
                if (!ctx) {
                  throw new Error('无法创建canvas上下文');
                }

                // 设置透明背景
                ctx.clearRect(0, 0, watermarkCanvas.width, watermarkCanvas.height);

                // 计算水印文字的合适大小
                const textLength = finalWatermark.length;
                let fontSize = Math.max(24, Math.min(48, 600 / textLength)); // 根据文字长度动态调整字体大小
                ctx.font = `${fontSize}px Arial, sans-serif`;
                ctx.fillStyle = 'rgba(180, 180, 180, 0.15)'; // 更淡的水印
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                // 测量文字尺寸
                const textMetrics = ctx.measureText(finalWatermark);
                const textWidth = textMetrics.width;
                const textHeight = fontSize;

                // 计算平铺间距（确保水印不会重叠且覆盖整个页面）
                const spacingX = textWidth * 1.8; // 水平间距
                const spacingY = textHeight * 4.5; // 垂直间距 - 增加上下间距

                // 计算需要的行列数（确保完全覆盖页面）
                const cols = Math.ceil(watermarkCanvas.width / spacingX) + 2;
                const rows = Math.ceil(watermarkCanvas.height / spacingY) + 2;

                console.log(`水印参数: 字体${fontSize}px, 文字宽度${Math.round(textWidth)}px, 间距${Math.round(spacingX)}x${Math.round(spacingY)}px, 网格${cols}x${rows}`);

                // 平铺绘制水印
                for (let row = 0; row < rows; row++) {
                  for (let col = 0; col < cols; col++) {
                    ctx.save();

                    // 计算当前水印位置
                    const x = (col * spacingX) - spacingX / 2;
                    const y = (row * spacingY) - spacingY / 2;

                    // 移动到水印位置
                    ctx.translate(x, y);

                    // 旋转45度
                    ctx.rotate(45 * Math.PI / 180);

                    // 绘制水印文字
                    ctx.fillText(finalWatermark, 0, 0);

                    ctx.restore();
                  }
                }

                // 将canvas转换为图像
                const watermarkImgData = watermarkCanvas.toDataURL('image/png');

                // 添加水印图像到PDF（覆盖整个页面）
                pdf.addImage(
                  watermarkImgData,
                  'PNG',
                  0, // 从页面左上角开始
                  0,
                  pageWidth, // 覆盖整个页面宽度
                  pageHeight, // 覆盖整个页面高度
                  undefined,
                  'NONE'
                );

                console.log(`第${page + 1}页成功添加全页面平铺水印`);

              } catch (watermarkError) {
                console.warn(`第${page + 1}页添加水印失败，尝试简化水印:`, watermarkError);

                // 降级方案：使用PDF原生文字水印
                try {
                  pdf.setTextColor(200, 200, 200);
                  pdf.setFontSize(30);

                  // 在页面中心添加单个水印
                  const centerX = pageWidth / 2;
                  const centerY = pageHeight / 2;

                  pdf.text(finalWatermark, centerX, centerY, {
                    align: 'center',
                    baseline: 'middle',
                    angle: 45
                  });

                  console.log(`第${page + 1}页添加简化水印: "${finalWatermark}"`);
                } catch (fallbackError) {
                  console.warn(`第${page + 1}页简化水印也失败:`, fallbackError);
                }
              }
            }

            // 注意：新页的添加已经在循环开始时处理了，这里不需要重复添加
          }
        } catch (e) {
          console.warn('处理表格时出错:', e);
          // 降级处理：使用html2canvas对整个元素截图
          const canvas = await html2canvas(tempContainer, {
            scale: 1.5,
            useCORS: true,
            logging: false,
            allowTaint: true,
            backgroundColor: '#FFFFFF'
          });

          const imgData = canvas.toDataURL('image/jpeg', quality);

          // 计算等比例缩放尺寸
          const canvasAspectRatio = canvas.width / canvas.height;
          const pageAspectRatio = contentWidth / contentHeight;

          let imgWidth, imgHeight;

          if (relayout) {
            // 重新排版模式：使用内容区域的完整宽度
            imgWidth = contentWidth;
            imgHeight = (canvas.height / canvas.width) * imgWidth;
            console.log('重新排版模式 - 图像尺寸:', { imgWidth, imgHeight });
          } else {
            // 缩放模式：等比例缩放以适应页面
            if (canvasAspectRatio > pageAspectRatio) {
              // 图像更宽，以宽度为准
              imgWidth = contentWidth;
              imgHeight = imgWidth / canvasAspectRatio;
            } else {
              // 图像更高，以高度为准
              imgHeight = contentHeight;
              imgWidth = imgHeight * canvasAspectRatio;
            }
            console.log('缩放模式 - 等比例缩放图像尺寸:', { imgWidth, imgHeight, canvasAspectRatio, pageAspectRatio });
          }

          pdf.addImage(imgData, 'JPEG', margins.left, margins.top, imgWidth, imgHeight);
        }
      }

      // 水印已在每页循环中添加

      // 清理临时元素
      document.body.removeChild(tempContainer);

      // 恢复原始滚动位置
      element.scrollTop = originalScrollTop;

      // 保存文件
      pdf.save(`${fileName}.pdf`);

      return Promise.resolve();
    } catch (error) {
      console.error('PDF导出失败:', error);
      return Promise.reject(error);
    }
  }

  /**
   * 打印功能 - 重用PDF绘制逻辑
   * @param element 要打印的DOM元素
   * @param config 报表配置
   * @param options 打印选项
   */
  static async toPrint(element: HTMLElement, config?: any, options: ExportOptions = {}): Promise<void> {
    try {
      console.log('开始打印，重用PDF绘制逻辑');

      // 使用与PDF相同的处理逻辑，但生成HTML而不是PDF
      const {
        watermark,
        pdf: pdfOptions = {}
      } = options;

      // 从配置中获取PDF设置
      const configPdfSettings = config?.features?.pdfConfig || {};
      const mergedPdfOptions = { ...configPdfSettings, ...pdfOptions };

      // 水印处理
      const finalWatermark = watermark !== undefined ? watermark : (config?.features?.watermark || '');

      // 打印配置 - 使用A4纸张设置
      const orientation = mergedPdfOptions.orientation || 'portrait';
      const pageSize = mergedPdfOptions.pageSize || 'A4';

      console.log(`打印设置 - 页面大小: ${pageSize}, 方向: ${orientation}`);

      // 创建打印专用的临时容器
      const printContainer = await this._createPrintContainer(element, config, mergedPdfOptions, finalWatermark);

      // 创建打印样式
      const printStyle = this._createPrintStyle(orientation, pageSize);

      // 添加样式到页面
      document.head.appendChild(printStyle);

      // 将打印容器添加到页面（隐藏）
      printContainer.style.position = 'fixed';
      printContainer.style.left = '-9999px';
      printContainer.style.top = '0';
      printContainer.style.zIndex = '9999';
      document.body.appendChild(printContainer);

      // 等待内容渲染完成
      await new Promise(resolve => setTimeout(resolve, 100));

      // 显示打印容器并隐藏其他内容
      printContainer.style.left = '0';
      printContainer.style.position = 'absolute';

      // 隐藏原始内容
      const originalElements = document.querySelectorAll('body > *:not(.ddr-print-container)');
      originalElements.forEach(el => {
        (el as HTMLElement).style.display = 'none';
      });

      // 执行打印
      window.print();

      // 清理：恢复原始内容并移除打印容器和水印
      setTimeout(() => {
        originalElements.forEach(el => {
          (el as HTMLElement).style.display = '';
        });
        document.body.removeChild(printContainer);
        document.head.removeChild(printStyle);

        // 清理打印水印
        const printWatermarks = document.querySelectorAll('[data-ddr-print-watermark="true"]');
        printWatermarks.forEach(wm => wm.remove());
      }, 100);

      console.log('打印完成');
      return Promise.resolve();

    } catch (error) {
      console.error('打印失败:', error);
      return Promise.reject(error);
    }
  }

  /**
   * 创建打印专用容器
   */
  private static async _createPrintContainer(
    element: HTMLElement,
    config: any,
    pdfOptions: any,
    watermark: string
  ): Promise<HTMLElement> {
    // 克隆原始元素
    const printContainer = element.cloneNode(true) as HTMLElement;
    printContainer.className = 'ddr-print-container';

    // 设置打印容器样式
    printContainer.style.width = '100%';
    printContainer.style.height = 'auto';
    printContainer.style.overflow = 'visible';
    printContainer.style.backgroundColor = '#ffffff';
    printContainer.style.color = '#000000';

    // 移除所有原始水印（包括报表头、报表尾中的水印）
    const existingWatermarks = printContainer.querySelectorAll('.ddr-watermark, .ddr-watermark-content');
    existingWatermarks.forEach(wm => wm.remove());

    // 移除报表头和报表尾中可能存在的水印样式
    const headerFooterElements = printContainer.querySelectorAll('.ddr-report-header, .ddr-report-footer');
    headerFooterElements.forEach(element => {
      // 移除背景水印样式
      const el = element as HTMLElement;
      el.style.backgroundImage = 'none';
      el.style.background = 'none';

      // 移除内部的水印元素
      const innerWatermarks = el.querySelectorAll('[class*="watermark"]');
      innerWatermarks.forEach(wm => wm.remove());
    });

    // 重用PDF的列宽重制逻辑
    await this._applyPrintTableLayout(printContainer, config, pdfOptions);

    // 优化表头和表尾
    const headerElement = printContainer.querySelector('.ddr-report-header') as HTMLElement;
    if (headerElement) {
      headerElement.style.pageBreakInside = 'avoid';
      headerElement.style.marginBottom = '20px';
    }

    const footerElement = printContainer.querySelector('.ddr-report-footer') as HTMLElement;
    if (footerElement) {
      footerElement.style.pageBreakInside = 'avoid';
      footerElement.style.marginTop = '20px';
    }

    // 添加统一的全页面水印
    if (watermark) {
      this._addPrintWatermark(printContainer, watermark);
    }

    return printContainer;
  }

  /**
   * 应用打印表格布局 - 重用PDF的列宽逻辑
   */
  private static async _applyPrintTableLayout(
    container: HTMLElement,
    config: any,
    pdfOptions: any
  ): Promise<void> {
    const tableContainer = container.querySelector('.ddr-table-container') as HTMLElement;
    if (!tableContainer) return;

    tableContainer.style.maxHeight = 'none';
    tableContainer.style.height = 'auto';
    tableContainer.style.overflow = 'visible';

    const tableElement = tableContainer.querySelector('table');
    if (!tableElement) return;

    // 获取页面方向和纸张大小
    const orientation = pdfOptions.orientation || 'portrait';
    const pageSize = pdfOptions.pageSize || 'A4';

    console.log(`🖨️ 应用打印表格布局：${pageSize} ${orientation}`);

    // 计算打印页面的可用宽度（类似PDF逻辑）
    const pageWidthMm = orientation === 'landscape' ?
      (pageSize === 'A4' ? 297 : 279) : // A4横版297mm, Letter横版279mm
      (pageSize === 'A4' ? 210 : 216);  // A4竖版210mm, Letter竖版216mm

    // 减去页边距（15mm * 2）
    const contentWidthMm = pageWidthMm - 30;

    // 转换为像素（96dpi）
    const contentWidthPx = Math.floor(contentWidthMm * 3.78);

    console.log(`🖨️ 打印页面宽度：${pageWidthMm}mm，内容宽度：${contentWidthMm}mm (${contentWidthPx}px)`);

    // 设置表格宽度和布局
    tableElement.style.width = '100%';
    tableElement.style.maxWidth = `${contentWidthPx}px`;
    tableElement.style.tableLayout = 'fixed';
    tableElement.style.borderCollapse = 'collapse';

    // 重新计算列宽（类似PDF逻辑）
    if (config?.columns) {
      const columns = this._getFlatColumns(config.columns);
      const visibleColumns = columns.filter((col: any) => col.visible !== false);

      // 计算总配置宽度
      let totalConfigWidth = 0;
      visibleColumns.forEach((col: any) => {
        if (col.width) {
          totalConfigWidth += typeof col.width === 'number' ? col.width : parseInt(col.width);
        }
      });

      console.log(`🖨️ 列配置总宽度：${totalConfigWidth}px，目标宽度：${contentWidthPx}px`);

      // 应用列宽到所有单元格
      const colElements = tableElement.querySelectorAll('col');
      const allRows = tableElement.querySelectorAll('tr');

      visibleColumns.forEach((col: any, index: number) => {
        let columnWidth: number;

        if (col.width) {
          const configWidth = typeof col.width === 'number' ? col.width : parseInt(col.width);
          // 按比例缩放到打印页面宽度
          columnWidth = Math.floor((configWidth / totalConfigWidth) * contentWidthPx);
        } else {
          // 平均分配剩余宽度
          columnWidth = Math.floor(contentWidthPx / visibleColumns.length);
        }

        console.log(`🖨️ 列 "${col.key}" 宽度：${columnWidth}px`);

        // 设置col元素宽度
        if (colElements[index]) {
          (colElements[index] as HTMLElement).style.width = `${columnWidth}px`;
        }

        // 设置所有行的对应单元格宽度
        allRows.forEach(row => {
          const cells = row.querySelectorAll('td, th');
          if (cells[index]) {
            const cell = cells[index] as HTMLElement;
            cell.style.width = `${columnWidth}px`;
            cell.style.maxWidth = `${columnWidth}px`;
            cell.style.minWidth = `${columnWidth}px`;
            cell.style.boxSizing = 'border-box';
          }
        });
      });
    }

    // 优化单元格样式
    const cells = tableElement.querySelectorAll('td, th');
    cells.forEach(cell => {
      const cellElement = cell as HTMLElement;
      cellElement.style.border = '1px solid #ddd';
      cellElement.style.padding = '6px 8px';
      cellElement.style.fontSize = '11px';
      cellElement.style.lineHeight = '1.3';
      cellElement.style.wordWrap = 'break-word';
      cellElement.style.overflow = 'hidden';
    });

    // 表头样式
    const headerCells = tableElement.querySelectorAll('th');
    headerCells.forEach(cell => {
      const cellElement = cell as HTMLElement;
      cellElement.style.backgroundColor = '#f5f5f5';
      cellElement.style.fontWeight = 'bold';
      cellElement.style.fontSize = '11px';
    });
  }

  /**
   * 获取扁平化的列配置（重用PDF逻辑）
   */
  private static _getFlatColumns(columns: any[]): any[] {
    const flatColumns: any[] = [];

    const flatten = (cols: any[]) => {
      cols.forEach(col => {
        if (col.children && col.children.length > 0) {
          flatten(col.children);
        } else {
          flatColumns.push(col);
        }
      });
    };

    flatten(columns);
    return flatColumns;
  }

  /**
   * 创建打印样式
   */
  private static _createPrintStyle(orientation: string, pageSize: string): HTMLStyleElement {
    const style = document.createElement('style');
    style.className = 'ddr-print-style';

    // 根据页面方向和大小设置样式
    const pageRule = orientation === 'landscape' ? 'landscape' : 'portrait';
    const sizeRule = pageSize.toLowerCase();

    style.textContent = `
      @media print {
        @page {
          size: ${sizeRule} ${pageRule};
          margin: 15mm;
        }

        body {
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
          font-size: 12px;
          line-height: 1.4;
          color: #000;
          background: #fff;
        }

        .ddr-print-container {
          width: 100% !important;
          height: auto !important;
          overflow: visible !important;
          position: relative !important;
          left: 0 !important;
          top: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
          box-shadow: none !important;
          border: none !important;
        }

        .ddr-table-container {
          overflow: visible !important;
          height: auto !important;
          max-height: none !important;
        }

        .ddr-table {
          width: 100% !important;
          border-collapse: collapse !important;
          page-break-inside: auto !important;
        }

        .ddr-table-row {
          page-break-inside: avoid !important;
          page-break-after: auto !important;
        }

        .ddr-header, .ddr-report-header {
          page-break-inside: avoid !important;
          page-break-after: avoid !important;
        }

        .ddr-footer, .ddr-report-footer {
          page-break-inside: avoid !important;
          page-break-before: avoid !important;
        }

        .ddr-print-watermark {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          pointer-events: none !important;
          z-index: 999 !important;
          opacity: 0.15 !important;
          overflow: hidden !important;
        }

        .ddr-print-watermark-text {
          position: absolute !important;
          font-size: 24px !important;
          font-weight: bold !important;
          color: #ccc !important;
          transform: rotate(-45deg) !important;
          white-space: nowrap !important;
          user-select: none !important;
        }

        /* 隐藏不需要打印的元素 */
        .no-print {
          display: none !important;
        }
      }
    `;

    return style;
  }

  /**
   * 添加统一的全页面打印水印
   */
  private static _addPrintWatermark(container: HTMLElement, watermark: string): void {
    console.log(`🖨️ 添加统一的全页面打印水印: "${watermark}"`);

    // 创建水印容器，覆盖整个打印容器
    const watermarkContainer = document.createElement('div');
    watermarkContainer.className = 'ddr-print-watermark';

    // 设置水印容器样式 - 覆盖整个容器
    watermarkContainer.style.position = 'fixed';  // 使用fixed定位确保覆盖整个视口
    watermarkContainer.style.top = '0';
    watermarkContainer.style.left = '0';
    watermarkContainer.style.width = '100vw';
    watermarkContainer.style.height = '100vh';
    watermarkContainer.style.pointerEvents = 'none';
    watermarkContainer.style.zIndex = '999';  // 提高z-index确保显示在最上层
    watermarkContainer.style.overflow = 'hidden';
    watermarkContainer.style.opacity = '0.15';  // 设置透明度

    // 计算水印布局 - 更密集的平铺
    const rows = 8;  // 增加行数
    const cols = 6;  // 增加列数

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const watermarkText = document.createElement('div');
        watermarkText.className = 'ddr-print-watermark-text';
        watermarkText.textContent = watermark;

        // 设置水印文字样式
        watermarkText.style.position = 'absolute';
        watermarkText.style.fontSize = '24px';  // 统一的字体大小
        watermarkText.style.fontWeight = 'bold';
        watermarkText.style.color = '#ccc';     // 调整颜色
        watermarkText.style.opacity = '1';      // 不设置额外透明度，由容器控制
        watermarkText.style.whiteSpace = 'nowrap';
        watermarkText.style.userSelect = 'none';
        watermarkText.style.pointerEvents = 'none';

        // 计算位置 - 均匀分布
        const x = (col + 0.5) * (100 / cols);
        const y = (row + 0.5) * (100 / rows);

        watermarkText.style.left = `${x}%`;
        watermarkText.style.top = `${y}%`;
        watermarkText.style.transform = 'translate(-50%, -50%) rotate(-45deg)';
        watermarkText.style.transformOrigin = 'center';

        watermarkContainer.appendChild(watermarkText);
      }
    }

    // 将水印容器添加到body，确保在打印时覆盖整个页面
    document.body.appendChild(watermarkContainer);

    // 标记水印容器，以便后续清理
    watermarkContainer.setAttribute('data-ddr-print-watermark', 'true');

    console.log(`🖨️ 水印添加完成，共创建 ${rows * cols} 个水印元素`);
  }
}
