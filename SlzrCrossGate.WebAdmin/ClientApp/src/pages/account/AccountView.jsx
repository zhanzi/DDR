import React, { useState, useEffect } from 'react';
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
  Paper,
  Tabs,
  Tab,
  Avatar
} from '@mui/material';
import {
  Save as SaveIcon,
  Lock as LockIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI } from '../../services/api';
import WechatBindingSection from './WechatBindingSection';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`account-tabpanel-${index}`}
      aria-labelledby={`account-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const AccountView = () => {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [userData, setUserData] = useState(null);

  // 加载用户数据
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const response = await userAPI.getUser(user.sub);
        setUserData(response);

        // 设置表单初始值
        formik.setValues({
          userName: response.userName || '',
          email: response.email || '',
          realName: response.realName || '',
        });
      } catch (error) {
        enqueueSnackbar('加载用户数据失败', { variant: 'error' });
        console.error('加载用户数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user, enqueueSnackbar]);

  // 个人信息表单
  const formik = useFormik({
    initialValues: {
      userName: '',
      email: '',
      realName: '',
    },
    validationSchema: Yup.object({
      userName: Yup.string().required('用户名是必填项'),
      email: Yup.string().email('无效的邮箱格式').required('邮箱是必填项'),
      realName: Yup.string().required('真实姓名是必填项'),
    }),
    onSubmit: async (values) => {
      try {
        setSaving(true);
        await userAPI.updateUser(user.sub, {
          email: values.email,
          realName: values.realName,
        });
        enqueueSnackbar('个人信息更新成功', { variant: 'success' });

        // 重新加载用户数据
        const updatedUser = await userAPI.getUser(user.sub);
        setUserData(updatedUser);
      } catch (error) {
        enqueueSnackbar(`更新个人信息失败: ${error.message}`, { variant: 'error' });
      } finally {
        setSaving(false);
      }
    }
  });

  // 密码表单
  const passwordFormik = useFormik({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validationSchema: Yup.object({
      currentPassword: Yup.string().required('当前密码是必填项'),
      newPassword: Yup.string()
        .min(6, '密码至少6个字符')
        .required('新密码是必填项'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('newPassword'), null], '两次输入的密码不匹配')
        .required('确认密码是必填项'),
    }),
    onSubmit: async (values) => {
      try {
        setSaving(true);
        await userAPI.changePassword(user.sub, {
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        });
        enqueueSnackbar('密码修改成功', { variant: 'success' });
        passwordFormik.resetForm();
        setPasswordDialogOpen(false);
      } catch (error) {
        enqueueSnackbar(`修改密码失败: ${error.response?.data?.message || error.message}`, { variant: 'error' });
      } finally {
        setSaving(false);
      }
    }
  });

  // 处理标签页切换
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // 获取用户名首字母作为头像
  const getInitials = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ pt: 3, pb: 3 }}>
        <Typography variant="h4" gutterBottom>
          账户设置
        </Typography>

        <Paper sx={{ width: '100%', mt: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            centered
          >
            <Tab icon={<PersonIcon />} label="个人信息" />
            <Tab icon={<LockIcon />} label="安全设置" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <form onSubmit={formik.handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Avatar
                    sx={{
                      width: 100,
                      height: 100,
                      fontSize: 40,
                      mb: 2,
                      bgcolor: 'primary.main'
                    }}
                  >
                    {getInitials(userData?.realName || userData?.userName)}
                  </Avatar>
                  <Typography variant="h6">{userData?.userName}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {userData?.roles?.join(', ')}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={8}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="用户名"
                        name="userName"
                        value={formik.values.userName}
                        disabled
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="邮箱"
                        name="email"
                        value={formik.values.email}
                        onChange={formik.handleChange}
                        error={formik.touched.email && Boolean(formik.errors.email)}
                        helperText={formik.touched.email && formik.errors.email}
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="真实姓名"
                        name="realName"
                        value={formik.values.realName}
                        onChange={formik.handleChange}
                        error={formik.touched.realName && Boolean(formik.errors.realName)}
                        helperText={formik.touched.realName && formik.errors.realName}
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        startIcon={<SaveIcon />}
                        disabled={saving}
                      >
                        {saving ? <CircularProgress size={24} /> : '保存修改'}
                      </Button>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </form>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="subtitle1">密码管理</Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  修改您的账户密码
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setPasswordDialogOpen(true)}
                  disabled={saving}
                >
                  修改密码
                </Button>
              </Grid>

              <Grid item xs={12}>
                <Divider />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1">双因素认证</Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  状态: {userData?.isTwoFactorEnabled ? (
                    <span style={{ color: 'green' }}>已启用</span>
                  ) : (
                    <span style={{ color: 'red' }}>未启用</span>
                  )}
                </Typography>
                {/* 这里可以添加重新设置双因素认证的按钮 */}
              </Grid>

              <Grid item xs={12}>
                <Divider />
              </Grid>

              <Grid item xs={12}>
                <WechatBindingSection />
              </Grid>
            </Grid>
          </TabPanel>
        </Paper>
      </Box>

      {/* 修改密码对话框 */}
      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)}>
        <DialogTitle>修改密码</DialogTitle>
        <form onSubmit={passwordFormik.handleSubmit}>
          <DialogContent>
            <DialogContentText>
              请输入您的当前密码和新密码。
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              name="currentPassword"
              label="当前密码"
              type="password"
              fullWidth
              variant="outlined"
              value={passwordFormik.values.currentPassword}
              onChange={passwordFormik.handleChange}
              error={passwordFormik.touched.currentPassword && Boolean(passwordFormik.errors.currentPassword)}
              helperText={passwordFormik.touched.currentPassword && passwordFormik.errors.currentPassword}
              sx={{ mt: 2 }}
            />
            <TextField
              margin="dense"
              name="newPassword"
              label="新密码"
              type="password"
              fullWidth
              variant="outlined"
              value={passwordFormik.values.newPassword}
              onChange={passwordFormik.handleChange}
              error={passwordFormik.touched.newPassword && Boolean(passwordFormik.errors.newPassword)}
              helperText={passwordFormik.touched.newPassword && passwordFormik.errors.newPassword}
            />
            <TextField
              margin="dense"
              name="confirmPassword"
              label="确认新密码"
              type="password"
              fullWidth
              variant="outlined"
              value={passwordFormik.values.confirmPassword}
              onChange={passwordFormik.handleChange}
              error={passwordFormik.touched.confirmPassword && Boolean(passwordFormik.errors.confirmPassword)}
              helperText={passwordFormik.touched.confirmPassword && passwordFormik.errors.confirmPassword}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPasswordDialogOpen(false)} disabled={saving}>
              取消
            </Button>
            <Button type="submit" color="primary" disabled={saving}>
              {saving ? <CircularProgress size={24} /> : '确认修改'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default AccountView;
