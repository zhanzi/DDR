import { useState } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Button,
  Container,
  Link,
  Paper,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { authAPI } from '../../services/api';

const ResetPassword = () => {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // 从URL中获取email和token参数
  const queryParams = new URLSearchParams(location.search);
  const email = queryParams.get('email');
  const token = queryParams.get('token');

  // 表单验证
  const formik = useFormik({
    initialValues: {
      password: '',
      confirmPassword: '',
    },
    validationSchema: Yup.object({
      password: Yup.string()
        .min(6, '密码至少6个字符')
        .required('请输入新密码'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), null], '两次输入的密码不匹配')
        .required('请确认新密码'),
    }),
    onSubmit: async (values) => {
      if (!email || !token) {
        setError('无效的重置链接，请重新获取');
        return;
      }

      setLoading(true);
      setError('');

      try {
        // 调用重置密码API
        await authAPI.resetPassword({
          email,
          token,
          password: values.password,
        });
        
        setSuccess(true);
        enqueueSnackbar('密码重置成功，请使用新密码登录', { variant: 'success' });
        
        // 3秒后跳转到登录页面
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (err) {
        setError(err.response?.data?.message || '重置密码失败，请重新获取重置链接');
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
  });

  // 如果没有email或token参数，显示错误信息
  if (!email || !token) {
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
              重置密码
            </Typography>
          </Box>
          
          <Alert severity="error" sx={{ mb: 3 }}>
            无效的重置链接，请重新获取
          </Alert>
          
          <Button
            component={RouterLink}
            to="/forgot-password"
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
          >
            获取新的重置链接
          </Button>
        </Paper>
      </Container>
    );
  }

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
            重置密码
          </Typography>
          <Typography variant="body2" color="text.secondary">
            请输入您的新密码
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success ? (
          <Box sx={{ textAlign: 'center' }}>
            <Alert severity="success" sx={{ mb: 3 }}>
              密码重置成功，正在跳转到登录页面...
            </Alert>
            <Button
              component={RouterLink}
              to="/login"
              variant="contained"
              fullWidth
              sx={{ mt: 2 }}
            >
              立即登录
            </Button>
          </Box>
        ) : (
          <form onSubmit={formik.handleSubmit}>
            <TextField
              fullWidth
              id="password"
              name="password"
              label="新密码"
              type="password"
              margin="normal"
              autoComplete="new-password"
              value={formik.values.password}
              onChange={formik.handleChange}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
            />
            
            <TextField
              fullWidth
              id="confirmPassword"
              name="confirmPassword"
              label="确认密码"
              type="password"
              margin="normal"
              autoComplete="new-password"
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
              helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3, mb: 2 }}
            >
              {loading ? '重置中...' : '重置密码'}
            </Button>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2">
                <Link component={RouterLink} to="/login" variant="body2">
                  返回登录
                </Link>
              </Typography>
            </Box>
          </form>
        )}
      </Paper>
    </Container>
  );
};

export default ResetPassword;
