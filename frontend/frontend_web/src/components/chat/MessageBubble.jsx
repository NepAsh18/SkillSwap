import { useEffect, useRef, useState } from "react";
import { useChat } from "../../context/ChatContext";
import { resolveMediaUrl, downloadChatMedia } from "../../api/chat";

const QUICK_REACTIONS = ["❤️", "😂", "👍", "😮", "😢", "🙏"];

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MessageBubble({ message, isOwn, chatId, chat, allMessages }) {
  const { markSeen, deleteMessage, currentUserId, setReplyDraft, reactToMessage } = useChat();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const bubbleRef = useRef(null);
  const hasMarkedSeenRef = useRef(false);

  const isMedia = !message.deleted && message.type !== "TEXT";
  const alreadySeenByMe = message.seenBy && currentUserId && message.seenBy[currentUserId];

  const isGroup = chat?.type === "GROUP";
  const sender = isGroup ? chat?.participants?.[message.senderId] : null;
  const showSenderLabel = isGroup && !isOwn && !message.deleted;

  const repliedMessage = message.replyToMessageId
    ? allMessages?.find((m) => m.id === message.replyToMessageId)
    : null;

  const reactionEntries = Object.entries(message.reactions || {});
  const reactionCounts = reactionEntries.reduce((acc, [, emoji]) => {
    acc[emoji] = (acc[emoji] || 0) + 1;
    return acc;
  }, {});
  const myReaction = currentUserId ? message.reactions?.[currentUserId] : null;

  useEffect(() => {
    if (isOwn || message.deleted || alreadySeenByMe || hasMarkedSeenRef.current) return;
    const node = bubbleRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          hasMarkedSeenRef.current = true;
          markSeen(chatId, message.id);
          observer.disconnect();
        }
      },
      { threshold: 0.6 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [isOwn, message.deleted, message.id, alreadySeenByMe, chatId, markSeen]);

  const openMenu = (e) => {
    if (message.deleted) return;
    e.stopPropagation();
    setMenuOpen(true);
  };

  const handleReply = () => {
    setMenuOpen(false);
    setReplyDraft(chatId, message);
  };

  const handleDelete = () => {
    setMenuOpen(false);
    setConfirmingDelete(true);
  };

  const confirmDelete = () => {
    setConfirmingDelete(false);
    deleteMessage(chatId, message.id);
  };

  const handleReact = (emoji) => {
    setMenuOpen(false);
    reactToMessage(chatId, message.id, emoji);
  };

  const replyPreviewText = repliedMessage
    ? repliedMessage.deleted
      ? "Deleted message"
      : repliedMessage.type === "TEXT"
      ? repliedMessage.content
      : `[${(repliedMessage.type || "").toLowerCase()}]`
    : message.replyToMessageId
    ? "Original message" // referenced message isn't in the currently-loaded window
    : null;

  return (
    <div ref={bubbleRef} className={`flex ${isOwn ? "justify-end" : "justify-start"} relative gap-2`}>
      {showSenderLabel && (
        <img
          src={
            resolveMediaUrl(sender?.picture) ||
            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(sender?.name || "?")}`
          }
          alt=""
          className="w-6 h-6 rounded-full object-cover flex-shrink-0 mt-4 self-end"
        />
      )}

      <div className="flex flex-col max-w-[75%]">
        <div
          role="button"
          tabIndex={message.deleted ? -1 : 0}
          onClick={openMenu}
          onKeyDown={(e) => {
            if (!message.deleted && (e.key === "Enter" || e.key === " ")) openMenu(e);
          }}
          className={`text-left rounded-2xl px-3.5 py-2 transition-all duration-150 active:scale-[0.98] ${
            message.deleted
              ? "bg-slate-50 text-slate-400 italic border border-slate-100 rounded-br-sm cursor-default"
              : isOwn
              ? "bg-teal-500 text-white rounded-br-sm cursor-pointer shadow-sm shadow-teal-500/15"
              : "bg-slate-100 text-slate-800 rounded-bl-sm cursor-pointer"
          }`}
        >
          {showSenderLabel && (
            <p className="text-[11px] font-semibold text-teal-600 mb-0.5">{sender?.name || "Unknown"}</p>
          )}

          {replyPreviewText && !message.deleted && (
            <div
              className={`rounded-lg px-2 py-1 mb-1.5 border-l-2 ${
                isOwn ? "bg-white/15 border-white/50" : "bg-white border-teal-400"
              }`}
            >
              <p className={`text-[11px] truncate ${isOwn ? "text-teal-50/90" : "text-slate-500"}`}>
                {replyPreviewText}
              </p>
            </div>
          )}

          {message.deleted ? (
            <p className="text-sm flex items-center gap-1.5">
              <BanIcon />
              This message was deleted
            </p>
          ) : isMedia ? (
            <MediaContent message={message} />
          ) : (
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          )}

          <div className={`flex items-center gap-1 mt-1 ${isOwn ? "justify-end" : "justify-start"}`}>
            {!message.deleted && message.temporary && (
              <span title="Disappearing message">
                <ClockIcon isOwn={isOwn} />
              </span>
            )}

            <span
              className={`text-[10px] ${isOwn ? "text-teal-50/80" : "text-slate-400"} ${
                message.deleted ? "!text-slate-400" : ""
              }`}
            >
              {formatTime(message.createdAt)}
            </span>

            {isOwn && !message.deleted && message.seenBy && Object.keys(message.seenBy).length > 0 && (
              <span className="text-[10px] text-teal-50/80" title="Seen">
                ✓✓
              </span>
            )}
          </div>
        </div>

        {reactionEntries.length > 0 && (
          <div className={`flex gap-1 mt-1 flex-wrap ${isOwn ? "justify-end" : "justify-start"}`}>
            {Object.entries(reactionCounts).map(([emoji, count]) => (
              <button
                key={emoji}
                onClick={() => handleReact(emoji)}
                className={`text-xs px-1.5 py-0.5 rounded-full border flex items-center gap-1 transition-colors ${
                  myReaction === emoji
                    ? "bg-teal-50 border-teal-300"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <span>{emoji}</span>
                {count > 1 && <span className="text-slate-500">{count}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {menuOpen && (
        <MessageActionMenu
          isOwn={isOwn}
          onClose={() => setMenuOpen(false)}
          onReply={handleReply}
          onDelete={isOwn ? handleDelete : null}
          onReact={handleReact}
        />
      )}

      {confirmingDelete && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl">
            <p className="text-sm font-semibold text-slate-800">Delete this message?</p>
            <p className="text-sm text-slate-500 mt-1.5">
              This can't be undone. Others will see "This message was deleted".
            </p>
            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                onClick={() => setConfirmingDelete(false)}
                className="text-sm font-medium text-slate-500 px-3.5 py-2 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="text-sm font-semibold text-white bg-red-500 px-3.5 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MessageActionMenu({ isOwn, onClose, onReply, onDelete, onReact }) {
  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div
        className={`absolute z-40 bottom-full mb-1.5 bg-white border border-slate-100 rounded-2xl shadow-lg shadow-slate-900/[0.08] overflow-hidden ${
          isOwn ? "right-0" : "left-0"
        }`}
      >
        <div className="flex items-center gap-1 px-2 py-1.5 border-b border-slate-50">
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onReact(emoji)}
              className="text-lg w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-50 hover:scale-110 active:scale-95 transition-all duration-150"
            >
              {emoji}
            </button>
          ))}
        </div>
        <button
          onClick={onReply}
          className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
        >
          <ReplyIcon />
          Reply
        </button>
        {onDelete && (
          <button
            onClick={onDelete}
            className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2 border-t border-slate-50"
          >
            <TrashIcon />
            Delete
          </button>
        )}
      </div>
    </>
  );
}

function MediaContent({ message }) {
  const [downloading, setDownloading] = useState(false);
  const absoluteUrl = resolveMediaUrl(message.mediaUrl);

  const handleDownload = async (e) => {
    e.stopPropagation(); // only the download icon should intercept the tap
    setDownloading(true);
    try {
      await downloadChatMedia(message.mediaUrl, message.mediaFileName);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  switch (message.type) {
    case "IMAGE":
      return (
        <img
          src={absoluteUrl}
          alt={message.mediaFileName || "Image"}
          className="rounded-lg max-w-full max-h-64 object-cover"
        />
      );

    case "VIDEO":
      return <video src={absoluteUrl} controls className="rounded-lg max-w-full max-h-64" />;

    case "DOCUMENT":
    case "DOC":
      // The row itself is NOT clickable — tapping it behaves exactly like
      // tapping a text bubble (opens the Reply/React/Delete menu via the
      // parent's onClick). Only the small download icon on the right is its
      // own tap target, and it's the only thing that stops propagation.
      return (
        <div className="flex items-center gap-2 text-sm">
          <DocIcon />
          <span className="break-all flex-1">{message.mediaFileName || "Document"}</span>
          <button
            onClick={handleDownload}
            disabled={downloading}
            title="Download"
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-black/10 disabled:opacity-60"
          >
            {downloading ? <SpinnerIcon /> : <DownloadIcon />}
          </button>
        </div>
      );

    default:
      return <p className="text-sm">Unsupported message type</p>;
  }
}

function ClockIcon({ isOwn }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className={isOwn ? "text-teal-50/80" : "text-slate-400"}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BanIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
      <circle cx="12" cy="12" r="10" />
      <path d="M4.9 4.9l14.2 14.2" strokeLinecap="round" />
    </svg>
  );
}

function ReplyIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 17l-5-5 5-5M4 12h11a4 4 0 0 1 4 4v1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
      <path d="M22 12a10 10 0 0 1-10 10" strokeLinecap="round" />
    </svg>
  );
}