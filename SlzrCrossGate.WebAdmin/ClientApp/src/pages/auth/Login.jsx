import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Button,
  Checkbox,
  Container,
  Divider,
  FormControlLabel,
  Grid,
  Link,
  Paper,
  TextField,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useSnackbar } from 'notistack';
import WechatIcon from '../../components/icons/WechatIcon';

const Login = () => {
  const { login } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 表单验证
  const formik = useFormik({
    initialValues: {
      username: '',
      password: '',
      remember: true,
    },
    validationSchema: Yup.object({
      username: Yup.string().required('请输入用户名'),
      password: Yup.string().required('请输入密码'),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      setError('');

      try {
        const result = await login(values.username, values.password);

        if (result.success) {
          // 如果需要双因素验证
          if (result.requireTwoFactor) {
            navigate('/two-factor-verify');
            return;
          }

          // 如果需要设置双因素验证
          if (result.setupTwoFactor) {
            navigate('/two-factor-setup');
            return;
          }

          // 正常登录成功
          enqueueSnackbar('登录成功', { variant: 'success' });
          navigate('/app/dashboard');
        } else {
          setError(result.message || '登录失败，请检查用户名和密码');
        }
      } catch (err) {
        setError('登录过程中发生错误，请稍后再试');
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
  });

  // 切换密码可见性
  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
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
              终端管理系统
            </Typography>
            <Typography variant="body2" color="text.secondary">
              请登录您的账号
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={formik.handleSubmit}>
            <TextField
              fullWidth
              id="username"
              name="username"
              label="用户名"
              margin="normal"
              autoComplete="username"
              autoFocus
              value={formik.values.username}
              onChange={formik.handleChange}
              error={formik.touched.username && Boolean(formik.errors.username)}
              helperText={formik.touched.username && formik.errors.username}
            />
            <TextField
              fullWidth
              id="password"
              name="password"
              label="密码"
              type={showPassword ? 'text' : 'password'}
              margin="normal"
              autoComplete="current-password"
              value={formik.values.password}
              onChange={formik.handleChange}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleTogglePassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    id="remember"
                    name="remember"
                    color="primary"
                    checked={formik.values.remember}
                    onChange={formik.handleChange}
                  />
                }
                label="记住我"
              />
              <Link component={RouterLink} to="/forgot-password" variant="body2">
                忘记密码?
              </Link>
            </Box>
            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3, mb: 2 }}
            >
              {loading ? '登录中...' : '登录'}
            </Button>
          </form>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              或者
            </Typography>
          </Divider>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="outlined"
                color="success"
                startIcon={<WechatIcon />}
                onClick={() => navigate('/wechat-login')}
              >
                微信扫码登录
              </Button>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2">
              还没有账号?{' '}
              <Link component={RouterLink} to="/register" variant="body2">
                立即注册
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>

  );
};

export default Login;
