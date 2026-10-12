import React, { useState } from 'react';
import { Sparkles, ArrowRight, Loader2, MessageSquareCode } from 'lucide-react';
import { aiApi } from '../api/aiApi';

const SmartNlpBar = ({ onParsed }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleParse = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError('');
    try {
      const res = await aiApi.parseNlp(prompt);
      if (res.data && res.data.parsedSuccessfully) {
        onParsed(res.data);
        setPrompt('');
      } else {
        setError('Could not auto-extract values. Try formatting like: "Ramesh took 500 rupees grocery"');
      }
    } catch (err) {
      setError('AI NLP Parser temporary error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900 border border-indigo-500/30 shadow-xl relative overflow-hidden">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" style={{ animationDuration: '4s' }} />
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
          Smart Natural Language Quick Entry
        </span>
      </div>

      <form onSubmit={handleParse} className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Ramesh took 500 rupees grocery on credit or Priya paid 200 via UPI"
            className="w-full bg-slate-950/80 text-slate-100 placeholder-slate-500 px-4 py-3 rounded-xl border border-indigo-500/30 focus:outline-none focus:border-indigo-400 text-sm font-medium pr-10"
          />
          <MessageSquareCode className="w-4 h-4 text-indigo-400 absolute right-3 top-3.5 opacity-60" />
        </div>

        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>Auto-Fill Entry</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {error && <p className="text-xs text-rose-400 mt-2">{error}</p>}
    </div>
  );
};

export default SmartNlpBar;
