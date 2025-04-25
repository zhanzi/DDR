import { createContext, useContext, useEffect, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

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
      const response = await authAPI.verifyTwoFactorCode({
        TempToken: state.tempToken,
        Code: code
      });
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
      if (!state.tempToken) {
        console.error('临时令牌不存在');
        return {
          success: false,
          message: '临时令牌不存在，请重新登录',
        };
      }

      console.log('调用setupTwoFactor API，临时令牌:', state.tempToken);
      // 打印完整的临时令牌用于调试
      console.log('完整临时令牌:', state.tempToken);
      const response = await authAPI.setupTwoFactor(state.tempToken);
      console.log('setupTwoFactor API响应:', response);

      // 检查响应中是否包含必要的字段
      if (!response || (!response.secretKey && !response.qrCodeUrl)) {
        console.error('API响应中缺少必要的字段:', response);
        return {
          success: false,
          message: '服务器响应格式错误，请联系管理员',
        };
      }

      // 保存secretKey到localStorage，以便后续使用
      const secretKey = response.secretKey;
      if (secretKey) {
        localStorage.setItem('twoFactorSecretKey', secretKey);
        console.log('保存secretKey到localStorage:', secretKey);
      }

      return {
        success: true,
        qrCode: response.qrCodeUrl,
        secret: secretKey,
      };
    } catch (error) {
      console.error('setupTwoFactor API错误:', error);
      console.error('错误详情:', error.response?.data);

      // 更详细的错误信息
      let errorMessage = '设置动态口令失败';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        message: errorMessage,
      };
    }
  };

  // 确认动态口令设置
  const confirmTwoFactorSetup = async (code) => {
    try {
      if (!state.tempToken) {
        return {
          success: false,
          message: '临时令牌不存在，请重新登录',
        };
      }

      const response = await authAPI.confirmTwoFactor(code, state.tempToken);

      const { token } = response;
      const user = jwtDecode(token);

      // 清除localStorage中的临时密钥
      localStorage.removeItem('twoFactorSecretKey');
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
      const response = await authAPI.getWechatLoginQrCode();

      return {
        success: true,
        qrCodeUrl: response.qrCodeUrl,
        loginId: response.loginId,
      };
    } catch (error) {
      console.error('获取微信登录二维码失败:', error);
      return {
        success: false,
        message: error.response?.data?.message || '获取微信登录二维码失败',
      };
    }
  };

  // 检查微信扫码登录状态
  const checkWechatLoginStatus = async (loginId) => {
    try {
      const response = await authAPI.checkWechatLoginStatus(loginId);

      if (response.status === 'success') {
        const { token } = response;
        const user = jwtDecode(token);

        localStorage.setItem('token', token);

        dispatch({
          type: 'LOGIN',
          payload: {
            user,
            token,
            isTwoFactorEnabled: response.isTwoFactorEnabled || false,
          },
        });

        return { success: true, status: 'success' };
      } else if (response.status === 'unbound') {
        // 微信未绑定
        return {
          success: true,
          status: 'unbound',
          openId: response.openId,
          unionId: response.unionId,
          nickname: response.nickname
        };
      }

      return {
        success: true,
        status: response.status,
      };
    } catch (error) {
      console.error('检查微信登录状态失败:', error);
      return {
        success: false,
        message: error.response?.data?.message || '检查微信登录状态失败',
      };
    }
  };

  // 绑定微信账号
  const bindWechat = async (openId, unionId, nickname) => {
    try {
      await authAPI.bindWechat({
        openId,
        unionId,
        nickname
      });

      return { success: true };
    } catch (error) {
      console.error('绑定微信账号失败:', error);
      return {
        success: false,
        message: error.response?.data?.message || '绑定微信账号失败',
      };
    }
  };

  // 解绑微信账号
  const unbindWechat = async () => {
    try {
      await authAPI.unbindWechat();

      return { success: true };
    } catch (error) {
      console.error('解绑微信账号失败:', error);
      return {
        success: false,
        message: error.response?.data?.message || '解绑微信账号失败',
      };
    }
  };

  // 获取微信绑定状态
  const getWechatBinding = async () => {
    try {
      const response = await authAPI.getWechatBinding();

      return {
        success: true,
        isBound: response.isBound,
        wechatNickname: response.wechatNickname,
        bindTime: response.bindTime
      };
    } catch (error) {
      console.error('获取微信绑定状态失败:', error);
      return {
        success: false,
        message: error.response?.data?.message || '获取微信绑定状态失败',
      };
    }
  };

  // 注册
  const register = async (data) => {
    try {
      const response = await authAPI.register(data);
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
  const logout = async () => {
    try {
      // 调用后端登出API
      await authAPI.logout();
      console.log('登出成功');
    } catch (error) {
      console.error('登出API调用失败:', error);
      // 即使API调用失败，我们仍然要清除本地状态
    } finally {
      // 无论API调用成功与否，都清除本地状态
      localStorage.removeItem('token');
      dispatch({ type: 'LOGOUT' });
      navigate('/login');
    }
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
        bindWechat,
        unbindWechat,
        getWechatBinding,
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
