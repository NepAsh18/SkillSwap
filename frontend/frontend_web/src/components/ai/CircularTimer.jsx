import React, { useEffect, useRef, useState } from 'react';

const CircularTimer = ({ totalSeconds, onExpire }) => {
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const intervalRef = useRef(null);

  useEffect(() => { setSecondsLeft(totalSeconds); }, [totalSeconds]);

  useEffect(() => {
    if (secondsLeft <= 0) { onExpire && onExpire(); return; }
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) { clearInterval(intervalRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [totalSeconds]);

  const pct    = secondsLeft / totalSeconds;
  const mins   = Math.floor(secondsLeft / 60);
  const secs   = secondsLeft % 60;
  const timeStr = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
  const R      = 24;
  const CIRC   = 2 * Math.PI * R;
  const offset = CIRC * (1 - pct);
  const arcColor = pct > 0.5 ? '#F5A623' : pct > 0.25 ? '#FF8C42' : '#FF6B6B';
  const urgent = pct <= 0.2;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: urgent ? '#FFE8E8' : '#FFF3D0',
      border: `1.5px solid ${urgent ? '#FF6B6B' : '#F5A623'}`,
      borderRadius: 14, padding: '8px 14px', transition: 'all 0.4s',
    }}>
      <svg width={58} height={58} viewBox="0 0 58 58" style={{ flexShrink: 0 }}>
        <circle cx={29} cy={29} r={R} fill="none" stroke="#E8E4D8" strokeWidth={4} />
        <circle cx={29} cy={29} r={R} fill="none" stroke={arcColor} strokeWidth={4}
          strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={offset}
          transform="rotate(-90 29 29)"
          style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.4s' }}
        />
        <text x={29} y={29} textAnchor="middle" dominantBaseline="central"
          fontSize={urgent ? 9.5 : 10} fontFamily="Sora, sans-serif" fontWeight={700}
          fill={urgent ? '#FF6B6B' : '#1A1A2E'}>
          {timeStr}
        </text>
      </svg>
      <div>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', color: '#7A7A9A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Time left
        </div>
        {urgent && (
          <div style={{ fontFamily: 'Sora, sans-serif', fontSize: '0.72rem', fontWeight: 700, color: '#FF6B6B', marginTop: 1 }}>
            Hurry up!
          </div>
        )}
      </div>
    </div>
  );
};

export default CircularTimer;