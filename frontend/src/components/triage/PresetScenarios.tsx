import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { PRESET_SCENARIOS } from '../../config/constants';
import { useLanguage } from '../../context/LanguageContext';

interface PresetScenariosProps {
  onSelectScenario: (text: string) => void;
}

export const PresetScenarios: React.FC<PresetScenariosProps> = ({ onSelectScenario }) => {
  const { t, isHindi } = useLanguage();

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>{t('selectScenario')}</span>
          </h3>
          <p className="text-xs text-slate-500 font-hindi mt-0.5">
            {t('scenarioHelp')}
          </p>
        </div>
        <span className="hidden sm:inline-flex px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-extrabold text-xs border border-emerald-200">
          5 Scenarios
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {PRESET_SCENARIOS.map((sc) => {
          const isEm = sc.expected === 'EMERGENCY';
          const prompt = isHindi ? sc.promptHi : sc.promptEn;
          const title = isHindi ? sc.titleHi : sc.titleEn;

          return (
            <div
              key={sc.id}
              onClick={() => onSelectScenario(prompt)}
              className={`p-4 rounded-2xl border bg-white hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group ${
                isEm
                  ? 'border-red-200 hover:border-red-400 bg-red-50/20'
                  : 'border-emerald-200 hover:border-emerald-400 bg-emerald-50/20'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      isEm ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {sc.badge}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </div>

                <h5 className="text-xs font-extrabold text-slate-900 leading-snug">
                  {title}
                </h5>

                <p className="text-[11px] text-slate-600 italic mt-1.5 line-clamp-2 bg-white/80 p-2 rounded-xl border border-slate-100 font-hindi">
                  "{prompt}"
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
