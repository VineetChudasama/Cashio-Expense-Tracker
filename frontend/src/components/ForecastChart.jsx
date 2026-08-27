import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#031512]/90 backdrop-blur-xl border border-white/10 border-t-emerald-400/40 p-3.5 rounded-2xl shadow-2xl">
        <p className="font-bold text-white text-xs mb-2">
          {label ? format(new Date(label), 'MMM dd, yyyy') : ''}
        </p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-400 capitalize font-medium">{entry.name}:</span>
            <span className="font-bold text-white">${Number(entry.value || 0).toFixed(2)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const ForecastChart = ({ data }) => {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.45}/>
              <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
            </linearGradient>
            <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.35}/>
              <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="#94A3B8" 
            fontSize={11}
            tickFormatter={(str) => {
              try { return format(new Date(str), 'MMM dd'); } catch { return str; }
            }}
            tickMargin={10}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            stroke="#94A3B8" 
            fontSize={11}
            tickFormatter={(val) => `$${val}`}
            tickMargin={10}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="actual" 
            stroke="#10B981" 
            strokeWidth={2.5}
            fillOpacity={1} 
            fill="url(#colorActual)" 
            name="Actual"
          />
          <Area 
            type="monotone" 
            dataKey="projected" 
            stroke="#06B6D4" 
            strokeDasharray="4 4"
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorProjected)" 
            name="Projected"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ForecastChart;
