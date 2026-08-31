import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Users,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  DollarSign,
  X,
  ExternalLink,
  Sparkles,
  RotateCw
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

const NotificationBell = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const {
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
  } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    if (notification.link) {
      setIsOpen(false);
      navigate(notification.link);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'SPLIT_CREATED':
        return <Users size={16} className="text-emerald-400" />;
      case 'SPLIT_SETTLED':
        return <CheckCircle2 size={16} className="text-teal-400" />;
      case 'EXPENSE_ALERT':
        return <AlertTriangle size={16} className="text-rose-400" />;
      case 'SECURITY':
        return <ShieldCheck size={16} className="text-amber-400" />;
      default:
        return <Bell size={16} className="text-emerald-400" />;
    }
  };

  const getTypeBadgeClass = (type) => {
    switch (type) {
      case 'SPLIT_CREATED':
        return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400';
      case 'SPLIT_SETTLED':
        return 'bg-teal-500/15 border-teal-500/30 text-teal-300';
      case 'EXPENSE_ALERT':
        return 'bg-rose-500/15 border-rose-500/30 text-rose-300';
      case 'SECURITY':
        return 'bg-amber-500/15 border-amber-500/30 text-amber-300';
      default:
        return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300';
    }
  };

  const formatTime = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'just now';
    }
  };

  const filterTabs = [
    { id: 'all', label: 'All' },
    { id: 'splits', label: 'Splits' },
    { id: 'alerts', label: 'Alerts' },
    { id: 'unread', label: 'Unread' },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        aria-label="Notifications"
        className={`relative p-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
          isOpen
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
            : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
        }`}
      >
        <Bell size={19} className={unreadCount > 0 ? 'text-emerald-400 animate-pulse' : ''} />
        
        {/* Unread Badge Counter */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 px-1 text-[10px] font-black text-white shadow-lg ring-2 ring-[#030F0D] dark:ring-[#030F0D]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Notification Popover Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute right-0 mt-2.5 w-[360px] sm:w-[420px] max-w-[calc(100vw-24px)] rounded-2xl glass-elevated border border-white/10 shadow-2xl overflow-hidden z-50 flex flex-col max-h-[560px]"
          >
            {/* Popover Header */}
            <div className="p-4 border-b border-white/[0.08] bg-black/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm tracking-tight text-white flex items-center gap-1.5">
                  <Sparkles size={16} className="text-emerald-400" />
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {unreadCount} new
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    title="Mark all as read"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCheck size={14} />
                    <span className="hidden sm:inline">Read all</span>
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    title="Clear all notifications"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors text-xs font-semibold cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="px-3 pt-2.5 pb-2 flex gap-1.5 border-b border-white/[0.06] bg-black/10">
              {filterTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveFilter(tab.id);
                    fetchNotifications(tab.id, true);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeFilter === tab.id
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Notification List Body */}
            <div className="flex-1 overflow-y-auto divide-y divide-white/[0.06] custom-scrollbar">
              {loading && notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <RotateCw size={22} className="animate-spin text-emerald-400 mb-2" />
                  <p className="text-xs font-medium">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                    <Bell size={22} />
                  </div>
                  <p className="text-xs font-bold text-slate-200">All caught up!</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-[240px]">
                    No notifications in this filter. You will be alerted when new splits or spending alerts occur.
                  </p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`relative group p-3.5 flex gap-3 transition-colors cursor-pointer ${
                      n.isRead
                        ? 'hover:bg-white/[0.03] opacity-85'
                        : 'bg-emerald-500/[0.06] hover:bg-emerald-500/[0.12]'
                    }`}
                    onClick={() => handleNotificationClick(n)}
                  >
                    {/* Unread Accent Dot */}
                    {!n.isRead && (
                      <span className="absolute top-4 left-2 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981]" />
                    )}

                    {/* Icon Container */}
                    <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${getTypeBadgeClass(n.type)}`}>
                      {getTypeIcon(n.type)}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-xs font-bold truncate ${n.isRead ? 'text-slate-300' : 'text-white'}`}>
                          {n.title}
                        </p>
                        <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                          {formatTime(n.createdAt)}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-300/90 leading-relaxed mt-0.5 line-clamp-2">
                        {n.message}
                      </p>

                      {n.link && (
                        <div className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-emerald-400 group-hover:text-emerald-300">
                          <span>View details</span>
                          <ExternalLink size={11} />
                        </div>
                      )}
                    </div>

                    {/* Single Delete Action Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(n.id);
                      }}
                      title="Delete notification"
                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all self-start shrink-0 cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Popover Footer */}
            {notifications.length > 0 && (
              <div className="p-2.5 bg-black/20 border-t border-white/[0.06] text-center">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/splits');
                  }}
                  className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                >
                  Manage Expense Splits & Debts →
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
