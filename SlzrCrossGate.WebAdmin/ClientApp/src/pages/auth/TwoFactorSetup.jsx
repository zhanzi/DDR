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
  Stepper,
  Step,
  StepLabel,
  Link,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useSnackbar } from 'notistack';

const TwoFactorSetup = () => {
  const { setupTwoFactor, confirmTwoFactorSetup, tempToken } = useAuth();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');

  // 如果没有临时令牌，重定向到登录页面
  useEffect(() => {
    if (!tempToken) {
      navigate('/login');
    } else if (activeStep === 0) {
      // 获取设置信息
      fetchSetupInfo();
    }
  }, [tempToken, navigate, activeStep]);

  // 获取设置信息
  const fetchSetupInfo = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await setupTwoFactor();

      if (result.success) {
        setQrCode(result.qrCode);
        setSecret(result.secret);
      } else {
        setError(result.message || '获取设置信息失败');
      }
    } catch (err) {
      setError('获取设置信息过程中发生错误，请稍后再试');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
        const result = await confirmTwoFactorSetup(values.code);

        if (result.success) {
          enqueueSnackbar('设置成功', { variant: 'success' });
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

  // 步骤内容
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              下载身份验证器应用
            </Typography>
            <Typography variant="body2" paragraph>
              请在您的手机上下载并安装以下任一身份验证器应用：
            </Typography>
            <ul>
              <li>
                <Link href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank" rel="noopener">
                  Google Authenticator (Android)
                </Link>
              </li>
              <li>
                <Link href="https://apps.apple.com/us/app/google-authenticator/id388497605" target="_blank" rel="noopener">
                  Google Authenticator (iOS)
                </Link>
              </li>
              <li>
                <Link href="https://authy.com/download/" target="_blank" rel="noopener">
                  Authy (Android/iOS)
                </Link>
              </li>
            </ul>
            <Button
              variant="contained"
              onClick={() => setActiveStep(1)}
              sx={{ mt: 2 }}
            >
              下一步
            </Button>
          </Box>
        );
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              扫描二维码
            </Typography>
            <Typography variant="body2" paragraph>
              打开身份验证器应用，扫描下方二维码：
            </Typography>
            {qrCode && (
              <Box sx={{ textAlign: 'center', my: 3 }}>
                <img src={qrCode} alt="二维码" style={{ maxWidth: '200px' }} />
              </Box>
            )}
            <Typography variant="body2" paragraph>
              如果无法扫描二维码，请手动输入以下密钥：
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontFamily: 'monospace',
                p: 2,
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                borderRadius: 1,
                textAlign: 'center',
                letterSpacing: 1,
              }}
            >
              {secret}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Button variant="outlined" onClick={() => setActiveStep(0)}>
                上一步
              </Button>
              <Button variant="contained" onClick={() => setActiveStep(2)}>
                下一步
              </Button>
            </Box>
          </Box>
        );
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              验证设置
            </Typography>
            <Typography variant="body2" paragraph>
              请输入身份验证器应用中显示的6位动态口令，以完成设置：
            </Typography>
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Button variant="outlined" onClick={() => setActiveStep(1)}>
                  上一步
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                >
                  {loading ? '验证中...' : '完成设置'}
                </Button>
              </Box>
            </form>
          </Box>
        );
      default:
        return '未知步骤';
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
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            设置双因素验证
          </Typography>
          <Typography variant="body2" color="text.secondary">
            增强您账户的安全性
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          <Step>
            <StepLabel>下载应用</StepLabel>
          </Step>
          <Step>
            <StepLabel>扫描二维码</StepLabel>
          </Step>
          <Step>
            <StepLabel>验证设置</StepLabel>
          </Step>
        </Stepper>

        {getStepContent(activeStep)}
      </Paper>
    </Container>
  );
};

export default TwoFactorSetup;
