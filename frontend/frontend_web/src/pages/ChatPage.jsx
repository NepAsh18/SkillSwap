import { useParams, useNavigate } from "react-router-dom";
import { useChat } from "../context/ChatContext";
import ChatSidebar from "../components/chat/ChatSidebar";
import ChatThread from "../components/chat/ChatThread";

export default function ChatPage() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { chats, loading } = useChat();

  const handleSelectChat = (id) => {
    navigate(`/chats/${id}`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <div className="h-[calc(100vh-88px)] mt-4 flex border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
        <div className="w-full sm:w-80 flex-shrink-0 sm:border-r border-slate-100 flex flex-col">
          <ChatSidebar
            chats={chats}
            loading={loading}
            activeChatId={chatId}
            onSelectChat={handleSelectChat}
          />
        </div>

        <div className={`flex-1 flex-col min-w-0 ${chatId ? "flex" : "hidden sm:flex"}`}>
          {chatId ? (
            <ChatThread chatId={chatId} onBack={() => navigate("/chats")} />
          ) : (
            <EmptyState hasChats={chats.length > 0} />
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ hasChats }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400 px-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-400">
        <ChatIcon />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-600">
          {hasChats ? "Select a chat to start messaging" : "No conversations yet"}
        </p>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
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