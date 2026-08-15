import React, { useEffect } from 'react';
import { useBadge } from '../../context/BadgeContext';

const TIER_CONFIG = {
  NOVICE:       { emoji: '🌱', color: '#7A7A9A', bg: '#F5F5F5',  label: 'Novice'       },
  APPRENTICE:   { emoji: '🔧', color: '#4CAF82', bg: '#E8F8F0',  label: 'Apprentice'   },
  PRACTITIONER: { emoji: '⚙️', color: '#2196F3', bg: '#E3F2FD',  label: 'Practitioner' },
  EXPERT:       { emoji: '⭐', color: '#F5A623', bg: '#FFF3D0',  label: 'Expert'       },
  MASTER:       { emoji: '👑', color: '#9C27B0', bg: '#F3E5F5',  label: 'Master'       },
};

const Stat = ({ label, value }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.3rem', color: '#1A1A2E', lineHeight: 1 }}>{value}</div>
    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem', color: '#7A7A9A', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
  </div>
);

const BadgePopup = () => {
  const { latestBadge, showPopup, dismissPopup } = useBadge();

  useEffect(() => {
    if (!document.getElementById('badge-popup-style')) {
      const s = document.createElement('style');
      s.id = 'badge-popup-style';
      s.textContent = `
        @keyframes badgeSlideUp {
          from { opacity: 0; transform: translate(-50%, 30px) scale(0.94); }
          to   { opacity: 1; transform: translate(-50%, 0) scale(1); }
        }
        @keyframes badgePulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.08); }
        }
      `;
      document.head.appendChild(s);
    }
  }, []);

  if (!showPopup || !latestBadge) return null;

  const cfg = TIER_CONFIG[latestBadge.tier] || TIER_CONFIG.NOVICE;

  return (
    <>
      <div onClick={dismissPopup} style={{
        position: 'fixed', inset: 0,
        background: 'rgba(26,26,46,0.32)', backdropFilter: 'blur(3px)', zIndex: 200,
      }} />
      <div style={{
        position: 'fixed', bottom: '10%', left: '50%', transform: 'translateX(-50%)',
        zIndex: 201, background: '#FFFFFF', borderRadius: 24,
        boxShadow: '0 16px 48px rgba(26,26,46,0.18)',
        border: `2px solid ${cfg.color}22`,
        padding: '32px 36px 28px', width: 'min(420px, 90vw)',
        textAlign: 'center', animation: 'badgeSlideUp 0.32s cubic-bezier(0.22,1,0.36,1) both',
      }}>
        <div style={{ fontSize: '3.6rem', lineHeight: 1, marginBottom: 14, animation: 'badgePulse 1.2s ease-in-out 2' }}>
          {cfg.emoji}
        </div>
        <div style={{
          display: 'inline-block', background: cfg.bg, color: cfg.color,
          fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '0.78rem',
          letterSpacing: '0.08em', textTransform: 'uppercase',
          padding: '4px 14px', borderRadius: 99, marginBottom: 12,
        }}>{cfg.label}</div>
        <h2 style={{
          fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.35rem',
          color: '#1A1A2E', marginBottom: 6, letterSpacing: '-0.02em',
        }}>Badge Earned!</h2>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', color: '#7A7A9A', marginBottom: 20, lineHeight: 1.5 }}>
          You've earned the <strong style={{ color: cfg.color }}>{cfg.label}</strong> badge
          in <strong style={{ color: '#1A1A2E' }}>{latestBadge.skill}</strong>. Keep going to level up!
        </p>
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 24,
          padding: '14px 0', borderTop: '1px solid #F0EDE4', borderBottom: '1px solid #F0EDE4',
        }}>
          <Stat label="Score"    value={`${Math.round(latestBadge.averageScore ?? 0)}%`} />
          <Stat label="Level"    value={latestBadge.currentLevel ?? 1} />
          <Stat label="Sessions" value={latestBadge.sessionsCompleted ?? 1} />
        </div>
        <button onClick={dismissPopup} style={{
          width: '100%', background: '#F5A623', color: '#1A1A2E', border: 'none',
          borderRadius: 12, padding: '12px 0',
          fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
        }}>Continue →</button>
      </div>
    </>
  );
};

export default BadgePopup;