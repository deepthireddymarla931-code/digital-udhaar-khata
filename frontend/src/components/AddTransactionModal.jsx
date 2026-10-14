import React, { useState, useEffect } from 'react';
import { X, ArrowUpRight, ArrowDownLeft, Loader2, Calendar, Bell, MessageSquare, Clock, UserPlus, CheckCircle2 } from 'lucide-react';
import { transactionApi } from '../api/transactionApi';
import { customerApi } from '../api/customerApi';
import { offlineStore } from '../utils/offlineStore';

const AddTransactionModal = ({
  isOpen,
  onClose,
  onSuccess,
  initialData = null,
  preSelectedCustomerId = null,
  defaultType = 'GIVE',
}) => {
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState(preSelectedCustomerId || '');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState(defaultType); // GIVE or RECEIVE
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [note, setNote] = useState('');

  // Quick inline customer creation
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [addingCustomer, setAddingCustomer] = useState(false);

  // Automated Due Date & Reminder Features (Core Feature 2)
  const [hasDueDate, setHasDueDate] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [reminderChannel, setReminderChannel] = useState('SMS');
  const [reminderNote, setReminderNote] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      customerApi.getAll()
        .then((res) => {
          const list = (res && res.data && res.data.length > 0) ? res.data : offlineStore.getCustomers();
          setCustomers(list);

          if (initialData && initialData.customerName) {
            const matched = list.find((c) =>
              c.name.toLowerCase().includes(initialData.customerName.toLowerCase())
            );
            if (matched) {
              setCustomerId(matched.id);
            } else if (list.length > 0) {
              setCustomerId(list[0].id);
            }
          } else if (preSelectedCustomerId) {
            setCustomerId(preSelectedCustomerId);
          } else if (list.length > 0) {
            setCustomerId(list[0].id);
          }
        })
        .catch((err) => {
          console.warn('Fallback to offlineStore in modal:', err);
          const list = offlineStore.getCustomers();
          setCustomers(list);
          if (preSelectedCustomerId) {
            setCustomerId(preSelectedCustomerId);
          } else if (list.length > 0) {
            setCustomerId(list[0].id);
          }
        });

      if (initialData) {
        if (initialData.amount) setAmount(initialData.amount.toString());
        if (initialData.type) setType(initialData.type);
        if (initialData.paymentMode) setPaymentMode(initialData.paymentMode);
        if (initialData.note) setNote(initialData.note);
      } else {
        setType(defaultType);
      }

      // Default due date to tomorrow at 10:00 AM
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      const isoLocal = tomorrow.toISOString().slice(0, 16);
      setDueDate(isoLocal);
      setShowQuickAdd(false);
      setNewCustName('');
      setNewCustPhone('');
    }
  }, [isOpen, initialData, preSelectedCustomerId, defaultType]);

  if (!isOpen) return null;

  const handleQuickAddCustomer = async (e) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim()) {
      setError('Please provide customer name and phone number');
      return;
    }
    setAddingCustomer(true);
    setError('');
    try {
      const res = await customerApi.quickLookupOrCreate({
        name: newCustName.trim(),
        phone: newCustPhone.trim(),
        creditLimit: 10000,
      });

      const newCustomer = res.data?.customer || res.data;
      if (newCustomer) {
        setCustomers((prev) => [newCustomer, ...prev.filter((c) => c.id !== newCustomer.id)]);
        setCustomerId(newCustomer.id);
        setShowQuickAdd(false);
        setNewCustName('');
        setNewCustPhone('');
      }
    } catch (err) {
      console.warn('Error during quick add, creating locally:', err);
      const created = offlineStore.addCustomerLocally({
        name: newCustName.trim(),
        phone: newCustPhone.trim(),
        creditLimit: 10000,
      });
      setCustomers((prev) => [created, ...prev]);
      setCustomerId(created.id);
      setShowQuickAdd(false);
      setNewCustName('');
      setNewCustPhone('');
    } finally {
      setAddingCustomer(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerId) {
      setError('Please select or add a customer to proceed');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid positive amount');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await transactionApi.add({
        customerId: parseInt(customerId, 10),
        amount: parseFloat(amount),
        type,
        paymentMode,
        note,
        dueDate: hasDueDate && type === 'GIVE' ? dueDate : null,
        reminderChannel: hasDueDate ? reminderChannel : 'SMS',
        reminderNote: hasDueDate ? reminderNote : '',
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.warn('API error recording entry, saving locally:', err);
      offlineStore.addTransactionLocally({
        customerId: parseInt(customerId, 10),
        amount: parseFloat(amount),
        type,
        paymentMode,
        note,
        dueDate: hasDueDate && type === 'GIVE' ? dueDate : null,
        reminderChannel: hasDueDate ? reminderChannel : 'SMS',
        reminderNote: hasDueDate ? reminderNote : '',
      });
      onSuccess();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h3 className="font-extrabold text-lg text-slate-100 flex items-center gap-2">
              Add Ledger Entry
            </h3>
            <p className="text-[11px] text-slate-400">Record debit, credit, or automated due date reminders</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Type Selector Tabs */}
          <div className="grid grid-cols-2 gap-3 p-1 rounded-2xl bg-slate-950 border border-slate-800">
            <button
              type="button"
              onClick={() => setType('GIVE')}
              className={`py-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
                type === 'GIVE'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              Udhaar Diya (You Will Get)
            </button>

            <button
              type="button"
              onClick={() => setType('RECEIVE')}
              className={`py-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
                type === 'RECEIVE'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              Paisa Mila (You Received)
            </button>
          </div>

          {/* Customer Selection Header with Quick Add Button */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Select Customer *
              </label>
              <button
                type="button"
                onClick={() => setShowQuickAdd(!showQuickAdd)}
                className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                {showQuickAdd ? 'Select Existing' : '+ Add New Customer'}
              </button>
            </div>

            {/* Quick Inline Customer Creation Form */}
            {showQuickAdd ? (
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-indigo-500/30 space-y-2.5 animate-fade-in">
                <p className="text-[11px] font-bold text-indigo-300">Quickly add customer details:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Customer Name (e.g. Ramesh)"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    className="w-full bg-slate-900 text-slate-100 border border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 font-medium"
                  />
                  <input
                    type="tel"
                    placeholder="Mobile Number (e.g. 9876543210)"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="w-full bg-slate-900 text-slate-100 border border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleQuickAddCustomer}
                  disabled={addingCustomer || !newCustName.trim() || !newCustPhone.trim()}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {addingCustomer ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save & Select Customer'}
                </button>
              </div>
            ) : (
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full bg-slate-950 text-slate-100 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 font-medium"
                required
              >
                <option value="">-- Choose Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone}) — {c.netBalance > 0 ? `Owes ₹${c.netBalance.toLocaleString()}` : c.netBalance < 0 ? `Advance ₹${Math.abs(c.netBalance).toLocaleString()}` : 'Settled'}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Amount Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Amount (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-slate-400 font-bold text-base">₹</span>
              <input
                type="number"
                step="0.01"
                min="1"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-950 text-slate-100 border border-slate-800 rounded-xl pl-8 pr-4 py-3 text-lg font-bold focus:outline-none focus:border-indigo-500 shadow-inner"
                required
              />
            </div>
          </div>

          {/* Payment Mode */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Payment Mode
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['CASH', 'UPI', 'CHEQUE', 'BANK_TRANSFER'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPaymentMode(mode)}
                  className={`py-2 rounded-xl text-[11px] font-bold uppercase transition-all ${
                    paymentMode === mode
                      ? 'bg-indigo-600 text-white border border-indigo-400 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {mode.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Note / Item Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Note / Item Details (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. 5kg Basmati Rice, GPay #REF49102, Grocery refill"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-slate-950 text-slate-100 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          {/* ADVANCED FEATURE: Automated Due Date & Time Reminders */}
          {type === 'GIVE' && (
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-indigo-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <div>
                    <span className="text-xs font-bold text-slate-200">
                      Automated Due Date & Time Reminder
                    </span>
                    <span className="ml-2 text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold uppercase">
                      Cron + SMS
                    </span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasDueDate}
                    onChange={(e) => setHasDueDate(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {hasDueDate && (
                <div className="space-y-3 pt-2 border-t border-slate-800/80 animate-fade-in">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Scheduled Due Date & Exact Time:
                    </label>
                    <input
                      type="datetime-local"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-slate-900 text-slate-100 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                      required={hasDueDate}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Reminder Channel:
                      </label>
                      <select
                        value={reminderChannel}
                        onChange={(e) => setReminderChannel(e.target.value)}
                        className="w-full bg-slate-900 text-slate-100 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                      >
                        <option value="SMS">SMS Notification</option>
                        <option value="WHATSAPP">WhatsApp Alert</option>
                        <option value="BOTH">SMS & WhatsApp</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Debtor Note (Optional):
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Kindly settle before 5 PM"
                        value={reminderNote}
                        onChange={(e) => setReminderNote(e.target.value)}
                        className="w-full bg-slate-900 text-slate-100 border border-slate-700 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <p className="text-[10px] text-indigo-300/80 italic">
                    ⚡ A background cron scheduler running every minute will automatically trigger an SMS reminder to the debtor when the exact due timestamp arrives.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-sm font-semibold text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-3 text-sm font-bold text-white rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${
                type === 'GIVE'
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
              }`}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                `Record ${type === 'GIVE' ? 'Udhaar Entry' : 'Payment Received'}`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;
