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

const Profile = () => {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Personal Info form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currency, setCurrency] = useState('USD ($)');
  const [isSavingInfo, setIsSavingInfo] = useState(false);
  const [infoSuccess, setInfoSuccess] = useState('');
  const [infoError, setInfoError] = useState('');

  // Email Change OTP Modal State
  const [showEmailOtpModal, setShowEmailOtpModal] = useState(false);
  const [emailOtpCode, setEmailOtpCode] = useState('');
  const [isVerifyingEmailOtp, setIsVerifyingEmailOtp] = useState(false);
  const [emailOtpError, setEmailOtpError] = useState('');

  // Password Change state
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

  // Password Change OTP Modal State
  const [showPasswordOtpModal, setShowPasswordOtpModal] = useState(false);
  const [passwordOtpCode, setPasswordOtpCode] = useState('');
  const [isVerifyingPasswordOtp, setIsVerifyingPasswordOtp] = useState(false);
  const [passwordOtpError, setPasswordOtpError] = useState('');

  // Delete Account State
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
          localStorage.setItem('flow_currency', res.data.currency);
        } else {
          const savedCur = localStorage.getItem('flow_currency');
          if (savedCur) setCurrency(savedCur);
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

  // Update Personal Info (Name and Currency / Trigger Email OTP if changed)
  const handleUpdateInfo = async (e) => {
    e.preventDefault();
    setInfoError('');
    setInfoSuccess('');

    const isEmailChanged = email.trim().toLowerCase() !== profileData?.email?.toLowerCase();

    // If only name or currency changed
    if (!isEmailChanged) {
      setIsSavingInfo(true);
      try {
        const isNameChanged = name.trim() !== (profileData?.name || '');
        const isCurrencyChanged = currency !== (profileData?.currency || 'USD ($)');

        const res = await usersApi.updateProfile({ name: name.trim(), currency });
        if (res.success) {
          let successMsg = 'Profile details updated successfully!';
          if (isNameChanged && !isCurrencyChanged) {
            successMsg = 'Name updated successfully!';
          } else if (!isNameChanged && isCurrencyChanged) {
            successMsg = `Currency preference updated to ${currency} successfully!`;
          } else if (isNameChanged && isCurrencyChanged) {
            successMsg = 'Name and currency preference updated successfully!';
          }

          setInfoSuccess(successMsg);
          localStorage.setItem('flow_currency', currency);
          updateUser(res.data);
          fetchProfile();
          setTimeout(() => setInfoSuccess(''), 4000);
        } else {
          setInfoError(res.error || 'Failed to update profile.');
        }
      } catch (err) {
        handleApiError(err, setInfoError);
      } finally {
        setIsSavingInfo(false);
      }
      return;
    }

    // If email is changing, trigger Email OTP
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

  // Confirm Email Change with OTP
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

  // Initiate Password Change (Validates inputs & Sends OTP)
  const handleInitiatePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validate Password Strength Rules
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

  // Confirm Password Change with OTP
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

  const isEmailModified = email.trim().toLowerCase() !== profileData?.email?.toLowerCase();

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
              <DollarSign size={15} />
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Logged</span>
          </div>
          <p className="text-lg sm:text-xl lg:text-2xl font-black text-white">
            ${profileData?.totalSpent ? profileData.totalSpent.toFixed(2) : '0.00'}
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
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Preferred Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full glass-inset px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-400 appearance-none cursor-pointer"
                >
                  <option value="USD ($)" className="bg-[#031512]">USD ($) - US Dollar</option>
                  <option value="EUR (€)" className="bg-[#031512]">EUR (€) - Euro</option>
                  <option value="GBP (£)" className="bg-[#031512]">GBP (£) - British Pound</option>
                  <option value="INR (₹)" className="bg-[#031512]">INR (₹) - Indian Rupee</option>
                  <option value="CAD ($)" className="bg-[#031512]">CAD ($) - Canadian Dollar</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingInfo}
                  className="w-full glass-btn-primary py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
                >
                  {isSavingInfo ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      {isEmailModified ? <MailCheck size={15} /> : <Save size={15} />}
                      <span>{isEmailModified ? 'Verify & Update Email' : 'Save Changes'}</span>
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

        {/* Danger Zone: Delete Account */}
        <div className="glass-card p-4 sm:p-6 lg:p-7 border border-rose-500/20 bg-rose-950/10 rounded-3xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-400/30">
                  <Trash2 size={18} />
                </div>
                <h2 className="text-lg font-bold text-white tracking-wide">Delete Account</h2>
              </div>
              <p className="text-xs text-rose-300/80 font-medium max-w-xl">
                Permanently remove your Cashio account and all associated expenses, forecasts, debt settlements, and personal data. This action is permanent and cannot be undone.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setDeletePassword('');
                setDeleteConfirmText('');
                setDeleteError('');
                setShowDeleteModal(true);
              }}
              className="px-5 py-3 rounded-2xl font-bold text-xs bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 hover:border-rose-400 transition-all flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-rose-950/40 hover:scale-[1.02]"
            >
              <Trash2 size={15} />
              <span>Delete Account</span>
            </button>
          </div>
        </div>
      </div>

      {/* EMAIL CHANGE OTP MODAL */}
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

            <p className="text-xs text-slate-300 mb-4">
              To protect your account, we've sent a 6-digit authentication code to your registered email: <br />
              <strong className="text-emerald-300">{profileData?.email}</strong> <br />
              <span className="text-[11px] text-slate-400 mt-1 block">New email will be set to: <strong className="text-slate-200">{email}</strong></span>
            </p>

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

      {/* PASSWORD CHANGE OTP MODAL */}
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

            <p className="text-xs text-slate-300 mb-4">
              To protect your account, enter the 6-digit authentication code sent to your registered email: <br />
              <strong className="text-emerald-300">{profileData?.email}</strong>
            </p>

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

      {/* DELETE ACCOUNT CONFIRMATION MODAL */}
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
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Profile;
