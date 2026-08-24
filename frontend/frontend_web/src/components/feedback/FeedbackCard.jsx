import { useState } from "react";
import { submitFeedback } from "../../api/feedback";

const COMMON_SKILLS = ["Communication", "Technical knowledge", "Punctuality", "Helpfulness", "Overall session"];

export default function FeedbackCard({ targetUser, chatId, scheduledEventId, onDone, onSkip }) {
  const [skill, setSkill] = useState("");
  const [customSkill, setCustomSkill] = useState("");
  const [stars, setStars] = useState(0);
  const [hoverStar, setHoverStar] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const effectiveSkill = skill === "__custom__" ? customSkill.trim() : skill;

  const handleSubmit = async () => {
    setError(null);
    if (!effectiveSkill) {
      setError("Pick or type a skill.");
      return;
    }
    if (stars < 1) {
      setError("Select a star rating.");
      return;
    }

    setSubmitting(true);
    try {
      await submitFeedback({
        targetUserId: targetUser.userId,
        skill: effectiveSkill,
        stars,
        comment: comment.trim() || undefined,
        chatId,
        scheduledEventId,
      });
      onDone?.();
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't submit feedback — try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <div className="flex items-center gap-3">
        <img
          src={targetUser.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(targetUser.name || "?")}`}
          alt=""
          className="w-11 h-11 rounded-full object-cover"
        />
        <div>
          <p className="text-sm font-semibold text-slate-800">{targetUser.name}</p>
          <p className="text-xs text-slate-400">How was the call with them?</p>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold text-slate-500 mb-1.5">Skill</p>
        <select
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
        >
          <option value="">Select a skill…</option>
          {COMMON_SKILLS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
          <option value="__custom__">Other…</option>
        </select>
        {skill === "__custom__" && (
          <input
            value={customSkill}
            onChange={(e) => setCustomSkill(e.target.value)}
            placeholder="Type a skill"
            className="w-full mt-2 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
          />
        )}
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold text-slate-500 mb-1.5">Rating</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onMouseEnter={() => setHoverStar(n)}
              onMouseLeave={() => setHoverStar(0)}
              onClick={() => setStars(n)}
              className="p-0.5"
            >
              <StarIcon filled={n <= (hoverStar || stars)} />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Optional comment…"
          rows={2}
          className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
        />
      </div>

      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}

      <div className="flex items-center justify-end gap-2 mt-4">
        <button
          onClick={onSkip}
          className="text-sm font-medium text-slate-400 px-3.5 py-2 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Skip
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="text-sm font-semibold text-white bg-teal-500 px-4 py-2 rounded-lg hover:bg-teal-600 disabled:opacity-50 transition-colors"
        >
          {submitting ? "Submitting…" : "Submit"}
        </button>
      </div>
    </div>
  );
}

function StarIcon({ filled }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={filled ? "#f59e0b" : "none"} stroke={filled ? "#f59e0b" : "#cbd5e1"} strokeWidth="1.5">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeLinejoin="round" />
    </svg>
  );
}