import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { logout } from '../../api/authService';

const NAV_LINKS = [
  { to: '/admin/dashboard', label: 'Console' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/analytics', label: 'Analytics' }
  
];

const Navbar = () => {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } catch (err) {
      // Even if the server call fails, clear local state and send the user to login —
      // staying "logged in" client-side with a dead token helps no one.
      console.error('Logout request failed:', err);
    } finally {
      setLoggingOut(false);
      navigate('/login', { replace: true });
    }
  };

  return (
    <nav className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <span className="text-sm font-bold text-slate-950 tracking-tight">
              Admin<span className="text-indigo-600">.</span>
            </span>
            <div className="hidden sm:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-200 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loggingOut ? 'Logging out…' : 'Log out'}
          </button>
        </div>

        {/* Mobile nav row */}
        <div className="sm:hidden flex items-center gap-1 pb-3 -mt-1">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;