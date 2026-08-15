import React from 'react';
import { Route } from 'react-router-dom';
import ProtectedRoute from '../../components/ProtectedRoute';
import Dashboard from '../../pages/admin/Dashboard';
import AuthLayout from "../../pages/AuthLayout";
import LoginPage from "../../pages/LoginPage";
import SignupPage from "../../pages/SignupPage";
export const AdminRouter = (
  <>
  <Route element={<ProtectedRoute allowedRoles={['ROLE_ADMIN']} />}>
    <Route path="/admin/dashboard" element={<Dashboard />} />
    </Route>
    <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
            </Route>

   
  </>
);