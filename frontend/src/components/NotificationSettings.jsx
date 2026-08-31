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
  ExternalLink,
  Info
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
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

  const [supported, setSupported] = useState(true);
  const [browserEnv, setBrowserEnv] = useState({
    name: 'other',
    label: 'Browser',
    isIOS: false,
    isAndroid: false,
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

  const [preferences, setPreferences] = useState({
    budgetAlerts: true,
    expenseReminders: true,
    weeklySummary: true,
    savingsGoalUpdates: false
  });
  const [savingPrefKey, setSavingPrefKey] = useState(null);

  // Initialize push notification state and preferences
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

        if (prefRes?.success && prefRes.data?.preferences) {
          setPreferences(prefRes.data.preferences);
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
      setSuccessMessage('Push notifications enabled successfully! You will now receive budget and expense alerts on your device.');
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
      setSuccessMessage('You have unsubscribed from push notifications.');
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
      const res = await notificationsApi.sendTestPush();
      if (res.success) {
        setSuccessMessage('Test notification dispatched! Look out for the notification banner on your screen or phone.');
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
    <div className={`p-5 sm:p-7 rounded-3xl border transition-all duration-300 ${
      isDark
        ? 'bg-gradient-to-b from-[#053D35]/30 to-[#02221D]/60 border-[#095348] shadow-2xl shadow-black/40'
        : 'bg-gradient-to-b from-[#FFFFFF] to-[#F7FBFA] border-[#CEE8E1] shadow-xl shadow-[#147D70]/8'
    }`}>
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
              {browserEnv.label && (
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                  isDark ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-[#EAF5F2] border-[#CEE8E1] text-[#147D70]'
                }`}>
                  {browserEnv.label}
                </span>
              )}
            </div>
            <p className={`text-xs font-medium mt-0.5 ${isDark ? 'text-[#72C4B9]/80' : 'text-[#1F7669]'}`}>
              Stay on top of your spending with helpful reminders and budget alerts.
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
              Active on this Device
            </span>
          ) : (
            <span className={`px-3 py-1 rounded-xl text-[11px] font-bold ${
              isDark ? 'bg-white/5 text-slate-400 border border-white/10' : 'bg-[#EAF5F2] text-[#4F736C] border border-[#CEE8E1]'
            }`}>
              Disabled
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
              <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#07241E]'}`}>
                {isSubscribed ? 'Browser Push Notifications Active' : 'Enable Instant Phone & Desktop Push'}
              </p>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-300' : 'text-[#4F736C]'}`}>
                Receive budget velocity alerts, weekly spending overviews, and daily expense reminders across any browser.
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
                    <span>Send Test</span>
                  </button>

                  <div className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 border ${
                    isDark
                      ? 'bg-[#095348]/40 border-[#72C4B9]/40 text-[#72C4B9]'
                      : 'bg-[#EAF5F2] border-[#3BAE9F] text-[#147D70]'
                  }`}>
                    <CheckCircle2 size={15} />
                    <span>Notifications Enabled ✓</span>
                  </div>

                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleDisableNotifications}
                    className="p-2.5 rounded-xl font-bold text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-all cursor-pointer"
                    title="Disable notifications"
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
                      <span>Enable Notifications</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Brave Browser Specific Tip */}
        {browserEnv.isBrave && !isSubscribed && (
          <div className={`mt-4 p-3.5 sm:p-4 rounded-2xl border text-xs leading-relaxed space-y-2 ${
            isDark
              ? 'bg-amber-950/25 border-amber-500/30 text-amber-200'
              : 'bg-amber-50/90 border-amber-300/80 text-amber-950 shadow-xs'
          }`}>
            <p className="font-bold flex items-center gap-1.5 text-xs">
              <span>🦁 Brave Browser Push Notice:</span>
            </p>
            <p className="text-[11px] opacity-90">
              Brave disables Google push messaging by default. To receive notifications in Brave:
            </p>
            <ol className="list-decimal list-inside text-[11px] space-y-1 font-medium opacity-90">
              <li>Open a tab and paste: <code className="px-1.5 py-0.5 rounded bg-black/20 font-mono font-bold">brave://settings/privacy</code></li>
              <li>Turn <strong>ON</strong> the toggle for <strong>"Use Google services for push messaging"</strong>.</li>
              <li>Relaunch Brave and tap <strong>Enable Notifications</strong> above.</li>
            </ol>
          </div>
        )}
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
                <DollarSign size={15} />
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

          {/* Preference 2: Expense Reminders */}
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
                  Expense reminders
                </p>
                <p className={`text-[11px] leading-snug mt-0.5 ${isDark ? 'text-slate-400' : 'text-[#4F736C]'}`}>
                  Daily evening reminders to record today's spending and split receipts.
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

          {/* Preference 3: Weekly Spending Summary */}
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
                  Weekly digest with total money spent and spending patterns.
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

          {/* Preference 4: Savings Goal Updates */}
          <div
            onClick={() => handleTogglePreference('savingsGoalUpdates')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
              preferences.savingsGoalUpdates
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
                <Target size={15} />
              </div>
              <div>
                <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#07241E]'}`}>
                  Savings goal updates
                </p>
                <p className={`text-[11px] leading-snug mt-0.5 ${isDark ? 'text-slate-400' : 'text-[#4F736C]'}`}>
                  Alerts when you are close to hitting your milestone savings targets.
                </p>
              </div>
            </div>

            <input
              type="checkbox"
              checked={preferences.savingsGoalUpdates}
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
