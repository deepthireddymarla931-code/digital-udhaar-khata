import React, { useEffect, useState } from 'react';
import { 
  Users, Search, UserPlus, Phone, Mail, MapPin, 
  ArrowUpRight, Send, ChevronRight, Filter, ShieldAlert,
  FileSpreadsheet, QrCode
} from 'lucide-react';
import { customerApi } from '../api/customerApi';
import { useLanguage } from '../context/LanguageContext';
import CustomerRiskBadge from '../components/CustomerRiskBadge';
import AddCustomerModal from '../components/AddCustomerModal';
import AiReminderModal from '../components/AiReminderModal';
import UpiQrModal from '../components/UpiQrModal';
import { exportAllCustomersCsv } from '../utils/statementExporter';
import { offlineStore } from '../utils/offlineStore';
import { Link } from 'react-router-dom';

const CustomersPage = () => {
  const { t } = useLanguage();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL'); // ALL, OWES, SETTLED, HIGH_RISK
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [selectedReminderCustomer, setSelectedReminderCustomer] = useState(null);
  const [selectedQrCustomer, setSelectedQrCustomer] = useState(null);

  const fetchCustomers = async (query = search) => {
    setLoading(true);
    try {
      const res = await customerApi.getAll(query);
      setCustomers(res.data);
    } catch (err) {
      console.warn('API error or server waking up, using fallback customer directory:', err.message);
      setCustomers(offlineStore.getCustomers(query));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCustomers(search);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  useEffect(() => {
    const handleUpdate = () => fetchCustomers(search);
    window.addEventListener('duk:offline_data_updated', handleUpdate);
    return () => window.removeEventListener('duk:offline_data_updated', handleUpdate);
  }, [search]);

  const filteredCustomers = customers.filter((c) => {
    if (filter === 'OWES') return c.status === 'OWES';
    if (filter === 'SETTLED') return c.status === 'SETTLED' || c.status === 'ADVANCE';
    if (filter === 'HIGH_RISK') return c.riskLevel === 'HIGH';
    return true;
  });

  const handleExportAll = () => {
    try {
      exportAllCustomersCsv(customers);
    } catch (err) {
      alert('Failed to export ledger: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
            {t('customersDirectory')}
          </h1>
          <p className="text-xs text-slate-400">
            Manage customer profiles, credit limits, net balance, and safety ratings
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          {/* Export Full Ledger CSV Button */}
          <button
            onClick={handleExportAll}
            disabled={customers.length === 0}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm"
            title="Download full customer accounts directory in CSV for Microsoft Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            {t('exportLedgerCsv')}
          </button>

          <button
            onClick={() => setIsAddCustomerOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            {t('newCustomer')}
          </button>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchCustomer')}
            className="w-full bg-slate-900 text-slate-100 placeholder-slate-500 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 font-medium"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 w-full sm:w-auto text-xs">
            {[
              { id: 'ALL', label: t('all') },
              { id: 'OWES', label: t('owesMoney') },
              { id: 'SETTLED', label: t('settled') },
              { id: 'HIGH_RISK', label: t('highRisk') },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`py-1.5 px-3 rounded-lg font-bold transition-all text-center ${
                  filter === f.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Customer Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs animate-pulse">
          Loading customer accounts...
        </div>
      ) : filteredCustomers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((customer) => {
            const owesMoney = customer.netBalance > 0;
            return (
              <div
                key={customer.id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between shadow-lg group"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="font-extrabold text-base text-slate-100 group-hover:text-indigo-300 transition-colors">
                        {customer.name}
                      </h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-indigo-400" />
                        {customer.phone}
                      </p>
                    </div>
                    <CustomerRiskBadge level={customer.riskLevel} />
                  </div>

                  {/* Address / Email */}
                  {customer.address && (
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mb-3">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {customer.address}
                    </p>
                  )}

                  {/* Net Balance Box */}
                  <div className={`p-3 rounded-xl border mb-4 ${
                    owesMoney
                      ? 'bg-rose-950/30 border-rose-500/30 text-rose-400'
                      : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        {owesMoney ? `${t('youWillGet')}` : customer.netBalance < 0 ? `${t('youWillGive')}` : t('settled')}
                      </span>
                      <span className="text-lg font-black">
                        ₹{Math.abs(customer.netBalance).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 border-t border-slate-800/40 pt-1">
                      <span>{t('creditLimit')}: ₹{customer.creditLimit?.toLocaleString()}</span>
                      <span>Total Given: ₹{customer.totalGiven?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                  {owesMoney && (
                    <button
                      onClick={() => setSelectedQrCustomer(customer)}
                      className="py-2 px-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                      title="Generate UPI QR"
                    >
                      <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                      QR
                    </button>
                  )}

                  {owesMoney && (
                    <button
                      onClick={() => setSelectedReminderCustomer(customer)}
                      className="flex-1 py-2 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                      title="AI WhatsApp Reminder"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Remind
                    </button>
                  )}

                  <Link
                    to={`/customers/${customer.id}`}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1 transition-colors"
                  >
                    View Ledger
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center text-slate-500 text-xs bg-slate-900/40 border border-slate-800 rounded-2xl">
          No matching customer accounts found.
        </div>
      )}

      {/* Modals */}
      <AddCustomerModal
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
        onSuccess={() => fetchCustomers(search)}
      />

      {selectedReminderCustomer && (
        <AiReminderModal
          isOpen={!!selectedReminderCustomer}
          onClose={() => setSelectedReminderCustomer(null)}
          customerId={selectedReminderCustomer.id}
          customerName={selectedReminderCustomer.name}
        />
      )}

      {selectedQrCustomer && (
        <UpiQrModal
          isOpen={!!selectedQrCustomer}
          onClose={() => setSelectedQrCustomer(null)}
          customer={selectedQrCustomer}
          initialAmount={selectedQrCustomer.netBalance > 0 ? selectedQrCustomer.netBalance : 0}
        />
      )}
    </div>
  );
};

export default CustomersPage;
