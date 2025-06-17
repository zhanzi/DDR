import React from 'react';
import { Box, Button, Container, TextField, MenuItem, Grid, Typography, Paper, Chip, IconButton, Tooltip } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Edit, Delete, Add, Visibility, Refresh, History } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { linePriceAPI } from '../../services/api';
import { useSnackbar } from 'notistack';
import MerchantAutocomplete from '../../components/MerchantAutocomplete';
import { useAuth } from '../../contexts/AuthContext';

// 票价参数列表组件
const LinePriceListView = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();
  
  // 状态管理
  const [linePrices, setLinePrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
    // 过滤条件状态
  const [filters, setFilters] = useState({
    selectedMerchant: user?.roles?.includes('SystemAdmin') ? null : user?.merchantId ? { merchantID: user.merchantId } : null,
    lineNumber: '',
    groupNumber: '',
    isActive: '',
  });
  
  // 获取线路票价列表
  const fetchLinePrices = async () => {
    try {
      setLoading(true);
      const params = {
        lineNumber: filters.lineNumber || undefined,
        groupNumber: filters.groupNumber || undefined,
        isActive: filters.isActive === '' ? undefined : filters.isActive === 'true',
        page: paginationModel.page + 1, // DataGrid页码从0开始，API从1开始
        pageSize: paginationModel.pageSize,
      };

      // 新逻辑：只有当 selectedMerchant 和 merchantID 都有效时才添加 merchantId 参数
      if (filters.selectedMerchant && filters.selectedMerchant.merchantID) {
        params.merchantId = filters.selectedMerchant.merchantID;
      }
      
      const response = await linePriceAPI.getLinePrices(params);
      setLinePrices(response.items || []);
      setTotalCount(response.totalCount || 0);
    } catch (error) {
      console.error('获取线路票价列表失败:', error);
      enqueueSnackbar('获取线路票价列表失败', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };
    // 初始化和分页/过滤条件变更时加载数据
  useEffect(() => {
    fetchLinePrices();
  }, [paginationModel, filters.selectedMerchant]);
  
  // 处理过滤条件变更
  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  // 处理商户选择变更
  const handleMerchantChange = (event, newValue) => {
    setFilters(prev => ({
      ...prev,
      selectedMerchant: newValue // 保存完整的商户对象
    }));
  };
  
  // 应用过滤器
  const applyFilters = () => {
    setPaginationModel(prev => ({ ...prev, page: 0 })); // 重置回第一页
    fetchLinePrices();
  };
  
  // 重置过滤器
  const resetFilters = () => {
    setFilters({
      selectedMerchant: user?.roles?.includes('SystemAdmin') ? null : user?.merchantId ? { merchantID: user.merchantId } : null,
      lineNumber: '',
      groupNumber: '',
      isActive: '',
    });
    setPaginationModel(prev => ({ ...prev, page: 0 }));
  };
  
  // 删除线路票价信息
  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除此线路票价信息吗？')) return;
    
    try {
      await linePriceAPI.deleteLinePrice(id);
      enqueueSnackbar('删除成功', { variant: 'success' });
      fetchLinePrices();
    } catch (error) {
      console.error('删除失败:', error);
      enqueueSnackbar('删除失败: ' + (error.response?.data?.message || error.message), { variant: 'error' });
    }
  };
  
  // 定义表格列
  const columns = [
    { field: 'merchantName', headerName: '商户名称', flex: 1, minWidth: 150 },
    { field: 'lineNumber', headerName: '线路号', width: 100 },
    { field: 'groupNumber', headerName: '组号', width: 80 },
    { field: 'lineName', headerName: '线路名称', flex: 1, minWidth: 150 },
    { 
      field: 'fare', 
      headerName: '票价(分)', 
      width: 100,
      renderCell: (params) => `${params.value}分`
    },
    { 
      field: 'isActive', 
      headerName: '状态', 
      width: 100,
      renderCell: (params) => (
        <Chip 
          label={params.value ? '启用' : '禁用'} 
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      )
    },
    { 
      field: 'currentVersion', 
      headerName: '当前版本', 
      width: 100 
    },
    {
      field: 'actions',
      headerName: '操作',
      width: 200,
      renderCell: (params) => (
        <Box>
          <Tooltip title="编辑基本信息">
            <IconButton 
              onClick={() => navigate(`/app/fare-params/${params.row.id}`)}
              color="primary"
              size="small"
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>          <Tooltip title="查看版本">
            <IconButton 
              onClick={() => navigate(`/app/fare-params/${params.row.id}/versions`)}
              color="info"
              size="small"
            >
              <History fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="删除">
            <IconButton 
              onClick={() => handleDelete(params.row.id)}
              color="error"
              size="small"
            >
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];
  return (
    <Container maxWidth="false">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          线路票价参数管理
        </Typography>
        <Typography variant="body2" color="textSecondary">
          管理线路票价参数，支持创建、编辑、删除和查看版本历史
        </Typography>
      </Box>
      
      {/* 筛选条件 */}      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          {user?.roles?.includes('SystemAdmin') && (
            <Grid item xs={12} md={2}>
              <MerchantAutocomplete
                value={filters.selectedMerchant}
                onChange={handleMerchantChange}
                sx={{ width: '100%' }}
                size="medium"
              />
            </Grid>
          )}
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="线路号"
              name="lineNumber"
              value={filters.lineNumber}
              onChange={handleFilterChange}
              size="medium"
              placeholder="输入4位线路号"
              inputProps={{ maxLength: 4 }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="组号"
              name="groupNumber"
              value={filters.groupNumber}
              onChange={handleFilterChange}
              size="medium"
              placeholder="输入2位组号"
              inputProps={{ maxLength: 2 }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              select
              label="状态"
              name="isActive"
              value={filters.isActive}
              onChange={handleFilterChange}
              size="medium"
            >
              <MenuItem value="">全部</MenuItem>
              <MenuItem value="true">启用</MenuItem>
              <MenuItem value="false">禁用</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                variant="contained" 
                onClick={applyFilters}
                startIcon={<Refresh />}
              >
                筛选
              </Button>
              <Button 
                variant="outlined" 
                onClick={resetFilters}
              >
                重置
              </Button>
              <Button 
                variant="contained" 
                color="secondary"
                startIcon={<Add />}
                onClick={() => navigate('/app/fare-params/new')}
              >
                新建
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* 数据表格 */}
      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={linePrices}
          columns={columns}
          pagination
          paginationMode="server"
          rowCount={totalCount}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          disableColumnFilter
          sx={{
            '& .MuiDataGrid-cell:focus': {
              outline: 'none',
            },
          }}
        />
      </Paper>
    </Container>
  );
};

export default LinePriceListView;
