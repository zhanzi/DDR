# DDR报表组件 Vue使用指南

## 概述

DDR (Data-Driven Report) 是一个功能强大的数据驱动报表组件，支持Excel/PDF导出、打印、动态表头表尾、单元格合并、分组汇总等企业级功能。本指南详细介绍如何在Vue 3项目中使用该组件。

## 安装

```bash
npm install data-driven-report --save
```

## 基本使用

### 1. 引入组件

```vue
<script>
import { DDRReport } from 'data-driven-report/vue';
// 或者从本地路径引入（开发环境）
// import { DDRReport } from './src/adapters/vue';
</script>
```

### 2. 模板使用

```vue
<template>
  <div class="report-container">
    <!-- 工具栏 -->
    <div class="toolbar">
      <button @click="exportExcel">导出Excel</button>
      <button @click="exportPdf">导出PDF</button>
      <button @click="print">打印</button>
      <button @click="toggleTheme">切换主题</button>
    </div>

    <!-- 报表组件 -->
    <DDRReport
      ref="reportRef"
      :config="reportConfig"
      :theme="currentTheme"
      :metadata="metadata"
      mode="auto"
      lang="zh-CN"
      :debug="false"
      @data-loaded="onDataLoaded"
      @render-complete="onRenderComplete"
      @export-start="onExportStart"
      @export-complete="onExportComplete"
      @metadata-updated="onMetadataUpdated"
      @error="onError"
    />
  </div>
</template>
```

### 3. 组件配置

```vue
<script>
import { ref, defineComponent } from 'vue';
import { DDRReport } from 'data-driven-report/vue';

export default defineComponent({
  name: 'MyReport',
  components: { DDRReport },
  setup() {
    const reportRef = ref(null);
    const currentTheme = ref('default');
    const metadata = ref({});

    // 报表配置
    const reportConfig = {
      meta: {
        name: '销售报表',
        version: '1.0'
      },
      dataSource: {
        api: '/api/sales',
        method: 'GET',
        params: { type: 'monthly' }
      },
      header: {
        title: {
          metadataPath: 'report.title'
        },
        logo: {
          metadataPath: 'company.logo'
        },
        fields: [
          {
            key: 'company',
            label: '公司名称:',
            metadataPath: 'company.name'
          },
          {
            key: 'period',
            label: '统计周期:',
            metadataPath: 'period.description',
            position: 'right'
          }
        ]
      },
      columns: [
        {
          key: 'id',
          title: '序号',
          width: 80,
          align: 'center'
        },
        {
          key: 'product',
          title: '产品名称',
          width: 150
        },
        {
          key: 'amount',
          title: '销售额',
          width: 120,
          align: 'right',
          formatter: 'currency',
          style: {
            conditional: [
              {
                when: 'amount > 50000',
                style: {
                  color: '#1890ff',
                  fontWeight: 'bold'
                }
              }
            ]
          }
        }
      ],
      footer: {
        summary: [
          {
            column: 'amount',
            label: '总销售额:',
            metadataPath: 'summary.totalAmount',
            formatter: 'currency'
          }
        ],
        signatures: [
          {
            label: '制表人',
            metadataPath: 'personnel.creator.name',
            dateMetadataPath: 'personnel.creator.timestamp',
            showTimestamp: true
          }
        ]
      },
      features: {
        exportExcel: true,
        exportPdf: true,
        watermark: '机密文件'
      },
      layout: {
        height: '100%',
        rowHeight: 40,
        stripe: true,
        bordered: true,
        hover: true
      }
    };

    return {
      reportRef,
      reportConfig,
      currentTheme,
      metadata
    };
  }
});
</script>
```

## 组件属性 (Props)

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| config | String/Object | - | 报表配置，必填 |
| theme | String | 'default' | 主题名称 |
| mode | String | 'auto' | 渲染模式：auto/dom/canvas |
| lang | String | 'zh-CN' | 语言设置 |
| metadata | Object | {} | 元数据对象 |
| debug | Boolean | false | 是否开启调试模式 |

## 组件事件

| 事件名 | 参数 | 说明 |
|--------|------|------|
| data-loaded | data: Array | 数据加载完成 |
| render-complete | - | 渲染完成 |
| export-start | options: Object | 导出开始 |
| export-complete | result: Object | 导出完成 |
| metadata-updated | metadata: Object | 元数据更新 |
| error | error: Error | 错误事件 |

## 组件方法

通过ref引用调用组件方法：

```vue
<script>
export default {
  setup() {
    const reportRef = ref(null);

    // 导出Excel
    const exportExcel = () => {
      reportRef.value?.exportTo('excel', {
        fileName: '销售报表',
        includeHeader: true,
        includeFooter: true
      });
    };

    // 导出PDF
    const exportPdf = () => {
      reportRef.value?.exportTo('pdf', {
        fileName: '销售报表',
        orientation: 'portrait',
        watermark: '机密文件'
      });
    };

    // 打印
    const print = () => {
      reportRef.value?.print();
    };

    // 重新加载数据
    const reload = (params) => {
      reportRef.value?.reload(params);
    };

    // 更新元数据
    const updateMetadata = (newMetadata) => {
      reportRef.value?.updateMetadata(newMetadata);
    };

    // 获取数据
    const getData = () => {
      return reportRef.value?.getData();
    };

    // 获取元数据
    const getMetadata = () => {
      return reportRef.value?.getMetadata();
    };

    return {
      reportRef,
      exportExcel,
      exportPdf,
      print,
      reload,
      updateMetadata,
      getData,
      getMetadata
    };
  }
};
</script>
```

## 数据源配置

### API数据源

```javascript
const config = {
  dataSource: {
    api: '/api/sales',
    method: 'GET',
    params: { type: 'monthly' },
    headers: {
      'Authorization': 'Bearer token'
    }
  }
};
```

### 静态数据源

```javascript
const config = {
  dataSource: {
    data: [
      { id: 1, product: '产品A', amount: 1000 },
      { id: 2, product: '产品B', amount: 2000 }
    ]
  }
};
```

### 混合数据源

```javascript
const config = {
  dataSource: {
    api: '/api/sales',
    data: fallbackData, // API失败时的备用数据
    mock: mockData     // 开发环境的模拟数据
  }
};
```

## 响应式更新

组件支持配置和元数据的响应式更新：

```vue
<script>
export default {
  setup() {
    const config = ref(initialConfig);
    const metadata = ref(initialMetadata);

    // 动态更新配置
    const updateConfig = () => {
      config.value = {
        ...config.value,
        features: {
          ...config.value.features,
          watermark: '新水印'
        }
      };
    };

    // 动态更新元数据
    const updateMetadata = () => {
      metadata.value = {
        ...metadata.value,
        report: {
          title: '新标题'
        }
      };
    };

    return {
      config,
      metadata,
      updateConfig,
      updateMetadata
    };
  }
};
</script>
```

## 主题切换

```vue
<script>
export default {
  setup() {
    const currentTheme = ref('default');

    const toggleTheme = () => {
      currentTheme.value = currentTheme.value === 'default' ? 'dark' : 'default';
    };

    return {
      currentTheme,
      toggleTheme
    };
  }
};
</script>
```

## 样式定制

```vue
<style>
.report-container {
  width: 100%;
  height: 600px;
  border: 1px solid #e0e0e0;
}

.toolbar {
  padding: 16px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  gap: 12px;
}

.toolbar button {
  padding: 8px 16px;
  border: none;
  background-color: #1890ff;
  color: white;
  border-radius: 4px;
  cursor: pointer;
}

.toolbar button:hover {
  background-color: #40a9ff;
}
</style>
```

## 高级功能

### 1. 单元格合并

```javascript
const config = {
  columns: [
    {
      key: 'region',
      title: '地区',
      width: 100,
      merge: 'vertical' // 垂直合并相同值的单元格
    },
    {
      key: 'category',
      title: '类别',
      width: 120,
      merge: true // 简化写法，等同于 'vertical'
    }
  ]
};
```

### 2. 分组汇总

```javascript
const config = {
  // 内置分组功能
  grouping: {
    enabled: true,
    groupBy: 'region', // 按地区分组
    subtotals: [
      { field: 'amount', type: 'sum' },
      { field: 'quantity', type: 'sum' }
    ],
    subtotalLabel: '小计',
    showGrandTotal: true,
    grandTotalLabel: '总计'
  }
};
```

### 3. 条件格式

```javascript
const config = {
  columns: [
    {
      key: 'amount',
      title: '销售额',
      formatter: 'currency',
      style: {
        conditional: [
          {
            when: 'amount > 100000',
            style: {
              backgroundColor: '#f6ffed',
              color: '#52c41a',
              fontWeight: 'bold'
            }
          },
          {
            when: 'amount < 10000',
            style: {
              backgroundColor: '#fff2f0',
              color: '#ff4d4f'
            }
          }
        ]
      }
    }
  ]
};
```

### 4. 自定义格式化

```vue
<script>
import { DDRReport } from 'data-driven-report/vue';

// 注册自定义格式化器
DDR.registerFormatter('phoneNumber', (value) => {
  return value.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
});

export default {
  setup() {
    const config = {
      columns: [
        {
          key: 'phone',
          title: '联系电话',
          formatter: 'phoneNumber' // 使用自定义格式化器
        }
      ]
    };

    return { config };
  }
};
</script>
```

### 5. 导出配置

```vue
<script>
export default {
  setup() {
    const reportRef = ref(null);

    // Excel导出高级配置
    const exportExcelAdvanced = () => {
      reportRef.value?.exportTo('excel', {
        fileName: '销售报表_' + new Date().toISOString().split('T')[0],
        sheetName: '销售数据',
        includeHeader: true,
        includeFooter: true,
        format: 'xlsx',
        styling: true, // 保留样式
        watermark: '机密文件'
      });
    };

    // PDF导出高级配置
    const exportPdfAdvanced = () => {
      reportRef.value?.exportTo('pdf', {
        fileName: '销售报表_' + new Date().toISOString().split('T')[0],
        orientation: 'landscape', // 横版
        pageSize: 'A4',
        watermark: '机密文件',
        relayout: true, // 重新排版而非缩放
        quality: 0.95,
        margins: {
          top: 15,
          bottom: 15,
          left: 15,
          right: 15
        },
        repeatTableHeader: true // 每页显示表头
      });
    };

    return {
      reportRef,
      exportExcelAdvanced,
      exportPdfAdvanced
    };
  }
};
</script>
```

## 完整示例

以下是一个包含所有主要功能的完整示例：

```vue
<template>
  <div class="sales-report">
    <div class="toolbar">
      <button @click="exportExcel">导出Excel</button>
      <button @click="exportPdf">导出PDF</button>
      <button @click="print">打印</button>
      <button @click="toggleTheme">切换主题</button>
      <button @click="reloadData">刷新数据</button>
    </div>

    <div class="report-wrapper">
      <DDRReport
        ref="reportRef"
        :config="reportConfig"
        :theme="currentTheme"
        :metadata="metadata"
        mode="auto"
        lang="zh-CN"
        @data-loaded="onDataLoaded"
        @error="onError"
      />
    </div>
  </div>
</template>

<script>
import { ref, defineComponent, onMounted } from 'vue';
import { DDRReport } from 'data-driven-report/vue';

export default defineComponent({
  name: 'SalesReport',
  components: { DDRReport },
  setup() {
    const reportRef = ref(null);
    const currentTheme = ref('default');
    const metadata = ref({});

    // 模拟数据
    const mockData = {
      records: Array.from({ length: 100 }, (_, index) => ({
        id: index + 1,
        date: new Date(2025, 4, index % 30 + 1).toISOString().split('T')[0],
        region: ['华东', '华南', '华北', '西南', '东北'][index % 5],
        product: `产品${String.fromCharCode(65 + (index % 26))}`,
        quantity: Math.floor(Math.random() * 100) + 1,
        amount: parseFloat((Math.random() * 100000 + 1000).toFixed(2))
      })),
      metadata: {
        report: {
          title: '销售业绩报表',
          code: 'SR-20250529',
          generateTime: new Date().toLocaleString()
        },
        company: {
          name: '科技创新有限公司',
          logo: 'https://via.placeholder.com/150x50?text=Logo'
        },
        summary: {
          totalAmount: 5426890.25,
          count: 100
        }
      }
    };

    // 报表配置
    const reportConfig = {
      meta: {
        name: '销售报表',
        version: '1.0'
      },
      dataSource: {
        data: mockData.records // 使用静态数据
      },
      header: {
        title: {
          metadataPath: 'report.title'
        },
        logo: {
          metadataPath: 'company.logo'
        },
        fields: [
          {
            key: 'company',
            label: '公司名称:',
            metadataPath: 'company.name'
          },
          {
            key: 'reportCode',
            label: '报表编号:',
            metadataPath: 'report.code',
            position: 'right'
          }
        ]
      },
      columns: [
        {
          key: 'id',
          title: '序号',
          width: 80,
          align: 'center'
        },
        {
          key: 'date',
          title: '日期',
          width: 120,
          formatter: 'date'
        },
        {
          key: 'region',
          title: '地区',
          width: 100,
          merge: 'vertical'
        },
        {
          key: 'product',
          title: '产品名称',
          width: 150
        },
        {
          key: 'quantity',
          title: '数量',
          width: 100,
          align: 'right',
          formatter: 'number'
        },
        {
          key: 'amount',
          title: '销售额',
          width: 150,
          align: 'right',
          formatter: 'currency',
          style: {
            conditional: [
              {
                when: 'amount > 50000',
                style: {
                  color: '#1890ff',
                  fontWeight: 'bold'
                }
              }
            ]
          }
        }
      ],
      footer: {
        summary: [
          {
            column: 'amount',
            label: '总销售额:',
            metadataPath: 'summary.totalAmount',
            formatter: 'currency'
          }
        ]
      },
      features: {
        exportExcel: true,
        exportPdf: true,
        watermark: '机密文件'
      },
      layout: {
        height: '100%',
        rowHeight: 40,
        stripe: true,
        bordered: true,
        hover: true
      }
    };

    // 初始化元数据
    onMounted(() => {
      metadata.value = mockData.metadata;
    });

    // 导出Excel
    const exportExcel = () => {
      reportRef.value?.exportTo('excel', {
        fileName: '销售报表_' + new Date().toISOString().split('T')[0]
      });
    };

    // 导出PDF
    const exportPdf = () => {
      reportRef.value?.exportTo('pdf', {
        fileName: '销售报表_' + new Date().toISOString().split('T')[0],
        watermark: '机密文件'
      });
    };

    // 打印
    const print = () => {
      reportRef.value?.print();
    };

    // 切换主题
    const toggleTheme = () => {
      currentTheme.value = currentTheme.value === 'default' ? 'dark' : 'default';
    };

    // 刷新数据
    const reloadData = () => {
      reportRef.value?.reload();
    };

    // 数据加载完成
    const onDataLoaded = (data) => {
      console.log('数据加载完成:', data.length);
    };

    // 错误处理
    const onError = (error) => {
      console.error('报表错误:', error);
    };

    return {
      reportRef,
      reportConfig,
      currentTheme,
      metadata,
      exportExcel,
      exportPdf,
      print,
      toggleTheme,
      reloadData,
      onDataLoaded,
      onError
    };
  }
});
</script>

<style scoped>
.sales-report {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.toolbar {
  padding: 16px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  gap: 12px;
}

.toolbar button {
  padding: 8px 16px;
  border: none;
  background-color: #1890ff;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.toolbar button:hover {
  background-color: #40a9ff;
}

.report-wrapper {
  flex: 1;
  padding: 16px;
  overflow: hidden;
}
</style>
```

## 注意事项

1. **容器高度**：确保为报表组件设置明确的高度
2. **数据格式**：API返回的数据需要包含records、metadata、pagination结构
3. **响应式**：配置和元数据的变更会自动触发重新渲染
4. **性能**：大数据量时组件会自动切换到Canvas渲染模式
5. **浏览器兼容性**：支持Chrome 70+、Firefox 65+、Edge 80+、Safari 13+

## 故障排除

1. **组件不显示**：检查容器高度设置和数据格式
2. **导出失败**：确保浏览器支持相关API，检查控制台错误信息
3. **样式问题**：确保正确引入CSS文件
4. **数据不更新**：检查数据源配置和API响应格式
