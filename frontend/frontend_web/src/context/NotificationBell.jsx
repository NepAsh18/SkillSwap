import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../hooks/useNotifications';

const TIER_EMOJI = { EXPERT: '⭐', MASTER: '👑' };

const formatTime = (iso) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const BellIcon = ({ color = '#1A1A2E' }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const NotificationBell = ({ isCommittee }) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  const {
    notifications, unreadCount, isNewNotif,
    loading, fetchAll, handleMarkAsRead, handleMarkAllAsRead,
  } = useNotifications(isCommittee);

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!document.getElementById('notif-blink-style')) {
      const style = document.createElement('style');
      style.id = 'notif-blink-style';
      style.textContent = `
        @keyframes notifBlink {
          0%, 100% { background: transparent; }
          50% { background: rgba(255,107,107,0.18); }
        }
        .notif-bell-blink { animation: notifBlink 1s ease-in-out 3; }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const toggle = () => {
    if (!open) fetchAll();
    setOpen(p => !p);
  };

  if (!isCommittee) return null;

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <button
        onClick={toggle}
        className={isNewNotif ? 'notif-bell-blink' : ''}
        aria-label={`Notifications, ${unreadCount} unread`}
        style={{
          position: 'relative',
          background: open ? '#FFF3D0' : 'transparent',
          border: '1.5px solid',
          borderColor: open ? '#F5A623' : '#E8E4D8',
          borderRadius: '10px',
          width: 40, height: 40,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.18s',
        }}
      >
        <BellIcon color={isNewNotif ? '#FF6B6B' : '#1A1A2E'} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -5, right: -5,
            background: '#FF6B6B', color: '#fff',
            fontSize: '0.65rem', fontWeight: 700,
            fontFamily: 'Inter, sans-serif',
            borderRadius: '99px', minWidth: 18, height: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px', lineHeight: 1,
            boxShadow: '0 1px 4px rgba(255,107,107,0.4)',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 10px)', right: 0,
          width: 320, background: '#FFFFFF',
          borderRadius: 16, boxShadow: '0 8px 32px rgba(26,26,46,0.14)',
          border: '1px solid #E8E4D8', zIndex: 1000, overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -7, right: 14,
            width: 14, height: 14, background: '#FFFFFF',
            border: '1px solid #E8E4D8', borderBottom: 'none', borderRight: 'none',
            transform: 'rotate(45deg)',
          }} />

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px 10px', borderBottom: '1px solid #F0EDE4',
          }}>
            <span style={{
              fontFamily: 'Sora, sans-serif', fontWeight: 700,
              fontSize: '0.92rem', color: '#1A1A2E',
            }}>
              Notifications
            </span>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllAsRead} style={{
                background: 'none', border: 'none', color: '#F5A623',
                fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', padding: '2px 6px', borderRadius: 6,
              }}>
                Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight: 340, overflowY: 'auto' }}>
            {loading && (
              <div style={{ padding: 24, textAlign: 'center', color: '#7A7A9A', fontSize: '0.85rem' }}>
                Loading…
              </div>
            )}
            {!loading && notifications.length === 0 && (
              <div style={{ padding: 28, textAlign: 'center', color: '#7A7A9A', fontSize: '0.85rem' }}>
                <div style={{ fontSize: '1.6rem', marginBottom: 8 }}>🔔</div>
                No notifications yet
              </div>
            )}
            {!loading && notifications.map((n, i) => (
              <div
                key={n.id}
                onClick={() => !n.read && handleMarkAsRead(n.id)}
                style={{
                  display: 'flex', gap: 12, padding: '12px 16px',
                  background: n.read ? 'transparent' : '#FFFBF0',
                  borderBottom: i < notifications.length - 1 ? '1px solid #F5F2EA' : 'none',
                  cursor: n.read ? 'default' : 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: n.newTier === 'MASTER' ? '#FFF3D0' : '#E8F4FD',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.1rem', flexShrink: 0,
                }}>
                  {TIER_EMOJI[n.newTier] || '🔔'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontFamily: 'Inter, sans-serif', fontSize: '0.82rem',
                    fontWeight: n.read ? 400 : 600, color: '#1A1A2E',
                    marginBottom: 2, lineHeight: 1.4,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {n.title}
                  </p>
                  <p style={{
                    fontSize: '0.75rem', color: '#7A7A9A',
                    fontFamily: 'Inter, sans-serif',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <span style={{
                      background: n.newTier === 'MASTER' ? '#FFF3D0' : '#E8F8F0',
                      color: n.newTier === 'MASTER' ? '#D4891A' : '#4CAF82',
                      borderRadius: 4, padding: '1px 6px',
                      fontWeight: 600, fontSize: '0.7rem',
                    }}>
                      {n.newTier}
                    </span>
                    {n.skill}
                    {!n.read && (
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: '#FF6B6B', display: 'inline-block',
                        marginLeft: 'auto', flexShrink: 0,
                      }} />
                    )}
                  </p>
                  <p style={{ fontSize: '0.72rem', color: '#B0ADBE', fontFamily: 'Inter, sans-serif', marginTop: 2 }}>
                    {formatTime(n.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;