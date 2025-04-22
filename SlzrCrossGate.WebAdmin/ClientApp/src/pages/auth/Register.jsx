import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Button,
  Checkbox,
  Container,
  Divider,
  FormControlLabel,
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

const Register = () => {
  const { register } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 表单验证
  const formik = useFormik({
    initialValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeTerms: false,
    },
    validationSchema: Yup.object({
      username: Yup.string().required('请输入用户名'),
      email: Yup.string()
        .email('请输入有效的电子邮箱')
        .required('请输入电子邮箱'),
      password: Yup.string()
        .min(8, '密码长度至少为8个字符')
        .matches(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
          '密码必须包含大小写字母、数字和特殊字符'
        )
        .required('请输入密码'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), null], '两次输入的密码不一致')
        .required('请确认密码'),
      agreeTerms: Yup.boolean().oneOf([true], '请同意服务条款'),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      setError('');

      try {
        const result = await register(values.email, values.username, values.password);

        if (result.success) {
          enqueueSnackbar('注册成功', { variant: 'success' });
        } else {
          setError(result.message || '注册失败，请稍后再试');
        }
      } catch (err) {
        setError('注册过程中发生错误，请稍后再试');
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
              创建新账号
            </Typography>
            <Typography variant="body2" color="text.secondary">
              请填写以下信息完成注册
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
              id="email"
              name="email"
              label="电子邮箱"
              margin="normal"
              autoComplete="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
            />
            <TextField
              fullWidth
              id="password"
              name="password"
              label="密码"
              type={showPassword ? 'text' : 'password'}
              margin="normal"
              autoComplete="new-password"
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
            <TextField
              fullWidth
              id="confirmPassword"
              name="confirmPassword"
              label="确认密码"
              type={showPassword ? 'text' : 'password'}
              margin="normal"
              autoComplete="new-password"
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
              helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
            />

            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    id="agreeTerms"
                    name="agreeTerms"
                    color="primary"
                    checked={formik.values.agreeTerms}
                    onChange={formik.handleChange}
                  />
                }
                label={
                  <Typography variant="body2">
                    我同意{' '}
                    <Link href="#" variant="body2">
                      服务条款
                    </Link>{' '}
                    和{' '}
                    <Link href="#" variant="body2">
                      隐私政策
                    </Link>
                  </Typography>
                }
              />
              {formik.touched.agreeTerms && formik.errors.agreeTerms && (
                <Typography variant="caption" color="error">
                  {formik.errors.agreeTerms}
                </Typography>
              )}
            </Box>

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3, mb: 2 }}
            >
              {loading ? '注册中...' : '注册'}
            </Button>
          </form>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              或者
            </Typography>
          </Divider>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2">
              已有账号?{' '}
              <Link component={RouterLink} to="/login" variant="body2">
                立即登录
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>

  );
};

export default Register;
