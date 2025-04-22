import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  CardMedia,
  CardHeader,
  Divider
} from '@mui/material';
import {
  Description as FileTypeIcon,
  CloudUpload as VersionIcon,
  Publish as PublishIcon,
  History as HistoryIcon
} from '@mui/icons-material';

const FileManagementView = () => {
  const navigate = useNavigate();

  const fileManagementModules = [
    {
      title: '文件类型管理',
      description: '管理系统中的文件类型，包括添加、编辑和删除文件类型。',
      icon: <FileTypeIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
      path: '/app/files/types',
      color: '#3f51b5'
    },
    {
      title: '文件版本管理',
      description: '管理文件的不同版本，包括上传、下载和删除文件版本。',
      icon: <VersionIcon sx={{ fontSize: 60, color: 'info.main' }} />,
      path: '/app/files/versions',
      color: '#2196f3'
    },
    {
      title: '文件发布',
      description: '将文件版本发布到商户、线路或终端。',
      icon: <PublishIcon sx={{ fontSize: 60, color: 'success.main' }} />,
      path: '/app/files/publish',
      color: '#4caf50'
    },
    {
      title: '发布记录',
      description: '查看文件发布历史记录和当前发布状态。',
      icon: <HistoryIcon sx={{ fontSize: 60, color: 'warning.main' }} />,
      path: '/app/files/publish-list',
      color: '#ff9800'
    }
  ];

  return (
    <Container maxWidth={false}>
      <Box sx={{ pt: 3, pb: 3 }}>
        <Typography variant="h4" gutterBottom>
          文件管理
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          管理系统中的文件类型、文件版本和文件发布。
        </Typography>

        <Grid container spacing={3} sx={{ mt: 1 }}>
          {fileManagementModules.map((module) => (
            <Grid item xs={12} sm={6} md={3} key={module.title}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 8px 16px 0 rgba(0,0,0,0.2)'
                  }
                }}
              >
                <CardHeader
                  title={module.title}
                  titleTypographyProps={{ variant: 'h6' }}
                />
                <Divider />
                <Box 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    p: 2,
                    backgroundColor: `${module.color}10`
                  }}
                >
                  {module.icon}
                </Box>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" color="textSecondary">
                    {module.description}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    color="primary" 
                    onClick={() => navigate(module.path)}
                    fullWidth
                  >
                    进入
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
};

export default FileManagementView;
