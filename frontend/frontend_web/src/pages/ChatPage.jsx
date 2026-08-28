import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { useChat } from "../context/ChatContext";
import ChatSidebar from "../components/chat/ChatSidebar";
import ChatThread from "../components/chat/ChatThread";
import Navbar from "../components/layout/Navbar";

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=Inter:wght@400;500;600&display=swap');`;

export default function ChatPage() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { chats, loading } = useChat();

  // Small history stack of chat ids actually visited in this session, so
  // "back" (from delete, leave, or the mobile back button) returns to
  // whichever chat was open before this one instead of dead-ending on the
  // bare /chats list. Not React Router's own history -- that would also pop
  // on browser back/forward navigation, which isn't what "previous chat"
  // means here.
  const historyRef = useRef([]);

  useEffect(() => {
    if (!chatId) return;
    const stack = historyRef.current;
    if (stack[stack.length - 1] !== chatId) {
      stack.push(chatId);
    }
  }, [chatId]);

  const handleSelectChat = (id) => {
    navigate(`/chats/${id}`);
  };

  // Called when the currently-open chat is gone (deleted, left, or the user
  // hit back). Pops the current entry off, then jumps to whatever chat was
  // open before it -- as long as that chat still exists in the live list.
  // Falls back to the bare list only when there's genuinely nowhere to return to.
  const goToPreviousChat = () => {
    const stack = historyRef.current;
    if (stack.length && stack[stack.length - 1] === chatId) {
      stack.pop();
    }

    while (stack.length) {
      const candidate = stack[stack.length - 1];
      if (chats.some((c) => c.id === candidate)) {
        navigate(`/chats/${candidate}`);
        return;
      }
      stack.pop(); // that one's gone too (e.g. also deleted) -- keep looking back
    }

    navigate("/chats");
  };

  return (
    <div style={{ background: '#FFFBF0', minHeight: '100vh' }}>
      <style>{FONT_IMPORT}</style>

      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div
          className="h-[calc(100vh-88px)] mt-4 flex overflow-hidden"
          style={{
            border: '1px solid #E8E4D8',
            borderRadius: 20,
            background: '#FFFFFF',
            boxShadow: '0 1px 2px rgba(26,26,46,0.04), 0 8px 24px -12px rgba(26,26,46,0.10)',
          }}
        >
          <div
            className="w-full sm:w-80 flex-shrink-0 flex flex-col"
            style={{ borderRight: '1px solid #E8E4D8' }}
          >
            <ChatSidebar
              chats={chats}
              loading={loading}
              activeChatId={chatId}
              onSelectChat={handleSelectChat}
              onChatRemoved={goToPreviousChat}
            />
          </div>

          <div className={`flex-1 flex-col min-w-0 ${chatId ? "flex" : "hidden sm:flex"}`}>
            {chatId ? (
              <ChatThread chatId={chatId} onBack={goToPreviousChat} />
            ) : (
              <EmptyState hasChats={chats.length > 0} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ hasChats }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 px-8 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-300 hover:scale-[1.03]"
        style={{ background: '#FFF3D0', color: '#D4891A', boxShadow: '0 0 0 1px #F5A62333' }}
      >
        <ChatIcon />
      </div>
      <div>
        <p style={{
          fontFamily: 'Sora, sans-serif', fontWeight: 700,
          fontSize: '0.92rem', color: '#1A1A2E',
        }}>
          {hasChats ? "Select a chat to start messaging" : "No conversations yet"}
        </p>
        <p style={{
          fontFamily: 'Inter, sans-serif', fontSize: '0.8rem',
          color: '#7A7A9A', marginTop: 4, maxWidth: 260,
        }}>
          {hasChats
            ? "Pick a conversation from the list on the left."
            : "Start a new chat from your connections using the + button."}
        </p>
      </div>
    </div>
  );
}

function ChatIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}