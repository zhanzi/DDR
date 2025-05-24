# DDR (Data-Driven Report)

基于纯数据驱动的企业级报表组件，支持Excel/PDF导出、打印、动态表头表尾等功能。

## 特点

- **纯数据驱动**：通过JSON配置定义报表的方方面面，无需编写HTML
- **高性能**：支持DOM/Canvas双引擎渲染，自动适配大数据量（10万+行）
- **跨框架**：提供原生、React、Vue封装，易于集成到各种项目
- **导出功能**：支持Excel、PDF、图片导出，确保导出结果与页面显示一致
- **表头表尾**：支持复杂的表头表尾布局，支持数据绑定和动态元数据
- **单元格合并**：支持垂直和水平方向的单元格合并
- **主题支持**：内置多种主题，支持自定义样式
- **条件格式**：支持基于数据的条件单元格样式

## 安装

```bash
npm install data-driven-report --save
```

## 基本用法

### 原生JavaScript

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="path/to/ddr-core.css">
</head>
<body>
  <div id="report" style="width: 100%; height: 600px;"></div>
  <script src="path/to/ddr-core.js"></script>
  <script>
    // 创建报表实例
    const report = DDR.create({
      container: document.getElementById('report'),
      config: {
        meta: { name: "销售报表" },
        dataSource: { api: "/api/sales" },
        columns: [
          { key: "product", title: "产品名称" },
          { key: "amount", title: "销售额", formatter: "currency" }
        ]
      }
    });

    // 导出为Excel
    document.getElementById('exportBtn').addEventListener('click', () => {
      report.exportTo('excel', { fileName: '销售报表' });
    });
  </script>
</body>
</html>
```

### React

```jsx
import React from 'react';
import { DDRReport } from 'data-driven-report/react';

const SalesReport = () => {
  const config = {
    meta: { name: "销售报表" },
    dataSource: { api: "/api/sales" },
    columns: [
      { key: "product", title: "产品名称" },
      { key: "amount", title: "销售额", formatter: "currency" }
    ]
  };

  return (
    <div style={{ height: '600px' }}>
      <DDRReport
        config={config}
        theme="default"
        onDataLoaded={(data) => console.log('数据加载完成', data)}
      />
    </div>
  );
};

export default SalesReport;
```

### Vue 3

```vue
<template>
  <div style="height: 600px">
    <DDRReport
      :config="config"
      theme="default"
      @data-loaded="onDataLoaded"
    />
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue';
import { DDRReport } from 'data-driven-report/vue';

export default defineComponent({
  components: { DDRReport },
  setup() {
    const config = {
      meta: { name: "销售报表" },
      dataSource: { api: "/api/sales" },
      columns: [
        { key: "product", title: "产品名称" },
        { key: "amount", title: "销售额", formatter: "currency" }
      ]
    };

    const onDataLoaded = (data) => {
      console.log('数据加载完成', data);
    };

    return { config, onDataLoaded };
  }
});
</script>
```

## 配置参考

报表配置通过JSON对象进行定义，包含以下主要部分：

```json
{
  "meta": {
    "name": "报表名称",
    "version": "1.0"
  },
  "dataSource": {
    "api": "/api/data",
    "method": "GET",
    "params": { "type": "monthly" }
  },
  "header": {
    "title": { "metadataPath": "report.title" },
    "logo": { "url": "logo.png" },
    "fields": [
      {
        "key": "period",
        "label": "统计周期:",
        "metadataPath": "period.description"
      }
    ]
  },
  "columns": [
    {
      "key": "id",
      "title": "序号",
      "width": 80
    },
    {
      "key": "amount",
      "title": "金额",
      "formatter": "currency",
      "align": "right"
    }
  ],
  "footer": {
    "summary": [
      {
        "column": "amount",
        "type": "sum",
        "metadataPath": "summary.totalAmount"
      }
    ],
    "signatures": [
      {
        "label": "制表人",
        "metadataPath": "personnel.creator.name"
      }
    ]
  },
  "features": {
    "exportExcel": true,
    "watermark": "机密"
  }
}
```

## API参考

### 核心API

```typescript
// 创建报表实例
DDR.create(options: DDROptions): DDRInstance

// 注册自定义格式化函数
DDR.registerFormatter(name: string, formatter: Function): void
```

### 实例方法

```typescript
// 重新加载数据
reload(params?: object): Promise<void>

// 刷新元数据
refreshMetadata(): Promise<void>

// 更新元数据
updateMetadata(metadata: object): void

// 导出功能
exportTo(type: "excel" | "pdf", options?: ExportOptions): Promise<void>

// 销毁实例
destroy(): void

// 打印
print(): void

// 获取原始数据
getData(): any[]

// 获取元数据
getMetadata(): object

// 事件监听
on(event: DDREvent, callback: Function): void
off(event: DDREvent, callback: Function): void
```

### 事件类型

- `data-loaded`: 数据加载完成
- `render-complete`: 渲染完成
- `export-start`: 导出开始
- `export-complete`: 导出完成
- `metadata-updated`: 元数据更新
- `error`: 错误事件

## 表头表尾配置

表头和表尾支持从元数据中动态绑定数据：

```json
{
  "header": {
    "title": {
      "metadataPath": "report.title" // 从元数据中获取标题
    },
    "fields": [
      {
        "key": "company",
        "label": "公司:",
        "metadataPath": "company.name" // 从元数据中获取值
      }
    ]
  },
  "footer": {
    "signatures": [
      {
        "label": "制表人",
        "metadataPath": "personnel.creator.name", // 从元数据中获取签名人
        "dateMetadataPath": "personnel.creator.timestamp" // 从元数据中获取日期
      }
    ]
  }
}
```

## 导出功能

DDR支持多种导出格式，确保导出结果与页面显示完全一致：

- **Excel导出**：支持样式、格式化、合并单元格、表头表尾
- **PDF导出**：支持精确分页、水印、表头表尾、横竖版选择
- **图片导出**：支持PNG、JPEG格式

### Excel导出

```javascript
// 基础导出
report.exportTo('excel', { fileName: '销售报表' });

// 高级配置
report.exportTo('excel', {
  fileName: '销售报表',
  sheetName: '销售数据',
  includeHeader: true,
  includeFooter: true,
  format: 'xlsx',
  styling: true // 保留样式和格式化
});
```

### PDF导出

DDR的PDF导出采用精确分页算法，确保表头表尾正确显示，避免内容截断：

```javascript
// 基础导出
report.exportTo('pdf', { fileName: '销售报表' });

// 高级配置
report.exportTo('pdf', {
  fileName: '销售报表',
  orientation: 'portrait', // 'portrait' | 'landscape'
  pageSize: 'A4', // 'A4' | 'A3' | 'Letter'
  watermark: '机密文件',
  relayout: true, // 重新排版而非缩放
  quality: 0.95, // 图像质量 (0.1-1.0)
  margins: { // 页边距 (mm)
    top: 15,
    bottom: 15,
    left: 15,
    right: 15
  }
});
```

#### PDF导出特性

- **精确分页**：基于实际内容高度计算分页点，避免表格行被截断
- **表头表尾保持**：第一页显示表头，最后一页显示表尾，必要时新建页面
- **智能布局**：自动计算每页可容纳的行数，充分利用页面空间
- **水印支持**：支持中文水印，使用Canvas渲染避免字体问题
- **版式选择**：支持横版/竖版，可在配置中预设或导出时选择

#### PDF配置选项

```typescript
interface PDFExportOptions {
  fileName?: string;           // 文件名
  orientation?: 'portrait' | 'landscape'; // 页面方向
  pageSize?: 'A4' | 'A3' | 'Letter';     // 页面大小
  watermark?: string;          // 水印文字
  relayout?: boolean;          // 是否重新排版
  quality?: number;            // 图像质量 (0.1-1.0)
  margins?: {                  // 页边距 (mm)
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  // 高级选项
  pageBreakStrategy?: 'auto' | 'manual'; // 分页策略
  headerOnEveryPage?: boolean;           // 每页显示表头
  footerOnLastPage?: boolean;            // 仅最后页显示表尾
}
```

## 数据格式化

DDR支持多种内置格式化器：

- `date`: 日期格式化
- `currency`: 货币格式化
- `number`: 数字格式化
- `percentage`: 百分比格式化

也可以注册自定义格式化器：

```javascript
DDR.registerFormatter('phoneNumber', (value) => {
  return value.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
});
```

## 大数据量优化

DDR会根据数据量自动选择渲染模式：

- 数据量小于5000行：使用DOM渲染（更易于调试和交互）
- 数据量大于5000行：使用Canvas渲染（更高的性能）

可以手动指定渲染模式：

```javascript
DDR.create({
  container: document.getElementById('report'),
  config: config,
  mode: 'canvas' // 强制使用Canvas渲染
});
```

## 浏览器兼容性

- Chrome 70+
- Firefox 65+
- Edge 80+
- Safari 13+

## 许可证

MIT
