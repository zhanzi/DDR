import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from './LoadingScreen';

const GuestGuard = ({ children }) => {
  const { isAuthenticated, isInitialized } = useAuth();

  if (!isInitialized) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

export default GuestGuard;
