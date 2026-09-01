import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowDown, CheckCircle2, Check, Clock } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/currency';

const SettleUpFlow = ({ transactions, onSettle }) => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const userCurrency = user?.currency || localStorage.getItem('flow_currency') || 'USD ($)';
  const [settlingIndex, setSettlingIndex] = useState(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  const handleMarkSettled = async (tx, idx) => {
    setSettlingIndex(idx);
    try {
      await onSettle(tx);
    } finally {
      setSettlingIndex(null);
    }
  };

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-14 text-[var(--text-muted)] glass-elevated p-6 sm:p-8 rounded-2xl">
        <CheckCircle2 className="mx-auto text-emerald-500 mb-3 opacity-70" size={40} />
        <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">All settled up!</h3>
        <p className="text-xs text-[var(--text-muted)] mt-1">There are no outstanding balances to settle right now.</p>
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-3.5"
    >
      {transactions.map((tx, idx) => {
        const fromName = tx.from?.name || (typeof tx.from === 'string' ? tx.from : 'User');
        const toName = tx.to?.name || (typeof tx.to === 'string' ? tx.to : 'User');
        const isSettling = settlingIndex === idx;

        // Security rule: Only the receiver who gets the money can confirm and settle
        const isReceiver = tx.toUserId === user?.id || 
                           tx.to?.id === user?.id || 
                           (typeof tx.to === 'string' && tx.to.toLowerCase() === 'you');

        return (
          <motion.div 
            variants={itemVariants} 
            key={idx} 
            className={`p-3.5 sm:p-5 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4 border rounded-2xl transition-all duration-200 ${
              isDark 
                ? 'glass-elevated border-white/[0.06] hover:border-emerald-400/30' 
                : 'bg-white border-emerald-600/25 hover:border-emerald-500 shadow-xs'
            }`}
          >
            {/* Peer to Peer settlement summary */}
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 flex-1 min-w-0">
              {/* From (Debtor) */}
              <div className={`w-full sm:flex-1 py-2.5 sm:py-3 px-3.5 text-center font-bold text-xs sm:text-sm truncate rounded-xl border ${
                isDark 
                  ? 'glass-inset text-white' 
                  : 'bg-[#E7F3ED] border-emerald-600/30 text-[#07241E] shadow-xs'
              }`}>
                <span className="text-[10px] block font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-0.5">PAYS</span>
                {fromName}
              </div>
              
              {/* Arrow & Amount */}
              <div className="flex sm:flex-col items-center justify-center gap-1.5 sm:gap-0 px-2 shrink-0 py-1 sm:py-0">
                <span className={`text-xs font-black px-3 py-1 rounded-full border shadow-sm ${
                  isDark 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' 
                    : 'bg-emerald-100 text-emerald-950 border-emerald-300 font-bold'
                }`}>
                  {formatCurrency(tx.amount, userCurrency)}
                </span>
                <span className="hidden sm:inline text-emerald-500 dark:text-emerald-400 mt-1">
                  <ArrowRight size={16} />
                </span>
                <span className="sm:hidden text-emerald-500 dark:text-emerald-400">
                  <ArrowDown size={14} />
                </span>
              </div>
              
              {/* To (Creditor) */}
              <div className={`w-full sm:flex-1 py-2.5 sm:py-3 px-3.5 text-center font-bold text-xs sm:text-sm truncate rounded-xl border ${
                isDark 
                  ? 'glass-inset text-white' 
                  : 'bg-[#E7F3ED] border-emerald-600/30 text-[#07241E] shadow-xs'
              }`}>
                <span className="text-[10px] block font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-0.5">RECEIVES</span>
                {toName}
              </div>
            </div>
            
            {/* Action button / Status badge */}
            {isReceiver ? (
              <button 
                onClick={() => handleMarkSettled(tx, idx)}
                disabled={isSettling}
                className="w-full sm:w-auto glass-btn-primary px-5 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap shadow-md shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                title="Confirm receipt of payment and mark as settled"
              >
                {isSettling ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Check size={14} strokeWidth={2.5} />
                )}
                <span>{isSettling ? 'Settling...' : 'Mark Received & Settle'}</span>
              </button>
            ) : (
              <div 
                className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border select-none ${
                  isDark
                    ? 'bg-white/5 border-white/10 text-slate-400'
                    : 'bg-[#EAF5F2] border-[#CEE8E1] text-[#4F736C]'
                }`}
                title={`Only ${toName} (the receiver) can confirm receiving payment and mark it as settled.`}
              >
                <Clock size={13} className="text-amber-500 dark:text-amber-400 shrink-0" />
                <span>Awaiting {toName} to Settle</span>
              </div>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default SettleUpFlow;
