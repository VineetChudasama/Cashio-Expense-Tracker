import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { expenses } from '../lib/api';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { getCurrencySymbol, CurrencyIcon } from '../utils/currency';

const categories = ['Food', 'Rent', 'Transport', 'Entertainment', 'Utilities', 'Shopping', 'Health', 'Education', 'Travel', 'Other'];

const ExpenseModal = ({ expense, onClose }) => {
  const { user } = useAuth();
  const userCurrency = user?.currency || localStorage.getItem('flow_currency') || 'USD ($)';
  const currencySymbol = getCurrencySymbol(userCurrency);

  const [formData, setFormData] = useState({
    amount: '',
    category: 'Other',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    isRecurring: false,
    recurringInterval: 'monthly'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (expense) {
      setFormData({
        amount: expense.amount,
        category: expense.category,
        description: expense.description,
        date: format(new Date(expense.date), 'yyyy-MM-dd'),
        isRecurring: expense.isRecurring || false,
        recurringInterval: expense.recurringInterval || 'monthly'
      });
    }
  }, [expense]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const payload = { ...formData, amount: Number(formData.amount) };
      
      if (expense) {
        await expenses.update(expense.id, payload);
      } else {
        await expenses.create(payload);
      }
      onClose(true);
    } catch (error) {
      console.error("Failed to save expense", error);
      alert('Error saving expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 glass-overlay overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-card w-full max-w-md overflow-hidden border border-white/10 my-auto"
      >
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-white/[0.06]">
          <h2 className="text-lg sm:text-xl font-bold text-white">
            {expense ? 'Edit Expense' : 'Add Expense'}
          </h2>
          <button 
            onClick={() => onClose(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-white glass-btn transition-colors"
          >
            <X size={17} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <CurrencyIcon currency={userCurrency} size={13} className="text-emerald-400" />
              <span>Amount ({currencySymbol})</span>
            </label>
            <input
              type="number"
              name="amount"
              required
              min="0.01"
              step="0.01"
              value={formData.amount}
              onChange={handleChange}
              className="w-full glass-inset px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
              placeholder="0.00"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">Description</label>
            <input
              type="text"
              name="description"
              required
              value={formData.description}
              onChange={handleChange}
              className="w-full glass-inset px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
              placeholder="e.g. Groceries, Rent, Coffee"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full glass-inset px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-400 appearance-none cursor-pointer"
              >
                {categories.map(c => <option key={c} value={c} className="bg-[#031512]">{c}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">Date</label>
              <input
                type="date"
                name="date"
                required
                value={formData.date}
                onChange={handleChange}
                className="w-full glass-inset px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4 p-3 sm:p-3.5 rounded-2xl glass-elevated border border-white/[0.06]">
            <input
              type="checkbox"
              id="isRecurring"
              name="isRecurring"
              checked={formData.isRecurring}
              onChange={handleChange}
              className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 border-white/20 bg-[#031512] cursor-pointer"
            />
            <label htmlFor="isRecurring" className="text-xs font-bold text-slate-200 cursor-pointer">
              This is a recurring expense
            </label>
          </div>

          {formData.isRecurring && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="overflow-hidden"
            >
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">Cadence Interval</label>
              <select
                name="recurringInterval"
                value={formData.recurringInterval}
                onChange={handleChange}
                className="w-full glass-inset px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-400 appearance-none cursor-pointer"
              >
                <option value="weekly" className="bg-[#031512]">Weekly</option>
                <option value="monthly" className="bg-[#031512]">Monthly</option>
              </select>
            </motion.div>
          )}

          <div className="flex gap-2.5 sm:gap-3 pt-3 border-t border-white/[0.06] mt-4 sm:mt-6">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="flex-1 py-3 rounded-xl text-slate-300 text-xs font-bold hover:text-white glass-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 glass-btn-primary py-3 rounded-xl font-bold text-xs flex items-center justify-center shadow-lg shadow-emerald-500/25 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Save Expense'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ExpenseModal;
