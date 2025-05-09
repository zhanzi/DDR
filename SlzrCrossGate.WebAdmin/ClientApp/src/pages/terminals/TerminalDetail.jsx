import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  Message as MessageIcon,
  Publish as PublishIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { terminalAPI } from '../../services/api'; // 替换axios导入为terminalAPI
import { format } from 'date-fns';

const TerminalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [terminal, setTerminal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 加载终端详情
  const loadTerminal = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await terminalAPI.getTerminal(id); // 使用terminalAPI代替axios
      setTerminal(response);
    } catch (error) {
      console.error('Error loading terminal:', error);
      setError('加载终端信息失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTerminal();
  }, [id]);

  // 获取终端状态的显示样式
  const getStatusChip = (status) => {
    if (!status) return <Chip label="未知" color="default" />;

    switch (status.activeStatus) {
      case 0: // Active
        return <Chip label="在线" color="success" />;
      case 1: // Inactive
        return <Chip label="离线" color="error" />;
      default:
        return <Chip label="未知" color="default" />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="error" gutterBottom>
          {error}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/terminals')}
        >
          返回终端列表
        </Button>
      </Box>
    );
  }

  if (!terminal) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          未找到终端信息
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/terminals')}
        >
          返回终端列表
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          终端详情
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/terminals')}
            sx={{ mr: 1 }}
          >
            返回
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={loadTerminal}
          >
            刷新
          </Button>
        </Box>
      </Box>

      {/* 基本信息卡片 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          基本信息
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" color="textSecondary">终端ID</Typography>
            <Typography variant="body1">{terminal.id}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" color="textSecondary">商户ID</Typography>
            <Typography variant="body1">{terminal.merchantID}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" color="textSecondary">机器ID</Typography>
            <Typography variant="body1">{terminal.machineID}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" color="textSecondary">设备编号</Typography>
            <Typography variant="body1">{terminal.deviceNO}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" color="textSecondary">线路编号</Typography>
            <Typography variant="body1">{terminal.lineNO}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" color="textSecondary">终端类型</Typography>
            <Typography variant="body1">{terminal.terminalType}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" color="textSecondary">创建时间</Typography>
            <Typography variant="body1">
              {format(new Date(terminal.createTime), 'yyyy-MM-dd HH:mm:ss')}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* 状态信息卡片 */}
      {terminal.status && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            状态信息
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="subtitle2" color="textSecondary">状态</Typography>
              <Box sx={{ mt: 1 }}>{getStatusChip(terminal.status)}</Box>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="subtitle2" color="textSecondary">最后活跃时间</Typography>
              <Typography variant="body1">
                {format(new Date(terminal.status.lastActiveTime), 'yyyy-MM-dd HH:mm:ss')}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="subtitle2" color="textSecondary">连接协议</Typography>
              <Typography variant="body1">{terminal.status.connectionProtocol || '-'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="subtitle2" color="textSecondary">终端地址</Typography>
              <Typography variant="body1">{terminal.status.endPoint || '-'}</Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* 文件版本信息 */}
      {terminal.status && terminal.status.fileVersionMetadata && Object.keys(terminal.status.fileVersionMetadata).length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            文件版本信息
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>文件类型</TableCell>
                  <TableCell>当前版本</TableCell>
                  <TableCell>期望版本</TableCell>
                  <TableCell>状态</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(terminal.status.fileVersionMetadata).map(([fileType, version]) => (
                  <TableRow key={fileType}>
                    <TableCell>{fileType}</TableCell>
                    <TableCell>{version.current || '-'}</TableCell>
                    <TableCell>{version.expected || '-'}</TableCell>
                    <TableCell>
                      {version.current === version.expected ? (
                        <Chip label="最新" color="success" size="small" />
                      ) : version.expected ? (
                        <Chip label="需更新" color="warning" size="small" />
                      ) : (
                        <Chip label="无期望版本" color="default" size="small" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* 属性信息 */}
      {terminal.status && terminal.status.propertyMetadata && Object.keys(terminal.status.propertyMetadata).length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            属性信息
          </Typography>
          <List>
            {Object.entries(terminal.status.propertyMetadata).map(([key, value]) => (
              <React.Fragment key={key}>
                <ListItem>
                  <ListItemText
                    primary={key}
                    secondary={value}
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      {/* 操作按钮 */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          操作
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<MessageIcon />}
            onClick={() => navigate('/terminals', { state: { openMessageDialog: true, terminal } })}
          >
            发送消息
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<PublishIcon />}
            onClick={() => navigate('/terminals', { state: { openFileDialog: true, terminal } })}
          >
            发布文件
          </Button>
          <Button
            variant="contained"
            color="info"
            startIcon={<HistoryIcon />}
            onClick={() => navigate(`/terminals/${terminal.id}/events`)}
          >
            查看事件
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default TerminalDetail;
