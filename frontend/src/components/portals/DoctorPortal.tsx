import React, { useState } from 'react';
import {
  Stethoscope,
  CalendarCheck,
  FileText,
  GitPullRequest,
  FlaskConical,
  LayoutDashboard,
  Users,
  Bed,
  ArrowLeft,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { QueueBoard } from '../appointments/QueueBoard';
import { PatientDirectory } from '../patient/PatientDirectory';
import { ReferralTracker } from '../referrals/ReferralTracker';
import { DiagnosticTracker } from '../diagnostics/DiagnosticTracker';
import { FacilityCommandDashboard } from '../dashboard/FacilityCommandDashboard';

interface DoctorPortalProps {
  onBackToHome?: () => void;
}

export const DoctorPortal: React.FC<DoctorPortalProps> = ({ onBackToHome }) => {
  const { isHindi } = useLanguage();

  const [activeTab, setActiveTab] = useState<'queue' | 'records' | 'referrals' | 'diagnostics' | 'dashboard'>('queue');

  return (
    <div className="space-y-6">
      {/* Doctor Portal Header Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="mb-2 text-xs font-bold text-slate-500 hover:text-indigo-700 flex items-center gap-1.5 transition-colors group cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
              <span>{isHindi ? '← मुख्य पृष्ठ पर लौटें' : '← Back to Home'}</span>
            </button>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl">🩺</span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950">
              {isHindi ? 'चिकित्सा अधिकारी (Doctor / MO) क्लिनिकल पोर्टल' : 'Medical Officer Clinical & OPD Hub'}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 font-hindi mt-0.5">
            {isHindi
              ? 'ओपीडी केबिन परामर्श, रोगी दीर्घकालिक समयरेखा, अंतर-केंद्र रेफरल एवं केंद्र संचालन'
              : 'OPD cabin consultation management, longitudinal clinical timeline, and referral closed-loop tracking'}
          </p>
        </div>

        {/* Navigation Tabs for Doctor */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200 overflow-x-auto text-xs font-black shrink-0">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
              activeTab === 'queue'
                ? 'bg-indigo-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>{isHindi ? 'ओपीडी कतार व केबिन' : 'OPD Queue Cabin'}</span>
          </button>

          <button
            onClick={() => setActiveTab('records')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
              activeTab === 'records'
                ? 'bg-slate-950 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-purple-400" />
            <span>{isHindi ? 'मरीज रिकॉर्ड (LPR)' : 'Patient Records'}</span>
          </button>

          <button
            onClick={() => setActiveTab('referrals')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
              activeTab === 'referrals'
                ? 'bg-slate-950 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GitPullRequest className="w-3.5 h-3.5 text-amber-400" />
            <span>{isHindi ? 'रेफरल नेटवर्क' : 'Referral Network'}</span>
          </button>

          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
              activeTab === 'diagnostics'
                ? 'bg-slate-950 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isHindi ? 'लैब व जांच' : 'Diagnostics & Lab'}</span>
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
              activeTab === 'dashboard'
                ? 'bg-slate-950 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-teal-400" />
            <span>{isHindi ? 'केंद्र कमांड' : 'Facility Command'}</span>
          </button>
        </div>
      </div>

      {/* TAB 1: OPD QUEUE CABIN */}
      {activeTab === 'queue' && (
        <QueueBoard selectedPersona="DOCTOR" />
      )}

      {/* TAB 2: PATIENT LONGITUDINAL RECORDS */}
      {activeTab === 'records' && (
        <PatientDirectory selectedPersona="DOCTOR" />
      )}

      {/* TAB 3: CLOSED-LOOP REFERRALS */}
      {activeTab === 'referrals' && (
        <ReferralTracker selectedPersona="DOCTOR" />
      )}

      {/* TAB 4: DIAGNOSTICS & LAB */}
      {activeTab === 'diagnostics' && (
        <DiagnosticTracker selectedPersona="DOCTOR" />
      )}

      {/* TAB 5: FACILITY COMMAND & OPERATIONAL METRICS */}
      {activeTab === 'dashboard' && (
        <FacilityCommandDashboard selectedPersona="DOCTOR" />
      )}
    </div>
  );
};

