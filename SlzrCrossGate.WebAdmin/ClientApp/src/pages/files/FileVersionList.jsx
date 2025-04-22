import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  CloudDownload as CloudDownloadIcon,
  Publish as PublishIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { fileAPI } from '../../services/api';
import { format } from 'date-fns';

const FileVersionList = () => {
  const navigate = useNavigate();
  const [fileVersions, setFileVersions] = useState([]);
  const [fileTypes, setFileTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // 筛选条件
  const [filters, setFilters] = useState({
    merchantId: '',
    fileTypeId: '',
    filePara: '',
    ver: ''
  });

  // 上传对话框状态
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    merchantId: '',
    fileTypeId: '',
    filePara: '',
    ver: '',
    file: null
  });
  const [uploadError, setUploadError] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);

  // 删除确认对话框
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [fileVersionToDelete, setFileVersionToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // 加载文件版本列表
  const loadFileVersions = async () => {
    setLoading(true);
    try {
      // 构建查询参数
      const params = {
        page: page + 1,
        pageSize: rowsPerPage,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      };

      const response = await fileAPI.getFileVersions(params);
      setFileVersions(response.items);
      setTotalCount(response.totalCount);
    } catch (error) {
      console.error('Error loading file versions:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载文件类型列表
  const loadFileTypes = async () => {
    try {
      const response = await fileAPI.getFileTypes();
      setFileTypes(response.items);
    } catch (error) {
      console.error('Error loading file types:', error);
    }
  };

  useEffect(() => {
    loadFileVersions();
    loadFileTypes();
  }, [page, rowsPerPage]);

  // 处理筛选条件变更
  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // 应用筛选
  const applyFilters = () => {
    setPage(0);
    loadFileVersions();
  };

  // 清除筛选
  const clearFilters = () => {
    setFilters({
      merchantId: '',
      fileTypeId: '',
      filePara: '',
      ver: ''
    });
    setPage(0);
    loadFileVersions();
  };

  // 处理分页变更
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 打开上传对话框
  const openUploadFileDialog = () => {
    setUploadForm({
      merchantId: '',
      fileTypeId: '',
      filePara: '',
      ver: '',
      file: null
    });
    setUploadError('');
    setOpenUploadDialog(true);
  };

  // 处理上传表单变更
  const handleUploadFormChange = (event) => {
    const { name, value } = event.target;
    setUploadForm(prev => ({ ...prev, [name]: value }));
  };

  // 处理文件选择
  const handleFileSelect = (event) => {
    setUploadForm(prev => ({ ...prev, file: event.target.files[0] }));
  };

  // 上传文件
  const uploadFile = async () => {
    setUploadLoading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('merchantId', uploadForm.merchantId);
      formData.append('fileTypeId', uploadForm.fileTypeId);
      formData.append('filePara', uploadForm.filePara);
      formData.append('ver', uploadForm.ver);
      formData.append('file', uploadForm.file);

      await fileAPI.uploadFile(formData);

      setOpenUploadDialog(false);
      loadFileVersions();
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadError(error.response?.data || '上传失败');
    } finally {
      setUploadLoading(false);
    }
  };

  // 打开删除确认对话框
  const openDeleteConfirmDialog = (fileVersion) => {
    setFileVersionToDelete(fileVersion);
    setOpenDeleteDialog(true);
  };

  // 删除文件版本
  const deleteFileVersion = async () => {
    if (!fileVersionToDelete) return;

    setDeleteLoading(true);
    try {
      await fileAPI.deleteFileVersion(fileVersionToDelete.id);
      setOpenDeleteDialog(false);
      loadFileVersions();
    } catch (error) {
      console.error('Error deleting file version:', error);
      alert(error.response?.data || '删除失败');
    } finally {
      setDeleteLoading(false);
    }
  };

  // 下载文件
  const downloadFile = (fileVersion) => {
    window.open(`/api/file-versions/${fileVersion.id}/download`, '_blank');
  };

  // 跳转到发布页面
  const goToPublish = (fileVersion) => {
    navigate('/app/files/publish', { state: { fileVersion } });
  };

  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        文件版本管理
      </Typography>

      {/* 筛选条件 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="商户ID"
              name="merchantId"
              value={filters.merchantId}
              onChange={handleFilterChange}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="文件类型"
              name="fileTypeId"
              value={filters.fileTypeId}
              onChange={handleFilterChange}
              size="small"
              select
            >
              <MenuItem value="">全部</MenuItem>
              {fileTypes.map((type) => (
                <MenuItem key={`${type.code}-${type.merchantId}`} value={type.code}>
                  {type.code} - {type.name || '未命名'}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="文件参数"
              name="filePara"
              value={filters.filePara}
              onChange={handleFilterChange}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="版本号"
              name="ver"
              value={filters.ver}
              onChange={handleFilterChange}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={1}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              startIcon={<SearchIcon />}
              onClick={applyFilters}
            >
              搜索
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={1}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={clearFilters}
            >
              清除
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* 操作按钮 */}
      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={openUploadFileDialog}
        >
          上传文件
        </Button>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<RefreshIcon />}
          onClick={loadFileVersions}
          sx={{ ml: 1 }}
        >
          刷新
        </Button>
      </Box>

      {/* 文件版本列表 */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>商户ID</TableCell>
                <TableCell>文件类型</TableCell>
                <TableCell>文件参数</TableCell>
                <TableCell>版本号</TableCell>
                <TableCell>文件大小</TableCell>
                <TableCell>CRC校验</TableCell>
                <TableCell>上传时间</TableCell>
                <TableCell>操作人</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : fileVersions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    没有找到文件版本
                  </TableCell>
                </TableRow>
              ) : (
                fileVersions.map((fileVersion) => (
                  <TableRow key={fileVersion.id}>
                    <TableCell>{fileVersion.id}</TableCell>
                    <TableCell>{fileVersion.merchantId}</TableCell>
                    <TableCell>
                      <Tooltip title={fileVersion.fileTypeName || ''}>
                        <span>{fileVersion.fileTypeId}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell>{fileVersion.filePara}</TableCell>
                    <TableCell>{fileVersion.ver}</TableCell>
                    <TableCell>{formatFileSize(fileVersion.fileSize)}</TableCell>
                    <TableCell>{fileVersion.crc}</TableCell>
                    <TableCell>{format(new Date(fileVersion.createTime), 'yyyy-MM-dd HH:mm:ss')}</TableCell>
                    <TableCell>{fileVersion.operator || '-'}</TableCell>
                    <TableCell>
                      <Tooltip title="下载">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => downloadFile(fileVersion)}
                        >
                          <CloudDownloadIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="发布">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => goToPublish(fileVersion)}
                        >
                          <PublishIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="删除">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => openDeleteConfirmDialog(fileVersion)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="每页行数:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} 共 ${count}`}
        />
      </Paper>

      {/* 上传文件对话框 */}
      <Dialog open={openUploadDialog} onClose={() => setOpenUploadDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>上传文件</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="商户ID"
                  name="merchantId"
                  value={uploadForm.merchantId}
                  onChange={handleUploadFormChange}
                  required
                  error={!uploadForm.merchantId}
                  helperText={!uploadForm.merchantId ? '请输入商户ID' : ''}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required error={!uploadForm.fileTypeId}>
                  <InputLabel>文件类型</InputLabel>
                  <Select
                    name="fileTypeId"
                    value={uploadForm.fileTypeId}
                    onChange={handleUploadFormChange}
                    label="文件类型"
                  >
                    {fileTypes
                      .filter(type => !uploadForm.merchantId || type.merchantId === uploadForm.merchantId)
                      .map((type) => (
                        <MenuItem key={`${type.code}-${type.merchantId}`} value={type.code}>
                          {type.code} - {type.name || '未命名'}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="文件参数"
                  name="filePara"
                  value={uploadForm.filePara}
                  onChange={handleUploadFormChange}
                  required
                  error={!uploadForm.filePara}
                  helperText={!uploadForm.filePara ? '请输入文件参数' : ''}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="版本号"
                  name="ver"
                  value={uploadForm.ver}
                  onChange={handleUploadFormChange}
                  required
                  error={!uploadForm.ver}
                  helperText={!uploadForm.ver ? '请输入版本号' : ''}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  sx={{ height: '56px' }}
                >
                  {uploadForm.file ? uploadForm.file.name : '选择文件'}
                  <input
                    type="file"
                    hidden
                    onChange={handleFileSelect}
                  />
                </Button>
                {!uploadForm.file && (
                  <Typography color="error" variant="caption">
                    请选择文件
                  </Typography>
                )}
              </Grid>
            </Grid>
            {uploadError && (
              <Typography color="error" sx={{ mt: 2 }}>
                {uploadError}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUploadDialog(false)}>取消</Button>
          <Button
            onClick={uploadFile}
            variant="contained"
            color="primary"
            disabled={
              uploadLoading ||
              !uploadForm.merchantId ||
              !uploadForm.fileTypeId ||
              !uploadForm.filePara ||
              !uploadForm.ver ||
              !uploadForm.file
            }
          >
            {uploadLoading ? <CircularProgress size={24} /> : '上传'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <Typography>
            确定要删除文件版本 "{fileVersionToDelete?.fileFullType} - {fileVersionToDelete?.ver}" 吗？此操作不可撤销。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>取消</Button>
          <Button
            onClick={deleteFileVersion}
            variant="contained"
            color="error"
            disabled={deleteLoading}
          >
            {deleteLoading ? <CircularProgress size={24} /> : '删除'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FileVersionList;
