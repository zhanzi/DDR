import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
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

const ForgotPassword = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // 表单验证
  const formik = useFormik({
    initialValues: {
      email: '',
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email('请输入有效的电子邮箱')
        .required('请输入电子邮箱'),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      setError('');

      try {
        // 调用忘记密码API
        await authAPI.forgotPassword(values.email);

        setSuccess(true);
        enqueueSnackbar('重置密码链接已发送到您的邮箱', { variant: 'success' });
      } catch (err) {
        setError('发送重置密码邮件过程中发生错误，请稍后再试');
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
  });

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
              忘记密码
            </Typography>
            <Typography variant="body2" color="text.secondary">
              请输入您的电子邮箱，我们将发送重置密码链接
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
                重置密码链接已发送到您的邮箱，请查收
              </Alert>
              <Button
                component={RouterLink}
                to="/login"
                variant="contained"
                fullWidth
                sx={{ mt: 2 }}
              >
                返回登录
              </Button>
            </Box>
          ) : (
            <form onSubmit={formik.handleSubmit}>
              <TextField
                fullWidth
                id="email"
                name="email"
                label="电子邮箱"
                margin="normal"
                autoComplete="email"
                autoFocus
                value={formik.values.email}
                onChange={formik.handleChange}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
              />

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 3, mb: 2 }}
              >
                {loading ? '发送中...' : '发送重置链接'}
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

export default ForgotPassword;
