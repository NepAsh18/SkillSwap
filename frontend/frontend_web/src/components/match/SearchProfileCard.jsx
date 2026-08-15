import { motion } from "framer-motion";
import { useState } from "react";
import { useConnections } from "../../context/ConnectionsContext";
import ProfileModal from "./ProfileModal";
import { SkillRow, ConnectButton, CardAvatar } from "./CardParts";

// Expects a raw UserSearchDocument from /discover/search or /discover/autocomplete:
// { userId, username, name, bio, skillsProficient: [], skillsToLearn: [],
//   topBadgeTier, reputationScore }
//
// No finalScore/breakdown/adjacencyStrength here — this is full-text search
// results, not ranked matching, so no "why matched" or score UI is shown.
export default function SearchProfileCard({ user }) {
  const [open, setOpen] = useState(false);
  const { sentRequests, sendRequest, cancelSentRequest } = useConnections();
  const status = sentRequests[user.userId];

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.98 }}
        className="text-left w-full bg-surface rounded-2xl p-4 shadow-lg shadow-black/20 flex flex-col gap-3"
      >
        <div className="flex items-center gap-3">
          <CardAvatar picture={user.picture} name={user.name} username={user.username} />
          {user.topBadgeTier && (
            <span className="ml-auto text-[10px] uppercase tracking-wide font-medium text-muted bg-ink/5 px-2 py-1 rounded-full whitespace-nowrap">
              {user.topBadgeTier}
            </span>
          )}
        </div>

        {user.bio && <p className="text-sm text-muted line-clamp-2">{user.bio}</p>}

        <SkillRow label="Teaches" skills={user.skillsProficient} color="teach" />
        <SkillRow label="Wants to learn" skills={user.skillsToLearn} color="learn" />

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

      {open && <ProfileModal user={user} onClose={() => setOpen(false)} />}
    </>
  );
}