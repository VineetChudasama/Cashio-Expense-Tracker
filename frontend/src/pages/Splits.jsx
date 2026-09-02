import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  UserPlus, 
  Receipt, 
  ArrowRightLeft, 
  ArrowRight,
  Edit2, 
  Trash2, 
  CheckCircle2, 
  X, 
  AlertCircle,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { splits } from '../lib/api';
import SettleUpFlow from '../components/SettleUpFlow';
import ShareExpenseModal from '../components/ShareExpenseModal';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency, getCurrencySymbol, CurrencyIcon } from '../utils/currency';

const Splits = () => {
  const { user } = useAuth();
  const userCurrency = user?.currency || localStorage.getItem('flow_currency') || 'USD ($)';
  const currencySymbol = getCurrencySymbol(userCurrency);
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('shared');
  const [sharedExpenses, setSharedExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [editingSplit, setEditingSplit] = useState(null);

  // Double confirmation state for debt settlements
  const [settleConfirmData, setSettleConfirmData] = useState(null);
  const [isSettling, setIsSettling] = useState(false);
  const [settleError, setSettleError] = useState('');

  const fetchSplitsData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'shared') {
        const res = await splits.getAll();
        if (res.success) setSharedExpenses(res.data);
      } else if (activeTab === 'balances') {
        const res = await splits.getBalances();
        if (res.success) setBalances(res.data.balances || []);
      } else if (activeTab === 'settle') {
        const res = await splits.getSettle();
        if (res.success) setSettlements(res.data.transactions || []);
      }
    } catch (err) {
      console.error("Failed to load splits data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSplitsData();
  }, [activeTab]);

  // Trigger double confirmation modal for individual participant settlement
  const requestSettleParticipant = (p, exp) => {
    setSettleError('');
    setSettleConfirmData({
      type: 'participant',
      id: p.id,
      amount: p.amountOwed,
      fromName: p.user?.name || 'Participant',
      toName: user?.name || 'You',
      fromAvatar: p.user?.avatar || null,
      toAvatar: user?.avatar || null,
      description: exp.expense?.description || exp.expense?.category || 'Shared bill',
      title: `Confirm Settlement with ${p.user?.name || 'Participant'}`
    });
  };

  // Trigger double confirmation modal for peer-to-peer settlement transaction
  const requestSettleTransaction = (tx) => {
    setSettleError('');
    const fromName = tx.from?.name || (typeof tx.from === 'string' ? tx.from : 'User');
    const toName = tx.to?.name || (typeof tx.to === 'string' ? tx.to : 'User');
    const fromAvatar = tx.from?.avatar || (fromName === 'You' ? user?.avatar : null);
    const toAvatar = tx.to?.avatar || (toName === 'You' ? user?.avatar : null);
    setSettleConfirmData({
      type: 'transaction',
      tx,
      amount: tx.amount,
      fromName,
      toName,
      fromAvatar,
      toAvatar,
      title: `Confirm Debt Settlement`
    });
  };

  // Execute debt settlement after double confirmation
  const executeSettlement = async () => {
    if (!settleConfirmData) return;
    setIsSettling(true);
    setSettleError('');

    try {
      let res;
      if (settleConfirmData.type === 'transaction') {
        const tx = settleConfirmData.tx;
        const fromId = tx.fromUserId || tx.from?.id;
        const toId = tx.toUserId || tx.to?.id;
        res = await splits.settleTransaction({ fromUserId: fromId, toUserId: toId });
      } else {
        res = await splits.settleParticipant(settleConfirmData.id);
      }

      if (res && res.success) {
        setSettleConfirmData(null);
        fetchSplitsData();
      } else {
        setSettleError(res?.error || 'Failed to complete settlement.');
      }
    } catch (err) {
      console.error("Failed to settle", err);
      setSettleError(err.response?.data?.error || err.message || "Failed to complete settlement");
    } finally {
      setIsSettling(false);
    }
  };

  const handleEditSplit = (exp) => {
    setEditingSplit(exp);
    setIsShareModalOpen(true);
  };

  const handleDeleteSplit = async (splitId) => {
    if (window.confirm('Are you sure you want to remove this shared split?')) {
      try {
        const res = await splits.delete(splitId);
        if (res.success) {
          fetchSplitsData();
        }
      } catch (err) {
        console.error("Failed to delete shared split", err);
        alert(err.response?.data?.error || "Failed to remove shared expense");
      }
    }
  };

  const tabs = [
    { id: 'shared', label: 'Shared Expenses' },
    { id: 'balances', label: 'Balances' },
    { id: 'settle', label: 'Settle Up' }
  ];

  return (
    <div className="space-y-6 sm:space-y-7 max-w-7xl mx-auto pb-12 px-3 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight flex items-center gap-2.5">
            <Users className="text-emerald-500 dark:text-emerald-400" />
            Split Expenses
          </h1>
          <p className="text-xs sm:text-sm font-medium text-[var(--text-muted)] mt-0.5">
            Manage shared bills and peer-to-peer settlements
          </p>
        </div>
        
        {activeTab === 'shared' && (
          <button
            onClick={() => {
              setEditingSplit(null);
              setIsShareModalOpen(true);
            }}
            className="w-full sm:w-auto glass-btn-primary px-5 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 text-xs sm:text-sm cursor-pointer"
          >
            <UserPlus size={17} />
            <span>Share an Expense</span>
          </button>
        )}
      </div>

      {/* Main Container */}
      <div className="glass-card overflow-hidden">
        {/* Navigation Tabs */}
        <div className={`grid grid-cols-3 border-b p-1.5 sm:p-2 gap-1 sm:gap-2 ${
          isDark ? 'bg-[#031512]/60 border-white/[0.06]' : 'bg-[#DFECE5] border-emerald-600/20'
        }`}>
          {tabs.map((tab) => {
            const isTabActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative py-2.5 sm:py-3 px-1 sm:px-4 text-[11px] sm:text-xs font-bold text-center rounded-xl whitespace-nowrap transition-colors duration-200 z-10 outline-none flex items-center justify-center cursor-pointer ${
                  isTabActive
                    ? isDark ? 'text-white' : 'text-emerald-950 font-black'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-emerald-900/80 hover:text-emerald-950 font-semibold'
                }`}
              >
                {isTabActive && (
                  <motion.div
                    layoutId="splitsActiveTabPill"
                    className={`absolute inset-0 rounded-xl border pointer-events-none z-0 ${
                      isDark
                        ? 'bg-gradient-to-r from-emerald-500/25 via-emerald-500/15 to-teal-500/10 border-emerald-400/35 border-t-emerald-300/40 shadow-[0_4px_16px_rgba(16,185,129,0.2)]'
                        : 'bg-white border-emerald-600/30 border-t-white shadow-[0_2px_8px_rgba(5,150,105,0.18)]'
                    }`}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10 tracking-tight sm:tracking-wide">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="p-4 sm:p-6 lg:p-7">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="animate-spin rounded-full h-9 w-9 border-t-2 border-b-2 border-emerald-500"></div>
              <p className="text-xs text-[var(--text-muted)] font-medium">Loading splits...</p>
            </div>
          ) : (
            <>
              {activeTab === 'shared' && (
                <div className="space-y-3">
                  {sharedExpenses.length > 0 ? (
                    sharedExpenses.map((exp, idx) => {
                      const isCreator = exp.createdByUserId === user?.id;

                      return (
                        <div 
                          key={exp.id || idx} 
                          className="glass-elevated p-3.5 sm:p-4 lg:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:border-emerald-400/30 transition-all duration-200 group border"
                        >
                          <div className="min-w-0 flex-1 w-full sm:w-auto pr-2">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)] truncate max-w-full">
                                {exp.expense?.description || 'Shared Expense'}
                              </h3>
                              {isCreator ? (
                                <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase px-2 py-0.5 rounded-md border tracking-wider ${
                                  isDark 
                                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]' 
                                    : 'bg-emerald-100 text-emerald-950 border-emerald-400/50 shadow-xs'
                                }`}>
                                  <div className="w-3.5 h-3.5 rounded-full overflow-hidden shrink-0 border border-emerald-400/40">
                                    {user?.avatar ? (
                                      <img src={user.avatar} alt="You" className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-[7px] font-bold bg-emerald-500/20 text-emerald-400">
                                        {(user?.name || 'Y').charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                  </div>
                                  <span>You Paid</span>
                                </span>
                              ) : (
                                <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase px-2 py-0.5 rounded-md border tracking-wider ${
                                  isDark 
                                    ? 'bg-teal-500/15 text-teal-300 border-teal-500/30' 
                                    : 'bg-teal-50 text-teal-950 border-teal-300 shadow-xs'
                                }`}>
                                  <div className="w-3.5 h-3.5 rounded-full overflow-hidden shrink-0 border border-teal-400/40">
                                    {exp.createdBy?.avatar ? (
                                      <img src={exp.createdBy.avatar} alt={exp.createdBy.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-[7px] font-bold bg-teal-500/20 text-teal-400">
                                        {(exp.createdBy?.name || 'U').charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                  </div>
                                  <span>Paid by {exp.createdBy?.name || 'User'}</span>
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5 flex-wrap font-medium">
                              <span>Total bill: <strong className="text-[var(--text-primary)]">{formatCurrency(exp.expense?.amount || 0, userCurrency)}</strong></span>
                              <span>•</span>
                              <span>{exp.expense?.category}</span>
                            </p>
                            {exp.participants?.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1.5">
                                {exp.participants.map(p => (
                                  <span 
                                    key={p.id} 
                                    className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-lg border font-medium ${
                                      isDark 
                                        ? 'bg-[#021411] text-slate-300 border-white/[0.06]' 
                                        : 'bg-white text-emerald-950 border-emerald-600/25 shadow-xs'
                                    }`}
                                  >
                                    <div className="w-3.5 h-3.5 rounded-full overflow-hidden shrink-0 border border-emerald-500/30">
                                      {p.user?.avatar ? (
                                        <img src={p.user.avatar} alt={p.user.name} className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[7px] font-bold bg-emerald-500/20 text-emerald-400">
                                          {(p.user?.name || 'U').charAt(0).toUpperCase()}
                                        </div>
                                      )}
                                    </div>
                                    <span>{p.user?.name || 'User'}: <strong className={isDark ? 'text-emerald-300 font-bold' : 'text-emerald-700 font-bold'}>{formatCurrency(p.amountOwed, userCurrency)}</strong></span>
                                    {p.settled ? (
                                      <span className="text-emerald-500 font-black ml-0.5" title="Settled">✓</span>
                                    ) : isCreator ? (
                                      <button
                                        onClick={() => requestSettleParticipant(p, exp)}
                                        className="ml-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer bg-emerald-500/10 dark:bg-emerald-500/20 px-1.5 py-0.2 rounded active:scale-95"
                                        title="Click to mark this participant as settled"
                                      >
                                        Settle
                                      </button>
                                    ) : null}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          <div className={`flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 shrink-0 ${
                            isDark ? 'border-white/[0.06]' : 'border-emerald-600/15'
                          }`}>
                            {isCreator && (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleEditSplit(exp)}
                                  className="p-2 rounded-xl text-[var(--text-primary)] glass-btn transition-colors active:scale-95 cursor-pointer"
                                  title="Edit split participants and amounts"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteSplit(exp.id)}
                                  className="p-2 rounded-xl text-rose-500 dark:text-rose-300 hover:bg-rose-500/10 border border-rose-500/30 transition-colors glass-btn active:scale-95 cursor-pointer"
                                  title="Delete split"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                            <span className={`text-xs font-bold px-3 py-1 rounded-full border ml-auto sm:ml-0 ${
                              isDark
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                                : 'bg-emerald-100 text-emerald-900 border-emerald-300 shadow-xs'
                            }`}>
                              Split
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-14 text-[var(--text-muted)]">
                      <Receipt size={38} className="mx-auto mb-3 opacity-50 text-emerald-500" />
                      <p className="font-bold text-sm text-[var(--text-primary)]">You haven't shared any expenses yet.</p>
                      <button 
                        onClick={() => {
                          setEditingSplit(null);
                          setIsShareModalOpen(true);
                        }}
                        className="mt-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>Click 'Share an Expense' to get started</span>
                        <span>&rarr;</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'balances' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  {balances.length > 0 ? (
                    balances.map((bal, idx) => {
                      const isOwed = bal.amount > 0;
                      const isZero = bal.amount === 0;
                      
                      const displayName = bal.name || bal.user?.name || 'Friend';
                      const displayEmail = bal.email || bal.user?.email || '';
                      const avatarLetter = displayName.charAt(0)?.toUpperCase() || '?';

                      return (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.04 }}
                          key={idx} 
                          className={`p-4 sm:p-5 rounded-2xl border backdrop-blur-xl ${
                            isZero 
                              ? isDark ? 'glass-elevated border-white/[0.08]' : 'bg-white border-emerald-600/25 shadow-xs' 
                              : isOwed 
                                ? isDark ? 'bg-emerald-950/20 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]' : 'bg-[#E5F6EE] border-emerald-500/40 shadow-sm'
                                : isDark ? 'bg-rose-950/20 border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.15)]' : 'bg-[#FDF1F3] border-rose-400/40 shadow-sm'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border overflow-hidden ${
                                isDark 
                                  ? 'bg-[#031512] text-white border-white/10' 
                                  : 'bg-[#DFECE5] text-emerald-950 border-emerald-600/30'
                              }`}>
                                {bal.avatar || bal.user?.avatar ? (
                                  <img src={bal.avatar || bal.user?.avatar} alt={displayName} className="w-full h-full object-cover" />
                                ) : (
                                  avatarLetter
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-xs sm:text-sm text-[var(--text-primary)] truncate">{displayName}</p>
                                {displayEmail && (
                                  <p className="text-[10px] sm:text-[11px] text-[var(--text-muted)] truncate">{displayEmail}</p>
                                )}
                              </div>
                            </div>
                            
                            {isZero ? (
                              <span className="text-xs font-bold text-[var(--text-muted)]">Settled</span>
                            ) : isOwed ? (
                              <div>
                                <p className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ${
                                  isDark ? 'text-emerald-300' : 'text-emerald-800'
                                }`}>Owes you</p>
                                <p className={`text-xl sm:text-2xl font-black ${
                                  isDark ? 'text-emerald-400' : 'text-emerald-700'
                                }`}>{formatCurrency(bal.amount, userCurrency)}</p>
                              </div>
                            ) : (
                              <div>
                                <p className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ${
                                  isDark ? 'text-rose-300' : 'text-rose-800'
                                }`}>You owe</p>
                                <p className={`text-xl sm:text-2xl font-black ${
                                  isDark ? 'text-rose-400' : 'text-rose-700'
                                }`}>{formatCurrency(Math.abs(bal.amount), userCurrency)}</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className="col-span-full text-center py-14 text-[var(--text-muted)]">
                      <ArrowRightLeft size={36} className="mx-auto mb-3 opacity-50 text-emerald-500" />
                      <p className="font-bold text-sm text-[var(--text-primary)]">No balances to show.</p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">You are completely settled up!</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'settle' && (
                <SettleUpFlow 
                  transactions={settlements} 
                  onSettle={(tx) => requestSettleTransaction(tx)} 
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Share / Create Expense Modal */}
      {isShareModalOpen && (
        <ShareExpenseModal
          splitToEdit={editingSplit}
          onClose={(saved) => {
            setIsShareModalOpen(false);
            setEditingSplit(null);
            if (saved) fetchSplitsData();
          }}
        />
      )}

      {/* Double Confirmation Modal for Debt Settlements */}
      <AnimatePresence>
        {settleConfirmData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 glass-overlay overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 10 }}
              transition={{ type: 'spring', bounce: 0.18, duration: 0.35 }}
              className={`glass-card w-full max-w-md overflow-hidden p-5 sm:p-6 shadow-2xl relative my-auto border ${
                isDark ? 'border-emerald-400/30' : 'border-emerald-600/30 shadow-[#147D70]/10'
              }`}
            >
              {/* Header */}
              <div className={`flex items-center justify-between pb-3.5 mb-4 border-b ${
                isDark ? 'border-white/[0.08]' : 'border-emerald-600/15'
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl border ${
                    isDark 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30 shadow-[0_0_15px_rgba(16,185,129,0.25)]' 
                      : 'bg-[#EAF5F2] text-[#147D70] border-[#3BAE9F]/40 shadow-xs'
                  }`}>
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <h3 className={`text-base sm:text-lg font-black tracking-wide ${
                      isDark ? 'text-white' : 'text-[#07241E]'
                    }`}>
                      Confirm Settlement
                    </h3>
                    <p className={`text-[11px] font-medium ${
                      isDark ? 'text-emerald-300/80' : 'text-[#1F7669]'
                    }`}>
                      Double-check before marking debt as paid
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isSettling}
                  onClick={() => setSettleConfirmData(null)}
                  className={`p-1.5 rounded-xl transition-colors cursor-pointer glass-btn ${
                    isDark ? 'text-slate-400 hover:text-white' : 'text-emerald-800 hover:text-emerald-950'
                  }`}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Settlement Visual Breakdown */}
              <div className={`p-4 rounded-2xl mb-4 space-y-3 border ${
                isDark 
                  ? 'bg-black/35 border-white/10' 
                  : 'bg-[#E7F3ED] border-emerald-600/25 shadow-xs'
              }`}>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className={`flex-1 text-center p-2.5 rounded-xl border flex flex-col items-center justify-center ${
                    isDark 
                      ? 'bg-emerald-500/10 border-emerald-400/20' 
                      : 'bg-white border-emerald-600/25 shadow-xs'
                  }`}>
                    <span className={`text-[10px] block uppercase font-bold mb-1 ${
                      isDark ? 'text-slate-400' : 'text-[#4F736C]'
                    }`}>Payer</span>
                    <div className="flex items-center gap-1.5 max-w-full">
                      <div className="w-5 h-5 rounded-md overflow-hidden shrink-0 border border-emerald-500/30">
                        {settleConfirmData.fromAvatar ? (
                          <img src={settleConfirmData.fromAvatar} alt={settleConfirmData.fromName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[9px] font-bold bg-emerald-500/20 text-emerald-400">
                            {settleConfirmData.fromName?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        )}
                      </div>
                      <span className={`font-bold truncate text-xs ${
                        isDark ? 'text-white' : 'text-[#07241E]'
                      }`}>{settleConfirmData.fromName}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center px-1">
                    <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border shadow-xs ${
                      isDark 
                        ? 'text-emerald-300 bg-emerald-500/20 border-emerald-400/30' 
                        : 'text-emerald-950 bg-emerald-100 border-emerald-400/60 font-black'
                    }`}>
                      {formatCurrency(settleConfirmData.amount, userCurrency)}
                    </span>
                    <ArrowRight size={14} className={isDark ? 'text-emerald-400 mt-1' : 'text-emerald-600 mt-1'} />
                  </div>

                  <div className={`flex-1 text-center p-2.5 rounded-xl border flex flex-col items-center justify-center ${
                    isDark 
                      ? 'bg-emerald-500/10 border-emerald-400/20' 
                      : 'bg-white border-emerald-600/25 shadow-xs'
                  }`}>
                    <span className={`text-[10px] block uppercase font-bold mb-1 ${
                      isDark ? 'text-slate-400' : 'text-[#4F736C]'
                    }`}>Receiver</span>
                    <div className="flex items-center gap-1.5 max-w-full">
                      <div className="w-5 h-5 rounded-md overflow-hidden shrink-0 border border-emerald-500/30">
                        {settleConfirmData.toAvatar ? (
                          <img src={settleConfirmData.toAvatar} alt={settleConfirmData.toName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[9px] font-bold bg-emerald-500/20 text-emerald-400">
                            {settleConfirmData.toName?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        )}
                      </div>
                      <span className={`font-bold truncate text-xs ${
                        isDark ? 'text-white' : 'text-[#07241E]'
                      }`}>{settleConfirmData.toName}</span>
                    </div>
                  </div>
                </div>

                {settleConfirmData.description && (
                  <p className={`text-[11px] text-center pt-1 border-t ${
                    isDark ? 'text-slate-400 border-white/[0.05]' : 'text-[#4F736C] border-emerald-600/15'
                  }`}>
                    For: <strong className={isDark ? 'text-slate-200' : 'text-[#07241E]'}>{settleConfirmData.description}</strong>
                  </p>
                )}
              </div>

              <p className={`text-xs leading-relaxed mb-4 ${
                isDark ? 'text-slate-300' : 'text-[#07241E] font-medium'
              }`}>
                Are you sure you want to mark this balance of <strong className={isDark ? 'text-emerald-300' : 'text-emerald-800 font-bold'}>{formatCurrency(settleConfirmData.amount, userCurrency)}</strong> as fully settled? This will record the settlement, clear this debt from all balances, and update your ledger.
              </p>

              {settleError && (
                <div className="bg-rose-950/60 border border-rose-500/40 text-rose-200 rounded-xl p-3 mb-4 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle size={15} className="text-rose-400 shrink-0" />
                  <span>{settleError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2.5">
                <button
                  type="button"
                  disabled={isSettling}
                  onClick={() => setSettleConfirmData(null)}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs glass-btn cursor-pointer ${
                    isDark ? 'text-slate-300 hover:text-white' : 'text-emerald-950 hover:bg-emerald-100'
                  }`}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={isSettling}
                  onClick={executeSettlement}
                  className="flex-1 glass-btn-primary py-2.5 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 cursor-pointer disabled:opacity-50"
                >
                  {isSettling ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      <span>Yes, Confirm & Settle</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Splits;
