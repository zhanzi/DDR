import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  Divider,
  Grid,
  TextField,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Paper,
  Chip
} from '@mui/material';
import {
  Save as SaveIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useSnackbar } from 'notistack';
import { roleAPI } from '../../services/api';

const RoleDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [role, setRole] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userPage, setUserPage] = useState(0);
  const [userPageSize, setUserPageSize] = useState(5);
  const [userTotalCount, setUserTotalCount] = useState(0);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // 加载角色数据
  useEffect(() => {
    const loadRole = async () => {
      try {
        setLoading(true);
        const roleData = await roleAPI.getRole(id);
        setRole(roleData);

        // 设置表单初始值
        formik.setValues({
          name: roleData.name || '',
          description: roleData.description || ''
        });
      } catch (error) {
        enqueueSnackbar('加载角色数据失败', { variant: 'error' });
        console.error('加载角色数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRole();
  }, [id, enqueueSnackbar]);

  // 加载角色用户
  const loadRoleUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await roleAPI.getUsersInRole(id, {
        page: userPage + 1, // API使用1-based索引
        pageSize: userPageSize
      });
      setUsers(response.items);
      setUserTotalCount(response.totalCount);
    } catch (error) {
      enqueueSnackbar('加载角色用户失败', { variant: 'error' });
      console.error('加载角色用户失败:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // 加载角色用户
  useEffect(() => {
    if (id) {
      loadRoleUsers();
    }
  }, [id, userPage, userPageSize]);

  // 表单验证和提交
  const formik = useFormik({
    initialValues: {
      name: '',
      description: ''
    },
    validationSchema: Yup.object({
      name: Yup.string().required('角色名称是必填项'),
      description: Yup.string()
    }),
    onSubmit: async (values) => {
      try {
        setSaving(true);
        await roleAPI.updateRole(id, values);
        enqueueSnackbar('角色信息更新成功', { variant: 'success' });
        // 重新加载角色数据
        const updatedRole = await roleAPI.getRole(id);
        setRole(updatedRole);
      } catch (error) {
        enqueueSnackbar(`更新角色失败: ${error.message}`, { variant: 'error' });
      } finally {
        setSaving(false);
      }
    }
  });

  // 处理删除角色
  const handleDeleteRole = async () => {
    try {
      setLoading(true);
      await roleAPI.deleteRole(id);
      enqueueSnackbar('角色删除成功', { variant: 'success' });
      navigate('/app/roles');
    } catch (error) {
      enqueueSnackbar(`删除角色失败: ${error.message}`, { variant: 'error' });
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  // 处理用户分页
  const handleChangeUserPage = (event, newPage) => {
    setUserPage(newPage);
  };

  const handleChangeUserPageSize = (event) => {
    setUserPageSize(parseInt(event.target.value, 10));
    setUserPage(0);
  };

  // 是否是系统角色
  const isSystemRole = role?.name === 'SystemAdmin' || role?.name === 'MerchantAdmin' || role?.name === 'User';

  if (loading && !role) {
    return (
      <Container maxWidth={false}>
        <Box sx={{ pt: 3, pb: 3, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth={false}>
      <Box sx={{ pt: 3, pb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/app/roles')}
          >
            返回角色列表
          </Button>
          {!isSystemRole && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setDeleteDialogOpen(true)}
              disabled={loading || saving}
            >
              删除角色
            </Button>
          )}
        </Box>

        <Typography variant="h4" sx={{ mb: 3 }}>
          角色详情
        </Typography>

        <form onSubmit={formik.handleSubmit}>
          <Card sx={{ mb: 3 }}>
            <CardHeader title="角色信息" />
            <Divider />
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="角色名称"
                    name="name"
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    error={formik.touched.name && Boolean(formik.errors.name)}
                    helperText={formik.touched.name && formik.errors.name}
                    disabled={loading || isSystemRole}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="描述"
                    name="description"
                    value={formik.values.description}
                    onChange={formik.handleChange}
                    error={formik.touched.description && Boolean(formik.errors.description)}
                    helperText={formik.touched.description && formik.errors.description}
                    disabled={loading || isSystemRole}
                    multiline
                    rows={3}
                  />
                </Grid>
              </Grid>
            </CardContent>
            <Divider />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
              <Button
                color="primary"
                variant="contained"
                type="submit"
                disabled={loading || saving || isSystemRole}
                startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
              >
                {saving ? '保存中...' : '保存'}
              </Button>
            </Box>
          </Card>
        </form>

        <Card>
          <CardHeader
            title="角色用户"
            avatar={<PersonIcon />}
            subheader={`共 ${userTotalCount} 个用户`}
          />
          <Divider />
          <CardContent>
            <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: 500 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>用户名</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>邮箱</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>真实姓名</TableCell>
                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>商户ID</TableCell>
                    <TableCell>状态</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingUsers && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <CircularProgress size={24} sx={{ my: 2 }} />
                      </TableCell>
                    </TableRow>
                  )}
                  {!loadingUsers && users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        没有找到用户
                      </TableCell>
                    </TableRow>
                  )}
                  {!loadingUsers &&
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.userName}</TableCell>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{user.email}</TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{user.realName}</TableCell>
                        <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{user.merchantId}</TableCell>
                        <TableCell>
                          {user.lockoutEnd && new Date(user.lockoutEnd) > new Date() ? (
                            <Chip label="已锁定" color="error" size="small" />
                          ) : (
                            <Chip label="正常" color="success" size="small" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={userTotalCount}
              page={userPage}
              onPageChange={handleChangeUserPage}
              rowsPerPage={userPageSize}
              onRowsPerPageChange={handleChangeUserPageSize}
              rowsPerPageOptions={[5, 10, 25]}
              labelRowsPerPage="每页行数:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} / ${count !== -1 ? count : `超过 ${to}`}`
              }
            />
          </CardContent>
        </Card>
      </Box>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            您确定要删除角色 "{role?.name}" 吗？此操作不可撤销。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={loading}>
            取消
          </Button>
          <Button onClick={handleDeleteRole} color="error" disabled={loading} autoFocus>
            {loading ? '删除中...' : '删除'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default RoleDetailView;
