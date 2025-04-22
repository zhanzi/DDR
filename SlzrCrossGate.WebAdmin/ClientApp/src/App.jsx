import { useRoutes } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import zhCN from 'date-fns/locale/zh-CN';
import routes from './routes';
import { useTheme } from './contexts/ThemeContext';

function App() {
  const content = useRoutes(routes);
  const { theme } = useTheme();

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
