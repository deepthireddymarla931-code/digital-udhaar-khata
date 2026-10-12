import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, Sparkles, FileText, ArrowRightLeft } from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/customers', label: 'Customers Directory', icon: Users },
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

        {/* AI Features Highlight Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-900/40 to-purple-900/20 border border-indigo-500/20">
          <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs mb-2">
            <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
            AI Assistant Ready
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
            Natural language entry, automated WhatsApp reminders, and credit risk scoring active.
          </p>
          <div className="text-[10px] text-indigo-400 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            Aiven MySQL Cloud Linked
          </div>
        </div>
      </div>

      {/* Quick Footer Info */}
      <div className="text-xs text-slate-500 px-3 border-t border-slate-800/60 pt-4">
        <p className="font-semibold text-slate-400">Digital Udhaar Khata</p>
        <p className="text-[10px]">v1.0.0 • Production Ready</p>
      </div>
    </aside>
  );
};

export default Sidebar;
