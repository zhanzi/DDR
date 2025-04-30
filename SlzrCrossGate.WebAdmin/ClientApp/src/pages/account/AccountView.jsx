import React, { useState, useEffect, useMemo } from 'react';
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
import { QRCodeSVG } from "qrcode.react";
import {
  Save as SaveIcon,
  Lock as LockIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI, authAPI, systemSettingsAPI } from '../../services/api';
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
  const [enableTwoFactorDialogOpen, setEnableTwoFactorDialogOpen] = useState(false);
  const [disableTwoFactorDialogOpen, setDisableTwoFactorDialogOpen] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorQrCode, setTwoFactorQrCode] = useState('');
  const [twoFactorSecretKey, setTwoFactorSecretKey] = useState('');
  const [userData, setUserData] = useState(null);
  const [systemSettings, setSystemSettings] = useState(null);

  // 加载用户数据
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const response = await userAPI.getUser(user.sub);
        setUserData(response);
        
        // 加载系统设置，使用 systemSettingsAPI 而不是直接的 axios 调用
        try {
          const settingsResponse = await systemSettingsAPI.getSettings();
          setSystemSettings(settingsResponse);
        } catch (settingsError) {
          console.error('加载系统设置失败:', settingsError);
        }
      } catch (error) {
        enqueueSnackbar('加载用户数据失败', { variant: 'error' });
        console.error('加载用户数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user, enqueueSnackbar]);

  // 当用户数据加载完成后，更新表单值
  useEffect(() => {
    if (userData) {
      formik.setValues({
        userName: userData.userName || '',
        email: userData.email || '',
        realName: userData.realName || '',
      });
    }
  }, [userData]);

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

  // 处理启用双因素认证
  const handleEnableTwoFactor = async () => {
    try {
      setSaving(true);
      // 注意：这里不需要传递验证码，因为是初始化设置
      const response = await authAPI.toggleTwoFactor(true);

      if (response.secretKey && response.qrCodeUrl) {
        // 显示二维码和密钥
        setTwoFactorSecretKey(response.secretKey);
        setTwoFactorQrCode(response.qrCodeUrl);
      } else {
        // 如果已经启用，刷新用户数据
        await refreshUserData();
        setEnableTwoFactorDialogOpen(false);
        enqueueSnackbar('双因素认证已启用', { variant: 'success' });
      }
    } catch (error) {
      enqueueSnackbar(`启用双因素认证失败: ${error.response?.data?.message || error.message}`, { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // 确认双因素认证设置
  const handleConfirmTwoFactor = async () => {
    try {
      setSaving(true);
      await authAPI.toggleTwoFactor(true, twoFactorCode);

      // 刷新用户数据
      await refreshUserData();

      // 重置状态
      setTwoFactorCode('');
      setTwoFactorSecretKey('');
      setTwoFactorQrCode('');
      setEnableTwoFactorDialogOpen(false);

      enqueueSnackbar('双因素认证已成功启用', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(`确认双因素认证失败: ${error.response?.data?.message || error.message}`, { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // 处理禁用双因素认证
  const handleDisableTwoFactor = async () => {
    try {
      setSaving(true);
      await authAPI.toggleTwoFactor(false, twoFactorCode);

      // 刷新用户数据
      await refreshUserData();

      // 重置状态
      setTwoFactorCode('');
      setDisableTwoFactorDialogOpen(false);

      enqueueSnackbar('双因素认证已禁用', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(`禁用双因素认证失败: ${error.response?.data?.message || error.message}`, { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // 刷新用户数据
  const refreshUserData = async () => {
    try {
      const response = await userAPI.getUser(user.sub);
      setUserData(response);
    } catch (error) {
      enqueueSnackbar('刷新用户数据失败', { variant: 'error' });
    }
  };

  // 计算是否强制使用双因素认证
  const isTwoFactorRequired = useMemo(() => {
    if (!systemSettings || !userData) return false;
    
    // 如果系统设置强制使用双因素认证
    if (systemSettings.forceTwoFactorAuth) return true;
    
    // 如果用户被特别设置为需要双因素认证
    if (userData.isTwoFactorRequired) return true;
    
    return false;
  }, [systemSettings, userData]);

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

                {userData?.isTwoFactorEnabled ? (
                  <>
                    <Button
                      variant="contained"
                      color="error"
                      onClick={() => setDisableTwoFactorDialogOpen(true)}
                      disabled={saving || isTwoFactorRequired}
                    >
                      禁用双因素认证
                    </Button>
                    {isTwoFactorRequired && (
                      <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                        {systemSettings?.forceTwoFactorAuth 
                          ? '系统设置要求所有用户必须使用双因素认证，无法禁用' 
                          : '您的账户被管理员设置为必须使用双因素认证，无法禁用'}
                      </Typography>
                    )}
                  </>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => setEnableTwoFactorDialogOpen(true)}
                    disabled={saving}
                  >
                    启用双因素认证
                  </Button>
                )}
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

      {/* 启用双因素认证对话框 */}
      <Dialog
        open={enableTwoFactorDialogOpen}
        onClose={() => {
          if (!saving) {
            setEnableTwoFactorDialogOpen(false);
            setTwoFactorCode('');
            setTwoFactorSecretKey('');
            setTwoFactorQrCode('');
          }
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>启用双因素认证</DialogTitle>
        <DialogContent>
          {!twoFactorSecretKey ? (
            <DialogContentText>
              启用双因素认证后，每次登录时都需要输入动态验证码。是否继续？
            </DialogContentText>
          ) : (
            <>
              <DialogContentText>
                请使用身份验证器应用（如Google Authenticator、Microsoft Authenticator或Authy）扫描下方二维码，或手动输入密钥。
              </DialogContentText>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 2 }}>
                <QRCodeSVG
                  value={twoFactorQrCode}
                  size={200}
                  level="H"
                  margin={10}
                  style={{ marginBottom: 16 }}
                />
                <Typography variant="subtitle2" sx={{ mb: 1 }}>密钥：</Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: 'monospace',
                    bgcolor: 'background.paper',
                    p: 1,
                    borderRadius: 1,
                    letterSpacing: 1
                  }}
                >
                  {twoFactorSecretKey}
                </Typography>
              </Box>
              <DialogContentText sx={{ mt: 2 }}>
                请输入验证器应用生成的6位验证码以确认设置：
              </DialogContentText>
              <TextField
                autoFocus
                margin="dense"
                label="验证码"
                type="text"
                fullWidth
                variant="outlined"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                inputProps={{ maxLength: 6, pattern: '[0-9]*' }}
                sx={{ mt: 1 }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setEnableTwoFactorDialogOpen(false);
              setTwoFactorCode('');
              setTwoFactorSecretKey('');
              setTwoFactorQrCode('');
            }}
            disabled={saving}
          >
            取消
          </Button>
          {!twoFactorSecretKey ? (
            <Button
              onClick={handleEnableTwoFactor}
              color="primary"
              disabled={saving}
            >
              {saving ? <CircularProgress size={24} /> : '继续'}
            </Button>
          ) : (
            <Button
              onClick={handleConfirmTwoFactor}
              color="primary"
              disabled={saving || twoFactorCode.length !== 6}
            >
              {saving ? <CircularProgress size={24} /> : '确认'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* 禁用双因素认证对话框 */}
      <Dialog
        open={disableTwoFactorDialogOpen}
        onClose={() => {
          if (!saving) {
            setDisableTwoFactorDialogOpen(false);
            setTwoFactorCode('');
          }
        }}
      >
        <DialogTitle>禁用双因素认证</DialogTitle>
        <DialogContent>
          <DialogContentText>
            禁用双因素认证后，登录时将不再需要输入验证码。为确保安全，请输入您的验证器应用生成的6位验证码以确认操作。
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="验证码"
            type="text"
            fullWidth
            variant="outlined"
            value={twoFactorCode}
            onChange={(e) => setTwoFactorCode(e.target.value)}
            inputProps={{ maxLength: 6, pattern: '[0-9]*' }}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDisableTwoFactorDialogOpen(false);
              setTwoFactorCode('');
            }}
            disabled={saving}
          >
            取消
          </Button>
          <Button
            onClick={handleDisableTwoFactor}
            color="primary"
            disabled={saving || twoFactorCode.length !== 6}
          >
            {saving ? <CircularProgress size={24} /> : '确认禁用'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AccountView;
