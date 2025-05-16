import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Alert,
  AlertTitle,
  Divider,
  Paper
} from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { unionPayTerminalKeyAPI } from '../../services/api';

const UnionPayTerminalKeyImport = ({ open, onClose, onSuccess }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [errors, setErrors] = useState([]);

  // 文件选择处理
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    
    if (!selectedFile) {
      setFile(null);
      return;
    }

    // 检查文件类型
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
      'application/csv' // 某些系统的csv mime类型
    ];
    
    if (!allowedTypes.includes(selectedFile.type)) {
      enqueueSnackbar('只支持Excel或CSV格式的文件', { variant: 'error' });
      event.target.value = null;
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setImportResult(null);
    setErrors([]);
  };

  // 导入文件
  const handleImport = async () => {
    if (!file) {
      enqueueSnackbar('请先选择要导入的文件', { variant: 'warning' });
      return;
    }

    try {
      setUploading(true);
      
      // 创建FormData对象
      const formData = new FormData();
      formData.append('file', file);
      
      // 发送导入请求
      const response = await unionPayTerminalKeyAPI.importUnionPayTerminalKeys(formData);
      
      // 设置导入结果
      setImportResult({
        totalCount: response.totalCount,
        successCount: response.successCount,
        failCount: response.failCount
      });
      
      // 设置错误信息
      if (response.errors && response.errors.length > 0) {
        setErrors(response.errors);
      }
      
      // 根据结果显示提示信息
      if (response.successCount > 0) {
        enqueueSnackbar(`成功导入${response.successCount}条记录`, { variant: 'success' });
        
        // 如果全部成功导入，延迟关闭对话框
        if (response.failCount === 0) {
          setTimeout(() => {
            if (onSuccess) onSuccess();
            onClose();
          }, 1500);
        }
      } else {
        enqueueSnackbar('没有成功导入任何记录', { variant: 'warning' });
      }
    } catch (error) {
      let errorMsg = '导入失败';
      if (error.response && error.response.data && error.response.data.message) {
        errorMsg = error.response.data.message;
      }
      enqueueSnackbar(errorMsg, { variant: 'error' });
    } finally {
      setUploading(false);
    }
  };

  // 下载导入模板
  const handleDownloadTemplate = async () => {
    try {
      const response = await unionPayTerminalKeyAPI.downloadTemplate();
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `银联终端密钥导入模板_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      enqueueSnackbar('导入模板下载成功', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('导入模板下载失败', { variant: 'error' });
    }
  };

  return (
    <Dialog open={open} onClose={!uploading ? onClose : undefined} maxWidth="md" fullWidth>
      <DialogTitle>导入银联终端密钥</DialogTitle>
      <DialogContent>
        <Box mb={3}>
          <Typography variant="body1" gutterBottom>
            请选择Excel文件(.xlsx/.xls)或CSV文件(.csv)进行批量导入，文件内容应包含以下字段：
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="商户ID (必填)" secondary="例如：10000001" />
            </ListItem>
            <ListItem>
              <ListItemText primary="银联商户号 (必填)" secondary="例如：123456789012345" />
            </ListItem>
            <ListItem>
              <ListItemText primary="银联终端号 (必填)" secondary="例如：12345678" />
            </ListItem>
            <ListItem>
              <ListItemText primary="银联终端密钥 (必填)" secondary="例如：0123456789ABCDEF0123456789ABCDEF" />
            </ListItem>
            <ListItem>
              <ListItemText primary="银联商户名称 (可选)" secondary="例如：测试商户" />
            </ListItem>
          </List>
          <Box mt={2}>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleDownloadTemplate}
              disabled={uploading}
            >
              下载导入模板
            </Button>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box 
          sx={{ 
            border: '2px dashed #ccc', 
            borderRadius: 1, 
            py: 4, 
            px: 2, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            mb: 3
          }}
        >
          <input
            accept=".xlsx,.xls,.csv"
            style={{ display: 'none' }}
            id="raised-button-file"
            type="file"
            onChange={handleFileChange}
            disabled={uploading}
          />
          <label htmlFor="raised-button-file">
            <Button
              variant="contained"
              color="primary"
              component="span"
              startIcon={<CloudUploadIcon />}
              disabled={uploading}
            >
              选择文件
            </Button>
          </label>
          <Box mt={2} textAlign="center">
            {file ? (
              <Typography variant="body1">
                已选择文件: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </Typography>
            ) : (
              <Typography variant="body2" color="textSecondary">
                支持.xlsx, .xls, .csv格式
              </Typography>
            )}
          </Box>
        </Box>

        {importResult && (
          <Paper sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5' }}>
            <Typography variant="h6" gutterBottom>导入结果</Typography>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body1">总记录数: {importResult.totalCount}</Typography>
              <Typography variant="body1" color="success.main">成功数: {importResult.successCount}</Typography>
              <Typography variant="body1" color="error.main">失败数: {importResult.failCount}</Typography>
            </Box>
          </Paper>
        )}

        {errors.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <AlertTitle>导入过程中发生以下错误</AlertTitle>
            <List dense>
              {errors.map((error, index) => (
                <ListItem key={index}>
                  <ListItemText primary={error} />
                </ListItem>
              ))}
            </List>
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary" disabled={uploading}>
          关闭
        </Button>
        <Box sx={{ position: 'relative' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleImport}
            disabled={!file || uploading}
          >
            导入
          </Button>
          {uploading && (
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
    </Dialog>
  );
};

export default UnionPayTerminalKeyImport;
