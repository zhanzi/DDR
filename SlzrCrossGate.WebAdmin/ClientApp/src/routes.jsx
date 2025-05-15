import React from 'react';
import { Navigate } from 'react-router-dom';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import TwoFactorGuard from './components/TwoFactorGuard';
import RoleGuard from './components/RoleGuard';

import Login from './pages/auth/Login';
import VerifyCode from './pages/auth/VerifyCode';

import RegisterView from './pages/auth/Register';
import ForgotPasswordView from './pages/auth/ForgotPassword';
import ResetPasswordView from './pages/auth/ResetPassword';
import TwoFactorVerifyView from './pages/auth/TwoFactorVerify';
import TwoFactorSetupView from './pages/auth/TwoFactorSetup';
import WechatLoginView from './pages/auth/WechatLogin';
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
import AccountView from './pages/account/AccountView';
import SystemSettings from './pages/settings/SystemSettings';
import DictionaryListView from './pages/dictionary/DictionaryListView';
import LinePriceListView from './pages/fare-params/LinePriceListView';
import LinePriceEditView from './pages/fare-params/LinePriceEditView';
import LinePriceVersionsView from './pages/fare-params/LinePriceVersionsView';
import LinePriceVersionEditView from './pages/fare-params/LinePriceVersionEditView';
import LinePricePreviewView from './pages/fare-params/LinePricePreviewView';

const routes = [
  {
    path: 'app',
    element: (
      <TwoFactorGuard>
        <DashboardLayout />
      </TwoFactorGuard>
    ),
    children: [
      { path: 'dashboard', element: <DashboardView /> },
      { path: 'account', element: <AccountView /> },
      { 
        path: 'users', 
        element: (
          <RoleGuard roles={['SystemAdmin', 'MerchantAdmin']}>
            <UserListView />
          </RoleGuard>
        ) 
      },
      { 
        path: 'users/:id', 
        element: (
          <RoleGuard roles={['SystemAdmin', 'MerchantAdmin']}>
            <UserDetailView />
          </RoleGuard>
        ) 
      },
      { 
        path: 'roles', 
        element: (
          <RoleGuard roles={['SystemAdmin']}>
            <RoleListView />
          </RoleGuard>
        ) 
      },
      { 
        path: 'roles/:id', 
        element: (
          <RoleGuard roles={['SystemAdmin']}>
            <RoleDetailView />
          </RoleGuard>
        ) 
      },
      { 
        path: 'merchants', 
        element: (
          <RoleGuard roles={['SystemAdmin']}>
            <MerchantListView />
          </RoleGuard>
        ) 
      },
      { 
        path: 'merchants/:id', 
        element: (
          <RoleGuard roles={['SystemAdmin']}>
            <MerchantDetailView />
          </RoleGuard>
        ) 
      },
      { 
        path: 'terminals', 
        element: (
          <RoleGuard roles={['SystemAdmin', 'MerchantAdmin']}>
            <TerminalList />
          </RoleGuard>
        ) 
      },
      { 
        path: 'terminals/:id', 
        element: (
          <RoleGuard roles={['SystemAdmin', 'MerchantAdmin']}>
            <TerminalDetail />
          </RoleGuard>
        ) 
      },
      { 
        path: 'terminals/:id/events', 
        element: (
          <RoleGuard roles={['SystemAdmin', 'MerchantAdmin']}>
            <TerminalEvents />
          </RoleGuard>
        ) 
      },
      { 
        path: 'files', 
        element: (
          <RoleGuard roles={['SystemAdmin', 'MerchantAdmin']}>
            <FileManagementView />
          </RoleGuard>
        ) 
      },
      { 
        path: 'files/types', 
        element: (
          <RoleGuard roles={['SystemAdmin', 'MerchantAdmin']}>
            <FileTypeList />
          </RoleGuard>
        ) 
      },
      { 
        path: 'files/versions', 
        element: (
          <RoleGuard roles={['SystemAdmin', 'MerchantAdmin']}>
            <FileVersionList />
          </RoleGuard>
        ) 
      },
      { 
        path: 'files/publish', 
        element: (
          <RoleGuard roles={['SystemAdmin', 'MerchantAdmin']}>
            <FilePublish />
          </RoleGuard>
        ) 
      },
      { 
        path: 'files/publish-list', 
        element: (
          <RoleGuard roles={['SystemAdmin', 'MerchantAdmin']}>
            <FilePublishList />
          </RoleGuard>
        ) 
      },
      { 
        path: 'messages/types', 
        element: (
          <RoleGuard roles={['SystemAdmin', 'MerchantAdmin']}>
            <MessageTypeList />
          </RoleGuard>
        ) 
      },
      { 
        path: 'messages/send', 
        element: (
          <RoleGuard roles={['SystemAdmin', 'MerchantAdmin']}>
            <MessageSend />
          </RoleGuard>
        ) 
      },
      { 
        path: 'messages', 
        element: (
          <RoleGuard roles={['SystemAdmin', 'MerchantAdmin']}>
            <MessageList />
          </RoleGuard>
        ) 
      },
      { 
        path: 'dictionary', 
        element: (
          <RoleGuard roles={['SystemAdmin', 'MerchantAdmin']}>
            <DictionaryListView />
          </RoleGuard>
        ) 
      },
      { 
        path: 'fare-params', 
        element: (
          <RoleGuard roles={['SystemAdmin', 'MerchantAdmin']}>
            <LinePriceListView />
          </RoleGuard>
        ) 
      },

      { 
        path: 'fare-params/:id', 
        element: (
          <RoleGuard roles={['SystemAdmin', 'MerchantAdmin']}>
            <LinePriceEditView />
          </RoleGuard>
        ) 
      },
      { 
        path: 'fare-params/:id/versions', 
        element: (
          <RoleGuard roles={['SystemAdmin', 'MerchantAdmin']}>
            <LinePriceVersionsView />
          </RoleGuard>
        ) 
      },
      { 
        path: 'fare-params/:id/versions/:versionId', 
        element: (
          <RoleGuard roles={['SystemAdmin', 'MerchantAdmin']}>
            <LinePriceVersionEditView />
          </RoleGuard>
        ) 
      },
      { 
        path: 'fare-params/:id/versions/:versionId/preview', 
        element: (
          <RoleGuard roles={['SystemAdmin', 'MerchantAdmin']}>
            <LinePricePreviewView />
          </RoleGuard>
        ) 
      },
      { 
        path: 'settings', 
        element: (
          <RoleGuard roles={['SystemAdmin']}>
            <SystemSettings />
          </RoleGuard>
        ) 
      },
      { path: '404', element: <NotFoundView /> },
      { path: '*', element: <Navigate to="/app/404" /> }
    ]
  },
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <Login /> },
      { path: 'verify-code', element: <VerifyCode /> },
      { path: 'auth/login', element: <Navigate to="/login" /> },
      { path: 'register', element: <RegisterView /> },
      { path: 'forgot-password', element: <ForgotPasswordView /> },
      { path: 'reset-password', element: <ResetPasswordView /> },
      { path: 'two-factor-verify', element: <TwoFactorVerifyView /> },
      { path: 'two-factor-setup', element: <TwoFactorSetupView /> },
      { path: 'wechat-login', element: <WechatLoginView /> },
      {
        path: '/',
        element: (
          <TwoFactorGuard>
            <Navigate to="/app/dashboard" />
          </TwoFactorGuard>
        )
      },
      { path: '*', element: <Navigate to="/app/404" /> }
    ]
  }
];

export default routes;
