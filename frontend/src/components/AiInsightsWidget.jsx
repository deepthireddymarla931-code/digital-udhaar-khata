import React, { useEffect, useState } from 'react';
import { Sparkles, AlertCircle, CheckCircle2, TrendingUp, RefreshCw } from 'lucide-react';
import { aiApi } from '../api/aiApi';

const AiInsightsWidget = () => {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const res = await aiApi.getCashflowInsights();
      setInsight(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  if (loading) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse flex items-center justify-center h-44">
        <p className="text-xs text-slate-400">Analyzing merchant cashflow algorithms...</p>
      </div>
    );
  }

  if (!insight) return null;

  const isCritical = insight.healthStatus === 'CRITICAL';
  const isModerate = insight.healthStatus === 'MODERATE';

  return (
    <div className={`p-6 rounded-2xl border backdrop-blur-md shadow-xl transition-all ${
      isCritical ? 'bg-rose-950/20 border-rose-500/30' : isModerate ? 'bg-amber-950/20 border-amber-500/30' : 'bg-indigo-950/20 border-indigo-500/30'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${isCritical ? 'bg-rose-500/20 text-rose-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              AI Cashflow Advisor
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase ${
                isCritical ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {insight.healthStatus} HEALTH
              </span>
            </h4>
            <p className="text-xs text-slate-400">Recovery Timeframe Prediction: <span className="font-semibold text-slate-200">{insight.predictedCollectionTimeframe}</span></p>
          </div>
        </div>

        <button 
          onClick={fetchInsights}
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          title="Refresh Insights"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed font-medium mb-3">
        {insight.summaryText}
      </p>

      {insight.actionableAdvice && insight.actionableAdvice.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Action Recommendations:</p>
          {insight.actionableAdvice.map((tip, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
              <span>{tip}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AiInsightsWidget;
