/**
 * 通用错误处理工具函数
 * 用于统一处理 API 请求错误，提供友好的错误提示
 */

/**
 * 解析错误对象，返回友好的错误信息
 * @param {Error} error - 错误对象
 * @param {string} defaultMessage - 默认错误信息
 * @returns {string} 友好的错误信息
 */
export const parseErrorMessage = (error, defaultMessage = '操作失败') => {
  // 如果没有错误对象，返回默认信息
  if (!error) {
    return defaultMessage;
  }

  // 处理服务器响应错误
  if (error?.response) {
    const { status, data } = error.response;

    // 根据 HTTP 状态码返回相应信息
    switch (status) {
      case 400:
        return parseResponseData(data, '请求参数错误');
      case 401:
        return '登录已过期，请重新登录';
      case 403:
        return '权限不足，无法执行此操作';
      case 404:
        return '请求的资源不存在';
      case 409:
        return parseResponseData(data, '数据冲突，请刷新后重试');
      case 422:
        return parseResponseData(data, '数据验证失败');
      case 429:
        return '请求过于频繁，请稍后重试';
      case 500:
        return '服务器内部错误，请稍后重试';
      case 502:
        return '网关错误，请稍后重试';
      case 503:
        return '服务暂时不可用，请稍后重试';
      case 504:
        return '请求超时，请稍后重试';
      default:
        if (status >= 500) {
          return '服务器错误，请稍后重试';
        } else if (status >= 400) {
          return parseResponseData(data, '请求失败');
        }
        return parseResponseData(data, defaultMessage);
    }
  }

  // 处理网络错误
  if (error?.request) {
    return '网络连接失败，请检查网络连接';
  }

  // 处理其他错误
  if (error?.message) {
    // 检查是否是网络相关错误
    if (error.message.includes('Network Error') ||
        error.message.includes('timeout') ||
        error.message.includes('ECONNREFUSED')) {
      return '网络连接失败，请检查网络连接';
    }
    return error.message;
  }

  return defaultMessage;
};

/**
 * 解析响应数据中的错误信息
 * @param {any} data - 响应数据
 * @param {string} fallback - 备用错误信息
 * @returns {string} 错误信息
 */
const parseResponseData = (data, fallback) => {
  if (!data) {
    return fallback;
  }

  // 如果是字符串，直接返回
  if (typeof data === 'string') {
    return data;
  }

  // 尝试从不同字段获取错误信息
  if (data.message) {
    return data.message;
  }

  if (data.error) {
    return typeof data.error === 'string' ? data.error : data.error.message || fallback;
  }

  if (data.title) {
    return data.title;
  }

  if (data.detail) {
    return data.detail;
  }

  // 处理验证错误
  if (data.errors) {
    if (Array.isArray(data.errors)) {
      return data.errors.join(', ');
    } else if (typeof data.errors === 'object') {
      const errorMessages = Object.values(data.errors).flat();
      return errorMessages.join(', ');
    }
  }

  return fallback;
};

/**
 * 创建一个带有错误处理的异步函数包装器
 * @param {Function} asyncFn - 异步函数
 * @param {Function} setError - 设置错误状态的函数
 * @param {string} defaultErrorMessage - 默认错误信息
 * @returns {Function} 包装后的函数
 */
export const withErrorHandling = (asyncFn, setError, defaultErrorMessage = '操作失败') => {
  return async (...args) => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      console.error('Error in async operation:', error);
      const errorMessage = parseErrorMessage(error, defaultErrorMessage);
      setError(errorMessage);
      throw error; // 重新抛出错误，让调用者决定是否需要进一步处理
    }
  };
};

/**
 * 创建一个带有加载状态和错误处理的异步函数包装器
 * @param {Function} asyncFn - 异步函数
 * @param {Function} setLoading - 设置加载状态的函数
 * @param {Function} setError - 设置错误状态的函数
 * @param {string} defaultErrorMessage - 默认错误信息
 * @returns {Function} 包装后的函数
 */
export const withLoadingAndErrorHandling = (asyncFn, setLoading, setError, defaultErrorMessage = '操作失败') => {
  return async (...args) => {
    setLoading(true);
    setError('');

    try {
      const result = await asyncFn(...args);
      return result;
    } catch (error) {
      console.error('Error in async operation:', error);
      const errorMessage = parseErrorMessage(error, defaultErrorMessage);
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };
};

/**
 * 检查错误是否需要重新登录
 * @param {Error} error - 错误对象
 * @returns {boolean} 是否需要重新登录
 */
export const shouldRedirectToLogin = (error) => {
  return error?.response?.status === 401;
};

/**
 * 检查错误是否是权限不足
 * @param {Error} error - 错误对象
 * @returns {boolean} 是否是权限不足
 */
export const isPermissionError = (error) => {
  return error?.response?.status === 403;
};

/**
 * 检查错误是否是网络错误
 * @param {Error} error - 错误对象
 * @returns {boolean} 是否是网络错误
 */
export const isNetworkError = (error) => {
  return !error?.response && error?.request;
};

/**
 * 检查错误是否是服务器错误
 * @param {Error} error - 错误对象
 * @returns {boolean} 是否是服务器错误
 */
export const isServerError = (error) => {
  return error?.response?.status >= 500;
};

/**
 * 格式化错误信息用于显示
 * @param {string} message - 错误信息
 * @param {string} context - 上下文信息
 * @returns {string} 格式化后的错误信息
 */
export const formatErrorMessage = (message, context = '') => {
  if (context) {
    return `${context}：${message}`;
  }
  return message;
};

/**
 * 创建一个带有 Snackbar 错误提示的异步函数包装器
 * @param {Function} asyncFn - 异步函数
 * @param {Function} enqueueSnackbar - Snackbar 提示函数
 * @param {string} defaultErrorMessage - 默认错误信息
 * @param {string} successMessage - 成功信息（可选）
 * @returns {Function} 包装后的函数
 */
export const withSnackbarErrorHandling = (asyncFn, enqueueSnackbar, defaultErrorMessage = '操作失败', successMessage = null) => {
  return async (...args) => {
    try {
      const result = await asyncFn(...args);
      if (successMessage) {
        enqueueSnackbar(successMessage, { variant: 'success' });
      }
      return result;
    } catch (error) {
      console.error('Error in async operation:', error);
      const errorMessage = parseErrorMessage(error, defaultErrorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
      throw error;
    }
  };
};

/**
 * 创建一个带有加载状态和 Snackbar 错误提示的异步函数包装器
 * @param {Function} asyncFn - 异步函数
 * @param {Function} setLoading - 设置加载状态的函数
 * @param {Function} enqueueSnackbar - Snackbar 提示函数
 * @param {string} defaultErrorMessage - 默认错误信息
 * @param {string} successMessage - 成功信息（可选）
 * @returns {Function} 包装后的函数
 */
export const withLoadingAndSnackbarErrorHandling = (asyncFn, setLoading, enqueueSnackbar, defaultErrorMessage = '操作失败', successMessage = null) => {
  return async (...args) => {
    setLoading(true);

    try {
      const result = await asyncFn(...args);
      if (successMessage) {
        enqueueSnackbar(successMessage, { variant: 'success' });
      }
      return result;
    } catch (error) {
      console.error('Error in async operation:', error);
      const errorMessage = parseErrorMessage(error, defaultErrorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
      throw error;
    } finally {
      setLoading(false);
    }
  };
};

export default {
  parseErrorMessage,
  withErrorHandling,
  withLoadingAndErrorHandling,
  withSnackbarErrorHandling,
  withLoadingAndSnackbarErrorHandling,
  shouldRedirectToLogin,
  isPermissionError,
  isNetworkError,
  isServerError,
  formatErrorMessage
};
