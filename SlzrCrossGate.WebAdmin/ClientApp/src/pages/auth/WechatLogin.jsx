import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useSnackbar } from 'notistack';

const WechatLogin = () => {
  const { loginWithWechat, checkWechatLoginStatus } = useAuth();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loginId, setLoginId] = useState('');
  const [checkingStatus, setCheckingStatus] = useState(false);

  // 获取微信登录二维码
  useEffect(() => {
    const fetchQrCode = async () => {
      setLoading(true);
      setError('');

      try {
        const result = await loginWithWechat();

        if (result.success) {
          setQrCodeUrl(result.qrCodeUrl);
          setLoginId(result.loginId);
        } else {
          setError(result.message || '获取微信登录二维码失败');
        }
      } catch (err) {
        setError('获取微信登录二维码过程中发生错误，请稍后再试');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchQrCode();
  }, [loginWithWechat]);

  // 定期检查登录状态
  useEffect(() => {
    let intervalId;

    if (loginId && !checkingStatus) {
      intervalId = setInterval(async () => {
        try {
          setCheckingStatus(true);
          const result = await checkWechatLoginStatus(loginId);

          if (result.success) {
            if (result.status === 'success') {
              clearInterval(intervalId);
              enqueueSnackbar('登录成功', { variant: 'success' });
              navigate('/app/dashboard');
            } else if (result.status === 'expired') {
              clearInterval(intervalId);
              setError('二维码已过期，请刷新页面重试');
            }
          } else {
            setError(result.message || '检查登录状态失败');
          }
        } catch (err) {
          console.error(err);
        } finally {
          setCheckingStatus(false);
        }
      }, 2000); // 每2秒检查一次
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [loginId, checkWechatLoginStatus, navigate, enqueueSnackbar, checkingStatus]);

  // 刷新二维码
  const handleRefresh = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await loginWithWechat();

      if (result.success) {
        setQrCodeUrl(result.qrCodeUrl);
        setLoginId(result.loginId);
      } else {
        setError(result.message || '获取微信登录二维码失败');
      }
    } catch (err) {
      setError('获取微信登录二维码过程中发生错误，请稍后再试');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: 2,
        }}
      >
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            微信扫码登录
          </Typography>
          <Typography variant="body2" color="text.secondary">
            请使用微信扫描二维码登录
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {qrCodeUrl && (
                <Box sx={{ textAlign: 'center', my: 3, position: 'relative' }}>
                  <img
                    src={qrCodeUrl}
                    alt="微信登录二维码"
                    style={{ maxWidth: '200px', border: '1px solid #eee', padding: '10px' }}
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
                </Box>
              )}

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                请打开微信，扫描上方二维码登录
              </Typography>

              <Button
                variant="outlined"
                onClick={handleRefresh}
                sx={{ mt: 2 }}
                disabled={loading || checkingStatus}
              >
                刷新二维码
              </Button>
            </>
          )}
        </Box>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button
            variant="text"
            onClick={() => navigate('/login')}
            sx={{ mt: 2 }}
          >
            返回账号密码登录
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default WechatLogin;
