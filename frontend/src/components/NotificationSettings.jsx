import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellRing,
  BellOff,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Send,
  ShieldAlert,
  Sliders,
  DollarSign,
  Receipt,
  BarChart3,
  Target,
  RefreshCw,
  Share,
  Smartphone,
  Laptop,
  ExternalLink,
  Info,
  CalendarClock,
  Clock
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { CurrencyIcon } from '../utils/currency';
import { notifications as notificationsApi } from '../lib/api';
import {
  isPushNotificationSupported,
  detectBrowserEnvironment,
  getNotificationPermission,
  getExistingPushSubscription,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications
} from '../utils/pushNotifications';

const NotificationSettings = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const userCurrency = user?.currency || localStorage.getItem('flow_currency') || 'USD ($)';

  const [supported, setSupported] = useState(true);
  const [browserEnv, setBrowserEnv] = useState({
    name: 'other',
    label: 'Browser',
    isIOS: false,
    isAndroid: false,
    isMobile: false,
    deviceType: 'desktop',
    deviceName: 'Desktop Browser',
    isStandalone: false,
    isSupported: true,
    requiresPwa: false,
    isBrave: false,
    isWebView: false
  });

  const [permission, setPermission] = useState('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [registeredDevices, setRegisteredDevices] = useState([]);

  const [preferences, setPreferences] = useState({
    budgetAlerts: true,
    expenseReminders: true,
    weeklySummary: true,
    savingsGoalUpdates: false
  });
  const [savingPrefKey, setSavingPrefKey] = useState(null);

  // Initialize push notification state, registered devices, and preferences
  useEffect(() => {
    async function init() {
      const env = await detectBrowserEnvironment();
      setBrowserEnv(env);

      const isSupp = isPushNotificationSupported();
      setSupported(isSupp || env.requiresPwa);

      const perm = getNotificationPermission();
      setPermission(perm);

      try {
        const [existingSub, prefRes] = await Promise.all([
          getExistingPushSubscription(),
          notificationsApi.getPreferences().catch(() => null)
        ]);

        setIsSubscribed(Boolean(existingSub) && perm === 'granted');

        if (prefRes?.success && prefRes.data) {
          if (prefRes.data.preferences) {
            setPreferences(prefRes.data.preferences);
          }
          if (Array.isArray(prefRes.data.devices)) {
            setRegisteredDevices(prefRes.data.devices);
          }
          if (prefRes.data.isSubscribed && perm === 'granted') {
            setIsSubscribed(true);
          }
        }
      } catch (err) {
        console.error('[NOTIFICATION SETTINGS INIT ERROR]:', err);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  const handleEnableNotifications = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setActionLoading(true);

    try {
      await subscribeToPushNotifications();
      const currentPerm = getNotificationPermission();
      setPermission(currentPerm);
      setIsSubscribed(true);

      // Refresh registered devices list
      try {
        const prefRes = await notificationsApi.getPreferences();
        if (prefRes?.success && Array.isArray(prefRes.data?.devices)) {
          setRegisteredDevices(prefRes.data.devices);
        }
      } catch {}

      const deviceLabel = browserEnv.isMobile ? 'your mobile device' : 'your computer';
      setSuccessMessage(`Push notifications enabled for ${deviceLabel}! You will now receive timely alerts on this device.`);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('[ENABLE NOTIFICATIONS ERROR]:', err);
      const perm = getNotificationPermission();
      setPermission(perm);
      if (perm === 'denied') {
        setErrorMessage('Notifications are blocked by your browser settings. Please allow notifications in your browser address bar permissions.');
      } else {
        setErrorMessage(err.message || 'Failed to enable notifications. Please check browser permissions.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setActionLoading(true);

    try {
      await unsubscribeFromPushNotifications();
      setIsSubscribed(false);

      // Refresh device list
      try {
        const prefRes = await notificationsApi.getPreferences();
        if (prefRes?.success && Array.isArray(prefRes.data?.devices)) {
          setRegisteredDevices(prefRes.data.devices);
        }
      } catch {}

      setSuccessMessage('You have unsubscribed notifications from this device.');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('[DISABLE NOTIFICATIONS ERROR]:', err);
      setErrorMessage('Failed to unsubscribe. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendTestNotification = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setTestLoading(true);

    try {
      const existingSub = await getExistingPushSubscription();
      const payload = {
        endpoint: existingSub?.endpoint || null,
        userAgent: navigator.userAgent,
        deviceType: browserEnv.deviceType,
        deviceName: browserEnv.deviceName
      };

      const res = await notificationsApi.sendTestPush(payload);
      if (res.success) {
        const targetLabel = browserEnv.isMobile ? 'mobile phone' : 'desktop browser';
        setSuccessMessage(`Test notification dispatched to your ${targetLabel} (${browserEnv.deviceName})!`);
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setErrorMessage(res.error || 'Failed to dispatch test notification.');
      }
    } catch (err) {
      console.error('[TEST NOTIFICATION ERROR]:', err);
      setErrorMessage(err.response?.data?.error || err.message || 'Failed to send test notification.');
    } finally {
      setTestLoading(false);
    }
  };

  const handleTogglePreference = async (key) => {
    const updated = {
      ...preferences,
      [key]: !preferences[key]
    };
    setPreferences(updated);
    setSavingPrefKey(key);

    try {
      await notificationsApi.updatePreferences(updated);
    } catch (err) {
      console.error('[UPDATE PREFERENCE ERROR]:', err);
      // Revert if error
      setPreferences(preferences);
      setErrorMessage('Failed to update notification preferences.');
    } finally {
      setSavingPrefKey(null);
    }
  };

  return (
    <div className="glass-card p-5 sm:p-7 w-full">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.08] dark:border-white/[0.08] border-[#CEE8E1]/60">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl border flex items-center justify-center ${
            isDark
              ? 'bg-[#095348]/50 border-[#1F7669] text-[#72C4B9] shadow-[0_0_15px_rgba(114,196,185,0.15)]'
              : 'bg-[#EAF5F2] border-[#3BAE9F]/40 text-[#147D70] shadow-sm'
          }`}>
            <Bell size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-[#07241E]'}`}>
                Notifications
              </h2>
              {/* Device Detection Badge */}
              <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border flex items-center gap-1.5 ${
                isDark ? 'bg-white/5 border-white/10 text-emerald-300' : 'bg-[#EAF5F2] border-[#CEE8E1] text-[#147D70]'
              }`}>
                {browserEnv.isMobile ? <Smartphone size={12} /> : <Laptop size={12} />}
                <span>{browserEnv.deviceName || (browserEnv.isMobile ? 'Mobile Device' : 'Desktop / Laptop')}</span>
              </span>
            </div>
            <p className={`text-xs font-medium mt-0.5 ${isDark ? 'text-[#72C4B9]/80' : 'text-[#1F7669]'}`}>
              Manage device-specific alerts, evening expense reminders, and recurring payment warnings.
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="self-start sm:self-auto">
          {!supported && !browserEnv.requiresPwa ? (
            <span className="px-3 py-1 rounded-xl text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
              Not Supported in this Browser
            </span>
          ) : permission === 'denied' ? (
            <span className="px-3 py-1 rounded-xl text-[11px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
              <ShieldAlert size={13} />
              Blocked in Browser
            </span>
          ) : isSubscribed ? (
            <span className={`px-3 py-1 rounded-xl text-[11px] font-extrabold flex items-center gap-1.5 ${
              isDark
                ? 'bg-[#1F7669]/30 text-[#72C4B9] border border-[#72C4B9]/40 shadow-[0_0_12px_rgba(114,196,185,0.2)]'
                : 'bg-[#EAF5F2] text-[#147D70] border border-[#3BAE9F]'
            }`}>
              <CheckCircle2 size={13} />
              Active on this {browserEnv.isMobile ? 'Phone' : 'Computer'}
            </span>
          ) : (
            <span className={`px-3 py-1 rounded-xl text-[11px] font-bold ${
              isDark ? 'bg-white/5 text-slate-400 border border-white/10' : 'bg-[#EAF5F2] text-[#4F736C] border border-[#CEE8E1]'
            }`}>
              Disabled on this Device
            </span>
          )}
        </div>
      </div>

      {/* Alerts / Feedback Messages */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`mt-4 p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 border ${
              isDark
                ? 'bg-[#053D35]/80 border-[#72C4B9]/40 text-[#72C4B9]'
                : 'bg-[#EAF5F2] border-[#3BAE9F] text-[#147D70]'
            }`}
          >
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{successMessage}</span>
          </motion.div>
        )}

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-4 p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2.5"
          >
            <AlertCircle size={16} className="shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Action Block */}
      <div className="py-5">
        {/* iOS Safari Home Screen Requirement */}
        {browserEnv.requiresPwa ? (
          <div className={`p-4 sm:p-5 rounded-2xl border text-xs leading-relaxed space-y-2.5 ${
            isDark
              ? 'bg-blue-950/20 border-blue-500/30 text-blue-200'
              : 'bg-blue-50/90 border-blue-300 text-blue-950 shadow-xs'
          }`}>
            <div className="flex items-center gap-2 font-bold text-sm">
              <Smartphone size={17} className="text-blue-400" />
              <span>Enable iOS Safari Notifications</span>
            </div>
            <p className="opacity-90">
              Apple requires web apps to be installed to your Home Screen before enabling push notifications on iOS:
            </p>
            <ol className="list-decimal list-inside space-y-1 font-medium opacity-95">
              <li>Tap the <strong>Share</strong> button <Share size={13} className="inline mx-1" /> at the bottom of Safari.</li>
              <li>Scroll down and select <strong>"Add to Home Screen"</strong>.</li>
              <li>Launch Cashio from your Home Screen, return to Settings, and tap <strong>Enable Notifications</strong>.</li>
            </ol>
          </div>
        ) : browserEnv.isWebView ? (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 leading-relaxed space-y-1.5">
            <p className="font-bold flex items-center gap-1.5">
              <Info size={15} />
              <span>In-App Browser Detected</span>
            </p>
            <p>
              Notifications cannot be registered inside in-app web views (Instagram / TikTok / Twitter). Please tap the menu button (•••) and choose <strong>"Open in Chrome / Safari"</strong> to enable notifications.
            </p>
          </div>
        ) : !supported ? (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 leading-relaxed">
            Web Push Notifications are not supported in your current browser window. Please use Google Chrome, Microsoft Edge, Mozilla Firefox, Brave, or Safari over HTTPS.
          </div>
        ) : permission === 'denied' ? (
          <div className="p-4 sm:p-5 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-xs leading-relaxed space-y-2">
            <div className="flex items-center gap-2 font-bold text-rose-300">
              <ShieldAlert size={16} />
              <span>Notifications are currently blocked in your browser settings.</span>
            </div>
            <p className={isDark ? 'text-slate-300' : 'text-[#3B625A]'}>
              To unblock and enable notifications in {browserEnv.label}:
            </p>
            <ol className={`list-decimal list-inside space-y-1 font-medium ${isDark ? 'text-slate-300' : 'text-[#3B625A]'}`}>
              <li>Tap the <strong>lock / site permissions icon (⚙ / 🔒)</strong> on the left of your address bar.</li>
              <li>Toggle <strong>Notifications</strong> to <strong>Allow</strong>.</li>
              <li>Refresh this page and tap <strong>Enable Notifications</strong>.</li>
            </ol>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5">
            <div>
              <p className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#07241E]'}`}>
                {isSubscribed
                  ? `Push Notifications Active on ${browserEnv.isMobile ? 'Phone' : 'Laptop/Desktop'}`
                  : `Enable Notifications on this ${browserEnv.isMobile ? 'Mobile Phone' : 'Computer'}`}
              </p>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-300' : 'text-[#4F736C]'}`}>
                Enabling notifications on this {browserEnv.isMobile ? 'phone' : 'computer'} configures push delivery for this specific device.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {isSubscribed ? (
                <>
                  <button
                    type="button"
                    disabled={testLoading}
                    onClick={handleSendTestNotification}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                      isDark
                        ? 'bg-[#095348] hover:bg-[#1F7669] text-white border border-[#1F7669]'
                        : 'bg-[#EAF5F2] hover:bg-[#DDF0EA] text-[#147D70] border border-[#3BAE9F]/40'
                    }`}
                  >
                    {testLoading ? (
                      <RefreshCw size={14} className="animate-spin text-[#72C4B9]" />
                    ) : (
                      <Send size={14} />
                    )}
                    <span>Test on this Device</span>
                  </button>

                  <div className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 border ${
                    isDark
                      ? 'bg-[#095348]/40 border-[#72C4B9]/40 text-[#72C4B9]'
                      : 'bg-[#EAF5F2] border-[#3BAE9F] text-[#147D70]'
                  }`}>
                    <CheckCircle2 size={15} />
                    <span>Enabled ✓</span>
                  </div>

                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleDisableNotifications}
                    className="p-2.5 rounded-xl font-bold text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-all cursor-pointer"
                    title="Disable notifications on this device"
                  >
                    <BellOff size={15} />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleEnableNotifications}
                  className="w-full sm:w-auto glass-btn-primary px-6 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  {actionLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <BellRing size={16} />
                      <span>Enable on this {browserEnv.isMobile ? 'Phone' : 'Computer'}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Registered Devices Overview (Deduplicated) */}
        {(() => {
          const seen = new Set();
          const uniqueDevices = registeredDevices.filter(dev => {
            const name = dev.deviceName || (dev.deviceType === 'mobile' ? 'Mobile' : 'Desktop');
            if (seen.has(name)) return false;
            seen.add(name);
            return true;
          });

          if (uniqueDevices.length === 0) return null;

          return (
            <div className="mt-4 pt-3.5 border-t border-white/[0.06] flex flex-wrap items-center gap-2">
              <span className={`text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-[#4F736C]'}`}>
                Registered devices ({uniqueDevices.length}):
              </span>
              {uniqueDevices.map((dev, idx) => (
                <span
                  key={dev.id || dev.deviceName || idx}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                    dev.deviceType === 'mobile'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : 'bg-teal-500/10 border-teal-500/20 text-teal-400'
                  }`}
                >
                  {dev.deviceType === 'mobile' ? <Smartphone size={11} /> : <Laptop size={11} />}
                  <span>{dev.deviceName || (dev.deviceType === 'mobile' ? 'Mobile' : 'Desktop')}</span>
                </span>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Category Notification Preferences */}
      <div className="pt-5 border-t border-white/[0.08] dark:border-white/[0.08] border-[#CEE8E1]/60">
        <div className="flex items-center gap-2 mb-3.5">
          <Sliders size={16} className={isDark ? 'text-[#72C4B9]' : 'text-[#147D70]'} />
          <h3 className={`text-xs font-bold uppercase tracking-wider ${
            isDark ? 'text-slate-300' : 'text-[#07241E]'
          }`}>
            Notification Preferences
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Preference 1: Budget Alerts */}
          <div
            onClick={() => handleTogglePreference('budgetAlerts')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
              preferences.budgetAlerts
                ? isDark
                  ? 'bg-[#095348]/25 border-[#1F7669]/60'
                  : 'bg-[#EAF5F2] border-[#3BAE9F]/50'
                : isDark
                  ? 'bg-black/15 border-white/5 opacity-60'
                  : 'bg-white/50 border-[#CEE8E1] opacity-60'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                isDark ? 'bg-[#053D35] text-[#72C4B9]' : 'bg-[#EAF5F2] text-[#147D70]'
              }`}>
                <CurrencyIcon currency={userCurrency} size={15} />
              </div>
              <div>
                <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#07241E]'}`}>
                  Budget alerts
                </p>
                <p className={`text-[11px] leading-snug mt-0.5 ${isDark ? 'text-slate-400' : 'text-[#4F736C]'}`}>
                  Get notified when you reach 80% or exceed your monthly spending limits.
                </p>
              </div>
            </div>

            <input
              type="checkbox"
              checked={preferences.budgetAlerts}
              onChange={() => {}}
              className="mt-1 accent-emerald-500 w-4 h-4 rounded cursor-pointer"
            />
          </div>

          {/* Preference 2: Evening Expense Reminders */}
          <div
            onClick={() => handleTogglePreference('expenseReminders')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
              preferences.expenseReminders
                ? isDark
                  ? 'bg-[#095348]/25 border-[#1F7669]/60'
                  : 'bg-[#EAF5F2] border-[#3BAE9F]/50'
                : isDark
                  ? 'bg-black/15 border-white/5 opacity-60'
                  : 'bg-white/50 border-[#CEE8E1] opacity-60'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                isDark ? 'bg-[#053D35] text-[#72C4B9]' : 'bg-[#EAF5F2] text-[#147D70]'
              }`}>
                <Receipt size={15} />
              </div>
              <div>
                <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#07241E]'}`}>
                  Evening expense reminders
                </p>
                <p className={`text-[11px] leading-snug mt-0.5 ${isDark ? 'text-slate-400' : 'text-[#4F736C]'}`}>
                  Nightly reminder (8–10 PM) to log today's expenses and split receipts.
                </p>
              </div>
            </div>

            <input
              type="checkbox"
              checked={preferences.expenseReminders}
              onChange={() => {}}
              className="mt-1 accent-emerald-500 w-4 h-4 rounded cursor-pointer"
            />
          </div>

          {/* Preference 3: Recurring Expense Alerts (1 Day in Advance) */}
          <div
            onClick={() => handleTogglePreference('savingsGoalUpdates')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
              preferences.savingsGoalUpdates !== false
                ? isDark
                  ? 'bg-[#095348]/25 border-[#1F7669]/60'
                  : 'bg-[#EAF5F2] border-[#3BAE9F]/50'
                : isDark
                  ? 'bg-black/15 border-white/5 opacity-60'
                  : 'bg-white/50 border-[#CEE8E1] opacity-60'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                isDark ? 'bg-[#053D35] text-[#72C4B9]' : 'bg-[#EAF5F2] text-[#147D70]'
              }`}>
                <CalendarClock size={15} />
              </div>
              <div>
                <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#07241E]'}`}>
                  Recurring bill reminders
                </p>
                <p className={`text-[11px] leading-snug mt-0.5 ${isDark ? 'text-slate-400' : 'text-[#4F736C]'}`}>
                  Advance notice 1 day before subscriptions and recurring payments are due.
                </p>
              </div>
            </div>

            <input
              type="checkbox"
              checked={preferences.savingsGoalUpdates !== false}
              onChange={() => {}}
              className="mt-1 accent-emerald-500 w-4 h-4 rounded cursor-pointer"
            />
          </div>

          {/* Preference 4: Weekly Spending Summary */}
          <div
            onClick={() => handleTogglePreference('weeklySummary')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
              preferences.weeklySummary
                ? isDark
                  ? 'bg-[#095348]/25 border-[#1F7669]/60'
                  : 'bg-[#EAF5F2] border-[#3BAE9F]/50'
                : isDark
                  ? 'bg-black/15 border-white/5 opacity-60'
                  : 'bg-white/50 border-[#CEE8E1] opacity-60'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                isDark ? 'bg-[#053D35] text-[#72C4B9]' : 'bg-[#EAF5F2] text-[#147D70]'
              }`}>
                <BarChart3 size={15} />
              </div>
              <div>
                <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#07241E]'}`}>
                  Weekly spending summary
                </p>
                <p className={`text-[11px] leading-snug mt-0.5 ${isDark ? 'text-slate-400' : 'text-[#4F736C]'}`}>
                  Sunday digest with total money spent and weekly spending velocity.
                </p>
              </div>
            </div>

            <input
              type="checkbox"
              checked={preferences.weeklySummary}
              onChange={() => {}}
              className="mt-1 accent-emerald-500 w-4 h-4 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
