import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowLeft, Lock, Eye, Server, UserCheck, RefreshCw } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

const PrivacyPolicy = () => {
  const { isDark, logoUrl } = useTheme();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className={`min-h-screen relative overflow-x-hidden selection:bg-[#10B981]/30 selection:text-[#34D399] transition-colors duration-300 ${
      isDark ? 'bg-[#030F0D] text-[#F8FAFC]' : 'bg-[#F4FAF8] text-[#07241E]'
    }`}>
      {/* Ambient background light orbs */}
      <div className={`fixed top-[-10%] left-[15%] w-[45vw] h-[45vw] rounded-full blur-[130px] pointer-events-none -z-10 ${
        isDark ? 'bg-emerald-500/10' : 'bg-[#3BAE9F]/15'
      }`}></div>
      <div className={`fixed bottom-[-10%] right-[10%] w-[40vw] h-[40vw] rounded-full blur-[140px] pointer-events-none -z-10 ${
        isDark ? 'bg-teal-600/10' : 'bg-[#147D70]/10'
      }`}></div>

      {/* Top Header */}
      <header className={`sticky top-0 z-40 w-full backdrop-blur-2xl border-b transition-colors duration-300 ${
        isDark ? 'bg-[#030F0D]/85 border-white/[0.08]' : 'bg-[#F4FAF8]/90 border-[#CDE9E3] shadow-xs'
      }`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group">
            <img 
              src={logoUrl} 
              alt="Cashio Logo" 
              className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-[0_0_12px_rgba(16,185,129,0.35)] group-hover:scale-105 transition-transform" 
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

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className={`px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                isDark 
                  ? 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:border-emerald-400/30' 
                  : 'bg-white border-[#CDE9E3] text-[#07241E] hover:text-[#147D70] shadow-xs'
              }`}
            >
              <ArrowLeft size={14} />
              <span>Back to Home</span>
            </Link>
            <ThemeToggle showLabel={false} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-10"
        >
          {/* Title Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck size={15} />
              <span>Trust & Privacy</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              Last updated: August 2026. Learn how Cashio protects, encrypts, and handles your financial data.
            </p>
          </div>

          {/* Privacy Cards */}
          <div className="glass-card p-6 sm:p-10 border border-white/10 rounded-3xl space-y-8 text-sm leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-lg font-black flex items-center gap-2 text-emerald-400">
                <Lock size={18} />
                1. Data Protection & Encryption
              </h2>
              <p className={isDark ? 'text-slate-300' : 'text-[#133E35]'}>
                At Cashio, data security and user privacy are foundational. All user passwords are encrypted with industrial-strength salted bcrypt algorithms. Sensitive credentials, verification codes, and transaction records are transmitted over strictly enforced TLS/SSL cryptographic protocols.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-black flex items-center gap-2 text-emerald-400">
                <Eye size={18} />
                2. Information We Collect
              </h2>
              <p className={isDark ? 'text-slate-300' : 'text-[#133E35]'}>
                We only collect data strictly necessary to provide intelligent personal expense tracking and bill splitting features:
              </p>
              <ul className={`list-disc list-inside space-y-1.5 pl-2 ${isDark ? 'text-slate-300' : 'text-[#133E35]'}`}>
                <li><strong>Account Data:</strong> Name, verified email address, and encrypted password credentials.</li>
                <li><strong>Financial Records:</strong> Expense categories, transaction amounts, dates, recurring intervals, and group split participants.</li>
                <li><strong>Preferences:</strong> Customized currency choice (USD, INR, EUR, GBP, etc.) and visual theme preferences.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-black flex items-center gap-2 text-emerald-400">
                <Server size={18} />
                3. How We Use Your Information
              </h2>
              <p className={isDark ? 'text-slate-300' : 'text-[#133E35]'}>
                Your data is exclusively used to:
              </p>
              <ul className={`list-disc list-inside space-y-1.5 pl-2 ${isDark ? 'text-slate-300' : 'text-[#133E35]'}`}>
                <li>Calculate financial charts, statistics, and monthly category distributions.</li>
                <li>Compute forward-looking 30-day predictive cash flow forecasts and recurring bill detection.</li>
                <li>Simplify peer-to-peer split balances with minimal cash flow transactions.</li>
                <li>Deliver one-time security authentication codes (OTP) for account verification and password resets.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-black flex items-center gap-2 text-emerald-400">
                <UserCheck size={18} />
                4. Third-Party Sharing
              </h2>
              <p className={isDark ? 'text-slate-300' : 'text-[#133E35]'}>
                <strong>We never sell or monetize your personal or financial data.</strong> We only partner with verified, enterprise-grade cloud providers for core infrastructure:
              </p>
              <ul className={`list-disc list-inside space-y-1.5 pl-2 ${isDark ? 'text-slate-300' : 'text-[#133E35]'}`}>
                <li><strong>PostgreSQL Database Services:</strong> Managed encrypted cloud storage for your account and records.</li>
                <li><strong>Email Services (Resend & SMTP):</strong> Transactional email delivery for 6-digit OTP verification codes.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-black flex items-center gap-2 text-emerald-400">
                <RefreshCw size={18} />
                5. Data Retention & Account Deletion
              </h2>
              <p className={isDark ? 'text-slate-300' : 'text-[#133E35]'}>
                You maintain complete ownership of your data. You may update your profile information or delete individual transactions at any time within your workspace. 
              </p>
            </section>
          </div>

          <div className="text-center pt-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 glass-btn-primary px-6 py-3 rounded-2xl font-bold text-xs shadow-lg"
            >
              <ArrowLeft size={16} />
              <span>Return to Cashio Home</span>
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
