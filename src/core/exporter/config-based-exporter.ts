import * as XLSXStyle from 'xlsx-js-style';
import { ExportOptions } from '../../types';

/**
 * 基于配置的Excel导出器
 * 直接使用DDR配置和数据源，避免DOM抓取的问题
 */
export class ConfigBasedExporter {
  /**
   * 基于DDR配置和数据源导出Excel
   * @param config DDR报表配置
   * @param data 报表数据（包含records、metadata等）
   * @param options 导出选项
   */
  static async exportExcel(config: any, data: any, options: ExportOptions = {}): Promise<void> {
    try {
      console.log('🚀 开始基于配置的Excel导出');

      const {
        fileName = config?.meta?.name || '报表',
        sheetName = 'Sheet1'
      } = options;

      // 构建Excel数据结构
      const excelData = this._buildExcelData(config, data);

      // 创建工作表
      const ws = XLSXStyle.utils.aoa_to_sheet(excelData);

      // 应用样式 - 使用安全模式
      try {
        this._applyStyles(ws, config, excelData);
      } catch (styleError) {
        console.warn('复杂样式应用失败，使用简化样式:', styleError);
        this._applyBasicStyles(ws, config, excelData);
      }

      // 创建工作簿并导出
      const wb = XLSXStyle.utils.book_new();
      XLSXStyle.utils.book_append_sheet(wb, ws, sheetName);

      // 设置工作簿属性 - 使用更安全的属性设置
      wb.Props = {
        Title: String(fileName).substring(0, 255), // 限制标题长度
        Subject: "报表数据",
        Author: "DDR报表组件"
        // 移除CreatedDate，避免日期格式问题
      };

      // 导出文件 - 使用更安全的导出方式
      try {
        // 方式1：尝试使用writeFile（更稳定）
        XLSXStyle.writeFile(wb, `${fileName}.xlsx`, {
          cellStyles: true,
          compression: false // 关闭压缩以避免兼容性问题
        });
        console.log('✅ Excel导出完成（writeFile方式）');
      } catch (writeFileError) {
        console.warn('writeFile导出失败，尝试Blob方式:', writeFileError);

        // 方式2：降级到Blob方式
        try {
          const excelBuffer = XLSXStyle.write(wb, {
            bookType: 'xlsx' as const,
            type: 'buffer' as const,
            cellStyles: true,
            compression: false // 关闭压缩
          });

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

          console.log('✅ Excel导出完成（Blob方式）');
        } catch (blobError) {
          console.error('Blob导出也失败:', blobError);

          // 方式3：最后降级到基础导出（无样式）
          const basicWb = XLSXStyle.utils.book_new();
          const basicWs = XLSXStyle.utils.aoa_to_sheet(excelData);
          XLSXStyle.utils.book_append_sheet(basicWb, basicWs, sheetName);
          XLSXStyle.writeFile(basicWb, `${fileName}.xlsx`);
          console.log('✅ Excel导出完成（基础模式，无样式）');
        }
      }

      console.log('✅ 基于配置的Excel导出完成');
    } catch (error) {
      console.error('❌ 基于配置的Excel导出失败:', error);
      throw error;
    }
  }

  /**
   * 构建Excel数据结构
   */
  private static _buildExcelData(config: any, data: any): any[][] {
    console.log('📊 开始构建Excel数据结构');
    const result: any[][] = [];

    // 1. 构建报表头
    if (config.header) {
      console.log('📋 构建报表头，配置:', config.header);

      // 标题行
      if (config.header.title) {
        const titleText = this._resolveMetadataValue(config.header.title, data.metadata);
        console.log('📋 标题文本:', titleText);
        if (titleText) {
          result.push([titleText]);
          result.push([]); // 空行分隔
        }
      }

      // 元数据行 - 支持左中右布局
      if (config.header.fields && config.header.fields.length > 0) {
        const leftFields: string[] = [];
        const centerFields: string[] = [];
        const rightFields: string[] = [];

        config.header.fields.forEach((field: any) => {
          const label = field.label || '';
          const value = this._resolveMetadataValue(field, data.metadata) || '';
          const actualPosition = field.position || 'left';


          if (label && value) {
            const fieldText = `${label} ${value}`;
            const position = actualPosition;

            switch (position) {
              case 'left':
                leftFields.push(fieldText);
                break;
              case 'center':
                centerFields.push(fieldText);
                break;
              case 'right':
              default:
                rightFields.push(fieldText);
                break;
            }
          }
        });

        // 构建元数据行 - 左右分区合并策略
        if (leftFields.length > 0 || centerFields.length > 0 || rightFields.length > 0) {
          const columnCount = config.columns ? config.columns.length : 6; // 默认6列
          const metadataRow = new Array(columnCount).fill('');

          // 左侧字段 - 占用左半部分（前一半列）
          if (leftFields.length > 0) {
            metadataRow[0] = leftFields.join('  ');
            // 标记左侧合并区域：从第0列到第(columnCount/2-1)列
          }

          // 中间字段合并到右侧显示（报表头通常不需要严格的三分布局）
          const allRightFields = [...centerFields, ...rightFields];
          if (allRightFields.length > 0) {
            const rightStart = Math.ceil(columnCount / 2);
            metadataRow[rightStart] = allRightFields.join('  ');
            // 标记右侧合并区域：从第(columnCount/2)列到最后一列
          }

          result.push(metadataRow);
          result.push([]); // 空行分隔

        }
      }
    }

    // 2. 构建表头
    if (config.columns && config.columns.length > 0) {
      const headerRow = config.columns.map((col: any) => col.title || col.key);
      result.push(headerRow);
    }

    // 3. 构建数据行（检查是否需要分组处理）
    const records = data.records || data.data || [];
    if (records.length > 0) {
      // 检查数据是否已经包含分组信息（通过检查是否有小计行）
      const hasGroupingData = records.some((record: any) =>
        record._rowType === 'subtotal' || record._rowType === 'total' ||
        (typeof record === 'object' && record !== null &&
         Object.values(record).some(value =>
           typeof value === 'string' && (value.includes('小计') || value.includes('总计'))
         ))
      );

      console.log('📊 数据分组状态检查:', {
        configGroupingEnabled: config.grouping?.enabled,
        hasGroupingData,
        recordsCount: records.length,
        firstRecordSample: records[0]
      });

      if (config.grouping?.enabled && !hasGroupingData) {
        // 数据还没有分组处理，需要进行分组
        console.log('📊 数据需要分组处理');
        const processedData = this._processGrouping(records, config.grouping, config.columns);
        result.push(...processedData);
      } else {
        // 数据已经分组处理过，或者不需要分组，直接转换格式
        console.log('📊 数据已分组或不需要分组，直接转换格式');
        records.forEach((record: any) => {
          const row = config.columns.map((col: any) => {
            const value = record[col.key];
            return this._formatCellValue(value, col.formatter);
          });
          result.push(row);
        });
      }
    }

    // 4. 构建报表尾 - 分行显示汇总和字段
    if (config.footer) {
      result.push([]); // 空行分隔

      // 先处理汇总信息（单独一行，跨列合并）
      if (config.footer.summary && config.footer.summary.length > 0) {
        const summaryTexts: string[] = [];
        config.footer.summary.forEach((summary: any) => {
          const label = summary.label || `${summary.column}汇总`;
          const value = this._resolveMetadataValue(summary, data.metadata) || '';
          if (label && value) {
            summaryTexts.push(`${label}: ${this._formatCellValue(value, summary.formatter)}`);
          }
        });

        if (summaryTexts.length > 0) {
          // 汇总信息单独一行，合并所有列
          const columnCount = config.columns ? config.columns.length : 6;
          const summaryRow = new Array(columnCount).fill('');
          summaryRow[0] = summaryTexts.join('  '); // 放在第一列，后续会合并
          result.push(summaryRow);

        }
      }

      // 再处理其他表尾字段（支持左中右布局）
      if (config.footer.fields && config.footer.fields.length > 0) {
        const leftFooterFields: string[] = [];
        const centerFooterFields: string[] = [];
        const rightFooterFields: string[] = [];

        config.footer.fields.forEach((field: any) => {
          const label = field.label || '';
          const value = this._resolveMetadataValue(field, data.metadata) || '';
          if (label && value) {
            const fieldText = `${label} ${value}`;
            const position = field.position || 'left'; // 表尾字段默认左对齐，与网页显示保持一致

            switch (position) {
              case 'left':
                leftFooterFields.push(fieldText);
                break;
              case 'center':
                centerFooterFields.push(fieldText);
                break;
              case 'right':
                rightFooterFields.push(fieldText);
                break;
            }
          }
        });

        // 构建表尾字段行 - 左中右分区合并策略
        if (leftFooterFields.length > 0 || centerFooterFields.length > 0 || rightFooterFields.length > 0) {
          const columnCount = config.columns ? config.columns.length : 6;
          const fieldsRow = new Array(columnCount).fill('');

          // 计算三等分区域
          const leftEnd = Math.floor(columnCount / 3) - 1;
          const centerStart = Math.floor(columnCount / 3);
          const centerEnd = Math.floor(columnCount * 2 / 3) - 1;
          const rightStart = Math.floor(columnCount * 2 / 3);

          // 左侧字段 - 占用左三分之一
          if (leftFooterFields.length > 0) {
            fieldsRow[0] = leftFooterFields.join('  ');
            // 标记左侧合并区域：从第0列到第leftEnd列
          }

          // 中间字段 - 占用中三分之一
          if (centerFooterFields.length > 0) {
            fieldsRow[centerStart] = centerFooterFields.join('  ');
            // 标记中间合并区域：从第centerStart列到第centerEnd列
          }

          // 右侧字段 - 占用右三分之一
          if (rightFooterFields.length > 0) {
            fieldsRow[rightStart] = rightFooterFields.join('  ');
            // 标记右侧合并区域：从第rightStart列到最后一列
          }

          result.push(fieldsRow);

        }
      }
    }

    console.log(`📊 Excel数据结构构建完成，总行数: ${result.length}`);
    return result;
  }

  /**
   * 处理分组数据
   */
  private static _processGrouping(records: any[], groupingConfig: any, columns: any[]): any[][] {
    console.log('📊 开始处理分组数据');
    const result: any[][] = [];

    const groupBy = groupingConfig.groupBy;
    const subtotals = groupingConfig.subtotals || [];
    const subtotalLabel = groupingConfig.subtotalLabel || '小计';
    const showGrandTotal = groupingConfig.showGrandTotal !== false;
    const grandTotalLabel = groupingConfig.grandTotalLabel || '总计';

    // 按分组字段分组
    const groups = new Map<string, any[]>();
    records.forEach(record => {
      const groupValue = record[groupBy];
      if (!groups.has(groupValue)) {
        groups.set(groupValue, []);
      }
      groups.get(groupValue)!.push(record);
    });

    // 总计累计器
    const grandTotals: { [key: string]: number } = {};

    // 处理每个分组
    groups.forEach((groupRecords, groupValue) => {
      console.log(`📊 处理分组: ${groupValue}, 记录数: ${groupRecords.length}`);

      // 添加分组数据行
      groupRecords.forEach((record) => {
        const row = columns.map((col: any) => {
          const value = record[col.key];
          return this._formatCellValue(value, col.formatter);
        });
        result.push(row);
      });

      // 计算并添加小计行（每个分组只有一行）
      if (subtotals.length > 0) {
        const subtotalRow = new Array(columns.length).fill('');
        subtotalRow[0] = subtotalLabel; // 第一列显示"小计"

        subtotals.forEach((subtotal: any) => {
          const colIndex = columns.findIndex(col => col.key === subtotal.field);
          if (colIndex >= 0) {
            const sum = groupRecords.reduce((acc, record) => {
              const value = parseFloat(record[subtotal.field]) || 0;
              return acc + value;
            }, 0);

            subtotalRow[colIndex] = this._formatCellValue(sum, columns[colIndex].formatter);

            // 累计到总计
            if (!grandTotals[subtotal.field]) {
              grandTotals[subtotal.field] = 0;
            }
            grandTotals[subtotal.field] += sum;
          }
        });

        result.push(subtotalRow);
        console.log(`📊 添加小计行: ${subtotalLabel}`);
      }
    });

    // 添加总计行
    if (showGrandTotal && subtotals.length > 0) {
      const totalRow = new Array(columns.length).fill('');
      totalRow[0] = grandTotalLabel; // 第一列显示"总计"

      subtotals.forEach((subtotal: any) => {
        const colIndex = columns.findIndex(col => col.key === subtotal.field);
        if (colIndex >= 0 && grandTotals[subtotal.field] !== undefined) {
          totalRow[colIndex] = this._formatCellValue(grandTotals[subtotal.field], columns[colIndex].formatter);
        }
      });

      result.push(totalRow);
    }

    console.log(`📊 分组数据处理完成，输出 ${result.length} 行`);
    return result;
  }

  /**
   * 解析元数据值
   */
  private static _resolveMetadataValue(config: any, metadata: any): string {
    // 直接文本
    if (config.text) {
      return config.text;
    }

    // 直接值（用于header.fields）
    if (config.value) {
      return String(config.value);
    }

    // 元数据路径
    if (config.metadataPath && metadata) {
      const path = config.metadataPath.split('.');
      let value = metadata;
      for (const key of path) {
        value = value?.[key];
        if (value === undefined) break;
      }
      return value ? String(value) : '';
    }

    return '';
  }

  /**
   * 格式化单元格值
   */
  private static _formatCellValue(value: any, formatter?: string): string {
    if (value === null || value === undefined) {
      return '';
    }

    switch (formatter) {
      case 'currency':
        const num = parseFloat(value);
        return isNaN(num) ? String(value) : `¥${num.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
      case 'number':
        const numVal = parseFloat(value);
        return isNaN(numVal) ? String(value) : numVal.toLocaleString('zh-CN');
      case 'percentage':
        const pctVal = parseFloat(value);
        return isNaN(pctVal) ? String(value) : `${(pctVal * 100).toFixed(2)}%`;
      default:
        return String(value);
    }
  }

  /**
   * 应用样式
   */
  private static _applyStyles(ws: any, config: any, _data: any[][]): void {
    console.log('🎨 开始应用基于配置的样式');

    try {
      // 安全地获取工作表范围
      if (!ws['!ref']) {
        console.warn('工作表没有有效的范围，跳过样式应用');
        return;
      }

      const range = XLSXStyle.utils.decode_range(ws['!ref']);
      const columnCount = config.columns ? config.columns.length : (range.e.c + 1);

      // 验证范围有效性
      if (range.e.r < 0 || range.e.c < 0) {
        console.warn('工作表范围无效，跳过样式应用');
        return;
      }

      // 设置自适应列宽
      if (!ws['!cols']) ws['!cols'] = [];
      for (let col = 0; col <= range.e.c; col++) {
        let maxWidth = 8;
        let minWidth = 8;
        let maxAllowedWidth = 30;

        // 针对不同列类型设置不同的宽度策略
        if (config.columns && config.columns[col]) {
          const column = config.columns[col];

          // 序号列特殊处理
          if (column.key === 'index' || column.title === '序号' || col === 0) {
            minWidth = 4;
            maxAllowedWidth = 8; // 序号列最大8字符宽度

          }
          // 数值列（销售额、成本等）
          else if (column.formatter === 'currency' || column.formatter === 'number') {
            minWidth = 10;
            maxAllowedWidth = 15;
          }
          // 文本列
          else {
            minWidth = 8;
            maxAllowedWidth = 20;
          }
        }

        // 计算实际内容宽度
        for (let row = 0; row <= range.e.r; row++) {
          const cellRef = XLSXStyle.utils.encode_cell({ r: row, c: col });
          if (ws[cellRef] && ws[cellRef].v) {
            const cellValue = String(ws[cellRef].v);
            const charWidth = cellValue.replace(/[^\x00-\xff]/g, "**").length;
            maxWidth = Math.max(maxWidth, charWidth);
          }
        }

        // 应用宽度限制
        const finalWidth = Math.max(minWidth, Math.min(maxWidth + 2, maxAllowedWidth));
        ws['!cols'][col] = { wch: finalWidth };

      }

      // 应用样式
      let currentRow = 0;
      const merges: any[] = [];

      // 标题行样式
      if (config.header && config.header.title) {
        for (let col = 0; col < columnCount; col++) {
          const cellRef = XLSXStyle.utils.encode_cell({ r: currentRow, c: col });
          if (ws[cellRef]) {
            ws[cellRef].s = {
              font: { bold: true, sz: 16, color: { rgb: "333333" } },
              alignment: { horizontal: "center", vertical: "center" },
              fill: { fgColor: { rgb: "FFFFFF" } }
            };
          }
        }

        // 标题行合并 - 添加更严格的安全检查
        if (columnCount > 1 && currentRow >= 0 && columnCount <= 256 && currentRow < 1048576) {
          // 确保合并范围有效
          const mergeRange = {
            s: { r: currentRow, c: 0 },
            e: { r: currentRow, c: columnCount - 1 }
          };

          // 验证合并范围的有效性
          if (mergeRange.s.r <= mergeRange.e.r && mergeRange.s.c <= mergeRange.e.c) {
            merges.push(mergeRange);

          }
        }

        currentRow += 2; // 标题行 + 空行
      }

      // 元数据行样式 - 支持左右分区合并
      if (config.header && config.header.fields && config.header.fields.length > 0) {
        // 计算左右分区
        const leftEnd = Math.floor(columnCount / 2) - 1;
        const rightStart = Math.ceil(columnCount / 2);

        for (let col = 0; col < columnCount; col++) {
          const cellRef = XLSXStyle.utils.encode_cell({ r: currentRow, c: col });
          if (ws[cellRef] && ws[cellRef].v) { // 只对有内容的单元格应用样式
            // 根据列位置确定对齐方式
            let horizontalAlign = "left";
            if (col === 0) {
              horizontalAlign = "left"; // 左侧区域左对齐
            } else if (col === rightStart) {
              horizontalAlign = "right"; // 右侧区域右对齐
            }

            ws[cellRef].s = {
              font: { sz: 10, color: { rgb: "666666" } },
              alignment: { horizontal: horizontalAlign, vertical: "center" },
              fill: { fgColor: { rgb: "FFFFFF" } }
            };

          }
        }

        // 添加元数据行的分区合并
        const leftCellRef = XLSXStyle.utils.encode_cell({ r: currentRow, c: 0 });
        const rightCellRef = XLSXStyle.utils.encode_cell({ r: currentRow, c: rightStart });

        // 左侧区域合并 - 添加安全检查
        if (ws[leftCellRef] && ws[leftCellRef].v && leftEnd >= 0 && leftEnd < columnCount) {
          merges.push({
            s: { r: currentRow, c: 0 },
            e: { r: currentRow, c: leftEnd }
          });

        }

        // 右侧区域合并 - 添加安全检查
        if (ws[rightCellRef] && ws[rightCellRef].v && rightStart >= 0 && rightStart < columnCount) {
          merges.push({
            s: { r: currentRow, c: rightStart },
            e: { r: currentRow, c: columnCount - 1 }
          });

        }

        currentRow += 2; // 元数据行 + 空行
      }

      // 表头样式
      if (config.columns) {
        for (let col = 0; col < columnCount; col++) {
          const cellRef = XLSXStyle.utils.encode_cell({ r: currentRow, c: col });
          if (ws[cellRef]) {
            ws[cellRef].s = {
              font: { bold: true, sz: 11, color: { rgb: "333333" } },
              fill: { fgColor: { rgb: "F2F2F2" } },
              alignment: { horizontal: "center", vertical: "center" },
              border: {
                top: { style: "thin", color: { rgb: "E8E8E8" } },
                bottom: { style: "thin", color: { rgb: "E8E8E8" } },
                left: { style: "thin", color: { rgb: "E8E8E8" } },
                right: { style: "thin", color: { rgb: "E8E8E8" } }
              }
            };
          }
        }
        currentRow++;
      }

      // 数据行样式 - 添加安全检查
      for (let row = currentRow; row <= range.e.r && row < 1048576; row++) {
        const isAlternateRow = (row - currentRow) % 2 === 1;
        const bgColor = isAlternateRow ? "F9F9F9" : "FFFFFF";

        for (let col = 0; col < columnCount && col < 256; col++) {
          const cellRef = XLSXStyle.utils.encode_cell({ r: row, c: col });
          if (ws[cellRef]) {
            // 检查是否是小计或总计行 - 改进检测逻辑
            // 检查整行是否为小计或总计行（检查第一列）
            const firstColRef = XLSXStyle.utils.encode_cell({ r: row, c: 0 });
            const firstColValue = ws[firstColRef] && ws[firstColRef].v ? String(ws[firstColRef].v) : '';

            const isSubtotalRow = firstColValue.includes('小计') && !firstColValue.includes('总计');
            const isTotalRow = firstColValue.includes('总计');

            console.log(`📊 行${row}列${col}: 第一列="${firstColValue}", 小计=${isSubtotalRow}, 总计=${isTotalRow}`);

            if (isSubtotalRow) {
              ws[cellRef].s = {
                font: { bold: true, sz: 10, color: { rgb: "333333" } },
                fill: { fgColor: { rgb: "F5F5F5" } },
                alignment: {
                  vertical: "center",
                  horizontal: col === 0 ? "left" : (config.columns?.[col]?.align || "right")
                },
                border: {
                  top: { style: "thin", color: { rgb: "D9D9D9" } },
                  bottom: { style: "thin", color: { rgb: "E8E8E8" } },
                  left: { style: "thin", color: { rgb: "E8E8E8" } },
                  right: { style: "thin", color: { rgb: "E8E8E8" } }
                }
              };
            } else if (isTotalRow) {
              ws[cellRef].s = {
                font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
                fill: { fgColor: { rgb: "1890FF" } },
                alignment: {
                  vertical: "center",
                  horizontal: col === 0 ? "left" : (config.columns?.[col]?.align || "right")
                },
                border: {
                  top: { style: "medium", color: { rgb: "1890FF" } },
                  bottom: { style: "medium", color: { rgb: "1890FF" } },
                  left: { style: "thin", color: { rgb: "1890FF" } },
                  right: { style: "thin", color: { rgb: "1890FF" } }
                }
              };
            } else {
              // 普通数据行
              const alignment: any = { vertical: "center" };
              if (config.columns && config.columns[col]) {
                alignment.horizontal = config.columns[col].align || "left";
              }

              ws[cellRef].s = {
                font: { sz: 10, color: { rgb: "333333" } },
                fill: { fgColor: { rgb: bgColor } },
                alignment,
                border: {
                  top: { style: "thin", color: { rgb: "E8E8E8" } },
                  bottom: { style: "thin", color: { rgb: "E8E8E8" } },
                  left: { style: "thin", color: { rgb: "E8E8E8" } },
                  right: { style: "thin", color: { rgb: "E8E8E8" } }
                }
              };
            }
          }
        }
      }

      // 检查并添加表尾行合并
      if (config.footer) {
        let footerRowsProcessed = 0;

        // 查找汇总行（包含汇总信息的行）
        if (config.footer.summary && config.footer.summary.length > 0) {
          for (let row = currentRow; row <= range.e.r; row++) {
            const firstColRef = XLSXStyle.utils.encode_cell({ r: row, c: 0 });
            const firstColValue = ws[firstColRef] && ws[firstColRef].v ? String(ws[firstColRef].v) : '';

            // 如果第一列包含汇总信息（包含"汇总"或":"），则合并该行
            if (firstColValue.includes('汇总') || firstColValue.includes(':')) {
              // 添加更严格的合并范围检查
              if (row >= 0 && row < 1048576 && columnCount > 1 && columnCount <= 256) {
                const mergeRange = {
                  s: { r: row, c: 0 },
                  e: { r: row, c: columnCount - 1 }
                };

                // 验证合并范围的有效性
                if (mergeRange.s.r <= mergeRange.e.r && mergeRange.s.c <= mergeRange.e.c) {
                  merges.push(mergeRange);
                  console.log(`📋 添加汇总行合并: 行${row + 1}`);
                }
              }

              // 为汇总行应用居中样式 - 添加边界检查
              for (let col = 0; col < Math.min(columnCount, 256); col++) {
                try {
                  const cellRef = XLSXStyle.utils.encode_cell({ r: row, c: col });
                  if (ws[cellRef] && row >= 0 && row < 1048576 && col >= 0 && col < 16384) {
                    // 获取汇总行对齐方式配置
                    const summaryAlign = config.footer?.summaryAlign || "center";
                    console.log(`📋 汇总行对齐方式: ${summaryAlign} (配置值: ${config.footer?.summaryAlign || '未设置'})`);

                    ws[cellRef].s = {
                      font: { bold: true, sz: 11, color: { rgb: "333333" } },
                      alignment: { horizontal: summaryAlign, vertical: "center" },
                      fill: { fgColor: { rgb: "F0F8FF" } },
                      border: {
                        top: { style: "thin", color: { rgb: "E8E8E8" } },
                        bottom: { style: "thin", color: { rgb: "E8E8E8" } },
                        left: { style: "thin", color: { rgb: "E8E8E8" } },
                        right: { style: "thin", color: { rgb: "E8E8E8" } }
                      }
                    };
                  }
                } catch (styleError) {
                  console.warn(`样式应用失败 - 行${row + 1}列${col + 1}:`, styleError);
                }
              }
              footerRowsProcessed++;
              break; // 只处理第一个找到的汇总行
            }
          }
        }

        // 查找表尾字段行（汇总行之后的行）
        if (config.footer.fields && config.footer.fields.length > 0) {
          // 直接定位到表尾字段行：从汇总行开始查找下一行
          let footerFieldsRow = -1;

          // 如果找到了汇总行，表尾字段行就在汇总行的下一行
          if (footerRowsProcessed > 0) {
            // 从汇总行开始查找
            for (let row = currentRow; row <= range.e.r; row++) {
              const firstColRef = XLSXStyle.utils.encode_cell({ r: row, c: 0 });
              const firstColValue = ws[firstColRef] && ws[firstColRef].v ? String(ws[firstColRef].v) : '';

              // 找到汇总行后，下一行就是表尾字段行
              if (firstColValue.includes('汇总') || firstColValue.includes(':')) {
                footerFieldsRow = row + 1;
                break;
              }
            }
          } else {
            // 如果没有汇总行，表尾字段行就在数据结束后
            footerFieldsRow = range.e.r;
          }

          if (footerFieldsRow > 0 && footerFieldsRow <= range.e.r) {


            // 检查这一行是否有表尾字段内容
            let hasFooterFields = false;
            for (let col = 0; col < columnCount; col++) {
              const cellRef = XLSXStyle.utils.encode_cell({ r: footerFieldsRow, c: col });
              if (ws[cellRef] && ws[cellRef].v) {
                hasFooterFields = true;
                break;
              }
            }

            if (hasFooterFields) {
              // 计算三等分区域
              const leftEnd = Math.floor(columnCount / 3) - 1;
              const centerStart = Math.floor(columnCount / 3);
              const centerEnd = Math.floor(columnCount * 2 / 3) - 1;
              const rightStart = Math.floor(columnCount * 2 / 3);

              // 检查并添加左侧合并
              const leftCellRef = XLSXStyle.utils.encode_cell({ r: footerFieldsRow, c: 0 });
              if (ws[leftCellRef] && ws[leftCellRef].v) {
                merges.push({
                  s: { r: footerFieldsRow, c: 0 },
                  e: { r: footerFieldsRow, c: leftEnd }
                });

              }

              // 检查并添加中间合并
              const centerCellRef = XLSXStyle.utils.encode_cell({ r: footerFieldsRow, c: centerStart });
              if (ws[centerCellRef] && ws[centerCellRef].v) {
                merges.push({
                  s: { r: footerFieldsRow, c: centerStart },
                  e: { r: footerFieldsRow, c: centerEnd }
                });

              }

              // 检查并添加右侧合并
              const rightCellRef = XLSXStyle.utils.encode_cell({ r: footerFieldsRow, c: rightStart });
              if (ws[rightCellRef] && ws[rightCellRef].v) {
                merges.push({
                  s: { r: footerFieldsRow, c: rightStart },
                  e: { r: footerFieldsRow, c: columnCount - 1 }
                });

              }

              // 为表尾字段行应用样式
              for (let col = 0; col < columnCount; col++) {
                const cellRef = XLSXStyle.utils.encode_cell({ r: footerFieldsRow, c: col });
                if (ws[cellRef] && ws[cellRef].v) {
                  let horizontalAlign = "left";
                  if (col === 0) {
                    horizontalAlign = "left";
                  } else if (col === centerStart) {
                    horizontalAlign = "center";
                  } else if (col === rightStart) {
                    horizontalAlign = "right";
                  }

                  ws[cellRef].s = {
                    font: { sz: 10, color: { rgb: "666666" } },
                    alignment: { horizontal: horizontalAlign, vertical: "center" },
                    fill: { fgColor: { rgb: "FFFFFF" } },
                    border: {
                      top: { style: "thin", color: { rgb: "E8E8E8" } },
                      bottom: { style: "thin", color: { rgb: "E8E8E8" } },
                      left: { style: "thin", color: { rgb: "E8E8E8" } },
                      right: { style: "thin", color: { rgb: "E8E8E8" } }
                    }
                  };
                }
              }
            }
          }
        }
      }

      // 验证并清理合并单元格 - 使用严格验证
      const validMerges = this._validateAndCleanMerges(merges, range);

      // 应用合并单元格
      if (validMerges.length > 0) {
        ws['!merges'] = validMerges;
        console.log(`🎨 应用了 ${validMerges.length} 个有效合并单元格（原始${merges.length}个）`);
      } else {
        console.log(`⚠️ 没有有效的合并单元格可应用（原始${merges.length}个被过滤）`);
      }

      console.log('🎨 基于配置的样式应用完成');
    } catch (error) {
      console.error('应用基于配置的样式失败:', error);
    }
  }

  /**
   * 验证并清理合并单元格
   */
  private static _validateAndCleanMerges(merges: any[], range: any): any[] {
    console.log(`🔍 开始验证 ${merges.length} 个合并单元格，工作表范围: ${XLSXStyle.utils.encode_range(range)}`);

    // 使用正常的验证模式（已修复重叠问题）
    console.log(`🔧 使用正常验证模式，已修复重叠合并问题`);

    // 注释掉超安全模式，因为重叠问题已经解决
    // const ULTRA_SAFE_MODE = false;

    const validMerges: any[] = [];
    const invalidReasons: string[] = [];

    for (let i = 0; i < merges.length; i++) {
      const merge = merges[i];

      try {
        // 基本结构检查
        if (!merge || !merge.s || !merge.e) {
          invalidReasons.push(`合并${i}: 缺少起始或结束位置`);
          continue;
        }

        const { s, e } = merge;

        // 检查坐标是否为数字
        if (typeof s.r !== 'number' || typeof s.c !== 'number' ||
            typeof e.r !== 'number' || typeof e.c !== 'number') {
          invalidReasons.push(`合并${i}: 坐标不是数字 (${s.r},${s.c}):(${e.r},${e.c})`);
          continue;
        }

        // 检查坐标范围
        if (s.r < 0 || s.c < 0 || e.r < 0 || e.c < 0) {
          invalidReasons.push(`合并${i}: 坐标为负数 (${s.r},${s.c}):(${e.r},${e.c})`);
          continue;
        }

        // 检查是否超出工作表范围
        if (s.r > range.e.r || s.c > range.e.c || e.r > range.e.r || e.c > range.e.c) {
          invalidReasons.push(`合并${i}: 超出工作表范围 (${s.r},${s.c}):(${e.r},${e.c}) > (${range.e.r},${range.e.c})`);
          continue;
        }

        // 检查起始位置是否小于等于结束位置
        if (s.r > e.r || s.c > e.c) {
          invalidReasons.push(`合并${i}: 起始位置大于结束位置 (${s.r},${s.c}):(${e.r},${e.c})`);
          continue;
        }

        // 检查是否是单个单元格（不需要合并）
        if (s.r === e.r && s.c === e.c) {
          invalidReasons.push(`合并${i}: 单个单元格不需要合并 (${s.r},${s.c})`);
          continue;
        }

        // 检查Excel限制
        if (s.r >= 1048576 || s.c >= 16384 || e.r >= 1048576 || e.c >= 16384) {
          invalidReasons.push(`合并${i}: 超出Excel限制 (${s.r},${s.c}):(${e.r},${e.c})`);
          continue;
        }

        // 检查合并区域大小是否合理（防止过大的合并区域）
        const mergeRows = e.r - s.r + 1;
        const mergeCols = e.c - s.c + 1;
        if (mergeRows > 100 || mergeCols > 50) {
          invalidReasons.push(`合并${i}: 合并区域过大 ${mergeRows}行x${mergeCols}列`);
          continue;
        }

        // 检查坐标是否为整数
        if (!Number.isInteger(s.r) || !Number.isInteger(s.c) ||
            !Number.isInteger(e.r) || !Number.isInteger(e.c)) {
          invalidReasons.push(`合并${i}: 坐标不是整数 (${s.r},${s.c}):(${e.r},${e.c})`);
          continue;
        }

        // 检查是否存在重复的合并区域
        const isDuplicate = validMerges.some(existing =>
          existing.s.r === s.r && existing.s.c === s.c &&
          existing.e.r === e.r && existing.e.c === e.c
        );
        if (isDuplicate) {
          invalidReasons.push(`合并${i}: 重复的合并区域 (${s.r},${s.c}):(${e.r},${e.c})`);
          continue;
        }

        // 检查是否与现有合并区域重叠
        const overlappingMerge = validMerges.find(existing => {
          const existingS = existing.s;
          const existingE = existing.e;

          // 检查两个矩形是否重叠
          const rowOverlap = !(e.r < existingS.r || s.r > existingE.r);
          const colOverlap = !(e.c < existingS.c || s.c > existingE.c);

          return rowOverlap && colOverlap;
        });

        if (overlappingMerge) {
          const existingRange = `${XLSXStyle.utils.encode_cell(overlappingMerge.s)}:${XLSXStyle.utils.encode_cell(overlappingMerge.e)}`;
          const currentRange = `${XLSXStyle.utils.encode_cell(s)}:${XLSXStyle.utils.encode_cell(e)}`;
          invalidReasons.push(`合并${i}: 与现有合并区域重叠 ${currentRange} ⚡ ${existingRange}`);
          console.warn(`🚫 跳过重叠合并: ${currentRange} 与已存在的 ${existingRange} 重叠`);
          continue;
        }

        // 通过所有检查，添加到有效列表
        validMerges.push(merge);
        const startCell = XLSXStyle.utils.encode_cell(s);
        const endCell = XLSXStyle.utils.encode_cell(e);
        console.log(`✅ 有效合并${i}: ${startCell}:${endCell} (${mergeRows}行x${mergeCols}列)`);

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        invalidReasons.push(`合并${i}: 验证时出错 - ${errorMsg}`);
      }
    }

    // 输出验证结果摘要
    console.log(`📊 合并单元格验证完成: ${validMerges.length}个有效, ${invalidReasons.length}个无效`);
    if (invalidReasons.length > 0) {
      console.log(`❌ 无效合并原因:`, invalidReasons);
    }

    return validMerges;
  }

  /**
   * 应用基础样式（简化版，避免文件损坏）
   */
  private static _applyBasicStyles(ws: any, config: any, _data: any[][]): void {
    console.log('🎨 开始应用基础样式');

    try {
      if (!ws['!ref']) {
        console.warn('工作表没有有效的范围，跳过基础样式应用');
        return;
      }

      const range = XLSXStyle.utils.decode_range(ws['!ref']);
      const columnCount = config.columns ? config.columns.length : (range.e.c + 1);

      // 只应用基础的表头样式
      let headerRow = 0;

      // 跳过标题和元数据行
      if (config.header && config.header.title) {
        headerRow += 2;
      }
      if (config.header && config.header.fields && config.header.fields.length > 0) {
        headerRow += 2;
      }

      // 表头样式
      if (config.columns && headerRow <= range.e.r) {
        for (let col = 0; col < columnCount && col <= range.e.c; col++) {
          const cellRef = XLSXStyle.utils.encode_cell({ r: headerRow, c: col });
          if (ws[cellRef]) {
            ws[cellRef].s = {
              font: { bold: true, sz: 11 },
              fill: { fgColor: { rgb: "F2F2F2" } },
              alignment: { horizontal: "center", vertical: "center" }
            };
          }
        }
      }

      // 设置基础列宽
      if (!ws['!cols']) ws['!cols'] = [];
      for (let col = 0; col <= range.e.c && col < 256; col++) {
        ws['!cols'][col] = { wch: 12 }; // 固定宽度
      }

      console.log('🎨 基础样式应用完成');
    } catch (error) {
      console.error('应用基础样式失败:', error);
    }
  }
}
