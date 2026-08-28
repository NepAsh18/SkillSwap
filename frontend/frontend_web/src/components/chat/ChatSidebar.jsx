import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import NewChatModal from "./NewChatModal";
import { useChat } from "../../context/ChatContext";
import { resolveMediaUrl } from "../../api/chat";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function ChatSidebar({ chats, loading, activeChatId, onSelectChat, onChatRemoved }) {
  const [showNewChat, setShowNewChat] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100/80">
        <h1 className="font-display text-lg font-semibold text-slate-800">Chats</h1>
        <button
          onClick={() => setShowNewChat(true)}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-teal-500 text-white hover:bg-teal-600 hover:shadow-md hover:shadow-teal-500/20 active:scale-95 transition-all duration-150"
          aria-label="New chat"
        >
          <PlusIcon />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <SkeletonList />
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-14 px-6 text-center">
            <div className="w-11 h-11 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
              <ChatBubbleIcon />
            </div>
            <p className="text-sm text-slate-400">No chats yet — start one from your connections.</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {chats.map((chat) => (
              <ChatListItem
                key={chat.id}
                chat={chat}
                active={chat.id === activeChatId}
                onClick={() => onSelectChat(chat.id)}
                onRemoved={() => activeChatId === chat.id && onChatRemoved?.()}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} onOpenChat={onSelectChat} />}
    </>
  );
}

function ChatListItem({ chat, active, onClick, onRemoved }) {
  const { currentUserId, deleteChat, leaveGroup, messages: activeMessages } = useChat();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirming, setConfirming] = useState(null); // null | "delete" | "leave"

  const isGroup = chat.type === "GROUP";
  const title = isGroup ? chat.name : chat.otherUserName;
  const avatarSrc =
    resolveMediaUrl(isGroup ? chat.avatarUrl : chat.otherUserPicture) ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(title || "?")}`;

  // Live preview: the ChatDocument's cached lastMessagePreview goes stale once a
  // temporary message expires client-side (ChatContext's sweep removes it from
  // messagesByChat but never touches the chats list). If this chat is the open
  // one and its newest loaded message has since expired/been deleted, fall back
  // to the next most recent live message instead of the stale server string.
  const livePreview = getLivePreview(chat, activeMessages, active);

  const handleConfirmedAction = async (e) => {
    e.stopPropagation();
    try {
      if (confirming === "delete") await deleteChat(chat.id);
      else if (confirming === "leave") await leaveGroup(chat.id);
      // Instagram-style: it vanishes from the list immediately (context already
      // strips it from `chats`), and if it was the open thread, kick the
      // parent back to the empty state / off the now-dead route.
      onRemoved?.();
    } catch (err) {
      console.error(err);
    } finally {
      setConfirming(null);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, height: 0 }}
      className={`relative group border-b border-slate-50/80 transition-colors duration-150 ${active ? "bg-teal-50/70" : "hover:bg-slate-50/80"}`}
    >
      {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-[3px] rounded-r-full bg-teal-500" />}
      <button onClick={onClick} className="w-full text-left px-4 py-3 flex items-center gap-3 transition-colors">
        <div className="relative flex-shrink-0">
          <img
            src={avatarSrc}
            alt=""
            className="w-11 h-11 rounded-full object-cover ring-1 ring-black/5"
          />
          {isGroup && (
            <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-slate-700 text-white text-[9px] flex items-center justify-center font-semibold ring-2 ring-white">
              {chat.participantIds?.length ?? ""}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-slate-800 truncate">{title || "Unknown"}</p>
            {chat.lastMessageAt && (
              <span className="text-[11px] text-slate-400 flex-shrink-0">{timeAgo(chat.lastMessageAt)}</span>
            )}
          </div>
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <p className="text-xs text-slate-400 truncate italic-none">{livePreview}</p>
            {chat.unreadCount > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-teal-500 text-white text-[10px] font-semibold flex items-center justify-center flex-shrink-0 shadow-sm shadow-teal-500/30">
                {chat.unreadCount > 9 ? "9+" : chat.unreadCount}
              </span>
            )}
          </div>
        </div>
      </button>

      <div className="absolute right-2 top-1/2 -translate-y-1/2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((o) => !o);
          }}
          className={`w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:bg-white hover:text-slate-600 transition-all ${
            menuOpen ? "opacity-100 bg-white" : "opacity-0 group-hover:opacity-100"
          }`}
          aria-label="Chat options"
        >
          <DotsIcon />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-20" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }} />
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-full mt-1 z-30 bg-white border border-slate-100 rounded-xl shadow-lg overflow-hidden w-44"
            >
              {isGroup && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setConfirming("leave");
                  }}
                  className="w-full text-left px-3.5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Leave group
                </button>
              )}
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setConfirming("delete");
                }}
                className={`w-full text-left px-3.5 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors ${
                  isGroup ? "border-t border-slate-50" : ""
                }`}
              >
                {isGroup ? "Delete for me" : "Delete chat"}
              </button>
            </div>
          </>
        )}
      </div>

      {confirming && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4"
        >
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl">
            <p className="text-sm font-semibold text-slate-800">
              {confirming === "delete" ? `Delete chat with ${title}?` : `Leave "${title}"?`}
            </p>
            <p className="text-sm text-slate-500 mt-1.5">
              {confirming === "delete"
                ? "This removes the conversation from your chat list. This can't be undone."
                : "You'll stop receiving messages from this group unless someone adds you back."}
            </p>
            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirming(null);
                }}
                className="text-sm font-medium text-slate-500 px-3.5 py-2 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmedAction}
                className="text-sm font-semibold text-white bg-red-500 px-3.5 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                {confirming === "delete" ? "Delete" : "Leave"}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// Resolves the freshest accurate preview text for a chat row.
function getLivePreview(chat, activeMessages, isActiveChat) {
  if (!isActiveChat || !activeMessages || activeMessages.length === 0) {
    return chat.lastMessagePreview || "No messages yet";
  }

  // Walk backwards through the live, already-expiry-filtered message list
  // for this open chat and use the newest one that's neither deleted nor gone.
  for (let i = activeMessages.length - 1; i >= 0; i--) {
    const m = activeMessages[i];
    if (m.deleted) continue;
    if (m.type === "TEXT") return m.content || chat.lastMessagePreview || "No messages yet";
    return `[${(m.type || "").toLowerCase()}]`;
  }

  return "No messages yet";
}

function SkeletonList() {
  return (
    <div className="flex flex-col gap-1.5 p-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-16 rounded-xl bg-slate-50 animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
      ))}
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="19" r="1.6" />
    </svg>
  );
}

function ChatBubbleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}