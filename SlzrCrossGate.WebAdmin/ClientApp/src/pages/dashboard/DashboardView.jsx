import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Tabs, 
  Tab, 
  Paper
} from '@mui/material';
import { 
  Business as BusinessIcon,
  Dashboard as DashboardIcon
} from '@mui/icons-material';
import axios from 'axios';
import MerchantDashboard from './MerchantDashboard';
import PlatformDashboard from './PlatformDashboard';

const DashboardView = () => {
  const [tabValue, setTabValue] = useState(0); // 0: 商户仪表盘, 1: 平台仪表盘
  const [isSystemAdmin, setIsSystemAdmin] = useState(false);

  // 检查当前用户是否为系统管理员
  const checkUserRole = async () => {
    try {
      const response = await axios.get('/api/Users/CurrentUser');
      const roles = response.data.roles || [];
      setIsSystemAdmin(roles.includes('SystemAdmin'));
      
      // 如果是系统管理员，默认显示平台仪表盘
      if (roles.includes('SystemAdmin')) {
        setTabValue(1);
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  useEffect(() => {
    checkUserRole();
  }, []);

  // 处理标签页变更
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth={false}>
      <Box sx={{ pt: 3, pb: 3 }}>
        {isSystemAdmin && (
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              centered
            >
              <Tab 
                icon={<BusinessIcon />} 
                label="商户仪表盘" 
                iconPosition="start"
              />
              <Tab 
                icon={<DashboardIcon />} 
                label="平台仪表盘" 
                iconPosition="start"
              />
            </Tabs>
          </Paper>
        )}
        
        {tabValue === 0 ? (
          <MerchantDashboard />
        ) : (
          <PlatformDashboard />
        )}
      </Box>
    </Container>
  );
};

export default DashboardView;
