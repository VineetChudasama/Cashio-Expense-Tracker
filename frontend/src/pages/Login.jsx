import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  UserCheck, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  MailCheck, 
  RefreshCw 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { auth as authApi } from '../lib/api';
import ThemeToggle from '../components/ThemeToggle';

const Login = () => {
  const { isDark, logoUrl } = useTheme();
  const [step, setStep] = useState(1); // 1: Login Form, 2: OTP Verification Form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Resend timer for OTP step
  const [resendTimer, setResendTimer] = useState(60);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  // Instant email check states
  const [emailStatus, setEmailStatus] = useState('idle'); // 'idle' | 'checking' | 'exists' | 'not_found'
  const [emailError, setEmailError] = useState('');
  const [recognizedName, setRecognizedName] = useState('');

  const navigate = useNavigate();
  const { login, verifyRegisterOtp } = useAuth();

  useEffect(() => {
    let interval;
    if (step === 2 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const validateEmailFormat = (val) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  const handleEmailCheck = async (emailVal) => {
    const trimmed = (emailVal || email).trim();
    if (!trimmed || !validateEmailFormat(trimmed)) {
      setEmailStatus('idle');
      setEmailError('');
      setRecognizedName('');
      return;
    }

    setEmailStatus('checking');
    setEmailError('');

    try {
      const res = await authApi.checkEmail(trimmed);
      if (res.success && res.exists) {
        setEmailStatus('exists');
        setRecognizedName(res.name || '');
        setEmailError('');
      } else {
        setEmailStatus('not_found');
        setRecognizedName('');
        setEmailError('No account found with this email address.');
      }
    } catch (err) {
      console.error('Email check failed', err);
      setEmailStatus('idle');
    }
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    setEmailStatus('idle');
    setEmailError('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (emailStatus === 'not_found') {
      setError('Please provide a registered email address or register a new account.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const res = await login(email.trim(), password);
      if (res.success) {
        navigate('/dashboard');
      } else {
        const errVal = res.error || 'Login failed';
        setError(typeof errVal === 'string' ? errVal : JSON.stringify(errVal));
      }
    } catch (err) {
      const respData = err.response?.data;
      
      // If the backend indicates the account is unverified, seamlessly switch to OTP verification step
      if (respData?.unverified || err.response?.status === 403) {
        setStep(2);
        setResendTimer(60);
        setError('');
        setResendMessage('Your email is unverified. A verification code has been dispatched to your email.');
        setTimeout(() => setResendMessage(''), 5000);
        return;
      }

      const serverErr = respData?.error;
      let msg = 'An error occurred during login.';
      if (Array.isArray(serverErr)) {
        msg = serverErr.map(e => e.msg || e.message || JSON.stringify(e)).join(', ');
      } else if (typeof serverErr === 'string') {
        msg = serverErr;
      } else if (respData?.message) {
        msg = respData.message;
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
      const res = await verifyRegisterOtp(email.trim(), otpCode.trim());
      if (res.success) {
        navigate('/dashboard');
      } else {
        setError(res.error || 'Invalid verification code');
      }
    } catch (err) {
      const serverErr = err.response?.data?.error;
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
    if (resendTimer > 0 || resending) return;
    setResending(true);
    setError('');
    setResendMessage('');

    try {
      const res = await authApi.resendRegisterOtp({ email: email.trim() });
      if (res.success) {
        setResendMessage('A new verification code has been dispatched to your email.');
        setResendTimer(60);
        setTimeout(() => setResendMessage(''), 4000);
      } else {
        setError(res.error || 'Failed to resend verification code');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend verification code');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-4 py-8 overflow-hidden selection:bg-[#10B981]/30 selection:text-[#34D399]">
      {/* Top-Right Theme Switcher Button */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-30">
        <ThemeToggle />
      </div>

      {/* Ambient background light orbs */}
      <div className="fixed top-[15%] left-[20%] w-[35vw] h-[35vw] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[15%] right-[20%] w-[35vw] h-[35vw] rounded-full bg-teal-500/10 blur-[130px] pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md glass-card p-5 sm:p-10 border border-white/10 relative z-10"
      >
        <div className="text-center mb-8">
          <img 
            src={logoUrl} 
            alt="Cashio Logo" 
            className="w-16 h-16 object-contain mx-auto mb-2 drop-shadow-[0_0_18px_rgba(16,185,129,0.45)] hover:scale-105 transition-transform duration-300" 
          />
          <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">
            Cash<span className="text-[#10B981] dark:text-emerald-400">io</span>
          </h1>
          <span className="block text-[8px] md:text-[9px] uppercase font-extrabold tracking-[0.22em] text-[#5A7A73] dark:text-slate-400 mt-0.5">
            FINANCE PRO
          </span>
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-300/80 mt-1.5">
            {step === 1 ? 'Sign in to your intelligent expense dashboard' : 'Authenticate Your Email Address'}
          </p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="bg-rose-950/40 border border-rose-500/30 text-rose-200 rounded-2xl p-3.5 mb-6 text-xs font-semibold flex items-center gap-2.5 shadow-lg shadow-rose-950/30"
            >
              <AlertCircle size={16} className="text-rose-400 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {resendMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 rounded-2xl p-3.5 mb-6 text-xs font-semibold flex items-center gap-2.5"
            >
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span>{resendMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {step === 1 ? (
          /* Step 1: Sign in with Email & Password */
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Email Address
                </label>
                {recognizedName && emailStatus === 'exists' && (
                  <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1">
                    <UserCheck size={13} />
                    Hi, {recognizedName}!
                  </span>
                )}
              </div>

              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={() => handleEmailCheck()}
                  className={`w-full glass-inset pl-4 pr-11 py-3 text-sm text-white focus:outline-none transition-all duration-200 ${
                    emailStatus === 'exists'
                      ? 'border-emerald-400/50 focus:ring-1 focus:ring-emerald-400'
                      : emailStatus === 'not_found'
                      ? 'border-rose-500/60 focus:ring-1 focus:ring-rose-400'
                      : 'focus:ring-1 focus:ring-emerald-400'
                  }`}
                  placeholder="you@example.com"
                />

                {/* Instant Verification Status Indicator */}
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                  {emailStatus === 'checking' && (
                    <Loader2 size={17} className="text-emerald-400 animate-spin" />
                  )}
                  {emailStatus === 'exists' && (
                    <CheckCircle2 size={17} className="text-emerald-400" />
                  )}
                  {emailStatus === 'not_found' && (
                    <AlertCircle size={17} className="text-rose-400" />
                  )}
                </div>
              </div>

              {/* Email specific error message */}
              <AnimatePresence>
                {emailStatus === 'not_found' && emailError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 text-xs font-semibold text-rose-300 flex items-center justify-between"
                  >
                    <span>{emailError}</span>
                    <Link to="/register" className="text-emerald-400 hover:underline font-bold ml-2 shrink-0">
                      Register &rarr;
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => {
                    if (email && emailStatus === 'idle') {
                      handleEmailCheck();
                    }
                  }}
                  className="w-full glass-inset pl-4 pr-11 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-300 transition-colors p-1"
                  title={showPassword ? 'Hide password' : 'View password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || emailStatus === 'not_found'}
              className="w-full glass-btn-primary py-3.5 rounded-2xl font-bold transition-all duration-300 flex justify-center items-center gap-2 text-sm shadow-lg shadow-emerald-500/25 mt-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Step 2: 6-Digit Email OTP Verification Form */
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="p-4 rounded-2xl bg-emerald-950/25 border border-emerald-500/25 text-center">
              <p className="text-xs text-slate-300">
                We've sent a 6-digit authentication code to:
              </p>
              <p className="text-sm font-bold text-emerald-300 mt-1 truncate">
                {email}
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
              disabled={isSubmitting || otpCode.length < 6}
              className="w-full glass-btn-primary py-3.5 rounded-2xl font-bold transition-all duration-300 flex justify-center items-center gap-2 text-sm shadow-lg shadow-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
                className="text-slate-400 hover:text-white font-semibold transition-colors"
              >
                &larr; Back to Login
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendTimer > 0 || resending}
                className={`flex items-center gap-1 font-bold ${
                  resendTimer > 0
                    ? 'text-slate-500 cursor-not-allowed'
                    : 'text-emerald-400 hover:text-emerald-300 hover:underline'
                }`}
              >
                <RefreshCw size={13} className={resending ? 'animate-spin' : ''} />
                <span>{resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend Code'}</span>
              </button>
            </div>
          </form>
        )}

        <p className="mt-8 text-center text-xs text-slate-400 font-medium">
          Don't have an account?{' '}
          <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-bold underline transition-colors">
            Register here
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
