import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { logout } from "../../api/authService";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // Authentication State
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role");
  const isAuthenticated = !!token;

  const handleLogout = async () => {
    try {
      // Logout from backend
      await logout();
    } catch (error) {
      console.error(
        "Logout API failed. Clearing local session anyway.",
        error
      );
    } finally {
      // Always clear local session
      localStorage.removeItem("token");
      localStorage.removeItem("role");

      setIsOpen(false);
      navigate("/login", { replace: true });
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-3 flex items-center justify-between font-sans">

      {/* Brand */}
      <Link
        to="/"
        className="text-xl font-bold tracking-tight text-blue-600"
      >
        SkillSwap
      </Link>

      {/* Navigation */}
      <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">

        <Link
          to="/"
          className="hover:text-slate-900 transition-colors"
        >
          Home
        </Link>

        <Link
          to="/pages/about"
          className="hover:text-slate-900 transition-colors"
        >
          About
        </Link>

        {userRole === "ROLE_ADMIN" && (
          <Link
            to="/admin"
            className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
          >
            Admin Panel
          </Link>
        )}
      </div>

      {/* Authentication */}
      <div className="relative">

        {isAuthenticated ? (
          <>
            {/* Avatar */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsOpen((prev) => !prev)}
              className="flex items-center gap-2 p-0.5 rounded-full hover:bg-slate-50 transition-colors focus:outline-none"
            >
              <img
                src="https://i.pravatar.cc/150?img=3"
                alt="Profile"
                className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-500/10"
              />
            </motion.button>

            {/* Dropdown */}
            <AnimatePresence>
              {isOpen && (
                <>
                  {/* Click outside */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsOpen(false)}
                  />

                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{
                      duration: 0.15,
                      ease: "easeOut",
                    }}
                    className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-20"
                  >

                    {/* User Info */}
                    <div className="px-4 py-2 border-b border-slate-50">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                        Authorized Role
                      </p>

                      <p className="text-xs font-semibold text-slate-600 mt-1 truncate">
                        {userRole
                          ? userRole.replace("ROLE_", "")
                          : "USER"}
                      </p>
                    </div>

                    {/* Profile */}
                    <Link
                      to="/profile"
                      onClick={() => setIsOpen(false)}
                      className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors font-medium"
                    >
                      My Profile
                    </Link>

                    {/* Logout */}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors border-t border-slate-50"
                    >
                      Logout
                    </button>

                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </>
        ) : (
          <Link to="/login">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-sm transition-colors"
            >
              Login
            </motion.button>
          </Link>
        )}

      </div>
    </nav>
  );
};

export default Navbar;