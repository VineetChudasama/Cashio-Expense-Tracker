import React from 'react';

const categoryColors = {
  Food: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]',
  Rent: 'bg-indigo-500/15 text-indigo-300 border-indigo-400/30 shadow-[0_0_10px_rgba(99,102,241,0.15)]',
  Transport: 'bg-amber-500/15 text-amber-300 border-amber-400/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]',
  Entertainment: 'bg-purple-500/15 text-purple-300 border-purple-400/30 shadow-[0_0_10px_rgba(168,85,247,0.15)]',
  Utilities: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/30 shadow-[0_0_10px_rgba(6,182,212,0.15)]',
  Shopping: 'bg-pink-500/15 text-pink-300 border-pink-400/30 shadow-[0_0_10px_rgba(236,72,153,0.15)]',
  Health: 'bg-rose-500/15 text-rose-300 border-rose-400/30 shadow-[0_0_10px_rgba(244,63,94,0.15)]',
  Education: 'bg-teal-500/15 text-teal-300 border-teal-400/30 shadow-[0_0_10px_rgba(20,184,166,0.15)]',
  Travel: 'bg-orange-500/15 text-orange-300 border-orange-400/30 shadow-[0_0_10px_rgba(249,115,22,0.15)]',
  Other: 'bg-slate-500/15 text-slate-300 border-slate-400/30 shadow-[0_0_10px_rgba(148,163,184,0.15)]'
};

const defaultColor = 'bg-slate-500/15 text-slate-300 border-slate-400/30';

const CategoryBadge = ({ category }) => {
  const colorClass = categoryColors[category] || defaultColor;
  
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border glass-badge backdrop-blur-md ${colorClass}`}>
      {category}
    </span>
  );
};

export default CategoryBadge;
