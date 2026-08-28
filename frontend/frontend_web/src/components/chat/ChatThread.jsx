import { useEffect, useRef, useState } from "react";
import { useChat } from "../../context/ChatContext";
import { resolveMediaUrl } from "../../api/chat";
import MessageBubble from "./MessageBubble";
import MessageComposer from "./MessageComposer";
import AddMemberModal from "./AddMemberModal";
import FilesPanel from "./FilesPanel";
import CallBanner from "./CallBanner";
import ScheduleCallModal from "./ScheduleCallModal";
import CallModal from "./CallModal";
import PostCallFeedbackModal from "../feedback/PostCallFeedbackModal";

export default function ChatThread({ chatId, onBack }) {
  const { chats, loading: chatsLoading, messages, typingUsers, openChat, currentUserId, currentUserName, deleteChat, leaveGroup } = useChat();
  const bottomRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirming, setConfirming] = useState(null); // null | "delete" | "leave"
  const [showAddMember, setShowAddMember] = useState(false);
  const [filesOpen, setFilesOpen] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [activeCallEvent, setActiveCallEvent] = useState(null);
  const [callRefreshKey, setCallRefreshKey] = useState(0);
  const [feedbackTargets, setFeedbackTargets] = useState(null);
  const [feedbackEventId, setFeedbackEventId] = useState(null);
  const chat = chats.find((c) => c.id === chatId);

  useEffect(() => {
    // Guard against opening a chat that's already gone from our list (e.g. we
    // just deleted/left it, or it was deleted by someone else and the route
    // hasn't navigated away yet). Without this, a stale chatId in the URL
    // keeps re-hitting the backend for a chat that 404s/500s.
    if (!chatsLoading && !chats.some((c) => c.id === chatId)) {
      onBack();
      return;
    }
    openChat(chatId);
  }, [chatId, openChat, chats, chatsLoading, onBack]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const isGroup = chat?.type === "GROUP";
  const isLeader = isGroup && chat?.leaderId === currentUserId;
  const title = isGroup ? chat?.name : chat?.otherUserName;
  const avatarSrc =
    resolveMediaUrl(isGroup ? chat?.avatarUrl : chat?.otherUserPicture) ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(title || "?")}`;

  const typingNames = Object.entries(typingUsers)
    .filter(([, isTyping]) => isTyping)
    .map(([userId]) =>
      isGroup ? chat?.participants?.[userId]?.name || "Someone" : title
    );

  const handleConfirmedAction = async () => {
    try {
      if (confirming === "delete") {
        await deleteChat(chatId);
      } else if (confirming === "leave") {
        await leaveGroup(chatId);
      }
      onBack();
    } catch (err) {
      console.error(err);
    } finally {
      setConfirming(null);
    }
  };

  // Who gets a feedback card once the call ends — every other participant,
  // excluding yourself. GROUP pulls from participantIds + the participants
  // name/picture map; DIRECT falls back to the single otherUser* fields
  // since DIRECT chats don't carry a participants map at all.
  const buildFeedbackTargets = () => {
    if (isGroup) {
      return (chat?.participantIds || [])
        .filter((id) => id !== currentUserId)
        .map((id) => ({
          userId: id,
          name: chat?.participants?.[id]?.name || "Member",
          picture: chat?.participants?.[id]?.picture,
        }));
    }
    return chat?.otherUserId
      ? [{ userId: chat.otherUserId, name: chat.otherUserName, picture: chat.otherUserPicture }]
      : [];
  };

  const handleCallEnded = (endedEvent) => {
    const targets = buildFeedbackTargets();
    if (targets.length > 0) {
      setFeedbackTargets(targets);
      setFeedbackEventId(endedEvent.id);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full relative">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100/80 flex-shrink-0">
        <button onClick={onBack} className="sm:hidden text-slate-400 hover:text-slate-600 transition-colors">
          <BackIcon />
        </button>
        <img src={avatarSrc} alt="" className="w-9 h-9 rounded-full object-cover ring-1 ring-black/5" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800 truncate">{title || "Loading…"}</p>
          {typingNames.length > 0 ? (
            <p className="text-xs text-teal-600">
              {isGroup ? `${typingNames.join(", ")} typing…` : "typing…"}
            </p>
          ) : isGroup ? (
            <p className="text-xs text-slate-400">{chat?.participantIds?.length ?? 0} members</p>
          ) : null}
        </div>

        <button
          onClick={() => setFilesOpen(true)}
          className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-600 active:scale-95 transition-all duration-150"
          title="Shared files"
        >
          <FilesIcon />
        </button>

        {(!isGroup || isLeader) && (
          <button
            onClick={() => setShowScheduleModal(true)}
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-600 active:scale-95 transition-all duration-150"
            title="Schedule a call"
          >
            <CalendarIcon />
          </button>
        )}

        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-600 active:scale-95 transition-all duration-150"
            aria-label="Chat options"
          >
            <DotsIcon />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1.5 z-20 bg-white border border-slate-100 rounded-xl shadow-lg shadow-slate-900/[0.06] overflow-hidden w-48">
                {isLeader && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setShowAddMember(true);
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Add member
                  </button>
                )}
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
                  className="w-full text-left px-3.5 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors border-t border-slate-50"
                >
                  {isGroup ? "Delete chat for me" : "Delete chat"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <CallBanner
        chatId={chatId}
        currentUserId={currentUserId}
        isLeader={isLeader}
        isGroup={isGroup}
        refreshKey={callRefreshKey}
        onOpenCall={(event) => setActiveCallEvent(event)}
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2.5">
        {messages.length === 0 ? (
          <p className="text-sm text-slate-400 text-center mt-10">No messages yet — say hello 👋</p>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.senderId === currentUserId}
              chatId={chatId}
              chat={chat}
              allMessages={messages}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <MessageComposer chatId={chatId} />

      {confirming && (
        <ConfirmDialog
          title={confirming === "delete" ? "Delete this chat?" : "Leave this group?"}
          body={
            confirming === "delete"
              ? "This removes the conversation from your chat list. This can't be undone."
              : "You'll stop receiving messages from this group unless someone adds you back."
          }
          confirmLabel={confirming === "delete" ? "Delete" : "Leave"}
          onCancel={() => setConfirming(null)}
          onConfirm={handleConfirmedAction}
        />
      )}

      {showAddMember && <AddMemberModal chat={chat} onClose={() => setShowAddMember(false)} />}
      {filesOpen && <FilesPanel chatId={chatId} onClose={() => setFilesOpen(false)} />}

      {showScheduleModal && (
        <ScheduleCallModal
          chatId={chatId}
          onClose={() => setShowScheduleModal(false)}
          onScheduled={() => setCallRefreshKey((k) => k + 1)}
        />
      )}

      {activeCallEvent && (
        <CallModal
          chatId={chatId}
          event={activeCallEvent}
          currentUserName={currentUserName}
          onClose={() => setActiveCallEvent(null)}
          onCallEnded={handleCallEnded}
        />
      )}

      {feedbackTargets && (
        <PostCallFeedbackModal
          targets={feedbackTargets}
          chatId={chatId}
          scheduledEventId={feedbackEventId}
          onClose={() => {
            setFeedbackTargets(null);
            setFeedbackEventId(null);
          }}
        />
      )}
    </div>
  );
}

function ConfirmDialog({ title, body, confirmLabel, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 px-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl shadow-slate-900/10">
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="text-sm text-slate-500 mt-1.5">{body}</p>
        <div className="flex items-center justify-end gap-2 mt-5">
          <button
            onClick={onCancel}
            className="text-sm font-medium text-slate-500 px-3.5 py-2 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="text-sm font-semibold text-white bg-red-500 px-3.5 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="12" cy="19" r="1.8" />
    </svg>
  );
}

function FilesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
    </svg>
  );
}