import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Phone, Mail, MapPin, Plus, ArrowUpRight, ArrowDownLeft, 
  Send, Download, ShieldCheck, ShieldAlert, Sparkles, Loader2, Calendar, Clock 
} from 'lucide-react';
import { customerApi } from '../api/customerApi';
import { transactionApi } from '../api/transactionApi';
import { aiApi } from '../api/aiApi';
import { reminderApi } from '../api/reminderApi';
import CustomerRiskBadge from '../components/CustomerRiskBadge';
import AddTransactionModal from '../components/AddTransactionModal';
import AiReminderModal from '../components/AiReminderModal';

const CustomerDetailPage = () => {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [riskAssessment, setRiskAssessment] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [txType, setTxType] = useState('GIVE');
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [sendingReminderId, setSendingReminderId] = useState(null);

  const fetchCustomerDetails = async () => {
    setLoading(true);
    try {
      const [custRes, txRes, riskRes] = await Promise.all([
        customerApi.getById(id),
        transactionApi.getByCustomer(id),
        aiApi.getRiskAssessment(id),
      ]);
      setCustomer(custRes.data);
      setTransactions(txRes.data);
      setRiskAssessment(riskRes.data);
    } catch (err) {
      console.error('Error fetching customer details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchCustomerDetails();
  }, [id]);

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const response = await aiApi.downloadPdfStatement(id);
      const blob = new Blob([response.data], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Statement_${customer?.name || 'Customer'}_${id}.txt`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download statement');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleQuickSendReminder = async (tx) => {
    setSendingReminderId(tx.id);
    try {
      await reminderApi.triggerManual({
        transactionId: tx.id,
        customerId: customer.id,
        channel: tx.reminderChannel || 'SMS',
      });
      alert(`Automated SMS reminder dispatched to ${customer.name}!`);
      fetchCustomerDetails();
    } catch (err) {
      alert('Failed to dispatch reminder');
    } finally {
      setSendingReminderId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 text-xs animate-pulse">
        Loading customer ledger...
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="py-20 text-center text-slate-400">
        <p>Customer account not found.</p>
        <Link to="/customers" className="text-indigo-400 font-bold text-xs underline mt-2 inline-block">
          Return to Customer Directory
        </Link>
      </div>
    );
  }

  const owesMoney = customer.netBalance > 0;
  const creditLimit = customer.creditLimit || 10000;
  const usagePercentage = Math.min(100, Math.max(0, (customer.netBalance / creditLimit) * 100));

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link to="/customers" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Customers
      </Link>

      {/* Customer Header Card */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">{customer.name}</h1>
              <CustomerRiskBadge level={customer.riskLevel} />
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-1">
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-indigo-400" />
                {customer.phone}
              </span>
              {customer.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                  {customer.email}
                </span>
              )}
              {customer.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  {customer.address}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => { setTxType('GIVE'); setIsAddTxOpen(true); }}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-600/30 transition-all"
            >
              <ArrowUpRight className="w-4 h-4" />
              Give Udhaar (Red)
            </button>

            <button
              onClick={() => { setTxType('RECEIVE'); setIsAddTxOpen(true); }}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 transition-all"
            >
              <ArrowDownLeft className="w-4 h-4" />
              Receive Paisa (Green)
            </button>

            {owesMoney && (
              <button
                onClick={() => setIsReminderOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 font-bold text-xs flex items-center gap-1.5 transition-all"
              >
                <Send className="w-4 h-4" />
                AI WhatsApp Reminder
              </button>
            )}

            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-all"
            >
              {downloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-indigo-400" />}
              Account Statement
            </button>
          </div>
        </div>

        {/* Credit Limit & Balance Summary Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Net Balance</span>
            <p className={`text-2xl font-black mt-1 ${owesMoney ? 'text-rose-400' : customer.netBalance < 0 ? 'text-emerald-400' : 'text-slate-200'}`}>
              ₹{Math.abs(customer.netBalance).toLocaleString()}
              <span className="text-xs font-normal ml-2 text-slate-400">
                ({owesMoney ? 'Customer Owes (You Will Get)' : customer.netBalance < 0 ? 'Advance Credit (You Will Give)' : 'Settled'})
              </span>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Credit Limit Utilization</span>
            <div className="flex items-center justify-between text-xs font-bold text-slate-200 mt-1">
              <span>Used: ₹{customer.netBalance > 0 ? customer.netBalance : 0}</span>
              <span>Limit: ₹{creditLimit.toLocaleString()}</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${usagePercentage > 85 ? 'bg-rose-500' : usagePercentage > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${usagePercentage}%` }}
              ></div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Metrics</span>
            <div className="flex items-center justify-between text-xs mt-1 text-slate-300 font-medium">
              <span>Total Given: <strong className="text-rose-400">₹{customer.totalGiven?.toLocaleString()}</strong></span>
              <span>Total Received: <strong className="text-emerald-400">₹{customer.totalReceived?.toLocaleString()}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Safety Recommendation Banner */}
      {riskAssessment && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 to-slate-900 border border-indigo-500/30 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-extrabold text-slate-200 flex items-center gap-2">
              AI Credit Risk Safety Score: <span className="text-indigo-400 font-black">{riskAssessment.riskScore} / 100</span>
            </h4>
            <p className="text-slate-400 mt-0.5">{riskAssessment.recommendation}</p>
          </div>
        </div>
      )}

      {/* Transaction History Table */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <h3 className="font-extrabold text-base text-slate-100">Ledger Transaction History</h3>

        {transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3 px-3">Date</th>
                  <th className="pb-3 px-3">Type</th>
                  <th className="pb-3 px-3">Payment Mode</th>
                  <th className="pb-3 px-3">Note / Due Date</th>
                  <th className="pb-3 px-3 text-right">Amount (₹)</th>
                  <th className="pb-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {transactions.map((tx) => {
                  const isGive = tx.type === 'GIVE';
                  const dateFormatted = tx.transactionDate
                    ? new Date(tx.transactionDate).toLocaleString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })
                    : '-';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 text-slate-400 flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {dateFormatted}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                          isGive ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}>
                          {isGive ? 'Udhaar Diya' : 'Paisa Mila'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-400">{tx.paymentMode}</td>
                      <td className="py-3 px-3 text-slate-300">
                        <div>{tx.note || '-'}</div>
                        {tx.dueDate && (
                          <div className="text-[10px] text-indigo-400 font-medium flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" /> Due: {new Date(tx.dueDate).toLocaleString()} ({tx.reminderStatus || 'Scheduled'})
                          </div>
                        )}
                      </td>
                      <td className={`py-3 px-3 text-right font-black text-sm ${isGive ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {isGive ? '-' : '+'}₹{tx.amount?.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {isGive && (
                          <button
                            onClick={() => handleQuickSendReminder(tx)}
                            disabled={sendingReminderId === tx.id}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-bold text-[10px] inline-flex items-center gap-1 transition-all"
                            title="Dispatch SMS Reminder"
                          >
                            {sendingReminderId === tx.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                            Send SMS
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500 text-xs">
            No entries recorded for {customer.name} yet. Click "Give Udhaar" or "Receive Paisa" above!
          </div>
        )}
      </div>

      {/* Modals */}
      <AddTransactionModal
        isOpen={isAddTxOpen}
        onClose={() => setIsAddTxOpen(false)}
        onSuccess={fetchCustomerDetails}
        preSelectedCustomerId={customer.id}
        defaultType={txType}
      />

      <AiReminderModal
        isOpen={isReminderOpen}
        onClose={() => setIsReminderOpen(false)}
        customer={customer}
      />
    </div>
  );
};

export default CustomerDetailPage;
