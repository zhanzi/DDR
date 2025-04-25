import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';

const AuthLayout = ({ children })  => {
  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: (theme) => theme.palette.background.default,
        py: 4,
      }}
    >
      {children || <Outlet />}
    </Box>
  );
};

export default AuthLayout;
