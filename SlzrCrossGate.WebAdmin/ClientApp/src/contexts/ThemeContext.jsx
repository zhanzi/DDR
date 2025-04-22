import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { lightTheme, darkTheme } from '../theme';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // 从本地存储中获取主题模式，或使用系统首选项
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem('themeMode');
    if (savedMode) {
      return savedMode;
    }
    // 检测系统首选项
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  // 使用 useMemo 缓存主题对象，避免不必要的重新渲染
  const theme = useMemo(() => mode === 'dark' ? darkTheme : lightTheme, [mode]);

  const toggleTheme = () => {
    setMode((prevMode) => {
      const newMode = prevMode === 'light' ? 'dark' : 'light';
      localStorage.setItem('themeMode', newMode);
      return newMode;
    });
  };

  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      const systemTheme = e.matches ? 'dark' : 'light';
      // 只有当用户没有手动设置主题时，才跟随系统变化
      if (!localStorage.getItem('themeMode')) {
        setMode(systemTheme);
      }
    };

    // 添加监听器
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // 兼容旧版浏览器
      mediaQuery.addListener(handleChange);
    }

    // 清理监听器
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  // 更新文档的数据属性，用于 CSS 选择器
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ mode, theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
