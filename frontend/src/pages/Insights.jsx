import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, TrendingUp, PieChart, Calendar, DollarSign, Receipt, Sparkles } from 'lucide-react';
import { insights } from '../lib/api';

const iconMap = {
  TrendingUp,
  PieChart,
  Calendar,
  DollarSign,
  Receipt
};

const Insights = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const res = await insights.get();
        if (res.success) {
          setData(res.data.insights || []);
        }
      } catch (err) {
        console.error("Failed to load insights", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.96, y: 15 },
    show: { opacity: 1, scale: 1, y: 0 }
  };

  return (
    <div className="space-y-7 max-w-7xl mx-auto pb-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Lightbulb className="text-emerald-400" />
            Spending Insights
          </h1>
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300/80 mt-0.5">Automated AI intelligence to optimize your budget</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-9 w-9 border-t-2 border-b-2 border-emerald-400"></div>
        </div>
      ) : data.length > 0 ? (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          {data.map((insight, idx) => {
            const IconComponent = iconMap[insight.icon] || Lightbulb;
            
            return (
              <motion.div 
                key={idx}
                variants={itemVariants}
                className="glass-card flex flex-col justify-between overflow-hidden hover:translate-y-[-3px] transition-all duration-300 group"
              >
                <div className="p-6 flex-1">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-400/30 shadow-[0_0_20px_rgba(16,185,129,0.2)] flex items-center justify-center mb-5 text-emerald-300 group-hover:scale-105 transition-transform">
                    <IconComponent size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{insight.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    {insight.description}
                  </p>
                </div>
                {insight.actionText && (
                  <div className="px-6 py-3.5 border-t border-white/[0.06] bg-black/20">
                    <button className="text-emerald-300 hover:text-white font-bold text-xs transition-colors flex items-center gap-1.5">
                      <span>{insight.actionText}</span>
                      <span>&rarr;</span>
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <div className="glass-card p-14 text-center max-w-xl mx-auto">
          <div className="w-16 h-16 bg-emerald-500/15 border border-emerald-400/30 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_25px_rgba(16,185,129,0.25)] text-emerald-300">
            <Sparkles size={28} />
          </div>
          <h2 className="text-lg font-bold text-white mb-1.5">Analyzing your financial patterns</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Keep logging your daily transactions. Our AI will automatically identify habits, anomalies, and cost-saving opportunities as data gathers.
          </p>
        </div>
      )}
    </div>
  );
};

export default Insights;
