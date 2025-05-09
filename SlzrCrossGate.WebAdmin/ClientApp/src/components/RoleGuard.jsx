import React from 'react';
import { Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../contexts/AuthContext';

/**
 * 角色权限守卫组件
 * 用于保护只允许特定角色访问的路由
 * @param {Object} props
 * @param {React.ReactNode} props.children - 子组件
 * @param {Array<string>} props.roles - 允许访问的角色列表，为空数组时表示所有角色可访问
 * @returns {React.ReactNode}
 */
const RoleGuard = ({ children, roles = [] }) => {
  const { user } = useAuth();

  // 如果未指定角色限制，直接允许访问
  if (!roles || roles.length === 0) {
    return <>{children}</>;
  }

  // 检查用户是否已登录且拥有所需角色
  const hasRequiredRole = user && 
    user.roles && 
    user.roles.some(role => roles.includes(role));

  if (hasRequiredRole) {
    return <>{children}</>;
  }

  // 如果用户没有所需角色，重定向到仪表盘或者404页面
  return <Navigate to="/app/dashboard" />;
};

RoleGuard.propTypes = {
  children: PropTypes.node.isRequired,
  roles: PropTypes.arrayOf(PropTypes.string)
};

export default RoleGuard;
