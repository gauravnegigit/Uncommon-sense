import React from 'react';
import { AlertCircle, CheckCircle, Navigation } from 'lucide-react';
import { TriageSeverity } from '../../types';

interface TriageResultBadgeProps {
  severity?: TriageSeverity | string;
}

export const TriageResultBadge: React.FC<TriageResultBadgeProps> = ({ severity }) => {
  if (!severity || severity === 'UNKNOWN') return null;

  if (severity === 'EMERGENCY') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-red-600 text-white shadow-xs animate-pulse">
        <AlertCircle className="w-3.5 h-3.5" />
        <span>EMERGENCY (तत्काल 108 रेफरल)</span>
      </span>
    );
  }

  if (severity === 'FACILITY_LOOKUP') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-teal-600 text-white shadow-xs">
        <Navigation className="w-3.5 h-3.5" />
        <span>FACILITY LOOKUP (स्वास्थ्य केंद्र खोज)</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-600 text-white shadow-xs">
      <CheckCircle className="w-3.5 h-3.5" />
      <span>SYMPTOM ASSESSMENT (PHC/CHC परामर्श)</span>
    </span>
  );
};
