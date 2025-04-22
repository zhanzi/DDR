import React from 'react';
import PropTypes from 'prop-types';
import {
  AppBar,
  Box,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  Badge,
  Avatar,
  alpha
} from '@mui/material';
import {
  Menu as MenuIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountIcon,
  ChevronLeft as CollapseIcon,
  ChevronRight as ExpandIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';

const DashboardNavbar = ({
  onMobileNavOpen,
  isSidebarCollapsed,
  onToggleSidebar
}) => {
  const { mode, toggleTheme, theme } = useTheme();
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('lg'));

  return (
    <AppBar
      elevation={0}
      sx={{
        backdropFilter: 'blur(8px)',
        backgroundColor: mode === 'dark'
          ? 'rgba(15, 23, 42, 0.9)'
          : 'rgba(255, 255, 255, 0.9)',
        borderBottom: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
        color: 'text.primary',
        zIndex: (theme) => theme.zIndex.drawer + 1
      }}
    >
      <Toolbar sx={{ minHeight: 64 }}>
        {isMobile ? (
          <IconButton
            color="inherit"
            onClick={(e) => {
              e.stopPropagation(); // 阻止事件冒泡
              onMobileNavOpen();
            }}
            edge="start"
            sx={{
              mr: 2,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'scale(1.05)',
                backgroundColor: alpha(theme.palette.primary.main, 0.1)
              },
              '&:active': {
                transform: 'scale(0.98)'
              }
            }}
          >
            <MenuIcon />
          </IconButton>
        ) : (
          <IconButton
            color="inherit"
            onClick={onToggleSidebar}
            edge="start"
            sx={{
              mr: 2,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'scale(1.05)',
                backgroundColor: alpha(theme.palette.primary.main, 0.1)
              },
              '&:active': {
                transform: 'scale(0.98)'
              }
            }}
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
            background: mode === 'dark'
              ? `linear-gradient(45deg, ${theme.palette.primary.light} 30%, ${theme.palette.secondary.light} 90%)`
              : `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: mode === 'dark'
              ? '0 0 20px rgba(192, 132, 252, 0.5)'
              : '0 0 20px rgba(126, 34, 206, 0.2)',
            letterSpacing: '-0.01em'
          }}
        >
          WebAdmin
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="搜索">
            <IconButton
              color="inherit"
              sx={{
                ml: 1,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'scale(1.05)',
                  backgroundColor: alpha(theme.palette.primary.main, 0.1)
                },
                '&:active': {
                  transform: 'scale(0.98)'
                }
              }}
            >
              <SearchIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title={mode === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}>
            <IconButton
              color="inherit"
              onClick={toggleTheme}
              sx={{
                ml: 1,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'scale(1.05)',
                  backgroundColor: alpha(theme.palette.primary.main, 0.1)
                },
                '&:active': {
                  transform: 'scale(0.98)'
                }
              }}
            >
              {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>

          <Tooltip title="通知">
            <IconButton
              color="inherit"
              sx={{
                ml: 1,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'scale(1.05)',
                  backgroundColor: alpha(theme.palette.primary.main, 0.1)
                },
                '&:active': {
                  transform: 'scale(0.98)'
                }
              }}
            >
              <Badge badgeContent={4} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title="账户设置">
            <IconButton
              color="inherit"
              sx={{
                ml: 1,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'scale(1.05)',
                  backgroundColor: alpha(theme.palette.primary.main, 0.1)
                },
                '&:active': {
                  transform: 'scale(0.98)'
                }
              }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  backgroundColor: theme.palette.primary.main,
                  boxShadow: mode === 'dark'
                    ? '0 0 10px rgba(192, 132, 252, 0.5)'
                    : '0 0 10px rgba(126, 34, 206, 0.3)',
                }}
              >
                <AccountIcon fontSize="small" />
              </Avatar>
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
