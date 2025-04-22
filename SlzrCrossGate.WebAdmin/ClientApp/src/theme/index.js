import { createTheme } from '@mui/material/styles';

// 颜色配置 - 更现代化的配色方案
const PRIMARY = {
  lighter: '#E6F7FF',
  light: '#69C0FF',
  main: '#1890FF',  // 蓝色主题 - 更现代的科技蓝
  dark: '#0C53B7',
  darker: '#04297A',
};

const SECONDARY = {
  lighter: '#F5F5FF',
  light: '#B39DDB',
  main: '#673AB7',  // 紫色次要色 - 科技感
  dark: '#4527A0',
  darker: '#311B92',
};

const INFO = {
  lighter: '#E3F2FD',
  light: '#4FC3F7',
  main: '#03A9F4',  // 浅蓝色 - 信息色
  dark: '#0288D1',
  darker: '#01579B',
};

const SUCCESS = {
  lighter: '#E8F5E9',
  light: '#81C784',
  main: '#4CAF50',  // 绿色 - 成功色
  dark: '#388E3C',
  darker: '#1B5E20',
};

const WARNING = {
  lighter: '#FFF8E1',
  light: '#FFD54F',
  main: '#FFC107',  // 黄色 - 警告色
  dark: '#FFA000',
  darker: '#FF6F00',
};

const ERROR = {
  lighter: '#FFEBEE',
  light: '#EF9A9A',
  main: '#F44336',  // 红色 - 错误色
  dark: '#D32F2F',
  darker: '#B71C1C',
};

const GREY = {
  0: '#FFFFFF',
  50: '#FAFAFA',
  100: '#F5F5F5',
  200: '#EEEEEE',
  300: '#E0E0E0',
  400: '#BDBDBD',
  500: '#9E9E9E',
  600: '#757575',
  700: '#616161',
  800: '#424242',
  900: '#212121',
};

// 创建亮色主题 - 更现代化的设计
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: PRIMARY,
    secondary: SECONDARY,
    info: INFO,
    success: SUCCESS,
    warning: WARNING,
    error: ERROR,
    grey: GREY,
    background: {
      default: '#F8FAFF', // 更浅的背景色，带有一点蓝色调
      paper: '#FFFFFF',
    },
    text: {
      primary: GREY[800],
      secondary: GREY[600],
      disabled: GREY[500],
    },
    divider: GREY[200], // 更浅的分隔线
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
      letterSpacing: '-0.01em',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontWeight: 700,
      fontSize: '1.75rem',
      lineHeight: 1.4,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
      letterSpacing: '-0.01em',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.5,
      letterSpacing: '-0.01em',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      lineHeight: 1.5,
      letterSpacing: '-0.01em',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
      letterSpacing: '0.00938em',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      letterSpacing: '0.00938em',
    },
    button: {
      fontWeight: 600,
      fontSize: '0.875rem',
      textTransform: 'none',
      letterSpacing: '0.02857em',
    },
  },
  shape: {
    borderRadius: 10, // 更大的圆角
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(31, 41, 55, 0.06)',
    '0px 4px 6px rgba(31, 41, 55, 0.08)',
    '0px 5px 15px rgba(31, 41, 55, 0.08)',
    '0px 10px 24px rgba(31, 41, 55, 0.08)',
    '0px 12px 28px rgba(31, 41, 55, 0.10)',
    '0px 14px 32px rgba(31, 41, 55, 0.12)',
    '0px 16px 36px rgba(31, 41, 55, 0.14)',
    '0px 18px 40px rgba(31, 41, 55, 0.16)',
    '0px 20px 44px rgba(31, 41, 55, 0.18)',
    '0px 22px 48px rgba(31, 41, 55, 0.20)',
    '0px 24px 52px rgba(31, 41, 55, 0.22)',
    '0px 26px 56px rgba(31, 41, 55, 0.24)',
    '0px 28px 60px rgba(31, 41, 55, 0.26)',
    '0px 30px 64px rgba(31, 41, 55, 0.28)',
    '0px 32px 68px rgba(31, 41, 55, 0.30)',
    '0px 34px 72px rgba(31, 41, 55, 0.32)',
    '0px 36px 76px rgba(31, 41, 55, 0.34)',
    '0px 38px 80px rgba(31, 41, 55, 0.36)',
    '0px 40px 84px rgba(31, 41, 55, 0.38)',
    '0px 42px 88px rgba(31, 41, 55, 0.40)',
    '0px 44px 92px rgba(31, 41, 55, 0.42)',
    '0px 46px 96px rgba(31, 41, 55, 0.44)',
    '0px 48px 100px rgba(31, 41, 55, 0.46)',
    '0px 50px 104px rgba(31, 41, 55, 0.48)',
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': {
          boxSizing: 'border-box',
          margin: 0,
          padding: 0,
        },
        html: {
          MozOsxFontSmoothing: 'grayscale',
          WebkitFontSmoothing: 'antialiased',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100%',
          width: '100%'
        },
        body: {
          display: 'flex',
          flex: '1 1 auto',
          flexDirection: 'column',
          minHeight: '100%',
          width: '100%'
        },
        '#root': {
          display: 'flex',
          flex: '1 1 auto',
          flexDirection: 'column',
          height: '100%',
          width: '100%'
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          boxShadow: 'none',
          fontWeight: 600,
          '&:hover': {
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
            transform: 'translateY(-1px)',
          },
          transition: 'all 0.2s ease-in-out',
        },
        sizeLarge: {
          height: 48,
        },
        containedPrimary: {
          '&:hover': {
            backgroundColor: PRIMARY.dark,
          },
        },
        outlinedPrimary: {
          border: `1px solid ${PRIMARY.main}`,
          '&:hover': {
            backgroundColor: `${PRIMARY.lighter}`,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)',
          borderRadius: 16,
          transition: 'transform 0.3s, box-shadow 0.3s',
          '&:hover': {
            boxShadow: '0px 8px 30px rgba(0, 0, 0, 0.12)',
          },
          overflow: 'visible'
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          padding: '24px',
        },
        title: {
          fontSize: '1.125rem',
          fontWeight: 600,
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '24px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${GREY[200]}`,
          padding: '16px 24px',
        },
        head: {
          color: GREY[700],
          fontWeight: 600,
          backgroundColor: GREY[50],
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:last-child td': {
            borderBottom: 0,
          },
          '&:hover': {
            backgroundColor: GREY[50],
          },
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          overflow: 'hidden',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          backgroundColor: PRIMARY.main,
          color: '#FFFFFF',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: GREY[800],
          borderRadius: 8,
          fontSize: '0.75rem',
          padding: '8px 16px',
        },
      },
    },
  },
});

// 创建暗色主题 - 更现代化的设计
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      ...PRIMARY,
      main: '#4DABF5', // 更亮的蓝色，适合暗色模式
    },
    secondary: {
      ...SECONDARY,
      main: '#9C7CF6', // 更亮的紫色
    },
    info: {
      ...INFO,
      main: '#64B6F7', // 更亮的浅蓝色
    },
    success: {
      ...SUCCESS,
      main: '#76D275', // 更亮的绿色
    },
    warning: {
      ...WARNING,
      main: '#FFD54F', // 更亮的黄色
    },
    error: {
      ...ERROR,
      main: '#FF6B6B', // 更亮的红色
    },
    background: {
      default: '#121212', // 深色背景
      paper: '#1E1E1E', // 深色纸张
    },
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.7)',
      disabled: 'rgba(255, 255, 255, 0.5)',
    },
    divider: 'rgba(255, 255, 255, 0.12)',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
      letterSpacing: '-0.01em',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontWeight: 700,
      fontSize: '1.75rem',
      lineHeight: 1.4,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
      letterSpacing: '-0.01em',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.5,
      letterSpacing: '-0.01em',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      lineHeight: 1.5,
      letterSpacing: '-0.01em',
    },
  },
  shape: {
    borderRadius: 10, // 与亮色主题保持一致
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': {
          boxSizing: 'border-box',
          margin: 0,
          padding: 0,
        },
        html: {
          MozOsxFontSmoothing: 'grayscale',
          WebkitFontSmoothing: 'antialiased',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100%',
          width: '100%'
        },
        body: {
          display: 'flex',
          flex: '1 1 auto',
          flexDirection: 'column',
          minHeight: '100%',
          width: '100%'
        },
        '#root': {
          display: 'flex',
          flex: '1 1 auto',
          flexDirection: 'column',
          height: '100%',
          width: '100%'
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          boxShadow: 'none',
          fontWeight: 600,
          '&:hover': {
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)',
            transform: 'translateY(-1px)',
          },
          transition: 'all 0.2s ease-in-out',
        },
        sizeLarge: {
          height: 48,
        },
        containedPrimary: {
          '&:hover': {
            backgroundColor: '#5CBBFF', // 更亮的蓝色
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.4)',
          borderRadius: 16,
          border: '1px solid rgba(255, 255, 255, 0.12)',
          transition: 'transform 0.3s, box-shadow 0.3s',
          '&:hover': {
            boxShadow: '0px 8px 30px rgba(0, 0, 0, 0.6)',
          },
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          padding: '24px',
        },
        title: {
          fontSize: '1.125rem',
          fontWeight: 600,
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '24px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#1E1E1E',
        },
        elevation1: {
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.4)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          padding: '16px 24px',
        },
        head: {
          color: '#FFFFFF',
          fontWeight: 600,
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:last-child td': {
            borderBottom: 0,
          },
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
          },
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          overflow: 'hidden',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          backgroundColor: PRIMARY.main,
          color: '#FFFFFF',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          color: '#121212',
          borderRadius: 8,
          fontSize: '0.75rem',
          padding: '8px 16px',
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.2)',
        },
      },
    },
  },
});
