# Vue 2 中直接使用 ddr-core.browser.js 指南

## 概述

`ddr-core.browser.js` 是DDR组件的浏览器版本，它是一个IIFE（立即执行函数表达式）格式的文件，可以直接在浏览器中使用，无需任何构建工具或模块系统。这使得它非常适合在Vue 2项目中直接使用。

## 优势

✅ **无需Vue版本适配**：直接使用原生JavaScript API  
✅ **无依赖冲突**：不依赖Vue的特定版本  
✅ **简单集成**：只需引入JS和CSS文件  
✅ **完整功能**：包含所有DDR功能（导出、打印、分组等）  
✅ **全局可用**：通过`window.DDR`全局访问  

## 使用步骤

### 1. 复制文件到项目

```bash
# 复制必要文件到Vue 2项目
cp dist/ddr-core.browser.js public/libs/
cp dist/ddr-core.css public/libs/
```

### 2. 在HTML中引入

```html
<!DOCTYPE html>
<html>
<head>
  <!-- 引入DDR样式 -->
  <link rel="stylesheet" href="/libs/ddr-core.css">
</head>
<body>
  <div id="app"></div>
  
  <!-- 引入DDR脚本 -->
  <script src="/libs/ddr-core.browser.js"></script>
  
  <!-- Vue 2 -->
  <script src="https://cdn.jsdelivr.net/npm/vue@2"></script>
  
  <!-- 您的应用脚本 -->
  <script src="/js/app.js"></script>
</body>
</html>
```

### 3. 在Vue组件中使用

```vue
<template>
  <div class="report-page">
    <div class="toolbar">
      <button @click="exportExcel">导出Excel</button>
      <button @click="exportPdf">导出PDF</button>
      <button @click="print">打印</button>
      <button @click="reloadData">刷新数据</button>
    </div>
    
    <!-- DDR报表容器 -->
    <div ref="reportContainer" class="report-container"></div>
    
    <div class="status">
      状态: {{ status }} | 数据行数: {{ dataCount }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'ReportPage',
  
  data() {
    return {
      reportInstance: null,
      status: '未初始化',
      dataCount: 0,
      
      // 报表配置
      reportConfig: {
        meta: {
          name: '销售报表',
          version: '1.0'
        },
        dataSource: {
          data: [] // 将在mounted中生成数据
        },
        header: {
          title: {
            value: '销售业绩报表',
            style: { fontSize: '24px', fontWeight: 'bold' }
          },
          fields: [
            {
              key: 'company',
              label: '公司名称:',
              value: '示例科技有限公司'
            },
            {
              key: 'period',
              label: '统计周期:',
              value: '2025年5月',
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
          fields: [
            {
              key: 'generateTime',
              label: '生成时间:',
              value: new Date().toLocaleString()
            }
          ],
          summary: [
            {
              column: 'amount',
              label: '总销售额:',
              value: 0,
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
      }
    };
  },

  mounted() {
    this.initReport();
  },

  beforeDestroy() {
    // 清理DDR实例
    if (this.reportInstance) {
      this.reportInstance.destroy();
      this.reportInstance = null;
    }
  },

  methods: {
    // 初始化报表
    initReport() {
      // 检查DDR是否可用
      if (typeof window.DDR === 'undefined') {
        console.error('DDR未加载，请确保已引入ddr-core.browser.js');
        this.status = 'DDR未加载';
        return;
      }

      try {
        // 生成模拟数据
        this.generateMockData();
        
        // 创建DDR实例
        this.reportInstance = window.DDR.create({
          container: this.$refs.reportContainer,
          config: this.reportConfig,
          theme: 'default',
          mode: 'auto',
          lang: 'zh-CN',
          debug: false,
          onError: this.onError
        });

        // 注册事件监听
        this.reportInstance.on('data-loaded', this.onDataLoaded);
        this.reportInstance.on('render-complete', this.onRenderComplete);
        this.reportInstance.on('export-start', this.onExportStart);
        this.reportInstance.on('export-complete', this.onExportComplete);

        this.status = '初始化成功';
        
      } catch (error) {
        console.error('DDR初始化失败:', error);
        this.status = '初始化失败: ' + error.message;
      }
    },

    // 生成模拟数据
    generateMockData() {
      const regions = ['华东', '华南', '华北', '西南', '东北'];
      const products = ['产品A', '产品B', '产品C', '产品D', '产品E'];
      
      const data = Array.from({ length: 100 }, (_, index) => {
        const amount = parseFloat((Math.random() * 100000 + 1000).toFixed(2));
        return {
          id: index + 1,
          date: new Date(2025, 4, (index % 29) + 1).toISOString().split('T')[0],
          region: regions[index % regions.length],
          product: products[index % products.length] + (Math.floor(index / products.length) + 1),
          quantity: Math.floor(Math.random() * 100) + 1,
          amount: amount
        };
      });

      // 更新配置中的数据
      this.reportConfig.dataSource.data = data;
      
      // 计算总额
      const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);
      this.reportConfig.footer.summary[0].value = totalAmount;
      
      this.dataCount = data.length;
    },

    // 导出Excel
    exportExcel() {
      if (this.reportInstance) {
        this.reportInstance.exportTo('excel', {
          fileName: `销售报表_${new Date().toISOString().split('T')[0]}`,
          includeHeader: true,
          includeFooter: true,
          watermark: '机密文件'
        }).catch(error => {
          console.error('Excel导出失败:', error);
          alert('Excel导出失败: ' + error.message);
        });
      }
    },

    // 导出PDF
    exportPdf() {
      if (this.reportInstance) {
        this.reportInstance.exportTo('pdf', {
          fileName: `销售报表_${new Date().toISOString().split('T')[0]}`,
          orientation: 'landscape',
          watermark: '机密文件'
        }).catch(error => {
          console.error('PDF导出失败:', error);
          alert('PDF导出失败: ' + error.message);
        });
      }
    },

    // 打印
    print() {
      if (this.reportInstance) {
        this.reportInstance.print().catch(error => {
          console.error('打印失败:', error);
          alert('打印失败: ' + error.message);
        });
      }
    },

    // 刷新数据
    reloadData() {
      this.generateMockData();
      
      if (this.reportInstance) {
        this.reportInstance.reload().catch(error => {
          console.error('数据刷新失败:', error);
          this.status = '刷新失败: ' + error.message;
        });
      }
    },

    // 事件处理
    onDataLoaded({ data }) {
      console.log('数据加载完成:', data.length);
      this.dataCount = data.length;
      this.status = '数据加载完成';
    },

    onRenderComplete() {
      console.log('渲染完成');
      this.status = '渲染完成';
    },

    onExportStart({ type }) {
      console.log('开始导出:', type);
      this.status = `正在导出${type}...`;
    },

    onExportComplete({ type, fileName }) {
      console.log('导出完成:', type, fileName);
      this.status = `${type}导出完成`;
    },

    onError(error) {
      console.error('DDR错误:', error);
      this.status = '错误: ' + error.message;
    }
  }
};
</script>

<style scoped>
.report-page {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.toolbar {
  margin-bottom: 20px;
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

.report-container {
  flex: 1;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.status {
  margin-top: 10px;
  padding: 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  font-size: 12px;
  color: #666;
}
</style>
```

## 全局API使用

browser版本提供了全局的`window.DDR`对象：

```javascript
// 创建报表实例
const report = window.DDR.create({
  container: document.getElementById('report'),
  config: reportConfig
});

// 注册自定义格式化器
window.DDR.registerFormatter('phoneNumber', (value) => {
  return value.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
});

// 使用实例方法
report.exportTo('excel', { fileName: '报表.xlsx' });
report.print();
report.reload();
report.destroy();
```

## 注意事项

1. **文件加载顺序**：确保在使用DDR之前已加载`ddr-core.browser.js`
2. **CSS样式**：必须引入`ddr-core.css`文件
3. **容器元素**：确保容器元素已存在于DOM中
4. **错误处理**：添加适当的错误处理和降级方案
5. **内存管理**：在组件销毁时调用`destroy()`方法

## 优势总结

- ✅ **兼容性好**：支持所有Vue 2版本
- ✅ **集成简单**：无需复杂的适配器
- ✅ **功能完整**：包含所有DDR功能
- ✅ **性能优秀**：直接使用原生API
- ✅ **维护简单**：无需关心Vue版本升级
