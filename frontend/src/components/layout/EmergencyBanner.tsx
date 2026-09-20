import React from 'react';
import { PhoneCall, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const EmergencyBanner: React.FC = () => {
  const { t, isHindi } = useLanguage();

  return (
    <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white text-xs py-2 px-4 border-b border-emerald-900/40">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 font-medium">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-900/90 text-emerald-300 font-bold border border-emerald-500/30 text-[10px]">
            {t('notADoctorBadge')}
          </span>
          <span className="hidden md:inline text-emerald-200/90 truncate font-hindi">
            {t('emergencyDisclaimer')}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <a
            href="tel:108"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs shadow-sm transition-all animate-pulse"
          >
            <PhoneCall className="w-3 h-3" />
            <span>108 {isHindi ? 'आपातकाल' : 'Emergency'}</span>
          </a>
        </div>
      </div>
    </div>
  );
};
