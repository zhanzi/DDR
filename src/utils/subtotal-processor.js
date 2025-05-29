/**
 * DDR报表小计合计数据预处理工具
 * 
 * 功能：
 * 1. 按指定字段对数据进行分组
 * 2. 为每个分组计算小计并插入小计行
 * 3. 可选择添加总计行
 * 4. 支持多级分组和多字段汇总
 * 5. 自动添加行类型标识，便于样式配置
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
    groupBy,           // 分组字段
    subtotals = [],    // 小计配置数组
    subtotalLabel = '小计',  // 小计标签
    showGrandTotal = true,   // 是否显示总计
    grandTotalLabel = '总计' // 总计标签
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
  const grandTotals = {}; // 存储总计数据

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
      const { field, type = 'sum', label } = subtotalConfig;
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
 * 多级分组处理
 * @param {Array} data - 原始数据
 * @param {Object} options - 配置选项
 * @returns {Array} 处理后的数据（包含多级小计行）
 */
function processMultiLevelSubtotals(data, options) {
  const {
    groupBy = [],      // 分组字段数组，按层级顺序
    subtotals = [],    // 小计配置数组
    subtotalLabels = ['小计'], // 各级小计标签
    showGrandTotal = true,     // 是否显示总计
    grandTotalLabel = '总计'   // 总计标签
  } = options;

  if (!data.length || !groupBy.length) return data;

  // 递归分组函数
  function groupDataRecursively(items, groupFields, level = 0) {
    if (level >= groupFields.length) {
      return items.map(item => ({
        ...item,
        _rowType: 'data',
        _level: level,
        _groupPath: groupFields.map(field => item[field]).join(' > ')
      }));
    }

    const currentField = groupFields[level];
    const grouped = {};
    
    items.forEach(item => {
      const groupKey = item[currentField];
      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push(item);
    });

    const result = [];
    
    Object.keys(grouped).forEach(groupKey => {
      const groupData = grouped[groupKey];
      
      // 递归处理下一级
      const processedData = groupDataRecursively(groupData, groupFields, level + 1);
      result.push(...processedData);
      
      // 添加当前级别的小计行
      const subtotalLabel = subtotalLabels[level] || '小计';
      const subtotalRow = {
        [currentField]: `${groupKey} ${subtotalLabel}`,
        _rowType: 'subtotal',
        _level: level + 1,
        _groupKey: groupKey,
        _groupLevel: level,
        _isSubtotal: true
      };

      // 计算小计
      subtotals.forEach(subtotalConfig => {
        const { field, type = 'sum' } = subtotalConfig;
        subtotalRow[field] = calculateSummary(groupData, field, type);
      });

      result.push(subtotalRow);
    });

    return result;
  }

  const result = groupDataRecursively(data, groupBy);

  // 添加总计行
  if (showGrandTotal && subtotals.length > 0) {
    const grandTotalRow = {
      [groupBy[0]]: grandTotalLabel,
      _rowType: 'total',
      _level: 0,
      _isGrandTotal: true
    };

    subtotals.forEach(subtotalConfig => {
      const { field, type = 'sum' } = subtotalConfig;
      grandTotalRow[field] = calculateSummary(data, field, type);
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
export function processSubtotals(data, options = {}) {
  if (!Array.isArray(data) || data.length === 0) {
    console.warn('DDR Subtotal Processor: 数据为空或格式不正确');
    return data;
  }

  const {
    groupBy,           // 分组字段（字符串或数组）
    subtotals = [],    // 小计配置
    multiLevel = false, // 是否多级分组
    ...otherOptions
  } = options;

  console.log(`📊 开始处理小计数据，原始数据 ${data.length} 行`);

  let result;
  
  if (multiLevel && Array.isArray(groupBy)) {
    // 多级分组处理
    result = processMultiLevelSubtotals(data, { groupBy, subtotals, ...otherOptions });
    console.log(`✅ 多级分组处理完成，结果数据 ${result.length} 行`);
  } else {
    // 单级分组处理
    const groupField = Array.isArray(groupBy) ? groupBy[0] : groupBy;
    result = processSingleGroupSubtotals(data, { groupBy: groupField, subtotals, ...otherOptions });
    console.log(`✅ 单级分组处理完成，结果数据 ${result.length} 行`);
  }

  return result;
}

/**
 * 获取小计合计行的样式配置
 * @returns {Array} 条件样式配置数组
 */
export function getSubtotalStyles() {
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

// 默认导出
export default {
  processSubtotals,
  getSubtotalStyles,
  calculateSummary
};
