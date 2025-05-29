# DDR报表内置分组小计功能使用指南

## 概述

DDR报表组件现已内置分组小计功能，无需手动预处理数据，只需在配置中启用`grouping`选项即可实现自动分组、小计计算和样式应用。

## 核心特性

### ✅ 已实现功能
- **自动数据处理**：组件内部自动处理数据分组和小计计算
- **多种汇总类型**：支持sum、avg、count、max、min等统计类型
- **智能样式应用**：自动应用小计行和总计行样式
- **导出兼容**：PDF和Excel导出完全保持分组格式
- **性能优化**：内置算法优化，处理速度快
- **配置简单**：通过简单配置即可启用复杂分组功能

## 基础配置

### 1. 启用分组功能

```javascript
const config = {
  dataSource: { data: rawData },
  
  // 启用内置分组功能
  grouping: {
    enabled: true,                    // 必须设置为true
    groupBy: 'region',               // 分组字段
    subtotals: [                     // 小计配置
      { field: 'amount', type: 'sum' },
      { field: 'quantity', type: 'sum' }
    ],
    subtotalLabel: '小计',           // 小计行标签（可选）
    showGrandTotal: true,            // 是否显示总计行（可选）
    grandTotalLabel: '总计'          // 总计行标签（可选）
  },
  
  columns: [
    {
      key: 'region',
      title: '地区',
      width: 100,
      merge: 'vertical'              // 建议为分组列启用合并
    },
    // ... 其他列配置
  ]
};
```

### 2. 汇总类型说明

```javascript
subtotals: [
  { field: 'amount', type: 'sum' },      // 求和
  { field: 'quantity', type: 'sum' },    // 求和
  { field: 'price', type: 'avg' },       // 平均值
  { field: 'count', type: 'count' },     // 计数
  { field: 'maxValue', type: 'max' },    // 最大值
  { field: 'minValue', type: 'min' }     // 最小值
]
```

## 高级配置

### 1. 自定义样式

```javascript
grouping: {
  enabled: true,
  groupBy: 'category',
  subtotals: [
    { field: 'amount', type: 'sum' },
    { field: 'quantity', type: 'sum' }
  ],
  
  // 自定义样式配置
  styles: {
    subtotalRow: {                       // 小计行样式
      fontWeight: 'bold',
      backgroundColor: '#fff7e6',
      borderTop: '2px solid #ffa940',
      color: '#d46b08'
    },
    totalRow: {                          // 总计行样式
      fontWeight: 'bold',
      backgroundColor: '#f6ffed',
      borderTop: '2px solid #52c41a',
      color: '#389e0d'
    },
    groupColumn: {                       // 分组列样式
      fontWeight: '600',
      color: '#722ed1'
    }
  }
}
```

### 2. 多字段汇总

```javascript
grouping: {
  enabled: true,
  groupBy: 'region',
  subtotals: [
    { field: 'amount', type: 'sum' },      // 销售额求和
    { field: 'cost', type: 'sum' },        // 成本求和
    { field: 'quantity', type: 'sum' },    // 数量求和
    { field: 'price', type: 'avg' },       // 单价平均值
    { field: 'profit', type: 'max' }       // 最大利润
  ],
  subtotalLabel: '地区汇总',
  showGrandTotal: true,
  grandTotalLabel: '全国总计'
}
```

## 完整示例

### 基础分组示例

```javascript
// 原始数据
const salesData = [
  { region: '华东', product: '产品A', amount: 1000, quantity: 10 },
  { region: '华东', product: '产品B', amount: 2000, quantity: 20 },
  { region: '华南', product: '产品C', amount: 1500, quantity: 15 },
  // ... 更多数据
];

// DDR配置
const config = {
  dataSource: { data: salesData },
  
  header: {
    title: { text: '销售报表 - 按地区分组' },
    subtitle: { text: '使用内置分组功能统计各地区销售情况' }
  },
  
  // 内置分组配置
  grouping: {
    enabled: true,
    groupBy: 'region',
    subtotals: [
      { field: 'amount', type: 'sum' },
      { field: 'quantity', type: 'sum' }
    ],
    subtotalLabel: '小计',
    showGrandTotal: true,
    grandTotalLabel: '总计'
  },
  
  columns: [
    {
      key: 'region',
      title: '地区',
      width: 100,
      merge: 'vertical'  // 启用垂直合并
    },
    {
      key: 'product',
      title: '产品',
      width: 120
    },
    {
      key: 'amount',
      title: '销售额',
      width: 150,
      align: 'right',
      formatter: 'currency'
    },
    {
      key: 'quantity',
      title: '数量',
      width: 100,
      align: 'right',
      formatter: 'number'
    }
  ],
  
  layout: {
    rowHeight: 40,
    stripe: true,
    bordered: true,
    hover: true
  },
  
  features: {
    exportExcel: true,
    exportPdf: true,
    watermark: '公司水印'
  }
};

// 创建报表
const report = DDR.create({
  container: document.getElementById('report'),
  config: config
});
```

## 样式定制

### 1. 使用预定义CSS类

组件会自动为分组行添加CSS类，您可以通过CSS进一步定制样式：

```css
/* 小计行样式 */
.ddr-subtotal-cell {
  font-weight: bold;
  background-color: #f5f5f5;
  border-top: 1px solid #d9d9d9;
}

/* 总计行样式 */
.ddr-total-cell {
  font-weight: bold;
  background-color: #e6f7ff;
  color: #1890ff;
  border-top: 2px solid #1890ff;
}

/* 分组行悬停效果 */
.ddr-body-row[data-row-type="subtotal"]:hover {
  background-color: #e8e8e8;
}

.ddr-body-row[data-row-type="total"]:hover {
  background-color: #d4edff;
}
```

### 2. 动态样式配置

```javascript
// 根据数据动态设置样式
grouping: {
  enabled: true,
  groupBy: 'region',
  subtotals: [{ field: 'amount', type: 'sum' }],
  styles: {
    subtotalRow: {
      fontWeight: 'bold',
      backgroundColor: data => data.amount > 10000 ? '#e6f7ff' : '#f5f5f5'
    }
  }
}
```

## 导出支持

内置分组功能完全支持PDF和Excel导出：

```javascript
// 导出Excel（保持分组格式）
report.exportTo('excel', {
  fileName: '销售报表_分组统计.xlsx',
  includeHeader: true,
  includeFooter: true
});

// 导出PDF（保持分组样式）
report.exportTo('pdf', {
  fileName: '销售报表_分组统计.pdf',
  orientation: 'landscape',
  pageSize: 'A4'
});
```

## 性能优化

### 1. 数据量建议
- **小数据量**（<500行）：前端处理，响应快速
- **中等数据量**（500-2000行）：前端处理，性能良好
- **大数据量**（>2000行）：建议后端预处理或分页加载

### 2. 优化技巧
```javascript
// 为大数据量启用虚拟滚动
layout: {
  virtualScroll: true,
  rowHeight: 40
}

// 合理设置分组字段
grouping: {
  enabled: true,
  groupBy: 'region',  // 选择基数适中的字段
  // 避免使用基数过大的字段（如ID、时间戳等）
}
```

## 最佳实践

### 1. 分组字段选择
- ✅ 选择基数适中的字段（如地区、类别、部门等）
- ✅ 确保分组字段数据质量良好，无空值
- ❌ 避免使用唯一性字段（如ID、订单号等）
- ❌ 避免使用连续数值字段（如金额、时间戳等）

### 2. 汇总字段配置
- ✅ 为数值字段选择合适的汇总类型
- ✅ 使用avg类型时确保字段为有效数值
- ✅ 合理组合多种汇总类型

### 3. 样式设计
- ✅ 保持小计行和总计行的视觉层次
- ✅ 使用不同颜色区分不同级别的汇总
- ✅ 确保打印和导出时样式正确显示

## 故障排除

### 问题1：分组不生效
**原因**：grouping.enabled未设置为true
**解决**：确保配置中`grouping.enabled: true`

### 问题2：小计计算错误
**原因**：汇总字段包含非数值数据
**解决**：检查数据质量，确保汇总字段为有效数值

### 问题3：样式不显示
**原因**：CSS文件未正确加载
**解决**：确保引入了最新的ddr-core.css文件

### 问题4：导出格式丢失
**原因**：使用了旧版本组件
**解决**：更新到最新版本的DDR组件

## 版本兼容性

- **最低版本要求**：DDR v1.2.0+
- **推荐版本**：DDR v1.3.0+
- **TypeScript支持**：完整类型定义
- **浏览器兼容**：Chrome 60+, Firefox 55+, Safari 12+, Edge 79+

## 示例文件

完整的示例代码请参考：
- `examples/grouping-builtin/index.html` - 内置分组功能完整演示
- `examples/subtotal/index.html` - 数据预处理方式对比
- `docs/grouping-builtin-guide.md` - 本使用指南
