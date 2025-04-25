import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Container,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  FormHelperText,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Paper,
  Tabs,
  Tab
} from '@mui/material';
import {
  Save as SaveIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useSnackbar } from 'notistack';
import { userAPI, roleAPI, merchantAPI, authAPI } from '../../services/api';

const UserDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  // 加载用户数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [userResponse, rolesResponse, merchantsResponse] = await Promise.all([
          userAPI.getUser(id),
          roleAPI.getRoles(),
          merchantAPI.getMerchants({ pageSize: 100 })
        ]);
        setUser(userResponse);
        setRoles(rolesResponse);
        setMerchants(merchantsResponse.items);

        // 设置表单初始值
        formik.setValues({
          userName: userResponse.userName || '',
          email: userResponse.email || '',
          realName: userResponse.realName || '',
          merchantId: userResponse.merchantId || '',
          roles: userResponse.roles || [],
          emailConfirmed: userResponse.emailConfirmed || false
        });
      } catch (error) {
        enqueueSnackbar('加载用户数据失败', { variant: 'error' });
        console.error('加载用户数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, enqueueSnackbar]);

  // 表单验证和提交
  const formik = useFormik({
    initialValues: {
      userName: '',
      email: '',
      realName: '',
      merchantId: '',
      roles: [],
      emailConfirmed: false
    },
    validationSchema: Yup.object({
      userName: Yup.string().required('用户名是必填项'),
      email: Yup.string().email('无效的邮箱格式').required('邮箱是必填项'),
      realName: Yup.string().required('真实姓名是必填项'),
      roles: Yup.array().min(1, '至少选择一个角色')
    }),
    onSubmit: async (values) => {
      try {
        setSaving(true);
        await userAPI.updateUser(id, values);
        enqueueSnackbar('用户信息更新成功', { variant: 'success' });
        // 重新加载用户数据
        const updatedUser = await userAPI.getUser(id);
        setUser(updatedUser);
      } catch (error) {
        enqueueSnackbar(`更新用户失败: ${error.message}`, { variant: 'error' });
      } finally {
        setSaving(false);
      }
    }
  });

  // 密码表单验证和提交
  const passwordFormik = useFormik({
    initialValues: {
      newPassword: '',
      confirmPassword: ''
    },
    validationSchema: Yup.object({
      newPassword: Yup.string()
        .min(6, '密码至少6个字符')
        .required('新密码是必填项'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('newPassword'), null], '两次输入的密码不匹配')
        .required('确认密码是必填项')
    }),
    onSubmit: async (values) => {
      try {
        setSaving(true);
        // 获取用户信息，用于重置密码
        const userData = await userAPI.getUser(id);

        // 使用resetPassword接口重置密码
        await authAPI.resetPassword({
          email: userData.email,
          password: values.newPassword,
          token: 'admin-reset' // 管理员重置密码的特殊标记
        });

        enqueueSnackbar('密码重置成功', { variant: 'success' });
        passwordFormik.resetForm();
        setPasswordDialogOpen(false);
      } catch (error) {
        enqueueSnackbar(`重置密码失败: ${error.response?.data?.message || error.message}`, { variant: 'error' });
      } finally {
        setSaving(false);
      }
    }
  });

  // 处理删除用户
  const handleDeleteUser = async () => {
    try {
      setLoading(true);
      await userAPI.deleteUser(id);
      enqueueSnackbar('用户删除成功', { variant: 'success' });
      navigate('/app/users');
    } catch (error) {
      enqueueSnackbar(`删除用户失败: ${error.message}`, { variant: 'error' });
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  // 处理锁定/解锁用户
  const handleToggleLock = async () => {
    try {
      setLoading(true);
      if (user.lockoutEnd && new Date(user.lockoutEnd) > new Date()) {
        // 解锁用户
        await userAPI.unlockUser(id);
        enqueueSnackbar('用户已解锁', { variant: 'success' });
      } else {
        // 锁定用户
        await userAPI.lockUser(id, { lockoutEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }); // 锁定30天
        enqueueSnackbar('用户已锁定', { variant: 'success' });
      }
      // 重新加载用户数据
      const updatedUser = await userAPI.getUser(id);
      setUser(updatedUser);
    } catch (error) {
      enqueueSnackbar(`操作失败: ${error.message}`, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // 处理标签页切换
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
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

  if (loading && !user) {
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
            onClick={() => navigate('/app/users')}
          >
            返回用户列表
          </Button>
          <Box>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={user?.lockoutEnd && new Date(user.lockoutEnd) > new Date() ? <LockOpenIcon /> : <LockIcon />}
              onClick={handleToggleLock}
              sx={{
                mr: 1,
                color: user?.lockoutEnd && new Date(user.lockoutEnd) > new Date() ? "#3B82F6" : "inherit"
              }}
              disabled={loading || saving}
            >
              {user?.lockoutEnd && new Date(user.lockoutEnd) > new Date() ? '解锁用户' : '锁定用户'}
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setDeleteDialogOpen(true)}
              disabled={loading || saving}
            >
              删除用户
            </Button>
          </Box>
        </Box>

        <Typography variant="h4" sx={{ mb: 3 }}>
          用户详情
        </Typography>

        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab label="基本信息" />
            <Tab label="安全设置" />
          </Tabs>
        </Paper>

        {tabValue === 0 && (
          <form onSubmit={formik.handleSubmit}>
            <Card>
              <CardHeader title="用户信息" />
              <Divider />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="用户名"
                      name="userName"
                      value={formik.values.userName}
                      onChange={formik.handleChange}
                      error={formik.touched.userName && Boolean(formik.errors.userName)}
                      helperText={formik.touched.userName && formik.errors.userName}
                      disabled={loading}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="邮箱"
                      name="email"
                      type="email"
                      value={formik.values.email}
                      onChange={formik.handleChange}
                      error={formik.touched.email && Boolean(formik.errors.email)}
                      helperText={formik.touched.email && formik.errors.email}
                      disabled={loading}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="真实姓名"
                      name="realName"
                      value={formik.values.realName}
                      onChange={formik.handleChange}
                      error={formik.touched.realName && Boolean(formik.errors.realName)}
                      helperText={formik.touched.realName && formik.errors.realName}
                      disabled={loading}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl
                      fullWidth
                      error={formik.touched.merchantId && Boolean(formik.errors.merchantId)}
                      disabled={loading}
                    >
                      <InputLabel>商户</InputLabel>
                      <Select
                        name="merchantId"
                        value={formik.values.merchantId}
                        onChange={formik.handleChange}
                        label="商户"
                      >
                        <MenuItem value="">
                          <em>无</em>
                        </MenuItem>
                        {merchants.map((merchant) => (
                          <MenuItem key={merchant.merchantID} value={merchant.merchantID}>
                            {merchant.name} ({merchant.merchantID})
                          </MenuItem>
                        ))}
                      </Select>
                      {formik.touched.merchantId && formik.errors.merchantId && (
                        <FormHelperText>{formik.errors.merchantId}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl
                      fullWidth
                      error={formik.touched.roles && Boolean(formik.errors.roles)}
                      disabled={loading}
                      required
                    >
                      <InputLabel>角色</InputLabel>
                      <Select
                        name="roles"
                        multiple
                        value={formik.values.roles}
                        onChange={formik.handleChange}
                        label="角色"
                      >
                        {roles.map((role) => (
                          <MenuItem key={role.id} value={role.name}>
                            {role.name}
                          </MenuItem>
                        ))}
                      </Select>
                      {formik.touched.roles && formik.errors.roles && (
                        <FormHelperText>{formik.errors.roles}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
                <Button
                  color="primary"
                  variant="contained"
                  type="submit"
                  disabled={loading || saving}
                  startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                >
                  {saving ? '保存中...' : '保存'}
                </Button>
              </Box>
            </Card>
          </form>
        )}

        {tabValue === 1 && (
          <Card>
            <CardHeader title="安全设置" />
            <Divider />
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1">密码管理</Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    修改用户密码
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={() => setPasswordDialogOpen(true)}
                    disabled={loading || saving}
                  >
                    修改密码
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1">账户状态</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="body2" color="textSecondary" component="span" sx={{ mr: 1 }}>
                      当前状态:
                    </Typography>
                    {user?.lockoutEnd && new Date(user.lockoutEnd) > new Date() ? (
                      <Chip label="已锁定" color="error" size="small" />
                    ) : (
                      <Chip label="正常" color="success" size="small" />
                    )}
                  </Box>
                  <Button
                    variant="outlined"
                    color="inherit"
                    startIcon={user?.lockoutEnd && new Date(user.lockoutEnd) > new Date() ? <LockOpenIcon /> : <LockIcon />}
                    onClick={handleToggleLock}
                    sx={{
                      color: user?.lockoutEnd && new Date(user.lockoutEnd) > new Date() ? "#3B82F6" : "inherit"
                    }}
                    disabled={loading || saving}
                  >
                    {user?.lockoutEnd && new Date(user.lockoutEnd) > new Date() ? '解锁用户' : '锁定用户'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            您确定要删除用户 "{user?.userName}" 吗？此操作不可撤销。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={loading}>
            取消
          </Button>
          <Button onClick={handleDeleteUser} color="error" disabled={loading} autoFocus>
            {loading ? '删除中...' : '删除'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 修改密码对话框 */}
      <Dialog open={passwordDialogOpen} onClose={() => !saving && setPasswordDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>修改密码</DialogTitle>
        <form onSubmit={passwordFormik.handleSubmit}>
          <DialogContent>
            <TextField
              fullWidth
              margin="normal"
              label="新密码"
              name="newPassword"
              type="password"
              value={passwordFormik.values.newPassword}
              onChange={passwordFormik.handleChange}
              error={passwordFormik.touched.newPassword && Boolean(passwordFormik.errors.newPassword)}
              helperText={passwordFormik.touched.newPassword && passwordFormik.errors.newPassword}
              disabled={saving}
              required
            />
            <TextField
              fullWidth
              margin="normal"
              label="确认密码"
              name="confirmPassword"
              type="password"
              value={passwordFormik.values.confirmPassword}
              onChange={passwordFormik.handleChange}
              error={passwordFormik.touched.confirmPassword && Boolean(passwordFormik.errors.confirmPassword)}
              helperText={passwordFormik.touched.confirmPassword && passwordFormik.errors.confirmPassword}
              disabled={saving}
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPasswordDialogOpen(false)} disabled={saving}>
              取消
            </Button>
            <Button
              type="submit"
              color="primary"
              disabled={saving}
              startIcon={saving && <CircularProgress size={20} />}
            >
              {saving ? '保存中...' : '保存'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default UserDetailView;
