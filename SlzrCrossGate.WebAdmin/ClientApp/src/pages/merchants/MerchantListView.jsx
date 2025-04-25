import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
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
  CircularProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { merchantAPI } from '../../services/api';
import MerchantCreateDialog from './MerchantCreateDialog';

const MerchantListView = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [merchantToDelete, setMerchantToDelete] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // 加载商户数据
  const loadMerchants = async () => {
    try {
      setLoading(true);
      const response = await merchantAPI.getMerchants({
        search,
        page: page + 1, // API使用1-based索引
        pageSize
      });
      setMerchants(response.items);
      setTotalCount(response.totalCount);
    } catch (error) {
      enqueueSnackbar('加载商户列表失败', { variant: 'error' });
      console.error('加载商户列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 首次加载和依赖项变化时重新加载数据
  useEffect(() => {
    loadMerchants();
  }, [page, pageSize, search]);

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

  // 处理搜索输入框按回车
  const handleSearchKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  // 打开删除确认对话框
  const handleOpenDeleteDialog = (merchant) => {
    setMerchantToDelete(merchant);
    setDeleteDialogOpen(true);
  };

  // 关闭删除确认对话框
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setMerchantToDelete(null);
  };

  // 删除商户
  const handleDeleteMerchant = async () => {
    if (!merchantToDelete) return;

    try {
      await merchantAPI.deleteMerchant(merchantToDelete.merchantID);
      enqueueSnackbar('商户删除成功', { variant: 'success' });
      loadMerchants(); // 重新加载商户列表
    } catch (error) {
      enqueueSnackbar(`删除商户失败: ${error.message}`, { variant: 'error' });
    } finally {
      handleCloseDeleteDialog();
    }
  };

  // 激活/停用商户
  const handleToggleActive = async (merchant) => {
    try {
      if (merchant.isActive) {
        await merchantAPI.deactivateMerchant(merchant.merchantID);
        enqueueSnackbar('商户已停用', { variant: 'success' });
      } else {
        await merchantAPI.activateMerchant(merchant.merchantID);
        enqueueSnackbar('商户已激活', { variant: 'success' });
      }
      loadMerchants(); // 重新加载商户列表
    } catch (error) {
      enqueueSnackbar(`操作失败: ${error.message}`, { variant: 'error' });
    }
  };

  // 创建商户对话框
  const handleOpenCreateDialog = () => {
    setCreateDialogOpen(true);
  };

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
  };

  const handleMerchantCreated = () => {
    loadMerchants(); // 重新加载商户列表
    handleCloseCreateDialog();
  };

  return (
    <Container maxWidth={false}>
      <Box sx={{ pt: 3, pb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4">商户管理</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
          >
            添加商户
          </Button>
        </Box>

        {/* 搜索框 */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
          <TextField
            label="搜索商户"
            variant="outlined"
            size="small"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyPress}
            sx={{ mr: 2, flexGrow: 1 }}
            placeholder="输入商户ID、名称或联系人搜索"
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleSearch}
            startIcon={<SearchIcon />}
          >
            搜索
          </Button>
        </Box>

        {/* 商户列表 */}
        <Card>
          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow>
                  <TableCell>商户ID</TableCell>
                  <TableCell>商户名称</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>联系人</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>联系电话</TableCell>
                  <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>联系邮箱</TableCell>
                  <TableCell>状态</TableCell>
                  <TableCell align="right" sx={{ minWidth: 120 }}>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <CircularProgress size={24} sx={{ my: 2 }} />
                    </TableCell>
                  </TableRow>
                )}
                {!loading && merchants.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      没有找到商户
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  merchants.map((merchant) => (
                    <TableRow key={merchant.merchantID}>
                      <TableCell>{merchant.merchantID}</TableCell>
                      <TableCell>{merchant.name}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{merchant.contactName}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{merchant.contactPhone}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{merchant.contactEmail}</TableCell>
                      <TableCell>
                        {merchant.isActive ? (
                          <Chip label="激活" color="success" size="small" />
                        ) : (
                          <Chip label="停用" color="error" size="small" />
                        )}
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        <Tooltip title="编辑">
                          <IconButton
                            component={RouterLink}
                            to={`/app/merchants/${merchant.merchantID}`}
                            size="small"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={merchant.isActive ? "停用" : "激活"}>
                          <IconButton
                            onClick={() => handleToggleActive(merchant)}
                            size="small"
                            color={merchant.isActive ? "default" : "primary"}
                          >
                            {merchant.isActive ? (
                              <CancelIcon fontSize="small" />
                            ) : (
                              <CheckCircleIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="删除">
                          <IconButton
                            onClick={() => handleOpenDeleteDialog(merchant)}
                            size="small"
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
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
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} / ${count !== -1 ? count : `超过 ${to}`}`
            }
          />
        </Card>
      </Box>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            您确定要删除商户 "{merchantToDelete?.name}" ({merchantToDelete?.merchantID}) 吗？此操作不可撤销。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>取消</Button>
          <Button onClick={handleDeleteMerchant} color="error" autoFocus>
            删除
          </Button>
        </DialogActions>
      </Dialog>

      {/* 创建商户对话框 */}
      <MerchantCreateDialog
        open={createDialogOpen}
        onClose={handleCloseCreateDialog}
        onMerchantCreated={handleMerchantCreated}
      />
    </Container>
  );
};

export default MerchantListView;
