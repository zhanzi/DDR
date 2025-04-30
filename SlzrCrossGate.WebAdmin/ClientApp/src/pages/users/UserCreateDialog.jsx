import React, { useState, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Grid,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Typography,
  Box
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useSnackbar } from 'notistack';
import { userAPI, roleAPI, merchantAPI } from '../../services/api';

const UserCreateDialog = ({ open, onClose, onUserCreated }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [roles, setRoles] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(false);

  // 加载角色和商户数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [rolesResponse, merchantsResponse] = await Promise.all([
          roleAPI.getRoles(),
          merchantAPI.getMerchants({ pageSize: 100 })
        ]);
        setRoles(rolesResponse);
        setMerchants(merchantsResponse.items);
      } catch (error) {
        enqueueSnackbar('加载数据失败', { variant: 'error' });
        console.error('加载数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      loadData();
    }
  }, [open, enqueueSnackbar]);

  // 表单验证和提交
  const formik = useFormik({
    initialValues: {
      userName: '',
      email: '',
      password: '',
      confirmPassword: '',
      realName: '',
      merchantId: '',
      roles: [],
      emailConfirmed: false
    },
    validationSchema: Yup.object({
      userName: Yup.string().required('用户名是必填项'),
      email: Yup.string().email('无效的邮箱格式').required('邮箱是必填项'),
      password: Yup.string()
        .min(8, '密码至少8个字符')
        .matches(/[0-9]/, '密码必须包含至少1个数字')
        .matches(/[a-z]/, '密码必须包含至少1个小写字母')
        .matches(/[A-Z]/, '密码必须包含至少1个大写字母')
        .matches(/[^a-zA-Z0-9]/, '密码必须包含至少1个特殊字符')
        .required('密码是必填项'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), null], '两次输入的密码不匹配')
        .required('确认密码是必填项'),
      realName: Yup.string().required('真实姓名是必填项'),
      merchantId: Yup.string(),
      roles: Yup.array().min(1, '至少选择一个角色')
    }),
    onSubmit: async (values) => {
      try {
        setLoading(true);
        await userAPI.createUser(values);
        enqueueSnackbar('用户创建成功', { variant: 'success' });
        formik.resetForm();
        onUserCreated();
      } catch (error) {
        enqueueSnackbar(`创建用户失败: ${error.response?.data?.message || error.message}`, { variant: 'error' });
      } finally {
        setLoading(false);
      }
    }
  });

  const handleClose = () => {
    formik.resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>创建新用户</DialogTitle>
      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="userName"
                name="userName"
                label="用户名"
                value={formik.values.userName}
                onChange={formik.handleChange}
                error={formik.touched.userName && Boolean(formik.errors.userName)}
                helperText={formik.touched.userName && formik.errors.userName}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="email"
                name="email"
                label="邮箱"
                type="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="password"
                name="password"
                label="密码"
                type="password"
                value={formik.values.password}
                onChange={formik.handleChange}
                error={formik.touched.password && Boolean(formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password}
                margin="normal"
                required
              />
              <Box mt={1}>
                <Typography variant="caption" color="textSecondary">
                  密码必须满足：至少8个字符，包含大小写字母、数字和特殊字符
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="confirmPassword"
                name="confirmPassword"
                label="确认密码"
                type="password"
                value={formik.values.confirmPassword}
                onChange={formik.handleChange}
                error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="realName"
                name="realName"
                label="真实姓名"
                value={formik.values.realName}
                onChange={formik.handleChange}
                error={formik.touched.realName && Boolean(formik.errors.realName)}
                helperText={formik.touched.realName && formik.errors.realName}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl
                fullWidth
                margin="normal"
                error={formik.touched.merchantId && Boolean(formik.errors.merchantId)}
              >
                <InputLabel id="merchantId-label">商户</InputLabel>
                <Select
                  labelId="merchantId-label"
                  id="merchantId"
                  name="merchantId"
                  value={formik.values.merchantId}
                  onChange={formik.handleChange}
                  label="商户"
                >
                  <MenuItem value="">
                    <em>无</em>
                  </MenuItem>
                  {merchants.map((merchant) => (
                    <MenuItem key={merchant.merchantID} value={merchant.merchantID}>
                      {merchant.name} ({merchant.merchantID})
                    </MenuItem>
                  ))}
                </Select>
                {formik.touched.merchantId && formik.errors.merchantId && (
                  <FormHelperText>{formik.errors.merchantId}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl
                fullWidth
                margin="normal"
                error={formik.touched.roles && Boolean(formik.errors.roles)}
              >
                <InputLabel id="roles-label">角色</InputLabel>
                <Select
                  labelId="roles-label"
                  id="roles"
                  name="roles"
                  multiple
                  value={formik.values.roles}
                  onChange={formik.handleChange}
                  label="角色"
                  required
                >
                  {roles.map((role) => (
                    <MenuItem key={role.id} value={role.name}>
                      {role.name}
                    </MenuItem>
                  ))}
                </Select>
                {formik.touched.roles && formik.errors.roles && (
                  <FormHelperText>{formik.errors.roles}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    id="emailConfirmed"
                    name="emailConfirmed"
                    checked={formik.values.emailConfirmed}
                    onChange={formik.handleChange}
                  />
                }
                label="邮箱已确认"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            取消
          </Button>
          <Button
            type="submit"
            color="primary"
            variant="contained"
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} />}
          >
            {loading ? '创建中...' : '创建'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default UserCreateDialog;
