import React, { useEffect, useRef } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  Avatar,
  Box,
  Divider,
  Drawer,
  List,
  Typography,
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
  Monitor as MonitorIcon,
  User as UserIcon,
  CreditCard as CreditCardIcon,
  Database as DatabaseIcon,
  Archive as ArchiveIcon,
  Book as BookIcon,
  Smartphone as SmartphoneIcon,
  Cpu as CpuIcon,
  List as ListIcon
} from 'react-feather';
import NavItem from './NavItem';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const items = [
  {
    href: '/app/dashboard',
    icon: BarChartIcon,
    title: '仪表盘',
    roles: [] // 空数组表示所有角色可见
  },
  {
    href: '/app/terminals',
    icon: SmartphoneIcon,
    title: '终端管理',
    roles: []
  },
  {
    href: '/app/terminal-records',
    icon: ListIcon,
    title: '终端记录',
    roles: ['SystemAdmin', 'MerchantAdmin']
  },
  {
    href: '/app/files',
    icon: ArchiveIcon,
    title: '文件管理',
    roles: []
  },
  {
    href: '/app/messages',
    icon: MessageCircleIcon,
    title: '消息管理',
    roles: []
  },
  {
    href: '/app/fare-params',
    icon: CreditCardIcon,
    title: '票价参数',
    roles: ['SystemAdmin', 'MerchantAdmin']
  },
  {
    href: '/app/union-pay-terminal-keys',
    icon: DatabaseIcon,
    title: '银联密钥',
    roles: ['SystemAdmin', 'MerchantAdmin']
  },
  {
    href: '/app/account',
    icon: UserIcon,
    title: '账户设置',
    roles: [] // 所有角色可见
  },
  {
    href: '/app/users',
    icon: UsersIcon,
    title: '用户管理',
    roles: ['SystemAdmin', 'MerchantAdmin'] // 仅系统管理员和商户管理员可见
  },
  {
    href: '/app/roles',
    icon: LockIcon,
    title: '角色管理',
    roles: ['SystemAdmin'] // 仅系统管理员可见
  },
  {
    href: '/app/merchants',
    icon: ShoppingBagIcon,
    title: '商户管理',
    roles: ['SystemAdmin'] // 仅系统管理员可见
  },
  {
    href: '/app/dictionary',
    icon: BookIcon,
    title: '商户字典',
    roles: ['SystemAdmin', 'MerchantAdmin']
  },
  {
    href: '/app/monitor',
    icon: MonitorIcon,
    title: '系统监控',
    roles: ['SystemAdmin']
  },
  {
    href: '/app/settings',
    icon: SettingsIcon,
    title: '系统设置',
    roles: ['SystemAdmin']
  }
];

const DashboardSidebar = ({
  onMobileClose = () => {},
  openMobile = false,
  isCollapsed = false
}) => {
  const location = useLocation();
  const muiTheme = useMuiTheme();
  const { mode, theme } = useTheme();
  const { user } = useAuth();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('lg'));

  // 创建一个 ref 来跟踪是否是首次渲染
  const isFirstRender = useRef(true);
  // 记录上一次的路径
  const prevPathRef = useRef(location.pathname);

  // 只在路由变化时关闭移动端侧边栏，而不是在openMobile变化时
  useEffect(() => {
    // 路由变化时关闭侧边栏，但不在组件首次挂载时执行
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevPathRef.current = location.pathname;
      return;
    }

    // 只有当路径变化时才关闭侧边栏
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
      if (openMobile && onMobileClose) {
        onMobileClose();
      }
    }
  }, [location.pathname, onMobileClose]);

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
          p: isCollapsed && !isMobile ? 1 : 2,
          mb: 1,
        }}
      >
        <Avatar
          component={RouterLink}
          src={user.avatar}
          sx={{
            cursor: 'pointer',
            width: isCollapsed && !isMobile ? 40 : 64,
            height: isCollapsed && !isMobile ? 40 : 64,
            transition: muiTheme.transitions.create(['width', 'height', 'box-shadow', 'transform'], {
              duration: muiTheme.transitions.duration.shorter,
              easing: muiTheme.transitions.easing.easeInOut,
            }),
            boxShadow: mode === 'dark'
              ? '0 0 15px rgba(192, 132, 252, 0.5)'
              : '0 0 15px rgba(126, 34, 206, 0.3)',
            border: `2px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.8)'}`,
            '&:hover': {
              transform: 'scale(1.05)',
              boxShadow: mode === 'dark'
                ? '0 0 20px rgba(192, 132, 252, 0.7)'
                : '0 0 20px rgba(126, 34, 206, 0.5)',
            }
          }}
          to="/app/account"
        />
        {(!isCollapsed || isMobile) && (
          <>
            <Typography
              color="textPrimary"
              variant="h5"
              sx={{
                mt: 1,
                fontWeight: 600,
                textAlign: 'center',
                background: mode === 'dark'
                  ? `linear-gradient(45deg, ${theme.palette.primary.light} 30%, ${theme.palette.secondary.light} 90%)`
                  : `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: mode === 'dark'
                  ? '0 0 10px rgba(192, 132, 252, 0.3)'
                  : '0 0 10px rgba(126, 34, 206, 0.1)',
              }}
            >
              {user?.realName || user?.name || '用户'}
            </Typography>
            <Typography
              color="textSecondary"
              variant="body2"
              sx={{
                textAlign: 'center',
                fontWeight: 500,
                opacity: 0.8,
              }}
            >
              {user?.roles?.join(', ') || '用户'}
            </Typography>
          </>
        )}
      </Box>
      <Divider />
      <Box sx={{ p: isCollapsed && !isMobile ? 1 : 2 }}>
        <List>
          {items
            .filter(item => {
              // 如果没有指定角色限制或数组为空，所有用户可见
              if (!item.roles || item.roles.length === 0) {
                return true;
              }

              // 如果用户没有角色信息，只显示无角色限制的菜单
              if (!user || !user.roles || user.roles.length === 0) {
                return false;
              }

              // 检查用户是否拥有所需角色
              return item.roles.some(role => user.roles.includes(role));
            })
            .map((item) => (
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
    </Box>
  );

  return (
    <>
      {isMobile ? (
        <Drawer
          anchor="left"
          onClose={(e) => {
            e.stopPropagation(); // 阻止事件冒泡
            onMobileClose();
          }}
          open={openMobile}
          variant="temporary"
          ModalProps={{
            keepMounted: true, // 改善移动端性能
            disableScrollLock: false, // 防止背景滚动
            disablePortal: false, // 使用传送门渲染
            disableAutoFocus: false, // 允许自动聚焦
            disableEnforceFocus: false, // 强制聚焦
          }}
          PaperProps={{
            sx: {
              width: 280,
              backdropFilter: 'blur(10px)',
              backgroundColor: mode === 'dark'
                ? 'rgba(15, 23, 42, 0.9)'
                : 'rgba(255, 255, 255, 0.9)',
              borderRight: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
              boxShadow: mode === 'dark'
                ? '0px 8px 24px rgba(0, 0, 0, 0.4)'
                : '0px 8px 24px rgba(0, 0, 0, 0.1)',
              zIndex: muiTheme.zIndex.drawer + 2, // 确保在移动端上正确显示
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
                easing: muiTheme.transitions.easing.easeInOut,
                duration: muiTheme.transitions.duration.standard,
              }),
              overflowX: 'hidden',
              backdropFilter: 'blur(10px)',
              backgroundColor: mode === 'dark'
                ? 'rgba(15, 23, 42, 0.9)'
                : 'rgba(255, 255, 255, 0.9)',
              borderRight: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
              boxShadow: mode === 'dark'
                ? 'none'
                : '0px 2px 8px rgba(0, 0, 0, 0.05)',
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

// 使用 JavaScript 默认参数代替 defaultProps

export default DashboardSidebar;
