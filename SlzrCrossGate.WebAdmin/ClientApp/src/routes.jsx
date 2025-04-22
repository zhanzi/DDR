import React from 'react';
import { Navigate } from 'react-router-dom';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

import LoginView from './pages/auth/Login';
import RegisterView from './pages/auth/Register';
import ForgotPasswordView from './pages/auth/ForgotPassword';
import NotFoundView from './pages/errors/NotFoundView';
import DashboardView from './pages/dashboard/DashboardView';
import UserListView from './pages/users/UserListView';
import UserDetailView from './pages/users/UserDetailView';
import RoleListView from './pages/roles/RoleListView';
import RoleDetailView from './pages/roles/RoleDetailView';
import MerchantListView from './pages/merchants/MerchantListView';
import MerchantDetailView from './pages/merchants/MerchantDetailView';
import TerminalList from './pages/terminals/TerminalList';
import TerminalDetail from './pages/terminals/TerminalDetail';
import TerminalEvents from './pages/terminals/TerminalEvents';
import FileManagementView from './pages/files/FileManagementView';
import FileTypeList from './pages/files/FileTypeList';
import FileVersionList from './pages/files/FileVersionList';
import FilePublish from './pages/files/FilePublish';
import FilePublishList from './pages/files/FilePublishList';
import MessageTypeList from './pages/messages/MessageTypeList';
import MessageSend from './pages/messages/MessageSend';
import MessageList from './pages/messages/MessageList';

const routes = [
  {
    path: 'app',
    element: <DashboardLayout />,
    children: [
      { path: 'dashboard', element: <DashboardView /> },
      { path: 'users', element: <UserListView /> },
      { path: 'users/:id', element: <UserDetailView /> },
      { path: 'roles', element: <RoleListView /> },
      { path: 'roles/:id', element: <RoleDetailView /> },
      { path: 'merchants', element: <MerchantListView /> },
      { path: 'merchants/:id', element: <MerchantDetailView /> },
      { path: 'terminals', element: <TerminalList /> },
      { path: 'terminals/:id', element: <TerminalDetail /> },
      { path: 'terminals/:id/events', element: <TerminalEvents /> },
      { path: 'files', element: <FileManagementView /> },
      { path: 'files/types', element: <FileTypeList /> },
      { path: 'files/versions', element: <FileVersionList /> },
      { path: 'files/publish', element: <FilePublish /> },
      { path: 'files/publish-list', element: <FilePublishList /> },
      { path: 'messages/types', element: <MessageTypeList /> },
      { path: 'messages/send', element: <MessageSend /> },
      { path: 'messages', element: <MessageList /> },
      { path: '404', element: <NotFoundView /> },
      { path: '*', element: <Navigate to="/app/404" /> }
    ]
  },
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginView /> },
      { path: 'register', element: <RegisterView /> },
      { path: 'forgot-password', element: <ForgotPasswordView /> },
      { path: '/', element: <Navigate to="/app/dashboard" /> },
      { path: '*', element: <Navigate to="/app/404" /> }
    ]
  }
];

export default routes;
