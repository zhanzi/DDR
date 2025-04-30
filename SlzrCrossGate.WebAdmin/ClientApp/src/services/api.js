import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: 'https://localhost:7296/api',
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
  getMerchant: (id) => api.get(`/merchants/${id}`),
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

  getFilePublishes: (params) => api.get('/FilePublishes', { params }),
  getFilePublish: (id) => api.get(`/FilePublishes/${id}`),
  createFilePublish: (data) => api.post('/FilePublishes', data),
  updateFilePublish: (id, data) => api.put(`/FilePublishes/${id}`, data),
  deleteFilePublish: (id) => api.delete(`/FilePublishes/${id}`),

  getFilePublishHistory: (params) => api.get('/FilePublishHistory', { params }),

  // 获取所有文件类型(不分页，用于下拉框)
  getAllFileTypes: async (merchantId) => api.get('/FileTypes/all', { merchantId })
};

// 消息相关API
export const messageAPI = {
  getMessageTypes: (params) => api.get('/MessageTypes', { params }),
  getMessageType: (id) => api.get(`/MessageTypes/${id}`),
  createMessageType: (data) => api.post('/MessageTypes', data),
  updateMessageType: (id, data) => api.put(`/MessageTypes/${id}`, data),
  deleteMessageType: (id) => api.delete(`/MessageTypes/${id}`),

  getMessages: (params) => api.get('/Messages', { params }),
  getMessage: (id) => api.get(`/Messages/${id}`),
  createMessage: (data) => api.post('/Messages', data),
  deleteMessage: (id) => api.delete(`/Messages/${id}`),
};

// 仪表盘相关API
export const dashboardAPI = {
  getStats: () => api.get('/Dashboard/Stats'),
  getMerchantDashboard: () => api.get('/Dashboard/Merchant'),
  getPlatformDashboard: () => api.get('/Dashboard/Platform'),
  getServerLogs: (params) => api.get('/Dashboard/ServerLogs', { params }),
};

// 系统设置相关API
export const systemSettingsAPI = {
  getSettings: () => api.get('/SystemSettings'),
  updateSettings: (data) => api.put('/SystemSettings', data),
};

export default api;
