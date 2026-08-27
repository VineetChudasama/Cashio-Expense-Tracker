import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Receipt, TrendingUp, Users, Lightbulb, LogOut, Menu, X, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Expenses', path: '/expenses', icon: Receipt },
    { name: 'Forecast', path: '/forecast', icon: TrendingUp },
    { name: 'Splits', path: '/splits', icon: Users },
    { name: 'Insights', path: '/insights', icon: Lightbulb },
  ];

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="relative flex h-screen overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] selection:bg-[#10B981]/30 selection:text-[#34D399]">
      {/* Ambient background light orbs for true Glassmorphic depth */}
      <div className="fixed top-[-10%] left-[15%] w-[45vw] h-[45vw] rounded-full bg-emerald-500/10 blur-[130px] pointer-events-none -z-10 animate-pulse duration-1000"></div>
      <div className="fixed bottom-[-10%] right-[10%] w-[40vw] h-[40vw] rounded-full bg-teal-600/10 blur-[140px] pointer-events-none -z-10"></div>
      <div className="fixed top-[40%] right-[25%] w-[30vw] h-[30vw] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none -z-10"></div>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#030F0D]/80 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-5 z-20 shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-[1px] shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-[#030F0D] rounded-xl flex items-center justify-center text-emerald-400">
              <Sparkles size={16} />
            </div>
          </div>
          <span className="text-xl font-black tracking-tight text-white">Flow</span>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
          className="p-2 rounded-xl glass-btn text-white"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-10 w-64 glass-sidebar transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col pt-16 md:pt-0`}>
        {/* Brand Logo */}
        <div className="hidden md:flex h-20 items-center px-6 gap-3 border-b border-white/[0.06]">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 p-[1.5px] shadow-lg shadow-emerald-500/25">
            <div className="w-full h-full bg-[#031512] rounded-2xl flex items-center justify-center text-emerald-300">
              <Sparkles size={20} className="animate-pulse" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black tracking-wider text-white">Flow</span>
            <span className="block text-[9px] uppercase font-extrabold tracking-[0.2em] text-emerald-400/90">FINANCE PRO</span>
          </div>
        </div>
        
        {/* Nav Links with Smooth Spring Sliding Pill Indicator */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === '/' 
              ? location.pathname === '/' 
              : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={closeMobileMenu}
                className="relative flex items-center gap-3.5 px-4 py-3 text-sm font-semibold transition-colors duration-200 z-10 rounded-2xl group outline-none"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeSidebarPill"
                    className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/25 via-emerald-500/15 to-teal-500/10 border border-emerald-400/35 border-t-emerald-300/50 shadow-[0_4px_20px_rgba(16,185,129,0.2),inset_0_1px_1px_rgba(255,255,255,0.2)] -z-10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <div className={`p-1.5 rounded-xl transition-colors duration-200 ${isActive ? 'bg-emerald-400/20 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]' : 'text-emerald-400/70 group-hover:text-emerald-300'}`}>
                  <Icon size={18} />
                </div>
                <span className={`tracking-wide transition-colors duration-200 ${isActive ? 'text-white font-bold' : 'text-slate-300 group-hover:text-white'}`}>
                  {item.name}
                </span>
              </NavLink>
            );
          })}
        </nav>

        {/* User profile card & Logout */}
        <div className="p-4 border-t border-white/[0.06] space-y-3">
          <NavLink
            to="/profile"
            onClick={closeMobileMenu}
            className={({ isActive }) =>
              `flex items-center justify-between p-2.5 rounded-2xl border transition-all duration-200 group ${
                isActive
                  ? 'bg-emerald-500/20 border-emerald-400/40 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                  : 'glass-elevated border-white/[0.08] hover:border-emerald-400/30 hover:translate-y-[-1px]'
              }`
            }
            title="View & Edit Profile"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 via-teal-700 to-teal-900 border border-emerald-400/30 flex items-center justify-center font-black text-white shadow-md shrink-0 group-hover:scale-105 transition-transform">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="overflow-hidden min-w-0">
                <p className="text-sm font-bold text-white truncate group-hover:text-emerald-300 transition-colors">
                  {user?.name || 'User'}
                </p>
                <p className="text-[11px] text-slate-400 truncate font-medium">
                  {user?.email || 'user@flow.app'}
                </p>
              </div>
            </div>
          </NavLink>

          <button
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-rose-300 bg-rose-950/25 hover:bg-rose-900/40 border border-rose-500/20 text-xs font-semibold glass-btn transition-colors"
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main content with smooth page transitions */}
      <div className="flex-1 flex flex-col md:ml-64 pt-16 md:pt-0 h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 glass-overlay z-0"
          onClick={closeMobileMenu}
        ></div>
      )}
    </div>
  );
};

export default Layout;
