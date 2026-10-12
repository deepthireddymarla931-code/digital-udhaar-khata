import React, { useState } from 'react';
import { ArrowDownLeft, ExternalLink, PackageCheck, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const YouWillGiveView = ({ customers = [], onAddEntry }) => {
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
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            You Will Give (Advance Received / Creditors List)
          </h3>
          <p className="text-xs text-slate-400">
            Customers who paid advance deposit or to whom you owe goods or refund
          </p>
        </div>

        <input
          type="text"
          placeholder="Filter creditors by name or phone..."
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
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Phone</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Advance Amount (₹)</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3">
                    <Link
                      to={`/customers/${c.id}`}
                      className="font-bold text-slate-200 hover:text-indigo-400 flex items-center gap-1.5"
                    >
                      {c.name}
                      <ExternalLink className="w-3 h-3 text-slate-500" />
                    </Link>
                  </td>

                  <td className="py-3 px-3 text-slate-400 font-mono">{c.phone}</td>

                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                      Advance Paid (Deposit)
                    </span>
                  </td>

                  <td className="py-3 px-3 text-right font-black text-sm text-emerald-400">
                    ₹{c.amountToGive?.toLocaleString() || Math.abs(c.netBalance).toLocaleString()}
                  </td>

                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => onAddEntry && onAddEntry(c, 'GIVE')}
                      className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-bold text-[11px] inline-flex items-center gap-1 transition-all"
                      title="Deliver goods on credit or settle"
                    >
                      <Plus className="w-3 h-3" />
                      Deliver Goods (Udhaar Diya)
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-500 text-xs border border-slate-800 rounded-2xl bg-slate-900/40">
          No advance customer deposits currently held.
        </div>
      )}
    </div>
  );
};

export default YouWillGiveView;
