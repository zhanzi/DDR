import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Devices as DevicesIcon,
  SignalWifi4Bar as OnlineIcon,
  SignalWifiOff as OfflineIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

// 统计卡片组件
const StatCard = ({ icon, title, value, color, onClick }) => {
  const theme = useTheme();
  
  return (
    <Card 
      sx={{ 
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s',
        '&:hover': onClick ? { transform: 'translateY(-4px)' } : {},
      }}
      onClick={onClick}
    >
      <CardContent>
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <Box
              sx={{
                backgroundColor: color,
                height: 56,
                width: 56,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {icon}
            </Box>
          </Grid>
          <Grid item xs>
            <Typography color="textSecondary" variant="body2" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4">{value}</Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalMerchants: 0,
    totalTerminals: 0,
    onlineTerminals: 0,
    offlineTerminals: 0,
  });
  const [loading, setLoading] = useState(true);

  // 获取仪表盘数据
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // 这里应该调用API获取数据
        // const response = await axios.get('/api/dashboard/stats');
        
        // 模拟API调用
        setTimeout(() => {
          setStats({
            totalMerchants: 12,
            totalTerminals: 256,
            onlineTerminals: 198,
            offlineTerminals: 58,
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('获取仪表盘数据失败:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // 判断用户角色，决定显示哪个仪表盘
  const isAdmin = user?.roles?.includes('Admin');

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          仪表盘
        </Typography>
        <Typography variant="body1" color="textSecondary">
          欢迎回来，{user?.name || '用户'}
        </Typography>
      </Box>

      {/* 快速导航按钮 */}
      <Box sx={{ mb: 4, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          onClick={() => navigate('/merchant-dashboard')}
        >
          商户实时大屏
        </Button>
        
        {isAdmin && (
          <Button
            variant="contained"
            color="secondary"
            onClick={() => navigate('/platform-dashboard')}
          >
            平台实时大屏
          </Button>
        )}
        
        {isAdmin && (
          <Button
            variant="outlined"
            onClick={() => navigate('/server-logs')}
          >
            服务端日志
          </Button>
        )}
      </Box>

      {/* 统计卡片 */}
      <Grid container spacing={3}>
        {isAdmin && (
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<BusinessIcon sx={{ color: '#fff' }} />}
              title="商户总数"
              value={loading ? '加载中...' : stats.totalMerchants}
              color={theme.palette.primary.main}
              onClick={() => navigate('/merchants')}
            />
          </Grid>
        )}
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<DevicesIcon sx={{ color: '#fff' }} />}
            title="终端总数"
            value={loading ? '加载中...' : stats.totalTerminals}
            color={theme.palette.info.main}
            onClick={() => navigate('/terminals')}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<OnlineIcon sx={{ color: '#fff' }} />}
            title="在线终端"
            value={loading ? '加载中...' : stats.onlineTerminals}
            color={theme.palette.success.main}
            onClick={() => navigate('/terminals?status=online')}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<OfflineIcon sx={{ color: '#fff' }} />}
            title="离线终端"
            value={loading ? '加载中...' : stats.offlineTerminals}
            color={theme.palette.warning.main}
            onClick={() => navigate('/terminals?status=offline')}
          />
        </Grid>
      </Grid>

      {/* 最近活动 */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          最近活动
        </Typography>
        <Card>
          <CardContent>
            <Typography variant="body1" color="textSecondary">
              {loading ? '加载中...' : '暂无最近活动'}
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default Dashboard;
