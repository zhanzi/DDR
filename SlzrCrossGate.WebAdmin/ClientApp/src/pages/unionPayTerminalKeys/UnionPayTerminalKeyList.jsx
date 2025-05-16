import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  Container,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Tooltip,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  InputAdornment
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  CloudUpload as CloudUploadIcon,
  CloudDownload as CloudDownloadIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { unionPayTerminalKeyAPI } from '../../services/api';
import MerchantAutocomplete from '../../components/MerchantAutocomplete';
import UnionPayTerminalKeyCreate from './UnionPayTerminalKeyCreate';
import UnionPayTerminalKeyEdit from './UnionPayTerminalKeyEdit';
import UnionPayTerminalKeyImport from './UnionPayTerminalKeyImport';

const UnionPayTerminalKeyList = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [keyToEdit, setKeyToEdit] = useState(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // 搜索和筛选条件
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [isInUse, setIsInUse] = useState(null);
  const [sortBy, setSortBy] = useState('CreatedAt');
  const [sortDirection, setSortDirection] = useState('desc');

  // 加载银联终端密钥数据
  const loadKeys = async () => {
    try {
      setLoading(true);
      
      // 构建查询参数
      const params = {
        page: page + 1, // API使用1-based索引
        pageSize,
        sortBy,
        sortDirection
      };
      
      // 添加搜索参数
      if (search) {
        params.search = search;
      }
      
      // 添加商户ID参数
      if (selectedMerchant) {
        params.merchantId = selectedMerchant.merchantID;
      }
      
      // 添加是否使用状态参数
      if (isInUse !== null) {
        params.isInUse = isInUse;
      }
      
      const response = await unionPayTerminalKeyAPI.getUnionPayTerminalKeys(params);
      setKeys(response.items);
      setTotalCount(response.totalCount);
    } catch (error) {
      enqueueSnackbar('加载银联终端密钥列表失败', { variant: 'error' });
      console.error('加载银联终端密钥列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 首次加载和依赖项变化时重新加载数据
  useEffect(() => {
    loadKeys();
  }, [page, pageSize, search, selectedMerchant, isInUse, sortBy, sortDirection]);

  // 处理页码变化
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // 处理每页条数变化
  const handleChangePageSize = (event) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 处理搜索
  const handleSearch = () => {
    setSearch(searchInput);
    setPage(0);
  };

  // 处理回车键搜索
  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  // 处理商户选择变化
  const handleMerchantChange = (event, newValue) => {
    setSelectedMerchant(newValue);
    setPage(0);
  };

  // 处理使用状态筛选变化
  const handleIsInUseChange = (event) => {
    const value = event.target.value;
    setIsInUse(value === 'all' ? null : value === 'true');
    setPage(0);
  };

  // 处理排序变化
  const handleSortChange = (event) => {
    setSortBy(event.target.value);
    setPage(0);
  };

  // 处理排序方向变化
  const handleSortDirectionChange = (event) => {
    setSortDirection(event.target.value);
    setPage(0);
  };

  // 刷新列表
  const handleRefresh = () => {
    loadKeys();
  };

  // 打开删除确认对话框
  const handleOpenDeleteDialog = (key) => {
    setKeyToDelete(key);
    setDeleteDialogOpen(true);
  };

  // 关闭删除确认对话框
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setKeyToDelete(null);
  };

  // 删除银联终端密钥
  const handleDeleteKey = async () => {
    if (!keyToDelete) return;
    
    try {
      await unionPayTerminalKeyAPI.deleteUnionPayTerminalKey(keyToDelete.id);
      enqueueSnackbar('银联终端密钥删除成功', { variant: 'success' });
      loadKeys(); // 重新加载列表
    } catch (error) {
      let errorMsg = '删除银联终端密钥失败';
      if (error.response && error.response.data && error.response.data.message) {
        errorMsg = error.response.data.message;
      }
      enqueueSnackbar(errorMsg, { variant: 'error' });
    } finally {
      handleCloseDeleteDialog();
    }
  };

  // 打开创建对话框
  const handleOpenCreateDialog = () => {
    setCreateDialogOpen(true);
  };

  // 关闭创建对话框
  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
  };

  // 打开编辑对话框
  const handleOpenEditDialog = (key) => {
    setKeyToEdit(key);
    setEditDialogOpen(true);
  };

  // 关闭编辑对话框
  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setKeyToEdit(null);
  };

  // 处理创建和编辑成功
  const handleSuccess = () => {
    loadKeys(); // 重新加载列表
  };

  // 打开导入对话框
  const handleOpenImportDialog = () => {
    setImportDialogOpen(true);
  };

  // 关闭导入对话框
  const handleCloseImportDialog = () => {
    setImportDialogOpen(false);
  };

  // 下载导入模板
  const handleDownloadTemplate = async () => {
    try {
      const response = await unionPayTerminalKeyAPI.downloadTemplate();
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `银联终端密钥导入模板_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      enqueueSnackbar('导入模板下载成功', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('导入模板下载失败', { variant: 'error' });
    }
  };

  // 导入成功回调
  const handleImportSuccess = () => {
    loadKeys(); // 重新加载列表
    handleCloseImportDialog();
  };

  // 清空筛选条件
  const handleClearFilters = () => {
    setSearchInput('');
    setSearch('');
    setSelectedMerchant(null);
    setIsInUse(null);
    setSortBy('CreatedAt');
    setSortDirection('desc');
    setPage(0);
  };

  return (
    <Container maxWidth={false}>
      <Box sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            银联终端密钥管理
          </Typography>
          <Box>
            <Button
              variant="contained"
              onClick={handleOpenCreateDialog}
              startIcon={<AddIcon />}
              sx={{ mr: 1 }}
            >
              新增密钥
            </Button>
            <Button
              variant="outlined"
              onClick={handleOpenImportDialog}
              startIcon={<CloudUploadIcon />}
              sx={{ mr: 1 }}
            >
              批量导入
            </Button>
            <Button
              variant="outlined"
              onClick={handleDownloadTemplate}
              startIcon={<CloudDownloadIcon />}
            >
              下载模板
            </Button>
          </Box>
        </Box>

        {/* 搜索和筛选 */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4} md={3}>
              <TextField
                fullWidth
                label="搜索"
                variant="outlined"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="银联商户号/终端号/密钥/设备ID等"
                size="small"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleSearch} edge="end">
                        <SearchIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4} md={3}>
              <MerchantAutocomplete
                value={selectedMerchant}
                onChange={handleMerchantChange}
                size="small"
                sx={{ minWidth: '100%' }}
              />
            </Grid>
            <Grid item xs={12} sm={4} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel id="is-in-use-label">使用状态</InputLabel>
                <Select
                  labelId="is-in-use-label"
                  value={isInUse === null ? 'all' : isInUse.toString()}
                  label="使用状态"
                  onChange={handleIsInUseChange}
                >
                  <MenuItem value="all">全部</MenuItem>
                  <MenuItem value="true">已使用</MenuItem>
                  <MenuItem value="false">未使用</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel id="sort-by-label">排序字段</InputLabel>
                <Select
                  labelId="sort-by-label"
                  value={sortBy}
                  label="排序字段"
                  onChange={handleSortChange}
                >
                  <MenuItem value="CreatedAt">创建时间</MenuItem>
                  <MenuItem value="UpdatedAt">更新时间</MenuItem>
                  <MenuItem value="MerchantID">商户ID</MenuItem>
                  <MenuItem value="IsInUse">使用状态</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel id="sort-direction-label">排序方向</InputLabel>
                <Select
                  labelId="sort-direction-label"
                  value={sortDirection}
                  label="排序方向"
                  onChange={handleSortDirectionChange}
                >
                  <MenuItem value="asc">升序</MenuItem>
                  <MenuItem value="desc">降序</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box display="flex" justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleClearFilters}
                  startIcon={<FilterListIcon />}
                  sx={{ mr: 1 }}
                >
                  清空筛选
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleRefresh}
                  startIcon={<RefreshIcon />}
                >
                  刷新
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* 银联终端密钥列表 */}
        <Card>
          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow>
                  <TableCell>商户ID</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>银联商户号</TableCell>
                  <TableCell>银联终端号</TableCell>
                  <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>银联终端密钥</TableCell>
                  <TableCell sx={{ display: { xs: 'none', xl: 'table-cell' } }}>银联商户名称</TableCell>
                  <TableCell>使用状态</TableCell>
                  <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>设备信息</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>创建时间</TableCell>
                  <TableCell align="right" sx={{ minWidth: 120 }}>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      加载中...
                    </TableCell>
                  </TableRow>
                )}
                {!loading && keys.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      没有找到银联终端密钥
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  keys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell title={key.merchantName || ''}>{key.merchantID}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{key.uP_MerchantID}</TableCell>
                      <TableCell>{key.uP_TerminalID}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{key.uP_Key}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', xl: 'table-cell' } }}>{key.uP_MerchantName}</TableCell>
                      <TableCell>
                        {key.isInUse ? (
                          <Chip label="已使用" color="secondary" size="small" />
                        ) : (
                          <Chip label="未使用" color="success" size="small" />
                        )}
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                        {key.isInUse ? (
                          <>
                            设备ID: {key.machineID}<br />
                            线路ID: {key.lineID}<br />
                            设备编号: {key.machineNO}
                          </>
                        ) : (
                          '未绑定设备'
                        )}
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        {new Date(key.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="编辑">
                          <span>
                            <IconButton 
                              color="primary" 
                              onClick={() => handleOpenEditDialog(key)}
                              disabled={key.isInUse} // 已使用的不能编辑
                            >
                              <EditIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="删除">
                          <span>
                            <IconButton 
                              color="error" 
                              onClick={() => handleOpenDeleteDialog(key)}
                              disabled={key.isInUse} // 已使用的不能删除
                            >
                              <DeleteIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={pageSize}
            onRowsPerPageChange={handleChangePageSize}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage="每页行数:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} 共 ${count !== -1 ? count : `超过 ${to}`}`}
          />
        </Card>
      </Box>

      {/* 删除确认对话框 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            确定要删除银联终端号为 {keyToDelete?.up_TerminalID} 的银联终端密钥吗？此操作不可逆。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">
            取消
          </Button>
          <Button onClick={handleDeleteKey} color="error">
            删除
          </Button>
        </DialogActions>
      </Dialog>

      {/* 创建银联终端密钥对话框 */}
      {createDialogOpen && (
        <UnionPayTerminalKeyCreate
          open={createDialogOpen}
          onClose={handleCloseCreateDialog}
          onSuccess={handleSuccess}
        />
      )}

      {/* 编辑银联终端密钥对话框 */}
      {editDialogOpen && keyToEdit && (
        <UnionPayTerminalKeyEdit
          open={editDialogOpen}
          onClose={handleCloseEditDialog}
          onSuccess={handleSuccess}
          keyData={keyToEdit}
        />
      )}

      {/* 导入银联终端密钥对话框 */}
      {importDialogOpen && (
        <UnionPayTerminalKeyImport
          open={importDialogOpen}
          onClose={handleCloseImportDialog}
          onSuccess={handleImportSuccess}
        />
      )}
    </Container>
  );
};

export default UnionPayTerminalKeyList;
