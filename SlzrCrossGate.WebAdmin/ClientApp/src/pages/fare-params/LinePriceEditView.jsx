import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Grid,
  Divider,
  FormControlLabel,
  Switch,
  MenuItem,
  Breadcrumbs,
  Link,
  CircularProgress
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { linePriceAPI, merchantAPI } from '../../services/api';
import MerchantAutocomplete from '../../components/MerchantAutocomplete';
import { useAuth } from '../../contexts/AuthContext';
import { parseErrorMessage } from '../../utils/errorHandler';
import { is } from 'date-fns/locale';

// 线路票价信息编辑组件
const LinePriceEditView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();
  const isNew = id === 'new';
  console.log("是否为新建:", isNew);
    // 检查用户商户ID信息
  useEffect(() => {
    console.log("当前用户信息:", user);
    if (user && !user?.roles?.includes('SystemAdmin') && !user.merchantId) {
      enqueueSnackbar('您没有关联的商户，无法创建线路票价信息', { variant: 'error' });
      navigate('/app/fare-params'); // 导航回列表页面，避免卡在无法操作的界面
    }
  }, [user]);
      // 表单数据状态
  const [formData, setFormData] = useState({
    merchantID: '',
    merchantObj: null, // 存储完整的商户对象
    lineNumber: '',
    groupNumber: '',
    lineName: '',
    fare: 200, // 默认票价200分(2元)
    isActive: true,
    remark: ''
  });

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);  // 加载线路票价信息
  useEffect(() => {
    if (!isNew) {
      // 编辑模式，获取详情
      fetchLinePrice();
    } else if (user?.merchantId && !user.roles?.includes('SystemAdmin')) {
      // 如果是新建且用户有商户ID且不是系统管理员，自动加载商户信息
      const loadUserMerchant = async () => {
        try {
          console.log("正在获取商户信息，商户ID:", user.merchantId);
          const merchantResponse = await merchantAPI.getMerchant(user.merchantId);
          if (merchantResponse) {
            console.log("获取到商户信息:", merchantResponse);
            setFormData(prev => ({
              ...prev,
              merchantID: user.merchantId,
              merchantObj: merchantResponse
            }));
          } else {
            console.error('未找到商户信息');
            enqueueSnackbar('未找到商户信息', { variant: 'error' });
          }
        } catch (err) {
          console.error('获取商户信息失败:', err);
          enqueueSnackbar('获取商户信息失败: ' + (err.response?.data?.message || err.message), { variant: 'error' });
        }
      };

      loadUserMerchant();
    } else if (isNew && user?.roles?.includes('SystemAdmin')) {
      // 系统管理员创建新线路票价，加载商户列表
      const loadMerchants = async () => {
        try {
          const response = await merchantAPI.getMerchants({page: 1, pageSize: 10});
          if (response && response.items && response.items.length > 0) {
            console.log("系统管理员可用商户列表:", response.items);
            enqueueSnackbar('请从下拉列表中选择一个商户', { variant: 'info' });
          } else {
            console.error('没有可用的商户');
            enqueueSnackbar('没有可用的商户，请先创建商户', { variant: 'warning' });
          }
        } catch (err) {
          console.error('获取商户列表失败:', err);
        }
      };

      loadMerchants();
    }
  }, [id, isNew, user?.merchantId, user?.roles]);
    // 获取线路票价信息详情
  const fetchLinePrice = async () => {
    try {
      setLoading(true);
      const data = await linePriceAPI.getLinePrice(id);

      // 如果有商户ID，则获取商户详情
      let merchantObj = null;
      if (data.merchantID) {
        try {
          const merchantResponse = await merchantAPI.getMerchant(data.merchantID);
          merchantObj = merchantResponse;
        } catch (err) {
          console.error('获取商户信息失败:', err);
        }
      }

      setFormData({
        merchantID: data.merchantID || '',
        merchantObj: merchantObj,
        lineNumber: data.lineNumber || '',
        groupNumber: data.groupNumber || '',
        lineName: data.lineName || '',
        fare: data.fare || 0,
        isActive: data.isActive,
        remark: data.remark || ''
      });
    } catch (error) {
      console.error('获取线路票价信息失败:', error);
      enqueueSnackbar('获取线路票价信息失败', { variant: 'error' });
      navigate('/app/fare-params');
    } finally {
      setLoading(false);
    }
  };

  // 处理表单字段变化
  const handleChange = (event) => {
    const { name, value, checked, type } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
    // 处理商户选择变更
  const handleMerchantChange = (event, newValue) => {
    setFormData(prev => ({
      ...prev,
      merchantID: newValue?.merchantID || '',
      merchantObj: newValue // 保存完整的商户对象
    }));
  };
  // 表单验证
  const validateForm = () => {
    if (!formData.merchantID || !formData.merchantObj) {
      enqueueSnackbar(user?.roles?.includes('SystemAdmin') ? '系统管理员必须选择一个商户' : '请选择商户', { variant: 'error' });
      return false;
    }

    if (!formData.lineNumber || formData.lineNumber.length !== 4 || !/^\d+$/.test(formData.lineNumber)) {
      enqueueSnackbar('线路号必须为4位数字', { variant: 'error' });
      return false;
    }

    if (!formData.groupNumber || formData.groupNumber.length !== 2 || !/^\d+$/.test(formData.groupNumber)) {
      enqueueSnackbar('组号必须为2位数字', { variant: 'error' });
      return false;
    }

    if (!formData.lineName) {
      enqueueSnackbar('请输入线路名称', { variant: 'error' });
      return false;
    }

    if (formData.fare < 0) {
      enqueueSnackbar('票价不能为负数', { variant: 'error' });
      return false;
    }

    return true;
  };
    // 提交表单
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSaving(true);

      // 准备提交数据，移除merchantObj字段，后端不需要这个字段
      const submitData = {
        merchantID: formData.merchantID,
        lineNumber: formData.lineNumber,
        groupNumber: formData.groupNumber,
        lineName: formData.lineName,
        fare: formData.fare,
        isActive: formData.isActive,
        remark: formData.remark
      };

      if (isNew) {
        await linePriceAPI.createLinePrice(submitData);
        enqueueSnackbar('创建成功', { variant: 'success' });
        navigate('/app/fare-params');
      } else {
        await linePriceAPI.updateLinePrice(id, {
          lineName: formData.lineName,
          fare: formData.fare,
          isActive: formData.isActive,
          remark: formData.remark
        });
        enqueueSnackbar('更新成功', { variant: 'success' });
        navigate('/app/fare-params');
      }
    } catch (error) {
      console.error('保存失败:', error);
      const errorMessage = parseErrorMessage(error, '保存失败');
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link color="inherit" href="#" onClick={() => navigate('/app/fare-params')}>
          线路票价管理
        </Link>
        <Typography color="textPrimary">
          {isNew ? '新建线路票价' : '编辑线路票价'}
        </Typography>
      </Breadcrumbs>

      <Paper sx={{ p: 4 }}>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">
            {isNew ? '新建线路票价信息' : '编辑线路票价信息'}
          </Typography>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/app/fare-params')}
          >
            返回
          </Button>
        </Box>

        <Divider sx={{ mb: 4 }} />

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>            <Grid item xs={12} md={6}>
              <MerchantAutocomplete
                value={formData.merchantObj}
                onChange={handleMerchantChange}
                disabled={!isNew || (!user?.roles?.includes('SystemAdmin') && !!user?.merchantId)}
                required
                error={isNew && !formData.merchantObj}
                helperText={
                  isNew && !formData.merchantObj
                    ? user?.roles?.includes('SystemAdmin')
                      ? "系统管理员请选择一个商户"
                      : "请选择商户"
                    : ""
                }
                size="medium"
                sx={{ width: '100%' }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="线路名称"
                name="lineName"
                value={formData.lineName}
                onChange={handleChange}
                required
                inputProps={{ maxLength: 100 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="线路号(4位数字)"
                name="lineNumber"
                value={formData.lineNumber}
                onChange={handleChange}
                required
                disabled={!isNew}
                inputProps={{ maxLength: 4, pattern: '\\d{4}' }}
                helperText="请输入4位数字"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="组号(2位数字)"
                name="groupNumber"
                value={formData.groupNumber}
                onChange={handleChange}
                required
                disabled={!isNew}
                inputProps={{ maxLength: 2, pattern: '\\d{2}' }}
                helperText="请输入2位数字"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="票价(分)"
                name="fare"
                type="number"
                value={formData.fare}
                onChange={handleChange}
                required
                helperText="请输入票价金额，单位为分，如200表示2元"
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={handleChange}
                    name="isActive"
                    color="primary"
                  />
                }
                label="启用"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="备注"
                name="remark"
                value={formData.remark}
                onChange={handleChange}
                multiline
                rows={3}
                inputProps={{ maxLength: 500 }}
              />
            </Grid>

            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                type="submit"
                disabled={saving}
                startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                sx={{ minWidth: 120 }}
              >
                {saving ? '保存中...' : '保存'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default LinePriceEditView;
