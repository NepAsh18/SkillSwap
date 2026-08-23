import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useConnections } from "../../context/ConnectionsContext";
import { useChat } from "../../context/ChatContext";

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationBell() {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useConnections();
  const {
    chatNotifications,
    markChatNotificationRead,
    markAllChatNotificationsRead,
    openChat,
  } = useChat();
  const [open, setOpen] = useState(false);

  // Merge both sources, tag each with its origin so we know which handler to call.
  const merged = useMemo(() => {
    const connectionItems = notifications.map((n) => ({ ...n, kind: "connection" }));
    const chatItems = chatNotifications.map((n) => ({ ...n, kind: "chat" }));
    return [...connectionItems, ...chatItems].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }, [notifications, chatNotifications]);

  const unreadCount = merged.filter((n) => !n.read).length;

  const handleClick = (n) => {
    if (n.kind === "chat") {
      if (!n.read) markChatNotificationRead(n.id);
      if (n.chatId) openChat(n.chatId);
    } else {
      if (!n.read) markNotificationRead(n.id);
    }
  };

  const handleMarkAllRead = () => {
    markAllNotificationsRead();
    markAllChatNotificationsRead();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-50 transition-colors"
        aria-label="Notifications"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-[10px] font-semibold text-white flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white border border-slate-100 rounded-2xl shadow-xl z-20"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
                <p className="text-sm font-bold text-slate-700">Notifications</p>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {merged.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No notifications yet</p>
              ) : (
                <div className="flex flex-col">
                  {merged.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleClick(n)}
                      className={`text-left px-4 py-3 flex gap-3 hover:bg-slate-50 transition-colors ${
                        !n.read ? "bg-blue-50/60" : ""
                      }`}
                    >
                      <img
                        src={
                          n.actorPicture ||
                          `https://api.dicebear.com/7.x/initials/svg?seed=${n.actorName}`
                        }
                        alt=""
                        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-slate-700 leading-snug">{n.body}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {n.kind === "chat" && (
                            <span className="text-[10px] font-semibold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-full">
                              Chat
                            </span>
                          )}
                          <p className="text-xs text-slate-400">{timeAgo(n.createdAt)}</p>
                        </div>
                      </div>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1.5" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-600">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}