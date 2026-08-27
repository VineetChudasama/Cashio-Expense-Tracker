import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const SettleUpFlow = ({ transactions, onSettle }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -15 },
    show: { opacity: 1, x: 0 }
  };

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-14 text-slate-400 glass-elevated p-8">
        <CheckCircle2 className="mx-auto text-emerald-400 mb-3 opacity-60" size={44} />
        <h3 className="text-base font-bold text-white">All settled up!</h3>
        <p className="text-xs text-slate-400 mt-1">There are no outstanding balances to settle right now.</p>
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      {transactions.map((tx, idx) => (
        <motion.div 
          variants={itemVariants} 
          key={idx} 
          className="glass-elevated p-4 lg:p-5 flex flex-col sm:flex-row justify-between items-center gap-4 hover:translate-x-1 border border-white/[0.06] hover:border-emerald-400/30 transition-all duration-200"
        >
          <div className="flex items-center gap-3 flex-1 w-full min-w-0">
            <div className="flex-1 glass-inset py-3 px-4 text-center font-bold text-sm text-white truncate">
              {tx.from?.name || tx.from}
            </div>
            
            <div className="flex flex-col items-center px-2 shrink-0">
              <span className="text-xs font-black bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full mb-1 border border-emerald-400/30 glass-badge">
                ${tx.amount.toFixed(2)}
              </span>
              <ArrowRight size={16} className="text-emerald-400" />
            </div>
            
            <div className="flex-1 glass-inset py-3 px-4 text-center font-bold text-sm text-white truncate">
              {tx.to?.name || tx.to}
            </div>
          </div>
          
          <button 
            onClick={() => onSettle(tx.to?.id || tx.toId)}
            className="w-full sm:w-auto glass-btn-primary px-5 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap shadow-md shadow-emerald-500/20"
          >
            Mark Settled
          </button>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default SettleUpFlow;
