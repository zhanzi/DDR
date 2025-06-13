import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  TextField,
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
  Select,
  Stack
} from '@mui/material';
import ResponsiveTable, {
  ResponsiveTableHead,
  ResponsiveTableBody,
  ResponsiveTableRow,
  ResponsiveTableCell
} from '../../components/ResponsiveTable';
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Visibility as VisibilityIcon,
  Send as SendIcon,
  List as ListIcon,
  Message as MessageIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { formatDateTime, formatDateForAPI } from '../../utils/dateUtils';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { messageAPI, merchantAPI,terminalAPI } from '../../services/api';
import MerchantAutocomplete from '../../components/MerchantAutocomplete';

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

  // 选中的商户对象（用于MerchantAutocomplete）
  const [selectedMerchant, setSelectedMerchant] = useState(null);

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
              if (key === 'startDate') {
                return [key, value ? formatDateForAPI(value, true) : undefined];
              } else if (key === 'endDate') {
                return [key, value ? formatDateForAPI(value, false) : undefined];
              }
              return [key, value];
            })
        )
      };

      const response = await messageAPI.getMessages(params);
      setMessages(response.items);
      setTotalCount(response.totalCount);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载消息类型列表
  const loadMessageTypes = async (merchantId = '') => {
    try {
      // 只有在提供了商户ID时才加载消息类型
      if (merchantId) {
        const params = { merchantId };
        const response = await messageAPI.getMessageTypes(params);
        setMessageTypes(response.items);
      } else {
        // 当没有提供商户ID时，清空消息类型列表
        setMessageTypes([]);
      }
    } catch (error) {
      console.error('Error loading message types:', error);
    }
  };

  // 加载终端列表
  const loadTerminals = async () => {
    try {
      const response = await terminalAPI.getTerminals({ pageSize: 100 });
      setTerminals(response.items);
    } catch (error) {
      console.error('Error loading terminals:', error);
    }
  };

  // 加载消息统计
  const loadMessageStats = async () => {
    try {
      const response = await messageAPI.getMessageStats();
      setStats(response);
    } catch (error) {
      console.error('Error loading message stats:', error);
    }
  };

  useEffect(() => {
    loadMessages();
    // 初始不加载消息类型，等待用户选择商户后再加载
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
    setSelectedMerchant(null); // 重置商户下拉框选择状态
    setMessageTypes([]); // 直接清空消息类型列表，而不是调用loadMessageTypes()
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
            <MerchantAutocomplete
              value={selectedMerchant}
              onChange={(event, newValue) => {
                setSelectedMerchant(newValue);
                const merchantId = newValue ? newValue.merchantID : '';
                setFilters(prev => ({
                  ...prev,
                  merchantId: merchantId,
                  msgTypeId: '' // 重置消息类型选择
                }));
                // 重新加载所选商户的消息类型
                loadMessageTypes(merchantId);
              }}
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
        </Grid>
      </Paper>

      {/* 操作按钮 - 单独放置在标题下方 */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 2,
        mb: 3
      }}>
        <Button
          variant="outlined"
          color="secondary" // 由 "info" 修改为 "secondary"
          startIcon={<ListIcon />}
          onClick={() => navigate('/app/messages/types')}
        >
          消息类型管理
        </Button>
        {(false && <Button

          variant="contained"
          color="secondary"
          startIcon={<MessageIcon />}
          onClick={goToSendMessage}
        >
          发送消息
        </Button>)}
      </Box>

      {/* 消息列表 */}
      <Paper>
        <ResponsiveTable minWidth={1000} stickyActions={true}>
          <ResponsiveTableHead>
            <ResponsiveTableRow>
              <ResponsiveTableCell>ID</ResponsiveTableCell>
              <ResponsiveTableCell hideOn={['xs']}>商户</ResponsiveTableCell>
              <ResponsiveTableCell hideOn={['xs', 'sm']}>终端ID</ResponsiveTableCell>
              <ResponsiveTableCell hideOn={['xs', 'sm']}>终端设备号</ResponsiveTableCell>
              <ResponsiveTableCell>消息类型</ResponsiveTableCell>
              <ResponsiveTableCell>内容</ResponsiveTableCell>
              <ResponsiveTableCell>状态</ResponsiveTableCell>
              <ResponsiveTableCell hideOn={['xs']}>发送时间</ResponsiveTableCell>
              <ResponsiveTableCell hideOn={['xs', 'sm']}>操作人</ResponsiveTableCell>
              <ResponsiveTableCell sticky={true} minWidth={80}>操作</ResponsiveTableCell>
            </ResponsiveTableRow>
          </ResponsiveTableHead>
          <ResponsiveTableBody>
            {loading ? (
              <ResponsiveTableRow>
                <ResponsiveTableCell colSpan={10} align="center">
                  <CircularProgress size={24} />
                </ResponsiveTableCell>
              </ResponsiveTableRow>
            ) : messages.length === 0 ? (
              <ResponsiveTableRow>
                <ResponsiveTableCell colSpan={10} align="center">
                  没有找到消息
                </ResponsiveTableCell>
              </ResponsiveTableRow>
            ) : (
              messages.map((message) => (
                <ResponsiveTableRow key={message.id}>
                  <ResponsiveTableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {message.id}
                      </Typography>
                      {/* 在小屏幕上显示商户信息 */}
                      <Typography variant="caption" color="textSecondary" sx={{ display: { xs: 'block', sm: 'none' } }}>
                        {message.merchantName}
                      </Typography>
                    </Box>
                  </ResponsiveTableCell>
                  <ResponsiveTableCell hideOn={['xs']}>
                    <Tooltip title={message.merchantID || ''}>
                      <span>{message.merchantName}</span>
                    </Tooltip>
                  </ResponsiveTableCell>
                  <ResponsiveTableCell hideOn={['xs', 'sm']}>{message.terminalID}</ResponsiveTableCell>
                  <ResponsiveTableCell hideOn={['xs', 'sm']}>{message.terminalDeviceNO || '-'}</ResponsiveTableCell>
                  <ResponsiveTableCell>
                    <Box>
                      <Typography variant="body2">
                        {message.msgTypeName || message.msgTypeID || '-'}
                      </Typography>
                      {/* 在小屏幕上显示终端信息 */}
                      <Typography variant="caption" color="textSecondary" sx={{ display: { xs: 'block', md: 'none' } }}>
                        终端: {message.terminalDeviceNO || message.terminalID}
                      </Typography>
                    </Box>
                  </ResponsiveTableCell>
                  <ResponsiveTableCell>
                    <Box>
                      <Typography variant="body2">
                        {message.content ? (
                          message.content.length > 30
                            ? `${message.content.substring(0, 30)}...`
                            : message.content
                        ) : '-'}
                      </Typography>
                      {/* 在小屏幕上显示时间和操作人 */}
                      <Typography variant="caption" color="textSecondary" sx={{ display: { xs: 'block', sm: 'none' } }}>
                        {formatDateTime(message.createTime)} | {message.operator || '系统'}
                      </Typography>
                    </Box>
                  </ResponsiveTableCell>
                  <ResponsiveTableCell>
                    <Chip
                      label={message.isRead ? "已读" : "未读"}
                      color={message.isRead ? "success" : "error"}
                      size="small"
                    />
                  </ResponsiveTableCell>
                  <ResponsiveTableCell hideOn={['xs']}>{formatDateTime(message.createTime)}</ResponsiveTableCell>
                  <ResponsiveTableCell hideOn={['xs', 'sm']}>{message.operator || '-'}</ResponsiveTableCell>
                  <ResponsiveTableCell sticky={true}>
                    <Tooltip title="查看详情">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => openMessageDetail(message)}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </ResponsiveTableCell>
                </ResponsiveTableRow>
              ))
            )}
          </ResponsiveTableBody>
        </ResponsiveTable>
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
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={selectedMessage.isRead ? "已读" : "未读"}
                    color={selectedMessage.isRead ? "success" : "error"}
                    size="small"
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">发送时间</Typography>
                <Typography variant="body1">{formatDateTime(selectedMessage.createTime)}</Typography>
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
                  <Typography variant="body1">{formatDateTime(selectedMessage.readTime)}</Typography>
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
