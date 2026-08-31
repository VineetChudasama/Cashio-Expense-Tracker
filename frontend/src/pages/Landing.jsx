import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  Users, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  Lock, 
  CheckCircle2, 
  DollarSign, 
  Receipt, 
  Layers, 
  MailCheck,
  Globe,
  BellRing
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

const superpowers = [
  { text: "Clarity & Confidence", gradientDark: "from-emerald-400 via-teal-300 to-cyan-300", gradientLight: "from-[#147D70] via-[#3BAE9F] to-[#147D70]" },
  { text: "Predictive Intelligence", gradientDark: "from-teal-300 via-cyan-300 to-emerald-400", gradientLight: "from-[#147D70] via-[#3BAE9F] to-[#0D5950]" },
  { text: "Simplified Peer Splits", gradientDark: "from-cyan-300 via-emerald-400 to-teal-300", gradientLight: "from-[#3BAE9F] via-[#147D70] to-[#3BAE9F]" },
  { text: "Real-Time Spending Alerts", gradientDark: "from-emerald-400 via-teal-300 to-cyan-400", gradientLight: "from-[#147D70] via-[#3BAE9F] to-[#147D70]" },
  { text: "Bank-Grade Protection", gradientDark: "from-emerald-300 via-teal-400 to-cyan-400", gradientLight: "from-[#147D70] via-[#3BAE9F] to-[#147D70]" }
];

const Landing = () => {
  const { user } = useAuth();
  const { isDark, logoUrl } = useTheme();
  const [powerIndex, setPowerIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPowerIndex((prev) => (prev + 1) % superpowers.length);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    if (!window.location.hash) {
      window.scrollTo(0, 0);
    }
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } }
  };

  const realFeatures = [
    {
      icon: Receipt,
      title: "Smart Expense Tracking",
      description: "Log expenses with customizable categories, recurring interval tags, date-range filtering, and instant search pagination.",
      badge: "Core Engine"
    },
    {
      icon: TrendingUp,
      title: "30-Day Cash Flow Forecast",
      description: "Forward-looking predictive algorithms that detect recurring spending patterns and calculate projected financial trajectories.",
      badge: "Predictive Analytics"
    },
    {
      icon: Users,
      title: "Group Splits & Debt Simplification",
      description: "Split expenses with peers and automatically simplify group debts into the minimum possible transactions with 1-click settlement.",
      badge: "Peer Ledger"
    },
    {
      icon: BellRing,
      title: "Web Push & Real-Time Alerts",
      description: "Receive instant phone and desktop push notifications for budget limits (80%/100%), group bill splits, and daily expense reminders even when Cashio is closed.",
      badge: "Real-Time PWA"
    },
    {
      icon: Sparkles,
      title: "Actionable Financial Insights",
      description: "Automated anomaly detection identifies unusual spending spikes, category velocities, and actionable budget opportunities.",
      badge: "Intelligence"
    },
    {
      icon: ShieldCheck,
      title: "Bank-Grade OTP & Security",
      description: "Secure 6-digit email OTP verification via Supabase & Resend API with real-time password compliance and breached credential safeguards.",
      badge: "Security"
    },
    {
      icon: Globe,
      title: "Multi-Currency Preferences",
      description: "Seamlessly customize your personal workspace currency across USD ($), INR (₹), EUR (€), GBP (£), and more.",
      badge: "Personalization"
    },
    {
      icon: Layers,
      title: "Dual Luxury Glassmorphism Themes",
      description: "Switch seamlessly between deep Obsidian Emerald (Dark) and crisp Pearl Mint (Light) themes with custom 3D emblems.",
      badge: "Visual Craft"
    }
  ];

  return (
    <div className={`min-h-screen relative overflow-x-hidden selection:bg-[#10B981]/30 selection:text-[#34D399] transition-colors duration-300 ${
      isDark ? 'bg-[#030F0D] text-[#F8FAFC]' : 'bg-[#F4FAF8] text-[#07241E]'
    }`}>
      {/* Precision Dot Matrix Grid Overlay (z-0) */}
      <div 
        className="pointer-events-none fixed inset-0 z-0 opacity-60 transition-opacity duration-300"
        style={{
          backgroundImage: isDark
            ? 'radial-gradient(rgba(255, 255, 255, 0.18) 1.2px, transparent 1.2px)'
            : 'radial-gradient(rgba(20, 125, 112, 0.25) 1.2px, transparent 1.2px)',
          backgroundSize: '28px 28px',
          maskImage: 'radial-gradient(ellipse 90% 80% at 50% 30%, black 40%, transparent 90%)',
          WebkitMaskImage: 'radial-gradient(ellipse 90% 80% at 50% 30%, black 40%, transparent 90%)'
        }}
      />

      {/* Navigation Header */}
      <header className={`sticky top-0 z-40 w-full backdrop-blur-2xl border-b transition-colors duration-300 ${
        isDark 
          ? 'bg-[#030F0D]/85 border-white/[0.08]' 
          : 'bg-[#F4FAF8]/90 border-[#CDE9E3] shadow-xs'
      }`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group shrink-0">
            <img 
              src={logoUrl} 
              alt="Cashio Logo" 
              className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-[0_0_12px_rgba(16,185,129,0.35)] group-hover:scale-105 transition-transform shrink-0" 
            />
            <div>
              <span className="text-xl sm:text-2xl font-black tracking-wider">
                Cash<span className={isDark ? "text-emerald-400" : "text-[#10B981]"}>io</span>
              </span>
              <span className={`block text-[8px] sm:text-[9px] uppercase font-extrabold tracking-[0.22em] ${
                isDark ? 'text-slate-400' : 'text-[#5A7A73]'
              }`}>FINANCE PRO</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold">
            <a href="#features" className={`transition-colors ${
              isDark ? 'text-slate-300 hover:text-white' : 'text-[#133E35] hover:text-[#147D70]'
            }`}>Features</a>
            <a href="#forecast" className={`transition-colors ${
              isDark ? 'text-slate-300 hover:text-white' : 'text-[#133E35] hover:text-[#147D70]'
            }`}>Forecast & AI</a>
            <a href="#splits" className={`transition-colors ${
              isDark ? 'text-slate-300 hover:text-white' : 'text-[#133E35] hover:text-[#147D70]'
            }`}>Splits & Settle</a>
            <a href="#security" className={`transition-colors ${
              isDark ? 'text-slate-300 hover:text-white' : 'text-[#133E35] hover:text-[#147D70]'
            }`}>Security</a>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <div className="scale-90 sm:scale-100 origin-right shrink-0">
              <ThemeToggle showLabel={false} />
            </div>
            
            {user ? (
              <Link
                to="/dashboard"
                className="glass-btn-primary px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 sm:gap-2 shadow-lg shrink-0"
              >
                <span>Dashboard</span>
                <ArrowRight size={14} />
              </Link>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <Link
                  to="/login"
                  className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-colors shrink-0 ${
                    isDark 
                      ? 'text-slate-200 hover:text-white hover:bg-white/5' 
                      : 'text-[#07241E] hover:bg-[#E8F4F1] hover:text-[#147D70]'
                  }`}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="glass-btn-primary px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-xl font-bold text-xs flex items-center gap-1 sm:gap-2 shadow-lg shrink-0"
                >
                  <span>Get Started</span>
                  <ArrowRight size={13} className="hidden sm:inline" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="min-h-[calc(100vh-5rem)] flex flex-col justify-center relative py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl mx-auto space-y-6"
        >
          {/* Top Pill Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-extrabold tracking-wide shadow-sm ${
            isDark 
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' 
              : 'border-[#CDE9E3] bg-[#E8F4F1] text-[#147D70]'
          }`}>
            <Sparkles size={14} className={isDark ? 'text-emerald-400' : 'text-[#147D70]'} />
            <span>Intelligent Expense Tracking, Predictive Forecasting & Bill Splits</span>
          </div>

          {/* Kinetic Morphing Headline */}
          <div className="space-y-1 sm:space-y-2">
            <motion.h1 
              initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08]"
            >
              Master Your Money with
            </motion.h1>

            <div className="min-h-[1.7em] sm:min-h-[1.6em] flex items-center justify-center overflow-hidden relative px-2 py-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={powerIndex}
                  initial={{ y: 55, opacity: 0, filter: 'blur(12px)', rotateX: -30 }}
                  animate={{ y: 0, opacity: 1, filter: 'blur(0px)', rotateX: 0 }}
                  exit={{ y: -55, opacity: 0, filter: 'blur(12px)', rotateX: 30 }}
                  transition={{ 
                    duration: 0.55, 
                    ease: [0.22, 1, 0.36, 1] 
                  }}
                  className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.15] flex items-center justify-center py-1"
                >
                  <span className={`bg-clip-text text-transparent bg-gradient-to-r animate-text-shimmer ${
                    isDark ? superpowers[powerIndex].gradientDark : superpowers[powerIndex].gradientLight
                  }`}>
                    {superpowers[powerIndex].text}
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Subheading */}
          <p className={`text-sm sm:text-base lg:text-lg max-w-2xl mx-auto font-medium leading-relaxed ${
            isDark ? 'text-slate-300' : 'text-[#133E35]'
          }`}>
            Cashio combines precise category tracking, automated 30-day cash flow predictions, debt-simplified peer splits, and bank-grade dual-layer OTP security in one luxury workspace.
          </p>

          {/* Hero Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2">
            {user ? (
              <Link
                to="/dashboard"
                className="w-full sm:w-auto glass-btn-primary px-8 py-4 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl"
              >
                <span>Enter Your Dashboard</span>
                <ArrowRight size={18} />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="w-full sm:w-auto glass-btn-primary px-8 py-4 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl hover:scale-[1.02] transition-transform"
                >
                  <span>Create Free Account</span>
                  <ArrowRight size={18} />
                </Link>
                <Link
                  to="/login"
                  className={`w-full sm:w-auto px-7 py-4 rounded-2xl font-bold text-sm sm:text-base border flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.05] active:scale-[0.98] cursor-pointer ${
                    isDark 
                      ? 'glass-elevated border-white/10 hover:border-emerald-400 hover:bg-emerald-500/15 hover:shadow-[0_0_24px_rgba(16,185,129,0.4)] text-white' 
                      : 'bg-[#E8F4F1] border-[#CDE9E3] text-[#07241E] hover:bg-white hover:border-[#147D70] hover:text-[#147D70] hover:shadow-[0_0_24px_rgba(20,125,112,0.3)] shadow-sm'
                  }`}
                >
                  <span>Sign In</span>
                </Link>
              </>
            )}
          </div>
        </motion.div>
      </section>

      {/* Real Feature Grid Section */}
      <section id="features" className={`min-h-[calc(100vh-5rem)] flex flex-col justify-center py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t scroll-mt-20 ${
        isDark ? 'border-white/[0.06]' : 'border-[#CDE9E3]'
      }`}>
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <span className={`text-xs font-extrabold uppercase tracking-[0.2em] ${
            isDark ? 'text-emerald-400' : 'text-[#147D70]'
          }`}>
            What You Can Do
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Every Feature Built for Real Financial Clarity
          </h2>
          <p className={`text-xs sm:text-sm font-medium ${
            isDark ? 'text-slate-300' : 'text-[#133E35]'
          }`}>
            Everything you see here is implemented directly inside your Cashio workspace.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5"
        >
          {realFeatures.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div
                variants={itemVariants}
                key={idx}
                className={`glass-card p-5 sm:p-6 rounded-2xl border transition-all duration-300 group flex flex-col justify-between ${
                  isDark 
                    ? 'border-white/[0.08] hover:border-emerald-400/40' 
                    : 'border-[#CDE9E3] hover:border-[#3BAE9F] bg-[#FFFFFF] shadow-sm'
                }`}
              >
                <div className="space-y-3.5">
                  <div className="flex justify-between items-start">
                    <div className={`w-11 h-11 rounded-xl border flex items-center justify-center group-hover:scale-110 transition-transform ${
                      isDark 
                        ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border-emerald-400/30 text-emerald-300' 
                        : 'bg-[#E8F4F1] border-[#CDE9E3] text-[#147D70] shadow-xs'
                    }`}>
                      <Icon size={20} />
                    </div>
                    <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                      isDark 
                        ? 'bg-white/5 text-slate-300 border-white/5' 
                        : 'bg-[#E8F4F1] text-[#147D70] border-[#CDE9E3] font-bold'
                    }`}>
                      {feat.badge}
                    </span>
                  </div>

                  <h3 className={`font-bold text-base transition-colors ${
                    isDark 
                      ? 'text-white group-hover:text-emerald-300' 
                      : 'text-[#07241E] group-hover:text-[#147D70]'
                  }`}>
                    {feat.title}
                  </h3>

                  <p className={`text-xs leading-relaxed font-medium ${
                    isDark ? 'text-slate-300' : 'text-[#133E35]'
                  }`}>
                    {feat.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* Feature Deep Dive: Forecast & AI */}
      <section id="forecast" className={`min-h-[calc(100vh-5rem)] flex flex-col justify-center py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t scroll-mt-20 ${
        isDark ? 'border-white/[0.06]' : 'border-[#CDE9E3]'
      }`}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div className="space-y-5 text-left">
            <span className={`text-xs font-extrabold uppercase tracking-[0.2em] ${
              isDark ? 'text-teal-400' : 'text-[#147D70]'
            }`}>
              Forward-Looking Predictions
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              30-Day Cash Flow Forecasting & Anomaly Alerts
            </h2>
            <p className={`text-xs sm:text-sm lg:text-base font-medium leading-relaxed ${
              isDark ? 'text-slate-300' : 'text-[#133E35]'
            }`}>
              Never be surprised by upcoming bills or subscription renewals. Cashio automatically scans transaction history to detect recurring cycles, project balance trajectories, and flag abnormal spending velocities before they become problems.
            </p>
            <ul className="space-y-3 text-xs sm:text-sm font-semibold">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={18} className={isDark ? 'text-emerald-400' : 'text-[#147D70]'} />
                <span>Automated pattern detection for rent, utilities, and subscriptions</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={18} className={isDark ? 'text-emerald-400' : 'text-[#147D70]'} />
                <span>30-day forward projection with high and low variance bands</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={18} className={isDark ? 'text-emerald-400' : 'text-[#147D70]'} />
                <span>Actionable category savings intelligence</span>
              </li>
            </ul>
          </div>

          {/* Interactive Visual Card */}
          <div className={`glass-card p-6 sm:p-8 rounded-3xl border space-y-5 ${
            isDark ? 'border-white/10' : 'border-[#CDE9E3] bg-[#FFFFFF] shadow-lg shadow-[#147D70]/10'
          }`}>
            <div className={`flex justify-between items-center border-b pb-4 ${
              isDark ? 'border-white/[0.06]' : 'border-[#CDE9E3]'
            }`}>
              <div className="flex items-center gap-2.5">
                <TrendingUp size={20} className={isDark ? 'text-emerald-400' : 'text-[#147D70]'} />
                <span className="font-bold text-base">Forecast Trajectory</span>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                isDark 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' 
                  : 'bg-[#E8F4F1] text-[#147D70] border-[#CDE9E3]'
              }`}>
                Next 30 Days
              </span>
            </div>
            <div className="space-y-2.5">
              <div className="flex justify-between text-xs sm:text-sm font-medium">
                <span className={isDark ? 'text-slate-300' : 'text-[#133E35]'}>Predicted Total Outflow</span>
                <span className="font-black text-lg">$1,890.00</span>
              </div>
              <div className={`w-full h-3 rounded-full overflow-hidden ${
                isDark ? 'bg-white/10' : 'bg-[#E8F4F1]'
              }`}>
                <div className="w-3/4 h-full bg-gradient-to-r from-[#147D70] to-[#3BAE9F] rounded-full"></div>
              </div>
            </div>
            <div className={`p-4 rounded-2xl border text-xs sm:text-sm font-medium flex items-center gap-3 ${
              isDark 
                ? 'bg-emerald-950/40 border-emerald-500/25 text-emerald-300' 
                : 'bg-[#E8F4F1] border-[#CDE9E3] text-[#147D70]'
            }`}>
              <Sparkles size={18} className="shrink-0" />
              <span>Recurring utility bill ($120.00) anticipated on the 5th of next month.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Deep Dive: Splits & Debt Simplification */}
      <section id="splits" className={`min-h-[calc(100vh-5rem)] flex flex-col justify-center py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t scroll-mt-20 ${
        isDark ? 'border-white/[0.06]' : 'border-[#CDE9E3]'
      }`}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div className={`order-2 lg:order-1 glass-card p-6 sm:p-8 rounded-3xl border space-y-4 ${
            isDark ? 'border-white/10' : 'border-[#CDE9E3] bg-[#FFFFFF] shadow-lg shadow-[#147D70]/10'
          }`}>
            <div className={`flex justify-between items-center border-b pb-4 ${
              isDark ? 'border-white/[0.06]' : 'border-[#CDE9E3]'
            }`}>
              <div className="flex items-center gap-2.5">
                <Users size={20} className={isDark ? 'text-emerald-400' : 'text-[#147D70]'} />
                <span className="font-bold text-base">Simplified Settle Ledger</span>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                isDark 
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30' 
                  : 'bg-[#E8F4F1] text-[#147D70] border-[#CDE9E3]'
              }`}>
                Optimized
              </span>
            </div>
            <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs sm:text-sm ${
              isDark ? 'glass-elevated' : 'bg-[#E8F4F1] border-[#CDE9E3]'
            }`}>
              <span className="font-bold">Alex Pays You</span>
              <span className={`font-black ${isDark ? 'text-emerald-400' : 'text-[#147D70]'}`}>$45.00</span>
              <span className={`px-2.5 py-1 rounded-lg font-bold text-xs border ${
                isDark 
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-400/30' 
                  : 'bg-[#FFFFFF] text-[#147D70] border-[#CDE9E3]'
              }`}>
                Pending
              </span>
            </div>
            <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs sm:text-sm ${
              isDark ? 'glass-elevated' : 'bg-[#E8F4F1] border-[#CDE9E3]'
            }`}>
              <span className="font-bold">You Pay Sarah</span>
              <span className={`font-black ${isDark ? 'text-rose-400' : 'text-rose-700'}`}>$22.50</span>
              <span className="px-3 py-1 rounded-lg bg-[#147D70] text-white font-bold text-xs shadow-xs">
                Mark Settled
              </span>
            </div>
          </div>

          <div className="order-1 lg:order-2 space-y-5 text-left">
            <span className={`text-xs font-extrabold uppercase tracking-[0.2em] ${
              isDark ? 'text-cyan-400' : 'text-[#147D70]'
            }`}>
              Zero-Friction Peer Settlements
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Group Bill Splits with Automated Debt Simplification
            </h2>
            <p className={`text-xs sm:text-sm lg:text-base font-medium leading-relaxed ${
              isDark ? 'text-slate-300' : 'text-[#133E35]'
            }`}>
              Stop calculating complex webs of group IOUs. Cashio runs a graph-based debt simplification algorithm (<code className={`font-mono text-xs sm:text-sm px-2 py-0.5 rounded border ${
                isDark ? 'bg-black/40 text-emerald-300 border-white/10' : 'bg-[#E8F4F1] text-[#147D70] border-[#CDE9E3]'
              }`}>simplifyDebts</code>) that automatically condenses multi-person balances into the smallest number of direct payments possible.
            </p>
            <ul className="space-y-3 text-xs sm:text-sm font-semibold">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={18} className={isDark ? 'text-emerald-400' : 'text-[#147D70]'} />
                <span>Equal and custom proportional bill sharing</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={18} className={isDark ? 'text-emerald-400' : 'text-[#147D70]'} />
                <span>Real-time credit and debit balances ledger</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={18} className={isDark ? 'text-emerald-400' : 'text-[#147D70]'} />
                <span>One-click transaction reconciliation</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Feature Deep Dive: Security & OTP */}
      <section id="security" className={`min-h-[calc(100vh-5rem)] flex flex-col justify-center py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t scroll-mt-20 ${
        isDark ? 'border-white/[0.06]' : 'border-[#CDE9E3]'
      }`}>
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
          <span className={`text-xs font-extrabold uppercase tracking-[0.2em] ${
            isDark ? 'text-emerald-400' : 'text-[#147D70]'
          }`}>
            Account Protection
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
            Dual-Layer Authentication & Breached Password Detection
          </h2>
          <p className={`text-xs sm:text-sm lg:text-base font-medium ${
            isDark ? 'text-slate-300' : 'text-[#133E35]'
          }`}>
            Your financial data is protected by industry-standard encryption and strict verification flows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 text-left">
          <div className={`glass-card p-6 sm:p-7 rounded-2xl border space-y-3.5 ${
            isDark ? 'border-white/[0.08]' : 'border-[#CDE9E3] bg-[#FFFFFF] shadow-sm'
          }`}>
            <MailCheck size={24} className={isDark ? 'text-emerald-400' : 'text-[#147D70]'} />
            <h3 className="font-bold text-lg">6-Digit Email OTP</h3>
            <p className={`text-xs sm:text-sm leading-relaxed font-medium ${
              isDark ? 'text-slate-300' : 'text-[#133E35]'
            }`}>
              Confidential, time-expiring 6-digit codes delivered via Resend & Supabase Auth for registration and authentication.
            </p>
          </div>

          <div className={`glass-card p-6 sm:p-7 rounded-2xl border space-y-3.5 ${
            isDark ? 'border-white/[0.08]' : 'border-[#CDE9E3] bg-[#FFFFFF] shadow-sm'
          }`}>
            <Lock size={24} className={isDark ? 'text-teal-400' : 'text-[#3BAE9F]'} />
            <h3 className="font-bold text-lg">10+ Char Password Rules</h3>
            <p className={`text-xs sm:text-sm leading-relaxed font-medium ${
              isDark ? 'text-slate-300' : 'text-[#133E35]'
            }`}>
              Real-time validation for uppercase, lowercase, numbers, and symbols, with live warnings for dictionary/breached passwords.
            </p>
          </div>

          <div className={`glass-card p-6 sm:p-7 rounded-2xl border space-y-3.5 ${
            isDark ? 'border-white/[0.08]' : 'border-[#CDE9E3] bg-[#FFFFFF] shadow-sm'
          }`}>
            <ShieldCheck size={24} className={isDark ? 'text-cyan-400' : 'text-[#147D70]'} />
            <h3 className="font-bold text-lg">Authorized Email Change</h3>
            <p className={`text-xs sm:text-sm leading-relaxed font-medium ${
              isDark ? 'text-slate-300' : 'text-[#133E35]'
            }`}>
              Email modifications require verification sent directly to your existing registered email to protect against unauthorized takeovers.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-20 pb-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`p-8 sm:p-14 lg:p-16 rounded-[36px] border text-center relative overflow-hidden transition-all duration-300 ${
          isDark 
            ? 'glass-card border-emerald-500/30 shadow-2xl shadow-emerald-950/40' 
            : 'bg-gradient-to-br from-[#E8F4F1] via-[#FFFFFF] to-[#E8F4F1] border-[#CDE9E3] shadow-2xl shadow-[#147D70]/10'
        }`}>
          {/* Ambient Glowing Orbs inside the Banner */}
          <div className={`absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl pointer-events-none ${
            isDark ? 'bg-emerald-500/20' : 'bg-[#3BAE9F]/20'
          }`}></div>
          <div className={`absolute -bottom-24 -right-24 w-80 h-80 rounded-full blur-3xl pointer-events-none ${
            isDark ? 'bg-teal-500/20' : 'bg-[#147D70]/15'
          }`}></div>

          {/* Decorative Subtle Background Grid */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--border)_1px,_transparent_1px)] bg-[size:24px_24px] opacity-25 pointer-events-none"></div>

          <div className="max-w-3xl mx-auto space-y-6 relative z-10">
            {/* Top Pill Tag */}
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-extrabold tracking-wide ${
              isDark 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                : 'bg-[#E8F4F1] border-[#CDE9E3] text-[#147D70]'
            }`}>
              <Sparkles size={14} className={isDark ? 'text-emerald-400' : 'text-[#147D70]'} />
              <span>Zero Setup Fees • Free Forever Personal Finance Pro</span>
            </div>

            {/* Main Headline with Gradient */}
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
              Ready to Master Your <br className="hidden sm:inline" />
              <span className={`bg-clip-text text-transparent ${
                isDark 
                  ? 'bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300' 
                  : 'bg-gradient-to-r from-[#147D70] via-[#3BAE9F] to-[#147D70]'
              }`}>Financial Clarity?</span>
            </h2>

            {/* Subtitle */}
            <p className={`text-xs sm:text-base font-medium max-w-xl mx-auto leading-relaxed ${
              isDark ? 'text-slate-300' : 'text-[#133E35]'
            }`}>
              Join Cashio today to experience predictive cash flow forecasts, simplified group split settlements, and bank-grade dual-layer OTP authentication.
            </p>

            {/* Dual CTA Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link
                to={user ? "/dashboard" : "/register"}
                className="w-full sm:w-auto glass-btn-primary px-8 py-4 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl hover:scale-[1.02] transition-transform"
              >
                <span>{user ? "Enter Your Dashboard" : "Get Started Now"}</span>
                <ArrowRight size={18} />
              </Link>
              {!user && (
                <Link
                  to="/login"
                  className={`w-full sm:w-auto px-7 py-4 rounded-2xl font-bold text-sm sm:text-base border flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.05] active:scale-[0.98] cursor-pointer ${
                    isDark 
                      ? 'glass-elevated border-white/10 hover:border-emerald-400 hover:bg-emerald-500/15 hover:shadow-[0_0_24px_rgba(16,185,129,0.4)] text-white' 
                      : 'bg-white border-[#CDE9E3] text-[#07241E] hover:bg-[#E8F4F1] hover:border-[#147D70] hover:text-[#147D70] hover:shadow-[0_0_24px_rgba(20,125,112,0.3)] shadow-sm'
                  }`}
                >
                  <span>Sign In</span>
                </Link>
              )}
            </div>

            {/* Trust Checklist Badges */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className={isDark ? 'text-emerald-400' : 'text-[#147D70]'} />
                <span className={isDark ? 'text-slate-300' : 'text-[#133E35]'}>Instant 6-Digit Email OTP</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className={isDark ? 'text-emerald-400' : 'text-[#147D70]'} />
                <span className={isDark ? 'text-slate-300' : 'text-[#133E35]'}>Automated Debt Simplification</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className={isDark ? 'text-emerald-400' : 'text-[#147D70]'} />
                <span className={isDark ? 'text-slate-300' : 'text-[#133E35]'}>Multi-Currency Support</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className={isDark ? 'text-emerald-400' : 'text-[#147D70]'} />
                <span className={isDark ? 'text-slate-300' : 'text-[#133E35]'}>Background Push Notifications</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Card Luxury Footer */}
      <footer className="relative pt-6 sm:pt-8 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Ambient Brand Watermark spanning the exact full width of the box with bottom fade-out */}
        <div className="w-full overflow-hidden select-none pointer-events-none -mb-6 sm:-mb-14 relative z-0 flex justify-center">
          <svg 
            viewBox="0 0 1000 180" 
            className={`w-full h-100 select-none pointer-events-none transition-all duration-300 ${
              isDark 
                ? 'drop-shadow-[0_0_28px_rgba(52,211,153,0.35)] drop-shadow-[0_0_10px_rgba(52,211,153,0.25)]' 
                : 'drop-shadow-[0_0_28px_rgba(121,212,195,0.6)] drop-shadow-[0_0_10px_rgba(1,63,64,0.25)]'
            }`}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="cashFade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isDark ? '#E2E8F0' : '#013f40'} stopOpacity={isDark ? '0.45' : '0.42'} />
                <stop offset="55%" stopColor={isDark ? '#E2E8F0' : '#013f40'} stopOpacity={isDark ? '0.22' : '0.18'} />
                <stop offset="92%" stopColor={isDark ? '#E2E8F0' : '#013f40'} stopOpacity="0" />
              </linearGradient>
              <linearGradient id="ioFade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isDark ? '#34D399' : '#79d4c3'} stopOpacity={isDark ? '0.75' : '0.65'} />
                <stop offset="55%" stopColor={isDark ? '#34D399' : '#79d4c3'} stopOpacity={isDark ? '0.38' : '0.28'} />
                <stop offset="92%" stopColor={isDark ? '#34D399' : '#79d4c3'} stopOpacity="0" />
              </linearGradient>
            </defs>
            <text
              x="0"
              y="155"
              textLength="1000"
              lengthAdjust="spacingAndGlyphs"
              fontFamily="Array-BoldWide, sans-serif"
              fontWeight="700"
              fontSize="175"
            >
              <tspan fill="url(#cashFade)">Cash</tspan>
              <tspan fill="url(#ioFade)">io</tspan>
            </text>
          </svg>
        </div>

        <div className={`p-8 -mt-25 sm:p-12 lg:p-14 rounded-[32px] border relative z-10 transition-colors duration-300 ${
          isDark 
            ? 'glass-card border-white/10 shadow-2xl shadow-black/60' 
            : 'bg-white/95 border-[#CDE9E3] shadow-xl shadow-[#147D70]/8'
        }`}>
          {/* Top Row: Brand & Multi-Column Links */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 pb-10">
            {/* Left Brand Summary & Socials (5 Cols) */}
            <div className="lg:col-span-5 space-y-5">
              <Link to="/" className="inline-flex items-center gap-3 group">
                <img 
                  src={logoUrl} 
                  alt="Cashio Logo" 
                  className="w-10 h-10 object-contain drop-shadow-[0_0_12px_rgba(16,185,129,0.35)] group-hover:scale-105 transition-transform" 
                />
                <div>
                  <span className="text-2xl font-black tracking-wider">
                    Cash<span className={isDark ? "text-emerald-400" : "text-[#10B981]"}>io</span>
                  </span>
                  <span className={`block text-[9px] uppercase font-extrabold tracking-[0.22em] ${
                    isDark ? 'text-slate-400' : 'text-[#5A7A73]'
                  }`}>FINANCE PRO</span>
                </div>
              </Link>

              <p className={`text-xs sm:text-sm font-medium leading-relaxed max-w-sm ${
                isDark ? 'text-slate-300' : 'text-[#133E35]'
              }`}>
                Cashio empowers individuals and teams to master their financial flow with predictive forecasting, intelligent expense tracking, and zero-friction bill settlements.
              </p>

              <div className="flex items-center gap-3 pt-1">
                <a 
                  href="https://github.com/VineetChudasama/Cashio-Expense-Tracker" 
                  target="_blank" 
                  rel="noreferrer" 
                  aria-label="GitHub"
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
                    isDark 
                      ? 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:border-emerald-400/40 hover:bg-emerald-500/10' 
                      : 'bg-[#E8F4F1] border-[#CDE9E3] text-[#147D70] hover:text-[#07241E] hover:bg-[#CDE9E3]'
                  }`}
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
              <div className="space-y-3.5">
                <h4 className={`text-xs font-bold uppercase tracking-wider ${
                  isDark ? 'text-white' : 'text-[#07241E] font-black'
                }`}>
                  Services
                </h4>
                <ul className="space-y-2.5 text-xs font-medium">
                  <li>
                    <a href="#features" className={`transition-colors ${
                      isDark ? 'text-slate-400 hover:text-white' : 'text-[#133E35] hover:text-[#147D70]'
                    }`}>
                      Expense Tracking
                    </a>
                  </li>
                  <li>
                    <a href="#forecast" className={`transition-colors ${
                      isDark ? 'text-slate-400 hover:text-white' : 'text-[#133E35] hover:text-[#147D70]'
                    }`}>
                      Cash Flow Forecast
                    </a>
                  </li>
                  <li>
                    <a href="#splits" className={`transition-colors ${
                      isDark ? 'text-slate-400 hover:text-white' : 'text-[#133E35] hover:text-[#147D70]'
                    }`}>
                      Group Bill Splits
                    </a>
                  </li>
                  <li>
                    <a href="#features" className={`transition-colors ${
                      isDark ? 'text-slate-400 hover:text-white' : 'text-[#133E35] hover:text-[#147D70]'
                    }`}>
                      Financial Insights
                    </a>
                  </li>
                </ul>
              </div>

              <div className="space-y-3.5">
                <h4 className={`text-xs font-bold uppercase tracking-wider ${
                  isDark ? 'text-white' : 'text-[#07241E] font-black'
                }`}>
                  Resources
                </h4>
                <ul className="space-y-2.5 text-xs font-medium">
                  <li>
                    <a href="#forecast" className={`transition-colors ${
                      isDark ? 'text-slate-400 hover:text-white' : 'text-[#133E35] hover:text-[#147D70]'
                    }`}>
                      Predictive Model
                    </a>
                  </li>
                  <li>
                    <a href="#splits" className={`transition-colors ${
                      isDark ? 'text-slate-400 hover:text-white' : 'text-[#133E35] hover:text-[#147D70]'
                    }`}>
                      Debt Simplifier
                    </a>
                  </li>
                  <li>
                    <a href="#security" className={`transition-colors ${
                      isDark ? 'text-slate-400 hover:text-white' : 'text-[#133E35] hover:text-[#147D70]'
                    }`}>
                      Security & OTP
                    </a>
                  </li>
                  <li>
                    <a href="#features" className={`transition-colors ${
                      isDark ? 'text-slate-400 hover:text-white' : 'text-[#133E35] hover:text-[#147D70]'
                    }`}>
                      Multi-Currency
                    </a>
                  </li>
                </ul>
              </div>

              <div className="space-y-3.5 col-span-2 sm:col-span-1">
                <h4 className={`text-xs font-bold uppercase tracking-wider ${
                  isDark ? 'text-white' : 'text-[#07241E] font-black'
                }`}>
                  Platform
                </h4>
                <ul className="space-y-2.5 text-xs font-medium">
                  <li>
                    <Link to="/dashboard" className={`transition-colors ${
                      isDark ? 'text-slate-400 hover:text-white' : 'text-[#133E35] hover:text-[#147D70]'
                    }`}>
                      Workspace
                    </Link>
                  </li>
                  <li>
                    <Link to="/login" className={`transition-colors ${
                      isDark ? 'text-slate-400 hover:text-white' : 'text-[#133E35] hover:text-[#147D70]'
                    }`}>
                      Sign In
                    </Link>
                  </li>
                  <li>
                    <Link to="/register" className={`transition-colors ${
                      isDark ? 'text-slate-400 hover:text-white' : 'text-[#133E35] hover:text-[#147D70]'
                    }`}>
                      Get Started
                    </Link>
                  </li>
                  <li>
                    <Link to="/privacy" className={`transition-colors ${
                      isDark ? 'text-slate-400 hover:text-white' : 'text-[#133E35] hover:text-[#147D70]'
                    }`}>
                      Privacy & Protection
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className={`pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium ${
            isDark ? 'border-white/[0.08]' : 'border-[#CDE9E3]'
          }`}>
            <span className={isDark ? 'text-slate-400' : 'text-[#133E35]'}>
              &copy; {new Date().getFullYear()} Cashio. All rights reserved.
            </span>

            <div className="flex items-center gap-5 sm:gap-6">
              <Link to="/privacy" className={`transition-colors ${
                isDark ? 'text-slate-400 hover:text-white' : 'text-[#133E35] hover:text-[#147D70]'
              }`}>
                Privacy Policy
              </Link>
              <Link to="/terms" className={`transition-colors ${
                isDark ? 'text-slate-400 hover:text-white' : 'text-[#133E35] hover:text-[#147D70]'
              }`}>
                Terms of Service
              </Link>
              <ThemeToggle showLabel={false} />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
