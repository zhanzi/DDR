import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Box, TextField, Button, Typography, CircularProgress } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../contexts/AuthContext';
import  AuthLayout  from '../../layouts/AuthLayout';
import { authAPI } from '../../services/api';

const VerifyCode = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { enqueueSnackbar } = useSnackbar();
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // 从location state获取临时令牌
    const tempToken = location.state?.tempToken;
    if (!tempToken) {
        // 如果没有临时令牌，重定向到登录页
        navigate('/login');
        return null;
    }

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
            setError('');

            try {
                const response = await authAPI.verifyTwoFactorCode({
                    tempToken,
                    code: values.code
                });

                // 使用返回的完整token登录
                await login(response.token);
                enqueueSnackbar('验证成功', { variant: 'success' });
                navigate('/dashboard');
            } catch (err) {
                setError(err.response?.data?.message || '验证失败，请重试');
                enqueueSnackbar(err.response?.data?.message || '验证失败，请重试', {
                    variant: 'error'
                });
            } finally {
                setLoading(false);
            }
        },
    });

    return (
        <AuthLayout>
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                p: 3,
                backgroundColor: 'background.paper',
                borderRadius: 1,
                boxShadow: 1,
                width: '100%',
                maxWidth: 400,
            }}>
                <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
                    双因素认证
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    请输入验证器应用中显示的6位验证码
                </Typography>

                <form onSubmit={formik.handleSubmit} style={{ width: '100%' }}>
                    <TextField
                        fullWidth
                        id="code"
                        name="code"
                        label="验证码"
                        value={formik.values.code}
                        onChange={formik.handleChange}
                        error={formik.touched.code && Boolean(formik.errors.code)}
                        helperText={formik.touched.code && formik.errors.code}
                        sx={{ mb: 2 }}
                        inputProps={{
                            maxLength: 6,
                            inputMode: 'numeric',
                            pattern: '[0-9]*'
                        }}
                    />

                    {error && (
                        <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                            {error}
                        </Typography>
                    )}

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        disabled={loading}
                        sx={{ mb: 2 }}
                    >
                        {loading ? <CircularProgress size={24} /> : '验证'}
                    </Button>
                </form>
            </Box>
        </AuthLayout>
    );
};

export default VerifyCode;
