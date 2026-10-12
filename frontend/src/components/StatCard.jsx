import React from 'react';

const StatCard = ({ title, value, subtitle, icon: Icon, type = 'neutral' }) => {
  const getColors = () => {
    switch (type) {
      case 'give':
        return {
          bg: 'from-rose-950/30 to-rose-900/10 border-rose-500/30',
          iconBg: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
          text: 'text-rose-400',
        };
      case 'receive':
        return {
          bg: 'from-emerald-950/30 to-emerald-900/10 border-emerald-500/30',
          iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          text: 'text-emerald-400',
        };
      case 'info':
        return {
          bg: 'from-indigo-950/30 to-indigo-900/10 border-indigo-500/30',
          iconBg: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
          text: 'text-indigo-300',
        };
      default:
        return {
          bg: 'from-slate-900 to-slate-800/50 border-slate-700/50',
          iconBg: 'bg-slate-800 text-slate-300 border-slate-700',
          text: 'text-slate-200',
        };
    }
  };

  const style = getColors();

  return (
    <div className={`p-5 rounded-2xl bg-gradient-to-br ${style.bg} border backdrop-blur-sm shadow-lg transition-all hover:scale-[1.01]`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className={`text-2xl lg:text-3xl font-extrabold mt-1 tracking-tight ${style.text}`}>
            {value}
          </h3>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl border ${style.iconBg} shadow-inner`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
