import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Paper
} from '@mui/material';
import WechatIcon from '../../components/icons/WechatIcon';
import { authAPI } from '../../services/api';
import { useSnackbar } from 'notistack';

const WechatBindingSection = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [bindingInfo, setBindingInfo] = useState(null);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrCodeInfo, setQrCodeInfo] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [error, setError] = useState('');
  const [intervalId, setIntervalId] = useState(null);

  // 加载微信绑定状态
  useEffect(() => {
    const loadBindingInfo = async () => {
      try {
        setLoading(true);
        const response = await authAPI.getWechatBinding();
        setBindingInfo(response);
      } catch (error) {
        console.error('获取微信绑定状态失败:', error);
        enqueueSnackbar('获取微信绑定状态失败', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    loadBindingInfo();
  }, [enqueueSnackbar]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  // 获取微信绑定二维码
  const handleGetQrCode = async () => {
    try {
      setQrLoading(true);
      setError('');

      const result = await authAPI.getWechatLoginQrCode();
      setQrCodeInfo(result);
      setQrDialogOpen(true);

      // 开始轮询检查状态
      const id = setInterval(checkQrCodeStatus, 2000, result.loginId);
      setIntervalId(id);
    } catch (error) {
      console.error('获取微信绑定二维码失败:', error);
      setError('获取微信绑定二维码失败，请稍后再试');
    } finally {
      setQrLoading(false);
    }
  };

  // 检查二维码状态
  const checkQrCodeStatus = async (loginId) => {
    if (checkingStatus) return;

    try {
      setCheckingStatus(true);
      const result = await authAPI.checkWechatLoginStatus(loginId);

      if (result.status === 'scanned') {
        // 已扫码，等待确认
        enqueueSnackbar('微信已扫码，请在微信中确认', { variant: 'info' });
      } else if (result.status === 'confirmed') {
        // 已确认，可以绑定
        clearInterval(intervalId);
        setIntervalId(null);

        // 绑定微信账号
        await bindWechat(result.openId, result.unionId, result.nickname);
        setQrDialogOpen(false);
      } else if (result.status === 'expired') {
        // 已过期
        clearInterval(intervalId);
        setIntervalId(null);
        setError('二维码已过期，请刷新');
      }
    } catch (error) {
      console.error('检查二维码状态失败:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  // 绑定微信账号
  const bindWechat = async (openId, unionId, nickname) => {
    try {
      await authAPI.bindWechat({
        openId,
        unionId,
        nickname
      });

      enqueueSnackbar('微信账号绑定成功', { variant: 'success' });

      // 重新加载绑定状态
      const response = await authAPI.getWechatBinding();
      setBindingInfo(response);
    } catch (error) {
      console.error('绑定微信账号失败:', error);
      enqueueSnackbar('绑定微信账号失败', { variant: 'error' });
    }
  };

  // 解绑微信账号
  const handleUnbind = async () => {
    try {
      setLoading(true);
      await authAPI.unbindWechat();

      enqueueSnackbar('微信账号解绑成功', { variant: 'success' });

      // 重新加载绑定状态
      const response = await authAPI.getWechatBinding();
      setBindingInfo(response);
    } catch (error) {
      console.error('解绑微信账号失败:', error);
      enqueueSnackbar('解绑微信账号失败', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // 刷新二维码
  const handleRefreshQrCode = async () => {
    // 清除旧的定时器
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }

    // 获取新的二维码
    await handleGetQrCode();
  };

  // 关闭二维码对话框
  const handleCloseQrDialog = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setQrDialogOpen(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle1">微信绑定</Typography>

      {bindingInfo?.isBound ? (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
            已绑定微信账号: {bindingInfo.wechatNickname}
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            绑定时间: {new Date(bindingInfo.bindTime).toLocaleString()}
          </Typography>

          <Button
            variant="outlined"
            color="error"
            onClick={handleUnbind}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : '解绑微信账号'}
          </Button>
        </Box>
      ) : (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            您尚未绑定微信账号，绑定后可使用微信扫码登录。
          </Typography>

          <Button
            variant="contained"
            color="primary"
            startIcon={<WechatIcon />}
            onClick={handleGetQrCode}
            disabled={qrLoading}
          >
            {qrLoading ? <CircularProgress size={24} color="inherit" /> : '绑定微信账号'}
          </Button>
        </Box>
      )}

      {/* 微信绑定二维码对话框 */}
      <Dialog open={qrDialogOpen} onClose={handleCloseQrDialog} maxWidth="xs" fullWidth>
        <DialogTitle>微信绑定</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              请使用微信扫描下方二维码进行绑定
            </Typography>

            {qrCodeInfo && (
              <Box sx={{ position: 'relative', mb: 2 }}>
                <Paper elevation={3} sx={{ p: 2 }}>
                  <img
                    src={qrCodeInfo.qrCodeUrl}
                    alt="微信绑定二维码"
                    style={{ width: '200px', height: '200px' }}
                  />

                  {checkingStatus && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.7)',
                      }}
                    >
                      <CircularProgress size={30} />
                    </Box>
                  )}
                </Paper>
              </Box>
            )}

            <Typography variant="body2" color="textSecondary">
              二维码有效期为5分钟，过期请点击刷新
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseQrDialog}>取消</Button>
          <Button onClick={handleRefreshQrCode} disabled={qrLoading || checkingStatus}>
            刷新二维码
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WechatBindingSection;
