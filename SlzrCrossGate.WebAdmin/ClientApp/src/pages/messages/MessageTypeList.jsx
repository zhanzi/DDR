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
  CircularProgress
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import axios from 'axios';

const MessageTypeList = () => {
  const [messageTypes, setMessageTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // 筛选条件
  const [filters, setFilters] = useState({
    merchantId: '',
    code: '',
    name: ''
  });

  // 对话框状态
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // 'create' or 'edit'
  const [currentMessageType, setCurrentMessageType] = useState({
    code: '',
    merchantId: '',
    name: '',
    remark: ''
  });
  const [dialogError, setDialogError] = useState('');
  const [dialogLoading, setDialogLoading] = useState(false);

  // 删除确认对话框
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [messageTypeToDelete, setMessageTypeToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // 加载消息类型列表
  const loadMessageTypes = async () => {
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

      const response = await axios.get('/api/MessageTypes', { params });
      setMessageTypes(response.data.items);
      setTotalCount(response.data.totalCount);
    } catch (error) {
      console.error('Error loading message types:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessageTypes();
  }, [page, rowsPerPage]);

  // 处理筛选条件变更
  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // 应用筛选
  const applyFilters = () => {
    setPage(0);
    loadMessageTypes();
  };

  // 清除筛选
  const clearFilters = () => {
    setFilters({
      merchantId: '',
      code: '',
      name: ''
    });
    setPage(0);
    loadMessageTypes();
  };

  // 处理分页变更
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 打开创建对话框
  const openCreateDialog = () => {
    setDialogMode('create');
    setCurrentMessageType({
      code: '',
      merchantId: '',
      name: '',
      remark: ''
    });
    setDialogError('');
    setOpenDialog(true);
  };

  // 打开编辑对话框
  const openEditDialog = (messageType) => {
    setDialogMode('edit');
    setCurrentMessageType({
      code: messageType.code,
      merchantId: messageType.merchantId,
      name: messageType.name || '',
      remark: messageType.remark || ''
    });
    setDialogError('');
    setOpenDialog(true);
  };

  // 处理对话框输入变更
  const handleDialogInputChange = (event) => {
    const { name, value } = event.target;
    setCurrentMessageType(prev => ({ ...prev, [name]: value }));
  };

  // 保存消息类型
  const saveMessageType = async () => {
    setDialogLoading(true);
    setDialogError('');

    try {
      if (dialogMode === 'create') {
        // 创建新消息类型
        await axios.post('/api/MessageTypes', currentMessageType);
      } else {
        // 更新消息类型
        await axios.put(
          `/api/MessageTypes/${currentMessageType.code}/${currentMessageType.merchantId}`,
          {
            name: currentMessageType.name,
            remark: currentMessageType.remark
          }
        );
      }

      setOpenDialog(false);
      loadMessageTypes();
    } catch (error) {
      console.error('Error saving message type:', error);
      setDialogError(error.response?.data || '保存失败');
    } finally {
      setDialogLoading(false);
    }
  };

  // 打开删除确认对话框
  const openDeleteConfirmDialog = (messageType) => {
    setMessageTypeToDelete(messageType);
    setOpenDeleteDialog(true);
  };

  // 删除消息类型
  const deleteMessageType = async () => {
    if (!messageTypeToDelete) return;

    setDeleteLoading(true);
    try {
      await axios.delete(`/api/MessageTypes/${messageTypeToDelete.code}/${messageTypeToDelete.merchantId}`);
      setOpenDeleteDialog(false);
      loadMessageTypes();
    } catch (error) {
      console.error('Error deleting message type:', error);
      alert(error.response?.data || '删除失败');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        消息类型管理
      </Typography>

      {/* 筛选条件 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="商户ID"
              name="merchantId"
              value={filters.merchantId}
              onChange={handleFilterChange}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="类型代码"
              name="code"
              value={filters.code}
              onChange={handleFilterChange}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="类型名称"
              name="name"
              value={filters.name}
              onChange={handleFilterChange}
              size="small"
            />
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
              onClick={loadMessageTypes}
            >
              刷新
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* 操作按钮 */}
      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={openCreateDialog}
        >
          新建消息类型
        </Button>
      </Box>

      {/* 消息类型列表 */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>类型代码</TableCell>
                <TableCell>商户ID</TableCell>
                <TableCell>类型名称</TableCell>
                <TableCell>备注</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : messageTypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    没有找到消息类型
                  </TableCell>
                </TableRow>
              ) : (
                messageTypes.map((messageType) => (
                  <TableRow key={`${messageType.code}-${messageType.merchantId}`}>
                    <TableCell>{messageType.code}</TableCell>
                    <TableCell>{messageType.merchantId}</TableCell>
                    <TableCell>{messageType.name || '-'}</TableCell>
                    <TableCell>{messageType.remark || '-'}</TableCell>
                    <TableCell>
                      <Tooltip title="编辑">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => openEditDialog(messageType)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="删除">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => openDeleteConfirmDialog(messageType)}
                        >
                          <DeleteIcon fontSize="small" />
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

      {/* 创建/编辑对话框 */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' ? '新建消息类型' : '编辑消息类型'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="类型代码"
                  name="code"
                  value={currentMessageType.code}
                  onChange={handleDialogInputChange}
                  disabled={dialogMode === 'edit'}
                  required
                  error={!currentMessageType.code}
                  helperText={!currentMessageType.code ? '请输入类型代码' : ''}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="商户ID"
                  name="merchantId"
                  value={currentMessageType.merchantId}
                  onChange={handleDialogInputChange}
                  disabled={dialogMode === 'edit'}
                  required
                  error={!currentMessageType.merchantId}
                  helperText={!currentMessageType.merchantId ? '请输入商户ID' : ''}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="类型名称"
                  name="name"
                  value={currentMessageType.name}
                  onChange={handleDialogInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="备注"
                  name="remark"
                  value={currentMessageType.remark}
                  onChange={handleDialogInputChange}
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
            {dialogError && (
              <Typography color="error" sx={{ mt: 2 }}>
                {dialogError}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>取消</Button>
          <Button
            onClick={saveMessageType}
            variant="contained"
            color="primary"
            disabled={dialogLoading || !currentMessageType.code || !currentMessageType.merchantId}
          >
            {dialogLoading ? <CircularProgress size={24} /> : '保存'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <Typography>
            确定要删除消息类型 "{messageTypeToDelete?.code}" 吗？此操作不可撤销。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>取消</Button>
          <Button
            onClick={deleteMessageType}
            variant="contained"
            color="error"
            disabled={deleteLoading}
          >
            {deleteLoading ? <CircularProgress size={24} /> : '删除'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MessageTypeList;
