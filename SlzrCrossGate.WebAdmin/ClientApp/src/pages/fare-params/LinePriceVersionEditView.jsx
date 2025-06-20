import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  Divider,
  Tabs,
  Tab,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Breadcrumbs,
  Link as MuiLink,
  Backdrop,
  Zoom,
  Fab,
  AppBar,
  Toolbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Tooltip
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Preview,
  Add,
  Delete,
  KeyboardArrowUp
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { linePriceAPI } from '../../services/api';
import DynamicFormGenerator from '../../components/DynamicFormGenerator';
import { useAuth } from '../../contexts/AuthContext';

// 自定义TabPanel组件
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// 线路票价版本编辑组件
const LinePriceVersionEditView = () => {
  const { id, versionId } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  // 明确检查是否为新建模式，防止误解释
  const isNew = versionId === 'new';

  // 状态管理
  const [linePriceInfo, setLinePriceInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  // 添加滚动状态
  const [showBackToTop, setShowBackToTop] = useState(false);

  // 监听滚动事件以显示/隐藏回到顶部按钮
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 回到顶部函数
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  // 表单数据
  const [formData, setFormData] = useState({
    extraParams: {},
    cardDiscountInfo: [] // 改为数组，存储多组卡类配置
  });

  // 组件加载时打印关键信息到控制台，便于调试
  useEffect(() => {
    console.log(`LinePriceVersionEditView 加载 - id: ${id}, versionId: ${versionId}, isNew: ${isNew}`);
  }, [id, versionId, isNew]);

  // 字典配置
  const [extraParamsConfig, setExtraParamsConfig] = useState([]);
  const [cardDiscountConfig, setCardDiscountConfig] = useState([]);

  // 加载线路票价基本信息
  const fetchLinePriceInfo = async () => {
    try {
      const data = await linePriceAPI.getLinePrice(id);
      setLinePriceInfo(data);
      document.title = `${isNew ? '新建' : '编辑'}票价参数版本 - ${data.lineNumber}-${data.groupNumber} - WebAdmin`;
    } catch (error) {
      console.error('获取线路票价信息失败:', error);
      enqueueSnackbar('获取线路票价信息失败', { variant: 'error' });
      navigate(`/app/fare-params/${id}/versions`);
    }
  };
    // 加载字典配置
  const fetchDictionaryConfigs = async (merchantID) => {
    try {
      console.log("加载字典配置 - merchantID:", merchantID);
      if (!merchantID) {
        console.error('商户ID为空，无法加载字典配置');
        return;
      }

      // 加载线路参数字典配置
      const extraParamsConfigResponse = await linePriceAPI.getDictionaryConfig(merchantID,'BUS_LINE_EXTRA_FARE_CONFIG');
      setExtraParamsConfig(extraParamsConfigResponse || []);

      // 加载卡类折扣字典配置
      const cardDiscountConfigResponse = await linePriceAPI.getDictionaryConfig(merchantID,'BUS_ICCARD_FARE_RULE_CONFIG');
      setCardDiscountConfig(cardDiscountConfigResponse || []);
    } catch (error) {
      console.error('获取字典配置失败:', error);
      enqueueSnackbar('获取字典配置失败', { variant: 'error' });
    }
  };

  // 初始化默认值 - 每当字典配置更新时，用默认值填充formData
  useEffect(() => {
    // 如果是编辑模式，不覆盖已有数据
    if (!isNew && versionId !== 'new' && Object.keys(formData.extraParams).length > 0) {
      console.log('编辑模式，不初始化默认值');
      return;
    }

    // 初始化extraParams默认值
    if (extraParamsConfig && extraParamsConfig.length > 0) {
      console.log('初始化extraParams默认值');

      const defaultExtraParams = {};
      extraParamsConfig.forEach(config => {
        // 只有控件类型不是section或divider的才需要初始化值
        if (config.controlType?.toLowerCase() !== 'section' &&
            config.controlType?.toLowerCase() !== 'divider' &&
            config.dictionaryCode) {
          defaultExtraParams[config.dictionaryCode] = config.dictionaryValue ?? '';
        }
      });
        console.log('初始化的默认值:', defaultExtraParams);

      // 合并默认值到现有表单数据
      setFormData(prev => ({
        ...prev,
        extraParams: {
          ...defaultExtraParams,
          ...prev.extraParams // 已有的值优先
        }
      }));
    }
  }, [extraParamsConfig, isNew, versionId]); // 移除 formData.extraParams 依赖，避免循环更新

  // 初始化卡类折扣配置的默认值
  useEffect(() => {
    // 只有在卡类配置加载完成并且没有现有卡类配置数据时才执行
    if (!cardDiscountConfig || cardDiscountConfig.length === 0 || formData.cardDiscountInfo.length > 0) {
      console.log('跳过卡类默认值初始化');
      return;
    }

    console.log('初始化卡类折扣配置默认值');

    // 创建一个包含默认值的初始卡类配置
    const defaultCardConfig = {};
    cardDiscountConfig.forEach(config => {
      // 只处理非分隔符类型的字段
      if (config.controlType?.toLowerCase() !== 'section' &&
          config.controlType?.toLowerCase() !== 'divider' &&
          config.dictionaryCode) {
        // 如果配置有默认值，则添加到新卡类配置中
        if (config.dictionaryValue !== undefined) {
          defaultCardConfig[config.dictionaryCode] = config.dictionaryValue;
        }
      }
    });

    // 只有当默认配置有值时才添加
    if (Object.keys(defaultCardConfig).length > 0) {
      console.log('添加默认卡类配置:', defaultCardConfig);
      setFormData(prev => ({
        ...prev,
        cardDiscountInfo: [defaultCardConfig]
      }));
    }
  }, [cardDiscountConfig]);

    // 如果是编辑现有版本，加载版本数据
  const fetchVersionData = async () => {
    // 如果是新建模式，就不需要加载数据
    if (isNew || versionId === 'new') {
      console.log('新建模式，跳过加载版本数据');
      return;
    }

    try {
      // 确保versionId有效
      if (!versionId) {
        console.error('无效的版本ID:', versionId);
        return;
      }

      const versionData = await linePriceAPI.getLinePriceVersion(versionId);

      // 处理extraParams，确保是对象
      const extraParams = typeof versionData.extraParams === 'string'
        ? JSON.parse(versionData.extraParams || '{}')
        : versionData.extraParams || {};

      // 处理cardDiscountInfo，确保是数组
      let cardDiscountInfo = [];
      if (versionData.cardDiscountInfo) {
        if (typeof versionData.cardDiscountInfo === 'string') {
          try {
            const parsed = JSON.parse(versionData.cardDiscountInfo);
            cardDiscountInfo = Array.isArray(parsed) ? parsed : [parsed];
          } catch (e) {
            console.error('解析卡类折扣数据失败:', e);
            cardDiscountInfo = [];
          }
        } else if (Array.isArray(versionData.cardDiscountInfo)) {
          cardDiscountInfo = versionData.cardDiscountInfo;
        } else if (typeof versionData.cardDiscountInfo === 'object') {
          // 如果是对象但不是数组，则将其转换为包含一个元素的数组
          cardDiscountInfo = [versionData.cardDiscountInfo];
        }
      }

      setFormData({
        extraParams,
        cardDiscountInfo
      });
    } catch (error) {
      console.error('获取版本数据失败:', error);
      enqueueSnackbar('获取版本数据失败', { variant: 'error' });
      navigate(`/app/fare-params/${id}/versions`);
    }
  };

  // 初始化加载
  useEffect(() => {
    // 避免多次执行，使用立即执行的异步函数
    let isMounted = true;
    const initData = async () => {
      if (!isMounted) return;

      setLoading(true);
      console.log('初始化页面 - isNew:', isNew, 'versionId:', versionId);

      try {
        // 先获取线路票价基本信息
        const linePrice = await linePriceAPI.getLinePrice(id);
        if (!isMounted) return;

        setLinePriceInfo(linePrice);
        document.title = `${isNew ? '新建' : '编辑'}票价参数版本 - ${linePrice.lineNumber}-${linePrice.groupNumber} - WebAdmin`;

        // 使用直接获取的linePrice数据，而不等待状态更新
        console.log('获取到线路票价信息:', linePrice);

        // 直接传入merchantID，不依赖状态更新
        await fetchDictionaryConfigs(linePrice.merchantID);
        if (!isMounted) return;

        // 编辑模式 - 加载已有版本
        if (!isNew && versionId !== 'new' && isMounted) {
          // 常规编辑模式
          console.log('编辑模式，加载版本数据');
          await fetchVersionData();
        }

      } catch (error) {
        console.error('初始化数据失败:', error);
        if (isMounted) {
          enqueueSnackbar('初始化数据失败', { variant: 'error' });
          navigate(`/app/fare-params/${id}/versions`);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initData();

    // 清理函数，防止组件卸载后的状态更新
    return () => {
      isMounted = false;
    };
  }, [id, versionId, isNew]);

  // Tab切换处理
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // 处理额外参数表单值变更
  const handleExtraParamsChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      extraParams: {
        ...prev.extraParams,
        [fieldName]: value
      }
    }));
  };

  // 渲染表格单元格的函数
  const renderTableCell = (config, value, onChange) => {
    const { controlType, dictionaryCode, dictionaryLabel, controlConfig } = config;

    // 调试信息：查看控件配置
    if (process.env.NODE_ENV === 'development' && controlConfig) {
      console.log(`控件 ${dictionaryCode} (${controlType}) 配置:`, controlConfig);
    }

    switch (controlType?.toLowerCase()) {
      case 'textbox':
      case 'text':
        return (
          <TextField
            size="small"
            value={value || ''}
            onChange={(e) => onChange(dictionaryCode, e.target.value)}
            placeholder={dictionaryLabel}
            fullWidth
            variant="outlined"
          />
        );

      case 'number':
        return (
          <TextField
            size="small"
            type="number"
            value={value || ''}
            onChange={(e) => onChange(dictionaryCode, e.target.value)}
            placeholder={dictionaryLabel}
            fullWidth
            variant="outlined"
            inputProps={{
              min: controlConfig?.min || 0,
              max: controlConfig?.max || 999999,
              step: controlConfig?.step || 1
            }}
          />
        );

      case 'radio':
        // Radio控件改为下拉选择
        const radioOptions = controlConfig?.options || [];
        return (
          <FormControl size="small" fullWidth>
            <Select
              value={value || ''}
              onChange={(e) => onChange(dictionaryCode, e.target.value)}
              displayEmpty
            >
              <MenuItem value="">
                <em>请选择</em>
              </MenuItem>
              {radioOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'select':
      case 'dropdown':
        const selectOptions = controlConfig?.options || [];
        return (
          <FormControl size="small" fullWidth>
            <Select
              value={value || ''}
              onChange={(e) => onChange(dictionaryCode, e.target.value)}
              displayEmpty
            >
              <MenuItem value="">
                <em>请选择</em>
              </MenuItem>
              {selectOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'switch':
      case 'boolean':
        return (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Switch
              checked={Boolean(value)}
              onChange={(e) => onChange(dictionaryCode, e.target.checked)}
              size="small"
              color="primary"
            />
          </Box>
        );

      case 'checkbox':
        return (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(value)}
                  onChange={(e) => onChange(dictionaryCode, e.target.checked)}
                  size="small"
                  color="primary"
                />
              }
              label=""
              sx={{ m: 0 }}
            />
          </Box>
        );

      default:
        return (
          <TextField
            size="small"
            value={value || ''}
            onChange={(e) => onChange(dictionaryCode, e.target.value)}
            placeholder={dictionaryLabel}
            fullWidth
            variant="outlined"
          />
        );
    }
  };
  // 添加新的卡类折扣配置
  const addCardDiscount = () => {
    // 创建包含默认值的新卡类配置
    const newCardConfig = {};

    // 从配置中提取默认值
    if (cardDiscountConfig && cardDiscountConfig.length > 0) {
      cardDiscountConfig.forEach(config => {
        // 只处理非分隔符类型的字段
        if (config.controlType?.toLowerCase() !== 'section' &&
            config.controlType?.toLowerCase() !== 'divider' &&
            config.dictionaryCode) {
          // 如果配置有默认值，则添加到新卡类配置中
          if (config.dictionaryValue !== undefined) {
            newCardConfig[config.dictionaryCode] = config.dictionaryValue;
          }
        }
      });
    }

    console.log('添加新卡类配置，带默认值:', newCardConfig);

    setFormData(prev => ({
      ...prev,
      cardDiscountInfo: [
        ...prev.cardDiscountInfo,
        newCardConfig // 使用带默认值的对象
      ]
    }));
  };
    // 更新特定卡类折扣配置
  const handleCardDiscountChange = (index, fieldName, value) => {
    setFormData(prev => {
      const newCardDiscountInfo = [...prev.cardDiscountInfo];
      // 确保该索引位置有对象
      if (!newCardDiscountInfo[index]) {
        newCardDiscountInfo[index] = {};
      }
      // 更新特定字段
      newCardDiscountInfo[index] = {
        ...newCardDiscountInfo[index],
        [fieldName]: value
      };
      return {
        ...prev,
        cardDiscountInfo: newCardDiscountInfo
      };
    });
  };
    // 删除对话框状态
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);

  // 打开删除对话框
  const openDeleteDialog = (index) => {
    setDeleteIndex(index);
    setDeleteDialogOpen(true);
  };

  // 关闭删除对话框
  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeleteIndex(null);
  };

  // 删除特定卡类折扣配置
  const removeCardDiscount = (index) => {
    setFormData(prev => {
      const newCardDiscountInfo = [...prev.cardDiscountInfo];
      newCardDiscountInfo.splice(index, 1);
      return {
        ...prev,
        cardDiscountInfo: newCardDiscountInfo
      };
    });

    // 关闭对话框
    closeDeleteDialog();
  };

  // 保存版本数据
  const handleSave = async () => {
    if (!linePriceInfo) return;

    try {
      setSaving(true);

      // 确保包含所有默认值
      const finalExtraParams = { ...formData.extraParams };

      // 再次遍历配置，确保所有字段都有值
      extraParamsConfig.forEach(config => {
        // 只处理非分隔符类型的字段
        if (config.controlType?.toLowerCase() !== 'section' &&
            config.controlType?.toLowerCase() !== 'divider' &&
            config.dictionaryCode) {
          // 如果formData中没有该字段的值，但配置中有默认值，则使用默认值
          if (finalExtraParams[config.dictionaryCode] === undefined &&
              config.dictionaryValue !== undefined) {
            finalExtraParams[config.dictionaryCode] = config.dictionaryValue;
          }
        }
      });

      console.log('保存前的最终extraParams:', finalExtraParams);
        // 处理卡类折扣配置，确保每个卡类都包含默认值
      const finalCardDiscountInfo = formData.cardDiscountInfo.map(cardConfig => {
        const finalCardConfig = { ...cardConfig };

        // 遍历配置，填充默认值
        cardDiscountConfig.forEach(config => {
          // 只处理非分隔符类型的字段
          if (config.controlType?.toLowerCase() !== 'section' &&
              config.controlType?.toLowerCase() !== 'divider' &&
              config.dictionaryCode) {
            // 如果卡类配置中没有该字段的值，但配置中有默认值，则使用默认值
            if (finalCardConfig[config.dictionaryCode] === undefined &&
                config.dictionaryValue !== undefined) {
              finalCardConfig[config.dictionaryCode] = config.dictionaryValue;
            }
          }
        });

        return finalCardConfig;
      });

      console.log('保存前的最终cardDiscountInfo:', finalCardDiscountInfo);

      const requestData = {
        merchantID: linePriceInfo.merchantID,
        extraParams: finalExtraParams,
        cardDiscountInfo: finalCardDiscountInfo
      };

      if (isNew) {
        // 创建新版本
        requestData.linePriceInfoID = linePriceInfo.id;
        await linePriceAPI.createLinePriceVersion(linePriceInfo.id, requestData);
        enqueueSnackbar('创建版本成功', { variant: 'success' });
      } else {
        // 更新现有版本
        await linePriceAPI.updateLinePriceVersion(versionId, requestData);
        enqueueSnackbar('更新版本成功', { variant: 'success' });
      }

      // 保存成功后返回版本列表页
      navigate(`/app/fare-params/${id}/versions`);
    } catch (error) {
      console.error('保存版本失败:', error);
      enqueueSnackbar('保存版本失败: ' + (error.response?.data?.message || error.message), { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };
  // 预览文件内容
  const handlePreview = async () => {
    if (!linePriceInfo) return;

    // 如果是新版本，需要先保存再预览
    if (isNew || versionId === 'new') {
      enqueueSnackbar('请先保存版本后再预览', { variant: 'info' });
      return;
    }

    try {
      // 确保versionId存在且有效
      if (!versionId) {
        enqueueSnackbar('无效的版本ID，无法预览', { variant: 'error' });
        return;
      }

      // 打开新窗口预览
      const previewUrl = `/app/fare-params/${id}/versions/${versionId}/preview`;
      window.open(previewUrl, '_blank');
    } catch (error) {
      console.error('预览失败:', error);
      enqueueSnackbar('预览失败', { variant: 'error' });
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
    <Container maxWidth={false} sx={{ px: 3, maxWidth: '100vw' }}>
      <Backdrop open={saving} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <CircularProgress color="inherit" />
      </Backdrop>

      {/* 回到顶部按钮 */}
      <Zoom in={showBackToTop}>
        <Fab
          color="primary"
          size="small"
          aria-label="回到顶部"
          onClick={scrollToTop}
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 16,
            zIndex: 9
          }}
        >
          <KeyboardArrowUp />
        </Fab>
      </Zoom>

      {/* 悬浮在底部的操作栏 */}
      <AppBar
        position="fixed"
        color="default"
        sx={{
          top: 'auto',
          bottom: 0,
          boxShadow: 3,
          backgroundColor: 'background.paper'
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate(`/app/fare-params/${id}/versions`)}
            sx={{ mr: 1 }}
          >
            返回
          </Button>
          {!isNew && (
            <Button
              startIcon={<Preview />}
              onClick={handlePreview}
              sx={{ mr: 1 }}
              color="info"
            >
              预览
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSave}
            disabled={saving}
          >
            保存
          </Button>
        </Toolbar>
      </AppBar>

      {/* 为底部操作栏添加足够的底部间距 */}
      <Box sx={{ mb: 7 }} />
        <Breadcrumbs sx={{ mb: 2 }}>
        <RouterLink to="/app/fare-params" style={{ color: 'inherit', textDecoration: 'none' }}>
          线路票价管理
        </RouterLink>
        <RouterLink to={`/app/fare-params/${id}/versions`} style={{ color: 'inherit', textDecoration: 'none' }}>
          {`${linePriceInfo.lineNumber}-${linePriceInfo.groupNumber} 版本管理`}
        </RouterLink>
        <Typography color="textPrimary">
          {isNew ? '新建版本' : '编辑版本'}
        </Typography>
      </Breadcrumbs>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Typography variant="h5" gutterBottom>
              {isNew ? '新建票价参数版本' : '编辑票价参数版本'}
            </Typography>
            <Typography color="textSecondary">
              {`线路: ${linePriceInfo.lineNumber}-${linePriceInfo.groupNumber} ${linePriceInfo.lineName} | 商户: ${linePriceInfo.merchantName}`}
            </Typography>
          </div>          <div>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate(`/app/fare-params/${id}/versions`)}
              sx={{ mr: 1 }}
            >
              返回
            </Button>
            {!isNew && (
              <Button
                startIcon={<Preview />}
                onClick={handlePreview}
                sx={{ mr: 1 }}
                color="info"
              >
                预览
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSave}
              disabled={saving}
            >
              保存
            </Button>
          </div>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="票价参数配置">
            <Tab label="额外参数配置" id="tab-0" aria-controls="tabpanel-0" />
            <Tab label="卡类折扣配置" id="tab-1" aria-controls="tabpanel-1" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Typography variant="subtitle1" gutterBottom color="textSecondary">
            设置线路额外参数，如换乘时间、是否支持换乘等
          </Typography>
          <DynamicFormGenerator
            configs={extraParamsConfig}
            values={formData.extraParams}
            onChange={handleExtraParamsChange}
          />
        </TabPanel>
          <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1" gutterBottom color="textSecondary">
              设置各卡类的折扣比例、播报语音等参数
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={addCardDiscount}
              startIcon={<Add />}
              size="small"
            >
              添加卡类
            </Button>
          </Box>

          {formData.cardDiscountInfo.length === 0 ? (
            <Typography color="textSecondary" align="center" sx={{ my: 4 }}>
              暂无卡类配置，请点击"添加卡类"按钮添加一个卡类配置
            </Typography>
          ) : (
            <Paper sx={{ mb: 3, overflow: 'hidden' }}>
              <TableContainer sx={{ maxHeight: 600, overflowX: 'auto', width: '100%' }}>
                <Table size="small" stickyHeader sx={{ minWidth: 'max-content', width: '100%' }}>
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          width: 80,
                          minWidth: 80,
                          fontWeight: 600,
                          backgroundColor: 'background.paper',
                          position: 'sticky',
                          left: 0,
                          zIndex: 3,
                          borderRight: '1px solid',
                          borderColor: 'divider'
                        }}
                      >
                        序号
                      </TableCell>
                      {cardDiscountConfig && cardDiscountConfig.length > 0 ? (
                        cardDiscountConfig
                          .filter(config =>
                            config.controlType?.toLowerCase() !== 'section' &&
                            config.controlType?.toLowerCase() !== 'divider' &&
                            config.dictionaryCode &&
                            config.dictionaryLabel
                          )
                          .map((config) => (
                            <TableCell
                              key={config.dictionaryCode}
                              sx={{
                                minWidth: 180,
                                width: 'auto',
                                fontWeight: 600,
                                backgroundColor: 'background.paper',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              <Tooltip title={config.dictionaryDescription || config.dictionaryLabel}>
                                <span>{config.dictionaryLabel}</span>
                              </Tooltip>
                            </TableCell>
                          ))
                      ) : (
                        <TableCell
                          sx={{
                            minWidth: 180,
                            fontWeight: 600,
                            backgroundColor: 'background.paper',
                            fontStyle: 'italic',
                            color: 'text.secondary'
                          }}
                        >
                          加载中...
                        </TableCell>
                      )}
                      <TableCell
                        sx={{
                          width: 100,
                          minWidth: 100,
                          fontWeight: 600,
                          backgroundColor: 'background.paper',
                          position: 'sticky',
                          right: 0,
                          zIndex: 3,
                          borderLeft: '1px solid',
                          borderColor: 'divider'
                        }}
                      >
                        操作
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formData.cardDiscountInfo.map((cardConfig, index) => (
                      <TableRow key={index} hover>
                        <TableCell
                          sx={{
                            width: 80,
                            minWidth: 80,
                            fontWeight: 500,
                            backgroundColor: 'background.paper',
                            position: 'sticky',
                            left: 0,
                            zIndex: 2,
                            borderRight: '1px solid',
                            borderColor: 'divider'
                          }}
                        >
                          {index + 1}
                        </TableCell>
                        {cardDiscountConfig && cardDiscountConfig.length > 0 ? (
                          cardDiscountConfig
                            .filter(config =>
                              config.controlType?.toLowerCase() !== 'section' &&
                              config.controlType?.toLowerCase() !== 'divider' &&
                              config.dictionaryCode &&
                              config.dictionaryLabel
                            )
                            .map((config) => (
                              <TableCell key={config.dictionaryCode} sx={{ minWidth: 180, width: 'auto' }}>
                                {renderTableCell(
                                  config,
                                  cardConfig[config.dictionaryCode],
                                  (fieldName, value) => handleCardDiscountChange(index, fieldName, value)
                                )}
                              </TableCell>
                            ))
                        ) : (
                          <TableCell sx={{ minWidth: 180, fontStyle: 'italic', color: 'text.secondary' }}>
                            配置加载中...
                          </TableCell>
                        )}
                        <TableCell
                          sx={{
                            width: 100,
                            minWidth: 100,
                            backgroundColor: 'background.paper',
                            position: 'sticky',
                            right: 0,
                            zIndex: 2,
                            borderLeft: '1px solid',
                            borderColor: 'divider'
                          }}
                        >
                          <Tooltip title="删除此卡类配置">
                            <IconButton
                              color="error"
                              onClick={() => openDeleteDialog(index)}
                              size="small"
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          {/* 底部添加卡类按钮 */}
          {formData.cardDiscountInfo.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <Button
                variant="outlined"
                color="primary"
                onClick={addCardDiscount}
                startIcon={<Add />}
                size="medium"
              >
                添加卡类
              </Button>
            </Box>
          )}

          {/* 添加额外底部间距，确保内容不被底部工具栏遮挡 */}
          <Box sx={{ mb: 8 }} />
        </TabPanel>
      </Paper>
      {/* 回到顶部按钮 */}
      <Zoom in={showBackToTop}>
        <Fab
          color="primary"
          size="small"
          onClick={scrollToTop}
          sx={{ position: 'fixed', bottom: 80, right: 16 }}
        >
          <ArrowBack />
        </Fab>
      </Zoom>

      {/* 删除确认对话框 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          elevation: 3,
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }} color="error.main">确认删除</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body1">
            确定要删除第 <b>{deleteIndex !== null ? deleteIndex + 1 : ''}</b> 个卡类配置吗？
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            此操作不可逆，删除后数据将无法恢复。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>取消</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => removeCardDiscount(deleteIndex)}
            startIcon={<Delete />}
          >
            确认删除
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default LinePriceVersionEditView;
