import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Users, 
  ShieldCheck, 
  PieChart, 
  Sparkles, 
  ArrowRight, 
  Lock, 
  CheckCircle2, 
  DollarSign, 
  Calendar, 
  Receipt, 
  Layers, 
  SlidersHorizontal,
  MailCheck,
  Globe
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

const Landing = () => {
  const { user } = useAuth();
  const { isDark, logoUrl } = useTheme();
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
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
      icon: Sparkles,
      title: "Actionable Financial Insights",
      description: "Automated anomaly detection identifies unusual spending spikes, category velocities, and actionable budget opportunities.",
      badge: "Intelligence"
    },
    {
      icon: ShieldCheck,
      title: "Dual-Layer OTP Authentication",
      description: "Secure 6-digit email OTP verification via Supabase & Resend API for sign up, unverified login, email changes, and password resets.",
      badge: "Security"
    },
    {
      icon: Lock,
      title: "Password Strength & Breached Check",
      description: "Real-time 5-parameter password compliance meter with dictionary and breached credential list detection warnings.",
      badge: "Protection"
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
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] relative overflow-x-hidden selection:bg-[#10B981]/30 selection:text-[#34D399]">
      {/* Ambient Glassmorphic Background Orbs */}
      <div className="fixed top-[-15%] left-[10%] w-[50vw] h-[50vw] rounded-full bg-emerald-500/10 blur-[140px] pointer-events-none -z-10 animate-pulse duration-1000"></div>
      <div className="fixed bottom-[-15%] right-[5%] w-[45vw] h-[45vw] rounded-full bg-teal-600/10 blur-[150px] pointer-events-none -z-10"></div>
      <div className="fixed top-[45%] right-[20%] w-[35vw] h-[35vw] rounded-full bg-cyan-500/5 blur-[130px] pointer-events-none -z-10"></div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-2xl border-b border-white/[0.08] bg-[var(--bg-primary)]/80 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <img 
              src={logoUrl} 
              alt="Cashio Logo" 
              className="w-10 h-10 object-contain drop-shadow-[0_0_12px_rgba(16,185,129,0.4)] group-hover:scale-105 transition-transform" 
            />
            <div>
              <span className="text-2xl font-black tracking-wider text-[var(--text-primary)]">Cashio</span>
              <span className="block text-[9px] uppercase font-extrabold tracking-[0.22em] text-emerald-600 dark:text-emerald-400/90">FINANCE PRO</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-[var(--text-muted)]">
            <a href="#features" className="hover:text-[var(--text-primary)] transition-colors">Features</a>
            <a href="#forecast" className="hover:text-[var(--text-primary)] transition-colors">Forecast & AI</a>
            <a href="#splits" className="hover:text-[var(--text-primary)] transition-colors">Splits & Settle</a>
            <a href="#security" className="hover:text-[var(--text-primary)] transition-colors">Security</a>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-3">
            <ThemeToggle showLabel={false} />
            
            {user ? (
              <Link
                to="/dashboard"
                className="glass-btn-primary px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/25"
              >
                <span>Dashboard</span>
                <ArrowRight size={14} />
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold text-[var(--text-primary)] hover:text-emerald-500 dark:hover:text-emerald-300 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="glass-btn-primary px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/25"
                >
                  <span>Get Started</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl mx-auto space-y-6"
        >
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 text-xs font-extrabold tracking-wide shadow-sm">
            <Sparkles size={14} className="animate-pulse" />
            <span>Intelligent Expense Tracking, Predictive Forecasting & Bill Splits</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-[var(--text-primary)] leading-[1.08]">
            Master Your Money with <span className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 bg-clip-text text-transparent">Clarity & Confidence</span>
          </h1>

          {/* Subheading */}
          <p className="text-sm sm:text-base lg:text-lg text-[var(--text-muted)] max-w-2xl mx-auto font-medium leading-relaxed">
            Cashio combines precise category tracking, automated 30-day cash flow predictions, debt-simplified peer splits, and bank-grade dual-layer OTP security in one luxury workspace.
          </p>

          {/* Hero Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4">
            {user ? (
              <Link
                to="/dashboard"
                className="w-full sm:w-auto glass-btn-primary px-8 py-4 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-500/30"
              >
                <span>Enter Your Dashboard</span>
                <ArrowRight size={18} />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="w-full sm:w-auto glass-btn-primary px-8 py-4 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-500/30 hover:scale-[1.02] transition-transform"
                >
                  <span>Create Free Account</span>
                  <ArrowRight size={18} />
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto glass-elevated px-7 py-4 rounded-2xl font-bold text-sm sm:text-base border border-white/10 hover:border-emerald-400/40 text-[var(--text-primary)] flex items-center justify-center gap-2 transition-all"
                >
                  <span>Sign In</span>
                </Link>
              </>
            )}
          </div>
        </motion.div>

        {/* Live Interactive Hero UI Preview Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="mt-14 max-w-5xl mx-auto glass-card p-4 sm:p-7 border border-white/15 rounded-3xl shadow-2xl relative"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            {/* Live Metrics Column 1 */}
            <div className="glass-elevated p-4 rounded-2xl border border-white/[0.06] space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-[var(--text-muted)]">
                <span>Monthly Expenditure</span>
                <DollarSign size={16} className="text-emerald-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-[var(--text-primary)]">$2,450.80</p>
              <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-300 flex items-center gap-1">
                <span>✓ 5 Active Categories Analyzed</span>
              </div>
            </div>

            {/* Live Metrics Column 2 */}
            <div className="glass-elevated p-4 rounded-2xl border border-white/[0.06] space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-[var(--text-muted)]">
                <span>30-Day Forecast Run</span>
                <TrendingUp size={16} className="text-teal-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-teal-600 dark:text-teal-300">$1,890.00</p>
              <div className="text-[11px] font-bold text-[var(--text-muted)]">
                Pattern Recognition: 94% Confidence
              </div>
            </div>

            {/* Live Metrics Column 3 */}
            <div className="glass-elevated p-4 rounded-2xl border border-white/[0.06] space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-[var(--text-muted)]">
                <span>Simplified Peer Splits</span>
                <Users size={16} className="text-cyan-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-cyan-600 dark:text-cyan-300">3 Net Debts</p>
              <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-300">
                Debt Simplification Active
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Real Feature Grid Section */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-white/[0.06]">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
            What You Can Do
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-[var(--text-primary)] tracking-tight">
            Every Feature Built for Real Financial Clarity
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] font-medium">
            Everything you see here is implemented directly inside your Cashio workspace.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5"
        >
          {realFeatures.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div
                variants={itemVariants}
                key={idx}
                className="glass-card p-5 sm:p-6 rounded-2xl border border-white/[0.08] hover:border-emerald-400/40 transition-all duration-300 group flex flex-col justify-between"
              >
                <div className="space-y-3.5">
                  <div className="flex justify-between items-start">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-600 dark:text-emerald-300 group-hover:scale-110 transition-transform">
                      <Icon size={20} />
                    </div>
                    <span className="text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/5 text-[var(--text-muted)] border border-white/5">
                      {feat.badge}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-[var(--text-primary)] group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                    {feat.title}
                  </h3>

                  <p className="text-xs text-[var(--text-muted)] leading-relaxed font-medium">
                    {feat.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* Feature Deep Dive: Forecast & AI */}
      <section id="forecast" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-white/[0.06]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-5 text-left">
            <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-teal-600 dark:text-teal-400">
              Forward-Looking Predictions
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[var(--text-primary)] tracking-tight">
              30-Day Cash Flow Forecasting & Anomaly Alerts
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] font-medium leading-relaxed">
              Never be surprised by upcoming bills or subscription renewals. Cashio automatically scans transaction history to detect recurring cycles, project balance trajectories, and flag abnormal spending velocities before they become problems.
            </p>
            <ul className="space-y-2.5 text-xs font-semibold text-[var(--text-primary)]">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span>Automated pattern detection for rent, utilities, and subscriptions</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span>30-day forward projection with high and low variance bands</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span>Actionable category savings intelligence</span>
              </li>
            </ul>
          </div>

          {/* Interactive Visual Card */}
          <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
            <div className="flex justify-between items-center border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-emerald-400" />
                <span className="font-bold text-sm text-[var(--text-primary)]">Forecast Trajectory</span>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                Next 30 Days
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium text-[var(--text-muted)]">
                <span>Predicted Total Outflow</span>
                <span className="font-bold text-[var(--text-primary)]">$1,890.00</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                <div className="w-3/4 h-full bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full"></div>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-emerald-950/25 border border-emerald-500/20 text-xs text-emerald-300 font-medium flex items-center gap-2">
              <Sparkles size={15} className="shrink-0" />
              <span>Recurring utility bill ($120.00) anticipated on the 5th of next month.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Deep Dive: Splits & Debt Simplification */}
      <section id="splits" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-white/[0.06]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="order-2 lg:order-1 glass-card p-6 rounded-3xl border border-white/10 space-y-4">
            <div className="flex justify-between items-center border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-emerald-400" />
                <span className="font-bold text-sm text-[var(--text-primary)]">Simplified Settle Ledger</span>
              </div>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-bold px-2 py-0.5 rounded-full">
                Optimized
              </span>
            </div>
            <div className="glass-elevated p-3 rounded-xl border flex items-center justify-between text-xs">
              <span className="font-bold text-[var(--text-primary)]">Alex Pays You</span>
              <span className="font-black text-emerald-500 dark:text-emerald-400">$45.00</span>
              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 font-bold text-[10px]">
                Pending
              </span>
            </div>
            <div className="glass-elevated p-3 rounded-xl border flex items-center justify-between text-xs">
              <span className="font-bold text-[var(--text-primary)]">You Pay Sarah</span>
              <span className="font-black text-rose-500 dark:text-rose-400">$22.50</span>
              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                Mark Settled
              </span>
            </div>
          </div>

          <div className="order-1 lg:order-2 space-y-5 text-left">
            <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-400">
              Zero-Friction Peer Settlements
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[var(--text-primary)] tracking-tight">
              Group Bill Splits with Automated Debt Simplification
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] font-medium leading-relaxed">
              Stop calculating complex webs of group IOUs. Cashio runs a graph-based debt simplification algorithm (<code className="text-emerald-500 font-mono text-xs">simplifyDebts</code>) that automatically condenses multi-person balances into the smallest number of direct payments possible.
            </p>
            <ul className="space-y-2.5 text-xs font-semibold text-[var(--text-primary)]">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span>Equal and custom proportional bill sharing</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span>Real-time credit and debit balances ledger</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span>One-click transaction reconciliation</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Feature Deep Dive: Security & OTP */}
      <section id="security" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-white/[0.06]">
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
          <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
            Account Protection
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-[var(--text-primary)] tracking-tight">
            Dual-Layer Authentication & Breached Password Detection
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] font-medium">
            Your financial data is protected by industry-standard encryption and strict verification flows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
          <div className="glass-card p-5 sm:p-6 rounded-2xl border border-white/[0.08] space-y-3">
            <MailCheck size={22} className="text-emerald-400" />
            <h3 className="font-bold text-base text-[var(--text-primary)]">6-Digit Email OTP</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed font-medium">
              Confidential, time-expiring 6-digit codes delivered via Resend & Supabase Auth for registration and authentication.
            </p>
          </div>

          <div className="glass-card p-5 sm:p-6 rounded-2xl border border-white/[0.08] space-y-3">
            <Lock size={22} className="text-teal-400" />
            <h3 className="font-bold text-base text-[var(--text-primary)]">10+ Char Password Rules</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed font-medium">
              Real-time validation for uppercase, lowercase, numbers, and symbols, with live warnings for dictionary/breached passwords.
            </p>
          </div>

          <div className="glass-card p-5 sm:p-6 rounded-2xl border border-white/[0.08] space-y-3">
            <ShieldCheck size={22} className="text-cyan-400" />
            <h3 className="font-bold text-base text-[var(--text-primary)]">Authorized Email Change</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed font-medium">
              Email modifications require verification sent directly to your existing registered email to protect against unauthorized takeovers.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-card p-8 sm:p-14 rounded-3xl border border-emerald-500/30 text-center space-y-6 relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-5xl font-black text-[var(--text-primary)] tracking-tight">
              Ready to Upgrade Your Financial Workspace?
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] font-medium">
              Join Cashio today to experience intelligent forecasting, effortless splits, and beautiful dual-theme design.
            </p>
          </div>

          <div className="pt-2">
            <Link
              to="/register"
              className="inline-flex glass-btn-primary px-8 py-4 rounded-2xl font-bold text-sm sm:text-base items-center gap-2.5 shadow-xl shadow-emerald-500/30 hover:scale-[1.02] transition-transform"
            >
              <span>Get Started Now</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-10 bg-[var(--bg-primary)]/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-[var(--text-muted)]">
          <div className="flex items-center gap-2.5">
            <img src={logoUrl} alt="Cashio" className="w-6 h-6 object-contain" />
            <span>&copy; {new Date().getFullYear()} Cashio Smart Expense Tracker. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/login" className="hover:text-[var(--text-primary)] transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-[var(--text-primary)] transition-colors">Register</Link>
            <a href="#features" className="hover:text-[var(--text-primary)] transition-colors">Features</a>
            <ThemeToggle showLabel={false} />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
