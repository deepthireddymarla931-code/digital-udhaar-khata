import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Sparkles, QrCode } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Sidebar = () => {
  const { t } = useLanguage();

  const navItems = [
    { path: '/', label: t('dashboard'), icon: LayoutDashboard },
    { path: '/customers', label: t('customersDirectory'), icon: Users },
  ];

  return (
    <aside className="w-64 bg-slate-900/90 border-r border-slate-800 p-4 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-65px)]">
      <div className="space-y-6">
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">Main Menu</p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-md shadow-indigo-950/40'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* AI & Features Highlight Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-900/40 to-purple-900/20 border border-indigo-500/20 space-y-2">
          <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs">
            <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
            AI Assistant & UPI Ready
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Dynamic UPI QR codes, instant WhatsApp reminders, and PDF statements enabled.
          </p>
          <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-1.5 pt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            Real-Time Engine Active
          </div>
        </div>
      </div>

      {/* Quick Footer Info */}
      <div className="text-xs text-slate-500 px-3 border-t border-slate-800/60 pt-4">
        <p className="font-semibold text-slate-400">{t('appName')}</p>
        <p className="text-[10px]">v2.2.0 • Real-Time Cloud Edition</p>
      </div>
    </aside>
  );
};

export default Sidebar;
