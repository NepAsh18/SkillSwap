import { motion } from "framer-motion";
import { useState } from "react";
import { useConnections } from "../../context/ConnectionsContext";
import ProfileModal from "./ProfileModal";
import { SkillRow, ConnectButton, CardAvatar } from "./CardParts";
import { resolvePictureUrl } from "../../api/assertUrl";

// Expects a MatchResultDto from /discover/matches:
// { userId, username, name, picture, topBadgeTier, finalScore, breakdown,
//   adjacencyStrength, skillsProficient?, skillsToLearn?, bio? }

export default function MatchProfileCard({ user }) {
  const [open, setOpen] = useState(false);

  const {
    connections,
    sentRequests,
    sendRequest,
    cancelSentRequest,
  } = useConnections();

  /*
   * Accepted connection is determined from the actual connections list.
   * Sent requests only determine whether a request is pending.
   */
  const isConnected = connections.some(
    (connection) => connection?.user?.userId === user?.userId
  );

  const status = isConnected
    ? "accepted"
    : sentRequests[user?.userId] || undefined;

  /*
   * Resolve the backend picture URL before passing it to CardAvatar.
   */
  const avatarSrc =
    resolvePictureUrl(user?.picture) ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
      user?.name || "?"
    )}`;

  const isExactMatch = user?.adjacencyStrength >= 1.0;

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="text-left w-full bg-surface rounded-2xl p-4 shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/25 flex flex-col gap-3 transition-shadow"
      >
        <div className="flex items-center gap-3">
          <CardAvatar
            picture={avatarSrc}
            name={user?.name}
            username={user?.username}
          />

          <div className="ml-auto flex flex-col items-end gap-1">
            {user?.topBadgeTier && (
              <span className="text-[10px] uppercase tracking-wide font-medium text-muted bg-ink/5 px-2 py-1 rounded-full whitespace-nowrap">
                {user.topBadgeTier}
              </span>
            )}

            {!isExactMatch && (
              <span className="text-[10px] font-medium text-learn bg-learn/10 px-2 py-1 rounded-full whitespace-nowrap">
                Related skill
              </span>
            )}
          </div>
        </div>

        {user?.bio && (
          <p className="text-sm text-muted line-clamp-2">
            {user.bio}
          </p>
        )}

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