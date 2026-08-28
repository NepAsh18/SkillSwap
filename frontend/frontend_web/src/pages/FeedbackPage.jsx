import { useEffect, useState } from "react";
import { fetchMyRecentFeedback } from "../api/feedback";
import { resolvePictureUrl } from "../api/assertUrl";
import Navbar from "../components/layout/Navbar";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=Inter:wght@400;500;600&display=swap');`;

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMyRecentFeedback()
      .then((all) => {
        const cutoff = Date.now() - THIRTY_DAYS_MS;
        setFeedback(all.filter((f) => new Date(f.createdAt).getTime() >= cutoff));
      })
      .catch((err) => {
        console.error(err);
        setError("Couldn't load feedback right now.");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ background: '#FFFBF0', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <style>{FONT_IMPORT}</style>

      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 style={{
          fontFamily: 'Sora, sans-serif', fontWeight: 800,
          fontSize: 'clamp(1.5rem,3vw,2rem)', color: '#1A1A2E',
          letterSpacing: '-0.02em', marginBottom: 6,
        }}>
          Your feedback
        </h1>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.88rem', color: '#7A7A9A', marginBottom: 24 }}>
          From the last 30 days
        </p>

        {loading ? (
          <SkeletonList />
        ) : error ? (
          <div style={{
            background: '#FFFFFF',
            border: '1.5px dashed #E8E4D8',
            borderRadius: 14,
            padding: '20px 18px',
          }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', color: '#C2453F' }}>{error}</p>
          </div>
        ) : feedback.length === 0 ? (
          <div style={{
            background: '#FFFFFF',
            border: '1.5px dashed #E8E4D8',
            borderRadius: 14,
            padding: '24px 20px',
            textAlign: 'center',
          }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', color: '#7A7A9A' }}>
              No feedback in the last 30 days.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {feedback.map((f) => (
              <FeedbackRow key={f.feedbackId} feedback={f} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FeedbackRow({ feedback: f }) {
  const avatarSrc =
    resolvePictureUrl(f.reviewerPicture) ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(f.reviewerName)}`;

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E8E4D8',
      borderRadius: 14,
      padding: 14,
    }} className="flex gap-3">
      <img
        src={avatarSrc}
        alt=""
        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
        style={{ border: '1px solid #E8E4D8' }}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.88rem', color: '#1A1A2E' }}>
            {f.reviewerName}
          </p>
          <StarRow stars={f.stars} />
        </div>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.76rem', color: '#D4891A', marginTop: 2 }}>
          {f.skill}
        </p>
        {f.comment && (
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', color: '#5A5A7A', marginTop: 6, lineHeight: 1.5 }}>
            {f.comment}
          </p>
        )}
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', color: '#B8B4A8', marginTop: 6 }}>
          {new Date(f.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
        </p>
      </div>
    </div>
  );
}

function StarRow({ stars }) {
  return (
    <div className="flex gap-0.5 flex-shrink-0">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill={n <= stars ? "#F5A623" : "none"}
          stroke={n <= stars ? "#F5A623" : "#E8E4D8"}
          strokeWidth="1.5"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeLinejoin="round" />
        </svg>
      ))}
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="flex flex-col gap-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            height: 80, borderRadius: 14,
            background: '#FFFFFF', border: '1px solid #E8E4D8',
            animation: 'feedback-pulse 1.5s ease-in-out infinite',
            animationDelay: `${i * 0.12}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes feedback-pulse {
          0%, 100% { opacity: 0.55; }
          50%       { opacity: 1; }
        }
      `}</style>
    </div>
  );
}