import { motion } from "framer-motion";
import { resolvePictureUrl } from "../../api/assertUrl";

// Shared visual pieces used by both MatchProfileCard and SearchProfileCard.
// Not exported as a page-level component on its own.

export function SkillRow({ label, skills = [], color }) {
  if (!skills.length) return null;
  const dot = color === "teach" ? "bg-teach" : "bg-learn";
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted mb-1">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {skills.slice(0, 4).map((s) => (
          <span
            key={s}
            className="flex items-center gap-1 text-xs font-medium text-ink bg-ink/5 px-2 py-1 rounded-full transition-colors hover:bg-ink/[0.08]"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
            {s}
          </span>
        ))}
        {skills.length > 4 && (
          <span className="text-xs text-muted px-1 py-1">+{skills.length - 4}</span>
        )}
      </div>
    </div>
  );
}

export function ConnectButton({ status, onConnect, onCancel }) {
  if (status === "accepted") {
    return (
      <div className="mt-1 w-full text-center text-sm font-medium text-teach py-2 rounded-xl bg-teach/10">
        Connected
      </div>
    );
  }
  if (status === "pending") {
    return (
      <button
        onClick={onCancel}
        className="mt-1 w-full text-sm font-medium text-muted py-2 rounded-xl border border-ink/10 hover:border-ink/20 active:scale-[0.98] transition-all relative overflow-hidden"
      >
        <motion.span
          className="absolute inset-0 bg-learn/10"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <span className="relative">Request sent — cancel</span>
      </button>
    );
  }
  return (
    <button
      onClick={onConnect}
      className="mt-1 w-full text-sm font-semibold text-surface py-2 rounded-xl bg-ink hover:bg-ink/90 active:scale-[0.98] transition-all"
    >
      Connect
    </button>
  );
}

export function CardAvatar({ picture, name, username }) {
  return (
    <div className="flex items-center gap-3">
      <img
        src={resolvePictureUrl(picture) || `https://api.dicebear.com/7.x/initials/svg?seed=${name}`}
        alt=""
        className="w-12 h-12 rounded-full object-cover bg-ink/10 ring-1 ring-ink/5"
      />
      <div className="min-w-0">
        <p className="font-display font-semibold text-ink truncate">{name}</p>
        <p className="text-sm text-muted truncate">@{username}</p>
      </div>
    </div>
  );
}