import React from 'react';
import { NavLink as RouterLink } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  Button,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip
} from '@mui/material';

const NavItem = ({
  href,
  icon: Icon,
  title,
  isCollapsed,
  ...rest
}) => {
  const navButton = (
    <Button
      component={RouterLink}
      sx={{
        color: 'text.secondary',
        fontWeight: 'medium',
        justifyContent: isCollapsed ? 'center' : 'flex-start',
        letterSpacing: 0,
        py: 1.25,
        textTransform: 'none',
        width: '100%',
        '& svg': {
          mr: isCollapsed ? 0 : 1
        },
        '&.active': {
          color: 'primary.main',
          backgroundColor: 'rgba(0, 171, 85, 0.08)'
        },
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.04)'
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
            justifyContent: 'center'
          }}
        >
          <Icon size="20" />
        </ListItemIcon>
      )}
      {!isCollapsed && <ListItemText primary={title} />}
    </Button>
  );

  return (
    <ListItem
      disableGutters
      sx={{
        display: 'flex',
        py: 0
      }}
      {...rest}
    >
      {isCollapsed ? (
        <Tooltip title={title} placement="right">
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

NavItem.defaultProps = {
  isCollapsed: false
};

export default NavItem;
