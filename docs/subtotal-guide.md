# DDR报表小计合计功能使用指南

## 概述

DDR报表组件通过数据预处理的方式实现小计和合计功能，支持单级分组、多级分组和复杂汇总统计。本指南详细介绍如何使用小计合计功能。

## 核心工具函数

### processSubtotals(data, options)

主要的数据预处理函数，用于在原始数据中插入小计和合计行。

**参数说明：**
- `data` (Array): 原始数据数组
- `options` (Object): 配置选项

**配置选项：**
```javascript
{
  groupBy: 'region',           // 分组字段名
  subtotals: [                 // 小计配置数组
    { field: 'amount', type: 'sum' },
    { field: 'quantity', type: 'sum' }
  ],
  subtotalLabel: '小计',       // 小计行标签
  showGrandTotal: true,        // 是否显示总计行
  grandTotalLabel: '总计'      // 总计行标签
}
```

**汇总类型：**
- `sum`: 求和
- `avg`: 平均值
- `count`: 计数
- `max`: 最大值
- `min`: 最小值

## 基础使用示例

### 1. 简单分组小计

```javascript
import { processSubtotals, getSubtotalStyles } from '../src/utils/subtotal-processor.js';

// 原始数据
const rawData = [
  { region: '华东', product: '产品A', amount: 1000, quantity: 10 },
  { region: '华东', product: '产品B', amount: 2000, quantity: 20 },
  { region: '华南', product: '产品C', amount: 1500, quantity: 15 },
  // ... 更多数据
];

// 处理数据，按地区分组并添加小计
const processedData = processSubtotals(rawData, {
  groupBy: 'region',
  subtotals: [
    { field: 'amount', type: 'sum' },
    { field: 'quantity', type: 'sum' }
  ],
  subtotalLabel: '小计',
  showGrandTotal: true,
  grandTotalLabel: '总计'
});

// 配置DDR报表
const config = {
  dataSource: { data: processedData },
  columns: [
    {
      key: 'region',
      title: '地区',
      width: 100,
      merge: 'vertical',  // 配合合并功能
      style: {
        conditional: getSubtotalStyles()  // 应用小计样式
      }
    },
    {
      key: 'amount',
      title: '销售额',
      width: 150,
      align: 'right',
      formatter: 'currency',
      style: {
        conditional: getSubtotalStyles()
      }
    }
    // ... 其他列配置
  ]
};
```

### 2. 多级分组小计

```javascript
// 多级分组处理（地区 > 产品类别）
function createMultiLevelSubtotals(rawData) {
  // 先按地区分组
  const regionGrouped = processSubtotals(rawData, {
    groupBy: 'region',
    subtotals: [
      { field: 'amount', type: 'sum' },
      { field: 'quantity', type: 'sum' }
    ],
    subtotalLabel: '地区小计',
    showGrandTotal: false
  });

  // 再按产品类别在每个地区内分组
  const result = [];
  let regionData = [];

  regionGrouped.forEach(row => {
    if (row._rowType === 'subtotal') {
      // 处理当前地区的数据
      if (regionData.length > 0) {
        const categoryGrouped = processSubtotals(regionData, {
          groupBy: 'category',
          subtotals: [
            { field: 'amount', type: 'sum' },
            { field: 'quantity', type: 'sum' }
          ],
          subtotalLabel: '类别小计',
          showGrandTotal: false
        });
        result.push(...categoryGrouped);
      }
      result.push(row); // 添加地区小计行
      regionData = [];
    } else if (row._rowType === 'data') {
      regionData.push(row);
    }
  });

  // 添加总计行
  const grandTotalRow = {
    region: '总计',
    _rowType: 'total',
    _level: 0,
    _isGrandTotal: true,
    amount: calculateSummary(rawData, 'amount', 'sum'),
    quantity: calculateSummary(rawData, 'quantity', 'sum')
  };
  result.push(grandTotalRow);

  return result;
}
```

### 3. 复杂汇总统计

```javascript
// 包含多种统计类型的复杂汇总
const processedData = processSubtotals(rawData, {
  groupBy: 'region',
  subtotals: [
    { field: 'amount', type: 'sum' },      // 销售额求和
    { field: 'quantity', type: 'sum' },    // 数量求和
    { field: 'price', type: 'avg' }        // 单价平均值
  ],
  subtotalLabel: '小计',
  showGrandTotal: true,
  grandTotalLabel: '总计'
});

// 为汇总行添加额外的计算字段
const enhancedData = processedData.map(row => {
  if (row._rowType === 'subtotal' || row._rowType === 'total') {
    return {
      ...row,
      avgAmount: row.quantity > 0 ? (row.amount / row.quantity).toFixed(2) : 0,
      maxAmount: row._rowType === 'total' ? Math.max(...rawData.map(r => r.amount)) : '',
      minAmount: row._rowType === 'total' ? Math.min(...rawData.map(r => r.amount)) : ''
    };
  }
  return row;
});
```

## 样式配置

### getSubtotalStyles()

返回预定义的条件样式配置，用于区分普通行、小计行和总计行。

```javascript
// 获取预定义样式
const subtotalStyles = getSubtotalStyles();

// 自定义样式
const customStyles = [
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

// 在列配置中应用样式
{
  key: 'amount',
  title: '销售额',
  style: {
    conditional: subtotalStyles  // 或 customStyles
  }
}
```

## 行类型标识

处理后的数据会自动添加以下元数据字段：

- `_rowType`: 行类型 ('data' | 'subtotal' | 'total')
- `_level`: 层级 (0为最高级，数字越大层级越深)
- `_groupKey`: 分组键值
- `_isSubtotal`: 是否为小计行 (boolean)
- `_isGrandTotal`: 是否为总计行 (boolean)

## 导出支持

小计合计功能完全支持PDF和Excel导出：

```javascript
// 导出Excel
report.exportTo('excel', {
  fileName: '销售报表_小计合计.xlsx',
  includeHeader: true,
  includeFooter: true
});

// 导出PDF
report.exportTo('pdf', {
  fileName: '销售报表_小计合计.pdf',
  orientation: 'landscape'  // 横版适合宽表格
});
```

## 最佳实践

### 1. 数据预处理
- 确保原始数据按分组字段排序
- 在后端API中预处理大数据量
- 前端处理适合中小数据量（<1000行）

### 2. 样式设计
- 为小计行和总计行设置明显的视觉区分
- 使用不同的背景色和字体样式
- 配合merge功能实现分组视觉效果

### 3. 性能优化
- 大数据量时建议后端预处理
- 使用虚拟滚动优化渲染性能
- 合理设置分组层级，避免过度嵌套

### 4. 功能组合
- 配合单元格合并功能提升视觉效果
- 结合条件样式实现丰富的显示效果
- 与固定列功能配合使用

## 注意事项

1. **数据排序**：确保数据按分组字段排序，相同值的行应连续排列
2. **字段类型**：汇总字段应为数值类型，非数值会被转换为0
3. **内存使用**：大数据量时注意内存使用，建议分页处理
4. **样式继承**：小计行会继承第一个数据行的非汇总字段值
5. **导出兼容**：确保小计合计效果在PDF/Excel导出中正确显示

## 故障排除

### 问题1：小计不显示
- 检查数据是否按分组字段排序
- 确认subtotals配置正确
- 查看控制台是否有错误信息

### 问题2：样式不生效
- 确认使用了getSubtotalStyles()或正确的条件样式
- 检查_rowType字段是否正确添加
- 验证样式配置语法

### 问题3：导出时格式丢失
- 确认使用最新版本的DDR组件
- 检查导出配置是否正确
- 查看浏览器控制台错误信息

## 示例文件

完整的示例代码请参考：
- `examples/subtotal/index.html` - 完整的浏览器示例
- `src/utils/subtotal-processor.js` - 核心工具函数
