import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    TextField,
    Typography,
    CircularProgress,
    Stepper,
    Step,
    StepLabel,
    Paper
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useSnackbar } from 'notistack';
import { QRCodeSVG } from "qrcode.react";
import AuthLayout from '../../layouts/AuthLayout';
import { useAuth } from '../../contexts/AuthContext';

const steps = ['下载验证器', '扫描二维码', '验证设置'];

const TwoFactorSetup = () => {
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const { setupTwoFactor, confirmTwoFactorSetup } = useAuth();
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [setupData, setSetupData] = useState(null);

    useEffect(() => {
        if (activeStep === 1) {
            generateSetupData();
        }
    }, [activeStep]);

    const generateSetupData = async () => {
        setLoading(true);
        try {
            console.log('开始设置双因素认证');
            const response = await setupTwoFactor();
            console.log('设置双因素认证响应:', response);

            if (response.success) {
                // 确保我们有必要的数据
                if (!response.secret) {
                    throw new Error('服务器未返回密钥');
                }

                const secretKey = response.secret;
                setSetupData({
                    qrCodeUrl: response.qrCode,
                    secretKey: secretKey
                });

                // 保存secretKey到localStorage，以便后续使用
                localStorage.setItem('twoFactorSecretKey', secretKey);
                console.log('保存secretKey到localStorage:', secretKey);
            } else {
                throw new Error(response.message || '生成二维码失败');
            }
        } catch (error) {
            console.error('设置双因素认证失败:', error);
            // 显示更详细的错误信息
            let errorMessage = '生成二维码失败';
            if (error.message) {
                errorMessage = error.message;
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }
            enqueueSnackbar(errorMessage, { variant: 'error' });
            setActiveStep(0);
        } finally {
            setLoading(false);
        }
    };

    const formik = useFormik({
        initialValues: {
            code: '',
        },
        validationSchema: Yup.object({
            code: Yup.string()
                .required('请输入验证码')
                .matches(/^[0-9]{6}$/, '验证码必须是6位数字'),
        }),
        onSubmit: async (values) => {
            setLoading(true);
            try {
                // 确保我们有secretKey
                const secretKey = setupData?.secretKey || localStorage.getItem('twoFactorSecretKey');
                if (!secretKey) {
                    throw new Error('未找到密钥，请重新开始设置过程');
                }

                console.log('提交验证码，使用密钥:', secretKey);
                const response = await confirmTwoFactorSetup(values.code);
                if (response.success) {
                    // 清除localStorage中的临时密钥
                    localStorage.removeItem('twoFactorSecretKey');
                    enqueueSnackbar('双因素认证设置成功', { variant: 'success' });
                    navigate('/app/dashboard');
                } else {
                    throw new Error(response.message || '验证失败');
                }
            } catch (error) {
                enqueueSnackbar(error.message || error.response?.data?.message || '验证失败', {
                    variant: 'error'
                });
            } finally {
                setLoading(false);
            }
        },
    });

    const handleNext = () => {
        setActiveStep((prevStep) => prevStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevStep) => prevStep - 1);
    };

    const renderStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="body1" gutterBottom>
                            请在您的手机上安装以下任一验证器应用：
                        </Typography>
                        <ul>
                            <li>Google Authenticator</li>
                            <li>Microsoft Authenticator</li>
                            <li>Authy</li>
                        </ul>
                    </Box>
                );
            case 1:
                return (
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                        {loading ? (
                            <CircularProgress />
                        ) : setupData ? (
                            <>
                                <QRCodeSVG
                                    value={setupData.qrCodeUrl}
                                    size={200}
                                    level="H"
                                    margin={10}
                                />
                                <Typography variant="body2" sx={{ mt: 2 }}>
                                    请使用验证器应用扫描上方二维码
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                                    或手动输入密钥: {setupData.secretKey}
                                </Typography>
                            </>
                        ) : (
                            <Typography color="error">
                                生成二维码失败，请返回重试
                            </Typography>
                        )}
                    </Box>
                );
            case 2:
                return (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="body1" gutterBottom>
                            请输入验证器应用中显示的6位验证码：
                        </Typography>
                        <form onSubmit={formik.handleSubmit}>
                            <TextField
                                fullWidth
                                id="code"
                                name="code"
                                label="验证码"
                                value={formik.values.code}
                                onChange={formik.handleChange}
                                error={formik.touched.code && Boolean(formik.errors.code)}
                                helperText={formik.touched.code && formik.errors.code}
                                sx={{ mt: 2 }}
                                inputProps={{
                                    maxLength: 6,
                                    inputMode: 'numeric',
                                    pattern: '[0-9]*'
                                }}
                            />
                        </form>
                    </Box>
                );
            default:
                return null;
        }
    };

    return (
        <AuthLayout>
            <Paper sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
                <Typography variant="h5" gutterBottom>
                    设置双因素认证
                </Typography>

                <Stepper activeStep={activeStep} sx={{ my: 4 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {renderStepContent(activeStep)}

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                    <Button
                        disabled={activeStep === 0 || loading}
                        onClick={handleBack}
                        sx={{ mr: 1 }}
                    >
                        上一步
                    </Button>

                    {activeStep === steps.length - 1 ? (
                        <Button
                            variant="contained"
                            onClick={formik.handleSubmit}
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} /> : '完成设置'}
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            onClick={handleNext}
                            disabled={loading || (activeStep === 1 && !setupData)}
                        >
                            下一步
                        </Button>
                    )}
                </Box>
            </Paper>
        </AuthLayout>
    );
};

export default TwoFactorSetup;
