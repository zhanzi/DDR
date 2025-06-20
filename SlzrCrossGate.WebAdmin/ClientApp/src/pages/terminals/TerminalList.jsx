import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
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
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Snackbar,
  CircularProgress
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
  Message as MessageIcon,
  Publish as PublishIcon,
  History as HistoryIcon,
  GetApp as GetAppIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { terminalAPI, messageAPI, fileAPI } from '../../services/api'; // 使用API服务代替直接的axios
import { formatDateTime, isWithinMinutes, formatOfflineDuration } from '../../utils/dateUtils'; // 使用统一的时间处理工具
import MerchantAutocomplete from '../../components/MerchantAutocomplete'; // 导入商户下拉框组件
import { parseErrorMessage } from '../../utils/errorHandler';

const TerminalList = () => {
  const navigate = useNavigate();
  const [terminals, setTerminals] = useState([]);
  const [stats, setStats] = useState({ totalCount: 0, activeCount: 0, inactiveCount: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // 筛选条件
  const [filters, setFilters] = useState({
    merchantId: '',
    lineNo: '',
    deviceNo: '',
    machineId: '',
    terminalType: '',
    activeStatus: ''
  });

  // 选中的商户
  const [selectedMerchant, setSelectedMerchant] = useState(null);

  // 消息发送对话框
  const [messageDialog, setMessageDialog] = useState(false);
  const [selectedTerminals, setSelectedTerminals] = useState([]);
  const [messageType, setMessageType] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [messageTypes, setMessageTypes] = useState([]);
  const [selectedMessageType, setSelectedMessageType] = useState(null); // 选中的消息类型详细信息
  const [currentTerminalMerchantForMessage, setCurrentTerminalMerchantForMessage] = useState(null);

  // 文件发布对话框
  const [fileDialog, setFileDialog] = useState(false);
  const [selectedFileVersion, setSelectedFileVersion] = useState(null);
  const [fileVersions, setFileVersions] = useState([]);
  const [publishLoading, setPublishLoading] = useState(false);
  const [fileVersionsLoading, setFileVersionsLoading] = useState(false);

  // 文件版本分页和筛选
  const [fileVersionPage, setFileVersionPage] = useState(0);
  const [fileVersionRowsPerPage, setFileVersionRowsPerPage] = useState(5);
  const [fileVersionTotalCount, setFileVersionTotalCount] = useState(0);
  const [fileVersionFilters, setFileVersionFilters] = useState({
    fileTypeId: '',
    filePara: '',
    ver: ''
  });
  const [fileTypes, setFileTypes] = useState([]);
  const [currentTerminalMerchant, setCurrentTerminalMerchant] = useState(null);

  // 消息提示
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' // 'success', 'error', 'warning', 'info'
  });

  // 显示消息提示
  const showMessage = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  // 关闭消息提示
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // 处理文件版本筛选条件变更
  const handleFileVersionFilterChange = (event) => {
    const { name, value } = event.target;
    setFileVersionFilters(prev => ({ ...prev, [name]: value }));
  };

  // 应用文件版本筛选
  const applyFileVersionFilters = () => {
    setFileVersionPage(0);
    loadFileVersionsForPublish();
  };

  // 清除文件版本筛选
  const clearFileVersionFilters = () => {
    setFileVersionFilters({
      fileTypeId: '',
      filePara: '',
      ver: ''
    });
    setFileVersionPage(0);
    loadFileVersionsForPublish();
  };

  // 处理文件版本分页变更
  const handleFileVersionPageChange = (_, newPage) => {
    setFileVersionPage(newPage);
  };

  const handleFileVersionRowsPerPageChange = (event) => {
    setFileVersionRowsPerPage(parseInt(event.target.value, 10));
    setFileVersionPage(0);
  };

  // 选择文件版本
  const handleSelectFileVersion = (version) => {
    setSelectedFileVersion(version);
  };

  // 加载终端列表
  const loadTerminals = useCallback(async () => {
    setLoading(true);
    try {
      // 构建查询参数
      const params = {
        page: page + 1,
        pageSize: rowsPerPage,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      };

      // 如果选择了商户，使用商户ID
      if (selectedMerchant) {
        params.merchantId = selectedMerchant.merchantID;
      }

      // 并行加载终端列表和统计数据
      const [terminalsResponse, statsResponse] = await Promise.all([
        terminalAPI.getTerminals(params),
        terminalAPI.getTerminalStats({
          merchantId: selectedMerchant ? selectedMerchant.merchantID : undefined
        })
      ]);

      setTerminals(terminalsResponse.items);
      setTotalCount(terminalsResponse.totalCount);
      setStats(statsResponse);
    } catch (error) {
      console.error('Error loading terminals:', error);
      const errorMessage = parseErrorMessage(error, '加载终端列表失败');
      showMessage(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, filters, selectedMerchant]);

  // 加载消息类型（根据商户ID）
  const loadMessageTypes = async (merchantId) => {
    if (!merchantId) return;

    try {
      const response = await messageAPI.getAllMessageTypes(merchantId);
      setMessageTypes(response || []);
    } catch (error) {
      console.error('Error loading message types:', error);
      showMessage('加载消息类型失败', 'error');
    }
  };

  // 加载文件版本（用于发布对话框）
  const loadFileVersionsForPublish = async () => {
    if (!currentTerminalMerchant) return;

    setFileVersionsLoading(true);
    try {
      const params = {
        merchantId: currentTerminalMerchant.merchantID,
        page: fileVersionPage + 1,
        pageSize: fileVersionRowsPerPage,
        ...Object.fromEntries(
          Object.entries(fileVersionFilters).filter(([_, value]) => value !== '')
        )
      };

      const response = await fileAPI.getFileVersions(params);
      setFileVersions(response.items || []);
      setFileVersionTotalCount(response.totalCount || 0);
    } catch (error) {
      console.error('Error loading file versions:', error);
      showMessage('加载文件版本失败', 'error');
    } finally {
      setFileVersionsLoading(false);
    }
  };

  // 加载文件类型（用于筛选）
  const loadFileTypesForPublish = async () => {
    if (!currentTerminalMerchant) return;

    try {
      const response = await fileAPI.getAllFileTypes();
      const merchantFileTypes = response.items?.filter(
        type => type.merchantID === currentTerminalMerchant.merchantID
      ) || [];
      setFileTypes(merchantFileTypes);
    } catch (error) {
      console.error('Error loading file types:', error);
    }
  };

  // 分离数据加载逻辑，避免重复请求
  useEffect(() => {
    loadTerminals();
  }, [loadTerminals]);

  // 监听文件版本相关状态变化
  useEffect(() => {
    if (currentTerminalMerchant && fileDialog) {
      loadFileVersionsForPublish();
      loadFileTypesForPublish();
    }
  }, [currentTerminalMerchant, fileDialog, fileVersionPage, fileVersionRowsPerPage]);

  // 处理筛选条件变更
  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // 应用筛选
  const applyFilters = () => {
    setPage(0);
    loadTerminals();
  };

  // 清除筛选
  const clearFilters = () => {
    setFilters({
      merchantId: '',
      lineNo: '',
      deviceNo: '',
      machineId: '',
      terminalType: '',
      activeStatus: ''
    });
    setSelectedMerchant(null);
    setPage(0);
    loadTerminals();
  };

  // 处理分页变更
  const handleChangePage = (_, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 处理消息类型选择
  const handleMessageTypeChange = (typeCode) => {
    setMessageType(typeCode);
    // 查找选中的消息类型详细信息
    const selectedType = messageTypes.find(type => type.code === typeCode);
    setSelectedMessageType(selectedType);

    // 如果有示例消息，可以预填充到内容框中
    if (selectedType && selectedType.exampleMessage) {
      setMessageContent(selectedType.exampleMessage);
    } else {
      setMessageContent('');
    }
  };

  // 打开消息对话框
  const openMessageDialog = (terminal) => {
    setSelectedTerminals([terminal]);
    setCurrentTerminalMerchantForMessage({ merchantID: terminal.merchantID, name: terminal.merchantName });
    setMessageType('');
    setMessageContent('');
    setSelectedMessageType(null);
    setMessageDialog(true);
    // 加载该商户的消息类型
    loadMessageTypes(terminal.merchantID);
  };

  // 发送消息
  const sendMessage = async () => {
    try {
      await terminalAPI.sendMessage(
        selectedTerminals.map(t => t.id),
        messageType,
        messageContent
      );

      // 发送成功
      showMessage('消息发送成功！', 'success');
      setMessageDialog(false);
      setMessageType('');
      setMessageContent('');

      // 刷新终端列表
      loadTerminals();
    } catch (error) {
      console.error('Error sending message:', error);

      const errorMessage = parseErrorMessage(error, '消息发送失败');
      showMessage(errorMessage, 'error');
    }
  };

  // 打开文件发布对话框
  const openFileDialog = (terminal) => {
    setSelectedTerminals([terminal]);
    setCurrentTerminalMerchant({ merchantID: terminal.merchantID, name: terminal.merchantName });
    setSelectedFileVersion(null);
    // 重置筛选和分页
    setFileVersionFilters({
      fileTypeId: '',
      filePara: '',
      ver: ''
    });
    setFileVersionPage(0);
    setFileDialog(true);
  };

  // 发布文件
  const publishFile = async () => {
    if (!selectedFileVersion) {
      showMessage('请选择要发布的文件版本', 'warning');
      return;
    }

    setPublishLoading(true);
    try {
      await terminalAPI.publishFile(
        selectedTerminals.map(t => t.id),
        selectedFileVersion.id
      );

      // 发布成功
      showMessage(`文件版本 ${selectedFileVersion.fileFullType}-${selectedFileVersion.ver} 发布成功！`, 'success');
      setFileDialog(false);
      setSelectedFileVersion(null);

      // 刷新终端列表
      loadTerminals();
    } catch (error) {
      console.error('Error publishing file:', error);

      const errorMessage = parseErrorMessage(error, '文件发布失败');
      showMessage(errorMessage, 'error');
    } finally {
      setPublishLoading(false);
    }
  };

  // 导出终端列表
  const exportTerminals = () => {
    // 构建查询参数
    const params = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== '')
    );

    // 创建URL
    const queryString = new URLSearchParams(params).toString();
    const url = `/api/Terminals/export?${queryString}`;

    // 打开下载链接
    window.open(url, '_blank');
  };

  // 获取终端状态的显示样式
  const getStatusChip = (status) => {
    if (!status) return <Chip label="未知" color="default" size="small" />;

    // 使用新的时间处理工具判断是否在线（5分钟内活跃且状态为激活）
    if (status.activeStatus === 1 && isWithinMinutes(status.lastActiveTime, 5)) {
      return <Chip label="在线" color="success" size="small" />;
    } else {
      // 使用友好的离线时长显示
      const offlineDuration = formatOfflineDuration(status.lastActiveTime);
      return <Chip label={offlineDuration} color="error" size="small" />;
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        终端管理
      </Typography>

      {/* 统计卡片 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="textSecondary">
                总终端数
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
                在线设备
              </Typography>
              <Typography variant="h3" color="success.main">
                {stats.activeCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="textSecondary">
                离线设备
              </Typography>
              <Typography variant="h3" color="error.main">
                {stats.inactiveCount}
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
              label="商户"
              value={selectedMerchant}
              onChange={(_, newValue) => setSelectedMerchant(newValue)}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="线路编号"
              name="lineNo"
              value={filters.lineNo}
              onChange={handleFilterChange}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="设备编号"
              name="deviceNo"
              value={filters.deviceNo}
              onChange={handleFilterChange}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="出厂序列号"
              name="machineId"
              value={filters.machineId}
              onChange={handleFilterChange}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="终端类型"
              name="terminalType"
              value={filters.terminalType}
              onChange={handleFilterChange}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              select
              label="状态"
              name="activeStatus"
              value={filters.activeStatus}
              onChange={handleFilterChange}
              size="small"
            >
              <MenuItem value="">全部</MenuItem>
              <MenuItem value="1">在线</MenuItem>
              <MenuItem value="2">离线</MenuItem>
            </TextField>
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
              onClick={loadTerminals}
            >
              刷新
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={1}>
            <Button
              fullWidth
              variant="outlined"
              color="secondary"
              startIcon={<GetAppIcon />}
              onClick={exportTerminals}
            >
              导出
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* 终端列表 */}
      <Paper>
        <ResponsiveTable minWidth={1200} stickyActions={true}>
          <ResponsiveTableHead>
            <ResponsiveTableRow>
              <ResponsiveTableCell>终端ID</ResponsiveTableCell>
              <ResponsiveTableCell hideOn={['xs']}>商户</ResponsiveTableCell>
              <ResponsiveTableCell hideOn={['xs', 'sm']}>出厂序列号</ResponsiveTableCell>
              <ResponsiveTableCell>设备编号</ResponsiveTableCell>
              <ResponsiveTableCell hideOn={['xs', 'sm']}>线路编号</ResponsiveTableCell>
              <ResponsiveTableCell hideOn={['xs', 'sm']}>终端类型</ResponsiveTableCell>
              <ResponsiveTableCell>状态</ResponsiveTableCell>
              <ResponsiveTableCell hideOn={['xs']}>最后活跃时间</ResponsiveTableCell>
              <ResponsiveTableCell sticky={true} minWidth={160}>操作</ResponsiveTableCell>
            </ResponsiveTableRow>
          </ResponsiveTableHead>
          <ResponsiveTableBody>
            {loading ? (
              <ResponsiveTableRow>
                <ResponsiveTableCell colSpan={9} align="center">
                  加载中...
                </ResponsiveTableCell>
              </ResponsiveTableRow>
            ) : terminals.length === 0 ? (
              <ResponsiveTableRow>
                <ResponsiveTableCell colSpan={9} align="center">
                  没有找到终端
                </ResponsiveTableCell>
              </ResponsiveTableRow>
            ) : (
              terminals.map((terminal) => (
                <ResponsiveTableRow key={terminal.id}>
                  <ResponsiveTableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {terminal.id}
                      </Typography>
                      {/* 在小屏幕上显示商户信息 */}
                      <Typography variant="caption" color="textSecondary" sx={{ display: { xs: 'block', sm: 'none' } }}>
                        {terminal.merchantName}
                      </Typography>
                    </Box>
                  </ResponsiveTableCell>
                  <ResponsiveTableCell hideOn={['xs']}>
                    <Tooltip title={terminal.merchantID || ''}>
                      <span>{terminal.merchantName}</span>
                    </Tooltip>
                  </ResponsiveTableCell>
                  <ResponsiveTableCell hideOn={['xs', 'sm']}>{terminal.machineID}</ResponsiveTableCell>
                  <ResponsiveTableCell>
                    <Box>
                      <Typography variant="body2">
                        {terminal.deviceNO}
                      </Typography>
                      {/* 在小屏幕上显示线路和类型信息 */}
                      <Typography variant="caption" color="textSecondary" sx={{ display: { xs: 'block', md: 'none' } }}>
                        线路: {terminal.lineNO} | 类型: {terminal.terminalType}
                      </Typography>
                    </Box>
                  </ResponsiveTableCell>
                  <ResponsiveTableCell hideOn={['xs', 'sm']}>{terminal.lineNO}</ResponsiveTableCell>
                  <ResponsiveTableCell hideOn={['xs', 'sm']}>{terminal.terminalType}</ResponsiveTableCell>
                  <ResponsiveTableCell>
                    <Box>
                      {getStatusChip(terminal.status)}
                      {/* 在小屏幕上显示最后活跃时间 */}
                      <Typography variant="caption" color="textSecondary" sx={{ display: { xs: 'block', sm: 'none' }, mt: 0.5 }}>
                        {terminal.status ? formatDateTime(terminal.status.lastActiveTime) : '-'}
                      </Typography>
                    </Box>
                  </ResponsiveTableCell>
                  <ResponsiveTableCell hideOn={['xs']}>
                    {terminal.status ? formatDateTime(terminal.status.lastActiveTime) : '-'}
                  </ResponsiveTableCell>
                  <ResponsiveTableCell sticky={true}>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      <Tooltip title="查看详情">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => navigate(`/app/terminals/${terminal.id}`)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="发送消息">
                        <IconButton
                          size="small"
                          color="secondary"
                          onClick={() => openMessageDialog(terminal)}
                        >
                          <MessageIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="发布文件">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => openFileDialog(terminal)}
                        >
                          <PublishIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="查看事件">
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => navigate(`/app/terminals/${terminal.id}/events`)}
                        >
                          <HistoryIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
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

      {/* 消息发送对话框 */}
      <Dialog open={messageDialog} onClose={() => setMessageDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          发送消息
          <Typography variant="subtitle2" color="textSecondary">
            终端: {selectedTerminals.map(t => `${t.id}(${t.deviceNO})`).join(', ')} |
            商户: {currentTerminalMerchantForMessage?.name}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>消息类型</InputLabel>
              <Select
                value={messageType}
                onChange={(e) => handleMessageTypeChange(e.target.value)}
                label="消息类型"
              >
                {messageTypes.map((type) => (
                  <MenuItem key={type.code} value={type.code}>
                    {type.code} - {type.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* 消息类型详细信息 */}
            {selectedMessageType && (
              <Paper sx={{ p: 2, mt: 2, backgroundColor: 'primary.light', color: 'primary.contrastText' }}>
                <Typography variant="subtitle1" gutterBottom>
                  消息类型信息
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2">
                      <strong>编码:</strong> {selectedMessageType.code}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2">
                      <strong>编码类型:</strong> {selectedMessageType.codeType === 1 ? 'ASCII' : 'HEX'}
                    </Typography>
                  </Grid>
                  {selectedMessageType.remark && (
                    <Grid item xs={12}>
                      <Typography variant="body2">
                        <strong>备注:</strong> {selectedMessageType.remark}
                      </Typography>
                    </Grid>
                  )}
                  {selectedMessageType.exampleMessage && (
                    <Grid item xs={12}>
                      <Typography variant="body2">
                        <strong>示例:</strong> {selectedMessageType.exampleMessage}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            )}

            <TextField
              fullWidth
              multiline
              rows={4}
              label="消息内容"
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              sx={{ mt: 2 }}
              helperText={selectedMessageType ? "请根据上方的消息类型信息和示例输入消息内容" : "请先选择消息类型"}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMessageDialog(false)}>取消</Button>
          <Button
            onClick={sendMessage}
            variant="contained"
            color="primary"
            disabled={!messageType || !messageContent}
          >
            发送
          </Button>
        </DialogActions>
      </Dialog>

      {/* 文件发布对话框 */}
      <Dialog open={fileDialog} onClose={() => setFileDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          发布文件到终端
          <Typography variant="subtitle2" color="textSecondary">
            终端: {selectedTerminals.map(t => `${t.id}(${t.deviceNO})`).join(', ')} |
            商户: {currentTerminalMerchant?.name}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {/* 筛选条件 */}
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>筛选条件</Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    select
                    label="文件类型"
                    name="fileTypeId"
                    value={fileVersionFilters.fileTypeId}
                    onChange={handleFileVersionFilterChange}
                    size="small"
                  >
                    <MenuItem value="">全部</MenuItem>
                    {fileTypes.map((type) => (
                      <MenuItem key={type.code} value={type.code}>
                        {type.code} - {type.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="文件参数"
                    name="filePara"
                    value={fileVersionFilters.filePara}
                    onChange={handleFileVersionFilterChange}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="版本号"
                    name="ver"
                    value={fileVersionFilters.ver}
                    onChange={handleFileVersionFilterChange}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<SearchIcon />}
                      onClick={applyFileVersionFilters}
                    >
                      搜索
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<ClearIcon />}
                      onClick={clearFileVersionFilters}
                    >
                      清除
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* 文件版本列表 */}
            <Paper>
              <TableContainer sx={{ maxHeight: 400 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">选择</TableCell>
                      <TableCell>文件类型</TableCell>
                      <TableCell>文件参数</TableCell>
                      <TableCell>版本号</TableCell>
                      <TableCell>文件大小</TableCell>
                      <TableCell>CRC校验</TableCell>
                      <TableCell>创建时间</TableCell>
                      <TableCell>操作人</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {fileVersionsLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          <CircularProgress size={24} />
                        </TableCell>
                      </TableRow>
                    ) : fileVersions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          没有找到文件版本
                        </TableCell>
                      </TableRow>
                    ) : (
                      fileVersions.map((version) => (
                        <TableRow
                          key={version.id}
                          hover
                          selected={selectedFileVersion?.id === version.id}
                          onClick={() => handleSelectFileVersion(version)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell padding="checkbox">
                            <input
                              type="radio"
                              checked={selectedFileVersion?.id === version.id}
                              onChange={() => handleSelectFileVersion(version)}
                            />
                          </TableCell>
                          <TableCell>{version.fileTypeName}({version.fileTypeID})</TableCell>
                          <TableCell>{version.filePara || '-'}</TableCell>
                          <TableCell>{version.ver}</TableCell>
                          <TableCell>{formatFileSize(version.fileSize)}</TableCell>
                          <TableCell>{version.crc}</TableCell>
                          <TableCell>{formatDateTime(version.createTime)}</TableCell>
                          <TableCell>{version.operator || '-'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={fileVersionTotalCount}
                rowsPerPage={fileVersionRowsPerPage}
                page={fileVersionPage}
                onPageChange={handleFileVersionPageChange}
                onRowsPerPageChange={handleFileVersionRowsPerPageChange}
                labelRowsPerPage="每页行数:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} 共 ${count}`}
              />
            </Paper>

            {/* 选中的文件版本信息 */}
            {selectedFileVersion && (
              <Paper sx={{ p: 2, mt: 2, backgroundColor: 'primary.light', color: 'primary.contrastText' }}>
                <Typography variant="subtitle1" gutterBottom>
                  已选择文件版本
                </Typography>
                <Typography variant="body2">
                  {selectedFileVersion.fileTypeName}({selectedFileVersion.fileTypeID}) -
                  参数: {selectedFileVersion.filePara || '无'} -
                  版本: {selectedFileVersion.ver} -
                  大小: {formatFileSize(selectedFileVersion.fileSize)}
                </Typography>
              </Paper>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFileDialog(false)} disabled={publishLoading}>
            取消
          </Button>
          <Button
            onClick={publishFile}
            variant="contained"
            color="primary"
            disabled={!selectedFileVersion || publishLoading}
            startIcon={publishLoading ? <CircularProgress size={20} /> : null}
          >
            {publishLoading ? '发布中...' : '发布'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 消息提示 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TerminalList;
