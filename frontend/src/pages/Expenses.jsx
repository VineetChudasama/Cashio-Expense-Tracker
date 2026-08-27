import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Filter, ReceiptText } from 'lucide-react';
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
  
  // Filters
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
        setTotalPages(res.data.totalPages);
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
  };

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
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0 }
  };

  return (
    <div className="space-y-7 max-w-7xl mx-auto pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Expenses</h1>
          <p className="text-sm font-medium text-emerald-300/80 mt-0.5">Manage and track your cash outflow</p>
        </div>
        <button 
          onClick={handleAdd}
          className="glass-btn-primary px-5 py-3 rounded-2xl font-bold flex items-center gap-2.5 shadow-lg shadow-emerald-500/25"
        >
          <Plus size={19} />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-5 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">Start Date</label>
          <input 
            type="date" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full glass-inset px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
          />
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">End Date</label>
          <input 
            type="date" 
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full glass-inset px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
          />
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">Category</label>
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full glass-inset px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-400 appearance-none cursor-pointer"
          >
            <option value="" className="bg-[#031512]">All Categories</option>
            {categories.map(c => <option key={c} value={c} className="bg-[#031512]">{c}</option>)}
          </select>
        </div>
        <button 
          onClick={handleApplyFilters}
          className="glass-btn px-5 py-2.5 rounded-2xl font-bold text-white flex items-center gap-2 h-[42px] hover:text-emerald-300"
        >
          <Filter size={16} />
          <span>Filter</span>
        </button>
      </div>

      {/* Expenses List */}
      <div className="glass-card p-6 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-9 w-9 border-t-2 border-b-2 border-emerald-400"></div>
          </div>
        ) : data.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <ReceiptText size={40} className="mx-auto mb-3 opacity-40 text-emerald-400" />
            No expenses found.
          </div>
        ) : (
          <motion.div variants={listVariants} initial="hidden" animate="show" className="space-y-3">
            {data.map((expense) => (
              <motion.div 
                variants={itemVariants}
                key={expense.id} 
                className="p-4 rounded-2xl glass-elevated border border-white/[0.06] flex items-center justify-between hover:translate-x-1 hover:border-emerald-400/30 transition-all duration-200 group"
              >
                <div className="flex items-center gap-4 flex-1 overflow-hidden min-w-0 pr-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-400/25 flex items-center justify-center flex-shrink-0 shadow-inner">
                    <span className="text-base font-black text-emerald-300">
                      {format(new Date(expense.date), 'dd')}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-sm text-white truncate">{expense.description}</p>
                      {expense.isRecurring && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30 font-bold glass-badge">
                          Recurring
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <CategoryBadge category={expense.category} />
                      <span className="text-xs text-slate-400 font-medium">
                        {format(new Date(expense.date), 'MMM yyyy')}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 shrink-0">
                  <span className="font-black text-base lg:text-lg text-white">
                    ${expense.amount.toFixed(2)}
                  </span>
                  
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleEdit(expense)}
                      className="p-2 rounded-xl text-slate-300 hover:text-white glass-btn transition-colors"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button 
                      onClick={() => handleDelete(expense.id)}
                      className="p-2 rounded-xl text-rose-300 hover:bg-rose-950/40 border border-rose-500/25 transition-colors glass-btn"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3">
          <button 
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 rounded-xl glass-btn text-white text-xs font-bold disabled:opacity-30"
          >
            Prev
          </button>
          <span className="px-4 py-2 text-xs font-bold text-emerald-300 glass-inset">
            Page {page} of {totalPages}
          </span>
          <button 
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 rounded-xl glass-btn text-white text-xs font-bold disabled:opacity-30"
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
