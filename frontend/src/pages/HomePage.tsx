import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, MapPin, Activity, PhoneCall } from 'lucide-react';
import { TriageMessage } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { DangerSignsCard } from '../components/triage/DangerSignsCard';
import { PresetScenarios } from '../components/triage/PresetScenarios';
import { TriageConsole } from '../components/triage/TriageConsole';
import { FacilityLocator } from '../components/facilities/FacilityLocator';
import { DoctorSummaryModal } from '../components/summary/DoctorSummaryModal';

interface HomePageProps {
  activeTab: 'triage' | 'facilities' | 'guidelines' | 'history';
  setActiveTab: (tab: 'triage' | 'facilities' | 'guidelines' | 'history') => void;
  messages: TriageMessage[];
  setMessages: React.Dispatch<React.SetStateAction<TriageMessage[]>>;
  chatId: string;
  setChatId: (id: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  activeTab,
  setActiveTab,
  messages,
  setMessages,
  chatId,
  setChatId,
}) => {
  const { t, isHindi } = useLanguage();

  const [dangerSigns, setDangerSigns] = useState<string[]>([]);
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [activeLocationName, setActiveLocationName] = useState('Phaphamau, Prayagraj (UP)');

  const handleSelectPreset = (promptText: string) => {
    setActiveTab('triage');
    // Send directly or prefill
    const inputElement = document.querySelector('input[type="text"]') as HTMLInputElement;
    if (inputElement) {
      inputElement.value = promptText;
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Red-Flag Emergency Danger Sign Alert Bar */}
      <DangerSignsCard
        dangerSigns={dangerSigns}
        onOpenDoctorModal={() => setIsDoctorModalOpen(true)}
        onOpenFacilities={() => setActiveTab('facilities')}
      />

      {/* Hero Banner (Shown at top of Triage tab) */}
      {activeTab === 'triage' && messages.length <= 1 && (
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#eafaf2] via-[#e2f7ed] to-[#d4f2e3] border border-emerald-200/70 p-6 sm:p-10 lg:p-12 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            {/* Left Col */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/90 backdrop-blur-md border border-emerald-200 text-emerald-900 text-xs font-extrabold shadow-xs">
                <span className="text-amber-500 font-bold">★ 4.9</span>
                <span>
                  {isHindi
                    ? 'राष्ट्रीय स्वास्थ्य मिशन (NHM) व आईसीएमआर आपातकालीन मानक'
                    : 'Official ASHA Emergency Protocols • MoHFW Guidelines'}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight leading-[1.15]">
                {t('heroHeading')}
              </h1>

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-hindi max-w-xl">
                {t('heroSubheading')}
              </p>

              <div className="space-y-2 text-xs sm:text-sm font-bold text-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                    ✓
                  </span>
                  <span>
                    {isHindi
                      ? '1-क्लिक हिंदी व भारतीय भाषा वॉयस असिस्टेंट'
                      : '1-Click Hindi & Regional Voice Input Assistant'}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                    ✓
                  </span>
                  <span>
                    {isHindi
                      ? '8 पूर्वनिर्धारित रेड-फ्लैग खतरे के संकेत एवं 108 एम्बुलेंस अलर्ट'
                      : '8 Predefined ASHA Red-Flag Warning Signs & 108 Alert'}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                    ✓
                  </span>
                  <span>
                    {isHindi
                      ? 'डॉक्टर-रेडी SBAR क्लिनिकल रेफरल पर्ची (PDF / प्रिंट)'
                      : 'Doctor-Ready SBAR Clinical Referral Handover (Print/PDF)'}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => setActiveTab('facilities')}
                  className="px-6 py-3 rounded-full bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 text-xs sm:text-sm font-black shadow-xs flex items-center gap-2 transition-all"
                >
                  <MapPin className="w-4 h-4 text-teal-600" />
                  <span>{isHindi ? 'निकटतम PHC खोजें' : 'Explore PHCs & Beds'}</span>
                </button>
              </div>
            </div>

            {/* Right Col: Quick Status Box */}
            <div className="lg:col-span-5 space-y-3">
              <div className="bg-[#0e3b2e] text-white p-6 rounded-3xl shadow-xl shadow-emerald-950/15 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-400">
                    ASHA Triage Engine Status
                  </span>
                  <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-white">100%</span>
                  <span className="text-xs text-emerald-200 font-bold">
                    Deterministic Safety Compliance
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-emerald-800/80 flex items-center justify-between text-xs text-emerald-200">
                  <span>📍 Geospatial Facility Router</span>
                  <span className="font-extrabold text-white">24x7 Active</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-emerald-200 shadow-xs">
                  <div className="text-emerald-700 font-black text-xs sm:text-sm mb-1">
                    ✓ 24x7 Ready
                  </div>
                  <p className="text-[11px] text-slate-600 font-hindi">
                    108 Emergency Ambulance & CHC Referral
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-emerald-200 shadow-xs">
                  <div className="text-emerald-700 font-black text-xs sm:text-sm mb-1">
                    ✓ SBAR Slip
                  </div>
                  <p className="text-[11px] text-slate-600 font-hindi">
                    Doctor-ready Printable Handover Slip
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Feature: Triage Console */}
      {activeTab === 'triage' && (
        <TriageConsole
          chatId={chatId}
          setChatId={setChatId}
          messages={messages}
          setMessages={setMessages}
          dangerSigns={dangerSigns}
          setDangerSigns={setDangerSigns}
          onOpenDoctorModal={() => setIsDoctorModalOpen(true)}
          onOpenFacilities={() => setActiveTab('facilities')}
        />
      )}

      {/* Main Feature: Facility Locator */}
      {activeTab === 'facilities' && <FacilityLocator />}

      {/* Preset Scenarios Card */}
      <PresetScenarios onSelectScenario={handleSelectPreset} />

      {/* Doctor Summary (SBAR) Modal */}
      <DoctorSummaryModal
        isOpen={isDoctorModalOpen}
        onClose={() => setIsDoctorModalOpen(false)}
        chatId={chatId}
        messages={messages}
        dangerSigns={dangerSigns}
        locationName={activeLocationName}
      />
    </div>
  );
};
