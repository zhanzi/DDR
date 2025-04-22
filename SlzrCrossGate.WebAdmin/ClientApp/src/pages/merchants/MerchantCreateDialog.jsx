import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Grid,
  FormControlLabel,
  Checkbox,
  CircularProgress
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useSnackbar } from 'notistack';
import { merchantAPI } from '../../services/api';

const MerchantCreateDialog = ({ open, onClose, onMerchantCreated }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);

  // 表单验证和提交
  const formik = useFormik({
    initialValues: {
      merchantID: '',
      name: '',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      address: '',
      isActive: true
    },
    validationSchema: Yup.object({
      merchantID: Yup.string().required('商户ID是必填项'),
      name: Yup.string().required('商户名称是必填项'),
      contactName: Yup.string().required('联系人是必填项'),
      contactPhone: Yup.string().required('联系电话是必填项'),
      contactEmail: Yup.string().email('无效的邮箱格式').required('联系邮箱是必填项'),
      address: Yup.string()
    }),
    onSubmit: async (values) => {
      try {
        setLoading(true);
        await merchantAPI.createMerchant(values);
        enqueueSnackbar('商户创建成功', { variant: 'success' });
        formik.resetForm();
        onMerchantCreated();
      } catch (error) {
        enqueueSnackbar(`创建商户失败: ${error.message}`, { variant: 'error' });
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
      <DialogTitle>创建新商户</DialogTitle>
      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="merchantID"
                name="merchantID"
                label="商户ID"
                value={formik.values.merchantID}
                onChange={formik.handleChange}
                error={formik.touched.merchantID && Boolean(formik.errors.merchantID)}
                helperText={formik.touched.merchantID && formik.errors.merchantID}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="name"
                name="name"
                label="商户名称"
                value={formik.values.name}
                onChange={formik.handleChange}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="contactName"
                name="contactName"
                label="联系人"
                value={formik.values.contactName}
                onChange={formik.handleChange}
                error={formik.touched.contactName && Boolean(formik.errors.contactName)}
                helperText={formik.touched.contactName && formik.errors.contactName}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="contactPhone"
                name="contactPhone"
                label="联系电话"
                value={formik.values.contactPhone}
                onChange={formik.handleChange}
                error={formik.touched.contactPhone && Boolean(formik.errors.contactPhone)}
                helperText={formik.touched.contactPhone && formik.errors.contactPhone}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="contactEmail"
                name="contactEmail"
                label="联系邮箱"
                type="email"
                value={formik.values.contactEmail}
                onChange={formik.handleChange}
                error={formik.touched.contactEmail && Boolean(formik.errors.contactEmail)}
                helperText={formik.touched.contactEmail && formik.errors.contactEmail}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="address"
                name="address"
                label="地址"
                value={formik.values.address}
                onChange={formik.handleChange}
                error={formik.touched.address && Boolean(formik.errors.address)}
                helperText={formik.touched.address && formik.errors.address}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    id="isActive"
                    name="isActive"
                    checked={formik.values.isActive}
                    onChange={formik.handleChange}
                  />
                }
                label="激活商户"
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

export default MerchantCreateDialog;
