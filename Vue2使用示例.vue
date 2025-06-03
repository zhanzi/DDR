<!-- Vue 2 使用示例 -->
<template>
  <div class="ddr-example-page">
    <div class="page-header">
      <h1>DDR报表组件示例 (Vue 2)</h1>
      <div class="toolbar">
        <button @click="exportExcel" class="btn btn-primary">导出Excel</button>
        <button @click="exportPdf" class="btn btn-primary">导出PDF</button>
        <button @click="print" class="btn btn-secondary">打印</button>
        <button @click="toggleTheme" class="btn btn-secondary">
          切换主题 ({{ currentTheme }})
        </button>
        <button @click="reloadData" class="btn btn-secondary">刷新数据</button>
      </div>
    </div>

    <div class="report-container">
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
        @error="onError"
      />
    </div>

    <!-- 状态显示 -->
    <div class="status-bar">
      <span>数据行数: {{ dataCount }}</span>
      <span>渲染状态: {{ renderStatus }}</span>
      <span>最后更新: {{ lastUpdate }}</span>
    </div>
  </div>
</template>

<script>
// Vue 2 方式引入
import { DDRReport } from '@/libs/ddr/vue2.js'; // 使用Vue 2适配器
import '@/libs/ddr/ddr-core.css';

export default {
  name: 'DDRExamplePage',
  components: {
    DDRReport
  },
  
  data() {
    return {
      currentTheme: 'default',
      dataCount: 0,
      renderStatus: '未开始',
      lastUpdate: '',
      
      // 元数据
      metadata: {
        report: {
          title: '销售业绩报表',
          code: 'RPT-' + Date.now(),
          generateTime: new Date().toLocaleString()
        },
        company: {
          name: '示例科技有限公司',
          logo: 'https://via.placeholder.com/150x50?text=Company+Logo',
          department: '销售部'
        },
        period: {
          start: '2025-05-01',
          end: '2025-05-29',
          description: '2025年5月'
        },
        summary: {
          totalAmount: 0,
          avgAmount: 0,
          count: 0
        }
      },

      // 报表配置
      reportConfig: {
        meta: {
          name: '销售业绩报表',
          version: '1.0.0'
        },
        dataSource: {
          data: [] // 将在mounted中生成
        },
        header: {
          height: 120,
          title: {
            metadataPath: 'report.title',
            style: {
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#1890ff'
            }
          },
          logo: {
            metadataPath: 'company.logo',
            width: 120,
            height: 40
          },
          fields: [
            {
              key: 'company',
              label: '公司名称:',
              metadataPath: 'company.name',
              style: { fontSize: '14px' }
            },
            {
              key: 'department',
              label: '部门:',
              metadataPath: 'company.department',
              style: { fontSize: '14px' }
            },
            {
              key: 'reportCode',
              label: '报表编号:',
              metadataPath: 'report.code',
              position: 'right',
              style: { fontSize: '14px' }
            },
            {
              key: 'period',
              label: '统计周期:',
              metadataPath: 'period.description',
              position: 'right',
              style: { fontSize: '14px' }
            }
          ]
        },
        columns: [
          {
            key: 'id',
            title: '序号',
            width: 80,
            align: 'center',
            fixed: 'left'
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
            title: '销售数量',
            width: 100,
            align: 'right',
            formatter: 'number',
            style: {
              conditional: [
                {
                  when: 'quantity > 50',
                  style: {
                    color: '#52c41a',
                    fontWeight: 'bold'
                  }
                }
              ]
            }
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
                    backgroundColor: '#e6f7ff',
                    color: '#1890ff',
                    fontWeight: 'bold'
                  }
                }
              ]
            }
          }
        ],
        footer: {
          height: 100,
          fields: [
            {
              key: 'generateTime',
              label: '生成时间:',
              metadataPath: 'report.generateTime'
            }
          ],
          summary: [
            {
              column: 'amount',
              label: '销售总额:',
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
          rowHeight: 45,
          stripe: true,
          bordered: true,
          hover: true
        }
      }
    };
  },

  mounted() {
    this.generateMockData();
    this.calculateSummary();
    this.lastUpdate = new Date().toLocaleString();
  },

  methods: {
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

      // Vue 2 方式更新数据
      this.$set(this.reportConfig.dataSource, 'data', data);
    },

    // 计算汇总数据
    calculateSummary() {
      const data = this.reportConfig.dataSource.data;
      const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);
      const count = data.length;
      
      // Vue 2 方式更新嵌套对象
      this.$set(this.metadata.summary, 'totalAmount', totalAmount);
      this.$set(this.metadata.summary, 'avgAmount', totalAmount / count);
      this.$set(this.metadata.summary, 'count', count);
      
      this.dataCount = count;
    },

    // 导出Excel
    exportExcel() {
      if (this.$refs.reportRef) {
        this.$refs.reportRef.exportTo('excel', {
          fileName: `销售报表_${new Date().toISOString().split('T')[0]}`,
          includeHeader: true,
          includeFooter: true,
          watermark: '机密文件'
        });
      }
    },

    // 导出PDF
    exportPdf() {
      if (this.$refs.reportRef) {
        this.$refs.reportRef.exportTo('pdf', {
          fileName: `销售报表_${new Date().toISOString().split('T')[0]}`,
          orientation: 'landscape',
          watermark: '机密文件'
        });
      }
    },

    // 打印
    print() {
      if (this.$refs.reportRef) {
        this.$refs.reportRef.print();
      }
    },

    // 切换主题
    toggleTheme() {
      this.currentTheme = this.currentTheme === 'default' ? 'dark' : 'default';
    },

    // 刷新数据
    reloadData() {
      this.generateMockData();
      this.calculateSummary();
      this.lastUpdate = new Date().toLocaleString();
      
      if (this.$refs.reportRef) {
        this.$refs.reportRef.reload();
      }
    },

    // 事件处理
    onDataLoaded(data) {
      console.log('数据加载完成:', data.length);
      this.dataCount = data.length;
      this.renderStatus = '数据加载完成';
    },

    onRenderComplete() {
      console.log('渲染完成');
      this.renderStatus = '渲染完成';
      this.lastUpdate = new Date().toLocaleString();
    },

    onExportStart(options) {
      console.log('开始导出:', options);
      this.renderStatus = `正在导出${options.type}...`;
    },

    onExportComplete(result) {
      console.log('导出完成:', result);
      this.renderStatus = '导出完成';
    },

    onError(error) {
      console.error('报表错误:', error);
      this.renderStatus = '错误: ' + error.message;
    }
  }
};
</script>

<style scoped>
.ddr-example-page {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.page-header {
  padding: 20px;
  background-color: white;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.page-header h1 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 24px;
}

.toolbar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn-primary {
  background-color: #1890ff;
  color: white;
}

.btn-primary:hover {
  background-color: #40a9ff;
}

.btn-secondary {
  background-color: #f0f0f0;
  color: #333;
  border: 1px solid #d9d9d9;
}

.btn-secondary:hover {
  background-color: #e6e6e6;
}

.report-container {
  flex: 1;
  margin: 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
}

.status-bar {
  padding: 12px 20px;
  background-color: white;
  border-top: 1px solid #e0e0e0;
  display: flex;
  gap: 20px;
  font-size: 12px;
  color: #666;
}

.status-bar span {
  padding: 4px 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
}
</style>
