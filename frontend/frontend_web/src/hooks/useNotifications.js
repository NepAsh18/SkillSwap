import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getNotifications,
  getNotificationCount,
  markAsRead,
  markAllAsRead,
} from '../api/notificationService';

const POLL_MS = 30000;

export const useNotifications = (isCommittee = false) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [isNewNotif, setIsNewNotif]       = useState(false);
  const [loading, setLoading]             = useState(false);
  const prevUnread = useRef(0);

  const fetchCount = useCallback(async () => {
    if (!isCommittee) return;
    try {
      const data = await getNotificationCount();
      if (data.unread > prevUnread.current) setIsNewNotif(true);
      prevUnread.current = data.unread;
      setUnreadCount(data.unread);
    } catch { }
  }, [isCommittee]);

  const fetchAll = useCallback(async () => {
    if (!isCommittee) return;
    setLoading(true);
    try {
      const data = await getNotifications();
      setNotifications(data);
      setIsNewNotif(false);
    } catch { } finally {
      setLoading(false);
    }
  }, [isCommittee]);

  const handleMarkAsRead = async (id) => {
    await markAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    prevUnread.current = Math.max(0, prevUnread.current - 1);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    prevUnread.current = 0;
    setIsNewNotif(false);
  };

  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, POLL_MS);
    return () => clearInterval(id);
  }, [fetchCount]);

  return { notifications, unreadCount, isNewNotif, loading, fetchAll, handleMarkAsRead, handleMarkAllAsRead };
};