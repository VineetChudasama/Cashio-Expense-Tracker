import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, Receipt, ArrowRightLeft, Edit2, Trash2 } from 'lucide-react';
import { splits } from '../lib/api';
import SettleUpFlow from '../components/SettleUpFlow';
import ShareExpenseModal from '../components/ShareExpenseModal';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Splits = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('shared'); // shared, balances, settle
  const [sharedExpenses, setSharedExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [editingSplit, setEditingSplit] = useState(null);

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

  const handleSettle = async (txOrId) => {
    try {
      let res;
      if (typeof txOrId === 'object' && txOrId !== null) {
        const fromId = txOrId.fromUserId || txOrId.from?.id;
        const toId = txOrId.toUserId || txOrId.to?.id;
        res = await splits.settleTransaction({ fromUserId: fromId, toUserId: toId });
      } else {
        res = await splits.settleParticipant(txOrId);
      }
      if (res && res.success) {
        fetchSplitsData();
      }
    } catch (err) {
      console.error("Failed to settle", err);
      alert(err.response?.data?.error || "Failed to complete settlement");
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
    <div className="space-y-6 sm:space-y-7 max-w-7xl mx-auto pb-12 px-1 sm:px-0">
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
            className="w-full sm:w-auto glass-btn-primary px-5 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 text-xs sm:text-sm"
          >
            <UserPlus size={17} />
            <span>Share an Expense</span>
          </button>
        )}
      </div>

      {/* Main Container */}
      <div className="glass-card overflow-hidden">
        {/* Navigation Tabs */}
        <div className={`flex border-b p-1.5 sm:p-2 gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar ${
          isDark ? 'bg-[#031512]/60 border-white/[0.06]' : 'bg-[#DFECE5] border-emerald-600/20'
        }`}>
          {tabs.map((tab) => {
            const isTabActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex-1 py-2.5 sm:py-3 px-3 sm:px-5 text-xs font-bold text-center rounded-xl whitespace-nowrap transition-colors duration-200 z-10 outline-none min-w-[100px] ${
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
                <span className="relative z-10 tracking-wide">
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
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                                  isDark 
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' 
                                    : 'bg-emerald-100 text-emerald-900 border-emerald-300 shadow-xs'
                                }`}>
                                  Created by you
                                </span>
                              ) : (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                                  isDark 
                                    ? 'bg-teal-500/20 text-teal-300 border-teal-400/30' 
                                    : 'bg-teal-100 text-teal-900 border-teal-300 shadow-xs'
                                }`}>
                                  By {exp.createdBy?.name || 'Peer'}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[var(--text-muted)] font-medium">
                              Total: <span className="font-bold text-[var(--text-primary)]">${exp.expense?.amount?.toFixed(2) || '0.00'}</span> • {exp.participants?.length || 0} participant{exp.participants?.length === 1 ? '' : 's'}
                            </p>
                            {exp.participants?.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1.5">
                                {exp.participants.map(p => (
                                  <span 
                                    key={p.id} 
                                    className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-lg border font-medium ${
                                      isDark 
                                        ? 'bg-[#021411] text-slate-300 border-white/[0.06]' 
                                        : 'bg-white text-emerald-950 border-emerald-600/25 shadow-xs'
                                    }`}
                                  >
                                    <span>{p.user?.name || 'User'}: <strong className={isDark ? 'text-emerald-300 font-bold' : 'text-emerald-700 font-bold'}>${p.amountOwed.toFixed(2)}</strong></span>
                                    {p.settled ? (
                                      <span className="text-emerald-500 font-black" title="Settled">✓</span>
                                    ) : isCreator ? (
                                      <button
                                        onClick={() => handleSettle(p.id)}
                                        className="ml-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer bg-emerald-500/10 dark:bg-emerald-500/20 px-1.5 py-0.2 rounded"
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
                                  className="p-2 rounded-xl text-[var(--text-primary)] glass-btn transition-colors active:scale-95"
                                  title="Edit split participants and amounts"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteSplit(exp.id)}
                                  className="p-2 rounded-xl text-rose-500 dark:text-rose-300 hover:bg-rose-500/10 border border-rose-500/30 transition-colors glass-btn active:scale-95"
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
                        className="mt-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
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
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center font-bold text-white shadow-sm">
                              {bal.name?.charAt(0) || '?'}
                            </div>
                            <span className="font-bold text-sm text-[var(--text-primary)] truncate">{bal.name || 'Unknown'}</span>
                          </div>
                          
                          <div className="mt-2">
                            {isZero ? (
                              <p className="text-[var(--text-muted)] text-xs font-semibold">Settled up</p>
                            ) : isOwed ? (
                              <div>
                                <p className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ${
                                  isDark ? 'text-emerald-300' : 'text-emerald-800'
                                }`}>Owes you</p>
                                <p className={`text-xl sm:text-2xl font-black ${
                                  isDark ? 'text-emerald-400' : 'text-emerald-700'
                                }`}>${Math.abs(bal.amount).toFixed(2)}</p>
                              </div>
                            ) : (
                              <div>
                                <p className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ${
                                  isDark ? 'text-rose-300' : 'text-rose-800'
                                }`}>You owe</p>
                                <p className={`text-xl sm:text-2xl font-black ${
                                  isDark ? 'text-rose-400' : 'text-rose-700'
                                }`}>${Math.abs(bal.amount).toFixed(2)}</p>
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
                <SettleUpFlow transactions={settlements} onSettle={handleSettle} />
              )}
            </>
          )}
        </div>
      </div>

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
    </div>
  );
};

export default Splits;
