/**
 * DDR报表小计合计数据预处理工具 - CommonJS版本
 * 适用于Node.js环境和不支持ES6模块的项目
 * 
 * @author DDR Team
 * @version 1.0.0
 */

/**
 * 汇总计算函数
 * @param {Array} data - 数据数组
 * @param {string} field - 字段名
 * @param {string} type - 汇总类型：sum, avg, count, max, min
 * @returns {number} 汇总结果
 */
function calculateSummary(data, field, type = 'sum') {
  if (!data.length) return 0;

  const values = data.map(item => {
    const value = item[field];
    return typeof value === 'number' ? value : parseFloat(value) || 0;
  }).filter(val => !isNaN(val));

  if (!values.length) return 0;

  switch (type.toLowerCase()) {
    case 'sum':
      return values.reduce((sum, val) => sum + val, 0);
    case 'avg':
      return values.reduce((sum, val) => sum + val, 0) / values.length;
    case 'count':
      return values.length;
    case 'max':
      return Math.max(...values);
    case 'min':
      return Math.min(...values);
    default:
      return 0;
  }
}

/**
 * 单级分组处理
 * @param {Array} data - 原始数据
 * @param {Object} options - 配置选项
 * @returns {Array} 处理后的数据（包含小计行）
 */
function processSingleGroupSubtotals(data, options) {
  const {
    groupBy,
    subtotals = [],
    subtotalLabel = '小计',
    showGrandTotal = true,
    grandTotalLabel = '总计'
  } = options;

  if (!data.length || !groupBy) return data;

  // 按分组字段分组
  const grouped = {};
  data.forEach(item => {
    const groupKey = item[groupBy];
    if (!grouped[groupKey]) {
      grouped[groupKey] = [];
    }
    grouped[groupKey].push({
      ...item,
      _rowType: 'data',
      _level: 0,
      _groupKey: groupKey
    });
  });

  const result = [];
  const grandTotals = {};

  // 处理每个分组
  Object.keys(grouped).forEach(groupKey => {
    const groupData = grouped[groupKey];
    
    // 添加分组数据
    result.push(...groupData);
    
    // 创建小计行
    const subtotalRow = {
      [groupBy]: `${groupKey} ${subtotalLabel}`,
      _rowType: 'subtotal',
      _level: 1,
      _groupKey: groupKey,
      _isSubtotal: true
    };

    // 计算各字段的小计
    subtotals.forEach(subtotalConfig => {
      const { field, type = 'sum' } = subtotalConfig;
      const subtotalValue = calculateSummary(groupData, field, type);
      subtotalRow[field] = subtotalValue;

      // 累计到总计
      if (showGrandTotal) {
        if (!grandTotals[field]) {
          grandTotals[field] = { type, values: [] };
        }
        grandTotals[field].values.push(subtotalValue);
      }
    });

    result.push(subtotalRow);
  });

  // 添加总计行
  if (showGrandTotal && subtotals.length > 0) {
    const grandTotalRow = {
      [groupBy]: grandTotalLabel,
      _rowType: 'total',
      _level: 0,
      _isGrandTotal: true
    };

    subtotals.forEach(subtotalConfig => {
      const { field, type = 'sum' } = subtotalConfig;
      if (grandTotals[field]) {
        const { values } = grandTotals[field];
        grandTotalRow[field] = type === 'sum' 
          ? values.reduce((sum, val) => sum + val, 0)
          : calculateSummary(data, field, type);
      }
    });

    result.push(grandTotalRow);
  }

  return result;
}

/**
 * 主要的数据预处理函数
 * @param {Array} data - 原始数据数组
 * @param {Object} options - 配置选项
 * @returns {Array} 处理后的数据（包含小计和合计行）
 */
function processSubtotals(data, options = {}) {
  if (!Array.isArray(data) || data.length === 0) {
    console.warn('DDR Subtotal Processor: 数据为空或格式不正确');
    return data;
  }

  const {
    groupBy,
    subtotals = [],
    ...otherOptions
  } = options;

  console.log(`📊 开始处理小计数据，原始数据 ${data.length} 行`);

  const groupField = Array.isArray(groupBy) ? groupBy[0] : groupBy;
  const result = processSingleGroupSubtotals(data, { groupBy: groupField, subtotals, ...otherOptions });
  
  console.log(`✅ 分组处理完成，结果数据 ${result.length} 行`);
  return result;
}

/**
 * 获取小计合计行的样式配置
 * @returns {Array} 条件样式配置数组
 */
function getSubtotalStyles() {
  return [
    {
      when: 'row._rowType === "subtotal"',
      style: {
        fontWeight: 'bold',
        backgroundColor: '#f5f5f5',
        borderTop: '1px solid #d9d9d9'
      }
    },
    {
      when: 'row._rowType === "total"',
      style: {
        fontWeight: 'bold',
        backgroundColor: '#e6f7ff',
        color: '#1890ff',
        borderTop: '2px solid #1890ff'
      }
    }
  ];
}

/**
 * 快速创建按单个字段分组的小计数据
 * @param {Array} data - 原始数据
 * @param {string} groupField - 分组字段
 * @param {Array} sumFields - 需要求和的字段数组
 * @param {Object} options - 其他选项
 * @returns {Array} 处理后的数据
 */
function createSimpleSubtotals(data, groupField, sumFields, options = {}) {
  const subtotals = sumFields.map(field => ({ field, type: 'sum' }));
  
  return processSubtotals(data, {
    groupBy: groupField,
    subtotals,
    subtotalLabel: options.subtotalLabel || '小计',
    showGrandTotal: options.showGrandTotal !== false,
    grandTotalLabel: options.grandTotalLabel || '总计'
  });
}

/**
 * 为现有数据添加汇总统计信息
 * @param {Array} data - 包含小计的数据
 * @param {Array} originalData - 原始数据（用于计算总体统计）
 * @param {Array} statFields - 需要统计的字段配置
 * @returns {Array} 增强后的数据
 */
function enhanceWithStatistics(data, originalData, statFields) {
  return data.map(row => {
    if (row._rowType === 'total') {
      const enhanced = { ...row };
      
      statFields.forEach(({ field, type, newField }) => {
        const targetField = newField || `${type}_${field}`;
        enhanced[targetField] = calculateSummary(originalData, field, type);
      });
      
      return enhanced;
    }
    return row;
  });
}

// CommonJS导出
module.exports = {
  processSubtotals,
  getSubtotalStyles,
  calculateSummary,
  createSimpleSubtotals,
  enhanceWithStatistics
};

// 如果在浏览器环境中使用
if (typeof window !== 'undefined') {
  window.DDRSubtotalProcessor = {
    processSubtotals,
    getSubtotalStyles,
    calculateSummary,
    createSimpleSubtotals,
    enhanceWithStatistics
  };
}
