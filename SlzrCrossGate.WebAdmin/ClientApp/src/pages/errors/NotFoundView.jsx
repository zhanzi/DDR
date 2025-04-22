import React from 'react';
import { Button, Container, Typography, Paper, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Error as ErrorIcon } from '@mui/icons-material';

const NotFoundView = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 4, mt: 4, mb: 4 }}>
        <Grid container spacing={3} alignItems="center" justifyContent="center">
          <Grid item xs={12} sx={{ textAlign: 'center' }}>
            <ErrorIcon color="error" sx={{ fontSize: 100 }} />
          </Grid>
          <Grid item xs={12} sx={{ textAlign: 'center' }}>
            <Typography variant="h1" color="textPrimary" gutterBottom>
              404
            </Typography>
            <Typography variant="h4" color="textPrimary" gutterBottom>
              页面未找到
            </Typography>
            <Typography variant="body1" color="textSecondary" paragraph>
              您尝试访问的页面不存在或已被移除。请检查URL是否正确，或返回首页。
            </Typography>
          </Grid>
          <Grid item xs={12} sx={{ textAlign: 'center', mt: 2 }}>
            <Button
              color="primary"
              variant="contained"
              size="large"
              onClick={() => navigate('/app/dashboard')}
              sx={{ mr: 2 }}
            >
              返回仪表盘
            </Button>
            <Button
              color="secondary"
              variant="outlined"
              size="large"
              onClick={() => navigate(-1)}
            >
              返回上一页
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default NotFoundView;
