import { format, parseISO, isValid } from 'date-fns';
import { zhCN } from 'date-fns/locale';

/**
 * 时间处理工具函数
 * 注意：后端使用本地时间(CST +8)存储，前端需要相应处理
 */

// 配置：后端是否使用本地时间存储
const BACKEND_USES_LOCAL_TIME = true; // 后端已使用DateTime.Now，存储本地时间

/**
 * 格式化日期时间，自动处理时区转换
 * @param {string|Date} dateInput - 日期输入（ISO字符串或Date对象）
 * @param {string} formatStr - 格式化字符串，默认为 'yyyy-MM-dd HH:mm:ss'
 * @returns {string} 格式化后的日期字符串
 */
export const formatDateTime = (dateInput, formatStr = 'yyyy-MM-dd HH:mm:ss') => {
  if (!dateInput) return '-';

  try {
    let date;

    // 处理不同类型的输入
    if (typeof dateInput === 'string') {
      if (BACKEND_USES_LOCAL_TIME) {
        // 后端使用本地时间，直接解析（不进行时区转换）
        // 移除时区信息，按本地时间处理
        const cleanDateStr = dateInput.replace(/[Z]$/, '').replace(/[+-]\d{2}:\d{2}$/, '');
        date = new Date(cleanDateStr);
      } else {
        // 后端使用UTC时间，正常解析
        date = parseISO(dateInput);
      }
    } else if (dateInput instanceof Date) {
      date = dateInput;
    } else {
      return '-';
    }

    // 检查日期是否有效
    if (!isValid(date)) {
      console.warn('Invalid date input:', dateInput);
      return '-';
    }

    return format(date, formatStr, { locale: zhCN });
  } catch (error) {
    console.error('Error formatting date:', error, dateInput);
    return '-';
  }
};

/**
 * 格式化日期（不包含时间）
 * @param {string|Date} dateInput - 日期输入
 * @returns {string} 格式化后的日期字符串
 */
export const formatDate = (dateInput) => {
  return formatDateTime(dateInput, 'yyyy-MM-dd');
};

/**
 * 格式化时间（不包含日期）
 * @param {string|Date} dateInput - 日期输入
 * @returns {string} 格式化后的时间字符串
 */
export const formatTime = (dateInput) => {
  return formatDateTime(dateInput, 'HH:mm:ss');
};

/**
 * 格式化相对时间（如：2小时前）
 * @param {string|Date} dateInput - 日期输入
 * @returns {string} 相对时间字符串
 */
export const formatRelativeTime = (dateInput) => {
  if (!dateInput) return '-';

  try {
    let date;
    if (typeof dateInput === 'string') {
      date = parseISO(dateInput);
    } else if (dateInput instanceof Date) {
      date = dateInput;
    } else {
      return '-';
    }

    if (!isValid(date)) {
      return '-';
    }

    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return '刚刚';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}分钟前`;
    } else if (diffHours < 24) {
      return `${diffHours}小时前`;
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return formatDateTime(date, 'yyyy-MM-dd');
    }
  } catch (error) {
    console.error('Error formatting relative time:', error, dateInput);
    return '-';
  }
};

/**
 * 检查时间是否在指定分钟内（用于判断在线状态）
 * @param {string|Date} dateInput - 日期输入
 * @param {number} minutes - 分钟数，默认5分钟
 * @returns {boolean} 是否在指定时间内
 */
export const isWithinMinutes = (dateInput, minutes = 5) => {
  if (!dateInput) return false;

  try {
    let date;
    if (typeof dateInput === 'string') {
      date = parseISO(dateInput);
    } else if (dateInput instanceof Date) {
      date = dateInput;
    } else {
      return false;
    }

    if (!isValid(date)) {
      return false;
    }

    const now = new Date();
    const diffMs = now - date;
    return diffMs <= minutes * 60 * 1000;
  } catch (error) {
    console.error('Error checking time within minutes:', error, dateInput);
    return false;
  }
};

/**
 * 将本地日期转换为本地日期时间字符串（用于API查询）
 * 注意：后端已使用本地时间，不再需要UTC转换
 * @param {Date} localDate - 本地日期对象
 * @param {boolean} isStartOfDay - 是否为一天的开始（00:00:00），默认true
 * @returns {string} 本地日期时间字符串，格式为 'yyyy-MM-dd HH:mm:ss'
 */
export const formatDateForAPI = (localDate, isStartOfDay = true) => {
  if (!localDate) return undefined;

  try {
    let date;
    if (typeof localDate === 'string') {
      date = parseISO(localDate);
    } else if (localDate instanceof Date) {
      date = localDate;
    } else {
      return undefined;
    }

    if (!isValid(date)) {
      return undefined;
    }

    // 创建一个新的日期对象，避免修改原始对象
    const targetDate = new Date(date);

    if (isStartOfDay) {
      // 设置为当天的开始时间（本地时间 00:00:00）
      targetDate.setHours(0, 0, 0, 0);
    } else {
      // 设置为当天的结束时间（本地时间 23:59:59.999）
      targetDate.setHours(23, 59, 59, 999);
    }

    // 返回本地时间字符串，格式为 'yyyy-MM-dd HH:mm:ss'
    return format(targetDate, 'yyyy-MM-dd HH:mm:ss');
  } catch (error) {
    console.error('Error formatting date for API:', error, localDate);
    return undefined;
  }
};

/**
 * 将本地日期时间转换为本地日期时间字符串（用于API查询）
 * 注意：后端已使用本地时间，不再需要UTC转换
 * @param {Date|string} localDateTime - 本地日期时间
 * @returns {string} 本地日期时间字符串，格式为 'yyyy-MM-dd HH:mm:ss'
 */
export const formatDateTimeForAPI = (localDateTime) => {
  if (!localDateTime) return undefined;

  try {
    let date;
    if (typeof localDateTime === 'string') {
      date = parseISO(localDateTime);
    } else if (localDateTime instanceof Date) {
      date = localDateTime;
    } else {
      return undefined;
    }

    if (!isValid(date)) {
      return undefined;
    }

    // 返回本地时间字符串，格式为 'yyyy-MM-dd HH:mm:ss'
    return format(date, 'yyyy-MM-dd HH:mm:ss');
  } catch (error) {
    console.error('Error formatting datetime for API:', error, localDateTime);
    return undefined;
  }
};

/**
 * 获取当前时区信息
 * @returns {object} 时区信息
 */
export const getTimezoneInfo = () => {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset(); // 分钟数，UTC相对于本地时间的偏移
  const timezoneOffsetHours = -timezoneOffset / 60; // 转换为小时，并取反（因为getTimezoneOffset返回的是相反的值）

  return {
    offset: timezoneOffsetHours,
    offsetString: timezoneOffsetHours >= 0 ? `+${timezoneOffsetHours}` : `${timezoneOffsetHours}`,
    name: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
};

// 默认导出常用函数
export default {
  formatDateTime,
  formatDate,
  formatTime,
  formatRelativeTime,
  isWithinMinutes,
  formatDateForAPI,
  formatDateTimeForAPI,
  getTimezoneInfo
};
