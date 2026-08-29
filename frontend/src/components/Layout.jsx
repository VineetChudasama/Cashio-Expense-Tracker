import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Receipt, TrendingUp, Users, Lightbulb, LogOut, Menu, X, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from './ThemeToggle';

const Layout = () => {
  const { user, logout } = useAuth();
  const { isDark, logoUrl } = useTheme();
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

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  // Close menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="relative flex h-screen overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] selection:bg-[#10B981]/30 selection:text-[#34D399]">
      {/* Ambient background light orbs for true Glassmorphic depth */}
      <div className="fixed top-[-10%] left-[15%] w-[45vw] h-[45vw] rounded-full bg-emerald-500/10 blur-[130px] pointer-events-none -z-10 animate-pulse duration-1000"></div>
      <div className="fixed bottom-[-10%] right-[10%] w-[40vw] h-[40vw] rounded-full bg-teal-600/10 blur-[140px] pointer-events-none -z-10"></div>
      <div className="fixed top-[40%] right-[25%] w-[30vw] h-[30vw] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none -z-10"></div>

      {/* Mobile top navigation bar */}
      <header className={`md:hidden fixed top-0 left-0 right-0 h-16 backdrop-blur-2xl border-b flex items-center justify-between px-4 z-30 shadow-xl ${
        isDark ? 'bg-[#030F0D]/90 border-white/10' : 'bg-[#E2ECE6]/95 border-emerald-600/20'
      }`}>
        <div className="flex items-center gap-2.5">
          <img src={logoUrl} alt="Cashio Logo" className="w-8 h-8 object-contain drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
          <span className="text-xl font-black tracking-tight text-[var(--text-primary)]">Cashio</span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Mobile Theme Toggle Button */}
          <ThemeToggle />

          <NavLink
            to="/profile"
            className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center font-black text-xs text-[var(--text-primary)]"
            title="Profile"
          >
            {user?.name?.charAt(0).toUpperCase() || <User size={14} />}
          </NavLink>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="p-2 rounded-xl glass-btn text-[var(--text-primary)]"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Sidebar Drawer */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 md:w-64 glass-sidebar transform ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col pt-0`}>
        {/* Brand Logo */}
        <div className={`flex h-16 md:h-20 items-center justify-between md:justify-start px-6 gap-3 border-b ${
          isDark ? 'border-white/[0.06]' : 'border-emerald-600/20'
        }`}>
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="Cashio Logo" className="w-9 h-9 md:w-10 md:h-10 object-contain drop-shadow-[0_0_12px_rgba(16,185,129,0.35)]" />
            <div>
              <span className="text-xl md:text-2xl font-black tracking-wider text-[var(--text-primary)]">Cashio</span>
              <span className="block text-[8px] md:text-[9px] uppercase font-extrabold tracking-[0.2em] text-emerald-600 dark:text-emerald-400/90">FINANCE PRO</span>
            </div>
          </div>

          <button
            onClick={closeMobileMenu}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white glass-btn"
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Nav Links */}
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
                className={`relative flex items-center gap-3.5 px-4 py-3 text-sm font-semibold transition-colors duration-200 rounded-2xl group outline-none ${
                  isActive
                    ? isDark ? 'text-white' : 'text-emerald-950 font-bold'
                    : isDark ? 'text-slate-300 hover:text-white hover:bg-white/5' : 'text-emerald-900/80 hover:text-emerald-950 hover:bg-emerald-600/10 font-semibold'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeSidebarPill"
                    className={`absolute inset-0 rounded-2xl border transition-colors duration-200 z-0 pointer-events-none ${
                      isDark
                        ? 'bg-gradient-to-r from-emerald-500/25 via-emerald-500/15 to-teal-500/10 border-emerald-400/35 border-t-emerald-300/40 shadow-[0_4px_18px_rgba(16,185,129,0.25)]'
                        : 'bg-gradient-to-r from-emerald-600/20 via-emerald-600/15 to-teal-600/10 border-emerald-600/35 border-t-white shadow-[0_4px_14px_rgba(5,150,105,0.15)]'
                    }`}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <div className={`relative z-10 p-1.5 rounded-xl transition-colors duration-200 shrink-0 ${
                  isActive 
                    ? isDark 
                      ? 'bg-emerald-400/20 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.4)]' 
                      : 'bg-emerald-700/20 text-emerald-900 font-bold'
                    : isDark 
                      ? 'text-emerald-400/80 group-hover:text-emerald-300' 
                      : 'text-emerald-700 group-hover:text-emerald-950'
                }`}>
                  <Icon size={18} />
                </div>
                <span className="relative z-10 tracking-wide truncate">
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
                  {user?.email || 'user@cashio.app'}
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
      </aside>

      {/* Main content column with in-flow non-overlapping top header */}
      <div className="flex-1 flex flex-col md:ml-64 pt-16 md:pt-0 h-screen overflow-hidden">
        {/* Desktop Top Header Bar (Integrated in flow - NO overlap) */}
        <header className="hidden md:flex h-16 items-center justify-between px-8 border-b border-white/[0.06] bg-[var(--bg-primary)]/75 backdrop-blur-xl shrink-0 z-20">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[var(--text-muted)]">
              Cashio Smart Finance Workspace
            </span>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle showLabel={true} />
            <div className="h-5 w-[1px] bg-white/10"></div>
            <NavLink
              to="/profile"
              className="p-1.5 pl-2 pr-3 rounded-2xl glass-elevated border border-white/10 hover:border-emerald-400/30 flex items-center gap-2.5 transition-all duration-200 group shadow-sm"
              title="Account Profile"
            >
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center font-bold text-xs text-white">
                {user?.name?.charAt(0).toUpperCase() || <User size={13} />}
              </div>
              <span className="text-xs font-bold text-[var(--text-primary)] group-hover:text-emerald-400 transition-colors">
                {user?.name?.split(' ')[0] || 'Profile'}
              </span>
            </NavLink>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto px-3.5 py-4 sm:p-6 md:p-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
      
      {/* Mobile backdrop overlay */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 glass-overlay z-40"
          onClick={closeMobileMenu}
        />
      )}
    </div>
  );
};

export default Layout;
