import React, { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

import { committeeBadgeService } from '../../api/committee';

// Tier ladder, lowest to highest — real progression order, drives sort + axes.
const TIER_ORDER = ['NOVICE', 'APPRENTICE', 'PRACTITIONER', 'EXPERT', 'MASTER'];

const TIER_STYLE = {
  NOVICE: { fg: '#7C8898', bg: '#EEF1F5', ring: '#D7DEE7' },
  APPRENTICE: { fg: '#4A8FB5', bg: '#E6F3F9', ring: '#C7E4F1' },
  PRACTITIONER: { fg: '#3E9E8C', bg: '#E2F5F1', ring: '#C2ECE3' },
  EXPERT: { fg: '#3B8F7A', bg: '#DFF4EC', ring: '#BEE9DC' },
  MASTER: { fg: '#3E7FA8', bg: '#E1F0F8', ring: '#C0E1F0' },
};

function TierChip({ tier }) {
  const style = TIER_STYLE[tier] ?? TIER_STYLE.NOVICE;
  return (
    <span
      className="tier-chip"
      style={{ color: style.fg, background: style.bg, borderColor: style.ring }}
    >
      <svg viewBox="0 0 20 20" className="tier-chip__hex" aria-hidden="true">
        <polygon
          points="10,1 18,5.5 18,14.5 10,19 2,14.5 2,5.5"
          fill="none"
          stroke={style.fg}
          strokeWidth="1.4"
        />
      </svg>
      {tier.charAt(0) + tier.slice(1).toLowerCase()}
    </span>
  );
}

function initials(name) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? '').concat(parts[1]?.[0] ?? '').toUpperCase() || '?';
}

function EmptyState({ text }) {
  return (
    <div className="aa-empty-wrap">
      <div className="aa-empty-icon">∅</div>
      <p className="aa-empty-text">{text}</p>
    </div>
  );
}

const tooltipStyle = {
  contentStyle: {
    background: '#FFFFFF',
    border: '1px solid #E1EAEF',
    borderRadius: '12px',
    boxShadow: '0 10px 30px rgba(43, 53, 64, 0.08)',
    fontSize: '13px',
  },
  labelStyle: { color: '#2B3540', fontWeight: 600 },
};

export default function AssessmentAnalytics() {
  const [rankings, setRankings] = useState([]);
  const [skill, setSkill] = useState('');
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    committeeBadgeService
      .getTopBadges(limit, skill)
      .then((data) => {
        if (!cancelled) setRankings(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ??
              'Could not load rankings. Try again in a moment.'
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [skill, limit]);

  const tierCounts = useMemo(() => {
    const counts = Object.fromEntries(TIER_ORDER.map((t) => [t, 0]));
    rankings.forEach((r) => {
      if (counts[r.tier] !== undefined) counts[r.tier] += 1;
    });
    return counts;
  }, [rankings]);

  const tierChartData = useMemo(
    () =>
      TIER_ORDER.map((t) => ({
        name: t.charAt(0) + t.slice(1).toLowerCase(),
        count: tierCounts[t],
        tier: t,
      })),
    [tierCounts]
  );

  const skillsPresent = useMemo(() => {
    const set = new Set(rankings.map((r) => r.skill).filter(Boolean));
    return Array.from(set).sort();
  }, [rankings]);

  const avgScoreBySkill = useMemo(() => {
    const bySkill = new Map();
    rankings.forEach((r) => {
      if (!bySkill.has(r.skill)) bySkill.set(r.skill, []);
      bySkill.get(r.skill).push(r.averageScore ?? 0);
    });
    return Array.from(bySkill.entries())
      .map(([name, scores]) => ({
        name,
        avg: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
      }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 8);
  }, [rankings]);

  return (
    <div className="aa-page">
      <style>{`
        .aa-page {
          --ink: #F7FAFC;
          --panel: #FFFFFF;
          --panel-raised: #F1F6F8;
          --hairline: #E1EAEF;
          --text: #2B3540;
          --text-muted: #7C8898;
          --blue: #8FC6E3;
          --blue-deep: #4A8FB5;
          --green: #9BDDC7;
          --green-deep: #3E9E8C;

          min-height: 100vh;
          background: var(--ink);
          color: var(--text);
          font-family: 'Inter', -apple-system, sans-serif;
          padding: 40px 32px 80px;
        }

        .aa-page * { box-sizing: border-box; }

        @media (prefers-reduced-motion: reduce) {
          .aa-page * { animation: none !important; transition: none !important; }
        }

        .aa-header {
          max-width: 1180px;
          margin: 0 auto 32px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          flex-wrap: wrap;
          gap: 16px;
          border-bottom: 1px solid var(--hairline);
          padding-bottom: 24px;
        }

        .aa-eyebrow {
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--blue-deep);
          font-weight: 600;
          margin: 0 0 8px;
        }

        .aa-title {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 34px;
          font-weight: 600;
          margin: 0;
          letter-spacing: -0.01em;
        }

        .aa-subtitle {
          color: var(--text-muted);
          font-size: 14px;
          margin: 8px 0 0;
          max-width: 46ch;
        }

        .aa-controls {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        .aa-select {
          background: var(--panel);
          border: 1px solid var(--hairline);
          color: var(--text);
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          padding: 9px 12px;
          border-radius: 8px;
          outline: none;
        }

        .aa-select:focus-visible {
          border-color: var(--blue-deep);
          box-shadow: 0 0 0 3px rgba(74,143,181,0.15);
        }

        .aa-grid {
          max-width: 1180px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.3fr 1fr;
          gap: 20px;
        }

        @media (max-width: 900px) {
          .aa-grid { grid-template-columns: 1fr; }
        }

        .aa-panel {
          background: var(--panel);
          border: 1px solid var(--hairline);
          border-radius: 14px;
          padding: 22px 24px;
          box-shadow: 0 1px 2px rgba(43,53,64,0.04);
        }

        .aa-panel--span2 { grid-column: 1 / -1; }

        .aa-panel-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--text);
          margin: 0 0 4px;
        }

        .aa-panel-caption {
          font-size: 12px;
          color: var(--text-muted);
          margin: 0 0 18px;
        }

        .aa-chart-wrap {
          height: 260px;
          position: relative;
        }

        .aa-stat-row {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
          margin-bottom: 22px;
        }

        @media (max-width: 700px) {
          .aa-stat-row { grid-template-columns: repeat(2, 1fr); }
        }

        .aa-stat {
          background: var(--panel-raised);
          border: 1px solid var(--hairline);
          border-radius: 10px;
          padding: 14px 16px;
        }

        .aa-stat-num {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 26px;
          font-weight: 600;
          line-height: 1;
        }

        .aa-stat-label {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 6px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .aa-leaderboard {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .aa-row {
          display: grid;
          grid-template-columns: 28px 36px 1fr auto auto;
          align-items: center;
          gap: 14px;
          padding: 12px 4px;
          border-bottom: 1px solid var(--hairline);
        }

        .aa-row:last-child { border-bottom: none; }

        .aa-rank {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 15px;
          color: var(--text-muted);
          text-align: center;
        }

        .aa-rank--1 { color: var(--blue-deep); }
        .aa-rank--2 { color: #9AA6B4; }
        .aa-rank--3 { color: #B79A6E; }

        .aa-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--green);
          border: 1px solid var(--hairline);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          color: #1F5C4E;
        }

        .aa-user-name {
          font-size: 14px;
          font-weight: 500;
        }

        .aa-user-skill {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 2px;
        }

        .aa-score {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 16px;
          text-align: right;
        }

        .tier-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 9px 4px 6px;
          border-radius: 999px;
          border: 1px solid;
          white-space: nowrap;
        }

        .tier-chip__hex { width: 12px; height: 12px; }

        .aa-empty-wrap {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .aa-empty-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: var(--panel-raised);
          color: var(--blue-deep);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }

        .aa-empty-text {
          font-size: 13px;
          color: var(--text-muted);
          margin: 0;
          text-align: center;
        }

        .aa-error {
          text-align: center;
          padding: 48px 20px;
          color: #C2694F;
          font-size: 14px;
        }

        .aa-skeleton {
          height: 260px;
          border-radius: 10px;
          background: linear-gradient(90deg, var(--panel-raised) 25%, #E1EAEF 50%, var(--panel-raised) 75%);
          background-size: 200% 100%;
          animation: aa-shimmer 1.4s infinite;
        }

        @keyframes aa-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <header className="aa-header">
        <div>
          <p className="aa-eyebrow">Committee · Skill Assessment</p>
          <h1 className="aa-title">Assessment Analytics</h1>
          <p className="aa-subtitle">
            Tier distribution and top performers across skill assessments, updated
            as sessions are scored.
          </p>
        </div>

        <div className="aa-controls">
          <select
            className="aa-select"
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            aria-label="Filter by skill"
          >
            <option value="">All skills</option>
            {skillsPresent.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            className="aa-select"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            aria-label="Number of results"
          >
            {[10, 20, 30, 50].map((n) => (
              <option key={n} value={n}>Top {n}</option>
            ))}
          </select>
        </div>
      </header>

      {error && <div className="aa-error">{error}</div>}

      {!error && (
        <div className="aa-grid">
          <section className="aa-panel aa-panel--span2">
            <div className="aa-stat-row">
              {TIER_ORDER.map((t) => (
                <div className="aa-stat" key={t}>
                  <div className="aa-stat-num" style={{ color: TIER_STYLE[t].fg }}>
                    {tierCounts[t]}
                  </div>
                  <div className="aa-stat-label">
                    {t.charAt(0) + t.slice(1).toLowerCase()}
                  </div>
                </div>
              ))}
            </div>

            <h2 className="aa-panel-title">Tier distribution</h2>
            <p className="aa-panel-caption">
              How many assessors currently sit at each tier{skill ? ` for ${skill}` : ''}.
            </p>
            <div className="aa-chart-wrap">
              {loading ? (
                <div className="aa-skeleton" />
              ) : rankings.length === 0 ? (
                <EmptyState text="No badge data yet for this filter." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={tierChartData}
                    margin={{ top: 10, right: 15, left: -10, bottom: 5 }}
                  >
                    <CartesianGrid stroke="#EDF2F5" vertical={false} />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#7C8898', fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                      tick={{ fill: '#7C8898', fontSize: 11 }}
                    />
                    <Tooltip cursor={{ fill: '#F1F6F8' }} {...tooltipStyle} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={44}>
                      {tierChartData.map((entry) => (
                        <Cell key={entry.tier} fill={TIER_STYLE[entry.tier].fg} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          <section className="aa-panel">
            <h2 className="aa-panel-title">Leaderboard</h2>
            <p className="aa-panel-caption">Ranked by level, then total score.</p>
            {loading ? (
              <div className="aa-skeleton" style={{ height: 320 }} />
            ) : rankings.length === 0 ? (
              <EmptyState text="Nobody's ranked yet." />
            ) : (
              <ul className="aa-leaderboard">
                {rankings.map((r) => (
                  <li className="aa-row" key={`${r.userId}-${r.skill}`}>
                    <span className={`aa-rank aa-rank--${r.rank}`}>{r.rank}</span>
                    <span className="aa-avatar">{initials(r.userName)}</span>
                    <span>
                      <div className="aa-user-name">{r.userName}</div>
                      <div className="aa-user-skill">{r.skill} · Lv {r.currentLevel}</div>
                    </span>
                    <TierChip tier={r.tier} />
                    <span className="aa-score">{Math.round(r.averageScore)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="aa-panel">
            <h2 className="aa-panel-title">Average score by skill</h2>
            <p className="aa-panel-caption">
              Where assessors are scoring strongest, across the ranked set above.
            </p>
            <div className="aa-chart-wrap">
              {loading ? (
                <div className="aa-skeleton" />
              ) : avgScoreBySkill.length < 3 ? (
                <EmptyState text="Need at least 3 distinct skills to draw this shape — try clearing the skill filter." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={avgScoreBySkill} outerRadius="75%">
                    <PolarGrid stroke="#EDF2F5" />
                    <PolarAngleAxis
                      dataKey="name"
                      tick={{ fill: '#7C8898', fontSize: 11 }}
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 100]}
                      tick={false}
                      axisLine={false}
                    />
                    <Radar
                      dataKey="avg"
                      stroke="#3E9E8C"
                      fill="#9BDDC7"
                      fillOpacity={0.4}
                      strokeWidth={2}
                    />
                    <Tooltip {...tooltipStyle} />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}