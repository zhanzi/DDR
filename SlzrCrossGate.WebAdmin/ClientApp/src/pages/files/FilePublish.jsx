import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Alert,
  RadioGroup,
  FormControlLabel,
  Radio
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Publish as PublishIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { fileAPI, terminalAPI } from '../../services/api';
import { format } from 'date-fns';

const FilePublish = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fileVersionFromState = location.state?.fileVersion;

  const [fileVersion, setFileVersion] = useState(fileVersionFromState || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // 发布表单
  const [publishForm, setPublishForm] = useState({
    merchantId: fileVersionFromState?.merchantId || '',
    fileVersionId: fileVersionFromState?.id || '',
    publishType: 'Merchant', // 默认为商户级别发布
    publishTarget: '' // 发布目标（线路或终端）
  });

  // 终端和线路列表
  const [terminals, setTerminals] = useState([]);
  const [lines, setLines] = useState([]);

  // 加载终端列表
  const loadTerminals = async () => {
    if (!publishForm.merchantId) return;

    try {
      const response = await terminalAPI.getTerminals({
        merchantId: publishForm.merchantId,
        pageSize: 100
      });
      setTerminals(response.items);

      // 提取唯一的线路编号
      const uniqueLines = [...new Set(response.items.map(t => t.lineNO))];
      setLines(uniqueLines.map(line => ({ lineNO: line })));
    } catch (error) {
      console.error('Error loading terminals:', error);
    }
  };

  // 加载文件版本详情（如果不是从列表页跳转过来的）
  const loadFileVersion = async () => {
    if (!publishForm.fileVersionId) return;

    try {
      const response = await fileAPI.getFileVersion(publishForm.fileVersionId);
      setFileVersion(response);
      setPublishForm(prev => ({ ...prev, merchantId: response.merchantId }));
    } catch (error) {
      console.error('Error loading file version:', error);
      setError('加载文件版本失败');
    }
  };

  useEffect(() => {
    if (fileVersionFromState) {
      loadTerminals();
    } else if (publishForm.fileVersionId) {
      loadFileVersion();
    }
  }, []);

  useEffect(() => {
    loadTerminals();
  }, [publishForm.merchantId]);

  // 处理表单变更
  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setPublishForm(prev => ({ ...prev, [name]: value }));

    // 如果切换了发布类型，清空发布目标
    if (name === 'publishType') {
      setPublishForm(prev => ({ ...prev, publishTarget: '' }));
    }
  };

  // 发布文件
  const publishFile = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await fileAPI.createFilePublish({
        merchantId: publishForm.merchantId,
        fileVersionId: publishForm.fileVersionId,
        publishType: publishForm.publishType,
        publishTarget: publishForm.publishTarget
      });

      setSuccess(true);
      // 3秒后返回列表页
      setTimeout(() => {
        navigate('/app/files/publish-list');
      }, 3000);
    } catch (error) {
      console.error('Error publishing file:', error);
      setError(error.response?.data || '发布失败');
    } finally {
      setLoading(false);
    }
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          文件发布
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/app/files/versions')}
        >
          返回文件版本列表
        </Button>
      </Box>

      {/* 文件版本信息 */}
      {fileVersion ? (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              文件版本信息
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle2" color="textSecondary">文件类型</Typography>
                <Typography variant="body1">{fileVersion.fileTypeId} - {fileVersion.fileTypeName || ''}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle2" color="textSecondary">文件参数</Typography>
                <Typography variant="body1">{fileVersion.filePara}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle2" color="textSecondary">版本号</Typography>
                <Typography variant="body1">{fileVersion.ver}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle2" color="textSecondary">文件大小</Typography>
                <Typography variant="body1">{formatFileSize(fileVersion.fileSize)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle2" color="textSecondary">CRC校验</Typography>
                <Typography variant="body1">{fileVersion.crc}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle2" color="textSecondary">上传时间</Typography>
                <Typography variant="body1">{format(new Date(fileVersion.createTime), 'yyyy-MM-dd HH:mm:ss')}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle2" color="textSecondary">操作人</Typography>
                <Typography variant="body1">{fileVersion.operator || '-'}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ) : (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            选择文件版本
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="文件版本ID"
                name="fileVersionId"
                value={publishForm.fileVersionId}
                onChange={handleFormChange}
                required
                error={!publishForm.fileVersionId}
                helperText={!publishForm.fileVersionId ? '请输入文件版本ID' : ''}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                onClick={loadFileVersion}
                disabled={!publishForm.fileVersionId}
              >
                加载文件版本
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* 发布设置 */}
      {fileVersion && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            发布设置
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  发布类型
                </Typography>
                <RadioGroup
                  name="publishType"
                  value={publishForm.publishType}
                  onChange={handleFormChange}
                  row
                >
                  <FormControlLabel value="Merchant" control={<Radio />} label="商户级别" />
                  <FormControlLabel value="Line" control={<Radio />} label="线路级别" />
                  <FormControlLabel value="Terminal" control={<Radio />} label="终端级别" />
                </RadioGroup>
              </FormControl>
            </Grid>

            {publishForm.publishType === 'Line' && (
              <Grid item xs={12}>
                <FormControl fullWidth required error={!publishForm.publishTarget}>
                  <InputLabel>线路</InputLabel>
                  <Select
                    name="publishTarget"
                    value={publishForm.publishTarget}
                    onChange={handleFormChange}
                    label="线路"
                  >
                    {lines.map((line) => (
                      <MenuItem key={line.lineNO} value={line.lineNO}>
                        {line.lineNO}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {publishForm.publishType === 'Terminal' && (
              <Grid item xs={12}>
                <FormControl fullWidth required error={!publishForm.publishTarget}>
                  <InputLabel>终端</InputLabel>
                  <Select
                    name="publishTarget"
                    value={publishForm.publishTarget}
                    onChange={handleFormChange}
                    label="终端"
                  >
                    {terminals.map((terminal) => (
                      <MenuItem key={terminal.id} value={terminal.id}>
                        {terminal.id} - {terminal.deviceNO} ({terminal.lineNO})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>

          <Divider sx={{ my: 2 }} />

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              文件发布成功！3秒后将返回发布列表页...
            </Alert>
          )}

          <Button
            variant="contained"
            color="primary"
            startIcon={<PublishIcon />}
            onClick={publishFile}
            disabled={
              loading ||
              !fileVersion ||
              (publishForm.publishType !== 'Merchant' && !publishForm.publishTarget)
            }
          >
            {loading ? <CircularProgress size={24} /> : '发布文件'}
          </Button>
        </Paper>
      )}
    </Box>
  );
};

export default FilePublish;
