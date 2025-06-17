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
  Divider
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  People as PeopleIcon,
  Computer as ComputerIcon,
  Message as MessageIcon,
  InsertDriveFile as FileIcon,
  Business as BusinessIcon,
  Memory as MemoryIcon,
  Storage as StorageIcon,
  Timer as TimerIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../../services/api'; // 使用统一的API服务
import { formatDateTime, formatDate } from '../../utils/dateUtils';
import { parseErrorMessage } from '../../utils/errorHandler';
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

const PlatformDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [systemInfo, setSystemInfo] = useState(null);
  const [error, setError] = useState('');

  // 加载仪表盘数据
  const loadDashboardData = async () => {
    setLoading(true);
    setError('');

    try {
      // 使用dashboardAPI替换直接的axios调用
      const dashboardResponse = await dashboardAPI.getPlatformStats();
      setDashboardData(dashboardResponse);

      const systemResponse = await dashboardAPI.getSystemInfo();
      setSystemInfo(systemResponse);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      const errorMessage = parseErrorMessage(error, '加载仪表盘数据失败');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // 获取事件类型的显示样式
  const getEventTypeChip = (eventType) => {
    switch (eventType) {
          case 1: // SignIn
            return <Chip label="签到" color="success" size="small" />;
          case 2: // SignOut
            return <Chip label="签退" color="error" size="small" />;
          case 3: // FileDownloadStart
            return <Chip label="文件下载开始" color="info" size="small" />;
          case 4: // FileDownloadEnd
            return <Chip label="文件下载结束" color="info" size="small" />;
          case 5: // FileVersionUpdated
            return <Chip label="文件版本更新" color="info" size="small" />;
          case 6: // PropertyChanged
            return <Chip label="属性变更" color="info" size="small" />;
          case 7: // UnionPayKeyBound
            return <Chip label="银联密钥绑定" color="info" size="small" />;
          case 8: // MerchantIDChanged
            return <Chip label="商户变更" color="info" size="small" />;
          case 9: // LineNOChanged
            return <Chip label="线路变更" color="info" size="small" />;
          case 10: // DeviceNOChanged
            return <Chip label="设备变更" color="info" size="small" />;
          case 11: // MessageSent
            return <Chip label="消息发送" color="secondary" size="small" />;
          case 12: // FilePublished
            return <Chip label="文件发布" color="warning" size="small" />;
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
      date: formatDate(item.date).substring(5), // 只取月-日部分
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

  // 格式化商户终端统计数据
  const formatMerchantTerminalData = (data) => {
    if (!data) return [];

    return data.map(item => ({
      name: item.merchantId,
      终端数量: item.terminalCount
    }));
  };

  // 格式化运行时间
  const formatUptime = (startTime) => {
    if (!startTime) return '-';

    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now - start;

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${days}天 ${hours}小时 ${minutes}分钟`;
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
          <Grid item xs={12} md={10}>
            <Typography variant="h4">
              平台仪表盘
            </Typography>
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
                      <BusinessIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6" color="textSecondary">
                        商户总数
                      </Typography>
                    </Box>
                    <Typography variant="h3">
                      {dashboardData.merchantCount}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Button
                        variant="text"
                        color="primary"
                        onClick={() => navigate('/app/merchants')}
                      >
                        查看商户
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <ComputerIcon color="secondary" sx={{ mr: 1 }} />
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
                      <MessageIcon color="info" sx={{ mr: 1 }} />
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
                      <FileIcon color="warning" sx={{ mr: 1 }} />
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
            </Grid>

            {/* 系统信息 */}
            {systemInfo && (
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  系统信息
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <TimerIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="textSecondary">
                        服务器时间
                      </Typography>
                    </Box>
                    <Typography variant="body1">
                      {formatDateTime(systemInfo.serverTime)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <TimerIcon color="secondary" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="textSecondary">
                        运行时间
                      </Typography>
                    </Box>
                    <Typography variant="body1">
                      {formatUptime(systemInfo.processStartTime)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <MemoryIcon color="info" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="textSecondary">
                        处理器数量
                      </Typography>
                    </Box>
                    <Typography variant="body1">
                      {systemInfo.processorCount}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <StorageIcon color="warning" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="textSecondary">
                        系统内存
                      </Typography>
                    </Box>
                    <Typography variant="body1">
                      {systemInfo.systemMemory} MB
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <StorageIcon color="error" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="textSecondary">
                        进程内存
                      </Typography>
                    </Box>
                    <Typography variant="body1">
                      {systemInfo.processMemoryUsage} MB
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <ComputerIcon color="success" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="textSecondary">
                        服务器主机名
                      </Typography>
                    </Box>
                    <Typography variant="body1">
                      {systemInfo.serverHostName}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <ComputerIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="textSecondary">
                        操作系统
                      </Typography>
                    </Box>
                    <Typography variant="body1">
                      {systemInfo.serverOS}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <ComputerIcon color="secondary" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="textSecondary">
                        .NET版本
                      </Typography>
                    </Box>
                    <Typography variant="body1">
                      {systemInfo.dotNetVersion}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            )}

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

              {/* 商户终端分布 */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    商户终端分布
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={formatMerchantTerminalData(dashboardData.merchantTerminalStats)}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="终端数量" fill="#8884d8" />
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
                      <TableCell>商户ID</TableCell>
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
                        <TableCell colSpan={8} align="center">
                          没有最近事件
                        </TableCell>
                      </TableRow>
                    ) : (
                      dashboardData.recentEvents.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell>{event.merchantID}</TableCell>
                          <TableCell>{event.terminalID}</TableCell>
                          <TableCell>{formatDateTime(event.eventTime)}</TableCell>
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
            加载仪表盘数据中...
          </Typography>
        )}
      </Box>
    </Container>
  );
};

export default PlatformDashboard;
