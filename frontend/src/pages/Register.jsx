import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Eye, EyeOff, MailCheck, ShieldCheck, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { auth as authApi } from '../lib/api';

const Register = () => {
  const [step, setStep] = useState(1); // 1: details, 2: otp verification
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [devCode, setDevCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Resend timer
  const [resendTimer, setResendTimer] = useState(60);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const navigate = useNavigate();
  const { register, verifyRegisterOtp } = useAuth();

  useEffect(() => {
    let interval;
    if (step === 2 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      const res = await register(email, password, name);
      if (res.success) {
        if (res.requireVerification) {
          setStep(2);
          setResendTimer(60);
          if (res.devCode) setDevCode(res.devCode);
        } else {
          navigate('/');
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
        navigate('/');
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
      const res = await authApi.resendRegisterOtp({ email });
      if (res.success) {
        setResendMessage('A new verification code has been dispatched to your email.');
        setResendTimer(60);
        if (res.devCode) setDevCode(res.devCode);
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
      {/* Ambient background light orbs */}
      <div className="fixed top-[15%] left-[20%] w-[35vw] h-[35vw] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[15%] right-[20%] w-[35vw] h-[35vw] rounded-full bg-teal-500/10 blur-[130px] pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md glass-card p-8 sm:p-10 border border-white/10 relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 p-[1.5px] shadow-lg shadow-emerald-500/25 mx-auto mb-3">
            <div className="w-full h-full bg-[#031512] rounded-2xl flex items-center justify-center text-emerald-300">
              {step === 1 ? <Sparkles size={22} className="animate-pulse" /> : <MailCheck size={22} className="text-emerald-300" />}
            </div>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Flow</h1>
          <p className="text-xs font-semibold text-emerald-300/80 mt-1">
            {step === 1 ? 'Create your smart finance workspace' : 'Authenticate Your Email Address'}
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
          /* Step 1: User Information Form */
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full glass-inset px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full glass-inset px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                placeholder="you@example.com"
              />
            </div>
            
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full glass-inset pl-4 pr-11 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  placeholder="••••••••"
                  minLength={6}
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
              disabled={isSubmitting}
              className="w-full glass-btn-primary py-3.5 rounded-2xl font-bold transition-all duration-300 flex justify-center items-center gap-2 text-sm shadow-lg shadow-emerald-500/25 mt-4"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Proceed to Email Verification</span>
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

            {devCode && (
              <div className="p-3 rounded-xl bg-teal-950/40 border border-teal-400/30 text-center">
                <p className="text-[11px] font-bold text-teal-300 uppercase tracking-wider">Development Testing Code</p>
                <p className="text-xl font-black text-white tracking-widest mt-0.5">{devCode}</p>
              </div>
            )}

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
                  <span>Verify & Enter Flow</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between pt-2 text-xs">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-slate-400 hover:text-white font-semibold transition-colors"
              >
                &larr; Change Email
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
