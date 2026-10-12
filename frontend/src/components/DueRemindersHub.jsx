import React, { useState, useEffect } from 'react';
import { Clock, Send, CheckCircle2, AlertTriangle, RefreshCw, MessageSquare, Phone, Bell, Loader2 } from 'lucide-react';
import { reminderApi } from '../api/reminderApi';
import { useSocket } from '../context/SocketContext';

const DueRemindersHub = () => {
  const [scheduledList, setScheduledList] = useState([]);
  const [logsList, setLogsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggeringId, setTriggeringId] = useState(null);
  const [checkingCron, setCheckingCron] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('SCHEDULED'); // SCHEDULED or LOGS
  const { socket } = useSocket();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dueRes, logsRes] = await Promise.all([
        reminderApi.getDue(),
        reminderApi.getLogs(),
      ]);
      setScheduledList(dueRes.data);
      setLogsList(logsRes.data);
    } catch (err) {
      console.error('Failed to load reminders hub data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    if (socket) {
      socket.on('reminder:triggered', () => {
        fetchData();
      });
      socket.on('ledger:updated', () => {
        fetchData();
      });
    }

    return () => {
      if (socket) {
        socket.off('reminder:triggered');
        socket.off('ledger:updated');
      }
    };
  }, [socket]);

  const handleManualTrigger = async (entry) => {
    setTriggeringId(entry.id);
    try {
      await reminderApi.triggerManual({
        transactionId: entry.id,
        customerId: entry.customerId,
        channel: entry.reminderChannel || 'SMS',
      });
      await fetchData();
    } catch (err) {
      alert('Failed to dispatch manual reminder: ' + (err.response?.data?.message || err.message));
    } finally {
      setTriggeringId(null);
    }
  };

  const handleRunCronNow = async () => {
    setCheckingCron(true);
    try {
      await reminderApi.triggerCronNow();
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingCron(false);
    }
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-extrabold text-slate-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            Automated Due-Date & Time Reminders Hub
          </h2>
          <p className="text-xs text-slate-400">
            Background node-cron checks due entries every minute and triggers automated SMS/WhatsApp alerts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunCronNow}
            disabled={checkingCron}
            className="px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-bold text-xs flex items-center gap-1.5 transition-all"
            title="Force immediate scheduler check"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checkingCron ? 'animate-spin' : ''}`} />
            Run Cron Now
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
        <button
          onClick={() => setActiveSubTab('SCHEDULED')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'SCHEDULED'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
          }`}
        >
          Scheduled Reminders ({scheduledList.length})
        </button>
        <button
          onClick={() => setActiveSubTab('LOGS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'LOGS'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
          }`}
        >
          Dispatched Audit Logs ({logsList.length})
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs animate-pulse">
          Loading reminder queue...
        </div>
      ) : activeSubTab === 'SCHEDULED' ? (
        scheduledList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3 px-3">Debtor</th>
                  <th className="pb-3 px-3">Due Date & Time</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3">Channel</th>
                  <th className="pb-3 px-3 text-right">Amount</th>
                  <th className="pb-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {scheduledList.map((entry) => {
                  const overdue = isOverdue(entry.dueDate);
                  const isSent = entry.reminderStatus === 'SENT';

                  return (
                    <tr key={entry.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3">
                        <p className="font-bold text-slate-200">{entry.customerName}</p>
                        <p className="text-[10px] text-slate-400">{entry.customerPhone}</p>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 font-medium text-slate-300">
                          <Clock className={`w-3.5 h-3.5 ${overdue ? 'text-rose-400' : 'text-indigo-400'}`} />
                          {new Date(entry.dueDate).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </div>
                        {overdue && !isSent && (
                          <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">
                            ● Overdue / Due Now
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                            isSent
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : overdue
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {isSent ? 'Sent' : overdue ? 'Trigger Pending' : 'Scheduled'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-400">
                        {entry.reminderChannel || 'SMS'}
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-sm text-rose-400">
                        ₹{entry.amount?.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleManualTrigger(entry)}
                          disabled={triggeringId === entry.id}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] inline-flex items-center gap-1 shadow-sm transition-all"
                        >
                          {triggeringId === entry.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <Send className="w-3 h-3" />
                              Send SMS Now
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500 text-xs">
            No active due-date reminders scheduled. Attach a due date and time when recording an Udhaar entry!
          </div>
        )
      ) : logsList.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="pb-3 px-3">Customer</th>
                <th className="pb-3 px-3">Dispatched At</th>
                <th className="pb-3 px-3">Channel</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3">Notification Text</th>
                <th className="pb-3 px-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {logsList.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3">
                    <p className="font-bold text-slate-200">{log.customerName}</p>
                    <p className="text-[10px] text-slate-400">{log.customerPhone}</p>
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    {new Date(log.sentAt).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-400">{log.channel}</td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" /> {log.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-400 max-w-xs truncate" title={log.responseMessage}>
                    {log.responseMessage}
                  </td>
                  <td className="py-3 px-3 text-right font-extrabold text-sm text-slate-200">
                    ₹{log.amount?.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-12 text-center text-slate-500 text-xs">
          No automated reminders dispatched yet.
        </div>
      )}
    </div>
  );
};

export default DueRemindersHub;
