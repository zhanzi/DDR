import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  FormControlLabel,
  Switch,
  FormHelperText,
  CircularProgress
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import MerchantAutocomplete from '../../components/MerchantAutocomplete';
import { useAuth } from '../../contexts/AuthContext';

// 表单验证模式
const validationSchema = Yup.object({
  merchantID: Yup.string().required('商户ID不能为空'),
  dictionaryType: Yup.string().required('字典类型不能为空'),
  dictionaryCode: Yup.string().required('字典编码不能为空'),
  dictionaryLabel: Yup.string().max(50, '标签最多50个字符'),
  dictionaryValue: Yup.string(),
  extraValue1: Yup.string(),
  extraValue2: Yup.string(),
  sortOrder: Yup.number().integer('排序必须是整数').min(0, '排序不能小于0'),
  description: Yup.string()
});

const DictionaryFormDialog = ({ open, onClose, onSubmit, dictionary, merchants = [] }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const isEditing = Boolean(dictionary);
  const isSystemAdmin = user?.roles?.includes('SystemAdmin');

  // 使用Formik处理表单
  const formik = useFormik({
    initialValues: {
      merchantID: '',
      dictionaryType: '',
      dictionaryCode: '',
      dictionaryLabel: '',
      dictionaryValue: '',
      extraValue1: '',
      extraValue2: '',
      sortOrder: 0,
      isActive: true,
      description: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        await onSubmit(values);
        formik.resetForm();
        onClose();
      } catch (error) {
        console.error('表单提交失败:', error);
      } finally {
        setLoading(false);
      }
    }
  });

  // 当对话框打开或编辑对象变更时重置表单
  useEffect(() => {
    if (open) {
      if (dictionary) {
        // 编辑现有字典
        formik.setValues({
          merchantID: dictionary.merchantID || '',
          dictionaryType: dictionary.dictionaryType || '',
          dictionaryCode: dictionary.dictionaryCode || '',
          dictionaryLabel: dictionary.dictionaryLabel || '',
          dictionaryValue: dictionary.dictionaryValue || '',
          extraValue1: dictionary.extraValue1 || '',
          extraValue2: dictionary.extraValue2 || '',
          sortOrder: dictionary.sortOrder || 0,
          isActive: dictionary.isActive !== undefined ? dictionary.isActive : true,
          description: dictionary.description || ''
        });
      } else {
        // 新建时重置表单
        formik.resetForm();
        // 如果用户是商户管理员，自动设置其商户ID
        if (user && !isSystemAdmin && user.merchantId) {
          formik.setFieldValue('merchantID', user.merchantId);
        }
      }
    }
  }, [dictionary, open, user, isSystemAdmin]);

  const handleMerchantChange = (event, newValue) => {
    formik.setFieldValue('merchantID', newValue ? newValue.merchantID : '');
  };

  // 根据当前的merchantID值在merchants数组中查找对应的商户对象
  const selectedMerchant = merchants.find(m => m.merchantID === formik.values.merchantID) || null;

  return (
    <Dialog 
      open={open} 
      onClose={() => !loading && onClose()}
      fullWidth
      maxWidth="md"
    >
      <form onSubmit={formik.handleSubmit}>
        <DialogTitle>{isEditing ? '编辑字典' : '新建字典'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* 商户选择 */}
            <Grid item xs={12} md={6}>              
                <MerchantAutocomplete
                required
                value={selectedMerchant}
                onChange={handleMerchantChange}
                merchants={merchants}
                disabled={Boolean(isEditing || (!isSystemAdmin && user?.merchantId))}
                error={formik.touched.merchantID && Boolean(formik.errors.merchantID)}
                helperText={formik.touched.merchantID && formik.errors.merchantID}
                size="medium"
              />
            </Grid>

            {/* 字典类型 */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="字典类型"
                name="dictionaryType"
                value={formik.values.dictionaryType}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.dictionaryType && Boolean(formik.errors.dictionaryType)}
                helperText={formik.touched.dictionaryType && formik.errors.dictionaryType}
                required
                disabled={isEditing && !isSystemAdmin}
              />
            </Grid>

            {/* 字典编码 */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="字典编码"
                name="dictionaryCode"
                value={formik.values.dictionaryCode}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.dictionaryCode && Boolean(formik.errors.dictionaryCode)}
                helperText={formik.touched.dictionaryCode && formik.errors.dictionaryCode}
                required
                disabled={isEditing && !isSystemAdmin}
              />
            </Grid>
            
            {/* 字典标签 */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="字典标签"
                name="dictionaryLabel"
                value={formik.values.dictionaryLabel}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.dictionaryLabel && Boolean(formik.errors.dictionaryLabel)}
                helperText={formik.touched.dictionaryLabel && formik.errors.dictionaryLabel}
              />
            </Grid>

            {/* 字典值 */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="字典值"
                name="dictionaryValue"
                value={formik.values.dictionaryValue}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.dictionaryValue && Boolean(formik.errors.dictionaryValue)}
                helperText={formik.touched.dictionaryValue && formik.errors.dictionaryValue}
              />
            </Grid>

            {/* 附加值1 */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="附加值1"
                name="extraValue1"
                value={formik.values.extraValue1}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.extraValue1 && Boolean(formik.errors.extraValue1)}
                helperText={formik.touched.extraValue1 && formik.errors.extraValue1}
              />
            </Grid>

            {/* 附加值2 */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="附加值2"
                name="extraValue2"
                value={formik.values.extraValue2}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.extraValue2 && Boolean(formik.errors.extraValue2)}
                helperText={formik.touched.extraValue2 && formik.errors.extraValue2}
              />
            </Grid>

            {/* 排序顺序 */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="排序顺序"
                name="sortOrder"
                type="number"
                value={formik.values.sortOrder}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.sortOrder && Boolean(formik.errors.sortOrder)}
                helperText={formik.touched.sortOrder && formik.errors.sortOrder}
              />
            </Grid>

            {/* 是否激活 */}
            <Grid item xs={12} md={8}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formik.values.isActive}
                    onChange={(e) => formik.setFieldValue('isActive', e.target.checked)}
                    name="isActive"
                    color="primary"
                  />
                }
                label="启用"
              />
            </Grid>

            {/* 描述 */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="描述"
                name="description"
                multiline
                rows={3}
                value={formik.values.description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.description && Boolean(formik.errors.description)}
                helperText={formik.touched.description && formik.errors.description}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={loading}>
            取消
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading || !formik.isValid}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? '保存中...' : '保存'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default DictionaryFormDialog;
