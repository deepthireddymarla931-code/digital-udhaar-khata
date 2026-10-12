import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Store, LogOut, Radio, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();

  return (
    <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3">
      <div className="flex items-center justify-between">
        {/* Brand Title */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                Digital Udhaar Khata
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> AI Powered
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Smart Ledger & Credit System</p>
          </div>
        </Link>

        {/* Real-Time Sync Status + Merchant Info & Logout */}
        <div className="flex items-center gap-3">
          {/* Live Sync Status Badge */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${
              isConnected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}
            title={isConnected ? 'Instant WebSocket Sync Active' : 'Connecting to WebSocket...'}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-ping'
              }`}
            />
            <Radio className="w-3 h-3" />
            <span>{isConnected ? 'Live Ledger Sync' : 'Reconnecting...'}</span>
          </div>

          {user && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
                <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-sm">
                  {user.shopName ? user.shopName.charAt(0).toUpperCase() : 'S'}
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-slate-200">{user.shopName || 'Shop'}</p>
                  <p className="text-[10px] text-slate-400">{user.name}</p>
                </div>
              </div>

              <button
                onClick={logout}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-rose-500/20 hover:border-rose-500/40 border border-slate-700 rounded-lg transition-all"
                title="Logout"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
