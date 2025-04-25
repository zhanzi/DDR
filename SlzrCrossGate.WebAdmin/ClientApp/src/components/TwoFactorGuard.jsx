import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from './LoadingScreen';

const TwoFactorGuard = ({ children }) => {
  const { isAuthenticated, isInitialized, needTwoFactor } = useAuth();

  if (!isInitialized) {
    return <LoadingScreen />;
  }

  // 如果用户未认证，重定向到登录页面
  if (!isAuthenticated && !needTwoFactor) {
    return <Navigate to="/login" />;
  }

  // 如果用户需要完成双因素验证，重定向到验证页面
  if (needTwoFactor) {
    return <Navigate to="/two-factor-verify" />;
  }

  // 用户已认证且不需要双因素验证，允许访问
  return children;
};

export default TwoFactorGuard;
