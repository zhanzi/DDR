import { createTheme } from '@mui/material/styles';

// 颜色配置 - 玻璃拟态+微立体感风格
const PRIMARY = {
  lighter: '#F3E8FF',
  light: '#C084FC',
  main: '#7E22CE',  // 紫色主题 - 根据要求使用 #7E22CE
  dark: '#6B21A8',
  darker: '#581C87',
};

// 辅助色按Material You算法生成
const SECONDARY = {
  lighter: '#FDF4FF',
  light: '#E879F9',
  main: '#D946EF',  // 粉紫色辅助色
  dark: '#A21CAF',
  darker: '#701A75',
};

const INFO = {
  lighter: '#EFF6FF',
  light: '#93C5FD',
  main: '#3B82F6',  // 蓝色 - 信息色
  dark: '#1D4ED8',
  darker: '#1E3A8A',
};

const SUCCESS = {
  lighter: '#ECFDF5',
  light: '#6EE7B7',
  main: '#10B981',  // 绿色 - 成功色
  dark: '#059669',
  darker: '#065F46',
};

const WARNING = {
  lighter: '#FFFBEB',
  light: '#FCD34D',
  main: '#F59E0B',  // 黄色 - 警告色
  dark: '#D97706',
  darker: '#92400E',
};

const ERROR = {
  lighter: '#FEF2F2',
  light: '#FCA5A5',
  main: '#EF4444',  // 红色 - 错误色
  dark: '#DC2626',
  darker: '#991B1B',
};

const GREY = {
  0: '#FFFFFF',
  50: '#FAFAFA',
  100: '#F5F5F5',
  200: '#E5E7EB',
  300: '#D1D5DB',
  400: '#9CA3AF',
  500: '#6B7280',
  600: '#4B5563',
  700: '#374151',
  800: '#1F2937',
  900: '#111827',
  950: '#030712',
};

// 添加噪点纹理生成函数
const createNoiseTexture = (opacity = 0.05) => {
  return {
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      opacity: opacity,
      pointerEvents: 'none',
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'repeat',
      backgroundSize: '100px 100px',
      zIndex: 0,
    }
  };
};

// 创建亮色主题 - 玻璃拟态+微立体感设计
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
      default: '#F5F3FF', // 浅紫色背景，与主题色相匹配
      paper: 'rgba(255, 255, 255, 0.85)', // 半透明纸张背景，实现玻璃拟态
    },
    text: {
      primary: GREY[800],
      secondary: GREY[600],
      disabled: GREY[500],
    },
    divider: 'rgba(0, 0, 0, 0.08)', // 半透明分隔线
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
          width: '100%',
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '100px 100px',
          backgroundBlendMode: 'overlay',
          backgroundAttachment: 'fixed',
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
    MuiAppBar: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: 'none',
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
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
            transform: 'translateY(-2px)',
          },
          '&:active': {
            transform: 'scale(0.98)',
          },
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        sizeLarge: {
          height: 48,
        },
        containedPrimary: {
          background: PRIMARY.main,
          '&:hover': {
            background: PRIMARY.dark,
          },
          boxShadow: `0 4px 14px 0 ${PRIMARY.main}40`,
        },
        outlinedPrimary: {
          border: `1px solid ${PRIMARY.main}`,
          '&:hover': {
            backgroundColor: `${PRIMARY.lighter}`,
            boxShadow: `0 4px 14px 0 ${PRIMARY.main}30`,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          boxShadow: `
            0px 4px 16px rgba(0, 0, 0, 0.08),
            0px 1px 4px rgba(0, 0, 0, 0.04),
            inset 0px 0px 0px 1px rgba(255, 255, 255, 0.5)
          `,
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: `
              0px 8px 30px rgba(0, 0, 0, 0.12),
              0px 2px 8px rgba(0, 0, 0, 0.06),
              inset 0px 0px 0px 1.5px rgba(255, 255, 255, 0.6)
            `,
            transform: 'translateY(-4px)',
          },
          overflow: 'visible',
          border: '1px solid rgba(255, 255, 255, 0.18)',
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          padding: '24px',
          borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
        },
        title: {
          fontSize: '1.125rem',
          fontWeight: 600,
          color: PRIMARY.dark,
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
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          borderRadius: 12,
        },
        elevation1: {
          boxShadow: `
            0px 4px 20px rgba(0, 0, 0, 0.05),
            inset 0px 0px 0px 1px rgba(255, 255, 255, 0.5)
          `,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '16px 24px',
        },
        head: {
          color: GREY[700],
          fontWeight: 600,
          backgroundColor: 'rgba(0, 0, 0, 0.02)',
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
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
          },
          '&:nth-of-type(even)': {
            backgroundColor: 'rgba(0, 0, 0, 0.01)', // 斑马纹
          },
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: `
            0px 4px 20px rgba(0, 0, 0, 0.05),
            inset 0px 0px 0px 1px rgba(255, 255, 255, 0.5)
          `,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
          backdropFilter: 'blur(8px)',
          '&.MuiChip-colorPrimary': {
            backgroundColor: `${PRIMARY.main}20`,
            color: PRIMARY.dark,
            border: `1px solid ${PRIMARY.main}40`,
          },
          '&.MuiChip-colorSecondary': {
            backgroundColor: `${SECONDARY.main}20`,
            color: SECONDARY.dark,
            border: `1px solid ${SECONDARY.main}40`,
          },
          '&.MuiChip-colorSuccess': {
            backgroundColor: `${SUCCESS.main}20`,
            color: SUCCESS.dark,
            border: `1px solid ${SUCCESS.main}40`,
          },
          '&.MuiChip-colorError': {
            backgroundColor: `${ERROR.main}20`,
            color: ERROR.dark,
            border: `1px solid ${ERROR.main}40`,
          },
          '&.MuiChip-colorWarning': {
            backgroundColor: `${WARNING.main}20`,
            color: WARNING.dark,
            border: `1px solid ${WARNING.main}40`,
          },
          '&.MuiChip-colorInfo': {
            backgroundColor: `${INFO.main}20`,
            color: INFO.dark,
            border: `1px solid ${INFO.main}40`,
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          backgroundColor: PRIMARY.main,
          color: '#FFFFFF',
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.15)',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          borderRadius: 8,
          fontSize: '0.75rem',
          padding: '8px 16px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.2)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          borderRight: '1px solid rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: 16,
          boxShadow: `
            0px 8px 32px rgba(0, 0, 0, 0.08),
            0px 2px 8px rgba(0, 0, 0, 0.04),
            inset 0px 0px 0px 1px rgba(255, 255, 255, 0.5)
          `,
          border: '1px solid rgba(255, 255, 255, 0.18)',
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: 'none',
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(10px)',
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          },
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          },
          '& .MuiDataGrid-row': {
            '&:nth-of-type(even)': {
              backgroundColor: 'rgba(0, 0, 0, 0.01)', // 斑马纹
            },
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            },
          },
          '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-cell:focus': {
            outline: 'none',
          },
          '& .MuiDataGrid-columnHeader:focus-within, & .MuiDataGrid-cell:focus-within': {
            outline: 'none',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            backdropFilter: 'blur(4px)',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
            },
            '&.Mui-focused': {
              boxShadow: `0 0 0 2px ${PRIMARY.main}40`,
            },
            '& fieldset': {
              borderColor: 'rgba(0, 0, 0, 0.1)',
            },
            '& input[type="password"]': {
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: 8,
            },
          },
        },
      },
    },
  },
});

// 创建暗色主题 - 玻璃拟态+微立体感设计
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      ...PRIMARY,
      main: '#C084FC', // 更亮的紫色，适合暗色模式
    },
    secondary: {
      ...SECONDARY,
      main: '#E879F9', // 更亮的粉紫色
    },
    info: {
      ...INFO,
      main: '#93C5FD', // 更亮的浅蓝色
    },
    success: {
      ...SUCCESS,
      main: '#6EE7B7', // 更亮的绿色
    },
    warning: {
      ...WARNING,
      main: '#FCD34D', // 更亮的黄色
    },
    error: {
      ...ERROR,
      main: '#FCA5A5', // 更亮的红色
    },
    background: {
      default: '#0F172A', // 深色背景，带有一点蓝色调
      paper: 'rgba(30, 41, 59, 0.85)', // 半透明纸张背景，实现玻璃拟态
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
          width: '100%',
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '100px 100px',
          backgroundBlendMode: 'overlay',
          backgroundAttachment: 'fixed',
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
    MuiAppBar: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: 'none',
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
            transform: 'translateY(-2px)',
          },
          '&:active': {
            transform: 'scale(0.98)',
          },
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        sizeLarge: {
          height: 48,
        },
        containedPrimary: {
          background: PRIMARY.main,
          '&:hover': {
            background: PRIMARY.light,
          },
          boxShadow: `0 4px 14px 0 ${PRIMARY.main}40`,
        },
        outlinedPrimary: {
          border: `1px solid ${PRIMARY.light}`,
          '&:hover': {
            backgroundColor: `${PRIMARY.main}20`,
            boxShadow: `0 4px 14px 0 ${PRIMARY.main}30`,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(30, 41, 59, 0.85)',
          boxShadow: `
            0px 4px 16px rgba(0, 0, 0, 0.4),
            0px 1px 4px rgba(0, 0, 0, 0.2),
            inset 0px 0px 0px 1px rgba(255, 255, 255, 0.1)
          `,
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: `
              0px 8px 30px rgba(0, 0, 0, 0.6),
              0px 2px 8px rgba(0, 0, 0, 0.4),
              inset 0px 0px 0px 1.5px rgba(255, 255, 255, 0.15)
            `,
            transform: 'translateY(-4px)',
          },
          overflow: 'visible',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          padding: '24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        },
        title: {
          fontSize: '1.125rem',
          fontWeight: 600,
          color: PRIMARY.light,
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
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(30, 41, 59, 0.85)',
          borderRadius: 12,
        },
        elevation1: {
          boxShadow: `
            0px 4px 20px rgba(0, 0, 0, 0.4),
            inset 0px 0px 0px 1px rgba(255, 255, 255, 0.1)
          `,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
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
          '&:nth-of-type(even)': {
            backgroundColor: 'rgba(255, 255, 255, 0.02)', // 斑马纹
          },
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: `
            0px 4px 20px rgba(0, 0, 0, 0.4),
            inset 0px 0px 0px 1px rgba(255, 255, 255, 0.1)
          `,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
          backdropFilter: 'blur(8px)',
          '&.MuiChip-colorPrimary': {
            backgroundColor: `${PRIMARY.main}30`,
            color: PRIMARY.lighter,
            border: `1px solid ${PRIMARY.main}60`,
          },
          '&.MuiChip-colorSecondary': {
            backgroundColor: `${SECONDARY.main}30`,
            color: SECONDARY.lighter,
            border: `1px solid ${SECONDARY.main}60`,
          },
          '&.MuiChip-colorSuccess': {
            backgroundColor: `${SUCCESS.main}30`,
            color: SUCCESS.lighter,
            border: `1px solid ${SUCCESS.main}60`,
          },
          '&.MuiChip-colorError': {
            backgroundColor: `${ERROR.main}30`,
            color: ERROR.lighter,
            border: `1px solid ${ERROR.main}60`,
          },
          '&.MuiChip-colorWarning': {
            backgroundColor: `${WARNING.main}30`,
            color: WARNING.lighter,
            border: `1px solid ${WARNING.main}60`,
          },
          '&.MuiChip-colorInfo': {
            backgroundColor: `${INFO.main}30`,
            color: INFO.lighter,
            border: `1px solid ${INFO.main}60`,
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          backgroundColor: PRIMARY.main,
          color: '#FFFFFF',
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.4)',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          color: '#121212',
          backdropFilter: 'blur(8px)',
          borderRadius: 8,
          fontSize: '0.75rem',
          padding: '8px 16px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.4)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(30, 41, 59, 0.9)',
          borderRadius: 16,
          boxShadow: `
            0px 8px 32px rgba(0, 0, 0, 0.4),
            0px 2px 8px rgba(0, 0, 0, 0.2),
            inset 0px 0px 0px 1px rgba(255, 255, 255, 0.1)
          `,
          border: '1px solid rgba(255, 255, 255, 0.08)',
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: 'none',
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: 'rgba(30, 41, 59, 0.7)',
          backdropFilter: 'blur(10px)',
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          },
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          },
          '& .MuiDataGrid-row': {
            '&:nth-of-type(even)': {
              backgroundColor: 'rgba(255, 255, 255, 0.02)', // 斑马纹
            },
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
            },
          },
          '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-cell:focus': {
            outline: 'none',
          },
          '& .MuiDataGrid-columnHeader:focus-within, & .MuiDataGrid-cell:focus-within': {
            outline: 'none',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            backdropFilter: 'blur(4px)',
            backgroundColor: 'rgba(30, 41, 59, 0.9)',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              backgroundColor: 'rgba(30, 41, 59, 0.95)',
            },
            '&.Mui-focused': {
              boxShadow: `0 0 0 2px ${PRIMARY.main}40`,
            },
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.15)',
            },
            '& input[type="password"]': {
              backgroundColor: 'rgba(30, 41, 59, 0.95)',
              borderRadius: 8,
            },
          },
        },
      },
    },
  },
});
