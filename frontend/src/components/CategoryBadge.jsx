import React from 'react';

const categoryColors = {
  Food: 'bg-emerald-100/90 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-400/30',
  Rent: 'bg-indigo-100/90 text-indigo-800 border-indigo-300 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-400/30',
  Transport: 'bg-amber-100/90 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-400/30',
  Entertainment: 'bg-purple-100/90 text-purple-800 border-purple-300 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-400/30',
  Utilities: 'bg-cyan-100/90 text-cyan-800 border-cyan-300 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-400/30',
  Shopping: 'bg-pink-100/90 text-pink-800 border-pink-300 dark:bg-pink-500/20 dark:text-pink-300 dark:border-pink-400/30',
  Health: 'bg-rose-100/90 text-rose-800 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-400/30',
  Education: 'bg-teal-100/90 text-teal-800 border-teal-300 dark:bg-teal-500/20 dark:text-teal-300 dark:border-teal-400/30',
  Travel: 'bg-orange-100/90 text-orange-800 border-orange-300 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-400/30',
  Other: 'bg-slate-100/90 text-slate-800 border-slate-300 dark:bg-slate-500/20 dark:text-slate-300 dark:border-slate-400/30'
};

const defaultColor = 'bg-slate-100/90 text-slate-800 border-slate-300 dark:bg-slate-500/20 dark:text-slate-300 dark:border-slate-400/30';

const CategoryBadge = ({ category }) => {
  const colorClass = categoryColors[category] || defaultColor;
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase border shadow-xs transition-colors shrink-0 ${colorClass}`}>
      {category}
    </span>
  );
};

export default CategoryBadge;
