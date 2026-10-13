import React, { useEffect, useState, useCallback } from 'react';
import { 
  TrendingUp, ArrowUpRight, ArrowDownLeft, Users, CreditCard, 
  Plus, Sparkles, RefreshCw, Clock, ArrowRight, ShieldCheck, 
  Bell, CheckCircle2, Wallet, Coins, QrCode 
} from 'lucide-react';
import StatCard from '../components/StatCard';
import SmartNlpBar from '../components/SmartNlpBar';
import InstantKhataLookupBar from '../components/InstantKhataLookupBar';
import AiInsightsWidget from '../components/AiInsightsWidget';
import AddTransactionModal from '../components/AddTransactionModal';
import AddCustomerModal from '../components/AddCustomerModal';
import AiReminderModal from '../components/AiReminderModal';
import YouWillGetView from '../components/YouWillGetView';
import YouWillGiveView from '../components/YouWillGiveView';
import DueRemindersHub from '../components/DueRemindersHub';
import UpiQrModal from '../components/UpiQrModal';
import { useLanguage } from '../context/LanguageContext';
import { transactionApi } from '../api/transactionApi';
import { useSocket } from '../context/SocketContext';
import { Link } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from 'recharts';

const DashboardPage = () => {
  const { t } = useLanguage();
  const [summary, setSummary] = useState(null);
  const [marketSplit, setMarketSplit] = useState(null);
  const [loading, setLoading] = useState(true);

  // Active view tab: OVERVIEW | YOU_WILL_GET | YOU_WILL_GIVE | REMINDERS
  const [activeTab, setActiveTab] = useState('OVERVIEW');

  // Modals
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isUpiQrOpen, setIsUpiQrOpen] = useState(false);
  const [reminderCustomer, setReminderCustomer] = useState(null);

  // Pre-fill state for AddTransactionModal
  const [nlpPrefillData, setNlpPrefillData] = useState(null);
  const [preSelectedCustId, setPreSelectedCustId] = useState(null);
  const [defaultTxType, setDefaultTxType] = useState('GIVE');

  const { socket, isConnected } = useSocket();

  const fetchDashboardData = useCallback(async () => {
    try {
      const [sumRes, splitRes] = await Promise.all([
        transactionApi.getDashboardSummary(),
        transactionApi.getMarketSplit(),
      ]);
      setSummary(sumRes.data);
      setMarketSplit(splitRes.data);
    } catch (err) {
      console.warn('API error or server waking up, displaying fallback dashboard state:', err.message);
      setSummary((prev) => prev || {
        totalOutstandingCredit: 19300,
        totalGivenToday: 4500,
        totalCollectedToday: 2100,
        activeDebtorsCount: 4,
        pendingRemindersCount: 2,
      });
      setMarketSplit((prev) => prev || {
        totalYouWillGet: 19300,
        totalYouWillGive: 2500,
        netMarketPosition: 16800,
        youWillGetCount: 4,
        youWillGiveCount: 1,
        youWillGetList: [
          { id: 1, name: 'Ramesh Kumar', phone: '9876543211', netBalance: 4500, creditLimit: 15000, riskLevel: 'LOW' },
          { id: 2, name: 'Priya Singh', phone: '9876543212', netBalance: 3200, creditLimit: 10000, riskLevel: 'MEDIUM' },
          { id: 3, name: 'Amit Verma', phone: '9876543213', netBalance: 7500, creditLimit: 8000, riskLevel: 'HIGH' },
          { id: 4, name: 'Suresh Patel', phone: '9876543214', netBalance: 4100, creditLimit: 12000, riskLevel: 'LOW' },
        ],
        youWillGiveList: [
          { id: 5, name: 'Deepak Sharma', phone: '9876543215', netBalance: -2500, creditLimit: 5000, riskLevel: 'LOW' },
        ],
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Real-Time Multi-Device WebSocket Sync:
  // When another device or cron job records a transaction or reminder, state updates instantly!
  useEffect(() => {
    if (socket) {
      socket.on('ledger:updated', (data) => {
        console.log('⚡ [Live Sync] Ledger updated remotely:', data);
        fetchDashboardData();
      });

      socket.on('transaction:created', () => {
        fetchDashboardData();
      });

      socket.on('reminder:triggered', () => {
        fetchDashboardData();
      });
    }

    return () => {
      if (socket) {
        socket.off('ledger:updated');
        socket.off('transaction:created');
        socket.off('reminder:triggered');
      }
    };
  }, [socket, fetchDashboardData]);

  const handleNlpParsed = (data) => {
    setNlpPrefillData(data);
    setPreSelectedCustId(null);
    setDefaultTxType(data.type || 'GIVE');
    setIsAddTxOpen(true);
  };

  const handleQuickLookupAction = (customer, type) => {
    setPreSelectedCustId(customer.id);
    setDefaultTxType(type);
    setNlpPrefillData(null);
    setIsAddTxOpen(true);
  };

  const handleOpenReminder = (customer) => {
    setReminderCustomer(customer);
    setIsReminderModalOpen(true);
  };

  // Mock analytics chart data
  const chartData = [
    { name: 'Mon', Give: 1200, Receive: 800 },
    { name: 'Tue', Give: 2500, Receive: 1500 },
    { name: 'Wed', Give: 900, Receive: 2000 },
    { name: 'Thu', Give: 3100, Receive: 1200 },
    { name: 'Fri', Give: 1800, Receive: 2400 },
    { name: 'Sat', Give: 4200, Receive: 3500 },
    {
      name: 'Today',
      Give: summary?.totalGivenToday || 1500,
      Receive: summary?.totalCollectedToday || 2100,
    },
  ];

  const totalYouWillGet = marketSplit?.totalYouWillGet ?? (summary?.totalOutstandingCredit || 0);
  const totalYouWillGive = marketSplit?.totalYouWillGive ?? 0;
  const netMarketBalance = marketSplit?.netMarketPosition ?? (totalYouWillGet - totalYouWillGive);

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-100 tracking-tight">
              {t('ledgerOverview')}
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                isConnected
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}
            >
              {isConnected ? `● ${t('liveSync')}` : t('reconnecting')}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            {t('ledgerSubtext')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Store UPI QR Generator */}
          <button
            onClick={() => setIsUpiQrOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
            title="Instant Store UPI QR"
          >
            <QrCode className="w-4 h-4 text-emerald-400" />
            {t('collectUpi')}
          </button>

          <button
            onClick={() => {
              setNlpPrefillData(null);
              setPreSelectedCustId(null);
              setDefaultTxType('GIVE');
              setIsAddTxOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            {t('addEntry')}
          </button>

          <button
            onClick={() => setIsAddCustomerOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-all"
          >
            <Users className="w-4 h-4 text-indigo-400" />
            {t('newCustomer')}
          </button>
        </div>
      </div>

      {/* CORE FEATURE 1: Instant Number-Based Khata Bar */}
      <InstantKhataLookupBar onSelectTransactionAction={handleQuickLookupAction} />

      {/* Smart NLP Quick Entry Bar */}
      <SmartNlpBar onParsed={handleNlpParsed} />

      {/* Key Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* You Will Get (Debit / Udhaar Outstanding) */}
        <StatCard
          title={t('youWillGet')}
          value={`₹${totalYouWillGet.toLocaleString()}`}
          subtitle={`${marketSplit?.youWillGetCount || summary?.activeDebtorsCount || 0} active debtors`}
          icon={ArrowUpRight}
          type="give"
        />

        {/* You Will Give (Credit / Advance Received) */}
        <StatCard
          title={t('youWillGive')}
          value={`₹${totalYouWillGive.toLocaleString()}`}
          subtitle={`${marketSplit?.youWillGiveCount || 0} advance accounts held`}
          icon={ArrowDownLeft}
          type="receive"
        />

        {/* Net Market Balance */}
        <StatCard
          title={t('netMarketPosition')}
          value={`₹${Math.abs(netMarketBalance).toLocaleString()}`}
          subtitle={netMarketBalance >= 0 ? 'Net Receivable (+)' : 'Net Payable (-)'}
          icon={Wallet}
          type="info"
        />

        {/* Cash Collected Today */}
        <StatCard
          title="Collected Today"
          value={`₹${(summary?.totalCollectedToday || 0).toLocaleString()}`}
          subtitle="Cash & UPI in hand"
          icon={Coins}
          type="neutral"
        />
      </div>

      {/* CORE FEATURE 3: Tabbed Navigation for Separate Views */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'OVERVIEW'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800'
          }`}
        >
          {t('overview') || 'Overview & Trends'}
        </button>

        <button
          onClick={() => setActiveTab('YOU_WILL_GET')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'YOU_WILL_GET'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
              : 'text-slate-400 hover:text-rose-300 bg-slate-900/60 border border-slate-800'
          }`}
        >
          <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
          {t('youWillGet')} ({marketSplit?.youWillGetCount || 0})
        </button>

        <button
          onClick={() => setActiveTab('YOU_WILL_GIVE')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'YOU_WILL_GIVE'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'text-slate-400 hover:text-emerald-300 bg-slate-900/60 border border-slate-800'
          }`}
        >
          <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
          {t('youWillGive')} ({marketSplit?.youWillGiveCount || 0})
        </button>

        <button
          onClick={() => setActiveTab('REMINDERS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'REMINDERS'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          {t('dueReminders')} ({summary?.pendingRemindersCount || 0})
        </button>
      </div>

      {/* Tab 1: Overview & Analytics */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6 animate-fade-in">
          {/* AI Insights & Analytics Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* AI Cashflow Advisor Widget */}
            <div className="lg:col-span-1">
              <AiInsightsWidget />
            </div>

            {/* Financial Trends Bar Chart */}
            <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md shadow-xl flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-100">Weekly Udhaar vs Collection</h3>
                  <p className="text-xs text-slate-400">Credit given vs payments received across recent days</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-rose-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Udhaar Given
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Paisa Mila
                  </span>
                </div>
              </div>

              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' }}
                    />
                    <Bar dataKey="Give" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Receive" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent Transactions Table */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm text-slate-100">Recent Ledger Transactions</h3>
              </div>
              <Link
                to="/customers"
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
              >
                View Customer Directory <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {summary?.recentTransactions && summary.recentTransactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                      <th className="pb-3 px-2">Customer</th>
                      <th className="pb-3 px-2">Type</th>
                      <th className="pb-3 px-2">Mode</th>
                      <th className="pb-3 px-2">Note / Due Date</th>
                      <th className="pb-3 px-2 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {summary.recentTransactions.map((tx) => {
                      const isGive = tx.type === 'GIVE';
                      return (
                        <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-2 font-medium text-slate-200">
                            <Link to={`/customers/${tx.customerId}`} className="hover:underline hover:text-indigo-400">
                              {tx.customerName}
                            </Link>
                            <p className="text-[10px] text-slate-500">{tx.customerPhone}</p>
                          </td>
                          <td className="py-3 px-2">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                              isGive ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            }`}>
                              {isGive ? 'Udhaar Diya' : 'Paisa Mila'}
                            </span>
                          </td>
                          <td className="py-3 px-2 font-semibold text-slate-400">{tx.paymentMode}</td>
                          <td className="py-3 px-2 text-slate-400">
                            <div>{tx.note || '-'}</div>
                            {tx.dueDate && (
                              <div className="text-[10px] text-indigo-400 font-medium flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3" /> Due: {new Date(tx.dueDate).toLocaleDateString()}
                              </div>
                            )}
                          </td>
                          <td className={`py-3 px-2 text-right font-extrabold text-sm ${isGive ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {isGive ? '-' : '+'}₹{tx.amount?.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs">
                No transactions recorded yet. Click "Add Entry" or use the Instant Khata bar above!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: You Will Get View */}
      {activeTab === 'YOU_WILL_GET' && (
        <div className="animate-fade-in">
          <YouWillGetView
            customers={marketSplit?.youWillGetCustomers || []}
            onSendReminder={handleOpenReminder}
            onAddEntry={(cust, type) => handleQuickLookupAction(cust, type)}
          />
        </div>
      )}

      {/* Tab 3: You Will Give View */}
      {activeTab === 'YOU_WILL_GIVE' && (
        <div className="animate-fade-in">
          <YouWillGiveView
            customers={marketSplit?.youWillGiveCustomers || []}
            onAddEntry={(cust, type) => handleQuickLookupAction(cust, type)}
          />
        </div>
      )}

      {/* Tab 4: Due Reminders Hub */}
      {activeTab === 'REMINDERS' && (
        <div className="animate-fade-in">
          <DueRemindersHub />
        </div>
      )}

      {/* Modals */}
      <AddTransactionModal
        isOpen={isAddTxOpen}
        onClose={() => {
          setIsAddTxOpen(false);
          setNlpPrefillData(null);
          setPreSelectedCustId(null);
        }}
        onSuccess={fetchDashboardData}
        initialData={nlpPrefillData}
        preSelectedCustomerId={preSelectedCustId}
        defaultType={defaultTxType}
      />

      <AddCustomerModal
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
        onSuccess={fetchDashboardData}
      />

      {reminderCustomer && (
        <AiReminderModal
          isOpen={isReminderModalOpen}
          onClose={() => {
            setIsReminderModalOpen(false);
            setReminderCustomer(null);
          }}
          customer={reminderCustomer}
        />
      )}

      {/* Instant Store UPI QR Modal */}
      <UpiQrModal
        isOpen={isUpiQrOpen}
        onClose={() => setIsUpiQrOpen(false)}
        initialAmount={0}
      />
    </div>
  );
};

export default DashboardPage;
