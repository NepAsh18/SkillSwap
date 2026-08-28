import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useParams, useNavigate } from "react-router-dom";
import { pageService } from "../api/pageService";
import {getMyProfile} from "../api/profileService";
import { useVideos } from "../hooks/useVideos";
import { useBadge } from "../context/BadgeContext";

// Layout Imports
import AppLayout from "../components/layout/AppLayout";
import Navbar from "../components/layout/Navbar";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import GoldCard from "../components/layout/GoldCard";

// Video Components Imports
import VideoGrid from "../components/video/VideoGrid";
import Spinner from "../components/common/Spinner";
import ErrorBanner from "../components/common/ErrorBanner";

// Badge Components Imports (from HomePage)
import BadgePopup from "../components/ai/BadgePopup";

// --- Home hero / badge config (from HomePage.jsx) ---
const TIER_CONFIG = {
  NOVICE:       { emoji: '🌱', color: '#7A7A9A', bg: '#F5F5F5',  label: 'Novice'       },
  APPRENTICE:   { emoji: '🔧', color: '#4CAF82', bg: '#E8F8F0',  label: 'Apprentice'   },
  PRACTITIONER: { emoji: '⚙️', color: '#2196F3', bg: '#E3F2FD',  label: 'Practitioner' },
  EXPERT:       { emoji: '⭐', color: '#F5A623', bg: '#FFF3D0',  label: 'Expert'       },
  MASTER:       { emoji: '👑', color: '#9C27B0', bg: '#F3E5F5',  label: 'Master'       },
};

const HOW_IT_WORKS = [
  { icon: '👤', title: 'Complete your profile',  desc: 'Add your skills, education, and projects so the AI knows where to start.' },
  { icon: '🤖', title: 'AI builds your test',    desc: 'Questions are generated specifically for your skill level — no generic quizzes.' },
  { icon: '✍️', title: 'Answer in 45 minutes',   desc: 'A mix of MCQ, coding, and aptitude questions all in one timed session.' },
  { icon: '🏅', title: 'Earn a verified badge',  desc: 'Your badge tier updates automatically and reflects peer feedback too.' },
];

const TIERS = [
  { tier: 'NOVICE',       range: '0 – 39%'   },
  { tier: 'APPRENTICE',   range: '40 – 59%'  },
  { tier: 'PRACTITIONER', range: '60 – 74%'  },
  { tier: 'EXPERT',       range: '75 – 89%'  },
  { tier: 'MASTER',       range: '90 – 100%' },
];

const HoverCard = ({ children, style = {} }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#FFFFFF',
        borderRadius: 16,
        border: '1px solid #E8E4D8',
        padding: '22px 20px',
        transition: 'box-shadow 0.2s, transform 0.2s',
        boxShadow: hovered ? '0 8px 28px rgba(26,26,46,0.11)' : '0 1px 4px rgba(26,26,46,0.06)',
        transform: hovered ? 'translateY(-3px)' : 'none',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const BadgeCard = ({ badge, onRetake }) => {
  const cfg = TIER_CONFIG[badge.tier] || TIER_CONFIG.NOVICE;
  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: 20,
      border: `1.5px solid ${cfg.color}33`,
      padding: 'clamp(18px, 3vw, 28px)',
      display: 'flex',
      alignItems: 'center',
      gap: 20,
      flexWrap: 'wrap',
      boxShadow: '0 2px 12px rgba(26,26,46,0.07)',
    }}>
      <div style={{
        width: 58, height: 58, borderRadius: 16,
        background: cfg.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.9rem', flexShrink: 0,
      }}>
        {cfg.emoji}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'Sora, sans-serif', fontWeight: 700,
          fontSize: '0.98rem', color: '#1A1A2E', marginBottom: 3,
        }}>
          Your badge — <span style={{ color: cfg.color }}>{cfg.label}</span>
        </div>
        <div style={{
          fontFamily: 'Inter, sans-serif', fontSize: '0.82rem',
          color: '#7A7A9A', display: 'flex', gap: 14, flexWrap: 'wrap',
        }}>
          <span>🎯 {badge.skill}</span>
          <span>📊 Level {badge.currentLevel}</span>
          <span>⚡ Avg {Math.round(badge.averageScore ?? 0)}%</span>
          <span>🗂 {badge.sessionsCompleted} session{badge.sessionsCompleted !== 1 ? 's' : ''}</span>
        </div>
      </div>
      <button
        onClick={onRetake}
        style={{
          padding: '9px 20px', borderRadius: 10,
          border: '1.5px solid #F5A623', background: '#FFF3D0',
          color: '#D4891A', fontFamily: 'Sora, sans-serif',
          fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
          whiteSpace: 'nowrap', transition: 'all 0.18s', flexShrink: 0,
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#F5A623'; e.currentTarget.style.color = '#1A1A2E'; }}
        onMouseLeave={e => { e.currentTarget.style.background = '#FFF3D0'; e.currentTarget.style.color = '#D4891A'; }}
      >
        Retake →
      </button>
    </div>
  );
};

// --- SkillSwap Home hero section, shown only for the "home" slug ---
const HomeHero = ({ navigate }) => {
  const { latestBadge } = useBadge();
  const token = localStorage.getItem('token');
  const isLoggedIn = !!token;

  const handleAssessmentClick = async () => {
    if (!isLoggedIn) {
        navigate('/login', {
            state: { from: '/assessment' }
        });
        return;
    }

    try {
        const profile = await getMyProfile();

        const isProfileComplete =
            profile?.bio?.trim() &&
            profile?.skillsProficient?.trim() &&
            profile?.skillsToLearn?.trim();

        if (!isProfileComplete) {
            toast.error(
    "Please complete your profile before starting the assessment.",
    {
        duration: 2000,
        position: "top-center",
    }
);

setTimeout(() => {
    navigate("/profile");
}, 2000);

            return;
        }

        navigate('/assessment');

    } catch (error) {
        console.error("Unable to verify profile:", error);

        // Optional: don't allow assessment if profile lookup fails
        return;
    }
};

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=Inter:wght@400;500;600&display=swap');
      `}</style>

      {/* Hero */}
      <section style={{
        maxWidth: 860, margin: '0 auto',
        padding: 'clamp(52px,9vw,100px) 24px clamp(40px,6vw,72px)',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: '#FFF3D0', border: '1px solid #F5A623',
          borderRadius: 99, padding: '6px 18px', marginBottom: 28,
        }}>
          <span style={{ fontSize: '0.88rem' }}>⚡</span>
          <span style={{
            fontFamily: 'Inter, sans-serif', fontSize: '0.8rem',
            fontWeight: 600, color: '#D4891A', letterSpacing: '0.04em',
          }}>
            AI-powered skill assessment
          </span>
        </div>

        <h1 style={{
          fontFamily: 'Sora, sans-serif', fontWeight: 800,
          fontSize: 'clamp(2rem,5.5vw,3.5rem)', color: '#1A1A2E',
          letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 22,
        }}>
          Know exactly where<br />
          <span style={{
            background: 'linear-gradient(135deg,#F5A623 0%,#F7C45A 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            your skills stand
          </span>
        </h1>

        <p style={{
          fontFamily: 'Inter, sans-serif', fontSize: 'clamp(0.95rem,2vw,1.1rem)',
          color: '#5A5A7A', maxWidth: 520, margin: '0 auto 38px', lineHeight: 1.75,
        }}>
          Answer a personalised mix of MCQ, coding, and aptitude questions built from
          your profile. Earn a verified badge and swap skills with confidence.
        </p>

        <button
          onClick={handleAssessmentClick}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: '#F5A623', color: '#1A1A2E', border: 'none',
            borderRadius: 14,
            padding: 'clamp(13px,2vw,17px) clamp(30px,4vw,44px)',
            fontFamily: 'Sora, sans-serif', fontWeight: 700,
            fontSize: 'clamp(0.95rem,2vw,1.05rem)', cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(245,166,35,0.38)', transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 28px rgba(245,166,35,0.48)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(245,166,35,0.38)';
          }}
        >
          {isLoggedIn ? 'Take AI Assessment' : 'Sign in to get assessed'}
          <span style={{ fontSize: '1.1rem' }}>→</span>
        </button>

        {!isLoggedIn && (
          <p style={{
            marginTop: 12, fontSize: '0.8rem',
            color: '#7A7A9A', fontFamily: 'Inter, sans-serif',
          }}>
            You need to be signed in to take the assessment
          </p>
        )}
      </section>

      {/* Badge card — shows the earned badge, or a first-time prompt if the
          user is logged in but hasn't taken an assessment yet */}
      {isLoggedIn && (
        <section style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px 48px' }}>
          {latestBadge ? (
            <BadgeCard badge={latestBadge} onRetake={() => navigate('/assessment')} />
          ) : (
            <div style={{
              background: '#FFFFFF',
              borderRadius: 20,
              border: '1.5px dashed #E8E4D8',
              padding: 'clamp(18px, 3vw, 28px)',
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              flexWrap: 'wrap',
            }}>
              <div style={{
                width: 58, height: 58, borderRadius: 16,
                background: '#FFF3D0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.9rem', flexShrink: 0,
              }}>
                🎯
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: 'Sora, sans-serif', fontWeight: 700,
                  fontSize: '0.98rem', color: '#1A1A2E', marginBottom: 3,
                }}>
                  No badge yet
                </div>
                <div style={{
                  fontFamily: 'Inter, sans-serif', fontSize: '0.82rem',
                  color: '#7A7A9A',
                }}>
                  Take your first assessment to earn one.
                </div>
              </div>
              <button
                onClick={() => navigate('/assessment')}
                style={{
                  padding: '9px 20px', borderRadius: 10,
                  border: '1.5px solid #F5A623', background: '#FFF3D0',
                  color: '#D4891A', fontFamily: 'Sora, sans-serif',
                  fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                  whiteSpace: 'nowrap', transition: 'all 0.18s', flexShrink: 0,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F5A623'; e.currentTarget.style.color = '#1A1A2E'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#FFF3D0'; e.currentTarget.style.color = '#D4891A'; }}
              >
                Take Assessment →
              </button>
            </div>
          )}
        </section>
      )}

      {/* How it works */}
      <section style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px clamp(48px,7vw,80px)' }}>
        <h2 style={{
          fontFamily: 'Sora, sans-serif', fontWeight: 800,
          fontSize: 'clamp(1.25rem,3vw,1.65rem)', color: '#1A1A2E',
          letterSpacing: '-0.02em', marginBottom: 24,
        }}>
          How it works
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))',
          gap: 16,
        }}>
          {HOW_IT_WORKS.map((step, i) => (
            <HoverCard key={i}>
              <div style={{ fontSize: '1.65rem', marginBottom: 12 }}>{step.icon}</div>
              <div style={{
                fontFamily: 'Sora, sans-serif', fontWeight: 700,
                fontSize: '0.9rem', color: '#1A1A2E', marginBottom: 7, lineHeight: 1.3,
              }}>
                {step.title}
              </div>
              <div style={{
                fontFamily: 'Inter, sans-serif', fontSize: '0.82rem',
                color: '#7A7A9A', lineHeight: 1.6,
              }}>
                {step.desc}
              </div>
            </HoverCard>
          ))}
        </div>
      </section>

      {/* Badge tiers */}
      <section style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px clamp(56px,8vw,96px)' }}>
        <h2 style={{
          fontFamily: 'Sora, sans-serif', fontWeight: 800,
          fontSize: 'clamp(1.25rem,3vw,1.65rem)', color: '#1A1A2E',
          letterSpacing: '-0.02em', marginBottom: 24,
        }}>
          Badge tiers
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {TIERS.map(({ tier, range }) => {
            const cfg = TIER_CONFIG[tier];
            return (
              <div key={tier} style={{
                display: 'flex', alignItems: 'center', gap: 16,
                background: '#FFFFFF', borderRadius: 14,
                border: '1px solid #E8E4D8', padding: '14px 20px',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, background: cfg.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.2rem', flexShrink: 0,
                }}>
                  {cfg.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: 'Sora, sans-serif', fontWeight: 700,
                    fontSize: '0.88rem', color: cfg.color,
                  }}>
                    {cfg.label}
                  </div>
                  <div style={{
                    fontFamily: 'Inter, sans-serif', fontSize: '0.78rem',
                    color: '#7A7A9A', marginTop: 2,
                  }}>
                    Average score {range}
                  </div>
                </div>
                {isLoggedIn && latestBadge?.tier === tier && (
                  <span style={{
                    fontFamily: 'Inter, sans-serif', fontSize: '0.72rem', fontWeight: 600,
                    color: cfg.color, background: cfg.bg,
                    padding: '3px 10px', borderRadius: 99, whiteSpace: 'nowrap',
                  }}>
                    Your tier
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <TestimonialMarquee />

      <BadgePopup />
    </div>
  );
};

// --- Testimonial marquee: real skill-swap pairings, auto-scrolling ---
const TESTIMONIALS = [
  { name: 'Ritika M.', pair: 'Taught UI Design → Learned Python', quote: "Traded my Figma chops for someone's backend patience. Fair swap, no money changed hands." },
  { name: 'Devon K.',  pair: 'Taught Guitar → Learned Excel',     quote: 'Never thought I\'d barter chords for pivot tables, but here we are, both better off.' },
  { name: 'Anaya S.',  pair: 'Taught French → Learned React',     quote: 'My badge jumped to Practitioner after two sessions. The test actually matched what I knew.' },
  { name: 'Marcus T.', pair: 'Taught Copywriting → Learned SQL',  quote: 'Found a data analyst who wanted better emails. We just... swapped brains for an hour a week.' },
  { name: 'Priya D.',  pair: 'Taught Yoga → Learned Video Editing', quote: 'The assessment felt personal, not generic — it knew I was self-taught and asked accordingly.' },
  { name: 'Owen R.',   pair: 'Taught Chess → Learned Photography', quote: 'Badge tiers gave me something to chase. Went Apprentice to Expert in a semester.' },
];

const initials = (name) => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

const AVATAR_PALETTE = ['#F5A623', '#4CAF82', '#2196F3', '#9C27B0', '#E85D75', '#3EA8A0'];

const TestimonialCard = ({ t, idx }) => (
  <div style={{
    flex: '0 0 auto',
    width: 300,
    background: '#FFFFFF',
    borderRadius: 18,
    border: '1px solid #E8E4D8',
    padding: '20px 22px',
    marginRight: 16,
    boxSizing: 'border-box',
  }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        background: AVATAR_PALETTE[idx % AVATAR_PALETTE.length],
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#FFFFFF', fontFamily: 'Sora, sans-serif', fontWeight: 700,
        fontSize: '0.85rem', flexShrink: 0,
      }}>
        {initials(t.name)}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          fontFamily: 'Sora, sans-serif', fontWeight: 700,
          fontSize: '0.85rem', color: '#1A1A2E',
        }}>
          {t.name}
        </div>
        <div style={{
          fontFamily: 'Inter, sans-serif', fontSize: '0.72rem',
          color: '#D4891A', lineHeight: 1.4, marginTop: 2,
        }}>
          {t.pair}
        </div>
      </div>
    </div>
    <p style={{
      fontFamily: 'Inter, sans-serif', fontSize: '0.85rem',
      color: '#5A5A7A', lineHeight: 1.6, margin: 0,
    }}>
      "{t.quote}"
    </p>
  </div>
);

const TestimonialMarquee = () => {
  // Duplicate the list so the CSS animation can loop seamlessly at -50%.
  const track = [...TESTIMONIALS, ...TESTIMONIALS];

  return (
    <section style={{ padding: 'clamp(8px,2vw,16px) 0 clamp(56px,8vw,96px)' }}>
      <style>{`
        @keyframes skillswap-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .skillswap-marquee-track {
          animation: skillswap-marquee 38s linear infinite;
        }
        .skillswap-marquee-track:hover {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .skillswap-marquee-track {
            animation: none;
            overflow-x: auto;
          }
        }
      `}</style>

      <div style={{ maxWidth: 860, margin: '0 auto 20px', padding: '0 24px' }}>
        <h2 style={{
          fontFamily: 'Sora, sans-serif', fontWeight: 800,
          fontSize: 'clamp(1.25rem,3vw,1.65rem)', color: '#1A1A2E',
          letterSpacing: '-0.02em',
        }}>
          People are swapping skills right now
        </h2>
      </div>

      <div style={{
        overflow: 'hidden',
        maskImage: 'linear-gradient(90deg, transparent, black 6%, black 94%, transparent)',
        WebkitMaskImage: 'linear-gradient(90deg, transparent, black 6%, black 94%, transparent)',
      }}>
        <div className="skillswap-marquee-track" style={{ display: 'flex', width: 'max-content', padding: '4px 24px' }}>
          {track.map((t, i) => (
            <TestimonialCard key={i} t={t} idx={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

// --- Slug nav buttons + blurred modal popup for browsing other pages ---
const SlugExplorer = () => {
  const [slugs, setSlugs] = useState([]);
  const [slugsLoading, setSlugsLoading] = useState(true);

  const [activeSlug, setActiveSlug] = useState(null); // slug currently open in modal
  const [modalData, setModalData] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    pageService
      .getAllSlugs()
      .then((data) => {
        if (isMounted) setSlugs(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Failed to load slugs:", err);
        if (isMounted) setSlugs([]);
      })
      .finally(() => {
        if (isMounted) setSlugsLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  const openSlug = (slug) => {
    setActiveSlug(slug);
    setModalData(null);
    setModalError(null);
    setModalLoading(true);

    pageService
      .getPageBySlug(slug)
      .then((data) => setModalData(data))
      .catch((err) => {
        console.error("Failed to load page:", err);
        setModalError("We couldn't load this page.");
      })
      .finally(() => setModalLoading(false));
  };

  const closeModal = () => {
    setActiveSlug(null);
    setModalData(null);
    setModalError(null);
  };

  // Close on Escape
  useEffect(() => {
    if (!activeSlug) return;
    const onKeyDown = (e) => { if (e.key === "Escape") closeModal(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeSlug]);

  const getSectionContent = (content) => {
    if (typeof content === "string") return content;
    if (content && typeof content === "object" && content.body) return content.body;
    if (content && typeof content === "object") return JSON.stringify(content, null, 2);
    return "";
  };

  if (!slugsLoading && slugs.length === 0) return null;

  return (
    <section style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px clamp(40px,6vw,64px)' }}>
      <h2 style={{
        fontFamily: 'Sora, sans-serif', fontWeight: 800,
        fontSize: 'clamp(1.1rem,2.6vw,1.4rem)', color: '#1A1A2E',
        letterSpacing: '-0.02em', marginBottom: 18,
      }}>
        Explore pages
      </h2>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {slugsLoading && (
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', color: '#7A7A9A' }}>
            Loading pages…
          </span>
        )}
        {!slugsLoading && slugs.map((p) => (
          <button
            key={p.id ?? p.slug}
            onClick={() => openSlug(p.slug)}
            style={{
              fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '0.85rem',
              color: '#1A1A2E', background: '#FFFFFF',
              border: '1.5px solid #E8E4D8', borderRadius: 99,
              padding: '9px 18px', cursor: 'pointer', transition: 'all 0.18s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#F5A623';
              e.currentTarget.style.background = '#FFF3D0';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#E8E4D8';
              e.currentTarget.style.background = '#FFFFFF';
            }}
          >
            {p.title || p.slug}
          </button>
        ))}
      </div>

      {/* Blurred backdrop + modal */}
      {activeSlug && (
        <div
          onClick={closeModal}
          style={{
            position: 'fixed', inset: 0, zIndex: 300,
            background: 'rgba(26,26,46,0.38)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFFFF', borderRadius: 20,
              boxShadow: '0 20px 60px rgba(26,26,46,0.25)',
              width: 'min(640px, 100%)', maxHeight: '80vh',
              overflowY: 'auto', padding: 'clamp(24px,4vw,36px)',
              position: 'relative',
            }}
          >
            <button
              onClick={closeModal}
              aria-label="Close"
              style={{
                position: 'absolute', top: 16, right: 16,
                width: 32, height: 32, borderRadius: 10,
                border: '1px solid #E8E4D8', background: '#FFFFFF',
                color: '#7A7A9A', fontSize: '1.1rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              ×
            </button>

            {modalLoading && (
              <div style={{ textAlign: 'center', padding: '40px 0', fontFamily: 'Inter, sans-serif', color: '#7A7A9A' }}>
                Loading…
              </div>
            )}

            {!modalLoading && modalError && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, color: '#1A1A2E' }}>
                  Content not found
                </h3>
                <p style={{ fontFamily: 'Inter, sans-serif', color: '#7A7A9A', marginTop: 8 }}>
                  {modalError}
                </p>
              </div>
            )}

            {!modalLoading && !modalError && modalData && (
              <>
                <h3 style={{
                  fontFamily: 'Sora, sans-serif', fontWeight: 800,
                  fontSize: '1.4rem', color: '#1A1A2E', marginBottom: 4, paddingRight: 32,
                }}>
                  {modalData.title}
                </h3>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', color: '#7A7A9A', marginBottom: 20 }}>
                  /{modalData.slug}
                </p>

                {modalData.sections?.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    {modalData.sections.map((section, i) => (
                      <div key={section.id || i}>
                        <h4 style={{
                          fontFamily: 'Sora, sans-serif', fontWeight: 700,
                          fontSize: '1rem', color: '#1A1A2E', marginBottom: 6,
                        }}>
                          {section.title}
                        </h4>
                        <div style={{
                          fontFamily: 'Inter, sans-serif', fontSize: '0.9rem',
                          color: '#5A5A7A', lineHeight: 1.7, whiteSpace: 'pre-wrap',
                        }}>
                          {getSectionContent(section.content)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontFamily: 'Inter, sans-serif', color: '#7A7A9A' }}>
                    This page has no content yet.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

const DynamicPage = ({ defaultSlug = "home" }) => {
  // --- 1. Dynamic Page Logic ---
  const { slug } = useParams();
  const navigate = useNavigate();
  const currentSlug = slug || defaultSlug;
  const isHome = currentSlug === "home";

  const [pageData, setPageData] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState(null);

  useEffect(() => {
    // The "home" slug has no corresponding CMS page on the backend, so skip
    // the fetch entirely and avoid the guaranteed 404 on
    // /home/public/pages/home. Every other slug behaves exactly as before.
    if (isHome) {
      setPageLoading(false);
      setPageData(null);
      setPageError(null);
      return;
    }

    let isMounted = true;
    setPageLoading(true);

    pageService
      .getPageBySlug(currentSlug)
      .then((data) => {
        if (isMounted) {
          setPageData(data);
          setPageError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("DynamicPage fetch error:", err);
          setPageError("We couldn't find this page, or it failed to load.");
          setPageData(null);
        }
      })
      .finally(() => {
        if (isMounted) setPageLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentSlug, isHome]);

  // Helper: safely extract section content as a string
  const getSectionContent = (content) => {
    if (typeof content === "string") return content;
    if (content && typeof content === "object" && content.body) {
      return content.body;
    }
    if (content && typeof content === "object") {
      return JSON.stringify(content, null, 2);
    }
    return "";
  };

  // --- 2. Browse Videos Logic ---
  const { videos, isLoading: videosLoading, error: videosError, refetch } = useVideos();

  return (
    <AppLayout>
      {/* Whale Blue & Mint Scrollbar */}
      <style>{`
        .page-scroll::-webkit-scrollbar { width: 8px; }
        .page-scroll::-webkit-scrollbar-track { background: #FFFBF0; }
        .page-scroll::-webkit-scrollbar-thumb { background: #F5A62388; border-radius: 9999px; }
        .page-scroll::-webkit-scrollbar-thumb:hover { background: #F5A623; }
        .page-scroll { scrollbar-width: thin; scrollbar-color: #F5A62388 #FFFBF0; }
        * { box-sizing: border-box; }
      `}</style>

      <Navbar />

      {!isHome && (
        <Header
          title={pageData?.title || (pageLoading ? "Loading…" : "Explore Content")}
          subtitle={pageData ? `/${pageData.slug}` : "Video Library"}
        />
      )}

      <main className="page-scroll mx-auto w-full flex-1 overflow-y-auto min-h-screen" style={{ background: '#FFFBF0' }}>
        {/* --- SKILLSWAP HOME HERO (only for the home slug) --- */}
        {isHome && (
          <div style={{ background: '#FFFBF0' }}>
            <HomeHero navigate={navigate} />
            <SlugExplorer />
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">

          {/* --- TOP: DYNAMIC CMS CONTENT --- */}
          {/* isHome is always false-guarded above (pageLoading/pageError stay
              cleared for home), so this block naturally no longer renders
              anything for the home slug. */}
          {pageLoading && (
            <GoldCard>
              <div className="text-center py-16">
                <h2 className="text-2xl font-semibold animate-pulse" style={{ color: '#D4891A', fontFamily: 'Sora, sans-serif' }}>
                  Loading page content…
                </h2>
              </div>
            </GoldCard>
          )}

          {!pageLoading && pageError && (
            <GoldCard>
              <div className="text-center py-16">
                <h2 className="text-3xl font-bold" style={{ color: '#C2453F', fontFamily: 'Sora, sans-serif' }}>Content not found</h2>
                <p className="mt-4 max-w-md mx-auto" style={{ color: '#7A7A9A' }}>{pageError}</p>
              </div>
            </GoldCard>
          )}

          {!pageLoading && !pageError && pageData && pageData.sections?.length > 0 && (
            <div className="grid gap-6 mb-12">
              {pageData.sections.map((section, index) => (
                <GoldCard key={section.id || `section-${index}`}>
                  <div className="space-y-3">
                    <h3 className="text-xl sm:text-2xl font-semibold" style={{ color: '#1A1A2E', fontFamily: 'Sora, sans-serif' }}>
                      {section.title}
                    </h3>
                    <div className="leading-7 whitespace-pre-wrap break-words" style={{ color: '#5A5A7A' }}>
                      {getSectionContent(section.content)}
                    </div>
                  </div>
                </GoldCard>
              ))}
            </div>
          )}

          {/* --- BOTTOM: VIDEO GRID INTEGRATION --- */}
          <div className="mt-4 pt-2 relative">
            <div className="mb-10 text-center sm:text-left">
              <div
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-4"
                style={{ background: '#FFF3D0', border: '1px solid #F5A623' }}
              >
                <span className="text-xs">🎬</span>
                <span
                  className="text-xs font-semibold tracking-wide uppercase"
                  style={{ color: '#D4891A', fontFamily: 'Inter, sans-serif' }}
                >
                  Video library
                </span>
              </div>
              <h2 className="text-3xl font-bold" style={{ color: '#1A1A2E', fontFamily: 'Sora, sans-serif' }}>
                Browse Videos
              </h2>
              <p className="mt-2 text-sm max-w-xl" style={{ color: '#7A7A9A' }}>
                18+ titles are visible here but require age verification to play.
              </p>
            </div>

            <div className="min-h-[400px]">
              {videosLoading && (
                <div className="flex justify-center items-center py-12">
                  <Spinner label="Loading video library..." />
                </div>
              )}

              {videosError && (
                <div className="py-6">
                  <ErrorBanner error={videosError} onRetry={refetch} />
                </div>
              )}

              {!videosLoading && !videosError && (
                <div className="animate-in fade-in duration-500">
                  <VideoGrid videos={videos} />
                </div>
              )}
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </AppLayout>
  );
};

export default DynamicPage;