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
  Paper
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Add as AddIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { userAPI } from '../../services/api';
import UserCreateDialog from './UserCreateDialog';

const UserListView = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // 加载用户数据
  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getUsers({
        search,
        page: page + 1, // API使用1-based索引
        pageSize
      });
      setUsers(response.items);
      setTotalCount(response.totalCount);
    } catch (error) {
      enqueueSnackbar('加载用户列表失败', { variant: 'error' });
      console.error('加载用户列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 首次加载和依赖项变化时重新加载数据
  useEffect(() => {
    loadUsers();
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
  const handleOpenDeleteDialog = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  // 关闭删除确认对话框
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  // 删除用户
  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await userAPI.deleteUser(userToDelete.id);
      enqueueSnackbar('用户删除成功', { variant: 'success' });
      loadUsers(); // 重新加载用户列表
    } catch (error) {
      enqueueSnackbar(`删除用户失败: ${error.message}`, { variant: 'error' });
    } finally {
      handleCloseDeleteDialog();
    }
  };

  // 锁定/解锁用户
  const handleToggleLock = async (user) => {
    try {
      if (user.lockoutEnd && new Date(user.lockoutEnd) > new Date()) {
        // 解锁用户
        await userAPI.unlockUser(user.id);
        enqueueSnackbar('用户已解锁', { variant: 'success' });
      } else {
        // 锁定用户
        await userAPI.lockUser(user.id, { lockoutEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }); // 锁定30天
        enqueueSnackbar('用户已锁定', { variant: 'success' });
      }
      loadUsers(); // 重新加载用户列表
    } catch (error) {
      enqueueSnackbar(`操作失败: ${error.message}`, { variant: 'error' });
    }
  };

  // 创建用户对话框
  const handleOpenCreateDialog = () => {
    setCreateDialogOpen(true);
  };

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
  };

  const handleUserCreated = () => {
    loadUsers(); // 重新加载用户列表
    handleCloseCreateDialog();
  };

  // 渲染角色标签
  const renderRoles = (roles) => {
    if (!roles || roles.length === 0) return null;

    return roles.map((role) => {
      let color = 'default';
      if (role === 'SystemAdmin') color = 'error';
      else if (role === 'MerchantAdmin') color = 'primary';
      else if (role === 'User') color = 'success';

      return (
        <Chip
          key={role}
          label={role}
          color={color}
          size="small"
          sx={{ mr: 0.5, mb: 0.5 }}
        />
      );
    });
  };

  return (
    <Container maxWidth={false}>
      <Box sx={{ pt: 3, pb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4">用户管理</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
          >
            添加用户
          </Button>
        </Box>

        {/* 搜索框 */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
          <TextField
            label="搜索用户"
            variant="outlined"
            size="small"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleSearchKeyPress}
            sx={{ mr: 2, flexGrow: 1 }}
            placeholder="输入用户名、邮箱或真实姓名搜索"
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

        {/* 用户列表 */}
        <Card>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>用户名</TableCell>
                  <TableCell>邮箱</TableCell>
                  <TableCell>真实姓名</TableCell>
                  <TableCell>商户ID</TableCell>
                  <TableCell>角色</TableCell>
                  <TableCell>状态</TableCell>
                  <TableCell align="right">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      加载中...
                    </TableCell>
                  </TableRow>
                )}
                {!loading && users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      没有找到用户
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.userName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.realName}</TableCell>
                      <TableCell>{user.merchantId}</TableCell>
                      <TableCell>{renderRoles(user.roles)}</TableCell>
                      <TableCell>
                        {user.lockoutEnd && new Date(user.lockoutEnd) > new Date() ? (
                          <Chip label="已锁定" color="error" size="small" />
                        ) : (
                          <Chip label="正常" color="success" size="small" />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="编辑">
                          <IconButton
                            component={RouterLink}
                            to={`/app/users/${user.id}`}
                            size="small"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={user.lockoutEnd && new Date(user.lockoutEnd) > new Date() ? "解锁" : "锁定"}>
                          <IconButton
                            onClick={() => handleToggleLock(user)}
                            size="small"
                            color={user.lockoutEnd && new Date(user.lockoutEnd) > new Date() ? "primary" : "default"}
                          >
                            {user.lockoutEnd && new Date(user.lockoutEnd) > new Date() ? (
                              <LockOpenIcon fontSize="small" />
                            ) : (
                              <LockIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="删除">
                          <IconButton
                            onClick={() => handleOpenDeleteDialog(user)}
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
            您确定要删除用户 "{userToDelete?.userName}" 吗？此操作不可撤销。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>取消</Button>
          <Button onClick={handleDeleteUser} color="error" autoFocus>
            删除
          </Button>
        </DialogActions>
      </Dialog>

      {/* 创建用户对话框 */}
      <UserCreateDialog
        open={createDialogOpen}
        onClose={handleCloseCreateDialog}
        onUserCreated={handleUserCreated}
      />
    </Container>
  );
};

export default UserListView;
