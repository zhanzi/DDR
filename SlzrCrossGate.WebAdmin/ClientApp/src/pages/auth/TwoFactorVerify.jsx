import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useSnackbar } from 'notistack';

const TwoFactorVerify = () => {
  const { verifyTwoFactor, needTwoFactor, user } = useAuth();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 如果不需要双因素验证，重定向到仪表盘
  useEffect(() => {
    if (!needTwoFactor) {
      navigate('/app/dashboard');
    }
  }, [needTwoFactor, navigate]);

  // 表单验证
  const formik = useFormik({
    initialValues: {
      code: '',
    },
    validationSchema: Yup.object({
      code: Yup.string()
        .required('请输入动态口令')
        .matches(/^\d{6}$/, '动态口令必须是6位数字'),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      setError('');

      try {
        const result = await verifyTwoFactor(values.code);

        if (result.success) {
          enqueueSnackbar('验证成功', { variant: 'success' });
          navigate('/app/dashboard');
        } else {
          setError(result.message || '验证失败，请检查动态口令');
        }
      } catch (err) {
        setError('验证过程中发生错误，请稍后再试');
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
            双因素验证
          </Typography>
          <Typography variant="body2" color="text.secondary">
            请输入您的动态口令以完成登录
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
            id="code"
            name="code"
            label="动态口令"
            margin="normal"
            autoComplete="one-time-code"
            autoFocus
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

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            请打开您的身份验证器应用程序，输入显示的6位数字
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default TwoFactorVerify;
