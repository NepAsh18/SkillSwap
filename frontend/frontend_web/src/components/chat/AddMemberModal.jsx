import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchMyConnections } from "../../api/connections";
import { useChat } from "../../context/ChatContext";

export default function AddMemberModal({ chat, onClose }) {
  const { addMember } = useChat();
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMyConnections()
      .then(setConnections)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const existingIds = new Set(chat?.participantIds || []);
  const remainingSlots = 5 - existingIds.size;

  const eligible = connections.filter((c) => c?.otherUserId && !existingIds.has(c.otherUserId));

  const handleAdd = async (userId) => {
    setError(null);
    setSubmittingId(userId);
    try {
      await addMember(chat.id, userId);
      if (remainingSlots <= 1) onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't add that person.");
      console.error(err);
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden shadow-xl"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
            <div>
              <p className="text-sm font-semibold text-slate-800">Add to "{chat?.name}"</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {remainingSlots > 0 ? `${remainingSlots} spot${remainingSlots === 1 ? "" : "s"} left` : "Group is full"}
              </p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm">
              ✕
            </button>
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 px-4 py-2 border-b border-red-100">{error}</p>
          )}

          <div className="flex-1 overflow-y-auto px-2 py-2">
            {loading ? (
              <p className="text-sm text-slate-400 text-center py-8">Loading connections…</p>
            ) : remainingSlots <= 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">
                This group is already at the 5-member cap.
              </p>
            ) : eligible.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">
                Everyone you're connected with is already in this group.
              </p>
            ) : (
              eligible.map((c) => (
                <button
                  key={c.id}
                  disabled={submittingId === c.otherUserId}
                  onClick={() => handleAdd(c.otherUserId)}
                  className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  <img
                    src={
                      c.otherUserPicture ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(c.otherUserName || "?")}`
                    }
                    alt=""
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-sm font-medium text-slate-800 truncate">{c.otherUserName}</p>
                    <p className="text-xs text-slate-400 truncate">@{c.otherUserUsername}</p>
                  </div>
                  {submittingId === c.otherUserId ? (
                    <span className="text-[11px] text-slate-400">Adding…</span>
                  ) : (
                    <span className="text-teal-500 text-lg leading-none">+</span>
                  )}
                </button>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}