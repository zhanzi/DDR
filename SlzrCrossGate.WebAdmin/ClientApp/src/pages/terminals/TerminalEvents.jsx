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
  Tooltip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { terminalAPI } from '../../services/api'; // 使用API服务代替直接的axios
import { formatDateTime, formatDateForAPI } from '../../utils/dateUtils'; // 使用统一的时间处理工具
import { parseErrorMessage } from '../../utils/errorHandler';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { zhCN } from '@mui/x-date-pickers/locales';
import { zhCN as dateFnsZhCN } from 'date-fns/locale';

const TerminalEvents = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [terminal, setTerminal] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState(null);

  // 筛选条件
  const [filters, setFilters] = useState({
    eventType: '',
    startDate: null,
    endDate: null
  });

  // 加载终端信息
  const loadTerminal = async () => {
    try {
      const response = await terminalAPI.getTerminal(id); // 使用terminalAPI代替axios
      setTerminal(response);
    } catch (error) {
      console.error('Error loading terminal:', error);
      const errorMessage = parseErrorMessage(error, '加载终端信息失败');
      setError(errorMessage);
    }
  };

  // 加载终端事件
  const loadEvents = async () => {
    setLoading(true);
    try {
      // 构建查询参数
      const params = {
        page: page + 1,
        pageSize: rowsPerPage,
        eventType: filters.eventType || undefined,
        startDate: filters.startDate ? formatDateForAPI(filters.startDate, true) : undefined,
        endDate: filters.endDate ? formatDateForAPI(filters.endDate, false) : undefined
      };

      const response = await terminalAPI.getTerminalEvents(id, params); // 使用terminalAPI代替axios
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

  useEffect(() => {
    loadTerminal();
    loadEvents();
  }, [id, page, rowsPerPage]);

  // 处理筛选条件变更
  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // 处理日期筛选变更
  const handleDateChange = (name, date) => {
    setFilters(prev => ({ ...prev, [name]: date }));
  };

  // 应用筛选
  const applyFilters = () => {
    setPage(0);
    loadEvents();
  };

  // 清除筛选
  const clearFilters = () => {
    setFilters({
      eventType: '',
      startDate: null,
      endDate: null
    });
    setPage(0);
    loadEvents();
  };

  // 处理分页变更
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };


/*

Created = 0,
        //ǩ���¼�
        SignIn = 1,
        //ǩ���¼�
        SignOut = 2,
        //�ļ����ؿ�ʼ
        FileDownloadStart = 3,
        //�ļ����ؽ���
        FileDownloadEnd = 4,
        //�ļ��汾�Ѹ���
        FileVersionUpdated = 5,
        //�����ѱ��
        PropertyChanged = 6,
        //������Կ�Ѱ�
        UnionPayKeyBound = 7,
        //�̻����ѱ��
        MerchantIDChanged = 8,
        //��·���ѱ��
        LineNOChanged = 9,
        //�豸���ѱ��
        DeviceNOChanged = 10,
        //Message Sent
        MessageSent = 11,
        //File Published
        FilePublished = 12,

        */

  // 获取事件类型的显示样式
  const getEventTypeChip = (eventType) => {
    switch (eventType) {
      case 1: // SignIn
        return <Chip label="签到" color="success" size="small" />;
      case 2: // SignOut
        return <Chip label="签退" color="error" size="small" />;
      case 3: // FileDownloadStart
        return <Chip label="文件下载开始" color="info" size="small" />;
      case 4: // FileDownloadEnd
        return <Chip label="文件下载结束" color="info" size="small" />;
      case 5: // FileVersionUpdated
        return <Chip label="文件版本更新" color="info" size="small" />;
      case 6: // PropertyChanged
        return <Chip label="属性变更" color="info" size="small" />;
      case 7: // UnionPayKeyBound
        return <Chip label="银联密钥绑定" color="info" size="small" />;
      case 8: // MerchantIDChanged
        return <Chip label="商户变更" color="info" size="small" />;
      case 9: // LineNOChanged
        return <Chip label="线路变更" color="info" size="small" />;
      case 10: // DeviceNOChanged
        return <Chip label="设备变更" color="info" size="small" />;
      case 11: // MessageSent
        return <Chip label="消息发送" color="secondary" size="small" />;
      case 12: // FilePublished
        return <Chip label="文件发布" color="warning" size="small" />;
      default:
        return <Chip label="其他" color="default" size="small" />;
    }
  };

  // 获取事件严重性的显示样式
  const getSeverityChip = (severity) => {
    switch (severity) {
      case 0: // Info
        return <Chip label="信息" color="info" size="small" />;
      case 1: // Warning
        return <Chip label="警告" color="warning" size="small" />;
      case 2: // Error
        return <Chip label="错误" color="error" size="small" />;
      case 3: // Critical
        return <Chip label="严重" color="error" size="small" variant="outlined" />;
      default:
        return <Chip label="未知" color="default" size="small" />;
    }
  };

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="error" gutterBottom>
          {error}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/terminals')}
        >
          返回终端列表
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          终端事件记录
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(`/app/terminals/${id}`)}
            sx={{ mr: 1 }}
          >
            返回终端详情
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={loadEvents}
          >
            刷新
          </Button>
        </Box>
      </Box>

      {/* 终端信息 */}
      {terminal && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" color="textSecondary">终端ID</Typography>
              <Typography variant="body1">{terminal.id}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" color="textSecondary">商户ID</Typography>
              <Typography variant="body1">{terminal.merchantID}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" color="textSecondary">设备编号</Typography>
              <Typography variant="body1">{terminal.deviceNO}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" color="textSecondary">线路编号</Typography>
              <Typography variant="body1">{terminal.lineNO}</Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* 筛选条件 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>事件类型</InputLabel>
              <Select
                name="eventType"
                value={filters.eventType}
                onChange={handleFilterChange}
                label="事件类型"
              >
                <MenuItem value="">全部</MenuItem>
                <MenuItem value="1">签到</MenuItem>
                <MenuItem value="2">签退</MenuItem>
                <MenuItem value="3">文件下载开始</MenuItem>
                <MenuItem value="4">文件下载结束</MenuItem>
                <MenuItem value="5">文件版本更新</MenuItem>
                <MenuItem value="6">属性变更</MenuItem>
                <MenuItem value="7">银联密钥绑定</MenuItem>
                <MenuItem value="8">商户变更</MenuItem>
                <MenuItem value="9">线路变更</MenuItem>
                <MenuItem value="10">设备变更</MenuItem>
                <MenuItem value="11">消息发送</MenuItem>
                <MenuItem value="12">文件发布</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider
              dateAdapter={AdapterDateFns}
              adapterLocale={dateFnsZhCN}
              localeText={zhCN.components.MuiLocalizationProvider.defaultProps.localeText}
            >
              <DatePicker
                label="开始日期"
                value={filters.startDate}
                onChange={(date) => handleDateChange('startDate', date)}
                format="yyyy/MM/dd"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small'
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider
              dateAdapter={AdapterDateFns}
              adapterLocale={dateFnsZhCN}
              localeText={zhCN.components.MuiLocalizationProvider.defaultProps.localeText}
            >
              <DatePicker
                label="结束日期"
                value={filters.endDate}
                onChange={(date) => handleDateChange('endDate', date)}
                format="yyyy/MM/dd"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small'
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6} md={1}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              startIcon={<SearchIcon />}
              onClick={applyFilters}
            >
              搜索
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={1}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={clearFilters}
            >
              清除
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={1}>
            <Button
              fullWidth
              variant="outlined"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={loadEvents}
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
                <TableCell>ID</TableCell>
                <TableCell>事件时间</TableCell>
                <TableCell>事件类型</TableCell>
                <TableCell>严重性</TableCell>
                <TableCell>事件名称</TableCell>
                <TableCell>备注</TableCell>
                <TableCell>操作人</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    没有找到事件记录
                  </TableCell>
                </TableRow>
              ) : (
                events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>{event.id}</TableCell>
                    <TableCell>{formatDateTime(event.eventTime)}</TableCell>
                    <TableCell>{getEventTypeChip(event.eventType)}</TableCell>
                    <TableCell>{getSeverityChip(event.severity)}</TableCell>
                    <TableCell>{event.eventName}</TableCell>
                    <TableCell>{event.remark || '-'}</TableCell>
                    <TableCell>{event.operator || '-'}</TableCell>
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
  );
};

export default TerminalEvents;
