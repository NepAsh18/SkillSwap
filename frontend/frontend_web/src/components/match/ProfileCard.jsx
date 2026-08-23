import { motion } from "framer-motion";
import { useState } from "react";
import { useConnections } from "../../context/ConnectionsContext";
import ProfileModal from "./ProfileModal";
import { resolvePictureUrl } from "../../api/assertUrl";

// user shape expected:
//{ userId, username, name, picture, bio, skillsProficient: [], skillsToLearn: [], topBadgeTier }

export default function ProfileCard({ user }) {
  const [open, setOpen] = useState(false);

  const {
    connections,
    sentRequests,
    sendRequest,
    cancelSentRequest,
  } = useConnections();

  /*
   * Connections are the source of truth for an accepted connection.
   * sentRequests is the source of truth for requests that I have sent.
   */
  const isConnected = connections.some(
    (connection) => connection?.user?.userId === user?.userId
  );

  const status = isConnected
    ? "accepted"
    : sentRequests[user?.userId] || undefined;

  /*
   * Resolve the picture exactly once.
   * If there is no valid picture, DiceBear provides the fallback.
   */
  const avatarSrc =
    resolvePictureUrl(user?.picture) ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
      user?.name || "?"
    )}`;

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.98 }}
        className="text-left w-full bg-surface rounded-2xl p-4 shadow-lg shadow-black/20 flex flex-col gap-3"
      >
        <div className="flex items-center gap-3">
          <img
            src={avatarSrc}
            alt=""
            className="w-12 h-12 rounded-full object-cover bg-ink/10"
          />

          <div className="min-w-0">
            <p className="font-display font-semibold text-ink truncate">
              {user?.name}
            </p>

            <p className="text-sm text-muted truncate">
              @{user?.username}
            </p>
          </div>

          {user?.topBadgeTier && (
            <span className="ml-auto text-[10px] uppercase tracking-wide font-medium text-muted bg-ink/5 px-2 py-1 rounded-full whitespace-nowrap">
              {user.topBadgeTier}
            </span>
          )}
        </div>

        <SkillRow
          label="Teaches"
          skills={user?.skillsProficient}
          color="teach"
        />

        <SkillRow
          label="Wants to learn"
          skills={user?.skillsToLearn}
          color="learn"
        />

        <ConnectButton
          status={status}
          onConnect={(e) => {
            e.stopPropagation();
            sendRequest(user);
          }}
          onCancel={(e) => {
            e.stopPropagation();
            cancelSentRequest(user.userId);
          }}
        />
      </motion.button>

      {open && (
        <ProfileModal
          user={user}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function SkillRow({ label, skills = [], color }) {
  if (!skills.length) return null;

  const dot = color === "teach" ? "bg-teach" : "bg-learn";

  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted mb-1">
        {label}
      </p>

      <div className="flex flex-wrap gap-1.5">
        {skills.slice(0, 4).map((s) => (
          <span
            key={s}
            className="flex items-center gap-1 text-xs font-medium text-ink bg-ink/5 px-2 py-1 rounded-full"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
            {s}
          </span>
        ))}

        {skills.length > 4 && (
          <span className="text-xs text-muted px-1 py-1">
            +{skills.length - 4}
          </span>
        )}
      </div>
    </div>
  );
}

function ConnectButton({ status, onConnect, onCancel }) {
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
        className="mt-1 w-full text-sm font-medium text-muted py-2 rounded-xl border border-ink/10 hover:border-ink/20 transition-colors relative overflow-hidden"
      >
        <motion.span
          className="absolute inset-0 bg-learn/10"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        <span className="relative">
          Request sent — cancel
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={onConnect}
      className="mt-1 w-full text-sm font-semibold text-surface py-2 rounded-xl bg-ink hover:bg-ink/90 transition-colors"
    >
      Connect
    </button>
  );
}