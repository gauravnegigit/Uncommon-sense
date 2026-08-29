import React from 'react';
import { ShieldCheck, BookOpen, AlertOctagon, PhoneCall, ExternalLink } from 'lucide-react';
import { OFFICIAL_DANGER_SIGNS } from '../config/constants';
import { useLanguage } from '../context/LanguageContext';

export const GuidelinesPage: React.FC = () => {
  const { t, isHindi } = useLanguage();

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-black uppercase tracking-wider border border-emerald-200">
            NHM & ICMR PROTOCOLS
          </span>
          <span className="text-xs text-slate-500 font-bold">• Primary Care Standards</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
          📖 {t('guidelinesTitle')}
        </h1>

        <p className="text-xs sm:text-sm text-slate-600 font-hindi mt-1 max-w-3xl leading-relaxed">
          {t('guidelinesDesc')}
        </p>
      </div>

      {/* 8 Official Danger Signs Table/Cards */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-red-600" />
            <span>
              {isHindi
                ? '8 आधिकारिक आशा / एनएचएम रेड-फ्लैग खतरे के संकेत'
                : '8 Core ASHA / NHM Red-Flag Warning Signs'}
            </span>
          </h3>
          <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-black">
            Immediate 108 Dispatch
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {OFFICIAL_DANGER_SIGNS.map((sign, idx) => (
            <div
              key={sign.id}
              className="p-4 rounded-2xl border border-red-200/80 bg-red-50/30 space-y-2 hover:border-red-400 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-black">
                  {idx + 1}
                </span>
                <span className="text-[10px] font-mono text-red-700 font-bold bg-white px-2 py-0.5 rounded-full border border-red-200">
                  RED ALERT
                </span>
              </div>

              <h4 className="text-sm font-black text-slate-900 leading-snug">
                {isHindi ? sign.titleHi : sign.titleEn}
              </h4>
              <p className="text-xs text-slate-500 font-medium">
                {isHindi ? sign.titleEn : sign.titleHi}
              </p>

              <div className="pt-2 border-t border-red-100 flex flex-wrap gap-1">
                <span className="text-[10px] font-bold text-slate-500 mr-1">
                  {isHindi ? 'पहचान शब्द:' : 'Trigger Keywords:'}
                </span>
                {sign.keywords.slice(0, 5).map((kw, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-full bg-white text-[10px] text-slate-700 font-mono border border-slate-200"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SBAR & Treatment Frameworks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-emerald-700 font-black text-sm">
            <ShieldCheck className="w-5 h-5" />
            <span>SBAR Communication Standard</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-hindi">
            {isHindi
              ? 'SBAR (Situation, Background, Assessment, Recommendation) क्लिनिकल रेफरल की मानक अंतरराष्ट्रीय पद्धति है। ग्रामीण हेल्थ प्रणाली स्वचालित रूप से ट्राइएज वार्तालाप को SBAR प्रारूप में संकलित कर डॉक्टर के लिए तैयार करती है।'
              : 'SBAR (Situation, Background, Assessment, Recommendation) is the gold standard for clinical handovers between community health workers and receiving hospital medical officers.'}
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-teal-700 font-black text-sm">
            <PhoneCall className="w-5 h-5" />
            <span>Emergency Referral Protocol</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-hindi">
            {isHindi
              ? 'रेड-फ्लैग खतरे के संकेत पाए जाने पर तत्काल 108 एम्बुलेंस से नजदीकी 24x7 सीएचसी या जिला अस्पताल रेफरल किया जाना अनिवार्य है। मरीज को बिना डॉक्टर परामर्श के दवा न दें।'
              : 'Immediate 108 ambulance dispatch and airway stabilization protocol for emergency red-flag cases to 24x7 Community Health Centres or District Hospitals.'}
          </p>
        </div>
      </div>
    </div>
  );
};
