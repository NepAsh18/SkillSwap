import { useEffect, useState } from "react";
import { fetchMyRecentFeedback } from "../api/feedback";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

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
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-display text-lg font-semibold text-slate-800 mb-1">Your feedback</h1>
      <p className="text-sm text-slate-400 mb-6">From the last 30 days</p>

      {loading ? (
        <SkeletonList />
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : feedback.length === 0 ? (
        <p className="text-sm text-slate-400">No feedback in the last 30 days.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {feedback.map((f) => (
            <FeedbackRow key={f.feedbackId} feedback={f} />
          ))}
        </div>
      )}
    </div>
  );
}

function FeedbackRow({ feedback: f }) {
  const avatarSrc =
    f.reviewerPicture ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(f.reviewerName)}`;

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-3.5 flex gap-3">
      <img src={avatarSrc} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-slate-800">{f.reviewerName}</p>
          <StarRow stars={f.stars} />
        </div>
        <p className="text-xs text-slate-400 mt-0.5">{f.skill}</p>
        {f.comment && <p className="text-sm text-slate-600 mt-1.5">{f.comment}</p>}
        <p className="text-[11px] text-slate-300 mt-1.5">
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
          fill={n <= stars ? "#f59e0b" : "none"}
          stroke={n <= stars ? "#f59e0b" : "#cbd5e1"}
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
        <div key={i} className="h-20 rounded-xl bg-slate-50 animate-pulse" />
      ))}
    </div>
  );
}