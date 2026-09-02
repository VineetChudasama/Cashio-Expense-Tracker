import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2,
  Sliders,
  User,
  Mail,
  Lock,
  Coins,
  Utensils,
  ShoppingBag,
  Plane,
  Film,
  Car,
  Home,
  Zap,
  HeartPulse,
  GraduationCap,
  Layers,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { auth as authApi } from '../lib/api';
import PasswordRequirements, { checkPasswordCriteria } from '../components/PasswordRequirements';
import ThemeToggle from '../components/ThemeToggle';
import { SUPPORTED_CURRENCIES, getCurrencySymbol } from '../utils/currency';

export const CATEGORY_MAX_LIMITS = {
  Rent: 100000,
  Education: 80000,
  Travel: 60000,
  Food: 50000,
  Shopping: 40000,
  Health: 35000,
  Utilities: 30000,
  Entertainment: 25000,
  Transport: 25000,
  Other: 20000
};

const CATEGORY_CONFIG = [
  { name: 'Rent', icon: Home, maxLimit: 100000, defaultLimit: 25000, placeholder: 'Max: 100,000' },
  { name: 'Education', icon: GraduationCap, maxLimit: 80000, defaultLimit: 15000, placeholder: 'Max: 80,000' },
  { name: 'Travel', icon: Plane, maxLimit: 60000, defaultLimit: 12000, placeholder: 'Max: 60,000' },
  { name: 'Food', icon: Utensils, maxLimit: 50000, defaultLimit: 15000, placeholder: 'Max: 50,000' },
  { name: 'Shopping', icon: ShoppingBag, maxLimit: 40000, defaultLimit: 10000, placeholder: 'Max: 40,000' },
  { name: 'Health', icon: HeartPulse, maxLimit: 35000, defaultLimit: 8000, placeholder: 'Max: 35,000' },
  { name: 'Utilities', icon: Zap, maxLimit: 30000, defaultLimit: 6000, placeholder: 'Max: 30,000' },
  { name: 'Entertainment', icon: Film, maxLimit: 25000, defaultLimit: 5000, placeholder: 'Max: 25,000' },
  { name: 'Transport', icon: Car, maxLimit: 25000, defaultLimit: 5000, placeholder: 'Max: 25,000' },
  { name: 'Other', icon: Layers, maxLimit: 20000, defaultLimit: 4000, placeholder: 'Max: 20,000' }
];

const Register = () => {
  const { isDark, logoUrl } = useTheme();
  const [step, setStep] = useState(1); // 1: Signup Form, 2: OTP Verification
  const [activeTab, setActiveTab] = useState('personal'); // 'personal' | 'limits'
  
  // Personal Info Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currency, setCurrency] = useState('USD ($)');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordRules, setShowPasswordRules] = useState(false);

  // Category Limits Form State
  const [categoryLimits, setCategoryLimits] = useState({
    Rent: '',
    Education: '',
    Travel: '',
    Food: '',
    Shopping: '',
    Health: '',
    Utilities: '',
    Entertainment: '',
    Transport: '',
    Other: ''
  });

  // OTP State
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [resendTimer, setResendTimer] = useState(60);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [otpLockoutTimer, setOtpLockoutTimer] = useState(0);

  const navigate = useNavigate();
  const { register, verifyRegisterOtp } = useAuth();
  const currencySymbol = getCurrencySymbol(currency);
  const isINR = currency.includes('INR') || currency.includes('₹');

  // Check saved OTP lockout timestamp
  useEffect(() => {
    const targetEmail = email.trim().toLowerCase();
    if (!targetEmail) return;
    const saved = localStorage.getItem('cashio_otp_lockout_' + targetEmail);
    if (saved) {
      const until = parseInt(saved, 10);
      const remaining = Math.ceil((until - Date.now()) / 1000);
      if (remaining > 0) {
        setOtpLockoutTimer(remaining);
      } else {
        localStorage.removeItem('cashio_otp_lockout_' + targetEmail);
        setOtpLockoutTimer(0);
      }
    }
  }, [step, email]);

  // Tick down otpLockoutTimer
  useEffect(() => {
    let interval;
    if (otpLockoutTimer > 0) {
      interval = setInterval(() => {
        setOtpLockoutTimer(prev => {
          if (prev <= 1) {
            const targetEmail = email.trim().toLowerCase();
            if (targetEmail) localStorage.removeItem('cashio_otp_lockout_' + targetEmail);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpLockoutTimer, email]);

  const triggerOtpLockout = (targetEmail, seconds = 600) => {
    const normalized = (targetEmail || '').trim().toLowerCase();
    const duration = seconds > 0 ? seconds : 600;
    setOtpLockoutTimer(duration);
    if (normalized) {
      localStorage.setItem('cashio_otp_lockout_' + normalized, (Date.now() + duration * 1000).toString());
    }
  };

  useEffect(() => {
    let interval;
    if (step === 2 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const handleLimitChange = (category, val) => {
    // Only allow whole numbers, max 6 digits
    let cleanVal = val.replace(/[^0-9]/g, '');
    if (cleanVal.length > 6) {
      cleanVal = cleanVal.slice(0, 6);
    }
    const catMax = CATEGORY_MAX_LIMITS[category] || 100000;
    const numVal = parseInt(cleanVal, 10);
    if (!isNaN(numVal) && numVal > catMax) {
      cleanVal = catMax.toString();
    }
    setCategoryLimits(prev => ({
      ...prev,
      [category]: cleanVal
    }));
  };

  const applySuggestedPresets = () => {
    const preset = {};
    CATEGORY_CONFIG.forEach(cat => {
      preset[cat.name] = cat.defaultLimit.toString();
    });
    setCategoryLimits(preset);
  };

  const clearAllLimits = () => {
    const empty = {};
    CATEGORY_CONFIG.forEach(cat => {
      empty[cat.name] = '';
    });
    setCategoryLimits(empty);
  };

  const validatePersonalInfo = () => {
    if (!name.trim()) {
      setError('Please enter your full name.');
      setActiveTab('personal');
      return false;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      setActiveTab('personal');
      return false;
    }

    const criteria = checkPasswordCriteria(password);
    if (!criteria.allValid) {
      setShowPasswordRules(true);
      setActiveTab('personal');
      if (!criteria.isMinLength) {
        setError('Password must be at least 10 characters long.');
      } else if (!criteria.hasUppercase) {
        setError('Password must include at least 1 uppercase letter (A-Z).');
      } else if (!criteria.hasLowercase) {
        setError('Password must include at least 1 lowercase letter (a-z).');
      } else if (!criteria.hasNumber) {
        setError('Password must include at least 1 number (0-9).');
      } else if (!criteria.hasSpecial) {
        setError('Password must include at least 1 special character (!@#$%...).');
      } else if (!criteria.isNotCommon) {
        setError('This password is too common or easily guessable. Please choose a stronger password.');
      }
      return false;
    }

    return true;
  };

  const handleProceedToLimits = (e) => {
    e.preventDefault();
    setError('');
    if (validatePersonalInfo()) {
      setActiveTab('limits');
    }
  };

  const handleRegisterSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');

    if (!validatePersonalInfo()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Validate each category limit against its category maximum
      for (const [cat, val] of Object.entries(categoryLimits)) {
        if (val && val.trim()) {
          const num = parseFloat(val);
          const catMax = CATEGORY_MAX_LIMITS[cat] || 100000;
          if (!isNaN(num) && num > catMax) {
            setError(`Category limit for "${cat}" cannot exceed ${currencySymbol}${catMax.toLocaleString()}.`);
            setIsSubmitting(false);
            return;
          }
        }
      }

      // Format category limits for backend
      const formattedLimits = {};
      Object.entries(categoryLimits).forEach(([cat, val]) => {
        const num = parseFloat(val);
        if (!isNaN(num) && num > 0) {
          formattedLimits[cat] = num;
        }
      });

      const res = await register(email, password, name, currency, formattedLimits);
      if (res.success) {
        if (res.requireVerification) {
          setStep(2);
          setResendTimer(60);
        } else {
          navigate('/dashboard');
        }
      } else {
        const errVal = res.error || res.message || 'Registration failed';
        setError(typeof errVal === 'string' ? errVal : JSON.stringify(errVal));
      }
    } catch (err) {
      const serverErr = err.response?.data?.error;
      let msg = 'An error occurred during registration';
      if (Array.isArray(serverErr)) {
        msg = serverErr.map(e => e.msg || e.message || JSON.stringify(e)).join(', ');
      } else if (typeof serverErr === 'string') {
        msg = serverErr;
      } else if (err.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (!otpCode || otpCode.trim().length < 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await verifyRegisterOtp(email, otpCode.trim());
      if (res.success) {
        navigate('/dashboard');
      } else {
        setError(res.error || 'Invalid verification code');
      }
    } catch (err) {
      const respData = err.response?.data;
      if (err.response?.status === 429 || respData?.locked) {
        const sec = respData?.remainingSeconds || (respData?.remainingMinutes ? respData.remainingMinutes * 60 : 600);
        triggerOtpLockout(email, sec);
      }
      const serverErr = respData?.error;
      let msg = 'Failed to verify code';
      if (Array.isArray(serverErr)) {
        msg = serverErr.map(e => e.msg || e.message || JSON.stringify(e)).join(', ');
      } else if (typeof serverErr === 'string') {
        msg = serverErr;
      } else if (err.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0 || resending || otpLockoutTimer > 0) return;
    setResending(true);
    setError('');
    setResendMessage('');

    try {
      const res = await authApi.resendRegisterOtp({ email });
      if (res.success) {
        setResendMessage('A new verification code has been dispatched to your email.');
        setResendTimer(60);
        setTimeout(() => setResendMessage(''), 4000);
      } else {
        setError(res.error || 'Failed to resend verification code');
      }
    } catch (err) {
      const respData = err.response?.data;
      if (err.response?.status === 429 || respData?.locked) {
        const sec = respData?.remainingSeconds || (respData?.remainingMinutes ? respData.remainingMinutes * 60 : 600);
        triggerOtpLockout(email, sec);
      }
      setError(err.response?.data?.error || 'Failed to resend verification code');
    } finally {
      setResending(false);
    }
  };

  // Count configured limits
  const configuredLimitsCount = Object.values(categoryLimits).filter(v => parseFloat(v) > 0).length;

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-[var(--bg-primary)] px-4 py-6 sm:py-10 overflow-hidden selection:bg-[#10B981]/30 selection:text-[#34D399]">
      {/* Precision Dot Matrix Grid */}
      <div 
        className="pointer-events-none fixed inset-0 z-0 opacity-45 transition-opacity duration-300"
        style={{
          backgroundImage: isDark
            ? 'radial-gradient(rgba(255, 255, 255, 0.14) 1.2px, transparent 1.2px)'
            : 'radial-gradient(rgba(20, 125, 112, 0.20) 1.2px, transparent 1.2px)',
          backgroundSize: '28px 28px',
          maskImage: 'radial-gradient(ellipse 80% 70% at 50% 45%, black 35%, transparent 85%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 45%, black 35%, transparent 85%)'
        }}
      />

      <div className={`w-full ${step === 1 && activeTab === 'limits' ? 'max-w-xl' : 'max-w-md'} flex items-center justify-between mb-3 sm:mb-4 px-1 z-20 transition-all duration-300`}>
        <Link 
          to="/" 
          className="glass-card px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-emerald-400 border border-white/10 hover:border-emerald-500/30 transition-all flex items-center gap-1.5 shadow-lg backdrop-blur-md hover:scale-[1.02]"
        >
          <ArrowLeft size={14} />
          <span>Home</span>
        </Link>

        <ThemeToggle showLabel={false} />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`w-full ${step === 1 && activeTab === 'limits' ? 'max-w-xl' : 'max-w-md'} glass-card p-5 sm:p-8 md:p-9 border border-white/10 relative z-10 transition-all duration-300`}
      >
        <div className="text-center mb-6">
          <img 
            src={logoUrl} 
            alt="Cashio Logo" 
            className="w-14 h-14 object-contain mx-auto mb-2 drop-shadow-[0_0_18px_rgba(16,185,129,0.45)] hover:scale-105 transition-transform duration-300" 
          />
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
            Cash<span className="text-[#10B981] dark:text-emerald-400">io</span>
          </h1>
          <span className="block text-[8px] md:text-[9px] uppercase font-extrabold tracking-[0.22em] text-[#5A7A73] dark:text-slate-400 mt-0.5">
            FINANCE PRO
          </span>
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-300/80 mt-1.5">
            {step === 1 
              ? (activeTab === 'personal' ? 'Step 1 of 2: Personal Information' : 'Step 2 of 2: Category Spending Limits')
              : 'Authenticate Your Email Address'}
          </p>
        </div>

        {/* 2 Tabs Header during Step 1 */}
        {step === 1 && (
          <div className="flex p-1.5 rounded-2xl bg-emerald-500/[0.08] dark:bg-black/20 border border-emerald-600/20 dark:border-white/10 mb-6 relative">
            <button
              type="button"
              onClick={() => setActiveTab('personal')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'personal'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25'
                  : 'text-slate-700 dark:text-slate-400 hover:text-emerald-800 dark:hover:text-white'
              }`}
            >
              <User size={14} />
              <span>1. Personal Info</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (validatePersonalInfo()) {
                  setActiveTab('limits');
                }
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'limits'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25'
                  : 'text-slate-700 dark:text-slate-400 hover:text-emerald-800 dark:hover:text-white'
              }`}
            >
              <Sliders size={14} />
              <span>2. Category Limits</span>
              {configuredLimitsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-400 text-black text-[10px] font-black">
                  {configuredLimitsCount}
                </span>
              )}
            </button>
          </div>
        )}

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="bg-rose-500/10 dark:bg-rose-950/40 border border-rose-500/30 text-rose-800 dark:text-rose-200 rounded-2xl p-3.5 mb-6 text-xs font-semibold flex items-center gap-2.5 shadow-sm dark:shadow-lg dark:shadow-rose-950/30"
            >
              <AlertCircle size={16} className="text-rose-600 dark:text-rose-400 shrink-0" />
              <span className="leading-relaxed">{error}</span>
            </motion.div>
          )}

          {resendMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 rounded-2xl p-3.5 mb-6 text-xs font-semibold flex items-center gap-2.5"
            >
              <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="leading-relaxed">{resendMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {step === 1 ? (
          <div>
            {/* TAB 1: PERSONAL INFORMATION */}
            {activeTab === 'personal' && (
              <motion.form 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onSubmit={handleProceedToLimits} 
                className="space-y-4"
              >
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <User size={13} className="text-emerald-500 dark:text-emerald-400" />
                    <span>Full Name</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full glass-inset px-4 py-3 text-sm text-[var(--text-primary)] dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Mail size={13} className="text-emerald-500 dark:text-emerald-400" />
                    <span>Email Address</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full glass-inset px-4 py-3 text-sm text-[var(--text-primary)] dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    placeholder="you@example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Lock size={13} className="text-emerald-500 dark:text-emerald-400" />
                    <span>Password</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (!showPasswordRules) setShowPasswordRules(true);
                      }}
                      onFocus={() => setShowPasswordRules(true)}
                      className="w-full glass-inset pl-4 pr-11 py-3 text-sm text-[var(--text-primary)] dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                      placeholder="••••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-300 transition-colors p-1"
                      title={showPassword ? 'Hide password' : 'View password'}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>

                  <PasswordRequirements 
                    password={password} 
                    isVisible={showPasswordRules} 
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Coins size={13} className="text-emerald-500 dark:text-emerald-400" />
                    <span>Preferred Currency</span>
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full glass-inset px-4 py-3 text-sm text-[var(--text-primary)] dark:text-white bg-white/70 dark:bg-black/40 focus:outline-none focus:ring-1 focus:ring-emerald-400 cursor-pointer"
                  >
                    {SUPPORTED_CURRENCIES.map(c => (
                      <option key={c.code} value={c.label} className="bg-white text-slate-800 dark:bg-[#041915] dark:text-white">
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full glass-btn-primary py-3.5 rounded-2xl font-bold transition-all duration-300 flex justify-center items-center gap-2 text-sm shadow-lg shadow-emerald-500/25 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span>Next: Set Spending Limits</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </motion.form>
            )}

            {/* TAB 2: CATEGORY LIMITS */}
            {activeTab === 'limits' && (
              <motion.div 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
              >
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/25 flex items-start gap-2.5">
                  <Sparkles size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-700 dark:text-slate-300">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-0.5">High Spending Alerts Protection</span>
                    Set monthly limits (category maximum limits range from {currencySymbol}20,000 to {currencySymbol}100,000) to receive notifications when you reach <strong>50%</strong>, <strong>80%</strong>, or <strong>exceed (100%+)</strong> your category limit. (You can edit these anytime in Profile).
                  </div>
                </div>

                {/* Presets Bar */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Quick Setup (Category Max: {currencySymbol}20k - {currencySymbol}100k)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={applySuggestedPresets}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-400/30 hover:bg-emerald-500/25 transition-all cursor-pointer"
                    >
                      Fill Suggested
                    </button>
                    <button
                      type="button"
                      onClick={clearAllLimits}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-200/50 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-300/60 dark:border-white/10 hover:bg-slate-300/60 dark:hover:bg-white/10 transition-all cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Category Limits Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-1">
                  {CATEGORY_CONFIG.map(cat => {
                    const Icon = cat.icon;
                    const val = categoryLimits[cat.name] || '';

                    return (
                      <div 
                        key={cat.name} 
                        className={`p-3 rounded-2xl border transition-all min-w-0 ${
                          val 
                            ? 'bg-emerald-500/10 dark:bg-emerald-950/30 border-emerald-500/50 dark:border-emerald-400/40 shadow-sm' 
                            : 'bg-white dark:bg-black/20 border-[#CEE8E1] dark:border-white/[0.08] hover:border-emerald-500/30 dark:hover:border-white/20 shadow-sm dark:shadow-none'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="p-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                              <Icon size={14} />
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-slate-900 dark:text-white block whitespace-nowrap">
                                {cat.name}
                              </span>
                              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold block leading-tight">
                                Max {currencySymbol}{cat.maxLimit.toLocaleString()}
                              </span>
                            </div>
                          </div>
                          {val && (
                            <span 
                              className="text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300 bg-emerald-500/15 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30 shrink-0 whitespace-nowrap mt-0.5"
                              title={`${currencySymbol}${parseInt(val, 10).toLocaleString()}/mo`}
                            >
                              {currencySymbol}{parseInt(val, 10).toLocaleString()}/mo
                            </span>
                          )}
                        </div>

                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            {currencySymbol}
                          </span>
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={val}
                            onChange={(e) => handleLimitChange(cat.name, e.target.value)}
                            placeholder={`Max: ${currencySymbol}${cat.maxLimit.toLocaleString()}`}
                            className="w-full glass-inset pl-7 pr-3 py-2 text-xs font-semibold text-[var(--text-primary)] dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('personal')}
                    className="py-3 px-4 rounded-2xl font-bold text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-200/50 dark:bg-white/5 border border-slate-300/60 dark:border-white/10 hover:bg-slate-300/60 dark:hover:bg-white/10 transition-all cursor-pointer"
                  >
                    &larr; Back
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleRegisterSubmit}
                    className="flex-1 glass-btn-primary py-3.5 rounded-2xl font-bold transition-all duration-300 flex justify-center items-center gap-2 text-sm shadow-lg shadow-emerald-500/25 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span>Create Account & Verify</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        ) : (
          /* STEP 2: OTP VERIFICATION */
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="p-4 rounded-2xl bg-emerald-950/25 border border-emerald-500/25 text-center">
              <p className="text-xs text-slate-300">
                We've dispatched a 6-digit authentication code to:
              </p>
              <p className="text-sm font-bold text-emerald-300 mt-1 truncate">
                {email}
              </p>
              <p className="text-[11px] text-emerald-300/90 mt-2.5 font-medium bg-emerald-500/10 py-1.5 px-2.5 rounded-lg border border-emerald-500/20">
                💡 Please check your <strong>Spam / Junk</strong> folder if the mail isn't in your inbox.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2 text-center">
                Enter 6-Digit Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full glass-inset px-4 py-3.5 text-center text-2xl font-black tracking-[0.4em] text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="••••••"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || otpCode.length < 6 || otpLockoutTimer > 0}
              className="w-full glass-btn-primary py-3.5 rounded-2xl font-bold transition-all duration-300 flex justify-center items-center gap-2 text-sm shadow-lg shadow-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : otpLockoutTimer > 0 ? (
                <>
                  <Lock size={18} />
                  <span>Locked ({Math.floor(otpLockoutTimer / 60)}:{String(otpLockoutTimer % 60).padStart(2, '0')})</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  <span>Verify & Enter Cashio</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between pt-2 text-xs">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-semibold transition-colors cursor-pointer"
              >
                &larr; Change Details
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendTimer > 0 || resending || otpLockoutTimer > 0}
                className={`flex items-center gap-1 font-bold cursor-pointer ${
                  resendTimer > 0 || otpLockoutTimer > 0
                    ? 'text-slate-400 dark:text-slate-500 cursor-not-allowed'
                    : 'text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 hover:underline'
                }`}
              >
                {otpLockoutTimer > 0 ? (
                  <>
                    <Lock size={13} />
                    <span>Locked ({Math.floor(otpLockoutTimer / 60)}:{String(otpLockoutTimer % 60).padStart(2, '0')})</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={13} className={resending ? 'animate-spin' : ''} />
                    <span>{resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend Code'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        <p className="mt-8 text-center text-xs text-slate-400 font-medium">
          Already have an account?{' '}
          <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-bold underline transition-colors">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
