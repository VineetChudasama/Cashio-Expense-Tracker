import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Mail, 
  Lock, 
  Calendar, 
  DollarSign, 
  Receipt, 
  Users, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Save,
  KeyRound,
  ShieldCheck,
  Award,
  Eye,
  EyeOff,
  MailCheck,
  X,
  RefreshCw,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { users as usersApi } from '../lib/api';
import { format } from 'date-fns';
import PasswordRequirements, { checkPasswordCriteria } from '../components/PasswordRequirements';
import NotificationSettings from '../components/NotificationSettings';
import CategoryLimitsSettings from '../components/CategoryLimitsSettings';
import {
  SUPPORTED_CURRENCIES,
  getCurrencySymbol,
  getCurrencyCode,
  formatCurrency,
  fetchLiveExchangeRate,
  CurrencyIcon
} from '../utils/currency';

const Profile = () => {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currency, setCurrency] = useState('USD ($)');
  const [isSavingInfo, setIsSavingInfo] = useState(false);
  const [infoSuccess, setInfoSuccess] = useState('');
  const [infoError, setInfoError] = useState('');

  // Currency Conversion Modal State
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [modalFromCurrency, setModalFromCurrency] = useState('USD ($)');
  const [modalToCurrency, setModalToCurrency] = useState('USD ($)');
  const [exchangeRate, setExchangeRate] = useState(1.0);
  const [isLoadingRate, setIsLoadingRate] = useState(false);

  const [showEmailOtpModal, setShowEmailOtpModal] = useState(false);
  const [emailOtpCode, setEmailOtpCode] = useState('');
  const [isVerifyingEmailOtp, setIsVerifyingEmailOtp] = useState(false);
  const [emailOtpError, setEmailOtpError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPasswordRules, setShowNewPasswordRules] = useState(false);
  const [isSendingPasswordOtp, setIsSendingPasswordOtp] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [showPasswordOtpModal, setShowPasswordOtpModal] = useState(false);
  const [passwordOtpCode, setPasswordOtpCode] = useState('');
  const [isVerifyingPasswordOtp, setIsVerifyingPasswordOtp] = useState(false);
  const [passwordOtpError, setPasswordOtpError] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const fetchProfile = async () => {
    try {
      const res = await usersApi.getProfile();
      if (res.success) {
        setProfileData(res.data);
        setName(res.data.name || '');
        setEmail(res.data.email || '');
        if (res.data.currency) {
          setCurrency(res.data.currency);
          setModalFromCurrency(res.data.currency);
          localStorage.setItem('flow_currency', res.data.currency);
        } else {
          const savedCur = localStorage.getItem('flow_currency');
          if (savedCur) {
            setCurrency(savedCur);
            setModalFromCurrency(savedCur);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch profile', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Form modification check to enable/disable Save button
  const isNameModified = name.trim() !== (profileData?.name || '').trim();
  const isEmailModified = email.trim().toLowerCase() !== (profileData?.email || '').toLowerCase();
  const isCurrencyModified = currency !== (profileData?.currency || 'USD ($)');
  const isFormModified = isNameModified || isEmailModified || isCurrencyModified;

  // Refreshes live rate when from/to currency changes in modal
  const updateModalRate = async (fromCur, toCur) => {
    setIsLoadingRate(true);
    try {
      const rate = await fetchLiveExchangeRate(fromCur, toCur);
      setExchangeRate(Number(rate) || 1.0);
    } catch (err) {
      console.warn('Exchange rate fetch error:', err);
      setExchangeRate(1.0);
    } finally {
      setIsLoadingRate(false);
    }
  };

  // Open conversion modal directly
  const handleOpenConversionModal = async (customFrom = null, customTo = null) => {
    let from = customFrom;
    let to = customTo;

    if (!from && !to) {
      to = profileData?.currency || currency || 'INR (₹) - Indian Rupee';
      from = to.includes('INR') ? 'USD ($) - US Dollar' : 'INR (₹) - Indian Rupee';
    } else {
      from = from || profileData?.currency || 'USD ($) - US Dollar';
      to = to || currency || 'INR (₹) - Indian Rupee';
    }

    setModalFromCurrency(from);
    setModalToCurrency(to);
    setShowCurrencyModal(true);
    await updateModalRate(from, to);
  };

  // Handles executing profile updates with optional currency conversion
  const executeProfileUpdate = async ({ convertExpenses = false, conversionRate = null, fromCurrency = null, toCurrency = null } = {}) => {
    setIsSavingInfo(true);
    setInfoError('');
    setInfoSuccess('');
    setShowCurrencyModal(false);

    try {
      const targetCurrency = toCurrency || currency;
      const sourceCurrency = fromCurrency || profileData?.currency || 'USD ($)';
      const isNameChanged = name.trim() !== (profileData?.name || '');
      const isCurrencyChanged = targetCurrency !== (profileData?.currency || 'USD ($)');

      const payload = {
        name: name.trim(),
        currency: targetCurrency,
        convertExpenses: Boolean(convertExpenses),
        conversionRate: conversionRate || exchangeRate,
        fromCurrency: sourceCurrency
      };

      const res = await usersApi.updateProfile(payload);
      if (res.success) {
        let successMsg = 'Profile details updated successfully!';
        if (convertExpenses) {
          const rateVal = Number(conversionRate || exchangeRate || 1.0);
          successMsg = `Currency updated to ${targetCurrency} and all past expenses converted at live market rate (x${rateVal.toFixed(4)})!`;
        } else if (isCurrencyChanged) {
          successMsg = `Currency preference updated to ${targetCurrency} successfully!`;
        } else if (isNameChanged) {
          successMsg = 'Name updated successfully!';
        }

        setInfoSuccess(successMsg);
        localStorage.setItem('flow_currency', targetCurrency);
        setCurrency(targetCurrency);
        updateUser(res.data);
        await fetchProfile();
        setTimeout(() => setInfoSuccess(''), 5000);
      } else {
        setInfoError(res.error || 'Failed to update profile.');
      }
    } catch (err) {
      handleApiError(err, setInfoError);
    } finally {
      setIsSavingInfo(false);
    }
  };

  const handleUpdateInfo = async (e) => {
    e.preventDefault();
    if (!isFormModified || isSavingInfo) return;
    setInfoError('');
    setInfoSuccess('');

    const isEmailChanged = email.trim().toLowerCase() !== profileData?.email?.toLowerCase();

    if (!isEmailChanged) {
      const isCurrencyChanged = currency !== (profileData?.currency || 'USD ($)');

      // If user changed currency, open conversion pop-up with live rate
      if (isCurrencyChanged) {
        await handleOpenConversionModal(profileData?.currency || 'USD ($)', currency);
        return;
      }

      // If only name changed, save directly
      await executeProfileUpdate({ convertExpenses: false });
      return;
    }

    setIsSavingInfo(true);
    try {
      const res = await usersApi.sendEmailOtp({ newEmail: email.trim() });
      if (res.success) {
        setEmailOtpCode('');
        setEmailOtpError('');
        setShowEmailOtpModal(true);
      } else {
        setInfoError(res.error || 'Failed to initiate email verification.');
      }
    } catch (err) {
      handleApiError(err, setInfoError);
    } finally {
      setIsSavingInfo(false);
    }
  };

  const handleConfirmEmailOtp = async (e) => {
    e.preventDefault();
    setEmailOtpError('');

    if (!emailOtpCode || emailOtpCode.trim().length < 6) {
      setEmailOtpError('Please enter the 6-digit verification code.');
      return;
    }

    setIsVerifyingEmailOtp(true);
    try {
      const res = await usersApi.changeEmailWithOtp({
        newEmail: email.trim(),
        otpCode: emailOtpCode.trim()
      });

      if (res.success) {
        setShowEmailOtpModal(false);
        setInfoSuccess('Email address updated and verified successfully!');
        updateUser(res.data);
        fetchProfile();
        setTimeout(() => setInfoSuccess(''), 4000);
      } else {
        setEmailOtpError(res.error || 'Invalid verification code.');
      }
    } catch (err) {
      handleApiError(err, setEmailOtpError);
    } finally {
      setIsVerifyingEmailOtp(false);
    }
  };

  const handleInitiatePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    const criteria = checkPasswordCriteria(newPassword);
    if (!criteria.allValid) {
      setShowNewPasswordRules(true);
      if (!criteria.isMinLength) {
        setPasswordError('New password must be at least 10 characters long.');
      } else if (!criteria.hasUppercase) {
        setPasswordError('New password must include at least 1 uppercase letter (A-Z).');
      } else if (!criteria.hasLowercase) {
        setPasswordError('New password must include at least 1 lowercase letter (a-z).');
      } else if (!criteria.hasNumber) {
        setPasswordError('New password must include at least 1 number (0-9).');
      } else if (!criteria.hasSpecial) {
        setPasswordError('New password must include at least 1 special character (!@#$%...).');
      } else if (!criteria.isNotCommon) {
        setPasswordError('This password is too common or easily guessable. Please choose a stronger password.');
      }
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setIsSendingPasswordOtp(true);

    try {
      const res = await usersApi.sendPasswordOtp({ currentPassword });
      if (res.success) {
        setPasswordOtpCode('');
        setPasswordOtpError('');
        setShowPasswordOtpModal(true);
      } else {
        setPasswordError(res.error || 'Current password incorrect or failed to send OTP.');
      }
    } catch (err) {
      handleApiError(err, setPasswordError);
    } finally {
      setIsSendingPasswordOtp(false);
    }
  };

  const handleConfirmPasswordOtp = async (e) => {
    e.preventDefault();
    setPasswordOtpError('');

    if (!passwordOtpCode || passwordOtpCode.trim().length < 6) {
      setPasswordOtpError('Please enter the 6-digit verification code.');
      return;
    }

    setIsVerifyingPasswordOtp(true);

    try {
      const res = await usersApi.changePasswordWithOtp({
        currentPassword,
        newPassword,
        otpCode: passwordOtpCode.trim()
      });

      if (res.success) {
        setShowPasswordOtpModal(false);
        setPasswordSuccess('Password successfully updated!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(''), 4000);
      } else {
        setPasswordOtpError(res.error || 'Invalid verification code.');
      }
    } catch (err) {
      handleApiError(err, setPasswordOtpError);
    } finally {
      setIsVerifyingPasswordOtp(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm.');
      return;
    }
    setDeleteError('');
    setIsDeletingAccount(true);

    try {
      const res = await usersApi.deleteAccount({ password: deletePassword });
      if (res.success) {
        logout();
        navigate('/');
      } else {
        setDeleteError(res.error || 'Failed to delete account.');
      }
    } catch (err) {
      handleApiError(err, setDeleteError);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleApiError = (err, setErrorFn) => {
    if (err.message === 'Network Error' || !err.response) {
      setErrorFn('Network error: Unable to reach the server. Please check your connection.');
    } else {
      const serverErr = err.response?.data?.error;
      const errorMsg = Array.isArray(serverErr)
        ? serverErr.map(e => e.msg || JSON.stringify(e)).join(', ')
        : (typeof serverErr === 'string' ? serverErr : err.response?.data?.message || err.message || 'An error occurred.');
      setErrorFn(errorMsg);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-400"></div>
      </div>
    );
  }

  const joinDate = profileData?.createdAt 
    ? format(new Date(profileData.createdAt), 'MMMM yyyy')
    : 'Recent Member';

  const savedActiveCurrency = profileData?.currency || user?.currency || 'USD ($)';

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto pb-12 px-1 sm:px-0">
      {/* Header Banner */}
      <div className="glass-card p-5 sm:p-6 lg:p-8 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 relative z-10">
          {/* Avatar */}
          <div className="relative group">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 p-[2px] shadow-xl shadow-emerald-500/25">
              <div className="w-full h-full bg-[#031512] rounded-3xl flex items-center justify-center text-2xl sm:text-3xl font-black text-white shadow-inner">
                {profileData?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-emerald-500 text-[#030F0D] p-1 sm:p-1.5 rounded-xl border border-white/30 shadow-lg">
              <Sparkles size={13} />
            </div>
          </div>

          {/* User Info */}
          <div className="text-center sm:text-left flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 mb-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight truncate">
                {profileData?.name || 'User Profile'}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 glass-badge self-center sm:self-auto">
                <ShieldCheck size={12} />
                Verified Pro
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 font-medium mb-2.5 flex items-center justify-center sm:justify-start gap-1.5 truncate">
              <Mail size={14} className="text-emerald-400 shrink-0" />
              <span className="truncate">{profileData?.email}</span>
            </p>
            <div className="flex items-center justify-center sm:justify-start gap-4 text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <Calendar size={13} className="text-slate-400" />
                Joined {joinDate}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Account Statistics Quick Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="glass-card p-4 sm:p-5 border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
            <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-400/20">
              <CurrencyIcon currency={savedActiveCurrency} size={15} />
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Logged</span>
          </div>
          <p className="text-lg sm:text-xl lg:text-2xl font-black text-white">
            {formatCurrency(profileData?.totalSpent || 0, savedActiveCurrency)}
          </p>
        </div>

        <div className="glass-card p-4 sm:p-5 border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
            <div className="p-1.5 sm:p-2 rounded-xl bg-cyan-500/15 text-cyan-300 border border-cyan-400/20">
              <Receipt size={15} />
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">Expenses</span>
          </div>
          <p className="text-lg sm:text-xl lg:text-2xl font-black text-white">
            {profileData?._count?.expenses || 0}
          </p>
        </div>

        <div className="glass-card p-4 sm:p-5 border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
            <div className="p-1.5 sm:p-2 rounded-xl bg-teal-500/15 text-teal-300 border border-teal-400/20">
              <Users size={15} />
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">Splits Created</span>
          </div>
          <p className="text-lg sm:text-xl lg:text-2xl font-black text-white">
            {profileData?._count?.sharedExpenses || 0}
          </p>
        </div>

        <div className="glass-card p-4 sm:p-5 border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
            <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-400/20">
              <Award size={15} />
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">Participations</span>
          </div>
          <p className="text-lg sm:text-xl lg:text-2xl font-black text-white">
            {profileData?._count?.participations || 0}
          </p>
        </div>
      </div>

      {/* Profile & Security Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-7">
        {/* Edit Personal Information Card */}
        <div className="glass-card p-4 sm:p-6 lg:p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-400/20">
                <User size={18} />
              </div>
              <h2 className="text-lg font-bold text-white tracking-wide">Personal Details</h2>
            </div>
            <p className="text-xs text-emerald-300/70 font-medium mb-6">
              Update your profile details. Changing email requires 6-digit email authentication.
            </p>

            <AnimatePresence>
              {infoSuccess && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-5 p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2"
                >
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <span>{infoSuccess}</span>
                </motion.div>
              )}

              {infoError && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-5 p-3.5 rounded-2xl bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2"
                >
                  <AlertCircle size={16} className="text-rose-400 shrink-0" />
                  <span>{infoError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleUpdateInfo} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full glass-inset px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  placeholder="Your Full Name"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Email Address
                  </label>
                  {isEmailModified && (
                    <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">
                      Requires Email OTP
                    </span>
                  )}
                </div>
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
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Preferred Currency</span>
                  {isCurrencyModified && (
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                      Currency change detected
                    </span>
                  )}
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full glass-inset px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-400 appearance-none cursor-pointer"
                >
                  {SUPPORTED_CURRENCIES.map(c => (
                    <option key={c.code} value={c.label} className="bg-[#031512]">
                      {c.label}
                    </option>
                  ))}
                </select>

                <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-1">
                  <span className="text-[11px] text-slate-400 font-medium">
                    Current workspace: <strong className="text-emerald-300 font-bold">{savedActiveCurrency}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenConversionModal(savedActiveCurrency, currency)}
                    className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-400/20"
                  >
                    <RefreshCw size={11} />
                    <span>Recalculate past expenses</span>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingInfo || !isFormModified}
                  className="w-full glass-btn-primary py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all cursor-pointer"
                >
                  {isSavingInfo ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      {isEmailModified ? <MailCheck size={15} /> : <Save size={15} />}
                      <span>
                        {isEmailModified
                          ? 'Verify & Update Email'
                          : isFormModified
                            ? 'Save Changes'
                            : 'No Changes to Save'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Security & Password Card */}
        <div className="glass-card p-6 lg:p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-2 rounded-xl bg-teal-500/15 text-teal-300 border border-teal-400/20">
                <KeyRound size={18} />
              </div>
              <h2 className="text-lg font-bold text-white tracking-wide">Security & Password</h2>
            </div>
            <p className="text-xs text-emerald-300/70 font-medium mb-6">
              Password changes require 6-digit email authentication sent to your registered inbox.
            </p>

            <AnimatePresence>
              {passwordSuccess && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-5 p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2"
                >
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <span>{passwordSuccess}</span>
                </motion.div>
              )}

              {passwordError && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-5 p-3.5 rounded-2xl bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2"
                >
                  <AlertCircle size={16} className="text-rose-400 shrink-0" />
                  <span>{passwordError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleInitiatePasswordChange} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full glass-inset pl-4 pr-11 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-300 transition-colors p-1"
                    title={showCurrentPassword ? 'Hide password' : 'View password'}
                    tabIndex={-1}
                  >
                    {showCurrentPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
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
                      if (!showNewPasswordRules) setShowNewPasswordRules(true);
                    }}
                    onFocus={() => setShowNewPasswordRules(true)}
                    className="w-full glass-inset pl-4 pr-11 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    placeholder="••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-300 transition-colors p-1"
                    title={showNewPassword ? 'Hide password' : 'View password'}
                    tabIndex={-1}
                  >
                    {showNewPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>

                {/* Interactive Password Requirements Checklist (Hidden unless clicked / focused) */}
                <PasswordRequirements 
                  password={newPassword} 
                  isVisible={showNewPasswordRules} 
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
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full glass-inset pl-4 pr-11 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    placeholder="Repeat new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-300 transition-colors p-1"
                    title={showConfirmPassword ? 'Hide password' : 'View password'}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSendingPasswordOtp}
                  className="w-full glass-btn py-3 rounded-2xl font-bold text-xs text-white hover:text-emerald-300 hover:border-emerald-400/40 flex items-center justify-center gap-2 transition-all duration-200"
                >
                  {isSendingPasswordOtp ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <MailCheck size={15} />
                      <span>Authenticate via Email OTP</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Category Spending Limits & High Spending Alerts Manager */}
      <CategoryLimitsSettings />

      {/* Push Notification & Preferences Section */}
      <NotificationSettings />

      {/* Danger Zone: Delete Account */}
      <div className={`glass-card p-5 sm:p-6 lg:p-7 border rounded-3xl w-full ${
        profileData?.hasUnsettledDebts
          ? 'border-amber-500/30 bg-amber-950/10'
          : 'border-rose-500/20 bg-rose-950/10'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl border ${
                profileData?.hasUnsettledDebts
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                  : 'bg-rose-500/20 text-rose-400 border-rose-400/30'
              }`}>
                {profileData?.hasUnsettledDebts ? <AlertTriangle size={18} /> : <Trash2 size={18} />}
              </div>
              <h2 className="text-lg font-bold text-white tracking-wide">Delete Account</h2>
              {profileData?.hasUnsettledDebts && (
                <span className="text-[10px] uppercase font-bold text-amber-300 bg-amber-500/15 border border-amber-400/30 px-2 py-0.5 rounded-lg">
                  Action Locked: Unsettled Debts
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-muted)] font-medium max-w-2xl">
              {profileData?.hasUnsettledDebts ? (
                <span>
                  You have <strong className="text-amber-300 font-bold">{profileData.unsettledCount} unsettled debt(s)</strong> in Split Expenses. For account integrity, all peer balances must be settled in the Splits tab before your account can be deleted.
                </span>
              ) : (
                <span>
                  Permanently remove your Cashio account and all associated expenses, forecasts, debt settlements, and personal data. This action is permanent and cannot be undone.
                </span>
              )}
            </p>
          </div>

          {profileData?.hasUnsettledDebts ? (
            <button
              type="button"
              onClick={() => navigate('/splits')}
              className="px-5 py-3 rounded-2xl font-bold text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 hover:border-amber-400 transition-all flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-amber-950/40 cursor-pointer"
            >
              <Users size={15} />
              <span>Settle Debts in Splits</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setDeletePassword('');
                setDeleteConfirmText('');
                setDeleteError('');
                setShowDeleteModal(true);
              }}
              className="px-5 py-3 rounded-2xl font-bold text-xs bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 hover:border-rose-400 transition-all flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-rose-950/40 hover:scale-[1.02] cursor-pointer"
            >
              <Trash2 size={15} />
              <span>Delete Account</span>
            </button>
          )}
        </div>
      </div>

      {showEmailOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 glass-overlay">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card w-full max-w-md p-7 border border-white/15"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <MailCheck size={18} />
                </div>
                <h3 className="text-lg font-bold text-white">Verify New Email</h3>
              </div>
              <button 
                onClick={() => setShowEmailOtpModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white glass-btn"
              >
                <X size={17} />
              </button>
            </div>

            <div className="text-xs text-slate-300 mb-4 space-y-2">
              <p>
                To protect your account, we've dispatched a 6-digit authentication code to your registered email: <br />
                <strong className="text-emerald-300">{profileData?.email}</strong> <br />
                <span className="text-[11px] text-slate-400 mt-1 block">New email will be set to: <strong className="text-slate-200">{email}</strong></span>
              </p>
              <p className="text-[11px] text-emerald-300/90 font-medium bg-emerald-500/10 py-1.5 px-2.5 rounded-lg border border-emerald-500/20 text-center">
                💡 Please check your <strong>Spam / Junk</strong> folder if the mail isn't in your inbox.
              </p>
            </div>

            {emailOtpError && (
              <div className="bg-rose-950/40 border border-rose-500/30 text-rose-200 rounded-xl p-3 mb-4 text-xs font-semibold">
                {emailOtpError}
              </div>
            )}

            <form onSubmit={handleConfirmEmailOtp} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2 text-center">
                  Enter 6-Digit Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={emailOtpCode}
                  onChange={(e) => setEmailOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full glass-inset px-4 py-3 text-center text-2xl font-black tracking-[0.4em] text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="••••••"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEmailOtpModal(false)}
                  className="flex-1 py-3 rounded-xl text-xs font-bold text-slate-300 hover:text-white glass-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingEmailOtp || emailOtpCode.length < 6}
                  className="flex-1 glass-btn-primary py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 disabled:opacity-40"
                >
                  {isVerifyingEmailOtp ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>Confirm & Update</span>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {showPasswordOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 glass-overlay">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card w-full max-w-md p-7 border border-white/15"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-400/30">
                  <ShieldCheck size={18} />
                </div>
                <h3 className="text-lg font-bold text-white">Email Authentication</h3>
              </div>
              <button 
                onClick={() => setShowPasswordOtpModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white glass-btn"
              >
                <X size={17} />
              </button>
            </div>

            <div className="text-xs text-slate-300 mb-4 space-y-2">
              <p>
                To protect your account, enter the 6-digit authentication code sent to your registered email: <br />
                <strong className="text-emerald-300">{profileData?.email}</strong>
              </p>
              <p className="text-[11px] text-emerald-300/90 font-medium bg-emerald-500/10 py-1.5 px-2.5 rounded-lg border border-emerald-500/20 text-center">
                💡 Please check your <strong>Spam / Junk</strong> folder if the mail isn't in your inbox.
              </p>
            </div>

            {passwordOtpError && (
              <div className="bg-rose-950/40 border border-rose-500/30 text-rose-200 rounded-xl p-3 mb-4 text-xs font-semibold">
                {passwordOtpError}
              </div>
            )}

            <form onSubmit={handleConfirmPasswordOtp} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2 text-center">
                  Enter 6-Digit Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={passwordOtpCode}
                  onChange={(e) => setPasswordOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full glass-inset px-4 py-3 text-center text-2xl font-black tracking-[0.4em] text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="••••••"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordOtpModal(false)}
                  className="flex-1 py-3 rounded-xl text-xs font-bold text-slate-300 hover:text-white glass-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingPasswordOtp || passwordOtpCode.length < 6}
                  className="flex-1 glass-btn-primary py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 disabled:opacity-40"
                >
                  {isVerifyingPasswordOtp ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>Verify & Save</span>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 glass-overlay">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card w-full max-w-md p-7 border border-rose-500/30"
          >
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-400/30">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Permanently Delete Account</h3>
                  <span className="text-[11px] text-rose-300/80 font-semibold">Irreversible Action</span>
                </div>
              </div>
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white glass-btn"
              >
                <X size={17} />
              </button>
            </div>

            {profileData?.hasUnsettledDebts ? (
              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs space-y-2.5 mb-2">
                <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
                  <AlertTriangle size={17} />
                  <span>Account Deletion Blocked</span>
                </div>
                <p className="leading-relaxed text-[11px] text-amber-200/90">
                  You have <strong className="text-white font-bold">{profileData.unsettledCount} active unsettled debt(s)</strong> in your Split Expenses ledger. You cannot delete your account until all balances between you and your peers are settled.
                </p>
                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteModal(false);
                      navigate('/splits');
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/30 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Users size={14} />
                    <span>Go to Splits & Settle Up &rarr;</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-500/30 text-xs text-rose-200 space-y-1.5 mb-5">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertCircle size={14} className="text-rose-400" />
                    This will permanently erase:
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-300/90 pl-1">
                    <li>All logged expenses and transaction histories</li>
                    <li>Recurring pattern detections and forecasts</li>
                    <li>Group split participations and balances</li>
                    <li>Your profile credentials and verification records</li>
                  </ul>
                </div>

                {deleteError && (
                  <div className="bg-rose-950/60 border border-rose-500/40 text-rose-200 rounded-xl p-3 mb-4 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle size={15} className="text-rose-400 shrink-0" />
                    <span>{deleteError}</span>
                  </div>
                )}

                <form onSubmit={handleDeleteAccount} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Confirm Account Password
                    </label>
                    <input
                      type="password"
                      required
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      className="w-full glass-inset px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-rose-400"
                      placeholder="Enter your current password"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Type <span className="text-rose-400 font-mono font-black">DELETE</span> to confirm
                    </label>
                    <input
                      type="text"
                      required
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      className="w-full glass-inset px-4 py-3 text-sm font-mono tracking-widest text-white focus:outline-none focus:ring-1 focus:ring-rose-400 uppercase"
                      placeholder="DELETE"
                    />
                  </div>

                  <div className="flex gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowDeleteModal(false)}
                      className="flex-1 py-3 rounded-xl text-xs font-bold text-slate-300 hover:text-white glass-btn"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isDeletingAccount || deleteConfirmText.trim().toUpperCase() !== 'DELETE' || !deletePassword}
                      className="flex-1 py-3 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-rose-950/60 transition-all disabled:opacity-40"
                    >
                      {isDeletingAccount ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <Trash2 size={15} />
                          <span>Delete Forever</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        </div>
      )}

      {/* Currency Conversion Pop-up Modal */}
      {showCurrencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 glass-overlay overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="glass-card w-full max-w-lg overflow-hidden border border-emerald-400/30 p-5 sm:p-7 shadow-2xl relative my-auto"
          >
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
                  <CurrencyIcon currency={modalToCurrency} size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
                    Convert Existing Expenses?
                  </h3>
                  <p className="text-xs text-emerald-300/80 font-medium">
                    Live Market Exchange Rate Conversion
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCurrencyModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white glass-btn"
              >
                <X size={16} />
              </button>
            </div>

            {/* Currency From / To Selectors */}
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 mb-4 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Convert From (Current values)
                  </label>
                  <select
                    value={modalFromCurrency}
                    onChange={(e) => {
                      const newFrom = e.target.value;
                      setModalFromCurrency(newFrom);
                      updateModalRate(newFrom, modalToCurrency);
                    }}
                    className="w-full glass-inset px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-400 appearance-none cursor-pointer"
                  >
                    {SUPPORTED_CURRENCIES.map(c => (
                      <option key={c.code} value={c.label} className="bg-[#031512]">{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-emerald-300 block mb-1">
                    Convert To (New currency)
                  </label>
                  <select
                    value={modalToCurrency}
                    onChange={(e) => {
                      const newTo = e.target.value;
                      setModalToCurrency(newTo);
                      updateModalRate(modalFromCurrency, newTo);
                    }}
                    className="w-full glass-inset px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-400 appearance-none cursor-pointer"
                  >
                    {SUPPORTED_CURRENCIES.map(c => (
                      <option key={c.code} value={c.label} className="bg-[#031512]">{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Live Market Exchange Rate Badge & Sample */}
              <div className="pt-3 border-t border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5">
                    <Sparkles size={13} className="text-emerald-400" />
                    Live Market Rate:
                  </span>
                  {isLoadingRate ? (
                    <span className="text-emerald-300 font-bold flex items-center gap-1">
                      <RefreshCw size={11} className="animate-spin" /> Fetching live market rates...
                    </span>
                  ) : (
                    <span className="font-mono font-black text-white bg-emerald-500/20 px-2.5 py-0.5 rounded-md border border-emerald-400/30">
                      1 {getCurrencyCode(modalFromCurrency)} = {exchangeRate.toFixed(4)} {getCurrencyCode(modalToCurrency)}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] bg-black/25 px-3 py-1.5 rounded-xl border border-white/5">
                  <span className="text-slate-400 font-medium">Conversion preview:</span>
                  <span className="font-bold text-emerald-300">
                    {formatCurrency(100, modalFromCurrency)} &rarr; {formatCurrency(100 * exchangeRate, modalToCurrency)}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-5">
              Would you like to recalculate all your existing recorded expenses ({profileData?._count?.expenses || 0} transactions) to <strong>{modalToCurrency}</strong> at the live rate (x{exchangeRate.toFixed(4)}), or update the currency symbol only for future entries?
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                disabled={isSavingInfo || isLoadingRate}
                onClick={() => executeProfileUpdate({
                  convertExpenses: true,
                  conversionRate: exchangeRate,
                  fromCurrency: modalFromCurrency,
                  toCurrency: modalToCurrency
                })}
                className="flex-1 glass-btn-primary py-3 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
              >
                {isSavingInfo ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <RefreshCw size={14} />
                    <span>Convert All Expenses (Live Rate)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isSavingInfo}
                onClick={() => executeProfileUpdate({
                  convertExpenses: false,
                  toCurrency: modalToCurrency
                })}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-white/10 hover:bg-white/15 text-white border border-white/15 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Update Symbol Only</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowCurrencyModal(false)}
              className="w-full mt-2.5 py-2 text-center text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Profile;
