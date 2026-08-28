import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../../components/admin/Navbar';

const AdminLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <Outlet />
    </div>
  );
};

export default AdminLayout;