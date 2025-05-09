import React, { useState, useEffect } from 'react';
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
  Select
} from '@mui/material';
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
import { format } from 'date-fns';

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

  // 消息发送对话框
  const [messageDialog, setMessageDialog] = useState(false);
  const [selectedTerminals, setSelectedTerminals] = useState([]);
  const [messageType, setMessageType] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [messageTypes, setMessageTypes] = useState([]);

  // 文件发布对话框
  const [fileDialog, setFileDialog] = useState(false);
  const [fileVersion, setFileVersion] = useState('');
  const [fileVersions, setFileVersions] = useState([]);

  // 加载终端列表
  const loadTerminals = async () => {
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

      const response = await terminalAPI.getTerminals(params);
      setTerminals(response.items);
      setTotalCount(response.totalCount);

      // 加载统计数据
      const statsResponse = await terminalAPI.getTerminalStats({
        merchantId: filters.merchantId || undefined
      });
      setStats(statsResponse);
    } catch (error) {
      console.error('Error loading terminals:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载消息类型
  const loadMessageTypes = async () => {
    try {
      const response = await messageAPI.getMessageTypes();
      setMessageTypes(response.items || []);
    } catch (error) {
      console.error('Error loading message types:', error);
    }
  };

  // 加载文件版本
  const loadFileVersions = async () => {
    try {
      const response = await fileAPI.getFileVersions();
      setFileVersions(response.items || []);
    } catch (error) {
      console.error('Error loading file versions:', error);
    }
  };

  useEffect(() => {
    loadTerminals();
    loadMessageTypes();
    loadFileVersions();
  }, [page, rowsPerPage]);

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
    setPage(0);
    loadTerminals();
  };

  // 处理分页变更
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 打开消息对话框
  const openMessageDialog = (terminal) => {
    setSelectedTerminals([terminal]);
    setMessageDialog(true);
  };

  // 发送消息
  const sendMessage = async () => {
    try {
      await terminalAPI.sendMessage(
        selectedTerminals.map(t => t.id),
        messageType,
        messageContent
      );

      setMessageDialog(false);
      setMessageType('');
      setMessageContent('');

      // 刷新终端列表
      loadTerminals();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // 打开文件发布对话框
  const openFileDialog = (terminal) => {
    setSelectedTerminals([terminal]);
    setFileDialog(true);
  };

  // 发布文件
  const publishFile = async () => {
    try {
      await terminalAPI.publishFile(
        selectedTerminals.map(t => t.id),
        fileVersion
      );

      setFileDialog(false);
      setFileVersion('');

      // 刷新终端列表
      loadTerminals();
    } catch (error) {
      console.error('Error publishing file:', error);
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

    switch (status.activeStatus) {
      case 0: // Active
        return <Chip label="在线" color="success" size="small" />;
      case 1: // Inactive
        return <Chip label="离线" color="error" size="small" />;
      default:
        return <Chip label="未知" color="default" size="small" />;
    }
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
              label="机器ID"
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
              <MenuItem value="0">在线</MenuItem>
              <MenuItem value="1">离线</MenuItem>
            </TextField>
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
              onClick={loadTerminals}
            >
              刷新
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
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
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>终端ID</TableCell>
                <TableCell>商户ID</TableCell>
                <TableCell>出厂序列号</TableCell>
                <TableCell>设备编号</TableCell>
                <TableCell>线路编号</TableCell>
                <TableCell>终端类型</TableCell>
                <TableCell>状态</TableCell>
                <TableCell>最后活跃时间</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    加载中...
                  </TableCell>
                </TableRow>
              ) : terminals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    没有找到终端
                  </TableCell>
                </TableRow>
              ) : (
                terminals.map((terminal) => (
                  <TableRow key={terminal.id}>
                    <TableCell>{terminal.id}</TableCell>
                    <TableCell>{terminal.merchantID}</TableCell>
                    <TableCell>{terminal.machineID}</TableCell>
                    <TableCell>{terminal.deviceNO}</TableCell>
                    <TableCell>{terminal.lineNO}</TableCell>
                    <TableCell>{terminal.terminalType}</TableCell>
                    <TableCell>{getStatusChip(terminal.status)}</TableCell>
                    <TableCell>
                      {terminal.status ? format(new Date(terminal.status.lastActiveTime), 'yyyy-MM-dd HH:mm:ss') : '-'}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="查看详情">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => navigate(`/terminals/${terminal.id}`)}
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
                          onClick={() => navigate(`/terminals/${terminal.id}/events`)}
                        >
                          <HistoryIcon fontSize="small" />
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

      {/* 消息发送对话框 */}
      <Dialog open={messageDialog} onClose={() => setMessageDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>发送消息</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              选中的终端: {selectedTerminals.map(t => t.id).join(', ')}
            </Typography>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>消息类型</InputLabel>
              <Select
                value={messageType}
                onChange={(e) => setMessageType(e.target.value)}
                label="消息类型"
              >
                {messageTypes.map((type) => (
                  <MenuItem key={type.code} value={type.code}>
                    {type.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="消息内容"
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              sx={{ mt: 2 }}
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
      <Dialog open={fileDialog} onClose={() => setFileDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>发布文件</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              选中的终端: {selectedTerminals.map(t => t.id).join(', ')}
            </Typography>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>文件版本</InputLabel>
              <Select
                value={fileVersion}
                onChange={(e) => setFileVersion(e.target.value)}
                label="文件版本"
              >
                {fileVersions.map((version) => (
                  <MenuItem key={version.id} value={version.id}>
                    {version.fileFullType} - {version.ver}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFileDialog(false)}>取消</Button>
          <Button
            onClick={publishFile}
            variant="contained"
            color="primary"
            disabled={!fileVersion}
          >
            发布
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TerminalList;
