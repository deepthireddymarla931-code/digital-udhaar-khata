import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';

const CustomerRiskBadge = ({ level, riskLevel }) => {
  const effectiveLevel = level || riskLevel || 'LOW';
  const getBadgeStyle = () => {
    switch (effectiveLevel?.toUpperCase()) {
      case 'HIGH':
        return {
          bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          icon: ShieldAlert,
          label: 'High Risk',
        };
      case 'MEDIUM':
        return {
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          icon: AlertTriangle,
          label: 'Medium Risk',
        };
      case 'LOW':
      default:
        return {
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          icon: ShieldCheck,
          label: 'Safe (Low Risk)',
        };
    }
  };

  const style = getBadgeStyle();
  const Icon = style.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${style.bg}`}>
      <Icon className="w-3.5 h-3.5" />
      {style.label}
    </span>
  );
};

export default CustomerRiskBadge;
