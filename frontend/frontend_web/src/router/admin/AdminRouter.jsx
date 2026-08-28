import React from 'react';
import { Route } from 'react-router-dom';
import ProtectedRoute from '../../components/ProtectedRoute';
import AdminLayout from '../../pages/admin/AdminLayout';
import Dashboard from '../../pages/admin/Dashboard';
import AdminUserPage from '../../pages/admin/AdminUserPage';
import AuthLayout from "../../pages/AuthLayout";
import LoginPage from "../../pages/LoginPage";
import SignupPage from "../../pages/SignupPage";
import AdminAnalytics from "../../pages/admin/AdminAnalytics"

export const AdminRouter = (
  <>
    <Route element={<ProtectedRoute allowedRoles={['ROLE_ADMIN']} />}>
      <Route element={<AdminLayout />}>
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/users" element={<AdminUserPage />} />
        <Route path="/admin/analytics" element={<AdminAnalytics />} />
      </Route>
    </Route>
    <Route element={<AuthLayout />}>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
    </Route>
  </>
);