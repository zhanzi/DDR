import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from './LoadingScreen';

const AuthGuard = ({ children }) => {
  const { isAuthenticated, isInitialized } = useAuth();

  if (!isInitialized) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" />;
  }

  return children;
};

export default AuthGuard;
