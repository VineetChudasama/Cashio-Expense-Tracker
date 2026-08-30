import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  ArrowRight, 
  ArrowLeft,
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  UserCheck, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  KeyRound,
  RefreshCw 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { auth as authApi } from '../lib/api';
import PasswordRequirements, { checkPasswordCriteria } from '../components/PasswordRequirements';
import ThemeToggle from '../components/ThemeToggle';

const Login = () => {
  const { isDark, logoUrl } = useTheme();
  // step 1: Login Form, step 2: Unverified Account OTP, step 3: Forgot Password Request, step 4: Forgot Password Reset
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot password specific states
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetOtpCode, setResetOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordRules, setShowPasswordRules] = useState(false);

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
    if ((step === 2 || step === 4) && resendTimer > 0) {
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
    setSuccessMessage('');

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
      
      // If unverified, switch to OTP verification step
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
      const targetEmail = step === 4 ? forgotEmail.trim() : email.trim();
      const res = step === 4 
        ? await authApi.forgotPassword({ email: targetEmail })
        : await authApi.resendRegisterOtp({ email: targetEmail });

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

  // Step 3: Request Forgot Password OTP
  const handleRequestForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const targetEmail = forgotEmail.trim();
    if (!targetEmail || !validateEmailFormat(targetEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await authApi.forgotPassword({ email: targetEmail });
      if (res.success) {
        setStep(4);
        setResendTimer(60);
        setResetOtpCode('');
        setNewPassword('');
        setConfirmPassword('');
        setResendMessage(`A 6-digit verification code has been sent to ${targetEmail}`);
        setTimeout(() => setResendMessage(''), 5000);
      } else {
        setError(res.error || 'Failed to send password reset code.');
      }
    } catch (err) {
      const serverErr = err.response?.data?.error;
      let msg = 'Failed to request password reset code';
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

  // Step 4: Submit New Password with OTP
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!resetOtpCode || resetOtpCode.trim().length < 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    const criteria = checkPasswordCriteria(newPassword);
    if (!criteria.allValid) {
      setShowPasswordRules(true);
      if (!criteria.isMinLength) {
        setError('New password must be at least 10 characters long.');
      } else if (!criteria.hasUppercase) {
        setError('New password must include at least 1 uppercase letter (A-Z).');
      } else if (!criteria.hasLowercase) {
        setError('New password must include at least 1 lowercase letter (a-z).');
      } else if (!criteria.hasNumber) {
        setError('New password must include at least 1 number (0-9).');
      } else if (!criteria.hasSpecial) {
        setError('New password must include at least 1 special character (!@#$%...).');
      } else if (!criteria.isNotCommon) {
        setError('This password is too common or easily guessable. Please choose a stronger password.');
      }
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await authApi.resetPassword({
        email: forgotEmail.trim(),
        code: resetOtpCode.trim(),
        newPassword
      });

      if (res.success) {
        setSuccessMessage('Password reset successfully! You can now log in with your new password.');
        setEmail(forgotEmail.trim());
        setPassword('');
        setStep(1);
      } else {
        setError(res.error || 'Failed to reset password.');
      }
    } catch (err) {
      const serverErr = err.response?.data?.error;
      let msg = 'Failed to reset password';
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

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-[var(--bg-primary)] px-4 py-6 sm:py-10 overflow-hidden selection:bg-[#10B981]/30 selection:text-[#34D399]">
      {/* Ambient background light orbs */}
      <div className="fixed top-[15%] left-[20%] w-[35vw] h-[35vw] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[15%] right-[20%] w-[35vw] h-[35vw] rounded-full bg-teal-500/10 blur-[130px] pointer-events-none"></div>

      {/* Top Navigation & Theme Toggle Bar */}
      <div className="w-full max-w-md flex items-center justify-between mb-3 sm:mb-4 px-1 z-20">
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
            {step === 1 && 'Sign in to your intelligent expense dashboard'}
            {step === 2 && 'Authenticate Your Email Address'}
            {step === 3 && 'Recover & Reset Your Password'}
            {step === 4 && 'Create a New Secure Password'}
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

          {successMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 rounded-2xl p-3.5 mb-6 text-xs font-semibold flex items-center gap-2.5 shadow-lg shadow-emerald-950/30"
            >
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
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

        {/* STEP 1: SIGN IN FORM */}
        {step === 1 && (
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
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email || '');
                    setStep(3);
                    setError('');
                    setSuccessMessage('');
                  }}
                  className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 hover:underline transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
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
        )}

        {/* STEP 2: REGISTRATION / UNVERIFIED OTP FORM */}
        {step === 2 && (
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

        {/* STEP 3: FORGOT PASSWORD - REQUEST OTP */}
        {step === 3 && (
          <form onSubmit={handleRequestForgotPassword} className="space-y-5">
            <div className="p-4 rounded-2xl bg-emerald-950/25 border border-emerald-500/25 text-center">
              <KeyRound size={28} className="text-emerald-400 mx-auto mb-2" />
              <p className="text-xs text-slate-300">
                Enter your registered email address and we'll send you a 6-digit verification code to reset your password.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Registered Email Address
              </label>
              <input
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="w-full glass-inset px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                placeholder="you@example.com"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !forgotEmail}
              className="w-full glass-btn-primary py-3.5 rounded-2xl font-bold transition-all duration-300 flex justify-center items-center gap-2 text-sm shadow-lg shadow-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Send Verification Code</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setError('');
                }}
                className="text-xs text-slate-400 hover:text-white font-semibold transition-colors"
              >
                &larr; Back to Login
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: FORGOT PASSWORD - ENTER OTP & NEW PASSWORD */}
        {step === 4 && (
          <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-emerald-950/25 border border-emerald-500/25 text-center">
              <p className="text-xs text-slate-300">
                Enter the 6-digit code sent to:
              </p>
              <p className="text-sm font-bold text-emerald-300 truncate">
                {forgotEmail}
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 text-center">
                6-Digit Verification Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={resetOtpCode}
                onChange={(e) => setResetOtpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full glass-inset px-4 py-2.5 text-center text-xl font-black tracking-[0.3em] text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="••••••"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (!showPasswordRules) setShowPasswordRules(true);
                  }}
                  onFocus={() => setShowPasswordRules(true)}
                  className="w-full glass-inset pl-4 pr-11 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  placeholder="••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-300 transition-colors p-1"
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Strict Password Requirements checklist */}
              <PasswordRequirements 
                password={newPassword} 
                isVisible={showPasswordRules} 
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full glass-inset pl-4 pr-11 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  placeholder="••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-300 transition-colors p-1"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || resetOtpCode.length < 6}
              className="w-full glass-btn-primary py-3.5 rounded-2xl font-bold transition-all duration-300 flex justify-center items-center gap-2 text-sm shadow-lg shadow-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed mt-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  <span>Update Password & Log In</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between pt-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setError('');
                }}
                className="text-slate-400 hover:text-white font-semibold transition-colors"
              >
                &larr; Cancel & Login
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
                <span>{resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}</span>
              </button>
            </div>
          </form>
        )}

        {step === 1 && (
          <p className="mt-8 text-center text-xs text-slate-400 font-medium">
            Don't have an account?{' '}
            <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-bold underline transition-colors">
              Register here
            </Link>
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default Login;
