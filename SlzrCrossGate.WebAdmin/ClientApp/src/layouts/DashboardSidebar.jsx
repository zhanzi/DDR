import React, { useEffect } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  List,
  Typography,
  Tooltip,
  useMediaQuery,
  useTheme as useMuiTheme
} from '@mui/material';
import {
  BarChart as BarChartIcon,
  Lock as LockIcon,
  Settings as SettingsIcon,
  ShoppingBag as ShoppingBagIcon,
  Users as UsersIcon,
  Server as ServerIcon,
  MessageCircle as MessageCircleIcon,
  FileText as FileTextIcon,
  Monitor as MonitorIcon
} from 'react-feather';
import NavItem from './NavItem';
import { useTheme } from '../contexts/ThemeContext';

const user = {
  avatar: '/static/images/avatars/avatar_6.png',
  jobTitle: '系统管理员',
  name: 'Admin User'
};

const items = [
  {
    href: '/app/dashboard',
    icon: BarChartIcon,
    title: '仪表盘'
  },
  {
    href: '/app/users',
    icon: UsersIcon,
    title: '用户管理'
  },
  {
    href: '/app/roles',
    icon: LockIcon,
    title: '角色管理'
  },
  {
    href: '/app/merchants',
    icon: ShoppingBagIcon,
    title: '商户管理'
  },
  {
    href: '/app/terminals',
    icon: ServerIcon,
    title: '终端管理'
  },
  {
    href: '/app/files',
    icon: FileTextIcon,
    title: '文件管理'
  },
  {
    href: '/app/messages',
    icon: MessageCircleIcon,
    title: '消息管理'
  },
  {
    href: '/app/monitor',
    icon: MonitorIcon,
    title: '系统监控'
  },
  {
    href: '/app/settings',
    icon: SettingsIcon,
    title: '系统设置'
  }
];

const DashboardSidebar = ({ onMobileClose, openMobile, isCollapsed }) => {
  const location = useLocation();
  const muiTheme = useMuiTheme();
  const { mode } = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('lg'));

  useEffect(() => {
    if (openMobile && onMobileClose) {
      onMobileClose();
    }
  }, [location.pathname, onMobileClose, openMobile]);

  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowX: 'hidden',
        width: isCollapsed && !isMobile ? 80 : 280,
        transition: muiTheme.transitions.create('width', {
          easing: muiTheme.transitions.easing.sharp,
          duration: muiTheme.transitions.duration.enteringScreen,
        }),
      }}
    >
      <Box
        sx={{
          alignItems: 'center',
          display: 'flex',
          flexDirection: 'column',
          p: isCollapsed && !isMobile ? 1 : 2
        }}
      >
        <Avatar
          component={RouterLink}
          src={user.avatar}
          sx={{
            cursor: 'pointer',
            width: isCollapsed && !isMobile ? 40 : 64,
            height: isCollapsed && !isMobile ? 40 : 64,
            transition: muiTheme.transitions.create(['width', 'height'], {
              duration: muiTheme.transitions.duration.shorter,
            }),
          }}
          to="/app/account"
        />
        {(!isCollapsed || isMobile) && (
          <>
            <Typography
              color="textPrimary"
              variant="h5"
              sx={{ mt: 1 }}
            >
              {user.name}
            </Typography>
            <Typography
              color="textSecondary"
              variant="body2"
            >
              {user.jobTitle}
            </Typography>
          </>
        )}
      </Box>
      <Divider />
      <Box sx={{ p: isCollapsed && !isMobile ? 1 : 2 }}>
        <List>
          {items.map((item) => (
            <NavItem
              href={item.href}
              key={item.title}
              title={item.title}
              icon={item.icon}
              isCollapsed={isCollapsed && !isMobile}
            />
          ))}
        </List>
      </Box>
      <Box sx={{ flexGrow: 1 }} />
      {(!isCollapsed || isMobile) && (
        <Box
          sx={{
            backgroundColor: 'background.default',
            m: 2,
            p: 2
          }}
        >
          <Typography
            align="center"
            gutterBottom
            variant="h6"
          >
            需要帮助?
          </Typography>
          <Typography
            align="center"
            variant="body2"
          >
            查看系统文档
          </Typography>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              pt: 2
            }}
          >
            <Button
              color="primary"
              component="a"
              href="https://material-ui.com/store/items/devias-kit-pro"
              variant="contained"
              size="small"
            >
              查看文档
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );

  return (
    <>
      {isMobile ? (
        <Drawer
          anchor="left"
          onClose={onMobileClose}
          open={openMobile}
          variant="temporary"
          PaperProps={{
            sx: {
              width: 280
            }
          }}
        >
          {content}
        </Drawer>
      ) : (
        <Drawer
          anchor="left"
          open
          variant="persistent"
          PaperProps={{
            sx: {
              width: isCollapsed ? 80 : 280,
              top: 64,
              height: 'calc(100% - 64px)',
              transition: muiTheme.transitions.create(['width'], {
                easing: muiTheme.transitions.easing.sharp,
                duration: muiTheme.transitions.duration.enteringScreen,
              }),
              overflowX: 'hidden',
              boxShadow: mode === 'dark' ? 'none' : '0px 2px 8px rgba(0, 0, 0, 0.05)'
            }
          }}
        >
          {content}
        </Drawer>
      )}
    </>
  );
};

DashboardSidebar.propTypes = {
  onMobileClose: PropTypes.func,
  openMobile: PropTypes.bool,
  isCollapsed: PropTypes.bool
};

DashboardSidebar.defaultProps = {
  onMobileClose: () => { },
  openMobile: false,
  isCollapsed: false
};

export default DashboardSidebar;
