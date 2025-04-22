import React from 'react';
import PropTypes from 'prop-types';
import {
  AppBar,
  Box,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery
} from '@mui/material';
import {
  Menu as MenuIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountIcon,
  ChevronLeft as CollapseIcon,
  ChevronRight as ExpandIcon
} from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';

const DashboardNavbar = ({ 
  onMobileNavOpen, 
  isSidebarCollapsed, 
  onToggleSidebar 
}) => {
  const { mode, toggleTheme } = useTheme();
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('lg'));

  return (
    <AppBar
      elevation={1}
      sx={{
        backgroundColor: 'background.paper',
        color: 'text.primary',
        boxShadow: (theme) => theme.shadows[1],
        zIndex: (theme) => theme.zIndex.drawer + 1
      }}
    >
      <Toolbar sx={{ minHeight: 64 }}>
        {isMobile ? (
          <IconButton
            color="inherit"
            onClick={onMobileNavOpen}
            edge="start"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        ) : (
          <IconButton
            color="inherit"
            onClick={onToggleSidebar}
            edge="start"
            sx={{ mr: 2 }}
          >
            {isSidebarCollapsed ? <ExpandIcon /> : <CollapseIcon />}
          </IconButton>
        )}

        <Typography
          variant="h5"
          component="h1"
          sx={{ 
            flexGrow: 1,
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #00AB55 30%, #3366FF 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          WebAdmin
        </Typography>

        <Box sx={{ flexGrow: 0 }}>
          <Tooltip title={mode === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}>
            <IconButton color="inherit" onClick={toggleTheme} sx={{ ml: 1 }}>
              {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
          
          <Tooltip title="通知">
            <IconButton color="inherit" sx={{ ml: 1 }}>
              <NotificationsIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="账户设置">
            <IconButton color="inherit" sx={{ ml: 1 }}>
              <AccountIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

DashboardNavbar.propTypes = {
  onMobileNavOpen: PropTypes.func.isRequired,
  isSidebarCollapsed: PropTypes.bool.isRequired,
  onToggleSidebar: PropTypes.func.isRequired
};

export default DashboardNavbar;
