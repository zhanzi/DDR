<!-- 
  DDR报表组件实际使用示例
  这个文件展示了如何在Vue项目中使用构建好的DDR组件
-->
<template>
  <div class="ddr-example-page">
    <div class="page-header">
      <h1>DDR报表组件示例</h1>
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
import { ref, defineComponent, onMounted, reactive } from 'vue';

// 方式1：直接引用本地构建文件（推荐）
import { DDRReport } from '@/libs/ddr/ddr-vue.js';
import '@/libs/ddr/ddr-core.css';

// 方式2：如果创建了本地npm包
// import { DDRReport } from '@mycompany/ddr-report/vue';
// import '@mycompany/ddr-report/style';

export default defineComponent({
  name: 'DDRExamplePage',
  components: {
    DDRReport
  },
  setup() {
    // 响应式数据
    const reportRef = ref(null);
    const currentTheme = ref('default');
    const dataCount = ref(0);
    const renderStatus = ref('未开始');
    const lastUpdate = ref('');

    // 元数据
    const metadata = reactive({
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
    });

    // 生成模拟数据
    const generateMockData = () => {
      const regions = ['华东', '华南', '华北', '西南', '东北'];
      const products = ['产品A', '产品B', '产品C', '产品D', '产品E'];
      const categories = ['电子产品', '家居用品', '食品饮料', '服装鞋帽', '化妆品'];
      
      return Array.from({ length: 150 }, (_, index) => {
        const amount = parseFloat((Math.random() * 100000 + 1000).toFixed(2));
        return {
          id: index + 1,
          date: new Date(2025, 4, (index % 29) + 1).toISOString().split('T')[0],
          region: regions[index % regions.length],
          category: categories[index % categories.length],
          product: products[index % products.length] + (Math.floor(index / products.length) + 1),
          quantity: Math.floor(Math.random() * 100) + 1,
          price: parseFloat((Math.random() * 1000 + 100).toFixed(2)),
          amount: amount,
          status: Math.random() > 0.8 ? '异常' : '正常'
        };
      });
    };

    // 报表配置
    const reportConfig = reactive({
      meta: {
        name: '销售业绩报表',
        version: '1.0.0'
      },
      dataSource: {
        data: generateMockData() // 使用静态数据
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
          merge: 'vertical' // 合并相同值的单元格
        },
        {
          key: 'category',
          title: '产品类别',
          width: 120
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
              },
              {
                when: 'quantity < 10',
                style: {
                  color: '#ff4d4f'
                }
              }
            ]
          }
        },
        {
          key: 'price',
          title: '单价',
          width: 120,
          align: 'right',
          formatter: 'currency'
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
              },
              {
                when: 'amount < 5000',
                style: {
                  backgroundColor: '#fff2f0',
                  color: '#ff4d4f'
                }
              }
            ]
          }
        },
        {
          key: 'status',
          title: '状态',
          width: 80,
          align: 'center',
          style: {
            conditional: [
              {
                when: 'status === "异常"',
                style: {
                  backgroundColor: '#ff4d4f',
                  color: 'white',
                  fontWeight: 'bold'
                }
              },
              {
                when: 'status === "正常"',
                style: {
                  backgroundColor: '#52c41a',
                  color: 'white'
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
          },
          {
            key: 'dataSource',
            label: '数据来源:',
            value: '销售管理系统',
            position: 'center'
          }
        ],
        summary: [
          {
            column: 'amount',
            label: '销售总额:',
            metadataPath: 'summary.totalAmount',
            formatter: 'currency'
          },
          {
            column: 'quantity',
            label: '销售总量:',
            metadataPath: 'summary.count',
            formatter: 'number'
          }
        ],
        signatures: [
          {
            label: '制表人',
            value: '张三',
            showTimestamp: true,
            width: 100
          },
          {
            label: '审核人',
            value: '李四',
            showTimestamp: false,
            width: 100
          },
          {
            label: '批准人',
            value: '',
            showTimestamp: false,
            width: 100
          }
        ]
      },
      features: {
        exportExcel: true,
        exportPdf: true,
        watermark: '机密文件',
        pdfConfig: {
          orientation: 'portrait',
          pageSize: 'A4',
          margins: { top: 15, bottom: 15, left: 15, right: 15 }
        }
      },
      layout: {
        height: '100%',
        rowHeight: 45,
        stripe: true,
        bordered: true,
        hover: true
      }
    });

    // 计算汇总数据
    const calculateSummary = () => {
      const data = reportConfig.dataSource.data;
      const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);
      const count = data.length;
      
      metadata.summary.totalAmount = totalAmount;
      metadata.summary.avgAmount = totalAmount / count;
      metadata.summary.count = count;
      
      dataCount.value = count;
    };

    // 组件方法
    const exportExcel = () => {
      if (reportRef.value) {
        reportRef.value.exportTo('excel', {
          fileName: `销售报表_${new Date().toISOString().split('T')[0]}`,
          includeHeader: true,
          includeFooter: true,
          watermark: '机密文件'
        });
      }
    };

    const exportPdf = () => {
      if (reportRef.value) {
        reportRef.value.exportTo('pdf', {
          fileName: `销售报表_${new Date().toISOString().split('T')[0]}`,
          orientation: 'landscape', // 横版
          watermark: '机密文件'
        });
      }
    };

    const print = () => {
      if (reportRef.value) {
        reportRef.value.print();
      }
    };

    const toggleTheme = () => {
      currentTheme.value = currentTheme.value === 'default' ? 'dark' : 'default';
    };

    const reloadData = () => {
      // 重新生成数据
      reportConfig.dataSource.data = generateMockData();
      calculateSummary();
      lastUpdate.value = new Date().toLocaleString();
      
      if (reportRef.value) {
        reportRef.value.reload();
      }
    };

    // 事件处理
    const onDataLoaded = (data) => {
      console.log('数据加载完成:', data.length);
      dataCount.value = data.length;
      renderStatus.value = '数据加载完成';
    };

    const onRenderComplete = () => {
      console.log('渲染完成');
      renderStatus.value = '渲染完成';
      lastUpdate.value = new Date().toLocaleString();
    };

    const onExportStart = (options) => {
      console.log('开始导出:', options);
      renderStatus.value = `正在导出${options.type}...`;
    };

    const onExportComplete = (result) => {
      console.log('导出完成:', result);
      renderStatus.value = '导出完成';
    };

    const onError = (error) => {
      console.error('报表错误:', error);
      renderStatus.value = '错误: ' + error.message;
    };

    // 初始化
    onMounted(() => {
      calculateSummary();
      lastUpdate.value = new Date().toLocaleString();
    });

    return {
      reportRef,
      reportConfig,
      currentTheme,
      metadata,
      dataCount,
      renderStatus,
      lastUpdate,
      exportExcel,
      exportPdf,
      print,
      toggleTheme,
      reloadData,
      onDataLoaded,
      onRenderComplete,
      onExportStart,
      onExportComplete,
      onError
    };
  }
});
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
