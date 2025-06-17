/**
 * 错误处理工具测试文件
 * 用于验证 errorHandler.js 中的函数是否正常工作
 */

import { parseErrorMessage } from './errorHandler';

// 测试用例
const testCases = [
  {
    name: '网络错误',
    error: { request: {}, message: 'Network Error' },
    expected: '网络连接失败，请检查网络连接'
  },
  {
    name: '401 未授权',
    error: { response: { status: 401, data: 'Unauthorized' } },
    expected: '登录已过期，请重新登录'
  },
  {
    name: '403 权限不足',
    error: { response: { status: 403, data: 'Forbidden' } },
    expected: '权限不足，无法执行此操作'
  },
  {
    name: '404 资源不存在',
    error: { response: { status: 404, data: 'Not Found' } },
    expected: '请求的资源不存在'
  },
  {
    name: '500 服务器错误',
    error: { response: { status: 500, data: 'Internal Server Error' } },
    expected: '服务器内部错误，请稍后重试'
  },
  {
    name: '后端返回字符串错误',
    error: { response: { status: 400, data: '用户名已存在' } },
    expected: '用户名已存在'
  },
  {
    name: '后端返回对象错误 - message字段',
    error: { response: { status: 400, data: { message: '密码格式不正确' } } },
    expected: '密码格式不正确'
  },
  {
    name: '后端返回对象错误 - error字段',
    error: { response: { status: 400, data: { error: '验证失败' } } },
    expected: '验证失败'
  },
  {
    name: '后端返回验证错误',
    error: { 
      response: { 
        status: 422, 
        data: { 
          errors: {
            'Email': ['邮箱格式不正确'],
            'Password': ['密码长度至少6位', '密码必须包含数字']
          }
        }
      }
    },
    expected: '邮箱格式不正确, 密码长度至少6位, 密码必须包含数字'
  },
  {
    name: '普通错误对象',
    error: { message: '自定义错误信息' },
    expected: '自定义错误信息'
  },
  {
    name: '空错误',
    error: null,
    expected: '操作失败'
  }
];

// 运行测试
export const runErrorHandlerTests = () => {
  console.log('开始测试错误处理工具...\n');
  
  let passedTests = 0;
  let totalTests = testCases.length;
  
  testCases.forEach((testCase, index) => {
    try {
      const result = parseErrorMessage(testCase.error);
      const passed = result === testCase.expected;
      
      console.log(`测试 ${index + 1}: ${testCase.name}`);
      console.log(`期望结果: ${testCase.expected}`);
      console.log(`实际结果: ${result}`);
      console.log(`测试结果: ${passed ? '✅ 通过' : '❌ 失败'}\n`);
      
      if (passed) {
        passedTests++;
      }
    } catch (error) {
      console.log(`测试 ${index + 1}: ${testCase.name}`);
      console.log(`测试异常: ${error.message}`);
      console.log(`测试结果: ❌ 异常\n`);
    }
  });
  
  console.log(`测试完成: ${passedTests}/${totalTests} 通过`);
  console.log(`成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  return {
    passed: passedTests,
    total: totalTests,
    success: passedTests === totalTests
  };
};

// 在开发环境下自动运行测试
if (process.env.NODE_ENV === 'development') {
  // 可以在控制台手动调用 runErrorHandlerTests() 来测试
  window.testErrorHandler = runErrorHandlerTests;
}

export default {
  runErrorHandlerTests
};
