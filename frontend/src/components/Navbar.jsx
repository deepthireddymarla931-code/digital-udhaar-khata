import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useLanguage } from '../context/LanguageContext';
import { Store, LogOut, Radio, Sparkles, QrCode } from 'lucide-react';
import { Link } from 'react-router-dom';
import LanguageSelector from './LanguageSelector';
import UpiQrModal from './UpiQrModal';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
  const { t } = useLanguage();
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  return (
    <>
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
                  {t('appName')}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> {t('aiPowered')}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">{t('tagline')}</p>
            </div>
          </Link>

          {/* Quick Actions, Language, Real-Time Sync & Profile */}
          <div className="flex items-center gap-2.5">
            {/* Quick UPI QR Modal Trigger */}
            <button
              onClick={() => setIsQrModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-bold text-xs shadow-sm transition-all"
              title="Show Store UPI QR Code for instant payment"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">{t('collectUpi')}</span>
            </button>

            {/* Language Selector Dropdown */}
            <LanguageSelector />

            {/* Live Sync Status Badge */}
            <div
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${
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
              <span>{isConnected ? t('liveSync') : t('reconnecting')}</span>
            </div>

            {user && (
              <div className="flex items-center gap-2.5">
                <div className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
                  <div className="w-7 h-7 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-xs">
                    {user.shopName ? user.shopName.charAt(0).toUpperCase() : 'S'}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-200 leading-tight">{user.shopName || 'Shop'}</p>
                    <p className="text-[10px] text-slate-400 leading-tight">{user.name}</p>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-rose-500/20 hover:border-rose-500/40 border border-slate-700 rounded-lg transition-all"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span className="hidden sm:inline">{t('logout')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global UPI QR Modal */}
      <UpiQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        initialAmount={0}
      />
    </>
  );
};

export default Navbar;
