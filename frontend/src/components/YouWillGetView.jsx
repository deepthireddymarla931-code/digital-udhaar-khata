import React, { useState } from 'react';
import { ArrowUpRight, Send, AlertTriangle, ShieldAlert, ShieldCheck, Phone, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import CustomerRiskBadge from './CustomerRiskBadge';

const YouWillGetView = ({ customers = [], onSendReminder, onAddEntry }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-extrabold text-base text-slate-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            You Will Get (Udhaar / Debtors List)
          </h3>
          <p className="text-xs text-slate-400">
            Customers with pending market credit who owe you money
          </p>
        </div>

        <input
          type="text"
          placeholder="Filter debtors by name or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-slate-950 text-slate-100 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500 w-full sm:w-64"
        />
      </div>

      {filtered.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider bg-slate-950/40">
                <th className="py-3 px-3">Debtor</th>
                <th className="py-3 px-3">Risk Rating</th>
                <th className="py-3 px-3">Credit Limit Usage</th>
                <th className="py-3 px-3 text-right">Amount Owed (₹)</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((c) => {
                const limit = c.creditLimit || 10000;
                const ratio = Math.min(100, Math.max(0, (c.netBalance / limit) * 100));

                return (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3">
                      <Link
                        to={`/customers/${c.id}`}
                        className="font-bold text-slate-200 hover:text-indigo-400 flex items-center gap-1.5"
                      >
                        {c.name}
                        <ExternalLink className="w-3 h-3 text-slate-500" />
                      </Link>
                      <p className="text-[10px] text-slate-400">{c.phone}</p>
                    </td>

                    <td className="py-3 px-3">
                      <CustomerRiskBadge riskLevel={c.riskLevel} />
                    </td>

                    <td className="py-3 px-3 min-w-[140px]">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                        <span>₹{c.netBalance.toLocaleString()}</span>
                        <span>₹{limit.toLocaleString()}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            ratio > 85 ? 'bg-rose-500' : ratio > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${ratio}%` }}
                        />
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right font-black text-sm text-rose-400">
                      ₹{c.netBalance.toLocaleString()}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onSendReminder && onSendReminder(c)}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-bold text-[11px] flex items-center gap-1 transition-all"
                          title="Send SMS / WhatsApp Payment Reminder"
                        >
                          <Send className="w-3 h-3 text-indigo-400" />
                          Remind
                        </button>

                        <button
                          onClick={() => onAddEntry && onAddEntry(c, 'RECEIVE')}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold text-[11px] flex items-center gap-1 transition-all"
                          title="Record Payment (Paisa Mila)"
                        >
                          + Receive
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-500 text-xs border border-slate-800 rounded-2xl bg-slate-900/40">
          No active debtors who owe you money. Market credit position is completely clear!
        </div>
      )}
    </div>
  );
};

export default YouWillGetView;
