import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Link as RouterLink } from 'react-router-dom';
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
  alpha,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Menu as MenuIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountIcon,
  ChevronLeft as CollapseIcon,
  ChevronRight as ExpandIcon,
  Search as SearchIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const DashboardNavbar = ({
  onMobileNavOpen,
  isSidebarCollapsed,
  onToggleSidebar
}) => {
  const { mode, toggleTheme, theme } = useTheme();
  const { logout, user } = useAuth();
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('lg'));
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
  };

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
        {/* <Tooltip title="搜索">
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
          </Tooltip> -->
*/}
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
{/*
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
*/}
          <Tooltip title="账户设置">
            <IconButton
              color="inherit"
              onClick={handleMenuOpen}
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

          {/* 用户菜单 */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: {
                mt: 1.5,
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                backdropFilter: 'blur(8px)',
                backgroundColor: mode === 'dark'
                  ? alpha(theme.palette.background.paper, 0.8)
                  : alpha(theme.palette.background.paper, 0.9),
                border: mode === 'dark'
                  ? '1px solid rgba(255, 255, 255, 0.12)'
                  : '1px solid rgba(0, 0, 0, 0.08)',
                '&:before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  right: 14,
                  width: 10,
                  height: 10,
                  bgcolor: mode === 'dark'
                    ? alpha(theme.palette.background.paper, 0.8)
                    : alpha(theme.palette.background.paper, 0.9),
                  transform: 'translateY(-50%) rotate(45deg)',
                  zIndex: 0,
                  borderLeft: mode === 'dark'
                    ? '1px solid rgba(255, 255, 255, 0.12)'
                    : '1px solid rgba(0, 0, 0, 0.08)',
                  borderTop: mode === 'dark'
                    ? '1px solid rgba(255, 255, 255, 0.12)'
                    : '1px solid rgba(0, 0, 0, 0.08)',
                },
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem sx={{ minWidth: 180 }}>
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={user?.name || '用户'}
                secondary={user?.email || ''}
                primaryTypographyProps={{ variant: 'subtitle2' }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
            </MenuItem>
            <Divider />
            <MenuItem
              component={RouterLink}
              to="/app/account"
              onClick={handleMenuClose}
            >
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="账户设置" />
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="退出登录" />
            </MenuItem>
          </Menu>
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
