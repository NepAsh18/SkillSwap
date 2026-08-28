import api from './axiosInstance';

// Resolves ANY relative URL the backend returns (chat media under /api/v1/...,
// or profile pictures under /uploads/...) into an absolute URL against the
// SAME host the rest of the API calls use — api.defaults.baseURL. Never use
// a backend-provided relative path directly in an <img src> or <a href>: it
// resolves against whatever origin the page is currently served from (e.g.
// the Vite dev server on :5173) instead of the actual API host, which
// produces a dead link / broken image with a 0-byte response.
export const resolveMediaUrl = (url) => {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url; // already absolute

  // baseURL is generally either "http://host:port" or "http://host:port/api/v1".
  // Pull out just the host+port so ANY relative path — whether it already
  // starts with /api/v1 or is a bare path like /uploads/... — lands on the
  // right origin without doubling any prefix.
  const base = (api.defaults.baseURL || "").replace(/\/$/, "");
  const originMatch = base.match(/^(https?:\/\/[^/]+)/i);
  const origin = originMatch ? originMatch[1] : base;

  return `${origin}${url}`;
};

// Endpoints match ChatController / MessageController / MediaController:
//   GET    /chats                                        -> ChatResponse[]
//   POST   /chats/direct/{otherUserId}                    -> ChatDocument
//   POST   /chats/group                                   -> ChatDocument
//   GET    /chats/{chatId}                                -> ChatDocument
//   POST   /chats/{chatId}/members/{memberId}             -> ChatDocument
//   DELETE /chats/{chatId}/members/{memberId}             -> ChatDocument
//   POST   /chats/{chatId}/leave                          -> { status }
//   DELETE /chats/{chatId}                                -> { status }
//   GET    /chats/{chatId}/messages                       -> MessageResponse[]
//   POST   /chats/{chatId}/messages                       -> MessageResponse (REST fallback send)
//   DELETE /chats/{chatId}/messages/{messageId}           -> MessageResponse (REST fallback delete)
//   PUT    /chats/{chatId}/messages/read                  -> { status }
//   PUT    /chats/{chatId}/messages/settings               -> { status }
//   GET    /chats/{chatId}/messages/media                 -> MessageResponse[] (files browser)
//   POST   /chats/{chatId}/media                          -> MessageResponse (upload)
//   GET    /chats/{chatId}/media/**                        -> file bytes (served directly as mediaUrl)
// (base path/credentials/auth headers are handled by axiosInstance)

export const fetchMyChats = async () => {
  try {
    const response = await api.get('/chats');
    return response.data;
  } catch (error) {
    console.error('Error fetching chats:', error.response?.data || error.message);
    throw error;
  }
};

export const getOrCreateDirectChat = async (otherUserId) => {
  try {
    const response = await api.post(`/chats/direct/${otherUserId}`);
    return response.data;
  } catch (error) {
    console.error('Error opening direct chat:', error.response?.data || error.message);
    throw error;
  }
};

export const createGroupChat = async ({ name, memberIds, avatarUrl }) => {
  try {
    const response = await api.post('/chats/group', { name, memberIds, avatarUrl });
    return response.data;
  } catch (error) {
    console.error('Error creating group:', error.response?.data || error.message);
    throw error;
  }
};

export const fetchChat = async (chatId) => {
  try {
    const response = await api.get(`/chats/${chatId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching chat:', error.response?.data || error.message);
    throw error;
  }
};

export const addChatMember = async (chatId, memberId) => {
  try {
    const response = await api.post(`/chats/${chatId}/members/${memberId}`);
    return response.data;
  } catch (error) {
    console.error('Error adding member:', error.response?.data || error.message);
    throw error;
  }
};

export const removeChatMember = async (chatId, memberId) => {
  try {
    const response = await api.delete(`/chats/${chatId}/members/${memberId}`);
    return response.data;
  } catch (error) {
    console.error('Error removing member:', error.response?.data || error.message);
    throw error;
  }
};

export const leaveGroupChat = async (chatId) => {
  try {
    const response = await api.post(`/chats/${chatId}/leave`);
    return response.data;
  } catch (error) {
    console.error('Error leaving group:', error.response?.data || error.message);
    throw error;
  }
};

export const deleteChat = async (chatId) => {
  try {
    const response = await api.delete(`/chats/${chatId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting chat:', error.response?.data || error.message);
    throw error;
  }
};

export const fetchChatMessages = async (chatId, page = 0, size = 30) => {
  try {
    const response = await api.get(`/chats/${chatId}/messages`, { params: { page, size } });
    return response.data;
  } catch (error) {
    console.error('Error fetching messages:', error.response?.data || error.message);
    throw error;
  }
};

// REST fallback only — primary send path is the WebSocket (see chatSocket.js).
export const sendMessageRest = async (chatId, { content, temporary, temporaryDurationMinutes, replyToMessageId }) => {
  try {
    const response = await api.post(`/chats/${chatId}/messages`, {
      content,
      temporary,
      temporaryDurationMinutes,
      replyToMessageId,
    });
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error.response?.data || error.message);
    throw error;
  }
};

// REST fallback only — primary delete path is the WebSocket (see chatSocket.js).
export const deleteMessageRest = async (chatId, messageId) => {
  try {
    const response = await api.delete(`/chats/${chatId}/messages/${messageId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting message:', error.response?.data || error.message);
    throw error;
  }
};

// REST fallback only — primary reaction path is the WebSocket (see chatSocket.js).
export const reactToMessageRest = async (chatId, messageId, emoji) => {
  try {
    const response = await api.put(`/chats/${chatId}/messages/${messageId}/react`, { emoji });
    return response.data;
  } catch (error) {
    console.error('Error reacting to message:', error.response?.data || error.message);
    throw error;
  }
};

export const markChatRead = async (chatId) => {
  try {
    const response = await api.put(`/chats/${chatId}/messages/read`);
    return response.data;
  } catch (error) {
    console.error('Error marking chat read:', error.response?.data || error.message);
    throw error;
  }
};

export const updateChatSettings = async (chatId, { temporaryDefault, temporaryDurationMinutes }) => {
  try {
    const response = await api.put(`/chats/${chatId}/messages/settings`, {
      temporaryDefault,
      temporaryDurationMinutes,
    });
    return response.data;
  } catch (error) {
    console.error('Error updating chat settings:', error.response?.data || error.message);
    throw error;
  }
};

// --- media (images/videos/docs) ---

export const uploadChatMedia = async (
  chatId,
  file,
  type,
  { temporary, temporaryDurationMinutes } = {}
) => {
  try {
    const formData = new FormData();

    formData.append("file", file);
    formData.append("type", type);

    if (temporary != null) {
      formData.append("temporary", String(temporary));
    }

    if (temporaryDurationMinutes != null) {
      formData.append(
        "temporaryDurationMinutes",
        String(temporaryDurationMinutes)
      );
    }

    const response = await api.post(
      `/chats/${chatId}/media`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error uploading media:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const fetchChatMedia = async (chatId, type, query) => {
  try {
    const response = await api.get(`/chats/${chatId}/messages/media`, {
      params: { type, q: query || undefined },
    });
    return response.data; // MessageResponse[]
  } catch (error) {
    console.error("Error fetching media:", error.response?.data || error.message);
    throw error;
  }
};

// Downloads a shared media file with its original filename. The media
// endpoint requires the same auth as everything else in this API, so a
// plain <a href="..."> won't carry credentials — this fetches the file as a
// blob through the authenticated axios instance, then triggers the browser's
// native save dialog via a throwaway object URL.
export const downloadChatMedia = async (mediaUrl, fileName) => {
  try {
    // mediaUrl comes back from the backend as "/api/v1/chats/{chatId}/media/...".
    // api.get() needs a path relative to baseURL, not an absolute URL, so this
    // reuses resolveMediaUrl's origin-detection to find where baseURL's own
    // "/api/v1" (if any) ends, then strips exactly that much off mediaUrl —
    // same rule as resolveMediaUrl, just kept relative instead of absolute so
    // it still routes through axios's configured baseURL and auth headers.
    const base = (api.defaults.baseURL || "").replace(/\/$/, "");
    const originMatch = base.match(/^(https?:\/\/[^/]+)/i);
    const origin = originMatch ? originMatch[1] : base;
    const basePathPrefix = base.slice(origin.length); // e.g. "/api/v1", or ""

    const path = basePathPrefix && mediaUrl.startsWith(basePathPrefix)
      ? mediaUrl.slice(basePathPrefix.length)
      : mediaUrl;

    const separator = path.includes("?") ? "&" : "?";
    const response = await api.get(`${path}${separator}download=true`, {
      responseType: "blob",
    });

    const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = fileName || "download";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error("Error downloading media:", error.response?.data || error.message);
    throw error;
  }
};

export const scheduleCall = async (chatId, { title, scheduledAt }) => {
  try {
    const response = await api.post(`/chats/${chatId}/events`, { title, scheduledAt });
    return response.data;
  } catch (error) {
    console.error('Error scheduling call:', error.response?.data || error.message);
    throw error;
  }
};

export const fetchScheduledEvents = async (chatId) => {
  try {
    const response = await api.get(`/chats/${chatId}/events`);
    return response.data;
  } catch (error) {
    console.error('Error fetching scheduled events:', error.response?.data || error.message);
    throw error;
  }
};

export const joinScheduledEvent = async (chatId, eventId) => {
  try {
    const response = await api.post(`/chats/${chatId}/events/${eventId}/join`);
    return response.data; // includes jitsiRoomName once STARTED
  } catch (error) {
    console.error('Error joining call:', error.response?.data || error.message);
    throw error;
  }
};

export const markEventEnded = async (chatId, eventId) => {
  try {
    const response = await api.post(`/chats/${chatId}/events/${eventId}/end`);
    return response.data;
  } catch (error) {
    console.error('Error marking call ended:', error.response?.data || error.message);
    throw error;
  }
};

export const cancelScheduledEvent = async (chatId, eventId) => {
  try {
    const response = await api.delete(`/chats/${chatId}/events/${eventId}`);
    return response.data;
  } catch (error) {
    console.error('Error canceling call:', error.response?.data || error.message);
    throw error;
  }
};