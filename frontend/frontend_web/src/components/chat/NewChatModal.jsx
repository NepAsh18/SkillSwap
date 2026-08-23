import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchMyConnections } from "../../api/connections";
import { getOrCreateDirectChat, createGroupChat } from "../../api/chat";

export default function NewChatModal({ onClose, onOpenChat }) {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("direct"); // "direct" | "group"
  const [selectedIds, setSelectedIds] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMyConnections()
      .then(setConnections)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleSelect = (userId) => {
    setSelectedIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId].slice(0, 4)
    );
  };

  const handleDirectClick = async (userId) => {
    if (!userId) return;
    setSubmitting(true);
    try {
      const chat = await getOrCreateDirectChat(userId);
      onOpenChat(chat.id);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedIds.length === 0) return;
    setSubmitting(true);
    try {
      const chat = await createGroupChat({ name: groupName.trim(), memberIds: selectedIds });
      onOpenChat(chat.id);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
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
            <div className="flex gap-1 bg-slate-50 rounded-full p-0.5">
              <button
                onClick={() => setMode("direct")}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                  mode === "direct" ? "bg-white shadow-sm text-slate-800" : "text-slate-400"
                }`}
              >
                Direct message
              </button>
              <button
                onClick={() => setMode("group")}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                  mode === "group" ? "bg-white shadow-sm text-slate-800" : "text-slate-400"
                }`}
              >
                New group
              </button>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm">
              ✕
            </button>
          </div>

          {mode === "group" && (
            <div className="px-4 pt-3">
              <input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Group name"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
              />
              <p className="text-[11px] text-slate-400 mt-1.5">
                Pick up to 4 people ({selectedIds.length}/4 selected) — groups cap at 5 including you
              </p>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-2 py-2">
            {loading ? (
              <p className="text-sm text-slate-400 text-center py-8">Loading connections…</p>
            ) : connections.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">
                No connections yet — connect with people first.
              </p>
            ) : (
              connections
                .filter((c) => c?.otherUserId)
                .map((c) => {
                  const isSelected = selectedIds.includes(c.otherUserId);
                  return (
                    <button
                      key={c.id}
                      disabled={submitting}
                      onClick={() =>
                        mode === "direct" ? handleDirectClick(c.otherUserId) : toggleSelect(c.otherUserId)
                      }
                      className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl transition-colors ${
                        isSelected ? "bg-teal-50" : "hover:bg-slate-50"
                      }`}
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
                      {mode === "group" && (
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                            isSelected ? "bg-teal-500 border-teal-500" : "border-slate-200"
                          }`}
                        >
                          {isSelected && <span className="text-white text-[10px]">✓</span>}
                        </div>
                      )}
                    </button>
                  );
                })
            )}
          </div>

          {mode === "group" && (
            <div className="px-4 py-3 border-t border-slate-50">
              <button
                onClick={handleCreateGroup}
                disabled={!groupName.trim() || selectedIds.length === 0 || submitting}
                className="w-full text-sm font-semibold text-white bg-teal-500 py-2.5 rounded-xl hover:bg-teal-600 disabled:opacity-40 transition-colors"
              >
                Create group
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}