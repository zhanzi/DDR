import React from 'react';
import { NavLink as RouterLink } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  Button,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  alpha,
  useTheme as useMuiTheme
} from '@mui/material';
import { useTheme } from '../contexts/ThemeContext';

const NavItem = ({
  href,
  icon: Icon,
  title,
  isCollapsed = false,
  ...rest
}) => {
  const muiTheme = useMuiTheme();
  const { mode, theme } = useTheme();

  const navButton = (
    <Button
      component={RouterLink}
      sx={{
        color: 'text.secondary',
        fontWeight: 'medium',
        justifyContent: isCollapsed ? 'center' : 'flex-start',
        letterSpacing: 0,
        py: 1.5,
        textTransform: 'none',
        width: '100%',
        borderRadius: 2,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '& svg': {
          mr: isCollapsed ? 0 : 1,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        '&.active': {
          color: mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main,
          backgroundColor: mode === 'dark'
            ? alpha(theme.palette.primary.main, 0.15)
            : alpha(theme.palette.primary.main, 0.08),
          backdropFilter: 'blur(4px)',
          boxShadow: mode === 'dark'
            ? `0 0 10px ${alpha(theme.palette.primary.main, 0.3)}`
            : `0 0 10px ${alpha(theme.palette.primary.main, 0.1)}`,
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 4,
            backgroundColor: mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main,
            boxShadow: mode === 'dark'
              ? `0 0 8px ${theme.palette.primary.main}`
              : `0 0 8px ${alpha(theme.palette.primary.main, 0.5)}`,
          },
          '& svg': {
            color: mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main,
            transform: 'scale(1.1)',
          }
        },
        '&:hover': {
          backgroundColor: mode === 'dark'
            ? alpha(theme.palette.primary.main, 0.08)
            : alpha(theme.palette.primary.main, 0.04),
          transform: 'translateY(-1px)',
          '& svg': {
            transform: 'scale(1.1)',
          }
        },
        '&:active': {
          transform: 'scale(0.98)',
        },
        minWidth: 0,
        px: isCollapsed ? 1 : 2
      }}
      to={href}
    >
      {Icon && (
        <ListItemIcon
          sx={{
            minWidth: 'auto',
            mr: isCollapsed ? 0 : 1,
            justifyContent: 'center',
            color: 'inherit',
          }}
        >
          <Icon size="20" />
        </ListItemIcon>
      )}
      {!isCollapsed && (
        <ListItemText
          primary={title}
          primaryTypographyProps={{
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        />
      )}
    </Button>
  );

  return (
    <ListItem
      disableGutters
      sx={{
        display: 'flex',
        py: 0.25,
        px: 1,
      }}
      {...rest}
    >
      {isCollapsed ? (
        <Tooltip
          title={title}
          placement="right"
          arrow
          componentsProps={{
            tooltip: {
              sx: {
                backdropFilter: 'blur(8px)',
                backgroundColor: mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.9)'
                  : 'rgba(0, 0, 0, 0.75)',
                color: mode === 'dark' ? '#121212' : '#FFFFFF',
                boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.2)',
                border: mode === 'dark'
                  ? '1px solid rgba(255, 255, 255, 0.2)'
                  : '1px solid rgba(255, 255, 255, 0.08)',
              }
            }
          }}
        >
          {navButton}
        </Tooltip>
      ) : (
        navButton
      )}
    </ListItem>
  );
};

NavItem.propTypes = {
  href: PropTypes.string,
  icon: PropTypes.elementType,
  title: PropTypes.string,
  isCollapsed: PropTypes.bool
};

// 使用 JavaScript 默认参数代替 defaultProps

export default NavItem;
