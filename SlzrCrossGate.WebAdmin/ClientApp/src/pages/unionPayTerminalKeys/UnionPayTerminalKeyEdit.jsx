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
  CircularProgress,
  Typography
} from '@mui/material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useSnackbar } from 'notistack';
import { unionPayTerminalKeyAPI } from '../../services/api';

// 编辑银联终端密钥表单验证模式
const validationSchema = yup.object({
  uP_MerchantID: yup.string()
    .required('银联商户号不能为空')
    .max(15, '银联商户号最多15个字符'),
  uP_TerminalID: yup.string()
    .required('银联终端号不能为空')
    .max(8, '银联终端号最多8个字符'),
  uP_Key: yup.string()
    .required('银联终端密钥不能为空')
    .max(32, '银联终端密钥最多32个字符'),
  uP_MerchantName: yup.string()
    .max(50, '银联商户名称最多50个字符')
});

const UnionPayTerminalKeyEdit = ({ open, onClose, onSuccess, keyData }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [submitting, setSubmitting] = useState(false);

  const formik = useFormik({
    initialValues: {
      uP_MerchantID: keyData?.uP_MerchantID || '',
      uP_TerminalID: keyData?.uP_TerminalID || '',
      uP_Key: keyData?.uP_Key || '',
      uP_MerchantName: keyData?.uP_MerchantName || ''
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setSubmitting(true);
        // 将表单数据转换为后端API需要的格式
        const data = {
          uP_MerchantID: values.uP_MerchantID,
          uP_TerminalID: values.uP_TerminalID,
          uP_Key: values.uP_Key,
          uP_MerchantName: values.uP_MerchantName || null
        };
        
        await unionPayTerminalKeyAPI.updateUnionPayTerminalKey(keyData.id, data);
        enqueueSnackbar('银联终端密钥更新成功', { variant: 'success' });
        if (onSuccess) onSuccess();
        onClose();
      } catch (error) {
        let errorMsg = '更新银联终端密钥失败';
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
      <DialogTitle>编辑银联终端密钥</DialogTitle>
      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                商户ID: {keyData?.merchantID} ({keyData?.merchantName || '未知商户'})
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="uP_MerchantID"
                name="uP_MerchantID"
                label="银联商户号"
                value={formik.values.uP_MerchantID}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.uP_MerchantID && Boolean(formik.errors.uP_MerchantID)}
                helperText={formik.touched.uP_MerchantID && formik.errors.uP_MerchantID}
                variant="outlined"
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="uP_TerminalID"
                name="uP_TerminalID"
                label="银联终端号"
                value={formik.values.uP_TerminalID}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.uP_TerminalID && Boolean(formik.errors.uP_TerminalID)}
                helperText={formik.touched.uP_TerminalID && formik.errors.uP_TerminalID}
                variant="outlined"
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="uP_Key"
                name="uP_Key"
                label="银联终端密钥"
                value={formik.values.uP_Key}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.uP_Key && Boolean(formik.errors.uP_Key)}
                helperText={formik.touched.uP_Key && formik.errors.uP_Key}
                variant="outlined"
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="uP_MerchantName"
                name="uP_MerchantName"
                label="银联商户名称"
                value={formik.values.uP_MerchantName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.uP_MerchantName && Boolean(formik.errors.uP_MerchantName)}
                helperText={formik.touched.uP_MerchantName && formik.errors.uP_MerchantName}
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
              保存
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

export default UnionPayTerminalKeyEdit;
