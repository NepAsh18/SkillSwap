import React, { useEffect, useState } from 'react';
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

function StatCard({ emoji, label, value, sub, color = '#1A1A2E' }) {
  return (
    <div className="rounded-2xl border border-[#E8E4D8] bg-white p-5 shadow-sm">
      <div className="text-2xl mb-2.5">{emoji}</div>
      <div className="font-['Sora'] font-extrabold text-2xl leading-none mb-1" style={{ color }}>
        {value}
      </div>
      <div className="text-sm font-semibold text-[#1A1A2E]">{label}</div>
      {sub && <div className="text-xs text-[#7A7A9A] mt-0.5">{sub}</div>}
    </div>
  );
}

function NotifRow({ notif, onMarkRead }) {
  const cfg = TIER_CONFIG[notif.newTier] || {
    emoji: '🔔', color: '#7A7A9A', bg: '#F5F5F5', label: notif.newTier,
  };
  return (
    <div className={`flex gap-3.5 px-5 py-4 transition-colors ${notif.read ? "" : "bg-[#FFFBF0]"}`}>
      <div
        className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center text-xl"
        style={{ background: cfg.bg }}
      >
        {cfg.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-sm mb-0.5 leading-snug ${notif.read ? "font-medium" : "font-bold"} text-[#1A1A2E]`}>
          {notif.title}
        </div>
        <div className="text-sm text-[#5A5A7A] leading-relaxed mb-1.5">{notif.body}</div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <span
            className="font-bold text-[11px] px-2.5 py-0.5 rounded-full tracking-wide"
            style={{ background: cfg.bg, color: cfg.color }}
          >
            {cfg.label}
          </span>
          <span className="text-xs text-[#7A7A9A]">{notif.skill}</span>
          <span className="text-xs text-[#B0ADBE] ml-auto">{formatTime(notif.createdAt)}</span>
        </div>
      </div>
      {!notif.read && (
        <button
          onClick={() => onMarkRead(notif.id)}
          title="Mark as read"
          className="text-[#F5A623] text-lg shrink-0 px-1.5 py-1 rounded-md hover:bg-[#FFF3D0] transition-colors self-start"
        >
          ✓
        </button>
      )}
    </div>
  );
}

export default function UploadPage() {
  const [filter, setFilter] = useState('all');
  const {
    notifications, unreadCount, loading,
    fetchAll, handleMarkAsRead, handleMarkAllAsRead,
  } = useNotifications(true);

  const role = localStorage.getItem('role');
  const isCommittee = role === 'ROLE_COMMITTEE';

  useEffect(() => {
    if (isCommittee) fetchAll();
  }, [isCommittee, fetchAll]);

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'expert') return n.newTier === 'EXPERT';
    if (filter === 'master') return n.newTier === 'MASTER';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#FFFBF0]">
      <Navbar />

      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="font-['Sora'] font-extrabold text-2xl text-[#1A1A2E]">Upload a video</h1>
        <p className="mt-1.5 text-sm text-[#7A7A9A]">
          FFmpeg automatically processes uploaded videos into 1080p, 720p, and 360p HLS
          variants. Larger files may take additional time to finish processing after the
          upload reaches 100%.
        </p>

        <div className="mt-6 rounded-2xl border border-[#E8E4D8] bg-white p-6 shadow-sm">
          <UploadForm />
        </div>
      </main>

      {isCommittee && (
        <div className="border-t border-[#E8E4D8]">
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=Inter:wght@400;500;600&display=swap');
          `}</style>

          <div className="bg-white border-b border-[#E8E4D8] px-6 py-7 flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-[#F5A623] to-[#F7C45A] flex items-center justify-center text-lg">
                  ⚡
                </div>
                <h1 className="font-['Sora'] font-extrabold text-xl md:text-2xl text-[#1A1A2E] tracking-tight">
                  Committee dashboard
                </h1>
              </div>
              <p className="text-sm text-[#7A7A9A] ml-[46px]">
                Review badge tier advancements flagged for committee attention
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="px-5 py-2 rounded-[10px] border border-[#E8E4D8] text-[#7A7A9A] font-medium text-sm hover:border-[#F5A623] hover:text-[#D4891A] transition-colors whitespace-nowrap"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-w-[960px] mx-auto px-6 py-9">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-8">
              <StatCard emoji="🔔" label="Total alerts" value={notifications.length} sub="since joined" />
              <StatCard
                emoji="📬" label="Unread" value={unreadCount}
                sub="need your attention" color="#F5A623"
              />
              <StatCard
                emoji="⭐" label="Expert alerts"
                value={notifications.filter((n) => n.newTier === 'EXPERT').length}
                sub="tier advancements" color="#F5A623"
              />
              <StatCard
                emoji="👑" label="Master alerts"
                value={notifications.filter((n) => n.newTier === 'MASTER').length}
                sub="highest tier — review" color="#9C27B0"
              />
            </div>

            <div className="flex gap-2 mb-5 flex-wrap">
              {[
                { key: 'all', label: 'All', count: notifications.length },
                { key: 'unread', label: 'Unread', count: unreadCount },
                { key: 'expert', label: '⭐ Expert', count: notifications.filter((n) => n.newTier === 'EXPERT').length },
                { key: 'master', label: '👑 Master', count: notifications.filter((n) => n.newTier === 'MASTER').length },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm border transition-colors ${
                    filter === f.key
                      ? "border-[#F5A623] bg-[#FFF3D0] text-[#D4891A] font-semibold"
                      : "border-[#E8E4D8] text-[#5A5A7A] font-medium hover:border-[#F5A623]/50"
                  }`}
                >
                  {f.label}
                  <span
                    className={`rounded-full px-1.5 text-xs font-bold leading-[18px] min-w-[18px] text-center ${
                      filter === f.key ? "bg-[#F5A623] text-[#1A1A2E]" : "bg-[#E8E4D8] text-[#7A7A9A]"
                    }`}
                  >
                    {f.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="rounded-[20px] border border-[#E8E4D8] bg-white shadow-sm overflow-hidden">
              {loading && (
                <div className="p-10 text-center text-[#7A7A9A] text-sm">Loading notifications…</div>
              )}

              {!loading && filtered.length === 0 && (
                <div className="p-12 text-center flex flex-col items-center gap-3">
                  <div className="text-4xl">📭</div>
                  <p className="font-['Sora'] font-bold text-[#1A1A2E]">No notifications here</p>
                  <p className="text-sm text-[#7A7A9A]">
                    {filter === 'all'
                      ? 'When users reach Expert or Master tier, alerts will appear here.'
                      : 'Try a different filter.'}
                  </p>
                </div>
              )}

              {!loading &&
                filtered.map((n, i) => (
                  <div
                    key={n.id}
                    className={i < filtered.length - 1 ? "border-b border-[#F0EDE4]" : ""}
                  >
                    <NotifRow notif={n} onMarkRead={handleMarkAsRead} />
                  </div>
                ))}
            </div>

            <p className="text-xs text-[#B0ADBE] text-center mt-7">
              Notifications auto-refresh every 30 seconds · Click ✓ to mark individual alerts as read
            </p>
          </div>
        </div>
      )}
    </div>
  );
}