import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import { Box } from '@mui/material';
import DashboardSidebar from './DashboardSidebar';
import DashboardNavbar from './DashboardNavbar';

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

const DashboardLayout = () => {
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
          <Outlet />
        </Box>
      </DashboardLayoutRoot>
    </Box>
  );
};

export default DashboardLayout;
