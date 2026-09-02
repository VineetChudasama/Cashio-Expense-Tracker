import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Search, 
  UserPlus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  PlusCircle, 
  Receipt, 
  Sparkles, 
  Calendar, 
  Tag, 
  FileText,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { expenses as expensesApi, users, splits } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { format } from 'date-fns';
import { formatCurrency, getCurrencySymbol, CurrencyIcon } from '../utils/currency';

const CATEGORIES = [
  'Food',
  'Travel',
  'Transport',
  'Entertainment',
  'Utilities',
  'Rent',
  'Shopping',
  'Health',
  'Other'
];

const ShareExpenseModal = ({ splitToEdit, onClose }) => {
  const { user: currentUser } = useAuth();
  const { isDark } = useTheme();
  const userCurrency = currentUser?.currency || localStorage.getItem('flow_currency') || 'USD ($)';
  const currencySymbol = getCurrencySymbol(userCurrency);
  const isEditing = Boolean(splitToEdit);

  // Tab mode: 'create' (create new expense & split immediately) or 'pick' (pick an existing recorded expense)
  const [modalMode, setModalMode] = useState(isEditing ? 'edit' : 'create');

  // Step for 'pick' mode: step 1 = pick expense, step 2 = assign participants
  const [pickStep, setPickStep] = useState(1);

  // New Expense form state
  const [newExpenseData, setNewExpenseData] = useState({
    amount: '',
    description: '',
    category: 'Food',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  // Picked expense state
  const [expenseList, setExpenseList] = useState([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(splitToEdit?.expense || null);

  // Participant search state
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [participants, setParticipants] = useState(() => {
    if (splitToEdit?.participants) {
      return splitToEdit.participants.map(p => ({
        userId: p.userId,
        name: p.user?.name || 'User',
        email: p.user?.email || '',
        avatar: p.user?.avatar || p.avatar || null,
        amountOwed: p.amountOwed.toString()
      }));
    }
    return [];
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const searchTimeout = useRef(null);

  // Fetch unsplit expenses if user switches to 'pick' mode
  useEffect(() => {
    if (modalMode === 'pick' && expenseList.length === 0) {
      const fetchExpenses = async () => {
        setLoadingExpenses(true);
        try {
          const res = await expensesApi.getAll({ limit: 50 });
          if (res.success) {
            setExpenseList(res.data.expenses || []);
          }
        } catch (err) {
          console.error('Failed to fetch expenses', err);
        } finally {
          setLoadingExpenses(false);
        }
      };
      fetchExpenses();
    }
  }, [modalMode, expenseList.length]);

  // Debounced search for registered users
  useEffect(() => {
    const query = searchEmail.trim();
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await users.search(query);
        if (res.success) {
          setSearchResults(res.data || []);
        }
      } catch (err) {
        console.error('User search failed', err);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchEmail]);

  const addParticipant = (user) => {
    setParticipants(prev => [...prev, {
      userId: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || null,
      amountOwed: ''
    }]);
    setSearchEmail('');
    setSearchResults([]);
  };

  const removeParticipant = (userId) => {
    setParticipants(prev => prev.filter(p => p.userId !== userId));
  };

  const updateAmount = (userId, amount) => {
    setParticipants(prev => prev.map(p =>
      p.userId === userId ? { ...p, amountOwed: amount } : p
    ));
  };

  // Active total expense amount based on mode
  const currentTotalAmount = modalMode === 'create'
    ? parseFloat(newExpenseData.amount) || 0
    : selectedExpense ? parseFloat(selectedExpense.amount) || 0 : 0;

  // Split equally between user and all participants
  const splitEqually = () => {
    if (currentTotalAmount <= 0 || participants.length === 0) return;
    const totalPeople = participants.length + 1; // You + participants
    const perPerson = (currentTotalAmount / totalPeople).toFixed(2);
    setParticipants(prev => prev.map(p => ({ ...p, amountOwed: perPerson })));
  };

  // Calculations for live summary
  const totalOthersOwed = participants.reduce((acc, p) => acc + (parseFloat(p.amountOwed) || 0), 0);
  const yourShare = Math.max(0, currentTotalAmount - totalOthersOwed);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');

    if (modalMode === 'create') {
      const amountVal = parseFloat(newExpenseData.amount);
      if (!amountVal || isNaN(amountVal) || amountVal <= 0) {
        setError('Please enter a valid expense amount.');
        return;
      }
      if (amountVal > 100000) {
        setError(`Expense amount cannot exceed ${currencySymbol}100,000 per expense.`);
        return;
      }
      if (!newExpenseData.description.trim()) {
        setError('Please enter a description for the expense (e.g. Dinner, Taxi, etc.).');
        return;
      }
    } else if (modalMode === 'pick' && !selectedExpense) {
      setError('Please select an expense to split.');
      return;
    }

    if (participants.length === 0) {
      setError('Please add at least one friend/participant to share this expense with.');
      return;
    }

    const invalidAmounts = participants.some(p => !p.amountOwed || Number(p.amountOwed) <= 0);
    if (invalidAmounts) {
      setError('Please specify a valid share amount for each participant.');
      return;
    }

    setIsSubmitting(true);
    try {
      const participantPayload = participants.map(p => ({
        userId: p.userId,
        amountOwed: Number(p.amountOwed)
      }));

      let res;
      if (isEditing) {
        res = await splits.update(splitToEdit.id, { participants: participantPayload });
      } else if (modalMode === 'create') {
        res = await splits.create({
          amount: parseFloat(newExpenseData.amount),
          description: newExpenseData.description.trim(),
          category: newExpenseData.category,
          date: newExpenseData.date,
          participants: participantPayload
        });
      } else {
        res = await splits.create({
          expenseId: selectedExpense.id,
          participants: participantPayload
        });
      }

      if (res.success) {
        onClose(true);
      } else {
        const errorVal = res.error || 'Failed to save shared expense.';
        setError(typeof errorVal === 'string' ? errorVal : JSON.stringify(errorVal));
      }
    } catch (err) {
      const serverErr = err.response?.data?.error;
      let msg = 'An error occurred while saving the shared expense.';
      if (Array.isArray(serverErr)) {
        msg = serverErr.map(e => e.msg || e.message || JSON.stringify(e)).join(', ');
      } else if (typeof serverErr === 'string') {
        msg = serverErr;
      } else if (err.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs = [
    { id: 'create', label: 'Create & Split New', icon: PlusCircle },
    { id: 'pick', label: 'Split Existing', icon: Receipt }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 glass-overlay overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
        className={`glass-card w-full max-w-xl overflow-hidden max-h-[92vh] flex flex-col my-auto shadow-2xl border ${
          isDark ? 'border-white/10' : 'border-emerald-600/30'
        }`}
      >
        {/* Header */}
        <div className={`flex justify-between items-center p-4 sm:p-5 border-b shrink-0 ${
          isDark ? 'border-white/[0.06]' : 'border-emerald-600/15'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${
              isDark 
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-400/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                : 'bg-[#EAF5F2] text-[#147D70] border-[#3BAE9F]/40 shadow-xs'
            }`}>
              <UserPlus size={18} />
            </div>
            <div>
              <h2 className={`text-base sm:text-lg font-black tracking-wide ${
                isDark ? 'text-white' : 'text-[#07241E]'
              }`}>
                {isEditing ? 'Edit Shared Expense' : 'Split an Expense'}
              </h2>
              <p className={`text-[11px] font-medium ${
                isDark ? 'text-emerald-300/80' : 'text-[#1F7669]'
              }`}>
                {isEditing 
                  ? 'Update participant shares and allocations' 
                  : 'Log an expense and split it instantly with friends'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onClose(false)}
            className={`p-1.5 sm:p-2 rounded-xl transition-colors cursor-pointer glass-btn ${
              isDark ? 'text-slate-400 hover:text-white' : 'text-emerald-800 hover:text-emerald-950'
            }`}
          >
            <X size={17} />
          </button>
        </div>

        {/* Mode Switcher Tabs with Smooth Active State Transition */}
        {!isEditing && (
          <div className={`p-2 border-b shrink-0 ${
            isDark ? 'bg-black/25 border-white/[0.06]' : 'bg-[#DFECE5] border-emerald-600/20'
          }`}>
            <div className={`flex p-1 rounded-2xl border gap-1 relative ${
              isDark ? 'bg-black/30 border-white/[0.05]' : 'bg-[#D2E4DC] border-emerald-600/25'
            }`}>
              {tabs.map((tab) => {
                const isActive = modalMode === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setModalMode(tab.id);
                      if (tab.id === 'pick') setPickStep(1);
                    }}
                    className={`relative flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer z-10 outline-none select-none ${
                      isActive
                        ? isDark ? 'text-white font-extrabold' : 'text-emerald-950 font-black'
                        : isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]' : 'text-emerald-900/80 hover:text-emerald-950'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeSplitModeTabPill"
                        className={`absolute inset-0 rounded-xl z-0 pointer-events-none border ${
                          isDark 
                            ? 'bg-gradient-to-r from-emerald-500/25 to-teal-500/20 border-emerald-400/40 shadow-[0_0_15px_rgba(16,185,129,0.25)]' 
                            : 'bg-white border-emerald-600/30 shadow-xs'
                        }`}
                        transition={{ type: 'spring', bounce: 0.18, duration: 0.35 }}
                      />
                    )}
                    <Icon size={14} className={`relative z-10 ${isActive ? (isDark ? 'text-emerald-400' : 'text-emerald-700') : (isDark ? 'text-slate-400' : 'text-emerald-800')}`} />
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Body Content with Smooth Mode Transition */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <AnimatePresence mode="wait">
            {/* MODE 1: CREATE & SPLIT NEW EXPENSE DIRECTLY */}
            {modalMode === 'create' && (
              <motion.div
                key="create-mode-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="space-y-4 sm:space-y-5"
              >
                {/* Expense Information Box */}
                <div className={`p-4 rounded-2xl border space-y-3.5 shadow-md ${
                  isDark ? 'glass-elevated border-white/[0.06]' : 'bg-white border-emerald-600/25'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText size={13} />
                      Expense Details
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] font-medium">
                      Logs in your history & splits with peers
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1">
                          <CurrencyIcon currency={userCurrency} size={12} className="text-emerald-500 dark:text-emerald-400" />
                          <span>Total Amount ({currencySymbol})</span>
                        </label>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-1.5 py-0.2 rounded border border-emerald-400/20">
                          Max {currencySymbol}100,000
                        </span>
                      </div>
                      <input
                        type="number"
                        min="0.01"
                        max="100000"
                        step="0.01"
                        required
                        placeholder="0.00"
                        value={newExpenseData.amount}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val !== '' && parseFloat(val) > 100000) return;
                          setNewExpenseData(prev => ({ ...prev, amount: val }));
                        }}
                        className="w-full glass-inset px-3 py-2.5 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-emerald-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Calendar size={12} className="text-emerald-500 dark:text-emerald-400" />
                        <span>Date</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={newExpenseData.date}
                        onChange={(e) => setNewExpenseData(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full glass-inset px-3 py-2.5 text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-emerald-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1">
                        Description / Title
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Dinner with team, Taxi, Airbnb..."
                        value={newExpenseData.description}
                        onChange={(e) => setNewExpenseData(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full glass-inset px-3 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-emerald-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Tag size={12} className="text-emerald-500 dark:text-emerald-400" />
                        <span>Category</span>
                      </label>
                      <select
                        value={newExpenseData.category}
                        onChange={(e) => setNewExpenseData(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full glass-inset px-3 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-emerald-400 appearance-none cursor-pointer"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat} className={isDark ? 'bg-[#031512] text-white' : 'bg-white text-emerald-950'}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Participants Section */}
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1.5">
                      Search & Add Friends by Name or Email
                    </label>
                    <div className="relative">
                      <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={searchEmail}
                        onChange={(e) => setSearchEmail(e.target.value)}
                        placeholder="Type friend's name or email address..."
                        className="w-full glass-inset pl-9 pr-4 py-2.5 text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-emerald-400"
                      />
                    </div>

                    {/* Search results dropdown with smooth animation */}
                    <AnimatePresence>
                      {(searchResults.length > 0 || searching) && (
                        <motion.div 
                          initial={{ opacity: 0, y: -6, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.98 }}
                          transition={{ duration: 0.18 }}
                          className={`mt-2 overflow-hidden divide-y rounded-xl shadow-lg border ${
                            isDark 
                              ? 'glass-elevated divide-white/[0.06] border-white/[0.08]' 
                              : 'bg-white divide-emerald-600/15 border-emerald-600/25'
                          }`}
                        >
                          {searching ? (
                            <div className="flex items-center gap-2.5 p-3 text-xs text-emerald-600 dark:text-emerald-400">
                              <div className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                              <span>Searching registered users...</span>
                            </div>
                          ) : (
                            searchResults.map(user => {
                              const isSelf = user.isSelf || user.id === currentUser?.id || user.email?.toLowerCase() === currentUser?.email?.toLowerCase();
                              const isAlreadyAdded = participants.some(p => p.userId === user.id);

                              if (isSelf) {
                                return (
                                  <div key={user.id} className="w-full text-left p-3 flex items-center justify-between gap-2.5 bg-emerald-500/5">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 border ${
                                        isDark 
                                          ? 'bg-emerald-500/20 border-emerald-400/30 text-white' 
                                          : 'bg-emerald-100 border-emerald-300 text-emerald-950'
                                      }`}>
                                        {user.name?.charAt(0)?.toUpperCase() || '?'}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-xs font-bold text-[var(--text-primary)] truncate">{user.name} (You)</p>
                                        <p className="text-[11px] text-[var(--text-muted)] truncate">{user.email}</p>
                                      </div>
                                    </div>
                                    <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-400/20">
                                      Payer
                                    </span>
                                  </div>
                                );
                              }

                              return (
                                <button
                                  key={user.id}
                                  type="button"
                                  disabled={isAlreadyAdded}
                                  onClick={() => addParticipant(user)}
                                  className={`w-full text-left p-3 flex items-center justify-between gap-2.5 transition-colors cursor-pointer ${
                                    isAlreadyAdded
                                      ? 'opacity-40 cursor-not-allowed bg-black/5 dark:bg-white/[0.02]'
                                      : 'hover:bg-emerald-500/15'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 border overflow-hidden ${
                                      isDark 
                                        ? 'bg-gradient-to-br from-emerald-500/30 to-teal-500/20 border-emerald-400/30 text-white' 
                                        : 'bg-[#DFECE5] border-emerald-600/30 text-emerald-950'
                                    }`}>
                                      {user.avatar ? (
                                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                      ) : (
                                        user.name?.charAt(0)?.toUpperCase() || '?'
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-[var(--text-primary)] truncate">{user.name}</p>
                                      <p className="text-[11px] text-[var(--text-muted)] truncate">{user.email}</p>
                                    </div>
                                  </div>
                                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                                    {isAlreadyAdded ? (
                                      <span className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                                        <CheckCircle2 size={13} className="text-emerald-500" /> Added
                                      </span>
                                    ) : (
                                      '+ Add to Split'
                                    )}
                                  </span>
                                </button>
                              );
                            })
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {!searching && searchEmail.trim().length >= 2 && searchResults.length === 0 && (
                      <div className={`mt-2 p-3.5 rounded-xl text-center border ${
                        isDark ? 'glass-elevated border-white/[0.08]' : 'bg-white border-emerald-600/25'
                      }`}>
                        <p className="text-xs text-[var(--text-primary)] font-semibold">
                          No registered user found for &quot;<span className="text-emerald-500 dark:text-emerald-400">{searchEmail}</span>&quot;
                        </p>
                        <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-relaxed">
                          Make sure your friend has signed up for a Cashio account with this name or email.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Added Participants List with Smooth Element Transitions */}
                  {participants.length > 0 && (
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-wider">
                          Participants ({participants.length})
                        </label>
                        <button
                          type="button"
                          onClick={splitEqually}
                          className={`text-xs font-bold transition-all cursor-pointer flex items-center gap-1 px-2.5 py-1 rounded-lg border active:scale-95 ${
                            isDark 
                              ? 'text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-400/20' 
                              : 'text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border-emerald-400/40'
                          }`}
                        >
                          <Sparkles size={11} />
                          <span>Split Equally ({participants.length + 1} ways)</span>
                        </button>
                      </div>

                      <div className="space-y-2">
                        <AnimatePresence initial={false}>
                          {participants.map(p => (
                            <motion.div
                              key={p.userId}
                              initial={{ opacity: 0, height: 0, scale: 0.95 }}
                              animate={{ opacity: 1, height: 'auto', scale: 1 }}
                              exit={{ opacity: 0, height: 0, scale: 0.95 }}
                              transition={{ duration: 0.2 }}
                              className={`flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl overflow-hidden border ${
                                isDark ? 'glass-elevated border-white/[0.06]' : 'bg-white border-emerald-600/25 shadow-xs'
                              }`}
                            >
                              <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 border overflow-hidden ${
                                isDark 
                                  ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border-emerald-400/25 text-white' 
                                  : 'bg-[#DFECE5] border-emerald-600/30 text-emerald-950'
                              }`}>
                                {p.avatar ? (
                                  <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                                ) : (
                                  p.name?.charAt(0) || '?'
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate">{p.name}</p>
                                <p className="text-[10px] sm:text-[11px] text-[var(--text-muted)] truncate">{p.email}</p>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{currencySymbol}</span>
                                <input
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  value={p.amountOwed}
                                  onChange={(e) => updateAmount(p.userId, e.target.value)}
                                  placeholder="0.00"
                                  className="w-20 glass-inset px-2.5 py-1.5 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-emerald-400 text-right"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeParticipant(p.userId)}
                                  className="p-1.5 rounded-lg text-rose-500 dark:text-rose-300 hover:bg-rose-500/10 border border-rose-500/25 transition-colors glass-btn cursor-pointer"
                                  title="Remove participant"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>

                      {/* Live Split Calculation Summary Card */}
                      <motion.div 
                        layout
                        className={`p-3.5 rounded-xl border space-y-1.5 text-xs shadow-inner ${
                          isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-[#E7F3ED] border-emerald-600/25 text-[#07241E]'
                        }`}
                      >
                        <div className="flex justify-between items-center text-[var(--text-muted)]">
                          <span>Total Expense:</span>
                          <span className="font-bold text-[var(--text-primary)]">{formatCurrency(currentTotalAmount, userCurrency)}</span>
                        </div>
                        <div className="flex justify-between items-center text-[var(--text-muted)]">
                          <span>Others Owe You:</span>
                          <span className={`font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-800 font-black'}`}>
                            {formatCurrency(totalOthersOwed, userCurrency)}
                          </span>
                        </div>
                        <div className={`pt-1.5 border-t flex justify-between items-center font-bold ${
                          isDark ? 'border-white/[0.06]' : 'border-emerald-600/15'
                        }`}>
                          <span className="text-emerald-600 dark:text-emerald-400">Your Share:</span>
                          <span className={yourShare < 0 ? 'text-rose-500' : isDark ? 'text-emerald-400' : 'text-emerald-800 font-black'}>
                            {formatCurrency(yourShare, userCurrency)}
                          </span>
                        </div>
                        {yourShare < 0 && (
                          <p className="text-[11px] text-rose-500 dark:text-rose-300 font-semibold pt-1">
                            Warning: The sum of participant shares exceeds total expense amount.
                          </p>
                        )}
                      </motion.div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* MODE 2: PICK AN EXISTING RECORDED EXPENSE */}
            {(modalMode === 'pick' || isEditing) && (
              <motion.div
                key={isEditing ? 'edit-mode-view' : `pick-step-${pickStep}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="space-y-4"
              >
                {pickStep === 1 && !isEditing ? (
                  <div className="space-y-2.5 sm:space-y-3">
                    <p className="text-xs text-[var(--text-muted)] font-medium">
                      Choose an unsplit transaction from your history:
                    </p>
                    {loadingExpenses ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
                        <p className="text-xs text-[var(--text-muted)]">Loading your expenses...</p>
                      </div>
                    ) : expenseList.length === 0 ? (
                      <div className={`text-center py-10 space-y-2 rounded-2xl p-6 border ${
                        isDark ? 'glass-elevated border-white/5' : 'bg-white border-emerald-600/25'
                      }`}>
                        <Receipt size={28} className="mx-auto text-emerald-500 opacity-60" />
                        <p className="text-[var(--text-primary)] text-xs sm:text-sm font-bold">No recorded expenses found</p>
                        <p className="text-[var(--text-muted)] text-xs">Switch to &quot;Create & Split New&quot; above to log and split an expense immediately.</p>
                        <button
                          type="button"
                          onClick={() => setModalMode('create')}
                          className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                        >
                          Create & Split New Expense &rarr;
                        </button>
                      </div>
                    ) : (
                      expenseList.map(exp => {
                        const isAlreadySplit = Boolean(exp.sharedExpense);
                        return (
                          <button
                            key={exp.id}
                            disabled={isAlreadySplit}
                            onClick={() => {
                              if (!isAlreadySplit) {
                                setSelectedExpense(exp);
                                setPickStep(2);
                              }
                            }}
                            className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 ${
                              isAlreadySplit
                                ? 'opacity-50 cursor-not-allowed border-black/5 dark:border-white/[0.04]'
                                : selectedExpense?.id === exp.id
                                  ? 'border-emerald-400 bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)] cursor-pointer'
                                  : isDark 
                                    ? 'glass-elevated border-white/[0.06] hover:border-emerald-400/30 cursor-pointer' 
                                    : 'bg-white border-emerald-600/25 hover:border-emerald-500 shadow-xs cursor-pointer'
                            }`}
                          >
                            <div className="flex justify-between items-center gap-2">
                              <div className="min-w-0 flex-1 pr-2">
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-xs sm:text-sm text-[var(--text-primary)] truncate">{exp.description || exp.category}</p>
                                  {isAlreadySplit && (
                                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 shrink-0">
                                      Already Split
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-[var(--text-muted)] mt-0.5 font-medium">
                                  {exp.category} • {format(new Date(exp.date), 'MMM dd, yyyy')}
                                </p>
                              </div>
                              <span className="font-black text-sm sm:text-base text-[var(--text-primary)] shrink-0">
                                {formatCurrency(exp.amount, userCurrency)}
                              </span>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                ) : (
                  /* Step 2 in Pick mode or Editing mode */
                  <div className="space-y-4 sm:space-y-5">
                    {selectedExpense && (
                      <div className={`p-3.5 sm:p-4 rounded-2xl border ${
                        isDark ? 'glass-elevated border-white/[0.06]' : 'bg-[#E7F3ED] border-emerald-600/25 shadow-xs'
                      }`}>
                        <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          {isEditing ? 'Editing Split' : 'Splitting Selected Expense'}
                        </p>
                        <p className="font-bold text-sm sm:text-base text-[var(--text-primary)] mt-0.5">
                          {selectedExpense.description} — {formatCurrency(selectedExpense.amount, userCurrency)}
                        </p>
                      </div>
                    )}

                    {/* User search */}
                    <div>
                      <label className="block text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1.5">
                        Search & Add Participants by Name or Email
                      </label>
                      <div className="relative">
                        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={searchEmail}
                          onChange={(e) => setSearchEmail(e.target.value)}
                          placeholder="Type friend's name or email address..."
                          className="w-full glass-inset pl-9 pr-4 py-2.5 text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-emerald-400"
                        />
                      </div>

                      {/* Search results dropdown with smooth animation */}
                      <AnimatePresence>
                        {(searchResults.length > 0 || searching) && (
                          <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.98 }}
                            transition={{ duration: 0.18 }}
                            className={`mt-2 overflow-hidden divide-y rounded-xl shadow-lg border ${
                              isDark 
                                ? 'glass-elevated divide-white/[0.06] border-white/[0.08]' 
                                : 'bg-white divide-emerald-600/15 border-emerald-600/25'
                            }`}
                          >
                            {searching ? (
                              <div className="flex items-center gap-2.5 p-3 text-xs text-emerald-600 dark:text-emerald-400">
                                <div className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                <span>Searching registered users...</span>
                              </div>
                            ) : (
                              searchResults.map(user => {
                                const isSelf = user.isSelf || user.id === currentUser?.id || user.email?.toLowerCase() === currentUser?.email?.toLowerCase();
                                const isAlreadyAdded = participants.some(p => p.userId === user.id);

                                if (isSelf) {
                                  return (
                                    <div key={user.id} className="w-full text-left p-3 flex items-center justify-between gap-2.5 bg-emerald-500/5">
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 border ${
                                          isDark 
                                            ? 'bg-emerald-500/20 border-emerald-400/30 text-white' 
                                            : 'bg-emerald-100 border-emerald-300 text-emerald-950'
                                        }`}>
                                          {user.name?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-xs font-bold text-[var(--text-primary)] truncate">{user.name} (You)</p>
                                          <p className="text-[11px] text-[var(--text-muted)] truncate">{user.email}</p>
                                        </div>
                                      </div>
                                      <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-400/20">
                                        Payer
                                      </span>
                                    </div>
                                  );
                                }

                                return (
                                  <button
                                    key={user.id}
                                    type="button"
                                    disabled={isAlreadyAdded}
                                    onClick={() => addParticipant(user)}
                                    className={`w-full text-left p-3 flex items-center justify-between gap-2.5 transition-colors cursor-pointer ${
                                      isAlreadyAdded
                                        ? 'opacity-40 cursor-not-allowed bg-black/5 dark:bg-white/[0.02]'
                                        : 'hover:bg-emerald-500/15'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 border overflow-hidden ${
                                        isDark 
                                          ? 'bg-gradient-to-br from-emerald-500/30 to-teal-500/20 border-emerald-400/30 text-white' 
                                          : 'bg-[#DFECE5] border-emerald-600/30 text-emerald-950'
                                      }`}>
                                        {user.avatar ? (
                                          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                        ) : (
                                          user.name?.charAt(0)?.toUpperCase() || '?'
                                        )}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-xs font-bold text-[var(--text-primary)] truncate">{user.name}</p>
                                        <p className="text-[11px] text-[var(--text-muted)] truncate">{user.email}</p>
                                      </div>
                                    </div>
                                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                                      {isAlreadyAdded ? (
                                        <span className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                                          <CheckCircle2 size={13} className="text-emerald-500" /> Added
                                        </span>
                                      ) : (
                                        '+ Add to Split'
                                      )}
                                    </span>
                                  </button>
                                );
                              })
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {!searching && searchEmail.trim().length >= 2 && searchResults.length === 0 && (
                        <div className={`mt-2 p-3.5 rounded-xl text-center border ${
                          isDark ? 'glass-elevated border-white/[0.08]' : 'bg-white border-emerald-600/25'
                        }`}>
                          <p className="text-xs text-[var(--text-primary)] font-semibold">
                            No registered user found for &quot;<span className="text-emerald-500 dark:text-emerald-400">{searchEmail}</span>&quot;
                          </p>
                          <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-relaxed">
                            Make sure your friend has signed up for a Cashio account with this name or email.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Participants list */}
                    {participants.length > 0 && (
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center">
                          <label className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-wider">
                            Participants ({participants.length})
                          </label>
                          <button
                            type="button"
                            onClick={splitEqually}
                            className={`text-xs font-bold transition-all cursor-pointer flex items-center gap-1 px-2.5 py-1 rounded-lg border active:scale-95 ${
                              isDark 
                                ? 'text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-400/20' 
                                : 'text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border-emerald-400/40'
                            }`}
                          >
                            <Sparkles size={11} />
                            <span>Split Equally ({participants.length + 1} ways)</span>
                          </button>
                        </div>

                        <div className="space-y-2">
                          <AnimatePresence initial={false}>
                            {participants.map(p => (
                              <motion.div
                                key={p.userId}
                                initial={{ opacity: 0, height: 0, scale: 0.95 }}
                                animate={{ opacity: 1, height: 'auto', scale: 1 }}
                                exit={{ opacity: 0, height: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className={`flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl overflow-hidden border ${
                                  isDark ? 'glass-elevated border-white/[0.06]' : 'bg-white border-emerald-600/25 shadow-xs'
                                }`}
                              >
                                <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 border overflow-hidden ${
                                  isDark 
                                    ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border-emerald-400/25 text-white' 
                                    : 'bg-[#DFECE5] border-emerald-600/30 text-emerald-950'
                                }`}>
                                  {p.avatar ? (
                                    <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                                  ) : (
                                    p.name?.charAt(0) || '?'
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate">{p.name}</p>
                                  <p className="text-[10px] sm:text-[11px] text-[var(--text-muted)] truncate">{p.email}</p>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{currencySymbol}</span>
                                  <input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={p.amountOwed}
                                    onChange={(e) => updateAmount(p.userId, e.target.value)}
                                    placeholder="0.00"
                                    className="w-20 glass-inset px-2.5 py-1.5 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-emerald-400 text-right"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeParticipant(p.userId)}
                                    className="p-1.5 rounded-lg text-rose-500 dark:text-rose-300 hover:bg-rose-500/10 border border-rose-500/25 transition-colors glass-btn cursor-pointer"
                                    title="Remove participant"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>

                        {/* Summary card */}
                        <motion.div 
                          layout
                          className={`p-3.5 rounded-xl border space-y-1.5 text-xs shadow-inner ${
                            isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-[#E7F3ED] border-emerald-600/25 text-[#07241E]'
                          }`}
                        >
                          <div className="flex justify-between items-center text-[var(--text-muted)]">
                            <span>Total Expense:</span>
                            <span className="font-bold text-[var(--text-primary)]">{formatCurrency(currentTotalAmount, userCurrency)}</span>
                          </div>
                          <div className="flex justify-between items-center text-[var(--text-muted)]">
                            <span>Others Owe You:</span>
                            <span className={`font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-800 font-black'}`}>
                              {formatCurrency(totalOthersOwed, userCurrency)}
                            </span>
                          </div>
                          <div className={`pt-1.5 border-t flex justify-between items-center font-bold ${
                            isDark ? 'border-white/[0.06]' : 'border-emerald-600/15'
                          }`}>
                            <span className="text-emerald-600 dark:text-emerald-400">Your Share:</span>
                            <span className={yourShare < 0 ? 'text-rose-500' : isDark ? 'text-emerald-400' : 'text-emerald-800 font-black'}>
                              {formatCurrency(yourShare, userCurrency)}
                            </span>
                          </div>
                        </motion.div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-rose-950/40 border border-rose-500/30 text-rose-300 rounded-xl p-3.5 text-xs font-semibold flex items-center gap-2"
            >
              <AlertCircle size={15} className="text-rose-400 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex justify-between items-center gap-2.5 p-4 sm:p-5 border-t shrink-0 ${
          isDark ? 'bg-black/20 border-white/[0.06]' : 'bg-[#DFECE5] border-emerald-600/20'
        }`}>
          {modalMode === 'pick' && pickStep === 2 && !isEditing ? (
            <button
              type="button"
              onClick={() => setPickStep(1)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold glass-btn cursor-pointer flex items-center gap-1.5 ${
                isDark ? 'text-slate-300 hover:text-white' : 'text-emerald-950 hover:bg-emerald-100'
              }`}
            >
              <ArrowLeft size={14} />
              <span>Back to List</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onClose(false)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold glass-btn cursor-pointer ${
                isDark ? 'text-slate-300 hover:text-white' : 'text-emerald-950 hover:bg-emerald-100'
              }`}
            >
              Cancel
            </button>
          )}

          {(modalMode === 'create' || isEditing || (modalMode === 'pick' && pickStep === 2)) && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="glass-btn-primary px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <UserPlus size={15} />
                  <span>
                    {isEditing 
                      ? 'Update Split' 
                      : modalMode === 'create' 
                        ? 'Create & Split Expense' 
                        : 'Share Selected Expense'}
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ShareExpenseModal;
