import React, { useEffect, useRef, useState } from 'react';
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
  useTheme as useMuiTheme,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Collapse,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  alpha
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
  List as ListIcon,
  ChevronDown as ChevronDownIcon,
  ChevronRight as ChevronRightIcon,
  Activity as ActivityIcon,
  Folder as FolderIcon,
  Sliders as SlidersIcon,
  Shield as ShieldIcon
} from 'react-feather';
import NavItem from './NavItem';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

// 菜单分组配置
const menuGroups = [
  {
    id: 'overview',
    title: '概览监控',
    icon: ActivityIcon,
    items: [
      {
        href: '/app/dashboard',
        icon: BarChartIcon,
        title: '仪表盘',
        roles: []
      }
    ]
  },
  {
    id: 'terminal',
    title: '终端管理',
    icon: SmartphoneIcon,
    items: [
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
        href: '/app/terminal-events',
        icon: CpuIcon,
        title: '终端事件',
        roles: ['SystemAdmin', 'MerchantAdmin']
      }
    ]
  },
  {
    id: 'content',
    title: '内容管理',
    icon: FolderIcon,
    items: [
      {
        href: '/app/files/types',
        icon: FileTextIcon,
        title: '文件类型',
        roles: []
      },
      {
        href: '/app/files/versions',
        icon: ArchiveIcon,
        title: '文件版本',
        roles: []
      },
      {
        href: '/app/files/publish-list',
        icon: ServerIcon,
        title: '发布记录',
        roles: []
      },
      {
        href: '/app/messages-types',
        icon: ListIcon,
        title: '消息类型',
        roles: []
      },
      {
        href: '/app/messages',
        icon: MessageCircleIcon,
        title: '消息管理',
        roles: []
      }
    ]
  },
  {
    id: 'business',
    title: '业务配置',
    icon: SlidersIcon,
    items: [
      {
        href: '/app/fare-params',
        icon: CreditCardIcon,
        title: '线路参数',
        roles: ['SystemAdmin', 'MerchantAdmin']
      },
      {
        href: '/app/union-pay-terminal-keys',
        icon: DatabaseIcon,
        title: '银联密钥',
        roles: ['SystemAdmin', 'MerchantAdmin']
      },
      {
        href: '/app/dictionary',
        icon: BookIcon,
        title: '商户字典',
        roles: ['SystemAdmin', 'MerchantAdmin']
      }
    ]
  },
  {
    id: 'system',
    title: '系统管理',
    icon: ShieldIcon,
    items: [
      {
        href: '/app/users',
        icon: UsersIcon,
        title: '用户管理',
        roles: ['SystemAdmin', 'MerchantAdmin']
      },
      {
        href: '/app/roles',
        icon: LockIcon,
        title: '角色管理',
        roles: ['SystemAdmin']
      },
      {
        href: '/app/merchants',
        icon: ShoppingBagIcon,
        title: '商户管理',
        roles: ['SystemAdmin']
      },
      {
        href: '/app/settings',
        icon: SettingsIcon,
        title: '系统设置',
        roles: ['SystemAdmin']
      }
    ]
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

  // 分组展开状态管理
  const [expandedGroups, setExpandedGroups] = useState(() => {
    // 从localStorage读取展开状态，默认全部展开
    const saved = localStorage.getItem('sidebar-expanded-groups');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse saved expanded groups:', e);
      }
    }
    // 默认全部展开
    return menuGroups.reduce((acc, group) => {
      acc[group.id] = true;
      return acc;
    }, {});
  });

  // 保存展开状态到localStorage
  const saveExpandedState = (newState) => {
    try {
      localStorage.setItem('sidebar-expanded-groups', JSON.stringify(newState));
    } catch (e) {
      console.warn('Failed to save expanded groups:', e);
    }
  };

  // 切换分组展开状态
  const toggleGroup = (groupId) => {
    const newState = {
      ...expandedGroups,
      [groupId]: !expandedGroups[groupId]
    };
    setExpandedGroups(newState);
    saveExpandedState(newState);
  };

  // 检查用户是否有权限访问菜单项
  const hasPermission = (item) => {
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
  };

  // 检查分组是否有可见的菜单项
  const hasVisibleItems = (group) => {
    return group.items.some(item => hasPermission(item));
  };

  // 分组菜单项组件
  const MenuGroup = ({ group }) => {
    const GroupIcon = group.icon;
    const isExpanded = expandedGroups[group.id];
    const visibleItems = group.items.filter(item => hasPermission(item));

    if (visibleItems.length === 0) {
      return null;
    }

    // 折叠模式下的处理
    if (isCollapsed && !isMobile) {
      return (
        <Box sx={{ mb: 1 }}>
          {visibleItems.map((item) => (
            <NavItem
              key={item.title}
              href={item.href}
              title={item.title}
              icon={item.icon}
              isCollapsed={true}
            />
          ))}
        </Box>
      );
    }

    return (
      <Box sx={{ mb: 1 }}>
        {/* 分组标题 */}
        <ListItemButton
          onClick={() => toggleGroup(group.id)}
          sx={{
            py: 1.25,
            px: 2,
            borderRadius: 2,
            mb: 0.75,
            mt: group.id === 'overview' ? 0 : 1,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              backgroundColor: mode === 'dark'
                ? alpha(theme.palette.primary.main, 0.08)
                : alpha(theme.palette.primary.main, 0.04),
            }
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 'auto',
              mr: 1,
              color: mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main,
            }}
          >
            <GroupIcon size="18" />
          </ListItemIcon>
          <ListItemText
            primary={group.title}
            primaryTypographyProps={{
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              letterSpacing: '0.15px',
              color: mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main,
            }}
          />
          {isExpanded ? (
            <ChevronDownIcon size="16" style={{
              color: mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main,
              transition: 'transform 0.2s'
            }} />
          ) : (
            <ChevronRightIcon size="16" style={{
              color: mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main,
              transition: 'transform 0.2s'
            }} />
          )}
        </ListItemButton>

        {/* 分组菜单项 */}
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <List sx={{ pl: 1 }}>
            {visibleItems.map((item) => (
              <NavItem
                key={item.title}
                href={item.href}
                title={item.title}
                icon={item.icon}
                isCollapsed={false}
              />
            ))}
          </List>
        </Collapse>
      </Box>
    );
  };

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
        <List sx={{ py: 0 }}>
          {menuGroups
            .filter(group => hasVisibleItems(group))
            .map((group) => (
              <MenuGroup key={group.id} group={group} />
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
