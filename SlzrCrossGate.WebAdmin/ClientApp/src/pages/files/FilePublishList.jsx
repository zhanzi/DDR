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
  Tabs,
  Tab
} from '@mui/material';
import {
  ChevronRight as ChevronRight,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Delete as DeleteIcon,
  CloudDownload as CloudDownloadIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { fileAPI } from '../../services/api';
import { format } from 'date-fns';

const FilePublishList = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0); // 0: 当前发布, 1: 发布历史
  const [filePublishes, setFilePublishes] = useState([]);
  const [fileTypes, setFileTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // 筛选条件
  const [filters, setFilters] = useState({
    merchantId: '',
    fileTypeId: '',
    filePara: '',
    publishType: '',
    publishTarget: ''
  });

  // 删除确认对话框
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [filePublishToDelete, setFilePublishToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // 加载文件发布列表
  const loadFilePublishes = async () => {
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

      let response;
      if (tabValue === 0) {
        // 当前发布
        response = await fileAPI.getFilePublishes(params);
      } else {
        // 发布历史
        response = await fileAPI.getFilePublishHistory(params);
      }

      setFilePublishes(response.items);
      setTotalCount(response.totalCount);
    } catch (error) {
      console.error('Error loading file publishes:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载文件类型列表
  const loadFileTypes = async () => {
    try {
      const response = await fileAPI.getFileTypes();
      setFileTypes(response.items);
    } catch (error) {
      console.error('Error loading file types:', error);
    }
  };

  useEffect(() => {
    loadFilePublishes();
    loadFileTypes();
  }, [page, rowsPerPage, tabValue]);

  // 处理筛选条件变更
  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // 应用筛选
  const applyFilters = () => {
    setPage(0);
    loadFilePublishes();
  };

  // 清除筛选
  const clearFilters = () => {
    setFilters({
      merchantId: '',
      fileTypeId: '',
      filePara: '',
      publishType: '',
      publishTarget: ''
    });
    setPage(0);
    loadFilePublishes();
  };

  // 处理分页变更
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 处理标签页变更
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setPage(0);
  };

  // 打开删除确认对话框
  const openDeleteConfirmDialog = (filePublish) => {
    setFilePublishToDelete(filePublish);
    setOpenDeleteDialog(true);
  };

  // 删除文件发布
  const deleteFilePublish = async () => {
    if (!filePublishToDelete) return;

    setDeleteLoading(true);
    try {
      await fileAPI.deleteFilePublish(filePublishToDelete.id);
      setOpenDeleteDialog(false);
      loadFilePublishes();
    } catch (error) {
      console.error('Error deleting file publish:', error);
      alert(error.response?.data || '删除失败');
    } finally {
      setDeleteLoading(false);
    }
  };

  // 下载文件
  const downloadFile = (filePublish) => {
    window.open(`/api/file-versions/${filePublish.id}/download`, '_blank');
  };

  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 获取发布类型显示
  const getPublishTypeChip = (type) => {
    switch (type) {
      case 1: // Merchant
        return <Chip label="商户级别" color="primary" size="small" />;
      case 2: // Line
        return <Chip label="线路级别" color="secondary" size="small" />;
      case 3: // Terminal
        return <Chip label="终端级别" color="success" size="small" />;
      default:
        return <Chip label="未知" color="default" size="small" />;
    }
  };

  // 获取操作类型显示
  const getOperationTypeChip = (type) => {
    switch (type) {
      case "Publish":
        return <Chip label="发布" color="success" size="small" />;
      case "Revoke":
        return <Chip label="撤销" color="error" size="small" />;
      default:
        return <Chip label={type || "未知"} color="default" size="small" />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
        文件发布管理
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ChevronRight />}
          onClick={() => navigate('/app/files/versions')}
        >
          文件版本管理
        </Button>
      </Box>

      {/* 标签页 */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="当前发布" />
          <Tab label="发布历史" />
        </Tabs>
      </Paper>

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
              label="文件类型"
              name="fileTypeId"
              value={filters.fileTypeId}
              onChange={handleFilterChange}
              size="small"
              select
            >
              <MenuItem value="">全部</MenuItem>
              {fileTypes.map((type) => (
                <MenuItem key={`${type.code}-${type.merchantId}`} value={type.code}>
                  {type.code} - {type.name || '未命名'}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="文件参数"
              name="filePara"
              value={filters.filePara}
              onChange={handleFilterChange}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="发布类型"
              name="publishType"
              value={filters.publishType}
              onChange={handleFilterChange}
              size="small"
              select
            >
              <MenuItem value="">全部</MenuItem>
              <MenuItem value="1">商户级别</MenuItem>
              <MenuItem value="2">线路级别</MenuItem>
              <MenuItem value="3">终端级别</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="发布目标"
              name="publishTarget"
              value={filters.publishTarget}
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
        </Grid>
      </Paper>

      {/* 操作按钮 */}
      <Box sx={{ mb: 2 }}>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<RefreshIcon />}
          onClick={loadFilePublishes}
        >
          刷新
        </Button>
      </Box>

      {/* 文件发布列表 */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>商户ID</TableCell>
                <TableCell>文件类型</TableCell>
                <TableCell>文件参数</TableCell>
                <TableCell>版本号</TableCell>
                <TableCell>文件大小</TableCell>
                <TableCell>发布类型</TableCell>
                <TableCell>发布目标</TableCell>
                <TableCell>发布时间</TableCell>
                <TableCell>操作人</TableCell>
                {tabValue === 1 && <TableCell>操作类型</TableCell>}
                {tabValue === 0 && <TableCell>操作</TableCell>}
                {tabValue === 1 && <TableCell>备注</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={tabValue === 0 ? 11 : 11} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : filePublishes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={tabValue === 0 ? 11 : 11} align="center">
                    没有找到文件发布记录
                  </TableCell>
                </TableRow>
              ) : (
                filePublishes.map((filePublish) => (
                  <TableRow key={filePublish.id}>
                    <TableCell>{filePublish.id}</TableCell>
                    <TableCell>
                    <Tooltip title={filePublish.merchantID || ''}>
                        <span>{filePublish.merchantName}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      {filePublish.fileTypeName}({filePublish.fileTypeID})
                    </TableCell>
                    <TableCell>{filePublish.filePara}</TableCell>
                    <TableCell>{filePublish.ver}</TableCell>
                    <TableCell>{formatFileSize(filePublish.fileSize)}</TableCell>
                    <TableCell>{getPublishTypeChip(filePublish.publishType)}</TableCell>
                    <TableCell>{filePublish.publishTarget || '-'}</TableCell>
                    <TableCell>{format(new Date(filePublish.publishTime), 'yyyy-MM-dd HH:mm:ss')}</TableCell>
                    <TableCell>{filePublish.operator || '-'}</TableCell>
                    {tabValue === 1 && (
                      <TableCell>{getOperationTypeChip(filePublish.operationType)}</TableCell>
                    )}
                    {tabValue === 0 && (
                      <TableCell>
                        <Tooltip title="下载">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => downloadFile(filePublish)}
                          >
                            <CloudDownloadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="删除">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => openDeleteConfirmDialog(filePublish)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    )}
                    {tabValue === 1 && (
                      <TableCell>{filePublish.remark || '-'}</TableCell>
                    )}
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

      {/* 删除确认对话框 */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>确认取消发布</DialogTitle>
        <DialogContent>
          <Typography>
            确定要取消发布文件 "{filePublishToDelete?.fileFullType} - {filePublishToDelete?.ver}" 吗？此操作不可撤销。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>取消</Button>
          <Button
            onClick={deleteFilePublish}
            variant="contained"
            color="error"
            disabled={deleteLoading}
          >
            {deleteLoading ? <CircularProgress size={24} /> : '确认取消发布'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FilePublishList;
