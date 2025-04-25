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
  getTerminals: (params) => api.get('/terminals', { params }),
  getTerminal: (id) => api.get(`/terminals/${id}`),
  updateTerminal: (id, data) => api.put(`/terminals/${id}`, data),
  deleteTerminal: (id) => api.delete(`/terminals/${id}`),
  getTerminalEvents: (params) => api.get('/terminal-events', { params }),
  getTerminalTypes: (params) => api.get('/terminal-types', { params }),
  createTerminalType: (data) => api.post('/terminal-types', data),
  updateTerminalType: (id, data) => api.put(`/terminal-types/${id}`, data),
  deleteTerminalType: (id) => api.delete(`/terminal-types/${id}`),
  sendMessage: (terminalIds, messageTypeId, content) =>
    api.post('/terminals/send-message', { terminalIds, messageTypeId, content }),
  publishFile: (terminalIds, fileVersionId) =>
    api.post('/terminals/publish-file', { terminalIds, fileVersionId }),
};

// 文件相关API
export const fileAPI = {
  getFileTypes: (params) => api.get('/file-types', { params }),
  getFileType: (id) => api.get(`/file-types/${id}`),
  createFileType: (data) => api.post('/file-types', data),
  updateFileType: (id, data) => api.put(`/file-types/${id}`, data),
  deleteFileType: (id) => api.delete(`/file-types/${id}`),

  getFileVersions: (params) => api.get('/file-versions', { params }),
  getFileVersion: (id) => api.get(`/file-versions/${id}`),
  uploadFile: (formData) => api.post('/file-versions/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  deleteFileVersion: (id) => api.delete(`/file-versions/${id}`),

  getFilePublishes: (params) => api.get('/file-publishes', { params }),
  getFilePublish: (id) => api.get(`/file-publishes/${id}`),
  createFilePublish: (data) => api.post('/file-publishes', data),
  updateFilePublish: (id, data) => api.put(`/file-publishes/${id}`, data),
  deleteFilePublish: (id) => api.delete(`/file-publishes/${id}`),

  getFilePublishHistory: (params) => api.get('/file-publish-history', { params }),
};

// 消息相关API
export const messageAPI = {
  getMessageTypes: (params) => api.get('/message-types', { params }),
  getMessageType: (id) => api.get(`/message-types/${id}`),
  createMessageType: (data) => api.post('/message-types', data),
  updateMessageType: (id, data) => api.put(`/message-types/${id}`, data),
  deleteMessageType: (id) => api.delete(`/message-types/${id}`),

  getMessages: (params) => api.get('/messages', { params }),
  getMessage: (id) => api.get(`/messages/${id}`),
  createMessage: (data) => api.post('/messages', data),
  deleteMessage: (id) => api.delete(`/messages/${id}`),
};

// 仪表盘相关API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getMerchantDashboard: () => api.get('/dashboard/merchant'),
  getPlatformDashboard: () => api.get('/dashboard/platform'),
  getServerLogs: (params) => api.get('/dashboard/server-logs', { params }),
};

export default api;
