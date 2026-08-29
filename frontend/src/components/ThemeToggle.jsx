import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = ({ className = '', showLabel = false }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {showLabel && (
        <span className="text-xs font-bold tracking-wide text-[var(--text-muted)] select-none">
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </span>
      )}
      <button
        onClick={toggleTheme}
        type="button"
        className={`relative w-[60px] h-[30px] rounded-full p-1 transition-colors duration-300 flex items-center cursor-pointer outline-none focus:ring-2 focus:ring-emerald-400/50 shadow-inner ${
          isDark
            ? 'bg-[#061B16] border border-emerald-500/30 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]'
            : 'bg-[#D6E6DE] border border-emerald-600/25 shadow-[inset_0_2px_4px_rgba(0,0,0,0.12)]'
        }`}
        title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        aria-label="Toggle dark/light theme"
      >
        {/* Background icon indicator */}
        <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
          {/* Sun icon on left for light mode */}
          <Sun
            size={13}
            className={`transition-opacity duration-300 ${
              !isDark ? 'text-amber-600 opacity-100' : 'text-slate-600 opacity-0'
            }`}
          />
          {/* Moon + sparkle on right for dark mode */}
          <div className="flex items-center gap-0.5">
            <Moon
              size={12}
              className={`transition-opacity duration-300 ${
                isDark ? 'text-emerald-300 opacity-100' : 'text-slate-400 opacity-0'
              }`}
            />
          </div>
        </div>

        {/* Sliding Knob */}
        <motion.div
          layout
          transition={{ type: 'spring', stiffness: 520, damping: 32 }}
          animate={{ x: isDark ? 0 : 28 }}
          className={`w-[22px] h-[22px] rounded-full flex items-center justify-center relative z-10 shadow-md ${
            isDark
              ? 'bg-gradient-to-b from-white via-slate-100 to-slate-200 text-[#061B16] shadow-[0_2px_6px_rgba(0,0,0,0.5),0_0_8px_rgba(255,255,255,0.4)]'
              : 'bg-gradient-to-b from-[#0A2620] to-[#041511] text-emerald-300 shadow-[0_2px_6px_rgba(0,0,0,0.3)]'
          }`}
        >
          {isDark ? (
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_#34d399]"></span>
          )}
        </motion.div>
      </button>
    </div>
  );
};

export default ThemeToggle;
