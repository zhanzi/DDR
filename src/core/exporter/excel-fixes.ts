/**
 * 修复Excel导出样式问题
 */

import * as XLSX from 'xlsx';

// 定义Excel样式辅助函数
export function applyExcelStyles(ws: any, data: any[][]) {
  // 定义通用样式
  const styles = {
    header: {
      font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "4472C4" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top: { style: 'medium', color: { rgb: '366092' } },
        right: { style: 'thin', color: { rgb: '366092' } },
        bottom: { style: 'medium', color: { rgb: '366092' } },
        left: { style: 'thin', color: { rgb: '366092' } }
      }
    },
    title: {
      font: { bold: true, sz: 18, color: { rgb: "000000" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: 'thin', color: { rgb: 'CCCCCC' } },
        bottom: { style: 'thin', color: { rgb: 'CCCCCC' } }
      }
    },
    metadata: {
      font: { sz: 11, color: { rgb: "333333" } },
      alignment: { horizontal: "left", vertical: "center" },
      border: { 
        top: { style: 'thin', color: { rgb: 'EEEEEE' } },
        right: { style: 'thin', color: { rgb: 'EEEEEE' } },
        bottom: { style: 'thin', color: { rgb: 'EEEEEE' } },
        left: { style: 'thin', color: { rgb: 'EEEEEE' } }
      }
    },
    cell: {
      font: { sz: 11, color: { rgb: "333333" } },
      alignment: { vertical: "center", wrapText: true },
      border: {
        top: { style: 'thin', color: { rgb: 'DDDDDD' } },
        right: { style: 'thin', color: { rgb: 'DDDDDD' } },
        bottom: { style: 'thin', color: { rgb: 'DDDDDD' } },
        left: { style: 'thin', color: { rgb: 'DDDDDD' } }
      }
    },
    oddRow: {
      fill: { fgColor: { rgb: "E9EDF4" } }
    },
    evenRow: {
      fill: { fgColor: { rgb: "FFFFFF" } }
    },
    summary: {
      font: { bold: true, sz: 11, color: { rgb: "000000" } },
      alignment: { horizontal: "right", vertical: "center" },
      border: {
        top: { style: 'medium', color: { rgb: 'CCCCCC' } },
        bottom: { style: 'medium', color: { rgb: 'CCCCCC' } }
      }
    }
  };

  // 判断表格结构
  if (!data || data.length === 0) return ws;

  // 查找标题行和数据行范围
  const headerRowIndex = findHeaderRowIndex(data);
  const dataInfo = analyzeDataStructure(data, headerRowIndex);

  // 应用样式到标题区域
  if (dataInfo.titleRowIndex >= 0) {
    for (let r = 0; r <= dataInfo.titleRowIndex; r++) {
      for (let c = 0; c < (data[r] ? data[r].length : 0); c++) {
        const cellRef = XLSX.utils.encode_cell({ r, c });
        if (!ws[cellRef]) continue;
        
        if (r === 0 && c === 0) {
          // 报表标题
          ws[cellRef].s = styles.title;
        } else {
          // 元数据
          ws[cellRef].s = styles.metadata;
        }
      }
    }
  }

  // 应用样式到表头
  if (headerRowIndex >= 0) {
    for (let c = 0; c < data[headerRowIndex].length; c++) {
      const cellRef = XLSX.utils.encode_cell({ r: headerRowIndex, c });
      if (!ws[cellRef]) continue;
      ws[cellRef].s = styles.header;
    }
  }

  // 应用样式到数据行
  for (let r = headerRowIndex + 1; r <= dataInfo.dataEndRowIndex; r++) {
    const isAlternateRow = (r - headerRowIndex) % 2 === 1;
    
    for (let c = 0; c < (data[r] ? data[r].length : 0); c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      if (!ws[cellRef]) continue;
      
      // 检查是否是数字
      const isNumber = isNumericCell(data[r][c]);
      
      // 合并基础样式与行样式
      ws[cellRef].s = {
        ...styles.cell,
        ...(isAlternateRow ? styles.oddRow : styles.evenRow),
        alignment: { 
          ...styles.cell.alignment,
          horizontal: isNumber ? "right" : "left"
        }
      };
    }
  }

  // 应用样式到汇总行
  if (dataInfo.summaryRowIndices.length > 0) {
    for (const r of dataInfo.summaryRowIndices) {
      for (let c = 0; c < (data[r] ? data[r].length : 0); c++) {
        const cellRef = XLSX.utils.encode_cell({ r, c });
        if (!ws[cellRef]) continue;
        ws[cellRef].s = styles.summary;
      }
    }
  }

  return ws;
}

// 辅助函数：查找表头行
function findHeaderRowIndex(data: any[][]): number {
  // 如果数据少于3行，假设没有表头
  if (data.length < 3) return 0;
  
  // 通常表头行是有固定列数的一行，位于顶部附近
  for (let i = 0; i < Math.min(10, data.length - 1); i++) {
    if (data[i] && data[i+1] && 
        data[i].length === data[i+1].length && 
        data[i].length >= 3) {
      return i;
    }
  }
  
  // 默认返回第一行
  return 0;
}

// 辅助函数：分析数据结构
function analyzeDataStructure(data: any[][], headerRowIndex: number) {
  const result = {
    titleRowIndex: -1,
    dataEndRowIndex: data.length - 1,
    summaryRowIndices: [] as number[]
  };
  
  // 查找标题行
  if (headerRowIndex > 0) {
    result.titleRowIndex = 0;
  }
  
  // 查找汇总行和数据结束行
  for (let r = data.length - 1; r > headerRowIndex; r--) {
    const row = data[r];
    if (!row || row.length === 0) continue;
    
    // 检查是否是汇总行
    let isSummaryRow = false;
    for (let c = 0; c < row.length; c++) {
      const cell = row[c];
      if (cell && typeof cell === 'string' && 
          (cell.includes('合计') || cell.includes('总计') || 
           cell.includes('汇总') || cell.includes('小计'))) {
        isSummaryRow = true;
        result.summaryRowIndices.push(r);
        break;
      }
    }
    
    // 如果不是汇总行，可能是最后一行数据
    if (!isSummaryRow && result.dataEndRowIndex === data.length - 1) {
      result.dataEndRowIndex = r;
    }
  }
  
  return result;
}

// 辅助函数：判断单元格是否包含数字
function isNumericCell(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'number') return true;
  
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return false;
    
    // 检查是否是数字格式
    return !isNaN(Number(trimmed)) && 
           !isNaN(parseFloat(trimmed)) &&
           !trimmed.includes(' '); // 不包含空格
  }
  
  return false;
}
