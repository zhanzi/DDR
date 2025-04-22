import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  MenuItem,
  Chip,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Visibility as VisibilityIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const MessageList = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [messageTypes, setMessageTypes] = useState([]);
  const [terminals, setTerminals] = useState([]);
  const [stats, setStats] = useState({ totalCount: 0, readCount: 0, unreadCount: 0, dailyStats: [] });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // 筛选条件
  const [filters, setFilters] = useState({
    merchantId: '',
    msgTypeId: '',
    terminalId: '',
    isRead: '',
    startDate: null,
    endDate: null
  });

  // 消息详情对话框
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);

  // 加载消息列表
  const loadMessages = async () => {
    setLoading(true);
    try {
      // 构建查询参数
      const params = {
        page: page + 1,
        pageSize: rowsPerPage,
        ...Object.fromEntries(
          Object.entries(filters)
            .filter(([key, value]) => value !== '' && value !== null)
            .map(([key, value]) => {
              if (key === 'startDate' || key === 'endDate') {
                return [key, value ? format(value, 'yyyy-MM-dd') : undefined];
              }
              return [key, value];
            })
        )
      };

      const response = await axios.get('/api/Messages', { params });
      setMessages(response.data.items);
      setTotalCount(response.data.totalCount);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载消息类型列表
  const loadMessageTypes = async () => {
    try {
      const response = await axios.get('/api/MessageTypes');
      setMessageTypes(response.data.items);
    } catch (error) {
      console.error('Error loading message types:', error);
    }
  };

  // 加载终端列表
  const loadTerminals = async () => {
    try {
      const response = await axios.get('/api/Terminals', { params: { pageSize: 100 } });
      setTerminals(response.data.items);
    } catch (error) {
      console.error('Error loading terminals:', error);
    }
  };

  // 加载消息统计
  const loadMessageStats = async () => {
    try {
      const response = await axios.get('/api/Messages/Stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error loading message stats:', error);
    }
  };

  useEffect(() => {
    loadMessages();
    loadMessageTypes();
    loadTerminals();
    loadMessageStats();
  }, [page, rowsPerPage]);

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
    loadMessages();
  };

  // 清除筛选
  const clearFilters = () => {
    setFilters({
      merchantId: '',
      msgTypeId: '',
      terminalId: '',
      isRead: '',
      startDate: null,
      endDate: null
    });
    setPage(0);
    loadMessages();
  };

  // 处理分页变更
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 打开消息详情对话框
  const openMessageDetail = (message) => {
    setSelectedMessage(message);
    setOpenDetailDialog(true);
  };

  // 跳转到发送消息页面
  const goToSendMessage = () => {
    navigate('/app/messages/send');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        消息管理
      </Typography>

      {/* 统计卡片 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="textSecondary">
                总消息数
              </Typography>
              <Typography variant="h3">
                {stats.totalCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="textSecondary">
                已读消息
              </Typography>
              <Typography variant="h3" color="success.main">
                {stats.readCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="textSecondary">
                未读消息
              </Typography>
              <Typography variant="h3" color="error.main">
                {stats.unreadCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 筛选条件 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="商户ID"
              name="merchantId"
              value={filters.merchantId}
              onChange={handleFilterChange}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>消息类型</InputLabel>
              <Select
                name="msgTypeId"
                value={filters.msgTypeId}
                onChange={handleFilterChange}
                label="消息类型"
              >
                <MenuItem value="">全部</MenuItem>
                {messageTypes.map((type) => (
                  <MenuItem key={`${type.code}-${type.merchantId}`} value={type.code}>
                    {type.code} - {type.name || '未命名'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>终端</InputLabel>
              <Select
                name="terminalId"
                value={filters.terminalId}
                onChange={handleFilterChange}
                label="终端"
              >
                <MenuItem value="">全部</MenuItem>
                {terminals.map((terminal) => (
                  <MenuItem key={terminal.id} value={terminal.id}>
                    {terminal.deviceNO} ({terminal.lineNO})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>状态</InputLabel>
              <Select
                name="isRead"
                value={filters.isRead}
                onChange={handleFilterChange}
                label="状态"
              >
                <MenuItem value="">全部</MenuItem>
                <MenuItem value="true">已读</MenuItem>
                <MenuItem value="false">未读</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="开始日期"
                value={filters.startDate}
                onChange={(date) => handleDateChange('startDate', date)}
                renderInput={(params) => <TextField {...params} fullWidth size="small" />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="结束日期"
                value={filters.endDate}
                onChange={(date) => handleDateChange('endDate', date)}
                renderInput={(params) => <TextField {...params} fullWidth size="small" />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
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
          <Grid item xs={12} sm={6} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={clearFilters}
            >
              清除
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Button
              fullWidth
              variant="outlined"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={loadMessages}
            >
              刷新
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Button
              fullWidth
              variant="contained"
              color="secondary"
              startIcon={<SendIcon />}
              onClick={goToSendMessage}
            >
              发送消息
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* 消息列表 */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>商户ID</TableCell>
                <TableCell>终端ID</TableCell>
                <TableCell>终端设备号</TableCell>
                <TableCell>消息类型</TableCell>
                <TableCell>内容</TableCell>
                <TableCell>状态</TableCell>
                <TableCell>发送时间</TableCell>
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
              ) : messages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    没有找到消息
                  </TableCell>
                </TableRow>
              ) : (
                messages.map((message) => (
                  <TableRow key={message.id}>
                    <TableCell>{message.id}</TableCell>
                    <TableCell>{message.merchantID}</TableCell>
                    <TableCell>{message.terminalID}</TableCell>
                    <TableCell>{message.terminalDeviceNO || '-'}</TableCell>
                    <TableCell>{message.msgTypeName || message.msgTypeID || '-'}</TableCell>
                    <TableCell>
                      {message.content ? (
                        message.content.length > 30
                          ? `${message.content.substring(0, 30)}...`
                          : message.content
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={message.isRead ? "已读" : "未读"}
                        color={message.isRead ? "success" : "error"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{format(new Date(message.createTime), 'yyyy-MM-dd HH:mm:ss')}</TableCell>
                    <TableCell>{message.operator || '-'}</TableCell>
                    <TableCell>
                      <Tooltip title="查看详情">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => openMessageDetail(message)}
                        >
                          <VisibilityIcon fontSize="small" />
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

      {/* 消息详情对话框 */}
      <Dialog open={openDetailDialog} onClose={() => setOpenDetailDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>消息详情</DialogTitle>
        <DialogContent>
          {selectedMessage && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">消息ID</Typography>
                <Typography variant="body1">{selectedMessage.id}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">商户ID</Typography>
                <Typography variant="body1">{selectedMessage.merchantID}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">终端ID</Typography>
                <Typography variant="body1">{selectedMessage.terminalID}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">终端设备号</Typography>
                <Typography variant="body1">{selectedMessage.terminalDeviceNO || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">消息类型</Typography>
                <Typography variant="body1">{selectedMessage.msgTypeName || selectedMessage.msgTypeID || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">状态</Typography>
                <Typography variant="body1">
                  <Chip
                    label={selectedMessage.isRead ? "已读" : "未读"}
                    color={selectedMessage.isRead ? "success" : "error"}
                    size="small"
                  />
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">发送时间</Typography>
                <Typography variant="body1">{format(new Date(selectedMessage.createTime), 'yyyy-MM-dd HH:mm:ss')}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">操作人</Typography>
                <Typography variant="body1">{selectedMessage.operator || '-'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary">消息内容</Typography>
                <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
                  <Typography variant="body1">{selectedMessage.content || '-'}</Typography>
                </Paper>
              </Grid>
              {selectedMessage.isRead && selectedMessage.readTime && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">读取时间</Typography>
                  <Typography variant="body1">{format(new Date(selectedMessage.readTime), 'yyyy-MM-dd HH:mm:ss')}</Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailDialog(false)}>关闭</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MessageList;
