import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { notifications as notificationsApi } from '../lib/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const pollingTimerRef = useRef(null);

  const fetchNotifications = useCallback(async (filter = activeFilter, showLoading = false) => {
    if (!token || !user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    if (showLoading) setLoading(true);

    try {
      const res = await notificationsApi.getAll({ filter, limit: 40 });
      if (res.success && res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('[NOTIFICATIONS FETCH ERROR]:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [token, user, activeFilter]);

  // Initial fetch and 15s polling
  useEffect(() => {
    if (!token || !user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    fetchNotifications(activeFilter, true);

    if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    pollingTimerRef.current = setInterval(() => {
      fetchNotifications(activeFilter, false);
    }, 15000);

    return () => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    };
  }, [token, user, activeFilter, fetchNotifications]);

  const markAsRead = async (id) => {
    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      const res = await notificationsApi.markAsRead(id);
      if (res.success && res.data) {
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      console.error('[MARK AS READ ERROR]:', err);
      fetchNotifications(activeFilter, false);
    }
  };

  const markAllAsRead = async () => {
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await notificationsApi.markAllAsRead();
    } catch (err) {
      console.error('[MARK ALL READ ERROR]:', err);
      fetchNotifications(activeFilter, false);
    }
  };

  const deleteNotification = async (id) => {
    // Optimistic update
    const target = notifications.find(n => n.id === id);
    if (target && !target.isRead) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setNotifications(prev => prev.filter(n => n.id !== id));

    try {
      const res = await notificationsApi.delete(id);
      if (res.success && res.data) {
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      console.error('[DELETE NOTIFICATION ERROR]:', err);
      fetchNotifications(activeFilter, false);
    }
  };

  const clearAllNotifications = async () => {
    // Optimistic update
    setNotifications([]);
    setUnreadCount(0);

    try {
      await notificationsApi.clearAll();
    } catch (err) {
      console.error('[CLEAR ALL ERROR]:', err);
      fetchNotifications(activeFilter, false);
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      activeFilter,
      setActiveFilter,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearAllNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
