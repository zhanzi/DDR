import { createContext, useContext, useEffect, useReducer } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import { authAPI } from '../services/api';

// 初始状态
const initialState = {
  isAuthenticated: false,
  isInitialized: false,
  user: null,
  token: null,
  needTwoFactor: false,
  isTwoFactorEnabled: false,
  tempToken: null, // 用于存储双因素验证前的临时令牌
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
        isTwoFactorEnabled: action.payload.isTwoFactorEnabled || false,
      };
    case 'LOGIN':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        needTwoFactor: false,
        tempToken: null,
        isTwoFactorEnabled: action.payload.isTwoFactorEnabled || false,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        needTwoFactor: false,
        tempToken: null,
      };
    case 'REGISTER':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        isTwoFactorEnabled: action.payload.isTwoFactorEnabled || false,
      };
    case 'NEED_TWO_FACTOR':
      return {
        ...state,
        needTwoFactor: true,
        tempToken: action.payload.tempToken,
        user: action.payload.user,
      };
    case 'TWO_FACTOR_SETUP_REQUIRED':
      return {
        ...state,
        needTwoFactor: false,
        isTwoFactorEnabled: false,
        tempToken: action.payload.tempToken,
        user: action.payload.user,
      };
    case 'TWO_FACTOR_SETUP_COMPLETE':
      return {
        ...state,
        isTwoFactorEnabled: true,
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
      const response = await authAPI.login(username, password);
      console.log('Login response:', response); // 调试日志

      // 直接使用response，因为api.js中的响应拦截器已经处理了response.data
      const { token, requireTwoFactor, setupTwoFactor, tempToken, isTwoFactorEnabled } = response;

      // 如果需要设置双因素验证
      if (setupTwoFactor) {
        const user = jwtDecode(tempToken);
        dispatch({
          type: 'TWO_FACTOR_SETUP_REQUIRED',
          payload: {
            user,
            tempToken,
          },
        });
        return { success: true, setupTwoFactor: true };
      }

      // 如果需要双因素验证
      if (requireTwoFactor) {
        const user = jwtDecode(tempToken);
        dispatch({
          type: 'NEED_TWO_FACTOR',
          payload: {
            user,
            tempToken,
          },
        });
        return { success: true, requireTwoFactor: true };
      }

      // 正常登录成功
      if (token) {
        const user = jwtDecode(token);
        localStorage.setItem('token', token);

        dispatch({
          type: 'LOGIN',
          payload: {
            user,
            token,
            isTwoFactorEnabled: isTwoFactorEnabled || false,
          },
        });

        return { success: true };
      } else {
        return {
          success: false,
          message: '登录失败，服务器没有返回token',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || '登录失败，请检查用户名和密码',
      };
    }
  };

  // 验证动态口令
  const verifyTwoFactor = async (code) => {
    try {
      const response = await authAPI.verifyCode(state.user?.userName, code);
      console.log('Verify code response:', response); // 调试日志

      const { token, isTwoFactorEnabled } = response;
      const user = jwtDecode(token);

      localStorage.setItem('token', token);

      dispatch({
        type: 'LOGIN',
        payload: {
          user,
          token,
          isTwoFactorEnabled: isTwoFactorEnabled || false,
        },
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || '验证失败，请检查动态口令',
      };
    }
  };

  // 设置动态口令
  const setupTwoFactor = async () => {
    try {
      const response = await axios.post('https://localhost:7296/api/auth/setup-two-factor', {
        tempToken: state.tempToken,
      });

      return {
        success: true,
        qrCode: response.data.qrCode,
        secret: response.data.secret,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || '设置动态口令失败',
      };
    }
  };

  // 确认动态口令设置
  const confirmTwoFactorSetup = async (code) => {
    try {
      const response = await axios.post('https://localhost:7296/api/auth/confirm-two-factor', {
        code,
        tempToken: state.tempToken,
      });

      const { token } = response.data;
      const user = jwtDecode(token);

      localStorage.setItem('token', token);

      dispatch({
        type: 'LOGIN',
        payload: {
          user,
          token,
          isTwoFactorEnabled: true,
        },
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || '验证失败，请检查动态口令',
      };
    }
  };

  // 微信扫码登录
  const loginWithWechat = async () => {
    try {
      // 获取微信扫码登录的二维码URL
      const response = await axios.get('https://localhost:7296/api/auth/wechat-login');

      return {
        success: true,
        qrCodeUrl: response.data.qrCodeUrl,
        loginId: response.data.loginId,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || '获取微信登录二维码失败',
      };
    }
  };

  // 检查微信扫码登录状态
  const checkWechatLoginStatus = async (loginId) => {
    try {
      const response = await axios.get(`https://localhost:7296/api/auth/wechat-login-status?loginId=${loginId}`);

      if (response.data.status === 'success') {
        const { token } = response.data;
        const user = jwtDecode(token);

        localStorage.setItem('token', token);

        dispatch({
          type: 'LOGIN',
          payload: {
            user,
            token,
            isTwoFactorEnabled: response.data.isTwoFactorEnabled || false,
          },
        });

        return { success: true, status: 'success' };
      }

      return {
        success: true,
        status: response.data.status,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || '检查微信登录状态失败',
      };
    }
  };

  // 注册
  const register = async (email, username, password) => {
    try {
      const response = await authAPI.register(email, username, password);
      console.log('Register response:', response); // 调试日志

      const { token } = response;
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
        verifyTwoFactor,
        setupTwoFactor,
        confirmTwoFactorSetup,
        loginWithWechat,
        checkWechatLoginStatus,
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
