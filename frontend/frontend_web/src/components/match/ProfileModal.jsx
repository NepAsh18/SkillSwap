import { motion, AnimatePresence } from "framer-motion";
import { useConnections } from "../../context/ConnectionsContext";
import { resolvePictureUrl } from "../../api/assertUrl";

export default function ProfileModal({ user, onClose }) {
  const {  sendRequest, cancelSentRequest, getConnectionStatus } = useConnections();
 const status = getConnectionStatus(user.userId);

  const avatarSrc =
    resolvePictureUrl(user?.picture) ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || "?")}`;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-ink/60 backdrop-blur-sm z-40 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ type: "spring", damping: 24, stiffness: 300 }}
          className="bg-surface rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 relative"
        >
          <button
            onClick={onClose}
            aria-label="Close profile"
            className="absolute top-4 right-4 text-muted hover:text-ink transition-colors text-xl leading-none"
          >
            ×
          </button>

          <div className="flex items-center gap-4">
            <img
              src={avatarSrc}
              alt=""
              className="w-16 h-16 rounded-full object-cover"
            />
            <div>
              <h2 className="font-display text-xl font-semibold text-ink">{user.name}</h2>
              <p className="text-muted text-sm">@{user.username}</p>
            </div>
            {user.topBadgeTier && (
              <span className="ml-auto text-[10px] uppercase tracking-wide font-medium text-muted bg-ink/5 px-2 py-1 rounded-full">
                {user.topBadgeTier}
              </span>
            )}
          </div>

          {user.bio && <p className="text-ink/80 text-sm mt-4 leading-relaxed">{user.bio}</p>}

          <SkillBlock label="Teaches" skills={user.skillsProficient} color="teach" />
          <SkillBlock label="Wants to learn" skills={user.skillsToLearn} color="learn" />

          {(user.linkedinLink || user.githubLink || user.portfolioLink) && (
            <div className="flex gap-3 mt-4 text-sm">
              {user.linkedinLink && (
                <a href={user.linkedinLink} target="_blank" rel="noreferrer" className="text-teach hover:underline">
                  LinkedIn
                </a>
              )}
              {user.githubLink && (
                <a href={user.githubLink} target="_blank" rel="noreferrer" className="text-teach hover:underline">
                  GitHub
                </a>
              )}
              {user.portfolioLink && (
                <a href={user.portfolioLink} target="_blank" rel="noreferrer" className="text-teach hover:underline">
                  Portfolio
                </a>
              )}
            </div>
          )}

          <div className="mt-6">
            {status === "accepted" ? (
              <div className="w-full text-center text-sm font-medium text-teach py-2.5 rounded-xl bg-teach/10">
                Connected
              </div>
            ) : status === "pending" ? (
              <button
                onClick={() => cancelSentRequest(user.userId)}
                className="w-full text-sm font-medium text-muted py-2.5 rounded-xl border border-ink/10 hover:border-ink/20 transition-colors"
              >
                Request sent — cancel
              </button>
            ) : (
              <button
                onClick={() => sendRequest(user)}
                className="w-full text-sm font-semibold text-surface py-2.5 rounded-xl bg-ink hover:bg-ink/90 transition-colors"
              >
                Connect
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function SkillBlock({ label, skills = [], color }) {
  if (!skills.length) return null;
  const dot = color === "teach" ? "bg-teach" : "bg-learn";
  return (
    <div className="mt-4">
      <p className="text-[11px] uppercase tracking-wide text-muted mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {skills.map((s) => (
          <span
            key={s}
            className="flex items-center gap-1 text-xs font-medium text-ink bg-ink/5 px-2 py-1 rounded-full"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}