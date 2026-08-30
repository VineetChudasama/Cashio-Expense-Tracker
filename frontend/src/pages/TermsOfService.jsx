import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, ArrowLeft, CheckCircle2, Shield, AlertTriangle, Scale, RefreshCw } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

const TermsOfService = () => {
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
              <FileText size={15} />
              <span>Agreement & Terms</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">
              Terms of Service
            </h1>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              Last updated: August 2026. Please read these terms carefully before using Cashio Finance Pro.
            </p>
          </div>

          {/* Terms Cards */}
          <div className="glass-card p-6 sm:p-10 border border-white/10 rounded-3xl space-y-8 text-sm leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-lg font-black flex items-center gap-2 text-emerald-400">
                <CheckCircle2 size={18} />
                1. Acceptance of Terms
              </h2>
              <p className={isDark ? 'text-slate-300' : 'text-[#133E35]'}>
                By accessing or registering an account on Cashio (Flow Expense Tracker), you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you should not access or use the application.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-black flex items-center gap-2 text-emerald-400">
                <Shield size={18} />
                2. User Accounts & Security
              </h2>
              <p className={isDark ? 'text-slate-300' : 'text-[#133E35]'}>
                When creating an account, you agree to provide an accurate email address and maintain the confidentiality of your password and authentication codes. You are responsible for all activities that occur under your account.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-black flex items-center gap-2 text-emerald-400">
                <Scale size={18} />
                3. Acceptable Use
              </h2>
              <p className={isDark ? 'text-slate-300' : 'text-[#133E35]'}>
                Cashio is designed for personal expense tracking, predictive budgeting, and peer bill splitting. You agree not to misuse our APIs, attempt unauthorized server access, reverse engineer protected services, or engage in malicious or unlawful financial activities through the platform.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-black flex items-center gap-2 text-emerald-400">
                <AlertTriangle size={18} />
                4. Financial Disclaimer
              </h2>
              <p className={isDark ? 'text-slate-300' : 'text-[#133E35]'}>
                Cashio provides predictive AI forecasting, statistical trends, and debt simplification algorithms solely for informational and personal convenience purposes. Cashio is not an official banking institution or licensed financial advisor.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-black flex items-center gap-2 text-emerald-400">
                <RefreshCw size={18} />
                5. Modifications & Availability
              </h2>
              <p className={isDark ? 'text-slate-300' : 'text-[#133E35]'}>
                We continuously update and enhance Cashio with new features. We reserve the right to modify these terms as the platform evolves. Continued use of the platform after updates constitutes your agreement to the modified terms.
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

export default TermsOfService;
