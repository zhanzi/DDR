import { useState, useRef } from 'react';
import { DDRReport, DDRReportRef } from '../../src/adapters/react';

// 模拟数据
const mockData = {
  success: true,
  code: 200,
  data: {
    records: Array.from({ length: 100 }, (_, index) => ({
      id: index + 1,
      date: new Date(2025, 4, index % 30 + 1).toISOString().split('T')[0],
      region: ['华东', '华南', '华北', '西南', '东北'][index % 5],
      category: ['电子产品', '家居用品', '食品饮料', '服装鞋帽', '化妆品'][index % 5],
      product: `产品${String.fromCharCode(65 + (index % 26))}`,
      quantity: Math.floor(Math.random() * 100) + 1,
      price: parseFloat((Math.random() * 1000 + 100).toFixed(2)),
      amount: parseFloat((Math.random() * 1000 + 100).toFixed(2)) * (Math.floor(Math.random() * 100) + 1)
    })),
    metadata: {
      report: {
        title: '销售业绩报表',
        code: 'SR-20250523',
        generateTime: '2025-05-23 15:30:45',
        dataSource: '销售管理系统'
      },
      company: {
        name: '科技创新有限公司',
        logo: 'https://via.placeholder.com/150x50?text=Company+Logo',
        department: '销售部'
      },
      period: {
        start: '2025-05-01',
        end: '2025-05-23',
        type: 'monthly',
        description: '2025年5月'
      },
      personnel: {
        creator: {
          id: '1001',
          name: '张三',
          position: '销售经理',
          timestamp: '2025-05-23 14:20:30'
        },
        reviewer: {
          id: '2002',
          name: '李四',
          position: '销售总监',
          timestamp: '2025-05-23 15:05:12',
          status: 'approved'
        },
        approver: {
          id: '3003',
          name: '王五',
          position: '副总经理',
          timestamp: null,
          status: 'pending'
        }
      },
      summary: {
        totalAmount: 5426890.25,
        avgAmount: 54268.90,
        maxAmount: 198752.36,
        minAmount: 1025.75,
        count: 100
      }
    },
    pagination: {
      pageSize: 100,
      pageNumber: 1,
      total: 100,
      totalPages: 1
    }
  }
};

// 报表配置
const reportConfig = {
  meta: {
    name: '销售日报',
    version: '1.0'
  },
  dataSource: {
    api: '/api/sales', // 实际上使用mock数据
    method: 'GET' as const,
    params: { type: 'daily' }
  },
  header: {
    title: {
      text: '销售日报',
      metadataPath: 'report.title'
    },
    logo: {
      metadataKey: 'company.logo'
    },
    fields: [
      {
        key: 'company',
        label: '公司名称:',
        metadataPath: 'company.name'
      },
      {
        key: 'department',
        label: '部门:',
        metadataPath: 'company.department'
      },
      {
        key: 'reportCode',
        label: '报表编号:',
        metadataPath: 'report.code',
        position: 'right' as const
      },
      {
        key: 'period',
        label: '统计周期:',
        metadataPath: 'period.description',
        position: 'right' as const
      }
    ]
  },
  columns: [
    {
      key: 'id',
      title: '序号',
      width: 80,
      align: 'center' as const
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
      merge: 'vertical' as const
    },
    {
      key: 'category',
      title: '产品类别',
      width: 120
    },
    {
      key: 'product',
      title: '产品名称',
      width: 120
    },
    {
      key: 'quantity',
      title: '销售数量',
      width: 100,
      align: 'right' as const,
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
      align: 'right' as const,
      formatter: 'currency'
    },
    {
      key: 'amount',
      title: '销售额',
      width: 150,
      align: 'right' as const,
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
        metadataPath: 'report.generateTime'
      },
      {
        key: 'dataSource',
        label: '数据来源:',
        metadataPath: 'report.dataSource',
        position: 'center' as const
      }
    ],
    summary: [
      {
        column: 'amount',
        type: 'sum' as const,
        metadataPath: 'summary.totalAmount',
        formatter: 'currency'
      },
      {
        column: 'quantity',
        type: 'sum' as const,
        metadataPath: 'summary.count',
        formatter: 'number'
      }
    ],
    signatures: [
      {
        label: '制表人',
        metadataPath: 'personnel.creator.name',
        dateMetadataPath: 'personnel.creator.timestamp',
        showTimestamp: true,
        width: 100
      },
      {
        label: '审核人',
        metadataPath: 'personnel.reviewer.name',
        dateMetadataPath: 'personnel.reviewer.timestamp',
        showTimestamp: true,
        width: 100
      },
      {
        label: '批准人',
        metadataPath: 'personnel.approver.name',
        dateMetadataPath: 'personnel.approver.timestamp',
        showTimestamp: true,
        width: 100
      }
    ],
    pageInfo: {
      format: '第 {current} 页/共 {total} 页',
      position: 'center' as const
    },
    notes: '注：本报表数据仅供参考，最终解释权归公司所有。'
  },
  features: {
    exportExcel: true,
    exportPdf: true,
    watermark: '机密文件',
    pdfConfig: {
      orientation: 'landscape' as const,  // 横版导出，适合宽表格
      pageSize: 'A4',
      margins: {
        top: 15,
        right: 10,
        bottom: 15,
        left: 10
      },
      multiPage: true,
      quality: 0.95,
      relayout: true  // 重新排版而不是缩放
    }
  },
  layout: {
    height: 'auto' as const,
    headerHeight: 50,
    rowHeight: 40,
    stripe: true,
    bordered: true,
    hover: true
  }
};

// React示例组件
const ReactDDRExample = () => {
  const [theme, setTheme] = useState('default');
  const reportRef = useRef<DDRReportRef>(null);

  // 模拟API请求函数，实际项目中应该由后端提供
  const mockFetchData = async () => {
    // 延迟200ms模拟网络请求
    await new Promise(resolve => setTimeout(resolve, 200));
    return {
      records: mockData.data.records,
      metadata: mockData.data.metadata,
      pagination: mockData.data.pagination
    };
  };

  // 导出Excel
  const handleExportExcel = () => {
    if (reportRef.current) {
      reportRef.current.exportTo('excel', {
        fileName: '销售日报_' + new Date().toISOString().split('T')[0],
        includeHeader: true,
        includeFooter: true,
        watermark: '机密文件'
      });
    }
  };

  // 导出PDF
  const handleExportPdf = () => {
    if (reportRef.current) {
      reportRef.current.exportTo('pdf', {
        fileName: '销售日报_' + new Date().toISOString().split('T')[0],
        watermark: '机密文件'
      });
    }
  };

  // 打印
  const handlePrint = () => {
    if (reportRef.current) {
      reportRef.current.print();
    }
  };

  // 切换主题
  const toggleTheme = () => {
    setTheme(theme === 'default' ? 'dark' : 'default');
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '16px',
        backgroundColor: '#f5f5f5',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        gap: '12px'
      }}>
        <button
          onClick={handleExportExcel}
          style={{
            padding: '8px 16px',
            border: 'none',
            backgroundColor: '#1890ff',
            color: 'white',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          导出Excel
        </button>
        <button
          onClick={handleExportPdf}
          style={{
            padding: '8px 16px',
            border: 'none',
            backgroundColor: '#1890ff',
            color: 'white',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          导出PDF
        </button>
        <button
          onClick={handlePrint}
          style={{
            padding: '8px 16px',
            border: 'none',
            backgroundColor: '#1890ff',
            color: 'white',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          打印
        </button>
        <button
          onClick={toggleTheme}
          style={{
            padding: '8px 16px',
            border: 'none',
            backgroundColor: '#722ed1',
            color: 'white',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          切换主题
        </button>
      </div>
      <div style={{ flex: 1, padding: '16px', overflow: 'auto' }}>
        <div style={{ height: '100%', border: '1px solid #e0e0e0' }}>
          <DDRReport
            ref={reportRef}
            config={reportConfig}
            theme={theme}
            mode="auto"
            lang="zh-CN"
            onDataLoaded={(data) => console.log('报表数据加载完成:', data.length)}
            onError={(error) => console.error('报表出错:', error)}
            _fetchData={mockFetchData} // 注入模拟API函数
          />
        </div>
      </div>
    </div>
  );
};

export default ReactDDRExample;
