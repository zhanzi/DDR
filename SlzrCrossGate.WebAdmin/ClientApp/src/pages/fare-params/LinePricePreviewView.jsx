import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  CircularProgress,
  Toolbar,
  AppBar,
  Button
} from '@mui/material';
import { FileDownload, ContentCopy } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { linePriceAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

// 线路价格参数文件预览组件
const LinePricePreviewView = () => {
  const { id, versionId } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  
  // 状态管理
  const [loading, setLoading] = useState(true);
  const [fileContent, setFileContent] = useState(null);
  const [linePriceInfo, setLinePriceInfo] = useState(null);
  
  // 加载预览数据
  const fetchPreviewData = async () => {
    try {
      setLoading(true);
      
      // 获取线路票价信息
      const lineInfo = await linePriceAPI.getLinePrice(id);
      setLinePriceInfo(lineInfo);
      
      // 获取文件预览内容
      const response = await linePriceAPI.previewLinePriceFile(versionId, {
        merchantId: lineInfo.merchantID
      });
      
      setFileContent(response.fileContent);
      document.title = `票价参数预览 - ${lineInfo.lineNumber}-${lineInfo.groupNumber} - WebAdmin`;
    } catch (error) {
      console.error('获取预览数据失败:', error);
      enqueueSnackbar('获取预览数据失败', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };
  
  // 初始化加载
  useEffect(() => {
    fetchPreviewData();
  }, [id, versionId]);
  
  // 复制JSON内容到剪贴板
  const handleCopyJson = () => {
    const jsonString = JSON.stringify(fileContent, null, 2);
    navigator.clipboard.writeText(jsonString)
      .then(() => {
        enqueueSnackbar('已复制到剪贴板', { variant: 'success' });
      })
      .catch(() => {
        enqueueSnackbar('复制失败，请手动复制', { variant: 'error' });
      });
  };
  
  // 下载JSON文件
  const handleDownloadJson = () => {
    const jsonString = JSON.stringify(fileContent, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const filename = linePriceInfo 
      ? `PZB${linePriceInfo.lineNumber}${linePriceInfo.groupNumber}_${fileContent.version}.json`
      : 'fare_parameters.json';
      
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" color="default" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {linePriceInfo
              ? `票价参数文件预览 - ${linePriceInfo.lineNumber}-${linePriceInfo.groupNumber} ${linePriceInfo.lineName}`
              : '票价参数文件预览'}
          </Typography>
          <Button 
            startIcon={<ContentCopy />}
            onClick={handleCopyJson}
          >
            复制
          </Button>
          <Button 
            startIcon={<FileDownload />}
            onClick={handleDownloadJson}
            color="primary"
          >
            下载
          </Button>
        </Toolbar>
      </AppBar>
      
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
        <Paper 
          elevation={3}
          sx={{ 
            p: 2, 
            height: '100%',
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            whiteSpace: 'pre-wrap',
            overflow: 'auto'
          }}
        >
          {fileContent ? (
            <pre>{JSON.stringify(fileContent, null, 2)}</pre>
          ) : (
            <Typography color="error" align="center">
              无法加载预览内容
            </Typography>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default LinePricePreviewView;
