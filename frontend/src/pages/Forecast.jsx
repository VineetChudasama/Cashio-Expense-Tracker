import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, TrendingUp, Sparkles } from 'lucide-react';
import { forecast } from '../lib/api';
import ForecastChart from '../components/ForecastChart';
import CategoryBadge from '../components/CategoryBadge';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/currency';

const Forecast = () => {
  const { user } = useAuth();
  const userCurrency = user?.currency || localStorage.getItem('flow_currency') || 'USD ($)';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDetecting, setIsDetecting] = useState(false);

  const fetchForecast = async () => {
    setLoading(true);
    try {
      const res = await forecast.get(30);
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error("Failed to load forecast", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, []);

  const handleDetectPatterns = async () => {
    setIsDetecting(true);
    try {
      await forecast.detect();
      await fetchForecast();
    } catch (err) {
      console.error("Failed to detect patterns", err);
    } finally {
      setIsDetecting(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-400"></div>
      </div>
    );
  }

  const chartData = [];
  
  if (data) {
    const toDateStr = (d) => new Date(d).toISOString().split('T')[0];

    const actualByDate = {};
    for (const exp of data.actualExpenses) {
      const key = toDateStr(exp.date);
      actualByDate[key] = (actualByDate[key] || 0) + exp.amount;
    }

    const projByDate = {};
    for (const p of data.projections) {
      const key = toDateStr(p.date);
      projByDate[key] = (projByDate[key] || 0) + p.amount;
    }

    const dates = [...new Set([
      ...Object.keys(actualByDate),
      ...Object.keys(projByDate)
    ])].sort();

    dates.forEach(date => {
      chartData.push({
        date,
        actual: actualByDate[date] ?? null,
        projected: projByDate[date] ?? null
      });
    });
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-7 max-w-7xl mx-auto pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <TrendingUp className="text-emerald-400" />
            Cash Flow Forecast
          </h1>
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300/80 mt-0.5">AI-powered forward projections based on your spending history</p>
        </div>
      </div>

      {/* Chart Card */}
      <div className="glass-card p-6 lg:p-7">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">30-Day Projection</h2>
            <p className="text-xs text-emerald-800 dark:text-emerald-300/70 font-medium">Actual vs projected daily cash outflow</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold">
            <div className="flex items-center gap-2 text-emerald-300">
              <div className="w-3 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
              <span>Actual</span>
            </div>
            <div className="flex items-center gap-2 text-cyan-300">
              <div className="w-3 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]"></div>
              <span>Projected</span>
            </div>
          </div>
        </div>
        <ForecastChart data={chartData} />
      </div>

      {/* Detected Patterns */}
      <div className="glass-card p-6 lg:p-7">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">Detected Recurring Patterns</h2>
            <p className="text-xs text-emerald-800 dark:text-emerald-300/70 font-medium">Machine learning cadence detection for regular bills</p>
          </div>
          <button 
            onClick={handleDetectPatterns}
            disabled={isDetecting}
            className="flex items-center gap-2 text-xs font-bold glass-btn text-white px-4 py-2.5 rounded-xl disabled:opacity-40 hover:text-emerald-300"
          >
            <RefreshCw size={14} className={isDetecting ? 'animate-spin' : ''} />
            <span>Re-detect Patterns</span>
          </button>
        </div>

        {data?.patterns?.length > 0 ? (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.patterns.map((pattern, idx) => (
              <motion.div 
                variants={itemVariants} 
                key={idx} 
                className="glass-elevated p-5 hover:translate-y-[-2px] border border-white/[0.06] hover:border-emerald-400/30 transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-3">
                  <CategoryBadge category={pattern.category} />
                  <span className="font-black text-base text-white">{formatCurrency(pattern.avgAmount, userCurrency)}</span>
                </div>
                <h3 className="font-bold text-sm text-white truncate mb-1" title={pattern.description}>
                  {pattern.description || `${pattern.category} Cycle`}
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Occurs every ~{Math.round(pattern.avgIntervalDays)} days
                </p>
                <div className="mt-4 pt-3 border-t border-white/[0.06]">
                  <div className="flex justify-between items-center text-[11px] text-slate-300 mb-1.5 font-semibold">
                    <span>Confidence</span>
                    <span className="font-bold text-emerald-300">{Math.round(pattern.confidence * 100)}%</span>
                  </div>
                  <div className="h-2 bg-[#021411] rounded-full overflow-hidden glass-inset">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-300 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                      style={{ width: `${Math.min(100, pattern.confidence * 100)}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-12 text-slate-400 text-sm">
            <Sparkles size={36} className="mx-auto mb-3 opacity-40 text-emerald-400" />
            <p className="font-bold text-white">No recurring patterns detected yet.</p>
            <p className="text-xs text-slate-400 mt-1">Add recurring expenses or run re-detection to analyze spending cadence.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Forecast;
