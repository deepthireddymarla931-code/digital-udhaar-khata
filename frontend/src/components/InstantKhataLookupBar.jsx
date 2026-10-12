import React, { useState, useEffect } from 'react';
import { Phone, Search, UserCheck, UserPlus, ArrowUpRight, ArrowDownLeft, ExternalLink, Loader2, X } from 'lucide-react';
import { customerApi } from '../api/customerApi';
import { useNavigate } from 'react-router-dom';

const InstantKhataLookupBar = ({ onSelectTransactionAction }) => {
  const [phoneQuery, setPhoneQuery] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [creating, setCreating] = useState(false);
  const [quickCreatedCustomer, setQuickCreatedCustomer] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const clean = phoneQuery.replace(/[^0-9]/g, '');
    if (clean.length < 3) {
      setLookupResult(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await customerApi.lookupByPhone(clean);
        setLookupResult(res.data);
      } catch (err) {
        console.error('Error during instant phone lookup:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [phoneQuery]);

  const handleQuickCreate = async (e) => {
    e.preventDefault();
    if (!newCustomerName.trim() || !phoneQuery.trim()) return;

    setCreating(true);
    try {
      const res = await customerApi.quickLookupOrCreate({
        phone: phoneQuery.trim(),
        name: newCustomerName.trim(),
        creditLimit: 10000,
      });

      if (res.data && res.data.customer) {
        setLookupResult({
          exists: true,
          customer: res.data.customer,
          recentTransactions: [],
        });
        setQuickCreatedCustomer(res.data.customer);
      }
    } catch (err) {
      console.error('Error creating customer on-the-fly:', err);
    } finally {
      setCreating(false);
    }
  };

  const clearSearch = () => {
    setPhoneQuery('');
    setLookupResult(null);
    setNewCustomerName('');
    setQuickCreatedCustomer(null);
  };

  const activeCustomer = lookupResult?.customer || quickCreatedCustomer;

  return (
    <div className="p-4 md:p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 via-indigo-950/20 to-slate-900/90 border border-indigo-500/30 shadow-xl backdrop-blur-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Phone className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
              Instant Number-Based Khata
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase tracking-wider">
                Live Lookup
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Type or paste any 10-digit mobile number to immediately fetch or create their ledger
            </p>
          </div>
        </div>

        {phoneQuery && (
          <button
            onClick={clearSearch}
            className="self-start md:self-auto text-xs text-slate-400 hover:text-white flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 transition-all"
          >
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {/* Input Search Box */}
      <div className="relative">
        <input
          type="tel"
          value={phoneQuery}
          onChange={(e) => setPhoneQuery(e.target.value)}
          placeholder="Enter customer mobile number (e.g. 9811223344)..."
          className="w-full bg-slate-950/90 text-slate-100 placeholder-slate-500 border border-slate-800 rounded-xl pl-11 pr-10 py-3 text-sm font-semibold tracking-wide focus:outline-none focus:border-indigo-500 shadow-inner"
        />
        <Search className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
        {loading && (
          <Loader2 className="w-4 h-4 text-indigo-400 animate-spin absolute right-4 top-3.5" />
        )}
      </div>

      {/* Result Card: Customer Exists */}
      {lookupResult?.exists && activeCustomer && (
        <div className="mt-3 p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-base">
              {activeCustomer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-100">{activeCustomer.name}</span>
                <span className="text-xs text-slate-400">({activeCustomer.phone})</span>
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-xs">
                <span className="text-slate-400">Net Ledger Balance:</span>
                <span
                  className={`font-black ${
                    activeCustomer.netBalance > 0
                      ? 'text-rose-400'
                      : activeCustomer.netBalance < 0
                      ? 'text-emerald-400'
                      : 'text-slate-300'
                  }`}
                >
                  ₹{Math.abs(activeCustomer.netBalance).toLocaleString()}{' '}
                  <span className="text-[10px] font-bold uppercase">
                    {activeCustomer.netBalance > 0
                      ? '(You Will Get)'
                      : activeCustomer.netBalance < 0
                      ? '(You Will Give)'
                      : '(Settled)'}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Transaction Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectTransactionAction && onSelectTransactionAction(activeCustomer, 'GIVE')}
              className="px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
              Udhaar Diya
            </button>

            <button
              onClick={() => onSelectTransactionAction && onSelectTransactionAction(activeCustomer, 'RECEIVE')}
              className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
            >
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
              Paisa Mila
            </button>

            <button
              onClick={() => navigate(`/customers/${activeCustomer.id}`)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-1 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Result Card: New Mobile Number Detected -> Quick On-The-Fly Create */}
      {lookupResult && !lookupResult.exists && phoneQuery.length >= 7 && (
        <form
          onSubmit={handleQuickCreate}
          className="mt-3 p-4 rounded-xl bg-slate-950/80 border border-indigo-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3 animate-fade-in"
        >
          <div className="flex items-center gap-2.5">
            <UserPlus className="w-5 h-5 text-indigo-400" />
            <div>
              <p className="text-xs font-bold text-slate-200">
                New Number: <span className="text-indigo-400 font-mono">{phoneQuery}</span>
              </p>
              <p className="text-[11px] text-slate-400">Enter customer name to create their Khata instantly:</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-1 md:max-w-xs">
            <input
              type="text"
              placeholder="Customer Full Name..."
              value={newCustomerName}
              onChange={(e) => setNewCustomerName(e.target.value)}
              className="w-full bg-slate-900 text-slate-100 placeholder-slate-500 border border-slate-700 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500"
              required
            />
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 shadow-md shadow-indigo-600/30"
            >
              {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Create Khata'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default InstantKhataLookupBar;
