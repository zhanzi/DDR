import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  Container,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Tooltip,
  Paper,
  CircularProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { roleAPI } from '../../services/api';
import { useFormik } from 'formik';
import { parseErrorMessage } from '../../utils/errorHandler';
import * as Yup from 'yup';

const RoleListView = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // 加载角色数据
  const loadRoles = async () => {
    try {
      setLoading(true);
      const response = await roleAPI.getRoles();
      setRoles(response);
    } catch (error) {
      enqueueSnackbar('加载角色列表失败', { variant: 'error' });
      console.error('加载角色列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 首次加载数据
  useEffect(() => {
    loadRoles();
  }, []);

  // 打开删除确认对话框
  const handleOpenDeleteDialog = (role) => {
    setRoleToDelete(role);
    setDeleteDialogOpen(true);
  };

  // 关闭删除确认对话框
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setRoleToDelete(null);
  };

  // 删除角色
  const handleDeleteRole = async () => {
    if (!roleToDelete) return;

    try {
      await roleAPI.deleteRole(roleToDelete.id);
      enqueueSnackbar('角色删除成功', { variant: 'success' });
      loadRoles(); // 重新加载角色列表
    } catch (error) {
      console.error('删除角色失败:', error);
      const errorMessage = parseErrorMessage(error, '删除角色失败');
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      handleCloseDeleteDialog();
    }
  };

  // 创建角色表单
  const formik = useFormik({
    initialValues: {
      name: '',
      description: ''
    },
    validationSchema: Yup.object({
      name: Yup.string().required('角色名称是必填项'),
      description: Yup.string()
    }),
    onSubmit: async (values, { resetForm }) => {
      try {
        await roleAPI.createRole(values);
        enqueueSnackbar('角色创建成功', { variant: 'success' });
        resetForm();
        setCreateDialogOpen(false);
        loadRoles(); // 重新加载角色列表
      } catch (error) {
        console.error('创建角色失败:', error);
        const errorMessage = parseErrorMessage(error, '创建角色失败');
        enqueueSnackbar(errorMessage, { variant: 'error' });
      }
    }
  });

  return (
    <Container maxWidth={false}>
      <Box sx={{ pt: 3, pb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4">角色管理</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            添加角色
          </Button>
        </Box>

        {/* 角色列表 */}
        <Card>
          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 500 }}>
              <TableHead>
                <TableRow>
                  <TableCell>角色名称</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>描述</TableCell>
                  <TableCell>用户数</TableCell>
                  <TableCell align="right" sx={{ minWidth: 100 }}>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <CircularProgress size={24} sx={{ my: 2 }} />
                    </TableCell>
                  </TableRow>
                )}
                {!loading && roles.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      没有找到角色
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>{role.name}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{role.description}</TableCell>
                      <TableCell>{role.userCount || 0}</TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        <Tooltip title="编辑">
                          <IconButton
                            component={RouterLink}
                            to={`/app/roles/${role.id}`}
                            size="small"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {role.name === 'SystemAdmin' || role.name === 'MerchantAdmin' || role.name === 'User' ? (
                          // 对于禁用的按钮，使用span包装Tooltip，解决MUI警告
                          <Tooltip title="系统角色无法删除">
                            <span>
                              <IconButton
                                size="small"
                                color="error"
                                disabled={true}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        ) : (
                          // 正常的可点击按钮
                          <Tooltip title="删除">
                            <IconButton
                              onClick={() => handleOpenDeleteDialog(role)}
                              size="small"
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Box>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            您确定要删除角色 "{roleToDelete?.name}" 吗？此操作不可撤销。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>取消</Button>
          <Button onClick={handleDeleteRole} color="error" autoFocus>
            删除
          </Button>
        </DialogActions>
      </Dialog>

      {/* 创建角色对话框 */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>创建新角色</DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent>
            <TextField
              fullWidth
              margin="normal"
              label="角色名称"
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
              required
            />
            <TextField
              fullWidth
              margin="normal"
              label="描述"
              name="description"
              value={formik.values.description}
              onChange={formik.handleChange}
              error={formik.touched.description && Boolean(formik.errors.description)}
              helperText={formik.touched.description && formik.errors.description}
              multiline
              rows={3}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>取消</Button>
            <Button type="submit" color="primary" variant="contained">
              创建
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default RoleListView;
