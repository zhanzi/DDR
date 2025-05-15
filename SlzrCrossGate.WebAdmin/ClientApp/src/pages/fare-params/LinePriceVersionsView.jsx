import React, { useState, useEffect  } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  Divider,
  IconButton,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  TextField,
  Grid,
  Breadcrumbs,
  Link,
  CircularProgress
} from '@mui/material';
import {
  Add,
  Edit,
  Visibility,
  CloudUpload,
  FileDownload,
  ArrowBack,
  Delete,
  PlayArrow,
  Check,
  ContentCopy
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { useSnackbar } from 'notistack';
import { linePriceAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

// 线路票价版本列表组件
const LinePriceVersionsView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  
  // 状态管理
  const [linePriceInfo, setLinePriceInfo] = useState(null);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
    // 发布相关状态
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState(null);
  const [publishData, setPublishData] = useState({
    publishType: 1, // 默认发布到商户
    publishTarget: '',
    remark: ''
  });
  
  // 预览相关状态
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState(null);
  
  // 删除和提交确认对话框状态
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [actionVersion, setActionVersion] = useState(null);
  
  // 加载线路票价基本信息
  const fetchLinePriceInfo = async () => {
    try {
      const data = await linePriceAPI.getLinePrice(id);
      setLinePriceInfo(data);
      document.title = `线路票价 ${data.lineNumber}-${data.groupNumber} 版本管理 - WebAdmin`;
    } catch (error) {
      console.error('获取线路票价信息失败:', error);
      enqueueSnackbar('获取线路票价信息失败', { variant: 'error' });
      navigate('/app/fare-params');
    }
  };
  
  // 加载版本列表
  const fetchVersions = async () => {
    try {
      setLoading(true);
      const params = {
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize
      };
      
      const response = await linePriceAPI.getLinePriceVersions(id, params);
      setVersions(response.items || []);
      setTotalCount(response.totalCount || 0);
    } catch (error) {
      console.error('获取版本列表失败:', error);
      enqueueSnackbar('获取版本列表失败', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };
  
  // 初始加载
  useEffect(() => {
    fetchLinePriceInfo();
  }, [id]);
  
  // 加载版本列表
  useEffect(() => {
    if (linePriceInfo) {
      fetchVersions();
    }
  }, [linePriceInfo, paginationModel]);
  
  // 创建新版本
  const handleCreateVersion = () => {
    navigate(`/app/fare-params/${id}/versions/new`);
  };
  
  // 编辑版本
  const handleEditVersion = (versionId) => {
    navigate(`/app/fare-params/${id}/versions/${versionId}`);
  };
    // 预览文件内容
  const handlePreview = async (versionId) => {
    try {
      setSelectedVersionId(versionId);
      const response = await linePriceAPI.previewLinePriceFile(versionId, {
        merchantId: linePriceInfo.merchantID
      });
      setPreviewContent(response.fileContent);
      setPreviewDialogOpen(true);
    } catch (error) {
      console.error('预览文件失败:', error);
      enqueueSnackbar('预览文件失败', { variant: 'error' });
    }
  };  // 基于现有版本创建新版本
  const handleCopyVersion = async (versionId) => {
    try {
      // 显示加载提示
      enqueueSnackbar('正在复制版本数据...', { variant: 'info' });
      
      // 直接调用后端的复制创建接口
      const response = await linePriceAPI.copyLinePriceVersion(versionId);
      console.log('复制创建版本成功:', response);
      
      // 刷新版本列表
      await fetchVersions();
      
      enqueueSnackbar('复制创建新版本成功', { variant: 'success' });
      
      // 导航到编辑页面
      if (response && response.id) {
        navigate(`/app/fare-params/${id}/versions/${response.id}`);
      }
    } catch (error) {
      console.error('复制版本失败:', error);
      enqueueSnackbar('复制版本失败: ' + (error.response?.data?.message || error.message), { variant: 'error' });
    }
  };
    // 打开提交确认对话框
  const openSubmitDialog = (versionId, version) => {
    setActionVersion({id: versionId, version: version});
    setSubmitDialogOpen(true);
  };
  
  // 关闭提交确认对话框
  const closeSubmitDialog = () => {
    setSubmitDialogOpen(false);
    setActionVersion(null);
  };
  
  // 提交版本
  const handleSubmitVersion = async () => {
    if (!actionVersion) return;
    
    try {
      await linePriceAPI.submitLinePriceVersion(actionVersion.id, {
        id: actionVersion.id,
        merchantID: linePriceInfo.merchantID
      });
      enqueueSnackbar('提交成功', { variant: 'success' });
      closeSubmitDialog();
      fetchVersions();
    } catch (error) {
      console.error('提交失败:', error);
      enqueueSnackbar('提交失败: ' + (error.response?.data?.message || error.message), { variant: 'error' });
      closeSubmitDialog();
    }
  };
  
  // 打开删除确认对话框
  const openDeleteDialog = (versionId, version) => {
    setActionVersion({id: versionId, version: version});
    setDeleteDialogOpen(true);
  };
  
  // 关闭删除确认对话框
  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setActionVersion(null);
  };
  
  // 删除版本
  const handleDeleteVersion = async () => {
    if (!actionVersion) return;
    
    try {
      await linePriceAPI.deleteLinePriceVersion(actionVersion.id);
      enqueueSnackbar('删除成功', { variant: 'success' });
      closeDeleteDialog();
      fetchVersions();
    } catch (error) {
      console.error('删除失败:', error);
      enqueueSnackbar('删除失败: ' + (error.response?.data?.message || error.message), { variant: 'error' });
      closeDeleteDialog();
    }
  };
  
  // 打开发布对话框
  const handleOpenPublishDialog = (versionId) => {
    setSelectedVersionId(versionId);
    setPublishData({
      publishType: 1, // 默认发布到商户
      publishTarget: linePriceInfo.merchantID, // 默认目标为当前商户
      remark: ''
    });
    setPublishDialogOpen(true);
  };
  
  // 处理发布对话框输入变更
  const handlePublishInputChange = (event) => {
    const { name, value } = event.target;
    setPublishData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // 提交发布请求
  const handlePublish = async () => {
    try {
      await linePriceAPI.publishLinePriceFile(selectedVersionId, {
        versionID: selectedVersionId,
        merchantID: linePriceInfo.merchantID,
        publishType: parseInt(publishData.publishType),
        publishTarget: publishData.publishTarget,
        remark: publishData.remark
      });
      enqueueSnackbar('发布成功', { variant: 'success' });
      setPublishDialogOpen(false);
      fetchVersions();
    } catch (error) {
      console.error('发布失败:', error);
      enqueueSnackbar('发布失败: ' + (error.response?.data?.message || error.message), { variant: 'error' });
    }
  };
  
  // 版本状态渲染
  const renderStatus = (status, isPublished) => {
    if (isPublished) {
      return <Chip size="small" color="success" label="已发布" />;
    }
    
    switch (status) {
      case 0: // Draft
        return <Chip size="small" color="default" label="草稿" />;
      case 1: // Submitted
        return <Chip size="small" color="primary" label="已提交" />;
      default:
        return <Chip size="small" label="未知状态" />;
    }
  };
  
  // 定义表格列
  const columns = [
    { field: 'version', headerName: '版本号', width: 100 },
    { 
      field: 'status', 
      headerName: '状态', 
      width: 120,
      renderCell: (params) => renderStatus(params.row.status, params.row.isPublished)
    },
    { 
      field: 'createTime', 
      headerName: '创建时间', 
      width: 180,
      valueFormatter: (params) => new Date(params.value).toLocaleString()
    },
    { 
      field: 'creator', 
      headerName: '创建者', 
      width: 120 
    },
    { 
      field: 'submitTime', 
      headerName: '提交时间', 
      width: 180,
      valueFormatter: (params) => params.value ? new Date(params.value).toLocaleString() : '-'
    },
    { 
      field: 'submitter', 
      headerName: '提交者', 
      width: 120,
      valueFormatter: (params) => params.value || '-'
    },
    {
      field: 'actions',
      headerName: '操作',
      width: 250,      renderCell: (params) => (
        <Box>
          {params.row.status === 0 && ( // 草稿状态才可编辑和删除
            <>
              <Tooltip title="编辑">
                <IconButton 
                  onClick={() => handleEditVersion(params.row.id)}
                  color="primary"
                  size="small"
                >
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="提交">
                <IconButton 
                  onClick={() => openSubmitDialog(params.row.id, params.row.version)}
                  color="secondary"
                  size="small"
                >
                  <Check fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="删除">
                <IconButton 
                  onClick={() => openDeleteDialog(params.row.id, params.row.version)}
                  color="error"
                  size="small"
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
          <Tooltip title="预览">
            <IconButton 
              onClick={() => handlePreview(params.row.id)}
              color="info"
              size="small"
            >
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          {params.row.status === 1 && (
          <Tooltip title="复制创建">
            <IconButton 
              onClick={() => handleCopyVersion(params.row.id)}
              color="warning"
              size="small"
            >
              <ContentCopy fontSize="small" />
            </IconButton>
          </Tooltip>)}
        </Box>
      ),
    },
  ];

  if (!linePriceInfo) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link color="inherit" href="#" onClick={() => navigate('/app/fare-params')}>
          线路票价管理
        </Link>
        <Typography color="textPrimary">
          {`${linePriceInfo.lineNumber}-${linePriceInfo.groupNumber} ${linePriceInfo.lineName} 版本管理`}
        </Typography>
      </Breadcrumbs>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h5" gutterBottom>
                  {`${linePriceInfo.lineNumber}-${linePriceInfo.groupNumber} ${linePriceInfo.lineName}`}
                </Typography>
                <Typography color="textSecondary">
                  {`商户: ${linePriceInfo.merchantName} | 当前票价: ${linePriceInfo.fare}分 | 当前版本: ${linePriceInfo.currentVersion || '无'}`}
                </Typography>
              </Box>
              <Box>
                <Button
                  startIcon={<ArrowBack />}
                  onClick={() => navigate('/app/fare-params')}
                  sx={{ mr: 1 }}
                >
                  返回
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleCreateVersion}
                >
                  新建版本
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="h6" gutterBottom>
          版本历史
        </Typography>
        
        <Box sx={{ height: 500, width: '100%' }}>
          <DataGrid
            rows={versions}
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
        </Box>
      </Paper>
      
      {/* 预览对话框 */}
      <Dialog 
        open={previewDialogOpen} 
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>文件预览</DialogTitle>
        <DialogContent>
          <Paper 
            sx={{ 
              p: 2, 
              maxHeight: '60vh', 
              overflowY: 'auto',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              whiteSpace: 'pre-wrap'
            }}
          >
            {previewContent ? (
              <pre>{JSON.stringify(previewContent, null, 2)}</pre>
            ) : (
              <CircularProgress size={20} />
            )}
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>关闭</Button>
        </DialogActions>
      </Dialog>
      
      {/* 发布对话框 */}
      <Dialog 
        open={publishDialogOpen} 
        onClose={() => setPublishDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>发布票价参数文件</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <TextField
              select
              fullWidth
              margin="normal"
              label="发布类型"
              name="publishType"
              value={publishData.publishType}
              onChange={handlePublishInputChange}
            >
              <MenuItem value={1}>发布到商户</MenuItem>
              <MenuItem value={2}>发布到线路</MenuItem>
              <MenuItem value={3}>发布到终端</MenuItem>
            </TextField>
            
            <TextField
              fullWidth
              margin="normal"
              label="发布目标"
              name="publishTarget"
              value={publishData.publishTarget}
              onChange={handlePublishInputChange}
              helperText={
                publishData.publishType === 1 ? '请输入商户ID' :
                publishData.publishType === 2 ? '请输入线路号' :
                '请输入终端ID'
              }
            />
            
            <TextField
              fullWidth
              margin="normal"
              label="发布备注"
              name="remark"
              value={publishData.remark}
              onChange={handlePublishInputChange}
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPublishDialogOpen(false)}>取消</Button>
          <Button 
            variant="contained" 
            onClick={handlePublish}
            startIcon={<CloudUpload />}
          >
            发布
          </Button>        </DialogActions>
      </Dialog>
      
      {/* 提交确认对话框 */}
      <Dialog
        open={submitDialogOpen}
        onClose={closeSubmitDialog}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          elevation: 3,
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>确认提交</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body1">
            确定要提交版本 <b>{actionVersion?.version}</b> 吗？
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            提交后此版本将不能再修改。已提交的版本可用于发布到终端。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeSubmitDialog}>取消</Button>
          <Button 
            variant="contained" 
            color="secondary"
            onClick={handleSubmitVersion}
            startIcon={<Check />}
          >
            确认提交
          </Button>
        </DialogActions>
      </Dialog>
      
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
            确定要删除版本 <b>{actionVersion?.version}</b> 吗？
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
            onClick={handleDeleteVersion}
            startIcon={<Delete />}
          >
            确认删除
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default LinePriceVersionsView;
