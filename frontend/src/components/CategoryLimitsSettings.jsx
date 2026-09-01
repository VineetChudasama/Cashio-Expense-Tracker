import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sliders,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Utensils,
  ShoppingBag,
  Plane,
  Film,
  Car,
  Home,
  Zap,
  HeartPulse,
  GraduationCap,
  Layers,
  HelpCircle,
  Info
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { users as usersApi } from '../lib/api';
import { formatCurrency, getCurrencySymbol } from '../utils/currency';

const CATEGORY_MAP = [
  { name: 'Food', icon: Utensils, color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30' },
  { name: 'Shopping', icon: ShoppingBag, color: 'text-pink-400', bg: 'bg-pink-500/15', border: 'border-pink-500/30' },
  { name: 'Travel', icon: Plane, color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/30' },
  { name: 'Entertainment', icon: Film, color: 'text-purple-400', bg: 'bg-purple-500/15', border: 'border-purple-500/30' },
  { name: 'Transport', icon: Car, color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30' },
  { name: 'Rent', icon: Home, color: 'text-indigo-400', bg: 'bg-indigo-500/15', border: 'border-indigo-500/30' },
  { name: 'Utilities', icon: Zap, color: 'text-cyan-400', bg: 'bg-cyan-500/15', border: 'border-cyan-500/30' },
  { name: 'Health', icon: HeartPulse, color: 'text-rose-400', bg: 'bg-rose-500/15', border: 'border-rose-500/30' },
  { name: 'Education', icon: GraduationCap, color: 'text-teal-400', bg: 'bg-teal-500/15', border: 'border-teal-500/30' },
  { name: 'Other', icon: Layers, color: 'text-slate-400', bg: 'bg-slate-500/15', border: 'border-slate-500/30' },
];

const CategoryLimitsSettings = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const userCurrency = user?.currency || localStorage.getItem('flow_currency') || 'USD ($)';
  const currencySymbol = getCurrencySymbol(userCurrency);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [limitsData, setLimitsData] = useState([]);
  const [editedLimits, setEditedLimits] = useState({});
  const [originalLimits, setOriginalLimits] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fetchLimits = async () => {
    try {
      const res = await usersApi.getCategoryLimits();
      if (res.success && res.data) {
        setLimitsData(res.data.limits || []);
        const raw = res.data.rawLimits || {};
        const initial = {};
        CATEGORY_MAP.forEach(cat => {
          initial[cat.name] = raw[cat.name] ? raw[cat.name].toString() : '';
        });
        setEditedLimits(initial);
        setOriginalLimits(initial);
      }
    } catch (err) {
      console.error('[FETCH CATEGORY LIMITS ERROR]:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLimits();
  }, [userCurrency]);

  const handleInputChange = (category, value) => {
    const clean = value.replace(/[^0-9.]/g, '');
    setEditedLimits(prev => ({
      ...prev,
      [category]: clean
    }));
  };

  const isModified = Object.keys(editedLimits).some(
    cat => (editedLimits[cat] || '').trim() !== (originalLimits[cat] || '').trim()
  );

  const handleSaveLimits = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setSaving(true);

    try {
      const payload = {};
      Object.entries(editedLimits).forEach(([cat, val]) => {
        const num = parseFloat(val);
        payload[cat] = !isNaN(num) ? num : 0;
      });

      const res = await usersApi.updateCategoryLimits(payload);
      if (res.success) {
        setSuccessMessage('Category spending limits successfully updated!');
        setOriginalLimits(editedLimits);
        await fetchLimits();
        setTimeout(() => setSuccessMessage(''), 4000);
      } else {
        setErrorMessage(res.error || 'Failed to update limits');
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.error || 'Failed to update category spending limits');
    } finally {
      setSaving(false);
    }
  };

  // Calculate totals
  const totalBudget = Object.values(editedLimits).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
  const totalSpentThisMonth = limitsData.reduce((sum, item) => sum + (item.spent || 0), 0);

  return (
    <div className="glass-card p-5 sm:p-7 rounded-3xl border border-white/10 relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl border ${
            isDark ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' : 'bg-[#EAF5F2] text-[#147D70] border-[#3BAE9F]/40'
          }`}>
            <Sliders size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
                Category Spending Limits
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
                High-Spending Alerts
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5">
              Configure monthly budget ceilings. Cashio will automatically dispatch alerts when you reach <strong>50%</strong>, <strong>80%</strong>, or <strong>exceed (100%+)</strong> your category limits.
            </p>
          </div>
        </div>

        {/* Quick Month Overview */}
        <div className="flex items-center gap-3 bg-black/20 px-4 py-2.5 rounded-2xl border border-white/[0.08] shrink-0">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Budget</span>
            <span className="text-xs font-black text-emerald-400">
              {formatCurrency(totalBudget, userCurrency)}
            </span>
          </div>
          <div className="h-6 w-[1px] bg-white/10" />
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Spent This Month</span>
            <span className="text-xs font-black text-white">
              {formatCurrency(totalSpentThisMonth, userCurrency)}
            </span>
          </div>
        </div>
      </div>

      {/* Alerts */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mt-4 p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs font-semibold flex items-center gap-2.5"
          >
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </motion.div>
        )}

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mt-4 p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs font-semibold flex items-center gap-2.5"
          >
            <AlertCircle size={16} className="text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Limits Form */}
      {loading ? (
        <div className="py-12 flex justify-center items-center">
          <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <form onSubmit={handleSaveLimits} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {CATEGORY_MAP.map(cat => {
              const Icon = cat.icon;
              const currentVal = editedLimits[cat.name] || '';
              const limitNum = parseFloat(currentVal) || 0;
              
              // Find matching usage data
              const usage = limitsData.find(l => l.category === cat.name) || {
                spent: 0,
                percent: 0,
                isExceeded: false,
                isWarning: false
              };

              const spent = usage.spent || 0;
              const percent = limitNum > 0 ? Math.min(100, Math.round((spent / limitNum) * 100)) : 0;
              const isOver = limitNum > 0 && spent > limitNum;
              const isWarn = limitNum > 0 && (spent / limitNum) >= 0.8 && !isOver;
              const isHalf = limitNum > 0 && (spent / limitNum) >= 0.5 && !isWarn && !isOver;

              return (
                <div
                  key={cat.name}
                  className={`p-3.5 rounded-2xl border transition-all duration-200 ${
                    isOver
                      ? 'bg-rose-950/20 border-rose-500/35 shadow-rose-950/20'
                      : isWarn
                        ? 'bg-amber-950/20 border-amber-500/35'
                        : limitNum > 0
                          ? 'bg-white/[0.02] border-white/10 hover:border-emerald-400/30'
                          : 'bg-black/15 border-white/[0.05] hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-2 rounded-xl ${cat.bg} ${cat.color} ${cat.border} border shrink-0`}>
                        <Icon size={16} />
                      </div>
                      <div className="truncate">
                        <span className="text-xs font-bold text-white block truncate">{cat.name}</span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Spent: <strong className="text-white font-bold">{formatCurrency(spent, userCurrency)}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {isOver ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 animate-pulse">
                          <AlertTriangle size={10} />
                          <span>Exceeded</span>
                        </span>
                      ) : isWarn ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          80%+ Warning
                        </span>
                      ) : isHalf ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/40">
                          50%+ Used
                        </span>
                      ) : limitNum > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/5 text-emerald-300 border border-emerald-400/20">
                          {percent}% Used
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold text-slate-500">
                          No Limit
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Input Field */}
                  <div className="relative mb-2">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-400">
                      {currencySymbol}
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={currentVal}
                      onChange={(e) => handleInputChange(cat.name, e.target.value)}
                      placeholder="No limit set (e.g. 500)"
                      className="w-full glass-inset pl-7 pr-16 py-2 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 uppercase">
                      / month
                    </span>
                  </div>

                  {/* Monthly Utilization Bar */}
                  {limitNum > 0 && (
                    <div className="space-y-1 pt-1">
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isOver
                              ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                              : isWarn
                                ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]'
                                : isHalf
                                  ? 'bg-teal-400'
                                  : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, percent)}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                        <span>{percent}% allocated</span>
                        <span>
                          {isOver
                            ? `Over by ${formatCurrency(spent - limitNum, userCurrency)}`
                            : `Remaining: ${formatCurrency(Math.max(0, limitNum - spent), userCurrency)}`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Submit / Action Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-white/[0.08]">
            <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <Info size={14} className="text-emerald-400 shrink-0" />
              <span>Limits apply to calendar months and reset automatically on the 1st of each month.</span>
            </p>

            <button
              type="submit"
              disabled={!isModified || saving}
              className="glass-btn-primary px-6 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Save size={15} />
                  <span>Save Category Limits</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CategoryLimitsSettings;
