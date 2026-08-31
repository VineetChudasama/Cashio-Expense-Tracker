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
import { useTheme } from '../context/ThemeContext';
import { formatDistanceToNow } from 'date-fns';

const NotificationBell = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
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
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
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
        return <Users size={16} className={isDark ? 'text-emerald-400' : 'text-[#147D70]'} />;
      case 'SPLIT_SETTLED':
        return <CheckCircle2 size={16} className={isDark ? 'text-teal-400' : 'text-[#10B981]'} />;
      case 'EXPENSE_ALERT':
        return <AlertTriangle size={16} className="text-rose-500" />;
      case 'SECURITY':
        return <ShieldCheck size={16} className="text-amber-500" />;
      default:
        return <Bell size={16} className={isDark ? 'text-emerald-400' : 'text-[#147D70]'} />;
    }
  };

  const getTypeBadgeClass = (type) => {
    switch (type) {
      case 'SPLIT_CREATED':
        return isDark
          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
          : 'bg-[#E8F4F1] border-[#CDE9E3] text-[#147D70]';
      case 'SPLIT_SETTLED':
        return isDark
          ? 'bg-teal-500/15 border-teal-500/30 text-teal-300'
          : 'bg-[#E6F8F3] border-[#B9EBDC] text-[#10B981]';
      case 'EXPENSE_ALERT':
        return isDark
          ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
          : 'bg-rose-50 border-rose-200 text-rose-600';
      case 'SECURITY':
        return isDark
          ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
          : 'bg-amber-50 border-amber-200 text-amber-700';
      default:
        return isDark
          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
          : 'bg-[#E8F4F1] border-[#CDE9E3] text-[#147D70]';
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
      {/* Animated Bell Button */}
      <motion.button
        onClick={() => setIsOpen(prev => !prev)}
        aria-label="Notifications"
        initial="idle"
        whileHover="hover"
        whileTap={{ scale: 0.93 }}
        className={`group relative p-2 sm:p-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
          isOpen
            ? isDark
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
              : 'bg-[#147D70]/15 text-[#147D70] border border-[#147D70]/30 shadow-[0_0_15px_rgba(20,125,112,0.15)]'
            : isDark
              ? 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-emerald-400/20'
              : 'text-[#147D70] hover:text-[#07241E] hover:bg-[#147D70]/10 border border-transparent hover:border-[#147D70]/20'
        }`}
      >
        {/* Animated Bell Icon with realistic pendulum swinging on hover */}
        <motion.div
          className="flex items-center justify-center"
          variants={{
            idle: { rotate: 0 },
            hover: {
              rotate: [0, -22, 18, -14, 10, -5, 0],
              transition: {
                duration: 0.65,
                ease: 'easeInOut'
              }
            }
          }}
          style={{ transformOrigin: 'top center' }}
        >
          <Bell
            size={19}
            className={`transition-colors duration-200 ${
              isOpen
                ? isDark ? 'text-emerald-400' : 'text-[#147D70]'
                : unreadCount > 0
                  ? isDark ? 'text-emerald-400' : 'text-[#147D70]'
                  : isDark ? 'text-slate-300 group-hover:text-white' : 'text-[#147D70] group-hover:text-[#07241E]'
            }`}
          />
        </motion.div>
        
        {/* Unread Badge Counter with gentle pop on hover */}
        {unreadCount > 0 && (
          <motion.span
            variants={{
              idle: { scale: 1 },
              hover: { scale: [1, 1.25, 1], transition: { duration: 0.35 } }
            }}
            className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 px-1 text-[10px] font-black text-white shadow-lg ring-2 ring-[#030F0D] dark:ring-[#030F0D]"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </motion.button>

      {/* Floating Notification Popover Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={`fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-17 sm:top-full mt-0 sm:mt-2.5 w-auto sm:w-[420px] max-w-[calc(100vw-24px)] sm:max-w-none rounded-2xl border shadow-2xl overflow-hidden z-[60] flex flex-col max-h-[75vh] sm:max-h-[560px] ${
              isDark
                ? 'bg-[#051512] border-white/15 text-white shadow-black/80'
                : 'bg-white border-[#CEE8E1] text-[#07241E] shadow-2xl shadow-[#147D70]/20'
            }`}
          >
            {/* Popover Header */}
            <div className={`p-4 border-b flex items-center justify-between ${
              isDark ? 'border-white/[0.08] bg-[#020A08]' : 'border-[#E2ECE6] bg-[#F4FAF8]'
            }`}>
              <div className="flex items-center gap-2">
                <h3 className={`font-black text-sm tracking-tight flex items-center gap-1.5 ${
                  isDark ? 'text-white' : 'text-[#07241E]'
                }`}>
                  <Sparkles size={16} className={isDark ? 'text-emerald-400' : 'text-[#147D70]'} />
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                    isDark
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-[#147D70]/10 text-[#147D70] border-[#147D70]/30'
                  }`}>
                    {unreadCount} new
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    title="Mark all as read"
                    className={`p-1.5 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                      isDark
                        ? 'text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10'
                        : 'text-[#4F736C] hover:text-[#147D70] hover:bg-[#147D70]/10'
                    }`}
                  >
                    <CheckCheck size={14} />
                    <span className="hidden sm:inline">Read all</span>
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    title="Clear all notifications"
                    className={`p-1.5 rounded-lg transition-colors text-xs font-semibold cursor-pointer ${
                      isDark
                        ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'
                        : 'text-[#6A8F87] hover:text-rose-600 hover:bg-rose-50'
                    }`}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                {/* Mobile dismiss button */}
                <button
                  onClick={() => setIsOpen(false)}
                  className={`sm:hidden p-1.5 rounded-lg transition-colors text-xs font-semibold cursor-pointer ${
                    isDark ? 'text-slate-400 hover:text-white' : 'text-[#4F736C] hover:text-[#07241E]'
                  }`}
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Filter Tabs with Smooth Sliding Pill Indicator */}
            <div className={`px-3 pt-2.5 pb-2 flex gap-1.5 border-b relative ${
              isDark ? 'border-white/[0.06] bg-[#030D0B]' : 'border-[#E2ECE6] bg-[#EAF5F2]'
            }`}>
              {filterTabs.map(tab => {
                const isActive = activeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveFilter(tab.id);
                      fetchNotifications(tab.id, true);
                    }}
                    className={`relative px-3 py-1 rounded-lg text-xs font-bold transition-colors duration-200 cursor-pointer z-10 ${
                      isActive
                        ? isDark
                          ? 'text-emerald-300'
                          : 'text-white'
                        : isDark
                          ? 'text-slate-400 hover:text-slate-200'
                          : 'text-[#4F736C] hover:text-[#07241E]'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeNotificationTab"
                        className={`absolute inset-0 rounded-lg -z-10 ${
                          isDark
                            ? 'bg-emerald-500/20 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                            : 'bg-[#147D70] shadow-sm border border-[#147D70]'
                        }`}
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Notification List Body with Smooth Tab Switch Animation */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeFilter}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className={`flex-1 overflow-y-auto divide-y custom-scrollbar ${
                  isDark ? 'divide-white/[0.06] bg-[#051512]' : 'divide-[#EAF2EF] bg-white'
                }`}
              >
                {loading && notifications.length === 0 ? (
                  <div className={`flex flex-col items-center justify-center py-12 ${isDark ? 'text-slate-400' : 'text-[#4F736C]'}`}>
                    <RotateCw size={22} className={`animate-spin mb-2 ${isDark ? 'text-emerald-400' : 'text-[#147D70]'}`} />
                    <p className="text-xs font-medium">Loading notifications...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col items-center justify-center py-14 px-4 text-center"
                  >
                    <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-3 ${
                      isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-[#E8F4F1] border-[#CDE9E3] text-[#147D70]'
                    }`}>
                      <Bell size={22} />
                    </div>
                    <p className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-[#07241E]'}`}>All caught up!</p>
                    <p className={`text-[11px] mt-1 max-w-[240px] ${isDark ? 'text-slate-400' : 'text-[#5A7A73]'}`}>
                      No notifications in this filter. You will be alerted when new splits or spending alerts occur.
                    </p>
                  </motion.div>
                ) : (
                  <AnimatePresence initial={false}>
                    {notifications.map((n) => (
                      <motion.div
                        key={n.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -16, transition: { duration: 0.15 } }}
                        transition={{ duration: 0.2 }}
                        className={`relative group p-3.5 flex gap-3 transition-colors duration-150 cursor-pointer ${
                          n.isRead
                            ? isDark
                              ? 'hover:bg-white/[0.03] opacity-85'
                              : 'hover:bg-[#F6FAF8] opacity-90'
                            : isDark
                              ? 'bg-emerald-500/[0.08] hover:bg-emerald-500/[0.14]'
                              : 'bg-[#EBF7F4] hover:bg-[#E0F2EE]'
                        }`}
                        onClick={() => handleNotificationClick(n)}
                      >
                        {/* Unread Accent Dot */}
                        {!n.isRead && (
                          <span className={`absolute top-4 left-2 w-1.5 h-1.5 rounded-full ${
                            isDark ? 'bg-emerald-400 shadow-[0_0_8px_#10B981]' : 'bg-[#147D70] shadow-[0_0_6px_rgba(20,125,112,0.6)]'
                          }`} />
                        )}

                        {/* Icon Container */}
                        <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${getTypeBadgeClass(n.type)}`}>
                          {getTypeIcon(n.type)}
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-xs truncate ${
                              n.isRead
                                ? isDark ? 'font-semibold text-slate-300' : 'font-semibold text-[#3A5E56]'
                                : isDark ? 'font-bold text-white' : 'font-extrabold text-[#07241E]'
                            }`}>
                              {n.title}
                            </p>
                            <span className={`text-[10px] shrink-0 font-medium ${isDark ? 'text-slate-400' : 'text-[#6A8F87]'}`}>
                              {formatTime(n.createdAt)}
                            </span>
                          </div>

                          <p className={`text-[11px] leading-relaxed mt-0.5 line-clamp-2 ${
                            isDark ? 'text-slate-300/90' : 'text-[#2C524A]'
                          }`}>
                            {n.message}
                          </p>

                          {n.link && (
                            <div className={`mt-1.5 flex items-center gap-1 text-[10px] font-bold ${
                              isDark ? 'text-emerald-400 group-hover:text-emerald-300' : 'text-[#147D70] group-hover:text-[#0c594f]'
                            }`}>
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
                          className={`opacity-70 sm:opacity-0 group-hover:opacity-100 p-1 rounded transition-all self-start shrink-0 cursor-pointer ${
                            isDark ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10' : 'text-[#6A8F87] hover:text-rose-600 hover:bg-rose-50'
                          }`}
                        >
                          <X size={13} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Popover Footer */}
            {notifications.length > 0 && (
              <div className={`p-2.5 border-t text-center ${
                isDark ? 'bg-[#020A08] border-white/[0.08]' : 'bg-[#F4FAF8] border-[#E2ECE6]'
              }`}>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/splits');
                  }}
                  className={`text-[11px] font-bold transition-colors cursor-pointer ${
                    isDark ? 'text-emerald-400 hover:text-emerald-300' : 'text-[#147D70] hover:text-[#0c594f]'
                  }`}
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
