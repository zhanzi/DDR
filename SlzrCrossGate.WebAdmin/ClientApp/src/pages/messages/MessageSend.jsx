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
  Tabs,
  Tab,
  Chip,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  ListItemIcon
} from '@mui/material';
import {
  Send as SendIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';

const MessageSend = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0); // 0: 终端, 1: 线路, 2: 商户
  const [messageTypes, setMessageTypes] = useState([]);
  const [terminals, setTerminals] = useState([]);
  const [lines, setLines] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  // 终端发送表单
  const [terminalForm, setTerminalForm] = useState({
    terminalIds: [],
    msgTypeCode: '',
    content: ''
  });

  // 线路发送表单
  const [lineForm, setLineForm] = useState({
    merchantId: '',
    lineNo: '',
    msgTypeCode: '',
    content: ''
  });

  // 商户发送表单
  const [merchantForm, setMerchantForm] = useState({
    merchantId: '',
    msgTypeCode: '',
    content: ''
  });

  // 加载消息类型
  const loadMessageTypes = async () => {
    try {
      const response = await axios.get('/api/MessageTypes');
      setMessageTypes(response.data.items);
    } catch (error) {
      console.error('Error loading message types:', error);
    }
  };

  // 加载终端列表
  const loadTerminals = async () => {
    try {
      const response = await axios.get('/api/Terminals', { params: { pageSize: 100 } });
      setTerminals(response.data.items);

      // 提取唯一的线路编号
      const uniqueLines = [...new Set(response.data.items.map(t => t.lineNO))];
      setLines(uniqueLines.map(line => ({ lineNO: line })));

      // 提取唯一的商户ID
      const uniqueMerchants = [...new Set(response.data.items.map(t => t.merchantID))];
      setMerchants(uniqueMerchants.map(id => ({ id })));
    } catch (error) {
      console.error('Error loading terminals:', error);
    }
  };

  useEffect(() => {
    loadMessageTypes();
    loadTerminals();
  }, []);

  // 处理标签页变更
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setSuccess(false);
    setError('');
    setResult(null);
  };

  // 处理终端表单变更
  const handleTerminalFormChange = (event) => {
    const { name, value } = event.target;
    setTerminalForm(prev => ({ ...prev, [name]: value }));
  };

  // 处理终端选择
  const handleTerminalSelect = (terminalId) => {
    setTerminalForm(prev => {
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

  // 处理线路表单变更
  const handleLineFormChange = (event) => {
    const { name, value } = event.target;
    setLineForm(prev => ({ ...prev, [name]: value }));
  };

  // 处理商户表单变更
  const handleMerchantFormChange = (event) => {
    const { name, value } = event.target;
    setMerchantForm(prev => ({ ...prev, [name]: value }));
  };

  // 发送消息到终端
  const sendMessageToTerminals = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);
    setResult(null);

    try {
      const response = await axios.post('/api/Messages/Send', terminalForm);
      setSuccess(true);
      setResult(response.data);
    } catch (error) {
      console.error('Error sending message to terminals:', error);
      setError(error.response?.data || '发送失败');
    } finally {
      setLoading(false);
    }
  };

  // 发送消息到线路
  const sendMessageToLine = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);
    setResult(null);

    try {
      const response = await axios.post('/api/Messages/SendByLine', lineForm);
      setSuccess(true);
      setResult(response.data);
    } catch (error) {
      console.error('Error sending message to line:', error);
      setError(error.response?.data || '发送失败');
    } finally {
      setLoading(false);
    }
  };

  // 发送消息到商户
  const sendMessageToMerchant = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);
    setResult(null);

    try {
      const response = await axios.post('/api/Messages/SendToMerchant', merchantForm);
      setSuccess(true);
      setResult(response.data);
    } catch (error) {
      console.error('Error sending message to merchant:', error);
      setError(error.response?.data || '发送失败');
    } finally {
      setLoading(false);
    }
  };

  // 发送消息
  const sendMessage = () => {
    if (tabValue === 0) {
      sendMessageToTerminals();
    } else if (tabValue === 1) {
      sendMessageToLine();
    } else {
      sendMessageToMerchant();
    }
  };

  // 重置表单
  const resetForm = () => {
    if (tabValue === 0) {
      setTerminalForm({
        terminalIds: [],
        msgTypeCode: '',
        content: ''
      });
    } else if (tabValue === 1) {
      setLineForm({
        merchantId: '',
        lineNo: '',
        msgTypeCode: '',
        content: ''
      });
    } else {
      setMerchantForm({
        merchantId: '',
        msgTypeCode: '',
        content: ''
      });
    }

    setSuccess(false);
    setError('');
    setResult(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        发送消息
      </Typography>

      {/* 标签页 */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="发送到终端" />
          <Tab label="发送到线路" />
          <Tab label="发送到商户" />
        </Tabs>
      </Paper>

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
            发送时间: {format(new Date(result.sendTime), 'yyyy-MM-dd HH:mm:ss')}
          </Typography>
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 终端发送表单 */}
      {tabValue === 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            发送到终端
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth required error={!terminalForm.msgTypeCode}>
                <InputLabel>消息类型</InputLabel>
                <Select
                  name="msgTypeCode"
                  value={terminalForm.msgTypeCode}
                  onChange={handleTerminalFormChange}
                  label="消息类型"
                >
                  {messageTypes.map((type) => (
                    <MenuItem key={`${type.code}-${type.merchantId}`} value={type.code}>
                      {type.code} - {type.name || '未命名'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="消息内容"
                name="content"
                value={terminalForm.content}
                onChange={handleTerminalFormChange}
                required
                error={!terminalForm.content}
                helperText={!terminalForm.content ? '请输入消息内容' : ''}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                选择终端 ({terminalForm.terminalIds.length} 已选择)
              </Typography>
              <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
                <List dense>
                  {terminals.map((terminal) => (
                    <ListItem key={terminal.id} button onClick={() => handleTerminalSelect(terminal.id)}>
                      <ListItemIcon>
                        <Checkbox
                          edge="start"
                          checked={terminalForm.terminalIds.includes(terminal.id)}
                          tabIndex={-1}
                          disableRipple
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={terminal.id}
                        secondary={
                          <React.Fragment>
                            <Typography component="span" variant="body2" color="textPrimary">
                              {terminal.deviceNO}
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
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SendIcon />}
                  onClick={sendMessageToTerminals}
                  disabled={
                    loading ||
                    !terminalForm.msgTypeCode ||
                    !terminalForm.content ||
                    terminalForm.terminalIds.length === 0
                  }
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
      )}

      {/* 线路发送表单 */}
      {tabValue === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            发送到线路
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!lineForm.merchantId}>
                <InputLabel>商户</InputLabel>
                <Select
                  name="merchantId"
                  value={lineForm.merchantId}
                  onChange={handleLineFormChange}
                  label="商户"
                >
                  {merchants.map((merchant) => (
                    <MenuItem key={merchant.id} value={merchant.id}>
                      {merchant.id}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!lineForm.lineNo}>
                <InputLabel>线路</InputLabel>
                <Select
                  name="lineNo"
                  value={lineForm.lineNo}
                  onChange={handleLineFormChange}
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
            <Grid item xs={12}>
              <FormControl fullWidth required error={!lineForm.msgTypeCode}>
                <InputLabel>消息类型</InputLabel>
                <Select
                  name="msgTypeCode"
                  value={lineForm.msgTypeCode}
                  onChange={handleLineFormChange}
                  label="消息类型"
                >
                  {messageTypes.map((type) => (
                    <MenuItem key={`${type.code}-${type.merchantId}`} value={type.code}>
                      {type.code} - {type.name || '未命名'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="消息内容"
                name="content"
                value={lineForm.content}
                onChange={handleLineFormChange}
                required
                error={!lineForm.content}
                helperText={!lineForm.content ? '请输入消息内容' : ''}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SendIcon />}
                  onClick={sendMessageToLine}
                  disabled={
                    loading ||
                    !lineForm.merchantId ||
                    !lineForm.lineNo ||
                    !lineForm.msgTypeCode ||
                    !lineForm.content
                  }
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
      )}

      {/* 商户发送表单 */}
      {tabValue === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            发送到商户
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth required error={!merchantForm.merchantId}>
                <InputLabel>商户</InputLabel>
                <Select
                  name="merchantId"
                  value={merchantForm.merchantId}
                  onChange={handleMerchantFormChange}
                  label="商户"
                >
                  {merchants.map((merchant) => (
                    <MenuItem key={merchant.id} value={merchant.id}>
                      {merchant.id}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required error={!merchantForm.msgTypeCode}>
                <InputLabel>消息类型</InputLabel>
                <Select
                  name="msgTypeCode"
                  value={merchantForm.msgTypeCode}
                  onChange={handleMerchantFormChange}
                  label="消息类型"
                >
                  {messageTypes.map((type) => (
                    <MenuItem key={`${type.code}-${type.merchantId}`} value={type.code}>
                      {type.code} - {type.name || '未命名'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="消息内容"
                name="content"
                value={merchantForm.content}
                onChange={handleMerchantFormChange}
                required
                error={!merchantForm.content}
                helperText={!merchantForm.content ? '请输入消息内容' : ''}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SendIcon />}
                  onClick={sendMessageToMerchant}
                  disabled={
                    loading ||
                    !merchantForm.merchantId ||
                    !merchantForm.msgTypeCode ||
                    !merchantForm.content
                  }
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
      )}
    </Box>
  );
};

export default MessageSend;
