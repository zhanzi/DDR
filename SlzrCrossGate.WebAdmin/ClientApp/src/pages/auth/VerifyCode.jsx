import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
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
import { useAuth } from '../../contexts/AuthContext';
import { useSnackbar } from 'notistack';

const VerifyCode = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 表单验证
  const formik = useFormik({
    initialValues: {
      username: '',
      code: '',
    },
    validationSchema: Yup.object({
      username: Yup.string().required('请输入用户名'),
      code: Yup.string()
        .required('请输入验证码')
        .matches(/^[0-9]{6}$/, '验证码必须是6位数字'),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      setError('');
      
      try {
        // 这里应该调用验证码登录API
        // const result = await verifyCodeLogin(values.username, values.code);
        
        // 模拟API调用
        setTimeout(() => {
          enqueueSnackbar('验证成功', { variant: 'success' });
          navigate('/dashboard');
          setLoading(false);
        }, 1500);
      } catch (err) {
        setError('验证过程中发生错误，请稍后再试');
        console.error(err);
        setLoading(false);
      }
    },
  });

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: (theme) => theme.palette.background.default,
        py: 4,
      }}
    >
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
              动态口令验证
            </Typography>
            <Typography variant="body2" color="text.secondary">
              请输入您的用户名和动态口令
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
              id="code"
              name="code"
              label="动态口令"
              margin="normal"
              autoComplete="one-time-code"
              value={formik.values.code}
              onChange={formik.handleChange}
              error={formik.touched.code && Boolean(formik.errors.code)}
              helperText={formik.touched.code && formik.errors.code}
              inputProps={{ maxLength: 6 }}
            />
            
            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3, mb: 2 }}
            >
              {loading ? '验证中...' : '验证'}
            </Button>
          </form>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2">
              <Link component={RouterLink} to="/auth/login" variant="body2">
                返回登录
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default VerifyCode;
