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
  Radio,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Publish as PublishIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  List as ListIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { fileAPI, terminalAPI } from '../../services/api';
import { formatDateTime } from '../../utils/dateUtils';

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
    merchantId: fileVersionFromState?.merchantID || '',
    fileVersionId: fileVersionFromState?.id || '',
    publishType: 1, // 修改为数值0，对应Merchant类型
    publishTarget: '' // 发布目标（线路或终端）
  });

  // 终端和线路列表
  const [terminals, setTerminals] = useState([]);
  const [lines, setLines] = useState([]);

  // 线路选择对话框
  const [lineDialog, setLineDialog] = useState(false);
  const [selectedLine, setSelectedLine] = useState(null);
  const [lineStats, setLineStats] = useState([]);
  const [lineLoading, setLineLoading] = useState(false);
  const [linePage, setLinePage] = useState(0);
  const [lineRowsPerPage, setLineRowsPerPage] = useState(10);
  const [lineTotalCount, setLineTotalCount] = useState(0);

  // 终端选择对话框
  const [terminalDialog, setTerminalDialog] = useState(false);
  const [selectedTerminal, setSelectedTerminal] = useState(null);
  const [terminalLoading, setTerminalLoading] = useState(false);
  const [terminalPage, setTerminalPage] = useState(0);
  const [terminalRowsPerPage, setTerminalRowsPerPage] = useState(10);
  const [terminalTotalCount, setTerminalTotalCount] = useState(0);
  const [terminalFilters, setTerminalFilters] = useState({
    lineNo: '',
    machineId: '',
    deviceNo: '',
    terminalType: ''
  });

  // 加载线路统计信息
  const loadLineStats = async () => {
    if (!publishForm.merchantId) return;

    setLineLoading(true);
    try {
      const response = await terminalAPI.getLineStats({
        merchantId: publishForm.merchantId,
        page: linePage + 1,
        pageSize: lineRowsPerPage
      });

      setLineStats(response.items || []);
      setLineTotalCount(response.totalCount || 0);
    } catch (error) {
      console.error('Error loading line stats:', error);
    } finally {
      setLineLoading(false);
    }
  };

  // 加载终端列表（用于终端选择对话框）
  const loadTerminalsForDialog = async () => {
    if (!publishForm.merchantId) return;

    setTerminalLoading(true);
    try {
      const params = {
        merchantId: publishForm.merchantId,
        page: terminalPage + 1,
        pageSize: terminalRowsPerPage,
        ...Object.fromEntries(
          Object.entries(terminalFilters).filter(([_, value]) => value !== '')
        )
      };

      const response = await terminalAPI.getTerminals(params);
      setTerminals(response.items);
      setTerminalTotalCount(response.totalCount);
    } catch (error) {
      console.error('Error loading terminals:', error);
    } finally {
      setTerminalLoading(false);
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
      // 从文件版本列表页跳转过来的，不需要额外加载
    } else if (publishForm.fileVersionId) {
      loadFileVersion();
    }
  }, []);

  // 处理线路选择相关函数
  const openLineDialog = () => {
    setLineDialog(true);
    setLinePage(0);
    loadLineStats();
  };

  const handleSelectLine = (line) => {
    setSelectedLine(line);
    setPublishForm(prev => ({ ...prev, publishTarget: line.lineNO }));
    setLineDialog(false);
  };

  const handleLinePageChange = (_, newPage) => {
    setLinePage(newPage);
  };

  const handleLineRowsPerPageChange = (event) => {
    setLineRowsPerPage(parseInt(event.target.value, 10));
    setLinePage(0);
  };

  // 处理终端选择相关函数
  const openTerminalDialog = () => {
    setTerminalDialog(true);
    setTerminalPage(0);
    setTerminalFilters({
      lineNo: '',
      machineId: '',
      deviceNo: '',
      terminalType: ''
    });
    loadTerminalsForDialog();
  };

  const handleSelectTerminal = (terminal) => {
    setSelectedTerminal(terminal);
    setPublishForm(prev => ({ ...prev, publishTarget: terminal.id.toString() }));
    setTerminalDialog(false);
  };

  const handleTerminalPageChange = (_, newPage) => {
    setTerminalPage(newPage);
  };

  const handleTerminalRowsPerPageChange = (event) => {
    setTerminalRowsPerPage(parseInt(event.target.value, 10));
    setTerminalPage(0);
  };

  const handleTerminalFilterChange = (event) => {
    const { name, value } = event.target;
    setTerminalFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyTerminalFilters = () => {
    setTerminalPage(0);
    loadTerminalsForDialog();
  };

  const clearTerminalFilters = () => {
    setTerminalFilters({
      lineNo: '',
      machineId: '',
      deviceNo: '',
      terminalType: ''
    });
    setTerminalPage(0);
    loadTerminalsForDialog();
  };

  // 监听线路分页变化
  useEffect(() => {
    if (lineDialog && publishForm.merchantId) {
      loadLineStats();
    }
  }, [linePage, lineRowsPerPage]);

  // 监听终端分页和筛选变化
  useEffect(() => {
    if (terminalDialog && publishForm.merchantId) {
      loadTerminalsForDialog();
    }
  }, [terminalPage, terminalRowsPerPage]);

  // 处理表单变更
  const handleFormChange = (event) => {
    const { name, value } = event.target;

    // 确保publishType是数字类型
    if (name === 'publishType') {
      // 将值转换为数字
      const numericValue = parseInt(value, 10);
      setPublishForm(prev => ({
        ...prev,
        [name]: numericValue,
        publishTarget: '' // 清空发布目标
      }));
    } else {
      setPublishForm(prev => ({ ...prev, [name]: value }));
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

  // 获取终端状态芯片
  const getStatusChip = (status) => {
    if (!status) return <Chip label="未知" color="default" size="small" />;

    // 判断是否在线（5分钟内活跃且状态为激活）
    const isOnline = status.activeStatus === 1 &&
      status.lastActiveTime &&
      new Date() - new Date(status.lastActiveTime) < 5 * 60 * 1000;

    if (isOnline) {
      return <Chip label="在线" color="success" size="small" />;
    } else {
      return <Chip label="离线" color="error" size="small" />;
    }
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
                <Typography variant="subtitle2" color="textSecondary">商户</Typography>
                <Typography variant="body1">{fileVersion.merchantName || '-'}({fileVersion.merchantID || '-'})</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle2" color="textSecondary">文件类型</Typography>
                <Typography variant="body1"> {fileVersion.fileTypeName || ''}({fileVersion.fileTypeID})</Typography>
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
                <Typography variant="body1">{formatDateTime(fileVersion.createTime)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle2" color="textSecondary">上传人</Typography>
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
                  <FormControlLabel value={1} control={<Radio />} label="商户级别" />
                  <FormControlLabel value={2} control={<Radio />} label="线路级别" />
                  <FormControlLabel value={3} control={<Radio />} label="终端级别" />
                </RadioGroup>
              </FormControl>
            </Grid>

            {publishForm.publishType === 2 && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  选择线路
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<ListIcon />}
                    onClick={openLineDialog}
                    sx={{ minWidth: 200 }}
                  >
                    {selectedLine ? `线路: ${selectedLine.lineNO}` : '选择线路'}
                  </Button>
                  {selectedLine && (
                    <Typography variant="body2" color="textSecondary">
                      在线: {selectedLine.onlineCount} | 离线: {selectedLine.offlineCount} | 总计: {selectedLine.totalCount}
                    </Typography>
                  )}
                </Box>
                {publishForm.publishType === 2 && !publishForm.publishTarget && (
                  <Typography variant="caption" color="error">
                    请选择线路
                  </Typography>
                )}
              </Grid>
            )}

            {publishForm.publishType === 3 && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  选择终端
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<ListIcon />}
                    onClick={openTerminalDialog}
                    sx={{ minWidth: 200 }}
                  >
                    {selectedTerminal ? `终端: ${selectedTerminal.deviceNO}` : '选择终端'}
                  </Button>
                  {selectedTerminal && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" color="textSecondary">
                        ID: {selectedTerminal.id} | 线路: {selectedTerminal.lineNO} | 序列号: {selectedTerminal.machineID}
                      </Typography>
                      {getStatusChip(selectedTerminal.status)}
                    </Box>
                  )}
                </Box>
                {publishForm.publishType === 3 && !publishForm.publishTarget && (
                  <Typography variant="caption" color="error">
                    请选择终端
                  </Typography>
                )}
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
              (publishForm.publishType !== 1 && !publishForm.publishTarget)
            }
          >
            {loading ? <CircularProgress size={24} /> : '发布文件'}
          </Button>
        </Paper>
      )}

      {/* 线路选择对话框 */}
      <Dialog open={lineDialog} onClose={() => setLineDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>选择线路</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              商户: {fileVersion?.merchantName}({fileVersion?.merchantID})
            </Typography>

            <Paper>
              <TableContainer sx={{ maxHeight: 400 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>线路编号</TableCell>
                      <TableCell>总终端数</TableCell>
                      <TableCell>在线终端数</TableCell>
                      <TableCell>离线终端数</TableCell>
                      <TableCell>操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lineLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <CircularProgress size={24} />
                        </TableCell>
                      </TableRow>
                    ) : lineStats.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          没有找到线路信息
                        </TableCell>
                      </TableRow>
                    ) : (
                      lineStats.map((line) => (
                        <TableRow
                          key={line.lineNO}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => handleSelectLine(line)}
                        >
                          <TableCell>{line.lineNO}</TableCell>
                          <TableCell>{line.totalCount}</TableCell>
                          <TableCell>
                            <Chip
                              label={line.onlineCount}
                              color="success"
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={line.offlineCount}
                              color="error"
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectLine(line);
                              }}
                            >
                              选择
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={lineTotalCount}
                rowsPerPage={lineRowsPerPage}
                page={linePage}
                onPageChange={handleLinePageChange}
                onRowsPerPageChange={handleLineRowsPerPageChange}
                labelRowsPerPage="每页行数:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} 共 ${count}`}
              />
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLineDialog(false)}>取消</Button>
        </DialogActions>
      </Dialog>

      {/* 终端选择对话框 */}
      <Dialog open={terminalDialog} onClose={() => setTerminalDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>选择终端</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              商户: {fileVersion?.merchantName}({fileVersion?.merchantID})
            </Typography>

            {/* 筛选条件 */}
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>筛选条件</Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="线路编号"
                    name="lineNo"
                    value={terminalFilters.lineNo}
                    onChange={handleTerminalFilterChange}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="出厂序列号"
                    name="machineId"
                    value={terminalFilters.machineId}
                    onChange={handleTerminalFilterChange}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="设备编号"
                    name="deviceNo"
                    value={terminalFilters.deviceNo}
                    onChange={handleTerminalFilterChange}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="终端类型"
                    name="terminalType"
                    value={terminalFilters.terminalType}
                    onChange={handleTerminalFilterChange}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<SearchIcon />}
                      onClick={applyTerminalFilters}
                    >
                      搜索
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<ClearIcon />}
                      onClick={clearTerminalFilters}
                    >
                      清除
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* 终端列表 */}
            <Paper>
              <TableContainer sx={{ maxHeight: 400 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>终端ID</TableCell>
                      <TableCell>设备编号</TableCell>
                      <TableCell>线路编号</TableCell>
                      <TableCell>出厂序列号</TableCell>
                      <TableCell>终端类型</TableCell>
                      <TableCell>状态</TableCell>
                      <TableCell>操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {terminalLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <CircularProgress size={24} />
                        </TableCell>
                      </TableRow>
                    ) : terminals.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          没有找到终端
                        </TableCell>
                      </TableRow>
                    ) : (
                      terminals.map((terminal) => (
                        <TableRow
                          key={terminal.id}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => handleSelectTerminal(terminal)}
                        >
                          <TableCell>{terminal.id}</TableCell>
                          <TableCell>{terminal.deviceNO}</TableCell>
                          <TableCell>{terminal.lineNO}</TableCell>
                          <TableCell>{terminal.machineID}</TableCell>
                          <TableCell>{terminal.terminalType}</TableCell>
                          <TableCell>{getStatusChip(terminal.status)}</TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectTerminal(terminal);
                              }}
                            >
                              选择
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={terminalTotalCount}
                rowsPerPage={terminalRowsPerPage}
                page={terminalPage}
                onPageChange={handleTerminalPageChange}
                onRowsPerPageChange={handleTerminalRowsPerPageChange}
                labelRowsPerPage="每页行数:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} 共 ${count}`}
              />
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTerminalDialog(false)}>取消</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FilePublish;
