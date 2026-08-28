import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import NotificationBell from '../components/layout/NotificationBell';
import { ROUTES } from '../constants/routes';

const Logo = () => (
  <Link
    to={ROUTES.COMMITTEE_UPLOAD}
    style={{
      textDecoration: 'none',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    }}
  >
    <div
      style={{
        width: 34,
        height: 34,
        borderRadius: 10,
        background: 'linear-gradient(135deg, #F5A623 0%, #F7C45A 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.1rem',
        boxShadow: '0 2px 8px rgba(245,166,35,0.35)',
      }}
    >
      ⚡
    </div>

    <span
      style={{
        fontFamily: 'Sora, sans-serif',
        fontWeight: 800,
        fontSize: '1.1rem',
        color: '#1A1A2E',
        letterSpacing: '-0.02em',
      }}
    >
      SkillSwap
    </span>
  </Link>
);

const NavLink = ({ to, children, active }) => (
  <Link
    to={to}
    style={{
      textDecoration: 'none',
      fontFamily: 'Inter, sans-serif',
      fontWeight: active ? 600 : 500,
      fontSize: '0.9rem',
      color: active ? '#F5A623' : '#1A1A2E',
      padding: '6px 14px',
      borderRadius: 8,
      background: active ? '#FFF3D0' : 'transparent',
      transition: 'all 0.18s',
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </Link>
);

const MobileLink = ({ to, children, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    style={{
      textDecoration: 'none',
      fontFamily: 'Inter, sans-serif',
      fontWeight: 500,
      fontSize: '1rem',
      color: '#1A1A2E',
      padding: '10px 12px',
      borderRadius: 10,
      display: 'block',
    }}
  >
    {children}
  </Link>
);

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);

  const path = location.pathname;

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap');

        * {
          box-sizing: border-box;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          .nav-links-desktop {
            display: none !important;
          }

          .hamburger {
            display: flex !important;
          }
        }

        @media (min-width: 769px) {
          .hamburger {
            display: none !important;
          }
        }
      `}</style>

      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(255,251,240,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #E8E4D8',
          padding: '0 24px',
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <Logo />

        {/* COMMITTEE NAVIGATION */}
        <div
          className="nav-links-desktop"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            flex: 1,
            justifyContent: 'center',
          }}
        >
          <NavLink
            to={ROUTES.COMMITTEE_UPLOAD}
            active={path === ROUTES.COMMITTEE_UPLOAD}
          >
            Upload
          </NavLink>

          <NavLink
            to={ROUTES.COMMITTEE_MANAGE}
            active={path === ROUTES.COMMITTEE_MANAGE}
          >
            Manage Videos
          </NavLink>

          <NavLink
            to={ROUTES.COMMITTEE_PLAYLISTS}
            active={path === ROUTES.COMMITTEE_PLAYLISTS}
          >
            Playlists
          </NavLink>

          <NavLink
            to={ROUTES.COMMITTEE_ANALYTICS}
            active={path === ROUTES.COMMITTEE_ANALYTICS}
          >
            Analytics
          </NavLink>
        </div>

        {/* RIGHT SIDE */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexShrink: 0,
          }}
        >
          <NotificationBell isCommittee />

          <button
            onClick={handleLogout}
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: '0.85rem',
              color: '#7A7A9A',
              background: 'transparent',
              border: '1.5px solid #E8E4D8',
              borderRadius: 10,
              padding: '7px 16px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Sign out
          </button>

          <button
            onClick={() => setMenuOpen(prev => !prev)}
            aria-label="Toggle menu"
            className="hamburger"
            style={{
              display: 'none',
              background: 'transparent',
              border: '1.5px solid #E8E4D8',
              borderRadius: 8,
              width: 36,
              height: 36,
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* MOBILE COMMITTEE NAVIGATION */}
      {menuOpen && (
        <div
          style={{
            position: 'fixed',
            top: 60,
            left: 0,
            right: 0,
            background: '#FFFBF0',
            borderBottom: '1px solid #E8E4D8',
            padding: '12px 24px 20px',
            zIndex: 99,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            animation: 'slideDown 0.2s ease',
            maxHeight: 'calc(100vh - 60px)',
            overflowY: 'auto',
          }}
        >
          <MobileLink
            to={ROUTES.COMMITTEE_UPLOAD}
            onClick={() => setMenuOpen(false)}
          >
            Upload
          </MobileLink>

          <MobileLink
            to={ROUTES.COMMITTEE_MANAGE}
            onClick={() => setMenuOpen(false)}
          >
            Manage Videos
          </MobileLink>

          <MobileLink
            to={ROUTES.COMMITTEE_PLAYLISTS}
            onClick={() => setMenuOpen(false)}
          >
            Playlists
          </MobileLink>
<MobileLink
  to={ROUTES.COMMITTEE_ANALYTICS}
  onClick={() => setMenuOpen(false)}
>
  Analytics
</MobileLink>
        </div>
      )}
    </>
  );
};

export default Navbar;