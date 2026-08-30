import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Filter, 
  ReceiptText, 
  X, 
  RotateCcw, 
  SlidersHorizontal,
  Calendar,
  Layers,
  DollarSign
} from 'lucide-react';
import { expenses } from '../lib/api';
import ExpenseModal from '../components/ExpenseModal';
import CategoryBadge from '../components/CategoryBadge';

const Expenses = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentExpense, setCurrentExpense] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  const [categoryFilter, setCategoryFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (categoryFilter) params.category = categoryFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const res = await expenses.getAll(params);
      if (res.success) {
        setData(res.data.expenses);
        setTotalPages(res.data.totalPages || 1);
        setTotalCount(res.data.totalCount || res.data.expenses?.length || 0);
      }
    } catch (err) {
      console.error("Failed to fetch expenses", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [page]);

  const handleApplyFilters = () => {
    setPage(1);
    fetchExpenses();
    setShowMobileFilters(false);
  };

  const handleClearFilters = () => {
    setCategoryFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
    setTimeout(() => {
      expenses.getAll({ page: 1, limit: 10 }).then(res => {
        if (res.success) {
          setData(res.data.expenses);
          setTotalPages(res.data.totalPages || 1);
          setTotalCount(res.data.totalCount || res.data.expenses?.length || 0);
        }
      });
    }, 50);
  };

  const hasActiveFilters = Boolean(categoryFilter || startDate || endDate);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        const res = await expenses.delete(id);
        if (res.success) {
          fetchExpenses();
        }
      } catch (err) {
        console.error("Delete failed", err);
      }
    }
  };

  const handleEdit = (expense) => {
    setCurrentExpense(expense);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setCurrentExpense(null);
    setIsModalOpen(true);
  };

  const onModalClose = (saved) => {
    setIsModalOpen(false);
    if (saved) fetchExpenses();
  };

  const categories = ['Food', 'Rent', 'Transport', 'Entertainment', 'Utilities', 'Shopping', 'Health', 'Education', 'Travel', 'Other'];

  const listVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.04 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 px-1 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Expenses</h1>
          <p className="text-xs sm:text-sm font-medium text-emerald-300/80 mt-0.5">
            Manage, filter, and track all your cash outflow
          </p>
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Mobile Filter Toggle Button */}
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className={`sm:hidden flex-1 glass-btn py-3 px-4 rounded-2xl font-bold flex items-center justify-center gap-2 text-xs transition-colors ${
              hasActiveFilters ? 'text-emerald-300 border-emerald-400/40 bg-emerald-500/15' : 'text-slate-300'
            }`}
          >
            <SlidersHorizontal size={15} />
            <span>Filters {hasActiveFilters ? '(Active)' : ''}</span>
          </button>

          <button 
            onClick={handleAdd}
            className="flex-1 sm:flex-initial glass-btn-primary px-5 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 text-xs sm:text-sm"
          >
            <Plus size={18} />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Filters Bar - Collapsible on Mobile, Expanded on sm+ */}
      <div className={`glass-card p-4 sm:p-5 transition-all duration-300 ${showMobileFilters ? 'block' : 'hidden sm:block'}`}>
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06] sm:hidden">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <Filter size={14} /> Filter Transactions
          </span>
          <button onClick={() => setShowMobileFilters(false)} className="text-slate-400 hover:text-white p-1">
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-end">
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Calendar size={12} className="text-emerald-400" /> Start Date
            </label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full glass-inset px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Calendar size={12} className="text-emerald-400" /> End Date
            </label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full glass-inset px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Layers size={12} className="text-emerald-400" /> Category
            </label>
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full glass-inset px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-400 appearance-none cursor-pointer"
            >
              <option value="" className="bg-[#031512]">All Categories</option>
              {categories.map(c => <option key={c} value={c} className="bg-[#031512]">{c}</option>)}
            </select>
          </div>

          <div className="flex gap-2 pt-1 sm:pt-0">
            <button 
              onClick={handleApplyFilters}
              className="flex-1 glass-btn-primary py-2.5 px-4 rounded-xl font-bold text-white flex items-center justify-center gap-1.5 text-xs shadow-md shadow-emerald-500/20 hover:brightness-110"
            >
              <Filter size={14} />
              <span>Apply</span>
            </button>
            {hasActiveFilters && (
              <button 
                onClick={handleClearFilters}
                className="glass-btn py-2.5 px-3 rounded-xl font-bold text-slate-300 hover:text-white flex items-center justify-center gap-1 text-xs"
                title="Clear all filters"
              >
                <RotateCcw size={13} />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expenses List Container */}
      <div className="glass-card p-4 sm:p-6 overflow-hidden">
        {loading ? (
          <div className="p-14 flex flex-col items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-9 w-9 border-t-2 border-b-2 border-emerald-400"></div>
            <p className="text-xs text-slate-400 font-medium">Loading transactions...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="p-12 sm:p-16 text-center text-slate-400 text-sm">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center mx-auto mb-3 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
              <ReceiptText size={30} />
            </div>
            <p className="text-base font-bold text-white mb-1">No expenses found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              {hasActiveFilters 
                ? 'No transactions match your current filters. Try changing or resetting filters.' 
                : 'You have not added any expenses yet. Click below to add your first expense.'}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={handleClearFilters}
                className="glass-btn px-4 py-2 rounded-xl text-xs font-bold text-emerald-300 hover:text-white"
              >
                Reset Filters
              </button>
            ) : (
              <button
                onClick={handleAdd}
                className="glass-btn-primary px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/25"
              >
                + Add Expense
              </button>
            )}
          </div>
        ) : (
          <motion.div variants={listVariants} initial="hidden" animate="show" className="space-y-3">
            {data.map((expense) => {
              const expDate = new Date(expense.date);
              const dayStr = format(expDate, 'dd');
              const monthYearStr = format(expDate, 'MMM yyyy');

              return (
                <motion.div 
                  variants={itemVariants}
                  key={expense.id} 
                  className="p-3.5 sm:p-4 rounded-2xl glass-elevated border border-white/[0.06] hover:border-emerald-400/35 transition-all duration-200 group flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  {/* Left block: Date + Details */}
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                    {/* Date Badge */}
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-400/25 flex flex-col items-center justify-center flex-shrink-0 shadow-inner">
                      <span className="text-sm sm:text-base font-black text-emerald-300 leading-none">
                        {dayStr}
                      </span>
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider leading-tight mt-0.5">
                        {format(expDate, 'MMM')}
                      </span>
                    </div>

                    {/* Description & Category Pill */}
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <h3 className="font-bold text-sm sm:text-base text-white truncate max-w-full" title={expense.description}>
                          {expense.description || 'Expense'}
                        </h3>
                        {expense.isRecurring && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30 font-bold glass-badge">
                            Recurring ({expense.recurringInterval || 'monthly'})
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <CategoryBadge category={expense.category} />
                        <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                          • {monthYearStr}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right block: Amount + Action Buttons */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.06] shrink-0">
                    <div className="text-left sm:text-right">
                      <span className="font-black text-base sm:text-lg text-white">
                        ${Number(expense.amount).toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1.5 opacity-100 sm:opacity-75 sm:group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEdit(expense)}
                        className="p-2 sm:p-2.5 rounded-xl text-slate-300 hover:text-white glass-btn transition-colors active:scale-95"
                        title="Edit Expense"
                        aria-label="Edit Expense"
                      >
                        <Edit2 size={14} className="sm:w-[15px] sm:h-[15px]" />
                      </button>
                      <button 
                        onClick={() => handleDelete(expense.id)}
                        className="p-2 sm:p-2.5 rounded-xl text-rose-300 hover:bg-rose-950/40 border border-rose-500/25 transition-colors glass-btn active:scale-95"
                        title="Delete Expense"
                        aria-label="Delete Expense"
                      >
                        <Trash2 size={14} className="sm:w-[15px] sm:h-[15px]" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Responsive Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 sm:gap-3 pt-2">
          <button 
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-3.5 sm:px-4 py-2 rounded-xl glass-btn text-white text-xs font-bold disabled:opacity-30 active:scale-95"
          >
            Prev
          </button>
          <span className="px-3.5 sm:px-4 py-2 text-xs font-bold text-emerald-300 glass-inset">
            Page {page} of {totalPages}
          </span>
          <button 
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-3.5 sm:px-4 py-2 rounded-xl glass-btn text-white text-xs font-bold disabled:opacity-30 active:scale-95"
          >
            Next
          </button>
        </div>
      )}

      {isModalOpen && (
        <ExpenseModal expense={currentExpense} onClose={onModalClose} />
      )}
    </div>
  );
};

export default Expenses;
