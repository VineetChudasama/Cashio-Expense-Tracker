import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Search, UserPlus, Trash2, Edit3 } from 'lucide-react';
import { expenses as expensesApi, users, splits } from '../lib/api';
import { format } from 'date-fns';

const ShareExpenseModal = ({ splitToEdit, onClose }) => {
  const isEditing = Boolean(splitToEdit);
  const [step, setStep] = useState(isEditing ? 2 : 1);
  const [expenseList, setExpenseList] = useState([]);
  const [loadingExpenses, setLoadingExpenses] = useState(!isEditing);
  const [selectedExpense, setSelectedExpense] = useState(splitToEdit?.expense || null);

  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [participants, setParticipants] = useState(() => {
    if (splitToEdit?.participants) {
      return splitToEdit.participants.map(p => ({
        userId: p.userId,
        name: p.user?.name || 'User',
        email: p.user?.email || '',
        amountOwed: p.amountOwed.toString()
      }));
    }
    return [];
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const searchTimeout = useRef(null);

  useEffect(() => {
    if (!isEditing) {
      const fetchExpenses = async () => {
        try {
          const res = await expensesApi.getAll({ limit: 50 });
          if (res.success) {
            setExpenseList(res.data.expenses);
          }
        } catch (err) {
          console.error('Failed to fetch expenses', err);
        } finally {
          setLoadingExpenses(false);
        }
      };
      fetchExpenses();
    }
  }, [isEditing]);

  useEffect(() => {
    if (!searchEmail || searchEmail.length < 2) {
      setSearchResults([]);
      return;
    }

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await users.search(searchEmail);
        if (res.success) {
          const existingIds = new Set(participants.map(p => p.userId));
          setSearchResults(res.data.filter(u => !existingIds.has(u.id)));
        }
      } catch (err) {
        console.error('User search failed', err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchEmail, participants]);

  const addParticipant = (user) => {
    setParticipants(prev => [...prev, {
      userId: user.id,
      name: user.name,
      email: user.email,
      amountOwed: ''
    }]);
    setSearchEmail('');
    setSearchResults([]);
  };

  const removeParticipant = (userId) => {
    setParticipants(prev => prev.filter(p => p.userId !== userId));
  };

  const updateAmount = (userId, amount) => {
    setParticipants(prev => prev.map(p =>
      p.userId === userId ? { ...p, amountOwed: amount } : p
    ));
  };

  const splitEqually = () => {
    if (!selectedExpense || participants.length === 0) return;
    const perPerson = (selectedExpense.amount / (participants.length + 1)).toFixed(2);
    setParticipants(prev => prev.map(p => ({ ...p, amountOwed: perPerson })));
  };

  const handleSubmit = async () => {
    setError('');

    if (participants.length === 0) {
      setError('Add at least one participant.');
      return;
    }

    const invalidAmounts = participants.some(p => !p.amountOwed || Number(p.amountOwed) <= 0);
    if (invalidAmounts) {
      setError('Each participant must have a valid amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        participants: participants.map(p => ({
          userId: p.userId,
          amountOwed: Number(p.amountOwed)
        }))
      };

      let res;
      if (isEditing) {
        res = await splits.update(splitToEdit.id, payload);
      } else {
        res = await splits.create({
          expenseId: selectedExpense.id,
          ...payload
        });
      }

      if (res.success) {
        onClose(true);
      } else {
        const errorVal = res.error || 'Failed to save shared expense.';
        setError(typeof errorVal === 'string' ? errorVal : JSON.stringify(errorVal));
      }
    } catch (err) {
      const serverErr = err.response?.data?.error;
      let msg = 'An error occurred while saving the shared expense.';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 glass-overlay">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-card w-full max-w-lg overflow-hidden max-h-[92vh] flex flex-col border border-white/10 my-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-white/[0.06] shrink-0">
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            {isEditing ? (
              <>
                <Edit3 size={18} className="text-emerald-400" />
                <span>Edit Shared Expense</span>
              </>
            ) : (
              step === 1 ? 'Select an Expense' : 'Add Participants'
            )}
          </h2>
          <button
            onClick={() => onClose(false)}
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white glass-btn transition-colors"
          >
            <X size={17} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {step === 1 && !isEditing && (
            <div className="space-y-2.5 sm:space-y-3">
              {loadingExpenses ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-400"></div>
                  <p className="text-xs text-slate-400">Loading expenses...</p>
                </div>
              ) : expenseList.length === 0 ? (
                <p className="text-center text-slate-400 py-12 text-xs sm:text-sm">
                  No expenses found. Create an expense first.
                </p>
              ) : (
                expenseList.map(exp => (
                  <button
                    key={exp.id}
                    onClick={() => {
                      setSelectedExpense(exp);
                      setStep(2);
                    }}
                    className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 ${
                      selectedExpense?.id === exp.id
                        ? 'border-emerald-400 bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                        : 'glass-elevated border-white/[0.06] hover:border-emerald-400/30'
                    }`}
                  >
                    <div className="flex justify-between items-center gap-2">
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="font-bold text-xs sm:text-sm text-white truncate">{exp.description}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                          {exp.category} • {format(new Date(exp.date), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <span className="font-black text-sm sm:text-base text-white shrink-0">
                        ${exp.amount.toFixed(2)}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {step === 2 && selectedExpense && (
            <div className="space-y-4 sm:space-y-5">
              {/* Selected expense summary */}
              <div className="glass-elevated p-3.5 sm:p-4 border border-white/[0.06]">
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  {isEditing ? 'Editing Split' : 'Splitting Expense'}
                </p>
                <p className="font-bold text-sm sm:text-base text-white mt-0.5">
                  {selectedExpense.description} — ${selectedExpense.amount?.toFixed(2)}
                </p>
              </div>

              {/* User search */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Search & add participants by email
                </label>
                <div className="relative">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    placeholder="Type registered user's email..."
                    className="w-full glass-inset pl-9 pr-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  />
                </div>

                {/* Search results dropdown */}
                {(searchResults.length > 0 || searching) && (
                  <div className="mt-2 glass-elevated overflow-hidden divide-y divide-white/[0.06] border border-white/[0.08]">
                    {searching ? (
                      <p className="text-xs text-slate-400 p-3">Searching registered users...</p>
                    ) : (
                      searchResults.map(user => (
                        <button
                          key={user.id}
                          onClick={() => addParticipant(user)}
                          className="w-full text-left p-3 flex items-center gap-2.5 hover:bg-emerald-500/15 transition-colors"
                        >
                          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-400/25 flex items-center justify-center text-xs font-bold text-white shrink-0">
                            {user.name?.charAt(0) || '?'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-bold text-white truncate">{user.name}</p>
                            <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                          </div>
                          <UserPlus size={15} className="text-emerald-400 shrink-0" />
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Participants list */}
              {participants.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                      Participants ({participants.length})
                    </label>
                    <button
                      onClick={splitEqually}
                      className="text-xs text-emerald-400 hover:underline font-bold transition-colors"
                    >
                      Split equally
                    </button>
                  </div>

                  {participants.map(p => (
                    <div
                      key={p.userId}
                      className="flex items-center gap-2.5 glass-elevated p-2.5 sm:p-3 border border-white/[0.06]"
                    >
                      <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-400/25 flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {p.name?.charAt(0) || '?'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-bold text-white truncate">{p.name}</p>
                        <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">{p.email}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs font-bold text-emerald-400">$</span>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={p.amountOwed}
                          onChange={(e) => updateAmount(p.userId, e.target.value)}
                          placeholder="0.00"
                          className="w-16 sm:w-20 glass-inset px-2 py-1 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-emerald-400 text-right"
                        />
                        <button
                          onClick={() => removeParticipant(p.userId)}
                          className="p-1.5 rounded-lg text-rose-300 hover:bg-rose-950/40 border border-rose-500/25 transition-colors glass-btn"
                          title="Remove participant"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {error && (
                <div className="bg-rose-950/30 border border-rose-500/30 text-rose-300 rounded-xl p-3 text-xs font-semibold">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center gap-2.5 p-4 sm:p-6 border-t border-white/[0.06] shrink-0">
          {step === 2 ? (
            <>
              {!isEditing ? (
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-xl text-slate-300 text-xs font-bold hover:text-white glass-btn"
                >
                  Back
                </button>
              ) : (
                <button
                  onClick={() => onClose(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-300 text-xs font-bold hover:text-white glass-btn"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || participants.length === 0}
                className="glass-btn-primary px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center min-w-[120px] disabled:opacity-40 shadow-lg shadow-emerald-500/25"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  isEditing ? 'Update Split' : 'Share Expense'
                )}
              </button>
            </>
          ) : (
            <>
              <div></div>
              <button
                onClick={() => onClose(false)}
                className="px-4 py-2.5 rounded-xl text-slate-300 text-xs font-bold hover:text-white glass-btn"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ShareExpenseModal;
