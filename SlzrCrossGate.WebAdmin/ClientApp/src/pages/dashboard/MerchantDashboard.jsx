import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  People as PeopleIcon,
  Computer as ComputerIcon,
  Message as MessageIcon,
  InsertDriveFile as FileIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const MerchantDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [merchants, setMerchants] = useState([]);
  const [selectedMerchant, setSelectedMerchant] = useState('');
  const [error, setError] = useState('');

  // 加载商户列表
  const loadMerchants = async () => {
    try {
      const response = await axios.get('/api/Merchants');
      setMerchants(response.data.items);

      // 如果有商户，默认选择第一个
      if (response.data.items.length > 0) {
        setSelectedMerchant(response.data.items[0].id);
      }
    } catch (error) {
      console.error('Error loading merchants:', error);
      setError('加载商户列表失败');
    }
  };

  // 加载仪表盘数据
  const loadDashboardData = async () => {
    if (!selectedMerchant) return;

    setLoading(true);
    setError('');

    try {
      const response = await axios.get('/api/Dashboard/MerchantStats', {
        params: { merchantId: selectedMerchant }
      });
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('加载仪表盘数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMerchants();
  }, []);

  useEffect(() => {
    if (selectedMerchant) {
      loadDashboardData();
    }
  }, [selectedMerchant]);

  // 处理商户选择变更
  const handleMerchantChange = (event) => {
    setSelectedMerchant(event.target.value);
  };

  // 获取事件类型的显示样式
  const getEventTypeChip = (eventType) => {
    switch (eventType) {
      case 0: // Created
        return <Chip label="创建" color="success" size="small" />;
      case 1: // Connected
        return <Chip label="连接" color="primary" size="small" />;
      case 2: // Disconnected
        return <Chip label="断开" color="error" size="small" />;
      case 3: // FileVersionUpdated
        return <Chip label="版本更新" color="info" size="small" />;
      case 4: // FilePublished
        return <Chip label="文件发布" color="warning" size="small" />;
      case 5: // MessageSent
        return <Chip label="消息发送" color="secondary" size="small" />;
      default:
        return <Chip label="其他" color="default" size="small" />;
    }
  };

  // 获取事件严重性的显示样式
  const getSeverityChip = (severity) => {
    switch (severity) {
      case 0: // Info
        return <Chip label="信息" color="info" size="small" />;
      case 1: // Warning
        return <Chip label="警告" color="warning" size="small" />;
      case 2: // Error
        return <Chip label="错误" color="error" size="small" />;
      case 3: // Critical
        return <Chip label="严重" color="error" size="small" variant="outlined" />;
      default:
        return <Chip label="未知" color="default" size="small" />;
    }
  };

  // 格式化事件统计数据
  const formatEventStatsData = (data) => {
    if (!data) return [];

    return data.map(item => ({
      date: format(new Date(item.date), 'MM-dd'),
      count: item.count
    })).reverse();
  };

  // 格式化终端类型统计数据
  const formatTerminalTypeData = (data) => {
    if (!data) return [];

    return data.map(item => ({
      name: item.type || '未知',
      value: item.count
    }));
  };

  // 格式化线路统计数据
  const formatLineStatsData = (data) => {
    if (!data) return [];

    return data.map(item => ({
      name: item.lineNo,
      总数: item.count,
      在线: item.activeCount,
      离线: item.count - item.activeCount
    }));
  };

  if (error) {
    return (
      <Container maxWidth={false}>
        <Box sx={{ pt: 3, pb: 3 }}>
          <Typography variant="h4" color="error" gutterBottom>
            {error}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={loadDashboardData}
          >
            重试
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth={false}>
      <Box sx={{ pt: 3, pb: 3 }}>
        <Grid container spacing={3} alignItems="center" sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="h4">
              商户仪表盘
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>选择商户</InputLabel>
              <Select
                value={selectedMerchant}
                onChange={handleMerchantChange}
                label="选择商户"
              >
                {merchants.map((merchant) => (
                  <MenuItem key={merchant.id} value={merchant.id}>
                    {merchant.name || merchant.id}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={loadDashboardData}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : '刷新'}
            </Button>
          </Grid>
        </Grid>

        {loading && !dashboardData ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : dashboardData ? (
          <>
            {/* 统计卡片 */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <ComputerIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6" color="textSecondary">
                        终端总数
                      </Typography>
                    </Box>
                    <Typography variant="h3">
                      {dashboardData.terminalStats.totalCount}
                    </Typography>
                    <Box sx={{ display: 'flex', mt: 1 }}>
                      <Box sx={{ mr: 2 }}>
                        <Typography variant="body2" color="textSecondary">
                          在线
                        </Typography>
                        <Typography variant="h6" color="success.main">
                          {dashboardData.terminalStats.activeCount}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          离线
                        </Typography>
                        <Typography variant="h6" color="error.main">
                          {dashboardData.terminalStats.inactiveCount}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <MessageIcon color="secondary" sx={{ mr: 1 }} />
                      <Typography variant="h6" color="textSecondary">
                        消息总数
                      </Typography>
                    </Box>
                    <Typography variant="h3">
                      {dashboardData.messageStats.totalCount}
                    </Typography>
                    <Box sx={{ display: 'flex', mt: 1 }}>
                      <Box sx={{ mr: 2 }}>
                        <Typography variant="body2" color="textSecondary">
                          已读
                        </Typography>
                        <Typography variant="h6" color="success.main">
                          {dashboardData.messageStats.readCount}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          未读
                        </Typography>
                        <Typography variant="h6" color="error.main">
                          {dashboardData.messageStats.unreadCount}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <FileIcon color="info" sx={{ mr: 1 }} />
                      <Typography variant="h6" color="textSecondary">
                        文件类型
                      </Typography>
                    </Box>
                    <Typography variant="h3">
                      {dashboardData.fileStats.totalFileTypes}
                    </Typography>
                    <Box sx={{ display: 'flex', mt: 1 }}>
                      <Box sx={{ mr: 2 }}>
                        <Typography variant="body2" color="textSecondary">
                          文件版本
                        </Typography>
                        <Typography variant="h6">
                          {dashboardData.fileStats.totalFileVersions}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          文件发布
                        </Typography>
                        <Typography variant="h6">
                          {dashboardData.fileStats.totalFilePublishes}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PeopleIcon color="warning" sx={{ mr: 1 }} />
                      <Typography variant="h6" color="textSecondary">
                        线路数量
                      </Typography>
                    </Box>
                    <Typography variant="h3">
                      {dashboardData.lineStats.length}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Button
                        variant="text"
                        color="primary"
                        onClick={() => navigate('/app/terminals')}
                      >
                        查看终端
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* 图表 */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              {/* 终端事件统计 */}
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    最近7天终端事件统计
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={formatEventStatsData(dashboardData.terminalEventStats)}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" name="事件数量" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </Grid>

              {/* 终端类型分布 */}
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    终端类型分布
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={formatTerminalTypeData(dashboardData.terminalTypeStats)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {formatTerminalTypeData(dashboardData.terminalTypeStats).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </Grid>

              {/* 线路分布 */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    线路终端分布
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={formatLineStatsData(dashboardData.lineStats)}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="总数" fill="#8884d8" />
                        <Bar dataKey="在线" fill="#82ca9d" />
                        <Bar dataKey="离线" fill="#ff8042" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </Grid>
            </Grid>

            {/* 最近事件 */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                最近终端事件
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>终端ID</TableCell>
                      <TableCell>事件时间</TableCell>
                      <TableCell>事件类型</TableCell>
                      <TableCell>严重性</TableCell>
                      <TableCell>事件名称</TableCell>
                      <TableCell>备注</TableCell>
                      <TableCell>操作人</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboardData.recentEvents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          没有最近事件
                        </TableCell>
                      </TableRow>
                    ) : (
                      dashboardData.recentEvents.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell>{event.terminalID}</TableCell>
                          <TableCell>{format(new Date(event.eventTime), 'yyyy-MM-dd HH:mm:ss')}</TableCell>
                          <TableCell>{getEventTypeChip(event.eventType)}</TableCell>
                          <TableCell>{getSeverityChip(event.severity)}</TableCell>
                          <TableCell>{event.eventName}</TableCell>
                          <TableCell>{event.remark || '-'}</TableCell>
                          <TableCell>{event.operator || '-'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="text"
                  color="primary"
                  onClick={() => navigate('/app/terminals')}
                >
                  查看所有终端
                </Button>
              </Box>
            </Paper>
          </>
        ) : (
          <Typography variant="h6" align="center" sx={{ mt: 4 }}>
            请选择商户查看仪表盘数据
          </Typography>
        )}
      </Box>
    </Container>
  );
};

export default MerchantDashboard;
