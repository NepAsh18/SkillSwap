import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
 import { initiateAssessment, submitAnswers } from '../api/assessmentService';
import { useBadge } from '../context/BadgeContext';
import CircularTimer from '../components/ai/CircularTimer';

const TOTAL_SECONDS = 45 * 60;

const useAntiCheat = (active) => {
  const [warnings, setWarnings]     = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const warningMsg  = useRef('');
  const timeoutRef  = useRef(null);

  const triggerWarning = useCallback((msg) => {
    warningMsg.current = msg;
    setWarnings(p => p + 1);
    setShowWarning(true);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setShowWarning(false), 3500);
  }, []);

  useEffect(() => {
    if (!active) return;
    const handleCopy  = (e) => { e.preventDefault(); triggerWarning('⚠️  Copying is not allowed during the assessment.'); };
    const handlePaste = (e) => { e.preventDefault(); triggerWarning('⚠️  Pasting is not allowed during the assessment.'); };
    const handleBlur  = ()  => triggerWarning('⚠️  Leaving the tab has been recorded.');
    document.addEventListener('copy',  handleCopy);
    document.addEventListener('paste', handlePaste);
    window.addEventListener('blur',    handleBlur);
    return () => {
      document.removeEventListener('copy',  handleCopy);
      document.removeEventListener('paste', handlePaste);
      window.removeEventListener('blur',    handleBlur);
    };
  }, [active, triggerWarning]);

  return { warnings, showWarning, warningMsg: warningMsg.current };
};

const MCQQuestion = ({ question, answer, onChange }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
    {question.options?.map(opt => {
      const selected = answer === opt.label;
      return (
        <button
          key={opt.label}
          onClick={() => onChange(opt.label)}
          style={{
            display: 'flex', alignItems: 'flex-start', gap: 14,
            padding: '14px 18px', borderRadius: 12, textAlign: 'left',
            border: `2px solid ${selected ? '#F5A623' : '#E8E4D8'}`,
            background: selected ? '#FFF3D0' : '#FAFAF7',
            cursor: 'pointer', transition: 'all 0.18s', width: '100%',
          }}
        >
          <span style={{
            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
            border: `2px solid ${selected ? '#F5A623' : '#D0CEC8'}`,
            background: selected ? '#F5A623' : 'transparent',
            color: selected ? '#1A1A2E' : '#7A7A9A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '0.8rem',
            transition: 'all 0.18s',
          }}>
            {opt.label}
          </span>
          <span style={{
            fontFamily: 'Inter, sans-serif', fontSize: '0.92rem',
            color: '#1A1A2E', lineHeight: 1.55, paddingTop: 2,
          }}>
            {opt.text}
          </span>
        </button>
      );
    })}
  </div>
);

const TextQuestion = ({ answer, onChange, placeholder }) => (
  <textarea
    value={answer}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    rows={6}
    style={{
      width: '100%', padding: '14px 16px', borderRadius: 12,
      border: '2px solid #E8E4D8', background: '#FAFAF7',
      fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', color: '#1A1A2E',
      resize: 'vertical', outline: 'none',
      transition: 'border-color 0.18s', lineHeight: 1.6,
    }}
    onFocus={e => (e.target.style.borderColor = '#F5A623')}
    onBlur={e  => (e.target.style.borderColor = '#E8E4D8')}
  />
);

const TypeBadge = ({ type }) => {
  const cfg = {
    MCQ:      { color: '#2196F3', bg: '#E3F2FD', label: 'MCQ'      },
    CODING:   { color: '#9C27B0', bg: '#F3E5F5', label: 'Coding'   },
    APTITUDE: { color: '#4CAF82', bg: '#E8F8F0', label: 'Aptitude' },
  }[type] || { color: '#7A7A9A', bg: '#F5F5F5', label: type };
  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.72rem',
      padding: '3px 10px', borderRadius: 6,
      textTransform: 'uppercase', letterSpacing: '0.05em',
    }}>
      {cfg.label}
    </span>
  );
};

const LoadingScreen = () => (
  <div style={{
    minHeight: '100vh', background: '#FFFBF0',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 18,
  }}>
    <div style={{ fontSize: '2.6rem' }}>⚡</div>
    <p style={{
      fontFamily: 'Sora, sans-serif', fontWeight: 700,
      fontSize: '1.1rem', color: '#1A1A2E',
    }}>
      Preparing your assessment…
    </p>
    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', color: '#7A7A9A' }}>
      Analysing your profile and generating questions
    </p>
  </div>
);

const ErrorScreen = ({ message, onBack }) => (
  <div style={{
    minHeight: '100vh', background: '#FFFBF0',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: 16, padding: 24, textAlign: 'center',
  }}>
    <div style={{ fontSize: '2.6rem' }}>⚠️</div>
    <p style={{
      fontFamily: 'Sora, sans-serif', fontWeight: 700,
      fontSize: '1.05rem', color: '#1A1A2E', maxWidth: 400,
    }}>
      {message}
    </p>
    <button
      onClick={onBack}
      style={{
        marginTop: 8, padding: '11px 28px', borderRadius: 10,
        border: 'none', background: '#F5A623', color: '#1A1A2E',
        fontFamily: 'Sora, sans-serif', fontWeight: 700, cursor: 'pointer',
      }}
    >
      Go home
    </button>
  </div>
);

const AssessmentPage = () => {
  const navigate = useNavigate();
  const { saveBadge } = useBadge();

  const [phase, setPhase]         = useState('loading');
  const [sessionId, setSessionId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent]     = useState(0);
  const [answers, setAnswers]     = useState({});
  const [error, setError]         = useState('');
  const [skillInfo, setSkillInfo] = useState({ skill: '', level: 1 });

  const userId = localStorage.getItem('userId');
  const { warnings, showWarning, warningMsg } = useAntiCheat(phase === 'active');

  useEffect(() => {
    if (!userId) { navigate('/login'); return; }
    initiateAssessment(userId)
      .then(data => {
        setSessionId(data.sessionId);
        setQuestions(data.questions);
        setSkillInfo({ skill: data.skill, level: data.level });
        setPhase('active');
      })
      .catch(err => {
        const msg = err.response?.data?.message || '';
        setError(
          msg.includes('skill') || msg.includes('profile')
            ? 'Please complete your skills in your profile before taking the assessment.'
            : 'Could not start the assessment. Please try again.'
        );
        setPhase('error');
      });
  }, []);

  const setAnswer = (qId, val) =>
    setAnswers(prev => ({ ...prev, [qId]: val }));

  const handleSubmit = async () => {
    setPhase('submitting');
    const payload = questions.map(q => ({
      questionId: q.questionId,
      answer: answers[q.questionId] || '',
    }));
    try {
      const result = await submitAnswers(sessionId, payload);
      if (result.badge) saveBadge(result.badge);
      navigate('/', { replace: true });
    } catch {
      setError('Submission failed. Please try again.');
      setPhase('active');
    }
  };

  const q        = questions[current];
  const totalQ   = questions.length;
  const answered = Object.keys(answers).filter(k => answers[k]?.trim()).length;
  const progress = totalQ > 0 ? Math.round((answered / totalQ) * 100) : 0;

  if (phase === 'loading') return <LoadingScreen />;
  if (phase === 'error')   return <ErrorScreen message={error} onBack={() => navigate('/')} />;

  return (
    <div style={{ minHeight: '100vh', background: '#FFFBF0', fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=Inter:wght@400;500;600&display=swap');
      `}</style>

      {/* Anti-cheat toast */}
      {showWarning && (
        <div style={{
          position: 'fixed', top: 76, left: '50%', transform: 'translateX(-50%)',
          background: '#FF6B6B', color: '#fff',
          fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.88rem',
          padding: '12px 24px', borderRadius: 12,
          boxShadow: '0 4px 20px rgba(255,107,107,0.35)',
          zIndex: 300, whiteSpace: 'nowrap',
        }}>
          {warningMsg}
          {warnings >= 3 && (
            <span style={{ marginLeft: 8, opacity: 0.85 }}>({warnings} recorded)</span>
          )}
        </div>
      )}

      {/* Sticky top bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(255,251,240,0.96)', backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #E8E4D8',
        padding: '0 clamp(16px,4vw,32px)', height: 66,
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 16,
      }}>
        <div>
          <div style={{
            fontFamily: 'Sora, sans-serif', fontWeight: 700,
            fontSize: '1rem', color: '#1A1A2E', textTransform: 'capitalize',
          }}>
            {skillInfo.skill} Assessment
          </div>
          <div style={{
            fontFamily: 'Inter, sans-serif', fontSize: '0.74rem', color: '#7A7A9A',
          }}>
            Level {skillInfo.level} · {totalQ} questions
          </div>
        </div>

        <div style={{ flex: 1, maxWidth: 260, display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ height: 6, borderRadius: 99, background: '#E8E4D8', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${progress}%`,
              background: 'linear-gradient(90deg,#F5A623,#4CAF82)',
              borderRadius: 99, transition: 'width 0.4s ease',
            }} />
          </div>
          <div style={{
            fontFamily: 'Inter, sans-serif', fontSize: '0.72rem',
            color: '#7A7A9A', textAlign: 'right',
          }}>
            {answered} / {totalQ} answered
          </div>
        </div>

        {phase === 'active' && (
          <CircularTimer totalSeconds={TOTAL_SECONDS} onExpire={handleSubmit} />
        )}
      </div>

      {/* Question card */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(24px,4vw,40px) 20px 80px' }}>
        {q && (
          <div style={{
            background: '#FFFFFF', borderRadius: 20,
            border: '1px solid #E8E4D8',
            boxShadow: '0 4px 16px rgba(26,26,46,0.07)',
            padding: 'clamp(20px,4vw,36px)',
          }}>
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 22, flexWrap: 'wrap', gap: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  fontFamily: 'Sora, sans-serif', fontWeight: 800,
                  fontSize: '0.8rem', color: '#7A7A9A',
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                }}>
                  {current + 1} / {totalQ}
                </span>
                <TypeBadge type={q.type} />
              </div>
              <span style={{
                fontSize: '0.75rem', color: '#7A7A9A',
                background: '#F5F2EA', padding: '3px 10px', borderRadius: 6,
              }}>
                {q.topic}
              </span>
            </div>

            {/* Question text */}
            <p
              onContextMenu={e => e.preventDefault()}
              style={{
                fontFamily: 'Sora, sans-serif', fontWeight: 600,
                fontSize: 'clamp(0.95rem,2.2vw,1.1rem)', color: '#1A1A2E',
                lineHeight: 1.65, marginBottom: 24,
                userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none',
              }}
            >
              {q.questionText}
            </p>

            {/* Answer */}
            {q.type === 'MCQ' ? (
              <MCQQuestion
                question={q}
                answer={answers[q.questionId] || ''}
                onChange={val => setAnswer(q.questionId, val)}
              />
            ) : (
              <TextQuestion
                answer={answers[q.questionId] || ''}
                onChange={val => setAnswer(q.questionId, val)}
                placeholder={
                  q.type === 'CODING'
                    ? 'Write your approach or solution here…'
                    : 'Write your answer here…'
                }
              />
            )}

            {/* Navigation */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginTop: 30, gap: 12, flexWrap: 'wrap',
            }}>
              <button
                onClick={() => setCurrent(p => Math.max(0, p - 1))}
                disabled={current === 0}
                style={{
                  padding: '10px 22px', borderRadius: 10,
                  border: '1.5px solid #E8E4D8', background: 'transparent',
                  color: current === 0 ? '#C0BEBA' : '#1A1A2E',
                  fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '0.88rem',
                  cursor: current === 0 ? 'not-allowed' : 'pointer', transition: 'all 0.18s',
                }}
              >
                ← Previous
              </button>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                {questions.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    title={`Question ${i + 1}`}
                    style={{
                      width: 10, height: 10, borderRadius: '50%',
                      border: 'none', padding: 0, cursor: 'pointer',
                      transition: 'background 0.18s',
                      background: i === current
                        ? '#F5A623'
                        : answers[questions[i]?.questionId]?.trim()
                          ? '#4CAF82'
                          : '#E8E4D8',
                    }}
                  />
                ))}
              </div>

              {current < totalQ - 1 ? (
                <button
                  onClick={() => setCurrent(p => p + 1)}
                  style={{
                    padding: '10px 22px', borderRadius: 10,
                    border: 'none', background: '#F5A623', color: '#1A1A2E',
                    fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '0.88rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(245,166,35,0.3)', transition: 'all 0.18s',
                  }}
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={phase === 'submitting'}
                  style={{
                    padding: '10px 26px', borderRadius: 10,
                    border: 'none',
                    background: phase === 'submitting' ? '#C0BEBA' : '#4CAF82',
                    color: '#fff',
                    fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '0.88rem',
                    cursor: phase === 'submitting' ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 8px rgba(76,175,130,0.3)', transition: 'all 0.18s',
                  }}
                >
                  {phase === 'submitting' ? 'Submitting…' : 'Submit ✓'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssessmentPage;