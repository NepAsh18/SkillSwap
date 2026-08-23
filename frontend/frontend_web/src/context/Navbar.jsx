import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import NotificationBell from '../components/layout/NotificationBell';

const Logo = () => (
  <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
    <div style={{
      width: 34, height: 34, borderRadius: 10,
      background: 'linear-gradient(135deg, #F5A623 0%, #F7C45A 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '1.1rem', boxShadow: '0 2px 8px rgba(245,166,35,0.35)',
    }}>⚡</div>
    <span style={{
      fontFamily: 'Sora, sans-serif', fontWeight: 800,
      fontSize: '1.1rem', color: '#1A1A2E', letterSpacing: '-0.02em',
    }}>SkillSwap</span>
  </Link>
);

const NavLink = ({ to, children, active }) => (
  <Link to={to} style={{
    textDecoration: 'none', fontFamily: 'Inter, sans-serif',
    fontWeight: active ? 600 : 500, fontSize: '0.9rem',
    color: active ? '#F5A623' : '#1A1A2E',
    padding: '6px 14px', borderRadius: 8,
    background: active ? '#FFF3D0' : 'transparent',
    transition: 'all 0.18s', whiteSpace: 'nowrap',
  }}>
    {children}
  </Link>
);

const TIER_COLOR = { NOVICE: '#7A7A9A', APPRENTICE: '#4CAF82', PRACTITIONER: '#2196F3', EXPERT: '#F5A623', MASTER: '#9C27B0' };
const TIER_EMOJI = { NOVICE: '🌱', APPRENTICE: '🔧', PRACTITIONER: '⚙️', EXPERT: '⭐', MASTER: '👑' };

const Navbar = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const token       = localStorage.getItem('token');
  const role        = localStorage.getItem('role');
  const isLoggedIn  = !!token;
  const isCommittee = role === 'ROLE_COMMITTEE';
  const path        = location.pathname;

  const badge = (() => {
    try { return JSON.parse(localStorage.getItem('skillswap_badge')); }
    catch { return null; }
  })();

  const handleLogout = () => { localStorage.clear(); navigate('/login'); };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 768px) {
          .nav-links-desktop { display: none !important; }
          .hamburger { display: flex !important; }
        }
        @media (min-width: 769px) {
          .hamburger { display: none !important; }
        }
      `}</style>

      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(255,251,240,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #E8E4D8', padding: '0 24px',
        height: 60, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 16,
      }}>
        <Logo />

        <div className="nav-links-desktop" style={{
          display: 'flex', alignItems: 'center', gap: 4, flex: 1, justifyContent: 'center',
        }}>
          <NavLink to="/" active={path === '/'}>Home</NavLink>
          {isLoggedIn && <NavLink to="/profile" active={path.startsWith('/profile')}>Profile</NavLink>}
          {isLoggedIn && <NavLink to="/assessment" active={path.startsWith('/assessment')}>Assessment</NavLink>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {isLoggedIn && badge && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: '#FFFBF0',
              border: `1.5px solid ${TIER_COLOR[badge.tier] || '#E8E4D8'}`,
              borderRadius: 99, padding: '4px 12px 4px 8px', cursor: 'default',
            }} title={`${badge.skill} — ${badge.tier}`}>
              <span style={{ fontSize: '0.85rem' }}>{TIER_EMOJI[badge.tier] || '🌱'}</span>
              <span style={{
                fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', fontWeight: 600,
                color: TIER_COLOR[badge.tier] || '#7A7A9A',
              }}>{badge.tier}</span>
            </div>
          )}

          <NotificationBell isCommittee={isCommittee} />

          {!isLoggedIn ? (
            <Link to="/login" style={{
              fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '0.88rem',
              color: '#1A1A2E', background: '#F5A623', padding: '8px 20px',
              borderRadius: 10, textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(245,166,35,0.25)', transition: 'all 0.18s',
            }}>Sign in</Link>
          ) : (
            <button onClick={handleLogout} style={{
              fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '0.85rem',
              color: '#7A7A9A', background: 'transparent',
              border: '1.5px solid #E8E4D8', borderRadius: 10,
              padding: '7px 16px', cursor: 'pointer', transition: 'all 0.18s', whiteSpace: 'nowrap',
            }}>Sign out</button>
          )}

          <button onClick={() => setMenuOpen(p => !p)} aria-label="Toggle menu"
            className="hamburger"
            style={{
              display: 'none', background: 'transparent', border: '1.5px solid #E8E4D8',
              borderRadius: 8, width: 36, height: 36,
              alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0, fontSize: '1rem',
            }}>
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div style={{
          position: 'fixed', top: 60, left: 0, right: 0,
          background: '#FFFBF0', borderBottom: '1px solid #E8E4D8',
          padding: '12px 24px 20px', zIndex: 99,
          display: 'flex', flexDirection: 'column', gap: 4,
          animation: 'slideDown 0.2s ease',
        }}>
          <MobileLink to="/" onClick={() => setMenuOpen(false)}>Home</MobileLink>
          {isLoggedIn && <MobileLink to="/profile" onClick={() => setMenuOpen(false)}>Profile</MobileLink>}
          {isLoggedIn && <MobileLink to="/assessment" onClick={() => setMenuOpen(false)}>Assessment</MobileLink>}
        </div>
      )}
    </>
  );
};

const MobileLink = ({ to, children, onClick }) => (
  <Link to={to} onClick={onClick} style={{
    textDecoration: 'none', fontFamily: 'Inter, sans-serif',
    fontWeight: 500, fontSize: '1rem', color: '#1A1A2E',
    padding: '10px 12px', borderRadius: 10, display: 'block', transition: 'background 0.15s',
  }}>{children}</Link>
);

export default Navbar;