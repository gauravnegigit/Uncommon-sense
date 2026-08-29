import React from 'react';
import { ClinicalSummaryResponse, TriageMessage } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface ReferralSlipPrintProps {
  summary?: ClinicalSummaryResponse | null;
  messages: TriageMessage[];
  patientName: string;
  locationName: string;
  dangerSigns: string[];
}

export const ReferralSlipPrint: React.FC<ReferralSlipPrintProps> = ({
  summary,
  messages,
  patientName,
  locationName,
  dangerSigns,
}) => {
  const { isHindi } = useLanguage();

  const isEmergency =
    summary?.severity_level === 'RED' ||
    dangerSigns.length > 0 ||
    messages.some((m) => m.severity === 'EMERGENCY');

  // Fallbacks if AI summary is loading or offline
  const situationText =
    summary?.situation ||
    messages
      .filter((m) => m.sender === 'user')
      .map((m) => m.content)
      .join(' | ') ||
    'Patient reporting acute symptoms during field consultation.';

  const backgroundText =
    summary?.background ||
    `Field evaluation conducted via Gramin Health multilingual voice triage assistant at ${locationName}.`;

  const assessmentText =
    summary?.assessment ||
    (dangerSigns.length > 0
      ? `Active warning signs detected: ${dangerSigns.join(', ')}. High risk of deterioration without clinical intervention.`
      : 'No acute red-flag respiratory or circulatory compromise detected. Patient requires MO physical examination.');

  const recommendationText =
    summary?.recommendation ||
    (isEmergency
      ? '1. Dispatch 108 Emergency Ambulance immediately.\n2. Transfer to 24x7 CHC/District Hospital emergency room.'
      : '1. Visit nearest Primary Health Centre (PHC) Medical Officer for clinical examination.');

  const targetFacility =
    summary?.target_facility_type || (isEmergency ? 'CHC / District Hospital (24x7 ER)' : 'Primary Health Centre (PHC)');

  return (
    <div
      id="printable-referral-slip"
      className="bg-white p-6 sm:p-8 rounded-2xl border-2 border-slate-300 text-slate-900 text-xs space-y-4 shadow-sm font-sans"
    >
      {/* Header */}
      <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 flex items-center justify-center p-1 bg-slate-950 rounded-xl">
            <img src="/logo.png" alt="Gramin Health" className="w-full h-full object-contain" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-900">
              Gramin Health • NHM Clinical Referral Slip
            </h2>
            <p className="text-[11px] text-slate-600 font-medium">
              SBAR Emergency Handover Note • Primary & Emergency Decision-Support
            </p>
          </div>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-[11px] font-black uppercase border ${
            isEmergency
              ? 'bg-red-50 text-red-700 border-red-600'
              : 'bg-emerald-50 text-emerald-800 border-emerald-600'
          }`}
        >
          TRIAGE: {isEmergency ? 'RED (EMERGENCY)' : 'YELLOW (ROUTINE)'}
        </span>
      </div>

      {/* Patient & Consultation Metadata */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-[11px]">
        <div>
          <span className="text-slate-400 block text-[9px] uppercase font-bold">
            {isHindi ? 'मरीज का नाम' : 'Patient Name'}
          </span>
          <span className="font-extrabold text-slate-900">{patientName || 'Patient'}</span>
        </div>

        <div>
          <span className="text-slate-400 block text-[9px] uppercase font-bold">
            {isHindi ? 'दिनांक व समय' : 'Date & Time'}
          </span>
          <span className="font-bold text-slate-800">{new Date().toLocaleString('en-IN')}</span>
        </div>

        <div>
          <span className="text-slate-400 block text-[9px] uppercase font-bold">
            {isHindi ? 'रेफरल क्षेत्र' : 'Field Location'}
          </span>
          <span className="font-bold text-slate-800 truncate block">{locationName}</span>
        </div>

        <div>
          <span className="text-slate-400 block text-[9px] uppercase font-bold">
            {isHindi ? 'अनुशंसित केंद्र' : 'Target Facility'}
          </span>
          <span className="font-extrabold text-emerald-800">{targetFacility}</span>
        </div>
      </div>

      {/* SBAR Structured Content */}
      <div className="space-y-3 leading-relaxed">
        {/* Situation */}
        <div className="p-3.5 bg-red-50/60 rounded-xl border border-red-200">
          <span className="font-black text-red-900 uppercase block mb-1 text-[11px] tracking-wide">
            S • Situation (Presenting Complaint & Triage Status)
          </span>
          <p className="text-slate-800 whitespace-pre-wrap">{situationText}</p>
        </div>

        {/* Background */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
          <span className="font-black text-indigo-900 uppercase block mb-1 text-[11px] tracking-wide">
            B • Background (Timeline of Symptoms & Clinical Context)
          </span>
          <p className="text-slate-800 whitespace-pre-wrap">{backgroundText}</p>
        </div>

        {/* Assessment */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
          <span className="font-black text-amber-900 uppercase block mb-1 text-[11px] tracking-wide">
            A • Assessment (STW Guideline Evaluation & Danger Signs)
          </span>
          <p className="text-slate-800 whitespace-pre-wrap">{assessmentText}</p>
          {summary?.guideline_references && summary.guideline_references.length > 0 && (
            <div className="mt-2 text-[10px] text-slate-500">
              <b>Guidelines:</b> {summary.guideline_references.join(', ')}
            </div>
          )}
        </div>

        {/* Recommendation */}
        <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200">
          <span className="font-black text-emerald-900 uppercase block mb-1 text-[11px] tracking-wide">
            R • Recommendation (Facility Referral & Immediate Clinical Action)
          </span>
          <p className="text-slate-800 whitespace-pre-wrap">{recommendationText}</p>
        </div>
      </div>

      {/* Signature & Verification Bar */}
      <div className="pt-4 border-t-2 border-slate-200 flex justify-between items-center text-[10px] text-slate-500">
        <div>
          <span>Patient / Caregiver Signature: __________________</span>
        </div>
        <div>
          <span>Receiving MO Signature & Stamp: __________________</span>
        </div>
      </div>
    </div>
  );
};
