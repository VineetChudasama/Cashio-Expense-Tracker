import React from 'react';
import { motion } from 'framer-motion';

const StatCard = ({ icon: Icon, label, value, subtext, color = 'emerald', variants }) => {
  const colorMap = {
    emerald: {
      badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-400/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]',
      glow: 'bg-emerald-500/15'
    },
    cyan: {
      badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/30 shadow-[0_0_20px_rgba(6,182,212,0.2)]',
      glow: 'bg-cyan-500/15'
    },
    amber: {
      badge: 'bg-amber-500/15 text-amber-300 border-amber-400/30 shadow-[0_0_20px_rgba(245,158,11,0.2)]',
      glow: 'bg-amber-500/15'
    },
    teal: {
      badge: 'bg-teal-500/15 text-teal-300 border-teal-400/30 shadow-[0_0_20px_rgba(20,184,166,0.2)]',
      glow: 'bg-teal-500/15'
    },
    indigo: {
      badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-400/30 shadow-[0_0_20px_rgba(99,102,241,0.2)]',
      glow: 'bg-indigo-500/15'
    }
  };

  const scheme = colorMap[color] || colorMap.emerald;

  return (
    <motion.div 
      variants={variants}
      className="glass-card p-6 flex items-start gap-4 hover:translate-y-[-3px] relative overflow-hidden group"
    >
      {/* Subtle top-corner gradient aura */}
      <div className={`absolute -top-8 -right-8 w-36 h-36 ${scheme.glow} rounded-full blur-2xl pointer-events-none opacity-40 group-hover:opacity-90 transition-opacity`}></div>

      <div className={`p-3.5 rounded-2xl border backdrop-blur-md ${scheme.badge} flex-shrink-0 relative z-10 transition-transform group-hover:scale-105`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0 relative z-10">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
        <h3 className="text-2xl lg:text-3xl font-black text-white tracking-tight drop-shadow-sm">{value}</h3>
        {subtext && (
          <p className="text-xs font-semibold text-emerald-300/90 mt-1 flex items-center gap-1">
            <span>{subtext}</span>
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default StatCard;
