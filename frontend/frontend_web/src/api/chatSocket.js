import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { getAccessToken } from "./axiosInstance";

let client = null;
let messageSubscriptions = new Map();
let chatListSubscription = null;

export function connectChatSocket({ onChatListEvent } = {}) {
  if (client && (client.connected || client.active)) return client;

  client = new Client({
    webSocketFactory: () => new SockJS(`${import.meta.env.VITE_API_BASE_URL}/ws-chat`),
    connectHeaders: {
      Authorization: `Bearer ${getAccessToken()}`,
    },
    reconnectDelay: 4000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,

    onConnect: () => {
      chatListSubscription = client.subscribe("/user/queue/chats", (frame) => {
        const payload = JSON.parse(frame.body);
        onChatListEvent?.(payload);
      });
    },

    onStompError: (frame) => {
      console.error("STOMP error:", frame.headers?.message, frame.body);
    },
  });

  client.activate();
  return client;
}

export function disconnectChatSocket() {
  chatListSubscription?.unsubscribe();
  messageSubscriptions.forEach((sub) => sub.unsubscribe());
  messageSubscriptions.clear();
  chatListSubscription = null;
  client?.deactivate();
  client = null;
}

// onMessage now fires for both new sends AND deletes (deleted messages come
// back through the same /topic/chat/{chatId} channel with deleted: true).
// Consumers should upsert-by-id rather than blindly appending.
export function subscribeToChat(chatId, { onMessage, onTyping, onSeen }) {
  if (!client || !client.connected) return () => {};

  const subs = [];

  if (onMessage) {
    subs.push(client.subscribe(`/topic/chat/${chatId}`, (frame) => {
      onMessage(JSON.parse(frame.body));
    }));
  }
  if (onTyping) {
    subs.push(client.subscribe(`/topic/chat/${chatId}/typing`, (frame) => {
      onTyping(JSON.parse(frame.body));
    }));
  }
  if (onSeen) {
    subs.push(client.subscribe(`/topic/chat/${chatId}/seen`, (frame) => {
      onSeen(JSON.parse(frame.body));
    }));
  }

  messageSubscriptions.set(chatId, subs);

  return () => {
    subs.forEach((s) => s.unsubscribe());
    messageSubscriptions.delete(chatId);
  };
}

export function sendChatMessage(chatId, dto) {
  client?.publish({ destination: `/app/chat/${chatId}/send`, body: JSON.stringify(dto) });
}

export function sendTypingEvent(chatId, typing) {
  client?.publish({ destination: `/app/chat/${chatId}/typing`, body: JSON.stringify({ typing }) });
}

export function sendSeenEvent(chatId, messageId) {
  client?.publish({ destination: `/app/chat/${chatId}/seen`, body: JSON.stringify({ messageId }) });
}

export function sendDeleteMessageEvent(chatId, messageId) {
  client?.publish({ destination: `/app/chat/${chatId}/messages/${messageId}/delete`, body: "{}" });
}

export function sendReactionEvent(chatId, messageId, emoji) {
  client?.publish({
    destination: `/app/chat/${chatId}/messages/${messageId}/react`,
    body: JSON.stringify({ emoji }),
  });
}