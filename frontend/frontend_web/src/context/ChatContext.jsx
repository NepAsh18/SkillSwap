import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import {
  fetchMyChats,
  getOrCreateDirectChat,
  createGroupChat,
  fetchChatMessages,
  markChatRead,
  deleteChat as deleteChatApi,
  leaveGroupChat as leaveGroupChatApi,
  addChatMember as addChatMemberApi,
  removeChatMember as removeChatMemberApi,
} from "../api/chat";
import { getMyProfile } from "../api/profileService"; 
import {
  connectChatSocket,
  disconnectChatSocket,
  subscribeToChat,
  sendChatMessage,
  sendTypingEvent,
  sendSeenEvent,
  sendDeleteMessageEvent,
  sendReactionEvent,
} from "../api/chatSocket";

import { fetchEventNotifications, fetchEventUnreadCount, markEventNotificationRead, markAllEventNotificationsRead } from "../api/events";

const ChatContext = createContext(null);

function makeTempId() {
  return `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ChatProvider({ children }) {
  const [currentUserId, setCurrentUserId] = useState(null);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messagesByChat, setMessagesByChat] = useState({});
  const [typingByChat, setTypingByChat] = useState({});
  const [chatNotifications, setChatNotifications] = useState([]);
  const [eventNotifications, setEventNotifications] = useState([]);
  // Reply-in-progress per chat — the message the composer is currently
  // replying to. Cleared once the reply is sent or the user cancels.
  const [replyDraftByChat, setReplyDraftByChat] = useState({});

  const unsubscribeActiveRef = useRef(() => {});
  const activeChatIdRef = useRef(null);
  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  const refreshChats = useCallback(() => {
    return fetchMyChats().then(setChats).catch(console.error);
  }, []);

  useEffect(() => {
    getMyProfile()
      .then((profile) => setCurrentUserId(profile.userId || profile.id))
      .catch((err) => {
        console.error("ChatProvider: could not resolve current user", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();

      setMessagesByChat((prev) => {
        const updated = {};
        for (const [chatId, messages] of Object.entries(prev)) {
          updated[chatId] = messages.filter(
            (msg) => !msg.expiresAt || new Date(msg.expiresAt).getTime() > now
          );
        }
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    refreshChats().finally(() => setLoading(false));
    fetchEventNotifications().then(setEventNotifications).catch(console.error);

    connectChatSocket({
      onChatListEvent: ({ event, chat }) => {
        refreshChats();

        const bodyByEvent = {
          GROUP_CREATED: `You were added to "${chat.name}"`,
          ADDED_TO_GROUP: `You were added to "${chat.name}"`,
          REMOVED_FROM_GROUP: `You were removed from "${chat.name}"`,
          CHAT_DELETED: `"${chat.name}" was deleted`,
          MEMBER_LEFT: `Someone left "${chat.name}"`,
        };

        if ((event === "REMOVED_FROM_GROUP" || event === "CHAT_DELETED") && activeChatIdRef.current === chat.id) {
          setActiveChatId(null);
          unsubscribeActiveRef.current();
        }

        setChatNotifications((prev) => [
          {
            id: `chat-${chat.id}-${event}-${Date.now()}`,
            body: bodyByEvent[event] || `Update in "${chat.name}"`,
            actorName: chat.name,
            actorPicture: chat.avatarUrl || null,
            createdAt: new Date().toISOString(),
            read: false,
            kind: "chat",
            chatId: chat.id,
          },
          ...prev,
        ]);
      },
    });

    return () => disconnectChatSocket();
  }, [currentUserId, refreshChats]);

  const openChat = useCallback(
    (chatId) => {
      if (chats.length > 0 && !chats.some((c) => c.id === chatId)) {
        return;
      }

      unsubscribeActiveRef.current();
      setActiveChatId(chatId);

      if (!messagesByChat[chatId]) {
        fetchChatMessages(chatId).then((msgs) => {
          const now = Date.now();
          const validMessages = msgs.filter(
            (msg) => !msg.expiresAt || new Date(msg.expiresAt).getTime() > now
          );
          setMessagesByChat((prev) => ({
            ...prev,
            [chatId]: validMessages,
          }));
        });
      }

      unsubscribeActiveRef.current = subscribeToChat(chatId, {
        // Fires for both new sends and deletes. Reconciles against any
        // optimistic temp message already rendered locally (matched by
        // senderId + content, since the temp id won't equal the real id).
        onMessage: (msg) => {
          setMessagesByChat((prev) => {
            const existing = prev[chatId] || [];

            const realIdIdx = existing.findIndex((m) => m.id === msg.id);
            if (realIdIdx !== -1) {
              const next = existing.map((m) => (m.id === msg.id ? msg : m));
              return { ...prev, [chatId]: next };
            }

            const pendingIdx = existing.findIndex(
              (m) =>
                m.pending &&
                m.senderId === msg.senderId &&
                m.content === msg.content &&
                m.type === msg.type
            );

            if (pendingIdx !== -1) {
              const next = [...existing];
              next[pendingIdx] = msg;
              return { ...prev, [chatId]: next };
            }

            return { ...prev, [chatId]: [...existing, msg] };
          });
          refreshChats();
        },
        onTyping: ({ userId, typing }) => {
          setTypingByChat((prev) => ({
            ...prev,
            [chatId]: { ...prev[chatId], [userId]: typing },
          }));
        },
        onSeen: (updatedMsg) => {
          setMessagesByChat((prev) => ({
            ...prev,
            [chatId]: (prev[chatId] || []).map((m) => (m.id === updatedMsg.id ? updatedMsg : m)),
          }));
        },
      });

      markChatRead(chatId).catch(console.error);
    },
    [messagesByChat, refreshChats, chats]
  );

  // Optimistic send: render a temp bubble immediately, then let the socket
  // echo reconcile it (see onMessage above). If the echo never arrives, the
  // temp bubble stays visible and marked pending rather than vanishing.
  const sendMessage = useCallback(
    (chatId, content, temporary, temporaryDurationMinutes, replyToMessageId) => {
      const tempMessage = {
        id: makeTempId(),
        chatId,
        senderId: currentUserId,
        type: "TEXT",
        content,
        temporary,
        expiresAt:
          temporary && temporaryDurationMinutes
            ? new Date(Date.now() + temporaryDurationMinutes * 60000).toISOString()
            : null,
        seenBy: {},
        deleted: false,
        replyToMessageId: replyToMessageId || null,
        reactions: {},
        createdAt: new Date().toISOString(),
        pending: true,
      };

      setMessagesByChat((prev) => ({
        ...prev,
        [chatId]: [...(prev[chatId] || []), tempMessage],
      }));

      sendChatMessage(chatId, { content, temporary, temporaryDurationMinutes, replyToMessageId });
    },
    [currentUserId]
  );

  const setReplyDraft = useCallback((chatId, message) => {
    setReplyDraftByChat((prev) => ({ ...prev, [chatId]: message }));
  }, []);

  const clearReplyDraft = useCallback((chatId) => {
    setReplyDraftByChat((prev) => {
      const { [chatId]: _drop, ...rest } = prev;
      return rest;
    });
  }, []);

  const reactToMessage = useCallback(
    (chatId, messageId, emoji) => {
      // Optimistic toggle so the tap feels instant; the socket echo
      // reconciles with the server's authoritative reactions map afterward.
      setMessagesByChat((prev) => ({
        ...prev,
        [chatId]: (prev[chatId] || []).map((m) => {
          if (m.id !== messageId) return m;
          const reactions = { ...(m.reactions || {}) };
          if (reactions[currentUserId] === emoji) {
            delete reactions[currentUserId];
          } else {
            reactions[currentUserId] = emoji;
          }
          return { ...m, reactions };
        }),
      }));
      sendReactionEvent(chatId, messageId, emoji);
    },
    [currentUserId]
  );

  const deleteMessage = useCallback((chatId, messageId) => {
    setMessagesByChat((prev) => ({
      ...prev,
      [chatId]: (prev[chatId] || []).map((m) =>
        m.id === messageId ? { ...m, deleted: true, content: null, mediaUrl: null } : m
      ),
    }));
    sendDeleteMessageEvent(chatId, messageId);
  }, []);

  const setTyping = useCallback((chatId, typing) => {
    sendTypingEvent(chatId, typing);
  }, []);

  const markSeen = useCallback((chatId, messageId) => {
    sendSeenEvent(chatId, messageId);
  }, []);

  const createGroup = useCallback(
    (dto) => {
      return createGroupChat(dto).then((chat) => {
        // Insert immediately so the caller can navigate straight to
        // /chats/{groupId} without landing on an empty list first while
        // refreshChats() is still in flight.
        setChats((prev) => [chat, ...prev.filter((c) => c.id !== chat.id)]);
        refreshChats();
        return chat;
      });
    },
    [refreshChats]
  );

  const openDirectChat = useCallback(
    (otherUserId) => {
      return getOrCreateDirectChat(otherUserId).then((chat) => {
        setChats((prev) => [chat, ...prev.filter((c) => c.id !== chat.id)]);
        refreshChats();
        openChat(chat.id);
        return chat;
      });
    },
    [refreshChats, openChat]
  );

  const deleteChat = useCallback((chatId) => {
    return deleteChatApi(chatId).then((res) => {
      setChats((prev) => prev.filter((c) => c.id !== chatId));
      setMessagesByChat((prev) => {
        const { [chatId]: _drop, ...rest } = prev;
        return rest;
      });
      if (activeChatIdRef.current === chatId) {
        unsubscribeActiveRef.current();
        setActiveChatId(null);
      }
      return res;
    });
  }, []);

  const leaveGroup = useCallback((chatId) => {
    return leaveGroupChatApi(chatId).then((res) => {
      setChats((prev) => prev.filter((c) => c.id !== chatId));
      setMessagesByChat((prev) => {
        const { [chatId]: _drop, ...rest } = prev;
        return rest;
      });
      if (activeChatIdRef.current === chatId) {
        unsubscribeActiveRef.current();
        setActiveChatId(null);
      }
      return res;
    });
  }, []);

  const addMember = useCallback((chatId, memberId) => {
    return addChatMemberApi(chatId, memberId).then((updatedChat) => {
      setChats((prev) => prev.map((c) => (c.id === chatId ? updatedChat : c)));
      return updatedChat;
    });
  }, []);

  const removeMember = useCallback((chatId, memberId) => {
    return removeChatMemberApi(chatId, memberId).then((updatedChat) => {
      setChats((prev) => prev.map((c) => (c.id === chatId ? updatedChat : c)));
      return updatedChat;
    });
  }, []);

  const markChatNotificationRead = useCallback((id) => {
    setChatNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllChatNotificationsRead = useCallback(() => {
    setChatNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const markEventNotifRead = useCallback((id) => {
    setEventNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    markEventNotificationRead(id).catch(console.error);
  }, []);

  const markAllEventNotifsRead = useCallback(() => {
    setEventNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    markAllEventNotificationsRead().catch(console.error);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        currentUserId,
        chats,
        loading,
        activeChatId,
        messages: messagesByChat[activeChatId] || [],
        typingUsers: typingByChat[activeChatId] || {},
        replyDraft: replyDraftByChat[activeChatId] || null,
        setReplyDraft,
        clearReplyDraft,
        reactToMessage,
        chatNotifications,
        eventNotifications,
        markEventNotifRead,
        markAllEventNotifsRead,
        openChat,
        openDirectChat,
        sendMessage,
        deleteMessage,
        setTyping,
        markSeen,
        createGroup,
        deleteChat,
        leaveGroup,
        addMember,
        removeMember,
        markChatNotificationRead,
        markAllChatNotificationsRead,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}