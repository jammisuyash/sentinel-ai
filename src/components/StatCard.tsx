import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'motion/react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColorClass?: string;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  trendType?: 'danger' | 'positive' | 'neutral' | 'warning';
  subtext?: string;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  iconColorClass = 'text-red-500',
  trend,
  trendDirection,
  trendType = 'neutral',
  subtext,
}: StatCardProps) {
  
  const getTrendColor = () => {
    switch (trendType) {
      case 'danger':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'positive':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'warning':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const getTrendIcon = () => {
    if (trendDirection === 'up') return <TrendingUp className="w-3 h-3 shrink-0" />;
    if (trendDirection === 'down') return <TrendingDown className="w-3 h-3 shrink-0" />;
    return <Minus className="w-3 h-3 shrink-0" />;
  };

  return (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className="relative rounded bg-slate-950 border border-slate-900 p-5 flex flex-col justify-between overflow-hidden group select-none shadow-md shadow-slate-950/40"
    >
      {/* Decorative background grid and corner crosshairs */}
      <div className="absolute inset-0 tactical-grid opacity-[0.2]" />
      <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-slate-800" />
      <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-slate-800" />

      {/* Header Row */}
      <div className="flex justify-between items-start z-10">
        <div>
          <p className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
            {title}
          </p>
          <h3 className="font-mono text-2xl font-bold tracking-tight text-slate-100 mt-2.5">
            {value}
          </h3>
        </div>
        <div className={`w-8.5 h-8.5 rounded border border-slate-850 flex items-center justify-center bg-slate-900/50 group-hover:border-slate-700 transition-colors ${iconColorClass}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      {/* Footer Sparklines / Trend Row */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-900 z-10">
        {trend ? (
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border font-mono text-[9px] font-bold uppercase tracking-wider ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{trend}</span>
          </div>
        ) : (
          <div className="h-4" />
        )}
        
        {subtext && (
          <span className="font-mono text-[10px] text-slate-500 uppercase">
            {subtext}
          </span>
        )}
      </div>

      {/* Glow highlight effect */}
      <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition-colors duration-300 pointer-events-none" />
    </motion.div>
  );
}
