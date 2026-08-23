import { useState, useRef, useCallback } from "react";
import { useChat } from "../../context/ChatContext";
import { uploadChatMedia } from "../../api/chat";
import { detectMediaType } from "./detectMediaType";

const DURATION_PRESETS = [
  { label: "5 min", minutes: 5 },
  { label: "1 hour", minutes: 60 },
  { label: "1 day", minutes: 60 * 24 },
  { label: "7 days", minutes: 60 * 24 * 7 },
];

export default function MessageComposer({ chatId }) {
  const { sendMessage, setTyping, refreshChats, replyDraft, clearReplyDraft } = useChat();
  const [text, setText] = useState("");
  const [duration, setDuration] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  const temporary = duration !== null;

  const handleChange = (e) => {
    setText(e.target.value);
    setTyping(chatId, true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setTyping(chatId, false), 2000);
  };

  const handleSend = useCallback(() => {
    if (!text.trim()) return;
    sendMessage(chatId, text.trim(), temporary, duration, replyDraft?.id || null);
    setText("");
    setTyping(chatId, false);
    clearTimeout(typingTimeoutRef.current);
    setDuration(null);
    clearReplyDraft(chatId);
  }, [chatId, text, temporary, duration, sendMessage, setTyping, replyDraft, clearReplyDraft]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePickDuration = (minutes) => {
    setDuration(minutes);
    setPickerOpen(false);
  };

  const handleClearDuration = () => {
    setDuration(null);
    setPickerOpen(false);
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again later
    if (!file) return;

    const type = detectMediaType(file);
    setUploading(true);
    try {
      await uploadChatMedia(chatId, file, type, {
        temporary,
        temporaryDurationMinutes: duration,
      });
      setDuration(null);
      refreshChats?.();
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  const activeLabel = DURATION_PRESETS.find((p) => p.minutes === duration)?.label;
  const replyPreviewText =
    replyDraft?.type === "TEXT" ? replyDraft.content : replyDraft ? `[${(replyDraft.type || "").toLowerCase()}]` : "";

  return (
    <div className="border-t border-slate-50 px-4 py-3 flex-shrink-0 relative">
      {replyDraft && (
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 mb-2">
          <div className="w-0.5 self-stretch bg-teal-400 rounded-full flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-teal-600">Replying to</p>
            <p className="text-xs text-slate-500 truncate">{replyPreviewText}</p>
          </div>
          <button
            onClick={() => clearReplyDraft(chatId)}
            className="text-slate-400 hover:text-slate-600 flex-shrink-0"
            aria-label="Cancel reply"
          >
            <CloseIcon />
          </button>
        </div>
      )}

      {pickerOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setPickerOpen(false)} />
          <div className="absolute bottom-full left-4 mb-2 w-44 bg-white border border-slate-100 rounded-xl shadow-lg z-20 overflow-hidden">
            <p className="text-[11px] font-semibold text-slate-400 px-3 pt-2.5 pb-1">
              Disappear after
            </p>
            {DURATION_PRESETS.map((p) => (
              <button
                key={p.minutes}
                onClick={() => handlePickDuration(p.minutes)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors ${
                  duration === p.minutes ? "text-teal-600 font-semibold" : "text-slate-700"
                }`}
              >
                {p.label}
              </button>
            ))}
            {temporary && (
              <button
                onClick={handleClearDuration}
                className="w-full text-left px-3 py-2 text-sm text-slate-400 hover:bg-slate-50 border-t border-slate-50 transition-colors"
              >
                Send as permanent
              </button>
            )}
          </div>
        </>
      )}

      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelected}
          accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
        />

        <button
          onClick={handleAttachClick}
          disabled={uploading}
          title="Attach a file"
          className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 disabled:opacity-40 transition-colors"
        >
          {uploading ? <SpinnerIcon /> : <AttachIcon />}
        </button>

        <button
          onClick={() => setPickerOpen((o) => !o)}
          title={temporary ? `Disappears after ${activeLabel}` : "Set disappearing timer"}
          className={`w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full transition-colors ${
            temporary ? "bg-teal-100 text-teal-600" : "text-slate-400 hover:bg-slate-50"
          }`}
        >
          <ClockIcon />
        </button>

        <textarea
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          rows={1}
          className="flex-1 resize-none rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 max-h-32"
        />

        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-40 disabled:hover:bg-teal-500 transition-colors"
        >
          <SendIcon />
        </button>
      </div>

      {temporary && (
        <p className="text-[11px] text-teal-600 mt-1 ml-20">
          This message will disappear after {activeLabel}
        </p>
      )}
    </div>
  );
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AttachIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21.44 11.05l-9.19 9.19a5 5 0 01-7.07-7.07l9.19-9.19a3.5 3.5 0 014.95 4.95l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
      <path d="M22 12a10 10 0 0 1-10 10" strokeLinecap="round" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
    </svg>
  );
}