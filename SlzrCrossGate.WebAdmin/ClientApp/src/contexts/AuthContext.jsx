import { createContext, useContext, useEffect, useReducer } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

// 初始状态
const initialState = {
  isAuthenticated: false,
  isInitialized: false,
  user: null,
  token: null,
};

// 定义 reducer
const reducer = (state, action) => {
  switch (action.type) {
    case 'INITIALIZE':
      return {
        ...state,
        isAuthenticated: action.payload.isAuthenticated,
        isInitialized: true,
        user: action.payload.user,
        token: action.payload.token,
      };
    case 'LOGIN':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
      };
    case 'REGISTER':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
      };
    default:
      return state;
  }
};

// 创建上下文
const AuthContext = createContext(null);

// 提供者组件
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  // 设置 axios 默认请求头
  useEffect(() => {
    if (state.token) {
      axios.defaults.headers.common.Authorization = `Bearer ${state.token}`;
    } else {
      delete axios.defaults.headers.common.Authorization;
    }
  }, [state.token]);

  // 初始化认证状态
  useEffect(() => {
    const initialize = async () => {
      try {
        const token = localStorage.getItem('token');

        if (token && isValidToken(token)) {
          // 设置 axios 默认请求头
          axios.defaults.headers.common.Authorization = `Bearer ${token}`;

          // 解析 token 获取用户信息
          const user = jwtDecode(token);

          dispatch({
            type: 'INITIALIZE',
            payload: {
              isAuthenticated: true,
              user,
              token,
            },
          });
        } else {
          dispatch({
            type: 'INITIALIZE',
            payload: {
              isAuthenticated: false,
              user: null,
              token: null,
            },
          });
        }
      } catch (err) {
        console.error(err);
        dispatch({
          type: 'INITIALIZE',
          payload: {
            isAuthenticated: false,
            user: null,
            token: null,
          },
        });
      }
    };

    initialize();
  }, []);

  // 验证 token 是否有效
  const isValidToken = (token) => {
    if (!token) {
      return false;
    }

    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp > currentTime;
    } catch (err) {
      return false;
    }
  };

  // 登录
  const login = async (username, password) => {
    try {
      const response = await axios.post('/api/auth/login', {
        username,
        password,
      });

      const { token } = response.data;
      const user = jwtDecode(token);

      localStorage.setItem('token', token);

      dispatch({
        type: 'LOGIN',
        payload: {
          user,
          token,
        },
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || '登录失败，请检查用户名和密码',
      };
    }
  };

  // 注册
  const register = async (email, username, password) => {
    try {
      const response = await axios.post('/api/auth/register', {
        email,
        username,
        password,
      });

      const { token } = response.data;
      const user = jwtDecode(token);

      localStorage.setItem('token', token);

      dispatch({
        type: 'REGISTER',
        payload: {
          user,
          token,
        },
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || '注册失败，请稍后再试',
      };
    }
  };

  // 登出
  const logout = () => {
    localStorage.removeItem('token');
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// 自定义钩子
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
