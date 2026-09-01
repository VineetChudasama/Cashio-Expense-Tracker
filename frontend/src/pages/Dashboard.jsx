import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { List, TrendingDown, Award, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { expenses, insights } from '../lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import StatCard from '../components/StatCard';
import CategoryBadge from '../components/CategoryBadge';
import { format } from 'date-fns';
import { formatCurrency, getCurrencySymbol, CurrencyIcon } from '../utils/currency';

const Dashboard = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const userCurrency = user?.currency || localStorage.getItem('flow_currency') || 'USD ($)';
  const currencySymbol = getCurrencySymbol(userCurrency);

  const [recentExpenses, setRecentExpenses] = useState([]);
  const [summary, setSummary] = useState([]);
  const [topInsight, setTopInsight] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [expRes, sumRes, insRes] = await Promise.all([
          expenses.getAll({ limit: 5 }),
          expenses.getCategorySummary(),
          insights.get().catch(() => ({ success: false, data: { insights: [] } }))
        ]);
        
        if (expRes.success) setRecentExpenses(expRes.data.expenses);
        if (sumRes.success) setSummary(sumRes.data);
        if (insRes.success && insRes.data.insights.length > 0) {
          setTopInsight(insRes.data.insights[0]);
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  const totalSpent = summary.reduce((acc, curr) => acc + curr.total, 0);
  const expenseCount = summary.reduce((acc, curr) => acc + curr.count, 0);
  const dailyAverage = totalSpent / 30;
  const topCategory = summary.length > 0 ? [...summary].sort((a,b) => b.total - a.total)[0] : null;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.06 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0 }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2 sm:gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'User'} 👋
          </h1>
          <p className="text-xs sm:text-sm font-medium text-emerald-800 dark:text-emerald-300/80 mt-0.5">Welcome to your financial command center.</p>
        </div>
      </div>

      {/* Top AI Insight Banner */}
      {topInsight && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-4 sm:p-5 lg:p-6 border-emerald-400/25 relative overflow-hidden"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                AI Intelligence
              </span>
              <h3 className="font-bold text-white text-xs sm:text-sm lg:text-base truncate">{topInsight.title}</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium mt-1">{topInsight.description}</p>
          </div>
        </motion.div>
      )}

      {/* Stat Cards Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5"
      >
        <StatCard 
          icon={(props) => <CurrencyIcon currency={userCurrency} {...props} />} 
          label="Total Spent" 
          value={formatCurrency(totalSpent, userCurrency)} 
          color="emerald" 
          variants={itemVariants}
        />
        <StatCard 
          icon={List} 
          label="Transactions" 
          value={expenseCount} 
          color="cyan" 
          variants={itemVariants}
        />
        <StatCard 
          icon={TrendingDown} 
          label="Daily Average" 
          value={formatCurrency(dailyAverage, userCurrency)} 
          color="amber" 
          variants={itemVariants}
        />
        <StatCard 
          icon={Award} 
          label="Top Category" 
          value={topCategory ? topCategory.category : 'None'} 
          subtext={topCategory ? `${formatCurrency(topCategory.total, userCurrency)} total` : null}
          color="teal" 
          variants={itemVariants}
        />
      </motion.div>

      {/* Charts & Recent Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Category Breakdown Chart */}
        <div className="lg:col-span-2 glass-card p-4 sm:p-6 lg:p-7 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">Spending by Category</h2>
              <p className="text-xs text-emerald-800 dark:text-emerald-300/70 font-medium">Monthly expense distribution</p>
            </div>
          </div>
          {summary.length > 0 ? (
            <div className="h-64 sm:h-72 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary} layout="vertical" margin={{ top: 5, right: 15, left: -10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="barGrad1" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#059669" />
                      <stop offset="100%" stopColor="#10B981" />
                    </linearGradient>
                    <linearGradient id="barGrad2" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#0D9488" />
                      <stop offset="100%" stopColor="#2DD4BF" />
                    </linearGradient>
                  </defs>
                  <XAxis type="number" stroke="#94A3B8" fontSize={10} tickFormatter={(val) => `${currencySymbol}${val}`} axisLine={false} tickLine={false} />
                  <YAxis dataKey="category" type="category" stroke="#CBD5E1" fontSize={11} width={75} tickLine={false} axisLine={false} />
                  <Tooltip 
                    shared={false}
                    cursor={false}
                    formatter={(value) => [formatCurrency(value, userCurrency), 'Amount']} 
                    contentStyle={{ 
                      backgroundColor: isDark ? '#031512' : '#FFFFFF', 
                      borderColor: isDark ? 'rgba(16, 185, 129, 0.35)' : 'rgba(5, 150, 105, 0.25)', 
                      borderRadius: '14px', 
                      padding: '10px 14px',
                      color: isDark ? '#FFFFFF' : '#07241E', 
                      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)',
                      borderWidth: '1px'
                    }}
                    labelStyle={{ 
                      color: isDark ? '#34D399' : '#059669', 
                      fontWeight: '800', 
                      marginBottom: '4px',
                      fontSize: '12px'
                    }}
                    itemStyle={{ 
                      color: isDark ? '#F1F5F9' : '#07241E', 
                      fontWeight: '700',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="total" maxBarSize={28} radius={[0, 8, 8, 0]} className="cursor-pointer">
                    {summary.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'url(#barGrad1)' : 'url(#barGrad2)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400 text-xs sm:text-sm">
              No expense data available to display chart.
            </div>
          )}
        </div>

        {/* Recent Expenses List */}
        <div className="glass-card p-4 sm:p-6 lg:p-7 flex flex-col">
          <div className="flex justify-between items-center mb-4 sm:mb-5">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">Recent Expenses</h2>
              <p className="text-xs text-emerald-800 dark:text-emerald-300/70 font-medium">Latest transactions</p>
            </div>
            <Link to="/expenses" className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
              <span>View All</span>
              <ArrowRight size={13} />
            </Link>
          </div>
          
          <div className="space-y-2.5 flex-1">
            {recentExpenses.length > 0 ? (
              recentExpenses.map(expense => (
                <div 
                  key={expense.id} 
                  className="flex justify-between items-center p-3 rounded-2xl glass-elevated border border-white/[0.06] hover:border-emerald-400/30 transition-all duration-200"
                >
                  <div className="flex flex-col gap-0.5 overflow-hidden min-w-0 pr-2">
                    <span className="font-bold text-xs sm:text-sm text-white truncate">{expense.description}</span>
                    <div className="flex items-center gap-1.5">
                      <CategoryBadge category={expense.category} />
                      <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
                        {format(new Date(expense.date), 'MMM dd')}
                      </span>
                    </div>
                  </div>
                  <div className="font-black text-xs sm:text-sm text-white shrink-0">
                    {formatCurrency(expense.amount, userCurrency)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-slate-400 py-10 text-xs sm:text-sm">
                No recent expenses found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
