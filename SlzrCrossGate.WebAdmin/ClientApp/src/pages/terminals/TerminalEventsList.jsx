import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Visibility as VisibilityIcon,
  Event as EventIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { terminalAPI } from '../../services/api';
import { formatDateTime, formatDateForAPI } from '../../utils/dateUtils';
import { parseErrorMessage } from '../../utils/errorHandler';
import MerchantAutocomplete from '../../components/MerchantAutocomplete';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { zhCN } from '@mui/x-date-pickers/locales';
import { zhCN as dateFnsZhCN } from 'date-fns/locale';

const TerminalEventsList = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState(null);

  // 筛选条件
  const [filters, setFilters] = useState({
    merchantId: '',
    machineId: '',
    deviceNo: '',
    eventType: '',
    startDate: null,
    endDate: null
  });

  // 选中的商户对象（用于MerchantAutocomplete）
  const [selectedMerchant, setSelectedMerchant] = useState(null);

  // 精确时间选择开关
  const [usePreciseTime, setUsePreciseTime] = useState(false);

  // 事件类型选项
  const eventTypeOptions = [
    { value: '', label: '全部' },
    { value: '1', label: '签到' },
    { value: '2', label: '签退' },
    { value: '3', label: '文件下载开始' },
    { value: '4', label: '文件下载结束' },
    { value: '5', label: '文件版本更新' },
    { value: '6', label: '属性变更' },
    { value: '7', label: '银联密钥绑定' },
    { value: '8', label: '商户变更' },
    { value: '9', label: '线路变更' },
    { value: '10', label: '设备变更' },
    { value: '11', label: '消息发送' },
    { value: '12', label: '文件发布' }
  ];

  // 获取事件类型芯片
  const getEventTypeChip = (eventType) => {
    const typeMap = {
      0: { label: '创建', color: 'default' },
      1: { label: '签到', color: 'success' },
      2: { label: '签退', color: 'warning' },
      3: { label: '下载开始', color: 'info' },
      4: { label: '下载结束', color: 'success' },
      5: { label: '版本更新', color: 'primary' },
      6: { label: '属性变更', color: 'secondary' },
      7: { label: '密钥绑定', color: 'primary' },
      8: { label: '商户变更', color: 'warning' },
      9: { label: '线路变更', color: 'warning' },
      10: { label: '设备变更', color: 'warning' },
      11: { label: '消息发送', color: 'info' },
      12: { label: '文件发布', color: 'primary' }
    };

    const type = typeMap[eventType] || { label: '未知', color: 'default' };
    return <Chip label={type.label} color={type.color} size="small" />;
  };

  // 获取严重性芯片
  const getSeverityChip = (severity) => {
    const severityMap = {
      0: { label: '信息', color: 'info' },
      1: { label: '警告', color: 'warning' },
      2: { label: '错误', color: 'error' },
      3: { label: '严重', color: 'error' }
    };

    const sev = severityMap[severity] || { label: '未知', color: 'default' };
    return <Chip label={sev.label} color={sev.color} size="small" />;
  };

  // 处理筛选条件变更
  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // 处理日期时间变更
  const handleDateTimeChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // 搜索事件
  const searchEvents = () => {
    setPage(0);
    loadEvents();
  };

  // 清空筛选条件
  const clearFilters = () => {
    setFilters({
      merchantId: '',
      machineId: '',
      deviceNo: '',
      eventType: '',
      startDate: null,
      endDate: null
    });
    setSelectedMerchant(null);
    setPage(0);
  };

  // 加载终端事件
  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      // 构建查询参数
      const params = {
        page: page + 1,
        pageSize: rowsPerPage,
        merchantId: filters.merchantId || undefined,
        serialNo: filters.machineId || undefined,
        deviceNo: filters.deviceNo || undefined,
        eventType: filters.eventType || undefined,
        startDate: filters.startDate ? formatDateForAPI(filters.startDate, true) : undefined,
        endDate: filters.endDate ? formatDateForAPI(filters.endDate, false) : undefined
      };

      const response = await terminalAPI.getAllTerminalEvents(params);
      setEvents(response.items);
      setTotalCount(response.totalCount);
    } catch (error) {
      console.error('Error loading events:', error);
      const errorMessage = parseErrorMessage(error, '加载事件记录失败');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 处理分页变更
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 查看终端详情
  const viewTerminalDetail = (terminalId) => {
    navigate(`/app/terminals/${terminalId}`);
  };

  useEffect(() => {
    loadEvents();
  }, [page, rowsPerPage]);

  useEffect(() => {
    // 当筛选条件变更时，重置页码并搜索
    if (page === 0) {
      loadEvents();
    } else {
      setPage(0);
    }
  }, [filters]);

  // 当精确时间开关变化时，如果已有时间选择，需要重新搜索
  useEffect(() => {
    if (filters.startDate || filters.endDate) {
      if (page === 0) {
        loadEvents();
      } else {
        setPage(0);
      }
    }
  }, [usePreciseTime]);

  return (
    <LocalizationProvider
      dateAdapter={AdapterDateFns}
      adapterLocale={dateFnsZhCN}
      localeText={zhCN.components.MuiLocalizationProvider.defaultProps.localeText}
    >
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <EventIcon sx={{ mr: 2, color: 'primary.main' }} />
          终端事件列表
        </Typography>

        {error && (
          <Card sx={{ mb: 3, borderLeft: 4, borderColor: 'error.main' }}>
            <CardContent>
              <Typography color="error">{error}</Typography>
            </CardContent>
          </Card>
        )}

        {/* 筛选条件 */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            筛选条件
          </Typography>
          <Grid container spacing={2} alignItems="center">
            {/* 商户选择 */}
            <Grid item xs={12} sm={6} md={3}>
              <MerchantAutocomplete
                value={selectedMerchant}
                onChange={(event, newValue) => {
                  setSelectedMerchant(newValue);
                  const merchantId = newValue ? newValue.merchantID : '';
                  setFilters(prev => ({ ...prev, merchantId }));
                }}
                size="small"
                label="商户"
              />
            </Grid>

            {/* 出厂序列号 */}
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="出厂序列号"
                name="machineId"
                value={filters.machineId}
                onChange={handleFilterChange}
                placeholder="输入出厂序列号"
              />
            </Grid>

            {/* 设备编号 */}
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="设备编号"
                name="deviceNo"
                value={filters.deviceNo}
                onChange={handleFilterChange}
                placeholder="输入设备编号"
              />
            </Grid>

            {/* 事件类型 */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>事件类型</InputLabel>
                <Select
                  name="eventType"
                  value={filters.eventType}
                  onChange={handleFilterChange}
                  label="事件类型"
                >
                  {eventTypeOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* 精确时间切换开关 */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={usePreciseTime}
                    onChange={(e) => setUsePreciseTime(e.target.checked)}
                    size="small"
                  />
                }
                label="精确时间选择（包含小时分钟）"
              />
            </Grid>

            {/* 开始时间 */}
            <Grid item xs={12} sm={6} md={3}>
              {usePreciseTime ? (
                <DateTimePicker
                  label="开始时间"
                  value={filters.startDate}
                  onChange={(value) => handleDateTimeChange('startDate', value)}
                  format="yyyy/MM/dd HH:mm"
                  ampm={false} // 使用24小时制
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true
                    }
                  }}
                />
              ) : (
                <DatePicker
                  label="开始日期"
                  value={filters.startDate}
                  onChange={(value) => handleDateTimeChange('startDate', value)}
                  format="yyyy/MM/dd"
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true
                    }
                  }}
                />
              )}
            </Grid>

            {/* 结束时间 */}
            <Grid item xs={12} sm={6} md={3}>
              {usePreciseTime ? (
                <DateTimePicker
                  label="结束时间"
                  value={filters.endDate}
                  onChange={(value) => handleDateTimeChange('endDate', value)}
                  format="yyyy/MM/dd HH:mm"
                  ampm={false} // 使用24小时制
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true
                    }
                  }}
                />
              ) : (
                <DatePicker
                  label="结束日期"
                  value={filters.endDate}
                  onChange={(value) => handleDateTimeChange('endDate', value)}
                  format="yyyy/MM/dd"
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true
                    }
                  }}
                />
              )}
            </Grid>

            {/* 操作按钮 */}
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<SearchIcon />}
                  onClick={searchEvents}
                  disabled={loading}
                >
                  搜索
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={clearFilters}
                >
                  清空
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadEvents}
                disabled={loading}
                fullWidth
              >
                刷新
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* 事件列表 */}
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>事件时间</TableCell>
                  <TableCell>商户</TableCell>
                  <TableCell>出厂序列号</TableCell>
                  <TableCell>设备编号</TableCell>
                  <TableCell>事件类型</TableCell>
                  <TableCell>严重性</TableCell>
                  <TableCell>事件名称</TableCell>
                  <TableCell>备注</TableCell>
                  <TableCell>操作人</TableCell>
                  <TableCell>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center">
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center">
                      没有找到事件记录
                    </TableCell>
                  </TableRow>
                ) : (
                  events.map((event) => (
                    <TableRow key={event.id} hover>
                      <TableCell>{formatDateTime(event.eventTime)}</TableCell>
                      <TableCell>
                        {event.merchantName ? (
                          <Tooltip title={`商户ID: ${event.merchantID}`} arrow>
                            <Typography
                              variant="body2"
                              sx={{
                                maxWidth: 150,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                cursor: 'help'
                              }}
                            >
                              {event.merchantName}
                            </Typography>
                          </Tooltip>
                        ) : (
                          event.merchantID || '-'
                        )}
                      </TableCell>
                      <TableCell>{event.machineID || '-'}</TableCell>
                      <TableCell>{event.deviceNO || '-'}</TableCell>
                      <TableCell>{getEventTypeChip(event.eventType)}</TableCell>
                      <TableCell>{getSeverityChip(event.severity)}</TableCell>
                      <TableCell>{event.eventName}</TableCell>
                      <TableCell>
                        {event.remark ? (
                          <Tooltip title={event.remark} arrow>
                            <Typography
                              variant="body2"
                              sx={{
                                maxWidth: 200,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {event.remark}
                            </Typography>
                          </Tooltip>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{event.operator || '-'}</TableCell>
                      <TableCell>
                        <Tooltip title="查看终端详情">
                          <IconButton
                            size="small"
                            onClick={() => viewTerminalDetail(event.terminalID)}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="每页行数:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} 共 ${count}`}
          />
        </Paper>
      </Box>
    </LocalizationProvider>
  );
};

export default TerminalEventsList;
