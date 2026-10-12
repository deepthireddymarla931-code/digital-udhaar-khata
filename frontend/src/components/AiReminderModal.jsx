import React, { useState, useEffect } from 'react';
import { X, Sparkles, Send, Loader2, MessageSquare, ExternalLink } from 'lucide-react';
import { aiApi } from '../api/aiApi';

const AiReminderModal = ({ isOpen, onClose, customerId, customerName, customer }) => {
  const [tone, setTone] = useState('POLITE');
  const [loading, setLoading] = useState(false);
  const [reminderData, setReminderData] = useState(null);
  const [error, setError] = useState('');

  const effectiveCustomerId = customerId || customer?.id;
  const effectiveCustomerName = customerName || customer?.name || 'Customer';

  const generate = async (selectedTone) => {
    if (!effectiveCustomerId) return;
    setLoading(true);
    setError('');
    try {
      const res = await aiApi.generateReminder(effectiveCustomerId, selectedTone);
      setReminderData(res.data);
    } catch (err) {
      setError('Could not generate AI reminder');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && effectiveCustomerId) {
      generate(tone);
    }
  }, [isOpen, effectiveCustomerId]);

  const handleToneChange = (newTone) => {
    setTone(newTone);
    generate(newTone);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h3 className="font-extrabold text-lg text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            AI WhatsApp Reminder Generator
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-400">
            Target Customer: <span className="font-bold text-slate-200">{effectiveCustomerName}</span>
          </p>

          {/* Tone Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Select Message Tone
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'POLITE', label: 'Polite Request' },
                { id: 'FIRM', label: 'Firm Reminder' },
                { id: 'URGENT', label: 'Urgent Overdue' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleToneChange(t.id)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all border ${
                    tone === t.id
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Generated Message Output */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Generated Draft Message</span>
              {reminderData?.pendingAmount > 0 && (
                <span className="text-rose-400 font-bold">₹{reminderData.pendingAmount} Owed</span>
              )}
            </label>

            {loading ? (
              <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
              </div>
            ) : reminderData ? (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 font-sans text-xs text-slate-200 leading-relaxed shadow-inner">
                {reminderData.generatedMessage}
              </div>
            ) : null}

            {error && <p className="text-xs text-rose-400">{error}</p>}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
            <button
              onClick={onClose}
              className="py-3 px-4 text-xs font-semibold text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
            >
              Cancel
            </button>
            
            {reminderData && (
              <a
                href={reminderData.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 px-4 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Send via WhatsApp 1-Click</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiReminderModal;
