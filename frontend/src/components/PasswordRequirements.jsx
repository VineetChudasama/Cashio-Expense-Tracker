import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';

const COMMON_WEAK_LIST = [
  'password', 'password123', 'password1234', 'password123!', '12345678',
  '123456789', '1234567890', 'qwertyuiop', 'admin12345', 'welcome123!',
  'letmein123!', 'iloveyou123', 'flowfinance123'
];

export const checkPasswordCriteria = (password = '') => {
  const hasInput = Boolean(password && password.length > 0);

  const isMinLength = hasInput && password.length >= 10;
  const hasUppercase = hasInput && /[A-Z]/.test(password);
  const hasLowercase = hasInput && /[a-z]/.test(password);
  const hasNumber = hasInput && /[0-9]/.test(password);
  const hasSpecial = hasInput && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`§±]/.test(password);
  
  // Check if it matches common weak password list
  const isCommonPassword = hasInput && COMMON_WEAK_LIST.includes(password.toLowerCase().trim());
  const isNotCommon = hasInput && !isCommonPassword;

  // 5 visible rules
  const visibleRulesPassed = hasInput 
    ? [isMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecial].filter(Boolean).length 
    : 0;
  
  // Progress bar is in 1:1 sync with the 5 visible parameters (0%, 20%, 40%, 60%, 80%, 100%)
  const strengthPercent = Math.round((visibleRulesPassed / 5) * 100);

  let strength = 'Enter password';
  let strengthColor = 'text-slate-400';
  let barGradient = 'bg-slate-700';

  if (!hasInput) {
    strength = 'Enter password';
    strengthColor = 'text-slate-400';
    barGradient = 'bg-transparent';
  } else if (isCommonPassword) {
    strength = 'Common Password';
    strengthColor = 'text-rose-400';
    barGradient = 'bg-rose-500';
  } else if (visibleRulesPassed === 5) {
    strength = 'Strong & Secure (5/5)';
    strengthColor = 'text-emerald-400';
    barGradient = 'bg-gradient-to-r from-teal-400 to-emerald-400';
  } else if (visibleRulesPassed === 4) {
    strength = 'Good (4/5)';
    strengthColor = 'text-teal-300';
    barGradient = 'bg-gradient-to-r from-teal-500 to-teal-400';
  } else if (visibleRulesPassed === 3) {
    strength = 'Moderate (3/5)';
    strengthColor = 'text-amber-400';
    barGradient = 'bg-gradient-to-r from-amber-500 to-amber-400';
  } else {
    strength = `Weak (${visibleRulesPassed}/5)`;
    strengthColor = 'text-rose-400';
    barGradient = 'bg-rose-500';
  }

  const allValid = Boolean(hasInput && isMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial && isNotCommon);

  return {
    hasInput,
    isMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecial,
    isCommonPassword,
    isNotCommon,
    visibleRulesPassed,
    strength,
    strengthColor,
    barGradient,
    strengthPercent,
    allValid
  };
};

const PasswordRequirements = ({ password = '', isVisible = false }) => {
  const criteria = checkPasswordCriteria(password);

  const requirements = [
    { label: 'At least 10 characters', met: criteria.isMinLength },
    { label: '1 uppercase letter (A-Z)', met: criteria.hasUppercase },
    { label: '1 lowercase letter (a-z)', met: criteria.hasLowercase },
    { label: '1 number (0-9)', met: criteria.hasNumber },
    { label: '1 special character (!@#$%...)', met: criteria.hasSpecial }
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, height: 0, marginTop: 0 }}
          animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
          exit={{ opacity: 0, height: 0, marginTop: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="overflow-hidden"
        >
          <div className="p-3.5 rounded-2xl bg-[#021814]/90 border border-emerald-500/20 backdrop-blur-md space-y-3">
            {/* Strength Bar */}
            <div>
              <div className="flex justify-between items-center text-[11px] font-bold mb-1.5">
                <span className="text-slate-300 flex items-center gap-1">
                  {criteria.allValid ? (
                    <ShieldCheck size={13} className="text-emerald-400" />
                  ) : (
                    <ShieldAlert size={13} className={criteria.visibleRulesPassed >= 3 ? 'text-amber-400' : criteria.visibleRulesPassed > 0 ? 'text-rose-400' : 'text-slate-400'} />
                  )}
                  Password Strength:
                </span>
                <span className={`font-black ${criteria.strengthColor}`}>
                  {criteria.strength}
                </span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${criteria.strengthPercent}%` }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className={`h-full rounded-full transition-all duration-300 ${criteria.barGradient}`}
                />
              </div>
            </div>

            {/* Checklist (5 Parameters) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 border-t border-white/5">
              {requirements.map((req, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-center gap-1.5 text-[11px] transition-colors duration-200 ${
                    req.met ? 'text-emerald-300 font-semibold' : 'text-slate-400'
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${
                    req.met ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-500'
                  }`}>
                    {req.met ? <Check size={10} strokeWidth={3} /> : <span className="w-1 h-1 rounded-full bg-slate-500"></span>}
                  </div>
                  <span className="truncate">{req.label}</span>
                </div>
              ))}
            </div>

            {/* Common Breached Password Warning Popup Banner */}
            <AnimatePresence>
              {criteria.isCommonPassword && (
                <motion.div
                  initial={{ opacity: 0, y: -4, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -4, height: 0 }}
                  className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-[11px] font-semibold flex items-center gap-2"
                >
                  <AlertTriangle size={14} className="text-rose-400 shrink-0" />
                  <span>This password appears on common breached password lists. Please choose a more unique password.</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PasswordRequirements;
