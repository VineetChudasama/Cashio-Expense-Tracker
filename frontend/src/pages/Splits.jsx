import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, Receipt, ArrowRightLeft, Edit2, Trash2 } from 'lucide-react';
import { splits } from '../lib/api';
import SettleUpFlow from '../components/SettleUpFlow';
import ShareExpenseModal from '../components/ShareExpenseModal';
import { useAuth } from '../context/AuthContext';

const Splits = () => {
  const { user } = useAuth();
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

  const handleSettle = async (participantId) => {
    try {
      const res = await splits.settleParticipant(participantId);
      if (res.success) {
        fetchSplitsData();
      }
    } catch (err) {
      console.error("Failed to settle", err);
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
    <div className="space-y-7 max-w-7xl mx-auto pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Users className="text-emerald-400" />
            Split Expenses
          </h1>
          <p className="text-sm font-medium text-emerald-300/80 mt-0.5">Manage shared bills and peer-to-peer settlements</p>
        </div>
        
        {activeTab === 'shared' && (
          <button
            onClick={() => {
              setEditingSplit(null);
              setIsShareModalOpen(true);
            }}
            className="glass-btn-primary px-5 py-3 rounded-2xl font-bold flex items-center gap-2.5 shadow-lg shadow-emerald-500/25"
          >
            <UserPlus size={18} />
            <span>Share an Expense</span>
          </button>
        )}
      </div>

      {/* Main Container */}
      <div className="glass-card overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex border-b border-white/[0.06] bg-black/20 p-2 gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex-1 py-3 px-5 text-xs font-bold text-center rounded-xl whitespace-nowrap transition-colors duration-200 z-10 outline-none"
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="splitsActiveTabPill"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/25 via-emerald-500/15 to-teal-500/10 border border-emerald-400/35 border-t-emerald-300/50 shadow-[0_4px_16px_rgba(16,185,129,0.2),inset_0_1px_1px_rgba(255,255,255,0.2)] -z-10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span className={`tracking-wide transition-colors duration-200 ${activeTab === tab.id ? 'text-white font-bold' : 'text-slate-300 hover:text-white'}`}>
                {tab.label}
              </span>
            </button>
          ))}
        </div>

        <div className="p-6 lg:p-7">
          {loading ? (
            <div className="flex justify-center py-14">
              <div className="animate-spin rounded-full h-9 w-9 border-t-2 border-b-2 border-emerald-400"></div>
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
                          className="glass-elevated p-4 lg:p-5 flex justify-between items-center hover:translate-x-1 border border-white/[0.06] hover:border-emerald-400/30 transition-all duration-200 group"
                        >
                          <div className="min-w-0 flex-1 pr-4">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-sm lg:text-base text-white truncate">
                                {exp.expense?.description || 'Shared Expense'}
                              </h3>
                              {isCreator ? (
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30 font-bold glass-badge">
                                  Created by you
                                </span>
                              ) : (
                                <span className="text-[10px] bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full border border-teal-400/30 font-bold glass-badge">
                                  By {exp.createdBy?.name || 'Peer'}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 font-medium mt-1">
                              Total: ${exp.expense?.amount?.toFixed(2) || '0.00'} • {exp.participants?.length || 0} participant{exp.participants?.length === 1 ? '' : 's'}
                              {exp.participants?.length > 0 && (
                                <span className="ml-2 text-slate-400 hidden sm:inline">
                                  ({exp.participants.map(p => `${p.user?.name || 'User'}: $${p.amountOwed.toFixed(2)}`).join(', ')})
                                </span>
                              )}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-3 shrink-0">
                            {isCreator && (
                              <div className="flex items-center gap-1.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleEditSplit(exp)}
                                  className="p-2 rounded-xl text-slate-300 hover:text-white glass-btn transition-colors"
                                  title="Edit split participants and amounts"
                                >
                                  <Edit2 size={15} />
                                </button>
                                <button
                                  onClick={() => handleDeleteSplit(exp.id)}
                                  className="p-2 rounded-xl text-rose-300 hover:bg-rose-950/40 border border-rose-500/25 transition-colors glass-btn"
                                  title="Delete split"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            )}
                            <span className="text-xs font-bold bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-400/30 glass-badge">
                              Split
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-14 text-slate-400">
                      <Receipt size={40} className="mx-auto mb-3 opacity-40 text-emerald-400" />
                      <p className="font-bold text-sm text-white">You haven't shared any expenses yet.</p>
                      <button 
                        onClick={() => {
                          setEditingSplit(null);
                          setIsShareModalOpen(true);
                        }}
                        className="mt-3 text-xs font-bold text-emerald-400 hover:underline"
                      >
                        Click 'Share an Expense' to get started &rarr;
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'balances' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {balances.length > 0 ? (
                    balances.map((bal, idx) => {
                      const isOwed = bal.amount > 0;
                      const isZero = bal.amount === 0;
                      
                      return (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          key={idx} 
                          className={`p-5 rounded-2xl border backdrop-blur-xl ${
                            isZero ? 'glass-elevated border-white/[0.08]' :
                            isOwed ? 'bg-emerald-950/20 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]' : 
                            'bg-rose-950/20 border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.15)]'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-400/25 flex items-center justify-center font-bold text-white shadow-sm">
                              {bal.name?.charAt(0) || '?'}
                            </div>
                            <span className="font-bold text-sm text-white truncate">{bal.name || 'Unknown'}</span>
                          </div>
                          
                          <div className="mt-2">
                            {isZero ? (
                              <p className="text-slate-400 text-xs font-semibold">Settled up</p>
                            ) : isOwed ? (
                              <div>
                                <p className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">Owes you</p>
                                <p className="text-2xl font-black text-emerald-400">${Math.abs(bal.amount).toFixed(2)}</p>
                              </div>
                            ) : (
                              <div>
                                <p className="text-[11px] font-bold text-rose-300 uppercase tracking-wider">You owe</p>
                                <p className="text-2xl font-black text-rose-400">${Math.abs(bal.amount).toFixed(2)}</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className="col-span-full text-center py-14 text-slate-400">
                      <ArrowRightLeft size={36} className="mx-auto mb-3 opacity-40 text-emerald-400" />
                      <p className="font-bold text-sm text-white">No balances to show.</p>
                      <p className="text-xs text-slate-400 mt-1">You are completely settled up!</p>
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
