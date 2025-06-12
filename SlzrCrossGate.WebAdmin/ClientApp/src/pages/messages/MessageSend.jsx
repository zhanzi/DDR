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
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Tabs,
  Tab,
  Chip,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  ListItemIcon,
  FormHelperText
} from '@mui/material';
import {
  Send as SendIcon,
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon,
  Info as InfoIcon,
  Code as CodeIcon,
  Memory as MemoryIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { messageAPI, terminalAPI } from '../../services/api';
import { formatDateTime } from '../../utils/dateUtils';
import MerchantAutocomplete from '../../components/MerchantAutocomplete';

const MessageSend = () => {
  const navigate = useNavigate();
  const [sendType, setSendType] = useState('terminal'); // 'terminal', 'line', 'merchant'
  const [messageTypes, setMessageTypes] = useState([]);
  const [terminals, setTerminals] = useState([]);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  // 统一的消息表单
  const [messageForm, setMessageForm] = useState({
    merchantId: '',
    msgTypeCode: '',
    content: '',
    // 终端相关
    terminalIds: [],
    // 线路相关
    lineNo: '',
  });

  // 选中的商户对象（用于MerchantAutocomplete）
  const [selectedMerchant, setSelectedMerchant] = useState(null);

  // 加载消息类型列表
  const loadMessageTypes = async (merchantId = '') => {
    try {
      // 只有在提供了商户ID时才加载消息类型
      if (merchantId) {
        const response = await messageAPI.getAllMessageTypes(merchantId);
        // 直接使用response数组，因为api.js中的响应拦截器已经将response.data解包
        setMessageTypes(response);
        console.log('加载消息类型成功:', response);
      } else {
        // 当没有提供商户ID时，清空消息类型列表
        setMessageTypes([]);
      }
    } catch (error) {
      console.error('Error loading message types:', error);
    }
  };

  // 获取所选消息类型的详细信息
  const getSelectedMessageType = () => {
    if (!messageForm.msgTypeCode || messageTypes.length === 0) return null;
    return messageTypes.find(type => type.code === messageForm.msgTypeCode);
  };

  // 获取编码类型的显示文本
  const getCodeTypeName = (codeType) => {
    switch (codeType) {
      case 1:
        return '文本 (UTF8)';
      case 2:
        return '十六进制 (HEX)';
      default:
        return '未知编码类型';
    }
  };

  // 加载终端列表
  const loadTerminals = async () => {
    try {
      const response = await terminalAPI.getTerminals({ pageSize: 100 });
      setTerminals(response.items);

      // 提取唯一的线路编号
      const uniqueLines = [...new Set(response.items.map(t => t.lineNO))];
      setLines(uniqueLines.map(line => ({ lineNO: line })));
    } catch (error) {
      console.error('Error loading terminals:', error);
    }
  };

  useEffect(() => {
    // 初始化时只加载终端列表，不加载消息类型
    loadTerminals();
  }, []);

  // 处理发送类型变更
  const handleSendTypeChange = (event) => {
    setSendType(event.target.value);
    // 重置表单中与发送类型相关的字段
    setMessageForm(prev => ({
      ...prev,
      terminalIds: [],
      lineNo: ''
    }));
  };

  // 处理表单变更
  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setMessageForm(prev => ({ ...prev, [name]: value }));
  };

  // 处理终端选择
  const handleTerminalSelect = (terminalId) => {
    setMessageForm(prev => {
      const terminalIds = [...prev.terminalIds];
      const index = terminalIds.indexOf(terminalId);

      if (index === -1) {
        terminalIds.push(terminalId);
      } else {
        terminalIds.splice(index, 1);
      }

      return { ...prev, terminalIds };
    });
  };

  // 发送消息
  const sendMessage = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);
    setResult(null);

    try {
      let response;

      if (sendType === 'terminal') {
        // 发送到终端
        response = await messageAPI.sendMessageToTerminals({
          merchantId: messageForm.merchantId,
          terminalIds: messageForm.terminalIds,
          msgTypeCode: messageForm.msgTypeCode,
          content: messageForm.content
        });
      } else if (sendType === 'line') {
        // 发送到线路
        response = await messageAPI.sendMessageToLine({
          merchantId: messageForm.merchantId,
          lineNo: messageForm.lineNo,
          msgTypeCode: messageForm.msgTypeCode,
          content: messageForm.content
        });
      } else {
        // 发送到商户
        response = await messageAPI.sendMessageToMerchant({
          merchantId: messageForm.merchantId,
          msgTypeCode: messageForm.msgTypeCode,
          content: messageForm.content
        });
      }

      setSuccess(true);
      setResult(response);
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error.response?.data || '发送失败');
    } finally {
      setLoading(false);
    }
  };

  // 重置表单
  const resetForm = () => {
    setMessageForm({
      merchantId: '',
      msgTypeCode: '',
      content: '',
      terminalIds: [],
      lineNo: ''
    });
    setSelectedMerchant(null);
    setMessageTypes([]);
    setSuccess(false);
    setError('');
    setResult(null);
  };

  // 验证表单是否可提交
  const isFormValid = () => {
    if (!messageForm.merchantId || !messageForm.msgTypeCode || !messageForm.content) {
      return false;
    }

    if (sendType === 'terminal' && messageForm.terminalIds.length === 0) {
      return false;
    }

    if (sendType === 'line' && !messageForm.lineNo) {
      return false;
    }

    return true;
  };

  return (
    <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/app/messages')}
          >
            返回消息列表
          </Button>
        </Box>

      <Typography variant="h4" gutterBottom>
        发送消息
      </Typography>

      {/* 发送结果 */}
      {success && result && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="subtitle1">
            消息发送成功！
          </Typography>
          <Typography variant="body2">
            消息ID: {result.messageId}
          </Typography>
          <Typography variant="body2">
            接收终端数: {result.terminalCount}
          </Typography>
          <Typography variant="body2">
            消息类型: {result.messageType}
          </Typography>
          <Typography variant="body2">
            发送时间: {formatDateTime(result.sendTime)}
          </Typography>
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* 发送方式选择 */}
          <Grid item xs={12}>
            <FormControl component="fieldset">
              <FormLabel component="legend">发送方式</FormLabel>
              <RadioGroup
                row
                name="sendType"
                value={sendType}
                onChange={handleSendTypeChange}
              >
                <FormControlLabel value="terminal" control={<Radio />} label="发送到终端" />
                <FormControlLabel value="line" control={<Radio />} label="发送到线路" />
                <FormControlLabel value="merchant" control={<Radio />} label="发送到商户" />
              </RadioGroup>
            </FormControl>
          </Grid>

          {/* 商户选择 - 所有发送方式共用 */}
          <Grid item xs={12}>
            <MerchantAutocomplete
              value={selectedMerchant}
              onChange={(event, newValue) => {
                setSelectedMerchant(newValue);
                const merchantId = newValue ? newValue.merchantID : '';
                setMessageForm(prev => ({
                  ...prev,
                  merchantId: merchantId,
                  msgTypeCode: '' // 重置消息类型选择
                }));
                // 重新加载所选商户的消息类型
                loadMessageTypes(merchantId);
              }}
              required
              error={!messageForm.merchantId}
              size="medium"
              helperText={!messageForm.merchantId ? "请先选择商户" : ""}
            />
          </Grid>

          {/* 消息类型选择 - 所有发送方式共用 */}
          <Grid item xs={12}>
            <FormControl fullWidth required error={!messageForm.msgTypeCode}>
              <InputLabel>消息类型</InputLabel>
              <Select
                name="msgTypeCode"
                value={messageForm.msgTypeCode}
                onChange={handleFormChange}
                label="消息类型"
                disabled={!messageForm.merchantId}
              >
                {messageTypes.map((type) => (
                  <MenuItem key={`${type.code}-${type.merchantId}`} value={type.code}>
                    {type.code} - {type.name || '未命名'}
                  </MenuItem>
                ))}
              </Select>
              {!messageForm.msgTypeCode && (
                <FormHelperText error>请选择消息类型</FormHelperText>
              )}
            </FormControl>
          </Grid>

          {/* 消息类型详情 - 所有发送方式共用 */}
          {messageForm.msgTypeCode && (
            <Grid item xs={12}>
              <Card
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  boxShadow: (theme) => `0 6px 16px 0 ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.08)'}`,
                  backdropFilter: 'blur(8px)',
                  background: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(66, 66, 66, 0.8)'
                    : 'rgba(255, 255, 255, 0.9)',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    boxShadow: (theme) => `0 8px 24px 0 ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.12)'}`,
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center' }}>
                    <InfoIcon sx={{ mr: 1, fontSize: '1.2rem' }} /> 消息类型详情
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Box sx={{
                        p: 2,
                        borderRadius: 1,
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(99, 99, 99, 0.15)' : 'rgba(25, 118, 210, 0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%'
                      }}>
                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>编码类型</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500, mt: 1, display: 'flex', alignItems: 'center' }}>
                          {getSelectedMessageType()?.codeType === 1 ? (
                            <><CodeIcon sx={{ mr: 1, color: 'text.secondary' }} /> {getCodeTypeName(getSelectedMessageType()?.codeType)}</>
                          ) : (
                            <><MemoryIcon sx={{ mr: 1, color: 'text.secondary' }} /> {getCodeTypeName(getSelectedMessageType()?.codeType)}</>
                          )}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={8}>
                      <Box sx={{
                        p: 2,
                        borderRadius: 1,
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(99, 99, 99, 0.15)' : 'rgba(25, 118, 210, 0.08)',
                        height: '100%'
                      }}>
                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>备注</Typography>
                        <Typography variant="body1">
                          {getSelectedMessageType()?.remark || '无备注信息'}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12}>
                      <Box sx={{
                        p: 2,
                        borderRadius: 1,
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(99, 99, 99, 0.15)' : 'rgba(25, 118, 210, 0.08)'
                      }}>
                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                          <CodeIcon sx={{ mr: 1, fontSize: '1rem', verticalAlign: 'middle' }} />
                          消息示例
                        </Typography>

                        {getSelectedMessageType()?.exampleMessage ? (
                          <Box
                            component="pre"
                            sx={{
                              p: 2,
                              borderRadius: 1,
                              mt: 1,
                              overflow: 'auto',
                              backgroundColor: (theme) =>
                                theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.8)' : 'rgba(240, 240, 240, 0.8)',
                              fontFamily: 'monospace',
                              fontSize: '0.875rem',
                              border: '1px solid',
                              borderColor: (theme) =>
                                theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                            }}
                          >
                            {getSelectedMessageType()?.exampleMessage}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            未提供消息示例
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* 消息内容 - 所有发送方式共用 */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="消息内容"
              name="content"
              value={messageForm.content}
              onChange={handleFormChange}
              required
              error={!messageForm.content}
              helperText={!messageForm.content ? '请输入消息内容' : ''}
            />
          </Grid>

          {/* 终端选择部分 - 仅发送到终端时显示 */}
          {sendType === 'terminal' && (
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                选择终端 ({messageForm.terminalIds.length} 已选择)
              </Typography>
              <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
                <List dense>
                  {terminals
                    .filter(t => !messageForm.merchantId || t.merchantID === messageForm.merchantId)
                    .map((terminal) => (
                      <ListItem key={terminal.id} button onClick={() => handleTerminalSelect(terminal.id)}>
                        <ListItemIcon>
                          <Checkbox
                            edge="start"
                            checked={messageForm.terminalIds.includes(terminal.id)}
                            tabIndex={-1}
                            disableRipple
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={terminal.deviceNO}
                          secondary={
                            <React.Fragment>
                              <Typography component="span" variant="body2" color="textPrimary">
                                {terminal.id}
                              </Typography>
                              {" — 线路: "}{terminal.lineNO}, 商户: {terminal.merchantID}
                            </React.Fragment>
                          }
                        />
                        {terminal.status && (
                          <Chip
                            label={terminal.status.activeStatus === 0 ? "在线" : "离线"}
                            color={terminal.status.activeStatus === 0 ? "success" : "error"}
                            size="small"
                          />
                        )}
                      </ListItem>
                    ))}
                </List>
              </Paper>
              {sendType === 'terminal' && messageForm.terminalIds.length === 0 && (
                <FormHelperText error>请至少选择一个终端</FormHelperText>
              )}
            </Grid>
          )}

          {/* 线路选择部分 - 仅发送到线路时显示 */}
          {sendType === 'line' && (
            <Grid item xs={12}>
              <FormControl fullWidth required error={!messageForm.lineNo}>
                <InputLabel>线路</InputLabel>
                <Select
                  name="lineNo"
                  value={messageForm.lineNo}
                  onChange={handleFormChange}
                  label="线路"
                  disabled={!messageForm.merchantId}
                >
                  {lines
                    .filter(line => {
                      const terminalInLine = terminals.find(t =>
                        t.lineNO === line.lineNO &&
                        (!messageForm.merchantId || t.merchantID === messageForm.merchantId)
                      );
                      return Boolean(terminalInLine);
                    })
                    .map((line) => (
                      <MenuItem key={line.lineNO} value={line.lineNO}>
                        {line.lineNO}
                      </MenuItem>
                    ))}
                </Select>
                {sendType === 'line' && !messageForm.lineNo && (
                  <FormHelperText error>请选择线路</FormHelperText>
                )}
              </FormControl>
            </Grid>
          )}

          {/* 按钮组 - 所有发送方式共用 */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SendIcon />}
                onClick={sendMessage}
                disabled={loading || !isFormValid()}
              >
                {loading ? <CircularProgress size={24} /> : '发送消息'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={resetForm}
              >
                重置
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default MessageSend;
