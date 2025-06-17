import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  Container,
  Grid,
  TextField,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  CircularProgress,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  ContentCopy as ContentCopyIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { zhCN } from '@mui/x-date-pickers/locales';
import { format } from 'date-fns';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../contexts/AuthContext';
import { consumeDataAPI } from '../../services/api';
import MerchantAutocomplete from '../../components/MerchantAutocomplete';
import { formatDateTime, formatDateForAPI } from '../../utils/dateUtils';

const TerminalRecords = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();

  // 状态管理
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [records, setRecords] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  // 筛选条件
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [machineId, setMachineId] = useState('');
  const [machineNo, setMachineNo] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // 检查用户权限
  const isSystemAdmin = user?.roles?.includes('SystemAdmin');

  // 加载终端记录数据
  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);

      const params = {
        page: page + 1, // API使用1-based索引
        pageSize,
        merchantID: selectedMerchant?.merchantID || '',
        machineID: machineId.trim() || undefined,
        machineNO: machineNo.trim() || undefined,
        startTime: startDate ? formatDateForAPI(startDate, true) : undefined,
        endTime: endDate ? formatDateForAPI(endDate, false) : undefined,
        sortBy: 'ReceiveTime',
        sortDirection: 'desc'
      };

      // 移除undefined的参数
      Object.keys(params).forEach(key => {
        if (params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await consumeDataAPI.getConsumeData(params);
      setRecords(response.items || []);
      setTotalCount(response.totalCount || 0);
    } catch (error) {
      console.error('加载终端记录失败:', error);
      enqueueSnackbar('加载终端记录失败', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, selectedMerchant, machineId, machineNo, startDate, endDate]);

  // 首次加载
  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // 处理搜索
  const handleSearch = () => {
    setPage(0); // 重置到第一页
    loadRecords();
  };

  // 处理重置
  const handleReset = () => {
    setSelectedMerchant(null);
    setMachineId('');
    setMachineNo('');
    setStartDate(null);
    setEndDate(null);
    setPage(0);
  };

  // 处理导出
  const handleExport = async () => {
    try {
      setExporting(true);

      const params = {
        merchantID: selectedMerchant?.merchantID || '',
        machineID: machineId.trim() || undefined,
        machineNO: machineNo.trim() || undefined,
        startTime: startDate ? formatDateForAPI(startDate, true) : undefined,
        endTime: endDate ? formatDateForAPI(endDate, false) : undefined,
      };

      // 移除undefined的参数
      Object.keys(params).forEach(key => {
        if (params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await consumeDataAPI.exportConsumeData(params);

      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `terminal_records_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      enqueueSnackbar('导出成功', { variant: 'success' });
    } catch (error) {
      console.error('导出失败:', error);
      enqueueSnackbar('导出失败', { variant: 'error' });
    } finally {
      setExporting(false);
    }
  };

  // 处理分页变化
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangePageSize = (event) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 格式化Buffer为HEX显示（响应式截断显示）
  const formatBufferHex = (hexString, maxLength = 64) => {
    if (!hexString) return '';
    if (hexString.length <= maxLength) return hexString;
    return `${hexString.substring(0, maxLength)}...`;
  };

  // 复制交易数据到剪贴板
  const handleCopyBuffer = async (bufferHex) => {
    try {
      await navigator.clipboard.writeText(bufferHex);
      enqueueSnackbar('交易数据已复制到剪贴板', { variant: 'success' });
    } catch (error) {
      console.error('复制失败:', error);
      enqueueSnackbar('复制失败，请手动选择复制', { variant: 'error' });
    }
  };

  return (
    <LocalizationProvider
      dateAdapter={AdapterDateFns}
      localeText={zhCN.components.MuiLocalizationProvider.defaultProps.localeText}
    >
      <Container maxWidth={false}>
        <Box sx={{ pt: 3, pb: 3 }}>
          {/* 页面标题 */}
          <Typography variant="h4" sx={{ mb: 3 }}>
            终端记录查询
          </Typography>

          {/* 筛选条件 */}
          <Card sx={{ mb: 3, p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              筛选条件
            </Typography>

            <Grid container spacing={2} alignItems="center">
              {/* 商户选择 */}
              <Grid item xs={12} sm={6} md={2}>
                <MerchantAutocomplete
                  value={selectedMerchant}
                  onChange={(event, newValue) => setSelectedMerchant(newValue)}
                  disabled={!isSystemAdmin}
                  label="商户"
                  size="small"
                />
              </Grid>

              {/* 出厂序列号 */}
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  label="出厂序列号"
                  value={machineId}
                  onChange={(e) => setMachineId(e.target.value)}
                  size="small"
                  placeholder="请输入出厂序列号"
                />
              </Grid>

              {/* 设备编号 */}
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  label="设备编号"
                  value={machineNo}
                  onChange={(e) => setMachineNo(e.target.value)}
                  size="small"
                  placeholder="请输入设备编号"
                />
              </Grid>

              {/* 开始时间 */}
              <Grid item xs={12} sm={6} md={2}>
                <DatePicker
                  label="开始时间"
                  value={startDate}
                  onChange={setStartDate}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true
                    }
                  }}
                />
              </Grid>

              {/* 结束时间 */}
              <Grid item xs={12} sm={6} md={2}>
                <DatePicker
                  label="结束时间"
                  value={endDate}
                  onChange={setEndDate}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true
                    }
                  }}
                />
              </Grid>

              {/* 操作按钮 */}
              <Grid item xs={12} sm={6} md={2}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    startIcon={<SearchIcon />}
                    onClick={handleSearch}
                    disabled={loading}
                  >
                    查询
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleReset}
                    disabled={loading}
                  >
                    重置
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Card>

          {/* 操作栏 */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              查询结果 ({totalCount} 条记录)
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadRecords}
                disabled={loading}
              >
                刷新
              </Button>
              <Button
                variant="contained"
                startIcon={exporting ? <CircularProgress size={16} /> : <DownloadIcon />}
                onClick={handleExport}
                disabled={loading || exporting || totalCount === 0}
              >
                {exporting ? '导出中...' : '导出CSV'}
              </Button>
            </Box>
          </Box>

          {/* 数据表格 */}
          <Card>
            <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>商户</TableCell>
                    <TableCell>出厂序列号</TableCell>
                    <TableCell>设备编号</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>PSAM卡号</TableCell>
                    <TableCell>交易数据</TableCell>
                    <TableCell>接收时间</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Typography color="textSecondary">
                          暂无数据
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    records.map((record) => (
                      <TableRow key={record.id} hover>
                        <TableCell>{record.id}</TableCell>
                        <TableCell>
                          <Tooltip title={record.merchantID || ''}>
                            <span>{record.merchantName}</span>
                          </Tooltip>
                        </TableCell>
                        <TableCell>{record.machineID || '-'}</TableCell>
                        <TableCell>{record.machineNO || '-'}</TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                          {record.psamNO || '-'}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Tooltip title={record.bufferHex} arrow>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontFamily: 'monospace',
                                  fontSize: '0.75rem',
                                  color: 'text.secondary',
                                  backgroundColor: (theme) => 
                                    theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'grey.50',
                                  padding: '4px 8px',
                                  borderRadius: 1,
                                  display: 'inline-block',
                                  maxWidth: { xs: '120px', sm: '200px', md: '300px', lg: '400px' },
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {formatBufferHex(record.bufferHex,
                                  // 根据屏幕尺寸动态调整显示长度
                                  window.innerWidth < 600 ? 24 :    // xs: 24字符
                                  window.innerWidth < 900 ? 48 :    // sm: 48字符
                                  window.innerWidth < 1200 ? 72 :   // md: 72字符
                                  96                                // lg+: 96字符
                                )}
                              </Typography>
                            </Tooltip>
                            <Tooltip title="复制交易数据">
                              <IconButton
                                size="small"
                                onClick={() => handleCopyBuffer(record.bufferHex)}
                                sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
                              >
                                <ContentCopyIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {formatDateTime(record.receiveTime)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* 分页 */}
            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={pageSize}
              onRowsPerPageChange={handleChangePageSize}
              rowsPerPageOptions={[10, 20, 50, 100]}
              labelRowsPerPage="每页条数:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} 共 ${count} 条`}
            />
          </Card>

          {/* 说明信息 */}
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              • 导出的CSV文件只包含交易数据的HEX格式，每行一条记录<br/>
              • 最多导出10,000条记录，如需更多数据请缩小查询范围
            </Typography>
          </Alert>
        </Box>
      </Container>
    </LocalizationProvider>
  );
};

export default TerminalRecords;

