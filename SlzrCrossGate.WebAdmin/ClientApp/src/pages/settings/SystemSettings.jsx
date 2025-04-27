import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  Alert,
  Skeleton,
  Grid,
  Paper
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useSnackbar } from 'notistack';
import { systemSettingsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import SecurityIcon from '@mui/icons-material/Security';
import ChatIcon from '@mui/icons-material/Chat'; // 使用Chat图标替代Wechat
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';

const SystemSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();

  // 加载系统设置
  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await systemSettingsAPI.getSettings();
      setSettings(data);
    } catch (err) {
      console.error('加载系统设置失败:', err);
      setError(err.response?.data?.message || '加载系统设置失败');
    } finally {
      setLoading(false);
    }
  };

  // 保存系统设置
  const saveSettings = async () => {
    setSaving(true);
    setError(null);
    try {
      const updatedSettings = await systemSettingsAPI.updateSettings(settings);
      setSettings(updatedSettings);
      enqueueSnackbar('系统设置已保存', { variant: 'success' });
    } catch (err) {
      console.error('保存系统设置失败:', err);
      setError(err.response?.data?.message || '保存系统设置失败');
      enqueueSnackbar('保存系统设置失败', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // 处理开关变化
  const handleSwitchChange = (name) => (event) => {
    setSettings({
      ...settings,
      [name]: event.target.checked,
    });
  };

  // 初始加载
  useEffect(() => {
    loadSettings();
  }, []);

  // 如果用户不是系统管理员，显示无权限提示
  if (user && !user.roles?.includes('SystemAdmin')) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          您没有权限访问系统设置页面。只有系统管理员可以访问此页面。
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        系统设置
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Skeleton variant="rectangular" height={200} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Skeleton variant="rectangular" height={200} />
          </Grid>
        </Grid>
      ) : (
        <>
          <Grid container spacing={3}>
            {/* 双因素认证设置 */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  height: '100%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <SecurityIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">双因素认证设置</Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings?.enableTwoFactorAuth || false}
                      onChange={handleSwitchChange('enableTwoFactorAuth')}
                      color="primary"
                    />
                  }
                  label="启用双因素认证"
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                  启用后，用户可以使用双因素认证增强账户安全性。禁用后，所有用户将无法使用双因素认证。
                </Typography>

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings?.forceTwoFactorAuth || false}
                      onChange={handleSwitchChange('forceTwoFactorAuth')}
                      disabled={!settings?.enableTwoFactorAuth}
                      color="primary"
                    />
                  }
                  label="强制所有用户使用双因素认证"
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  启用后，所有用户必须设置并使用双因素认证才能登录系统。
                </Typography>
              </Paper>
            </Grid>

            {/* 微信登录设置 */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  height: '100%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ChatIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">微信登录设置</Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings?.enableWechatLogin || false}
                      onChange={handleSwitchChange('enableWechatLogin')}
                      color="primary"
                    />
                  }
                  label="启用微信扫码登录"
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  启用后，用户可以使用微信扫码方式登录系统。禁用后，所有用户将无法使用微信登录。
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* 操作按钮 */}
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadSettings}
              disabled={loading || saving}
            >
              刷新
            </Button>
            <LoadingButton
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={saveSettings}
              loading={saving}
              disabled={loading}
            >
              保存设置
            </LoadingButton>
          </Box>
        </>
      )}
    </Box>
  );
};

export default SystemSettings;
