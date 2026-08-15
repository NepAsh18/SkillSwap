import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  sendConnectionRequest,
  acceptConnectionRequest,
  declineConnectionRequest,
  cancelConnectionRequest,
  fetchMyConnections,
  fetchSentRequests,
  fetchIncomingRequests,
  fetchNotifications,
  fetchUnreadNotificationCount,
  markNotificationRead as apiMarkNotificationRead,
  markAllNotificationsRead as apiMarkAllNotificationsRead,
} from "../api/connections";

const ConnectionsContext = createContext(null);

// Normalizes a ConnectionRequestResponse (flat: otherUserId, otherUserName,
// otherUserUsername, otherUserPicture, ...) into the nested { id, user: {...} }
// shape RequestTray / ConnectionsList / ConnectionsPage expect. Defensive
// against malformed/partial entries so a bad item can't crash the list
// render — filtered out by the caller instead.
function toNested(req) {
  if (!req || !req.otherUserId) return null;
  return {
    id: req.id,
    status: req.status,
    createdAt: req.createdAt,
    respondedAt: req.respondedAt,
    user: {
      userId: req.otherUserId,
      name: req.otherUserName,
      username: req.otherUserUsername,
      picture: req.otherUserPicture,
    },
  };
}

function toNestedList(data) {
  return (data || []).map(toNested).filter(Boolean);
}

export function ConnectionsProvider({ children }) {
  // Accepted connections — feeds ConnectionsList. Each item: { id, user: {...} }
  const [connections, setConnections] = useState([]);

  // Map of otherUserId -> 'pending' | 'accepted', for ProfileCard's status prop.
  const [sentRequests, setSentRequests] = useState({});

  // requestId -> otherUserId, kept internally so cancel/accept know which
  // real backend id to hit without re-deriving it from sentRequests.
  const [sentRequestIds, setSentRequestIds] = useState({});

  // Requests *I* received that are still pending. Each item: { id, user: {...} }
  const [incomingRequests, setIncomingRequests] = useState([]);

  // Notifications (bell icon).
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [loading, setLoading] = useState(true);

  // Tracks userIds with an in-flight send/cancel so a background refresh
  // can't clobber an optimistic update mid-flight (this was the cause of
  // the connect-button flicker: refreshSentRequests() replaces the whole
  // map from the server, and if that fetch was already in-flight when the
  // user clicked Connect, it lands afterward and wipes the optimistic
  // "pending" entry for a frame).
  const inFlightRef = useRef(new Set());

  const refreshConnections = useCallback(async () => {
    const data = await fetchMyConnections();
    setConnections(toNestedList(data));
  }, []);

  const refreshSentRequests = useCallback(async () => {
    const data = await fetchSentRequests();
    setSentRequests((prev) => {
      const statusMap = {};
      (data || []).forEach((req) => {
        if (!req?.otherUserId) return;
        statusMap[req.otherUserId] = "pending";
      });
      // Preserve any optimistic entries currently in flight so this refresh
      // can't stomp them before the real request resolves.
      inFlightRef.current.forEach((userId) => {
        if (prev[userId] && !statusMap[userId]) {
          statusMap[userId] = prev[userId];
        }
      });
      return statusMap;
    });
    setSentRequestIds((prev) => {
      const idMap = {};
      (data || []).forEach((req) => {
        if (!req?.otherUserId) return;
        idMap[req.otherUserId] = req.id;
      });
      inFlightRef.current.forEach((userId) => {
        if (prev[userId] && !idMap[userId]) {
          idMap[userId] = prev[userId];
        }
      });
      return idMap;
    });
  }, []);

  const refreshIncomingRequests = useCallback(async () => {
    const data = await fetchIncomingRequests();
    setIncomingRequests(toNestedList(data));
  }, []);

  const refreshNotifications = useCallback(async () => {
    const data = await fetchNotifications();
    setNotifications(data || []);
  }, []);

  const refreshUnreadCount = useCallback(async () => {
    const data = await fetchUnreadNotificationCount();
    setUnreadCount(data?.unread ?? 0);
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshConnections(),
      refreshSentRequests(),
      refreshIncomingRequests(),
      refreshNotifications(),
      refreshUnreadCount(),
    ]);
  }, [refreshConnections, refreshSentRequests, refreshIncomingRequests, refreshNotifications, refreshUnreadCount]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await refreshAll();
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshAll]);

  // Once connections load, mark any sent-request entries that are now
  // accepted so ProfileCard's status flips from "pending" to "accepted"
  // without needing a page reload.
  useEffect(() => {
    if (connections.length === 0) return;
    setSentRequests((prev) => {
      let changed = false;
      const next = { ...prev };
      connections.forEach((c) => {
        if (next[c.user.userId] && next[c.user.userId] !== "accepted") {
          next[c.user.userId] = "accepted";
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [connections]);

  // user is a ProfileCard-shaped object: userId, username, name, picture
  const sendRequest = useCallback(async (user) => {
    inFlightRef.current.add(user.userId);
    setSentRequests((prev) => ({ ...prev, [user.userId]: "pending" }));
    try {
      const data = await sendConnectionRequest(user);
      setSentRequestIds((prev) => ({ ...prev, [user.userId]: data.id }));
    } catch (err) {
      setSentRequests((prev) => {
        const next = { ...prev };
        delete next[user.userId];
        return next;
      });
      throw err;
    } finally {
      inFlightRef.current.delete(user.userId);
    }
  }, []);

  const cancelSentRequest = useCallback(async (otherUserId) => {
    const requestId = sentRequestIds[otherUserId];
    if (!requestId) return; // request just fired, id not back yet — nothing to cancel

    inFlightRef.current.add(otherUserId);
    const prevStatus = sentRequests;
    const prevIds = sentRequestIds;
    setSentRequests((prev) => {
      const next = { ...prev };
      delete next[otherUserId];
      return next;
    });
    setSentRequestIds((prev) => {
      const next = { ...prev };
      delete next[otherUserId];
      return next;
    });
    try {
      await cancelConnectionRequest(requestId);
    } catch (err) {
      setSentRequests(prevStatus);
      setSentRequestIds(prevIds);
      throw err;
    } finally {
      inFlightRef.current.delete(otherUserId);
    }
  }, [sentRequests, sentRequestIds]);

  const acceptIncoming = useCallback(async (requestId) => {
    const accepted = incomingRequests.find((r) => r.id === requestId);
    setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));
    try {
      await acceptConnectionRequest(requestId);
      if (accepted) {
        setConnections((prev) => [{ ...accepted, status: "ACCEPTED" }, ...prev]);
      }
    } catch (err) {
      if (accepted) setIncomingRequests((prev) => [accepted, ...prev]);
      throw err;
    }
  }, [incomingRequests]);

  const declineIncoming = useCallback(async (requestId) => {
    const prev = incomingRequests;
    setIncomingRequests((cur) => cur.filter((r) => r.id !== requestId));
    try {
      await declineConnectionRequest(requestId);
    } catch (err) {
      setIncomingRequests(prev);
      throw err;
    }
  }, [incomingRequests]);

  const markNotificationRead = useCallback(async (notificationId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    await apiMarkNotificationRead(notificationId);
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    await apiMarkAllNotificationsRead();
  }, []);

  const value = {
    connections,
    sentRequests,
    incomingRequests,
    notifications,
    unreadCount,
    loading,
    sendRequest,
    cancelSentRequest,
    acceptIncoming,
    declineIncoming,
    markNotificationRead,
    markAllNotificationsRead,
    refreshAll,
  };

  return (
    <ConnectionsContext.Provider value={value}>
      {children}
    </ConnectionsContext.Provider>
  );
}

export function useConnections() {
  const ctx = useContext(ConnectionsContext);
  if (!ctx) {
    throw new Error("useConnections must be used within a ConnectionsProvider");
  }
  return ctx;
}