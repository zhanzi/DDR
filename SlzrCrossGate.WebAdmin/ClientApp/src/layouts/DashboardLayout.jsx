import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import { Box } from '@mui/material';
import DashboardSidebar from './DashboardSidebar';
import DashboardNavbar from './DashboardNavbar';
import { useAuth } from '../contexts/AuthContext';

const DashboardLayoutRoot = styled('div')(({ theme, isSidebarCollapsed }) => ({
  display: 'flex',
  flex: '1 1 auto',
  maxWidth: '100%',
  paddingTop: 64,
  transition: theme.transitions.create(['padding-left'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  [theme.breakpoints.up('lg')]: {
    paddingLeft: isSidebarCollapsed ? 80 : 280
  }
}));

const DashboardLayout = ()  => {
    const { isAuthenticated, needTwoFactor } = useAuth();

    // 如果用户未认证，重定向到登录页面
    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    // 如果用户需要完成双因素验证，重定向到验证页面
    if (needTwoFactor) {
        return <Navigate to="/two-factor-verify" />;
    }


  const [isMobileNavOpen, setMobileNavOpen] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    return savedState ? JSON.parse(savedState) : false;
  });

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!isSidebarCollapsed);
  };

  // 添加调试信息
  console.log('Mobile nav state:', isMobileNavOpen);

  const handleMobileNavOpen = () => {
    console.log('Opening mobile nav');
    // 使用函数式更新确保状态正确
    setMobileNavOpen(true);
  };

  const handleMobileNavClose = () => {
    console.log('Closing mobile nav');
    // 使用函数式更新确保状态正确
    setMobileNavOpen(false);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100%' }}>
      <DashboardNavbar
        onMobileNavOpen={handleMobileNavOpen}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={handleToggleSidebar}
      />
      <DashboardSidebar
        onMobileClose={handleMobileNavClose}
        openMobile={isMobileNavOpen}
        isCollapsed={isSidebarCollapsed}
      />
      <DashboardLayoutRoot isSidebarCollapsed={isSidebarCollapsed}>
        <Box
          sx={{
            display: 'flex',
            flex: '1 1 auto',
            flexDirection: 'column',
            width: '100%',
            p: 3,
            transition: (theme) => theme.transitions.create(['padding'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
          }}
        >
          {/* <Container maxWidth="lg" sx={{ py: 4 }}>
            {children}
          </Container> */}
          <Outlet />
        </Box>
      </DashboardLayoutRoot>
    </Box>
  );
};

export default DashboardLayout;
