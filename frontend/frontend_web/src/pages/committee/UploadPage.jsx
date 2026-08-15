import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from "../../context/Navbar";
import UploadForm from "../../components/upload/UploadForm";
import { useNotifications } from '../../hooks/useNotifications';

const TIER_CONFIG = {
  EXPERT: { emoji: '⭐', color: '#F5A623', bg: '#FFF3D0', label: 'Expert' },
  MASTER: { emoji: '👑', color: '#9C27B0', bg: '#F3E5F5', label: 'Master' },
};

const formatTime = (iso) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const StatCard = ({ emoji, label, value, sub, color = '#1A1A2E' }) => (
  <div style={{
    background: '#FFFFFF', borderRadius: 16,
    border: '1px solid #E8E4D8', padding: '20px 22px',
    boxShadow: '0 1px 4px rgba(26,26,46,0.06)',
  }}>
    <div style={{ fontSize: '1.4rem', marginBottom: 10 }}>{emoji}</div>
    <div style={{
      fontFamily: 'Sora, sans-serif', fontWeight: 800,
      fontSize: '1.7rem', color, lineHeight: 1, marginBottom: 4,
    }}>
      {value}
    </div>
    <div style={{
      fontFamily: 'Inter, sans-serif', fontWeight: 600,
      fontSize: '0.82rem', color: '#1A1A2E', marginBottom: 2,
    }}>
      {label}
    </div>
    {sub && (
      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', color: '#7A7A9A' }}>
        {sub}
      </div>
    )}
  </div>
);

const NotifRow = ({ notif, onMarkRead }) => {
  const cfg = TIER_CONFIG[notif.newTier] || { emoji: '🔔', color: '#7A7A9A', bg: '#F5F5F5', label: notif.newTier };
  return (
    <div style={{
      display: 'flex', gap: 14, padding: '16px 20px',
      background: notif.read ? 'transparent' : '#FFFBF0',
      transition: 'background 0.2s',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: cfg.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.25rem',
      }}>
        {cfg.emoji}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'Inter, sans-serif',
          fontWeight: notif.read ? 500 : 700,
          fontSize: '0.88rem', color: '#1A1A2E',
          marginBottom: 3, lineHeight: 1.4,
        }}>
          {notif.title}
        </div>
        <div style={{
          fontFamily: 'Inter, sans-serif', fontSize: '0.8rem',
          color: '#5A5A7A', lineHeight: 1.5, marginBottom: 6,
        }}>
          {notif.body}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{
            background: cfg.bg, color: cfg.color,
            fontFamily: 'Inter, sans-serif', fontWeight: 700,
            fontSize: '0.7rem', padding: '2px 10px',
            borderRadius: 99, letterSpacing: '0.04em',
          }}>
            {cfg.label}
          </span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', color: '#7A7A9A' }}>
            {notif.skill}
          </span>
          <span style={{
            fontFamily: 'Inter, sans-serif', fontSize: '0.74rem',
            color: '#B0ADBE', marginLeft: 'auto',
          }}>
            {formatTime(notif.createdAt)}
          </span>
        </div>
      </div>
      {!notif.read && (
        <button
          onClick={() => onMarkRead(notif.id)}
          title="Mark as read"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#F5A623', fontSize: '1.1rem', flexShrink: 0,
            padding: '4px 6px', borderRadius: 6,
            transition: 'background 0.15s', alignSelf: 'flex-start',
          }}
        >
          ✓
        </button>
      )}
    </div>
  );
};

export default function UploadPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const {
    notifications, unreadCount, loading,
    fetchAll, handleMarkAsRead, handleMarkAllAsRead,
  } = useNotifications(true);

  const role = localStorage.getItem('role');
  const isCommittee = role === 'ROLE_COMMITTEE';

  useEffect(() => {
    if (isCommittee) {
      fetchAll();
    }
  }, [isCommittee, fetchAll]);

  return (
    <>
      <Navbar />

      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-xl font-semibold text-stone-900">
          Upload a Video
        </h1>

        <p className="mt-1 text-sm text-stone-500">
          FFmpeg automatically processes uploaded videos into 1080p, 720p, and
          360p HLS variants. Larger files may take additional time to finish
          processing after the upload reaches 100%.
        </p>

        <div className="mt-6">
          <UploadForm />
        </div>
      </main>

      {/* Committee Dashboard Section - Only visible to committee members */}
      {isCommittee && (
        <div className="mt-12 border-t border-stone-200 pt-12">
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=Inter:wght@400;500;600&display=swap');
            .committee-dashboard * { box-sizing: border-box; }
            .committee-dashboard ::-webkit-scrollbar { width: 4px; }
            .committee-dashboard ::-webkit-scrollbar-track { background: transparent; }
            .committee-dashboard ::-webkit-scrollbar-thumb { background: #E8E4D8; border-radius: 99px; }
          `}</style>

          <div className="committee-dashboard" style={{ background: '#FFFBF0', fontFamily: 'Inter, sans-serif' }}>
            {/* Page header */}
            <div style={{
              background: '#FFFFFF', borderBottom: '1px solid #E8E4D8',
              padding: 'clamp(20px,4vw,32px) clamp(20px,5vw,48px)',
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'linear-gradient(135deg,#F5A623,#F7C45A)',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '1.1rem',
                  }}>
                    ⚡
                  </div>
                  <h1 style={{
                    fontFamily: 'Sora, sans-serif', fontWeight: 800,
                    fontSize: 'clamp(1.15rem,3vw,1.5rem)', color: '#1A1A2E',
                    letterSpacing: '-0.02em',
                  }}>
                    Committee Dashboard
                  </h1>
                </div>
                <p style={{
                  fontFamily: 'Inter, sans-serif', fontSize: '0.82rem',
                  color: '#7A7A9A', marginLeft: 46,
                }}>
                  Review badge tier advancements flagged for committee attention
                </p>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  style={{
                    padding: '9px 20px', borderRadius: 10,
                    border: '1.5px solid #E8E4D8', background: 'transparent',
                    color: '#7A7A9A', fontFamily: 'Inter, sans-serif',
                    fontWeight: 500, fontSize: '0.85rem', cursor: 'pointer',
                    transition: 'all 0.18s', whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => { 
                    e.currentTarget.style.borderColor = '#F5A623'; 
                    e.currentTarget.style.color = '#D4891A'; 
                  }}
                  onMouseLeave={e => { 
                    e.currentTarget.style.borderColor = '#E8E4D8'; 
                    e.currentTarget.style.color = '#7A7A9A'; 
                  }}
                >
                  Mark all read
                </button>
              )}
            </div>

            <div style={{
              maxWidth: 960, margin: '0 auto',
              padding: 'clamp(20px,4vw,36px) clamp(16px,4vw,32px)',
            }}>
              {/* Stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))',
                gap: 14, marginBottom: 32,
              }}>
                <StatCard emoji="🔔" label="Total alerts" value={notifications.length} sub="since joined" />
                <StatCard emoji="📬" label="Unread" value={unreadCount} sub="need your attention" color="#F5A623" />
                <StatCard emoji="⭐" label="Expert alerts" value={notifications.filter(n => n.newTier === 'EXPERT').length} sub="tier advancements" color="#F5A623" />
                <StatCard emoji="👑" label="Master alerts" value={notifications.filter(n => n.newTier === 'MASTER').length} sub="highest tier — review" color="#9C27B0" />
              </div>

              {/* Filter tabs */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                {[
                  { key: 'all', label: 'All', count: notifications.length },
                  { key: 'unread', label: 'Unread', count: unreadCount },
                  { key: 'expert', label: '⭐ Expert', count: notifications.filter(n => n.newTier === 'EXPERT').length },
                  { key: 'master', label: '👑 Master', count: notifications.filter(n => n.newTier === 'MASTER').length },
                ].map(f => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    style={{
                      padding: '7px 16px', borderRadius: 99,
                      border: `1.5px solid ${filter === f.key ? '#F5A623' : '#E8E4D8'}`,
                      background: filter === f.key ? '#FFF3D0' : 'transparent',
                      color: filter === f.key ? '#D4891A' : '#5A5A7A',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: filter === f.key ? 600 : 500,
                      fontSize: '0.82rem', cursor: 'pointer',
                      transition: 'all 0.18s',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    {f.label}
                    <span style={{
                      background: filter === f.key ? '#F5A623' : '#E8E4D8',
                      color: filter === f.key ? '#1A1A2E' : '#7A7A9A',
                      borderRadius: 99, padding: '0 6px',
                      fontSize: '0.72rem', fontWeight: 700,
                      lineHeight: '18px', minWidth: 18, textAlign: 'center',
                    }}>
                      {f.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Notifications panel */}
              <div style={{
                background: '#FFFFFF', borderRadius: 20,
                border: '1px solid #E8E4D8',
                boxShadow: '0 2px 12px rgba(26,26,46,0.06)',
                overflow: 'hidden',
              }}>
                {loading && (
                  <div style={{
                    padding: 40, textAlign: 'center',
                    color: '#7A7A9A', fontFamily: 'Inter, sans-serif', fontSize: '0.88rem',
                  }}>
                    Loading notifications…
                  </div>
                )}
                {!loading && notifications.filter(n => {
                  if (filter === 'unread') return !n.read;
                  if (filter === 'expert') return n.newTier === 'EXPERT';
                  if (filter === 'master') return n.newTier === 'MASTER';
                  return true;
                }).length === 0 && (
                  <div style={{
                    padding: 52, textAlign: 'center',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                  }}>
                    <div style={{ fontSize: '2.2rem' }}>📭</div>
                    <p style={{
                      fontFamily: 'Sora, sans-serif', fontWeight: 700,
                      fontSize: '1rem', color: '#1A1A2E',
                    }}>
                      No notifications here
                    </p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.82rem', color: '#7A7A9A' }}>
                      {filter === 'all'
                        ? 'When users reach Expert or Master tier, alerts will appear here.'
                        : 'Try a different filter.'}
                    </p>
                  </div>
                )}
                {!loading && notifications.filter(n => {
                  if (filter === 'unread') return !n.read;
                  if (filter === 'expert') return n.newTier === 'EXPERT';
                  if (filter === 'master') return n.newTier === 'MASTER';
                  return true;
                }).map((n, i, arr) => (
                  <div
                    key={n.id}
                    style={{
                      borderBottom: i < arr.length - 1 ? '1px solid #F0EDE4' : 'none',
                    }}
                  >
                    <NotifRow notif={n} onMarkRead={handleMarkAsRead} />
                  </div>
                ))}
              </div>

              <p style={{
                fontFamily: 'Inter, sans-serif', fontSize: '0.76rem',
                color: '#B0ADBE', textAlign: 'center', marginTop: 28,
              }}>
                Notifications auto-refresh every 30 seconds · Click ✓ to mark individual alerts as read
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}