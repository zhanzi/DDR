import { useRoutes } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import zhCN from 'date-fns/locale/zh-CN';
import routes from './routes.jsx';
import { useTheme } from './contexts/ThemeContext';
import { useAuth } from './contexts/AuthContext';

function App() {
  const content = useRoutes(routes);
  const { theme } = useTheme();
  //const { isAuthenticated, logout } = useAuth();

  console.log('Theme:', theme); // 调试主题
  console.log('Routes content:', content); // 调试路由内容

    // // 添加全局路由守卫
    // useEffect(() => {
    //     // 检查token是否过期
    //     if (isAuthenticated) {
    //         const token = localStorage.getItem('token');
    //         if (token) {
    //             const decodedToken = jwt_decode(token);
    //             if (decodedToken.exp * 1000 < Date.now()) {
    //                 // token过期，清除登录状态
    //                 logout();
    //             }
    //         }
    //     }
    // }, [isAuthenticated]);

  return (
    <MuiThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhCN}>
        <CssBaseline />
        {content}
      </LocalizationProvider>
    </MuiThemeProvider>
  );
}

export default App;
