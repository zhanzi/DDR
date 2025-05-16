import axios from 'axios';

// 使用环境变量获取API基础URL
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';

// 创建axios实例
const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 从localStorage获取token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('请求:', config.method.toUpperCase(), config.url, config.data || config.params);
    return config;
  },
  (error) => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    console.log('响应成功:', response.config.url, response.data);
    return response.data;
  },
  (error) => {
    console.error('响应错误:', error.config?.url, error.response?.status, error.response?.data);
    console.error('错误详情:', error);

    // 临时禁用自动跳转到登录页面，方便调试
    // 处理401错误
    // if (error.response && error.response.status === 401) {
    //   // 清除token
    //   localStorage.removeItem('token');
    //   // 重定向到登录页
    //   window.location.href = '/login';
    // }
    return Promise.reject(error);
  }
);


// 认证相关API
export const authAPI = {
    login: (username, password) =>
        api.post('/auth/login', { username, password }),

    register: (data) =>
        api.post('/auth/register', data),

    verifyTwoFactorCode: (data) =>
        api.post('/auth/verify-code', data, {
            headers: data.TempToken ? {
                'Authorization': `Bearer ${data.TempToken}`
            } : undefined
        }),

    setupTwoFactor: (tempToken) =>
        api.post('/auth/setup-two-factor', { }, {
            headers: {
                'Authorization': `Bearer ${tempToken}`
            },
            // 添加错误处理
            validateStatus: function (status) {
                return status < 500; // 只有状态码小于500的响应会被解析为成功
            }
        }),

    confirmTwoFactor: (code, tempToken) =>
        api.post('/auth/confirm-two-factor', {
            Code: code,
            TempToken: tempToken
        }, {
            headers: {
                'Authorization': `Bearer ${tempToken}`
            },
            // 添加错误处理
            validateStatus: function (status) {
                return status < 500; // 只有状态码小于500的响应会被解析为成功
            }
        }),

    forgotPassword: (email) =>
        api.post('/auth/forgot-password', { email }),

    resetPassword: (data) =>
        api.post('/auth/reset-password', data),

    verifyCode: (username, code) =>
        api.post('/auth/verify-code', { username, code }),

    logout: () =>
        api.post('/auth/logout'),

    // 微信相关API
    getWechatLoginQrCode: () =>
        api.get('/auth/wechat-login'),

    checkWechatLoginStatus: (loginId) =>
        api.get(`/auth/wechat-login-status?loginId=${loginId}`),

    mockWechatScan: (data) =>
        api.post('/auth/wechat-mock-scan', data),

    mockWechatConfirm: (loginId) =>
        api.post('/auth/wechat-mock-confirm', { loginId }),

    bindWechat: (data) =>
        api.post('/auth/bind-wechat', data),

    unbindWechat: () =>
        api.post('/auth/unbind-wechat'),

    getWechatBinding: () =>
        api.get('/auth/wechat-binding'),

    // 启用或禁用双因素认证
    toggleTwoFactor: (enable, code = null) =>
        api.post('/auth/toggle-two-factor', { Enable: enable, Code: code }),
};

// 用户相关API
export const userAPI = {
  getUsers: (params) => api.get('/users', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  createUser: (data) => api.post('/users', data),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
  changePassword: (id, data) => api.post(`/users/${id}/change-password`, data),
  lockUser: (id, data) => api.post(`/users/${id}/lock`, data),
  unlockUser: (id) => api.post(`/users/${id}/unlock`),
  resetTwoFactor: (id) => api.post(`/users/${id}/reset-two-factor`),
  // 获取当前用户信息
  getCurrentUser: () => api.get('/users/CurrentUser'),
};

// 角色相关API
export const roleAPI = {
  getRoles: (params) => api.get('/roles', { params }),
  getRole: (id) => api.get(`/roles/${id}`),
  createRole: (data) => api.post('/roles', data),
  updateRole: (id, data) => api.put(`/roles/${id}`, data),
  deleteRole: (id) => api.delete(`/roles/${id}`),
  getUsersInRole: (id, params) => api.get(`/roles/${id}/users`, { params }),
};

// 商户相关API
export const merchantAPI = {
  getMerchants: (params) => api.get('/merchants', { params }),
  getMerchant: (id) => {
    if (!id) {
      console.error("尝试获取商户详情但ID为空");
      return Promise.reject(new Error("商户ID不能为空"));
    }
    return api.get(`/merchants/${id}`);
  },
  createMerchant: (data) => api.post('/merchants', data),
  updateMerchant: (id, data) => api.put(`/merchants/${id}`, data),
  deleteMerchant: (id) => api.delete(`/merchants/${id}`),
  getMerchantTerminals: (id, params) => api.get(`/merchants/${id}/terminals`, { params }),
  getMerchantUsers: (id, params) => api.get(`/merchants/${id}/users`, { params }),
  activateMerchant: (id) => api.post(`/merchants/${id}/activate`),
  deactivateMerchant: (id) => api.post(`/merchants/${id}/deactivate`),
};

// 终端相关API
export const terminalAPI = {
  getTerminals: (params) => api.get('/Terminals', { params }),
  getTerminal: (id) => api.get(`/Terminals/${id}`),
  updateTerminal: (id, data) => api.put(`/Terminals/${id}`, data),
  deleteTerminal: (id) => api.delete(`/Terminals/${id}`),
  getTerminalEvents: (id, params) => api.get(`/Terminals/${id}/events`, { params }),
  getTerminalTypes: (params) => api.get('/TerminalTypes', { params }),
  createTerminalType: (data) => api.post('/TerminalTypes', data),
  updateTerminalType: (id, data) => api.put(`/TerminalTypes/${id}`, data),
  deleteTerminalType: (id) => api.delete(`/TerminalTypes/${id}`),
  sendMessage: (terminalIds, messageTypeId, content) =>
    api.post('/Terminals/SendMessage', { terminalIds, messageTypeId, content }),
  publishFile: (terminalIds, fileVersionId) =>
    api.post('/Terminals/PublishFile', { terminalIds, fileVersionId }),
  getTerminalStats: (params) => api.get(`/Terminals/Stats`,{ params }),
};

// 文件相关API
export const fileAPI = {
  getFileTypes: (params) => api.get('/FileTypes', { params }),
  getFileType: (id) => api.get(`/FileTypes/${id}`),
  createFileType: (data) => api.post('/FileTypes', data),
  updateFileType: (code, merchantId, data) => api.put(`/FileTypes/${code}/${merchantId}`, data),
  deleteFileType: (id) => api.delete(`/FileTypes/${id}`),

  getFileVersions: (params) => api.get('/FileVersions', { params }),
  getFileVersion: (id) => api.get(`/FileVersions/${id}`),
  uploadFile: (formData) => api.post('/FileVersions', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  deleteFileVersion: (id) => api.delete(`/FileVersions/${id}`),
  // 下载文件版本，使用响应类型blob接收二进制数据
  downloadFileVersion: (id) => api.get(`/FileVersions/download/${id}`, {
    responseType: 'blob',
  }),

  getFilePublishes: (params) => api.get('/FilePublish', { params }),
  getFilePublish: (id) => api.get(`/FilePublish/${id}`),
  createFilePublish: (data) => api.post('/FilePublish', data),
  updateFilePublish: (id, data) => api.put(`/FilePublish/${id}`, data),
  deleteFilePublish: (id) => api.delete(`/FilePublish/${id}`),

  getFilePublishHistory: (params) => api.get('/FilePublish/History', { params }),

  // 获取所有文件类型(不分页，用于下拉框)
  getAllFileTypes: async (merchantId) => api.get('/FileTypes/all', { merchantId })
};

// 消息相关API
export const messageAPI = {
  getMessageTypes: (params) => api.get('/MessageTypes', { params }),
  getMessageType: (id) => api.get(`/MessageTypes/${id}`),
  createMessageType: (data) => api.post('/MessageTypes', data),
  updateMessageType: (code, merchantId, data) => api.put(`/MessageTypes/${code}/${merchantId}`, data),
  deleteMessageType: (code, merchantId) => api.delete(`/MessageTypes/${code}/${merchantId}`),
  
  // 获取所有消息类型(不分页，用于下拉框)
  getAllMessageTypes: async (merchantId) => {
    const params = merchantId ? { merchantId } : {};
    const response = await api.get('/MessageTypes/all', { params });
    // 处理不同的响应格式，确保返回一个数组
    if (response && Array.isArray(response)) {
      return response;
    } else if (response && Array.isArray(response.items)) {
      return response.items;
    } else if (response && typeof response === 'object') {
      // 尝试查找任何可能的数组属性
      for (const key in response) {
        if (Array.isArray(response[key])) {
          return response[key];
        }
      }
    }
    // 如果找不到任何有效数组，返回空数组
    console.warn('getAllMessageTypes: 无法从响应中提取有效数组', response);
    return [];
  },

  getMessages: (params) => api.get('/Messages', { params }),
  getMessage: (id) => api.get(`/Messages/${id}`),
  createMessage: (data) => api.post('/Messages', data),
  deleteMessage: (id) => api.delete(`/Messages/${id}`),
  getMessageStats: () => api.get('/Messages/Stats'),
};

// 仪表盘相关API
export const dashboardAPI = {
  getStats: () => api.get('/Dashboard/Stats'),
  getMerchantDashboard: () => api.get('/Dashboard/Merchant'),
  getPlatformDashboard: () => api.get('/Dashboard/Platform'),
  getServerLogs: (params) => api.get('/Dashboard/ServerLogs', { params }),
  // 添加新的方法以匹配实际调用路径
  getMerchantStats: (params) => api.get('/Dashboard/MerchantStats', { params }),
  getPlatformStats: () => api.get('/Dashboard/PlatformStats'),
  getSystemInfo: () => api.get('/Dashboard/SystemInfo'),
};

// 系统设置相关API
export const systemSettingsAPI = {
  getSettings: () => api.get('/SystemSettings'),
  updateSettings: (data) => api.put('/SystemSettings', data),
};

// 线路票价参数相关API
export const linePriceAPI = {
  // 线路票价基本信息
  getLinePrices: (params) => api.get('/LinePrice', { params }),
  getLinePrice: (id) => api.get(`/LinePrice/${id}`),
  createLinePrice: (data) => api.post('/LinePrice', data),
  updateLinePrice: (id, data) => api.put(`/LinePrice/${id}`, data),
  deleteLinePrice: (id) => api.delete(`/LinePrice/${id}`),

  // 线路票价版本
  getLinePriceVersions: (linePriceInfoId, params) => 
    api.get(`/LinePrice/${linePriceInfoId}/Versions`, { params }),
  getLinePriceVersion: (versionId) => 
    api.get(`/LinePrice/Versions/${versionId}`),
  createLinePriceVersion: (linePriceInfoId, data) => 
    api.post(`/LinePrice/${linePriceInfoId}/Versions`, data),
  updateLinePriceVersion: (versionId, data) => 
    api.put(`/LinePrice/Versions/${versionId}`, data),
  copyLinePriceVersion: (versionId) => 
    api.post(`/LinePrice/Versions/${versionId}/CopyCreate`),
  deleteLinePriceVersion: (versionId) => 
    api.delete(`/LinePrice/Versions/${versionId}`),
  
  // 搜索线路
  searchLinePrices: (params) => 
    api.get('/LinePrice/search', { params }),
    
  // 跨线路复制版本
  copyLinePriceVersionToOtherLines: (versionId, data) => 
    api.post(`/LinePrice/Versions/${versionId}/CopyToLines`, data),
    
  // 票价文件操作
  previewLinePriceFile: (versionId, data) => 
    api.post(`/LinePrice/Versions/${versionId}/Preview`, data),
  submitLinePriceVersion: (versionId, data) => 
    api.post(`/LinePrice/Versions/${versionId}/Submit`, data),
  publishLinePriceFile: (versionId, data) => 
    api.post(`/LinePrice/Versions/${versionId}/Publish`, data),
  
  // 字典配置
  getDictionaryConfig: (merchantId, dictionaryType) =>
    api.get(`/LinePrice/DictionaryConfig/${merchantId}/${dictionaryType}`),
};

// 商户字典相关API
export const dictionaryAPI = {
  getDictionaries: (params) => api.get('/MerchantDictionary', { params }),
  getDictionary: (id) => api.get(`/MerchantDictionary/${id}`),
  createDictionary: (data) => api.post('/MerchantDictionary', data),
  updateDictionary: (id, data) => api.put(`/MerchantDictionary/${id}`, data),
  deleteDictionary: (id) => api.delete(`/MerchantDictionary/${id}`),
  getDictionaryTypes: (merchantId) => api.get(`/MerchantDictionary/Types/${merchantId}`),
  getDictionariesByType: (merchantId, dictionaryType) =>
    api.get(`/MerchantDictionary/ByType?merchantId=${merchantId}&dictionaryType=${dictionaryType}`),
};

// 银联终端密钥相关API
export const unionPayTerminalKeyAPI = {
  getUnionPayTerminalKeys: (params) => api.get('/UnionPayTerminalKeys', { params }),
  getUnionPayTerminalKey: (id) => api.get(`/UnionPayTerminalKeys/${id}`),
  createUnionPayTerminalKey: (data) => api.post('/UnionPayTerminalKeys', data),
  updateUnionPayTerminalKey: (id, data) => api.put(`/UnionPayTerminalKeys/${id}`, data),
  deleteUnionPayTerminalKey: (id) => api.delete(`/UnionPayTerminalKeys/${id}`),
  // 导入银联终端密钥
  importUnionPayTerminalKeys: (formData) => api.post('/UnionPayTerminalKeys/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  // 下载导入模板
  downloadTemplate: () => api.get('/UnionPayTerminalKeys/template', {
    responseType: 'blob',
  }),
};

export default api;
