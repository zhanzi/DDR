# PDF导出配置优先级机制详解

## 配置优先级（从高到低）

1. **exportTo方法参数** - 最高优先级
2. **报表配置中的features.pdfConfig** - 默认配置  
3. **硬编码默认值** - 兜底配置

## 核心实现逻辑

```javascript
// 在 Exporter.toPDF 方法中的处理逻辑
static async toPDF(element: HTMLElement, config?: any, options: ExportOptions = {}) {
  // 1. 从 exportTo 方法参数中提取配置
  const {
    fileName = '报表',
    watermark = '',           // 如果不传，默认为空字符串
    pdf: pdfOptions = {}
  } = options;

  // 2. 从报表配置中获取PDF设置
  const configPdfSettings = config?.features?.pdfConfig || {};
  
  // 3. 合并配置：方法参数覆盖报表配置
  const mergedPdfOptions = { ...configPdfSettings, ...pdfOptions };

  // 4. 应用最终配置（带硬编码默认值）
  const pageSize = mergedPdfOptions.pageSize || 'A4';
  const orientation = mergedPdfOptions.orientation || 'portrait';
  const quality = mergedPdfOptions.quality || 0.95;
  const multiPage = mergedPdfOptions.multiPage !== false;
  const relayout = mergedPdfOptions.relayout !== false;
  
  // 5. 水印处理：优先使用方法参数，其次使用报表配置
  const finalWatermark = watermark || config?.features?.watermark || '';
}
```

## 实际使用示例

### 场景1：使用报表配置的默认值

```javascript
// 报表配置
const reportConfig = {
  features: {
    watermark: '公司机密',
    pdfConfig: {
      orientation: 'landscape',
      pageSize: 'A4',
      margins: { top: 20, right: 15, bottom: 20, left: 15 },
      quality: 0.95
    }
  }
};

// 导出时不传参数，使用配置默认值
report.exportTo('pdf', {
  fileName: '销售报表'
  // 其他配置都会使用报表配置中的默认值
});

// 实际生效的配置：
// - watermark: '公司机密' (来自 config.features.watermark)
// - orientation: 'landscape' (来自 config.features.pdfConfig.orientation)
// - pageSize: 'A4' (来自 config.features.pdfConfig.pageSize)
// - margins: { top: 20, right: 15, bottom: 20, left: 15 }
// - quality: 0.95
```

### 场景2：方法参数覆盖报表配置

```javascript
// 报表配置（同上）
const reportConfig = {
  features: {
    watermark: '公司机密',
    pdfConfig: {
      orientation: 'landscape',
      pageSize: 'A4',
      quality: 0.95
    }
  }
};

// 导出时传入参数，覆盖部分配置
report.exportTo('pdf', {
  fileName: '特殊报表',
  watermark: '绝密文件',        // 覆盖配置中的水印
  pdf: {
    orientation: 'portrait',   // 覆盖配置中的方向
    quality: 0.8              // 覆盖配置中的质量
    // pageSize 未指定，使用配置中的 'A4'
  }
});

// 实际生效的配置：
// - watermark: '绝密文件' (方法参数覆盖)
// - orientation: 'portrait' (方法参数覆盖)
// - pageSize: 'A4' (使用配置默认值)
// - quality: 0.8 (方法参数覆盖)
```

### 场景3：完全使用硬编码默认值

```javascript
// 报表配置中没有PDF相关配置
const reportConfig = {
  // 没有 features.pdfConfig 和 features.watermark
};

// 导出时也不传参数
report.exportTo('pdf', {
  fileName: '默认报表'
});

// 实际生效的配置（全部使用硬编码默认值）：
// - watermark: '' (空字符串)
// - orientation: 'portrait'
// - pageSize: 'A4'
// - quality: 0.95
// - multiPage: true
// - relayout: true
// - margins: { top: 15, right: 15, bottom: 15, left: 15 }
```

## 支持的配置项

### 基础配置
- **fileName**: 文件名称
- **watermark**: 水印文本

### PDF专用配置 (pdf对象)
- **pageSize**: 页面大小 ('A4', 'Letter', 'A3')
- **orientation**: 页面方向 ('portrait', 'landscape')
- **quality**: 图像质量 (0-1)
- **multiPage**: 是否支持多页 (boolean)
- **relayout**: 是否重新排版 (boolean)
- **margins**: 页边距 { top, right, bottom, left }

## 配置合并规则

```javascript
// 伪代码展示合并逻辑
const finalConfig = {
  // 1. 硬编码默认值
  pageSize: 'A4',
  orientation: 'portrait',
  quality: 0.95,
  
  // 2. 报表配置覆盖默认值
  ...config?.features?.pdfConfig,
  
  // 3. 方法参数覆盖报表配置
  ...options.pdf
};

const finalWatermark = 
  options.watermark ||           // 方法参数优先
  config?.features?.watermark || // 报表配置其次
  '';                           // 默认空字符串
```

## 最佳实践建议

1. **全局配置**: 在报表配置中设置常用的PDF选项
2. **特殊需求**: 在导出时传入参数覆盖特定配置
3. **水印管理**: 可以在配置中设置默认水印，导出时根据需要覆盖
4. **版式适配**: 在配置中设置默认版式，特殊报表可以临时调整

这种设计既保证了配置的灵活性，又避免了每次导出都要重复设置相同参数的麻烦。
