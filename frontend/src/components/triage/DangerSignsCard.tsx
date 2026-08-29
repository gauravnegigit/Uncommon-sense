import React from 'react';
import { PhoneCall, AlertTriangle, FileText, MapPin } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface DangerSignsCardProps {
  dangerSigns: string[];
  onOpenDoctorModal?: () => void;
  onOpenFacilities?: () => void;
}

export const DangerSignsCard: React.FC<DangerSignsCardProps> = ({
  dangerSigns,
  onOpenDoctorModal,
  onOpenFacilities,
}) => {
  const { t, isHindi } = useLanguage();

  if (!dangerSigns || dangerSigns.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white rounded-3xl p-5 sm:p-6 shadow-xl border-2 border-red-300/50 animate-pulse-glow flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="space-y-1.5 flex-1">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-white text-red-700 font-extrabold text-[10px] uppercase tracking-wide">
            CRITICAL RED-FLAG ALERT
          </span>
          <span className="flex items-center gap-1 text-xs text-red-100 font-bold">
            <AlertTriangle className="w-4 h-4 text-white" />
            <span>{isHindi ? 'तत्काल हस्तक्षेप आवश्यक' : 'Immediate Intervention Required'}</span>
          </span>
        </div>

        <h3 className="text-base sm:text-lg font-black text-white leading-tight">
          {t('emergencyAlertTitle')}
        </h3>

        <p className="text-xs text-red-100 max-w-xl font-hindi leading-relaxed">
          {t('emergencyAlertSub')}
        </p>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {dangerSigns.map((sign, idx) => (
            <span
              key={idx}
              className="px-2.5 py-0.5 rounded-full bg-red-950/70 text-red-100 text-[11px] font-bold border border-red-300/40 flex items-center gap-1"
            >
              <span>⚠️</span>
              <span>{sign}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 w-full md:w-auto">
        <a
          href="tel:108"
          className="flex-1 md:flex-none px-5 py-3 rounded-full bg-white hover:bg-red-50 text-red-700 font-black text-xs sm:text-sm text-center shadow-md flex items-center justify-center gap-2 transition-all transform hover:scale-105"
        >
          <PhoneCall className="w-4 h-4 text-red-600 animate-bounce" />
          <span>{t('dial108')}</span>
        </a>

        {onOpenDoctorModal && (
          <button
            onClick={onOpenDoctorModal}
            className="flex-1 md:flex-none px-4 py-3 rounded-full bg-red-950/80 hover:bg-red-950 text-white font-bold text-xs sm:text-sm text-center border border-white/20 flex items-center justify-center gap-1.5 transition-all"
          >
            <FileText className="w-4 h-4" />
            <span>{t('viewDoctorSummary')}</span>
          </button>
        )}

        {onOpenFacilities && (
          <button
            onClick={onOpenFacilities}
            className="flex-1 md:flex-none px-4 py-3 rounded-full bg-white/20 hover:bg-white/30 text-white font-bold text-xs sm:text-sm text-center border border-white/20 flex items-center justify-center gap-1.5 transition-all"
          >
            <MapPin className="w-4 h-4" />
            <span>{isHindi ? 'नजदीकी अस्पताल' : 'Facilities'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
