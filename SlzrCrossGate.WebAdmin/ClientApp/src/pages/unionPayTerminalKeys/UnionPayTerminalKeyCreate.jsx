import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  CircularProgress
} from '@mui/material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useSnackbar } from 'notistack';
import { unionPayTerminalKeyAPI } from '../../services/api';
import MerchantAutocomplete from '../../components/MerchantAutocomplete';

// 创建银联终端密钥表单验证模式
const validationSchema = yup.object({
  merchantID: yup.object()
    .nullable()
    .required('商户ID不能为空'),
  up_MerchantID: yup.string()
    .required('银联商户号不能为空')
    .max(15, '银联商户号最多15个字符'),
  up_TerminalID: yup.string()
    .required('银联终端号不能为空')
    .max(8, '银联终端号最多8个字符'),
  up_Key: yup.string()
    .required('银联终端密钥不能为空')
    .max(32, '银联终端密钥最多32个字符'),
  up_MerchantName: yup.string()
    .max(50, '银联商户名称最多50个字符')
});

const UnionPayTerminalKeyCreate = ({ open, onClose, onSuccess }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [submitting, setSubmitting] = useState(false);

  const formik = useFormik({
    initialValues: {
      merchantID: null,
      up_MerchantID: '',
      up_TerminalID: '',
      up_Key: '',
      up_MerchantName: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setSubmitting(true);
        // 将表单数据转换为后端API需要的格式
        const data = {
          merchantID: values.merchantID.merchantID,
          up_MerchantID: values.up_MerchantID,
          up_TerminalID: values.up_TerminalID,
          up_Key: values.up_Key,
          up_MerchantName: values.up_MerchantName || null
        };
        
        await unionPayTerminalKeyAPI.createUnionPayTerminalKey(data);
        enqueueSnackbar('银联终端密钥创建成功', { variant: 'success' });
        if (onSuccess) onSuccess();
        onClose();
      } catch (error) {
        let errorMsg = '创建银联终端密钥失败';
        if (error.response && error.response.data && error.response.data.message) {
          errorMsg = error.response.data.message;
        }
        enqueueSnackbar(errorMsg, { variant: 'error' });
      } finally {
        setSubmitting(false);
      }
    }
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>新增银联终端密钥</DialogTitle>
      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <MerchantAutocomplete
                value={formik.values.merchantID}
                onChange={(event, newValue) => {
                  formik.setFieldValue('merchantID', newValue);
                }}
                required
                error={formik.touched.merchantID && Boolean(formik.errors.merchantID)}
                helperText={formik.touched.merchantID && formik.errors.merchantID}
                size="medium"
                sx={{ width: '100%' }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="up_MerchantID"
                name="up_MerchantID"
                label="银联商户号"
                value={formik.values.up_MerchantID}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.up_MerchantID && Boolean(formik.errors.up_MerchantID)}
                helperText={formik.touched.up_MerchantID && formik.errors.up_MerchantID}
                variant="outlined"
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="up_TerminalID"
                name="up_TerminalID"
                label="银联终端号"
                value={formik.values.up_TerminalID}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.up_TerminalID && Boolean(formik.errors.up_TerminalID)}
                helperText={formik.touched.up_TerminalID && formik.errors.up_TerminalID}
                variant="outlined"
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="up_Key"
                name="up_Key"
                label="银联终端密钥"
                value={formik.values.up_Key}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.up_Key && Boolean(formik.errors.up_Key)}
                helperText={formik.touched.up_Key && formik.errors.up_Key}
                variant="outlined"
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="up_MerchantName"
                name="up_MerchantName"
                label="银联商户名称"
                value={formik.values.up_MerchantName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.up_MerchantName && Boolean(formik.errors.up_MerchantName)}
                helperText={formik.touched.up_MerchantName && formik.errors.up_MerchantName}
                variant="outlined"
                margin="normal"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="primary" disabled={submitting}>
            取消
          </Button>
          <Box sx={{ position: 'relative' }}>
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={submitting}
            >
              创建
            </Button>
            {submitting && (
              <CircularProgress
                size={24}
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  marginTop: '-12px',
                  marginLeft: '-12px',
                }}
              />
            )}
          </Box>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default UnionPayTerminalKeyCreate;
