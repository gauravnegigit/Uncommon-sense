import React from 'react';
import { ShieldCheck, Heart, ExternalLink } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const Footer: React.FC = () => {
  const { t, isHindi } = useLanguage();

  return (
    <footer className="bg-slate-950 text-slate-400 text-xs py-10 border-t border-slate-800 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2.5 text-white font-extrabold text-base mb-2">
              <div className="w-8 h-8 rounded-lg bg-slate-900 p-1 flex items-center justify-center border border-slate-700">
                <img src="/logo.png" alt="Gramin Health" className="w-full h-full object-contain" />
              </div>
              <span>Gramin Health (ग्रामीण हेल्थ)</span>
            </div>
            <p className="text-slate-400 leading-relaxed font-hindi">
              {isHindi
                ? 'ग्रामीण स्वास्थ्य कार्यकर्ताओं (ASHA/ANM) और नागरिकों के लिए निर्णय सहायता व रेफरल प्रणाली। यह प्रणाली केवल ट्राइएज मार्गदर्शन प्रदान करती है, डॉक्टर का विकल्प नहीं है।'
                : 'A clinical decision-support and referral assistant for rural healthcare workers (ASHA/ANM) and citizens in India. Not a replacement for a certified doctor.'}
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm mb-3">
              {isHindi ? 'क्लिनिकल दिशानिर्देश एवं स्रोत' : 'Clinical References & Frameworks'}
            </h4>
            <ul className="space-y-1.5 text-slate-400">
              <li>• MoHFW National Health Mission (NHM) ASHA Protocols</li>
              <li>• ICMR Standard Treatment Workflows (STWs) - Primary Care</li>
              <li>• SBAR Clinical Communication Standard</li>
              <li>• OpenStreetMap Rural Health Geospatial Dataset</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm mb-3">
              {isHindi ? '24x7 सरकारी स्वास्थ्य हेल्पलाइन' : 'Government Health Hotlines'}
            </h4>
            <div className="grid grid-cols-2 gap-2 text-slate-300">
              <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-red-400 font-bold font-mono">108</span>: Ambulance
              </div>
              <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-rose-400 font-bold font-mono">102</span>: Janani Shishu
              </div>
              <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-indigo-400 font-bold font-mono">112</span>: National ER
              </div>
              <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-teal-400 font-bold font-mono">104</span>: Health Advice
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              {isHindi
                ? 'चिकित्सा चेतावनी: यह एआई डॉक्टर नहीं है। आपातकालीन स्थिति में तुरंत 108 डायल करें या निकटतम अस्पताल जाएं।'
                : 'Medical Disclaimer: This is an AI triage decision-support tool, not an AI doctor. In emergency, dial 108.'}
            </span>
          </div>
          <div>
            © {new Date().getFullYear()} Gramin Health Assistant. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

