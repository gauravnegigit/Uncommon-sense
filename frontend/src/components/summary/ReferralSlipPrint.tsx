import React from 'react';
import { ClinicalSummary, UserProfile } from '../../types';
import { Hospital } from 'lucide-react';

interface ReferralSlipPrintProps {
  summary: ClinicalSummary;
  patientUser?: UserProfile | null;
}

export const ReferralSlipPrint: React.FC<ReferralSlipPrintProps> = ({ summary, patientUser }) => {
  const isRed = summary.severity_level === 'RED';
  const formattedDate = new Date(summary.updated_at).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const formattedTime = new Date(summary.updated_at).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div id="printable-referral-slip" className="bg-white text-slate-900 p-8 rounded-2xl border-2 border-slate-300 font-sans max-w-3xl mx-auto shadow-sm">
      {/* Official Referral Header with Gramin Health Logo */}
      <div className="border-b-2 border-slate-900 pb-4 mb-5 flex items-start justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-slate-950 p-1.5 flex items-center justify-center shrink-0 border border-slate-800">
            <img src="/logo.png" alt="Gramin Health Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight uppercase text-slate-900">
              Gramin Health • NHM Rural Triage
            </h1>
            <p className="text-xs font-semibold text-slate-600">
              Emergency & Primary Care Clinical Referral Slip • SBAR Handover
            </p>
          </div>
        </div>

        {/* Severity Stamp */}
        <div className="text-right">
          <span
            className={`inline-block px-3 py-1 rounded-lg text-xs font-extrabold uppercase border-2 ${
              isRed
                ? 'bg-red-50 text-red-700 border-red-600'
                : 'bg-amber-50 text-amber-800 border-amber-500'
            }`}
          >
            TRIAGE: {summary.severity_level} {isRed ? '(EMERGENCY)' : '(ROUTINE)'}
          </span>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            REF ID: {summary.summary_id.slice(0, 12)}
          </div>
        </div>
      </div>

      {/* Patient & Session Metadata Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs mb-5">
        <div>
          <span className="text-slate-500 block text-[10px] uppercase font-bold">Patient / Origin</span>
          <span className="font-bold text-slate-800">{patientUser?.name || 'Walk-in / Field Patient'}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px] uppercase font-bold">Contact / Phone</span>
          <span className="font-bold text-slate-800">{patientUser?.phone || '+91 - Not Stated'}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px] uppercase font-bold">Date & Time</span>
          <span className="font-bold text-slate-800">{formattedDate} • {formattedTime}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px] uppercase font-bold">Referred By</span>
          <span className="font-bold text-slate-800">Gramin Health Assistant</span>
        </div>
      </div>

      {/* Target Referral Center Callout */}
      <div className="p-3.5 rounded-xl bg-teal-50/80 border border-teal-200 text-xs text-teal-950 mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Hospital className="w-5 h-5 text-teal-700" />
          <div>
            <span className="font-bold uppercase tracking-wider text-[10px] text-teal-800 block">
              Target Referral Facility
            </span>
            <span className="font-extrabold text-sm text-teal-900">
              {summary.target_facility_type}
            </span>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded bg-teal-600 text-white font-bold text-xs">
          Direct Medical Officer Handoff
        </span>
      </div>

      {/* SBAR Structured Clinical Notes */}
      <div className="space-y-4 text-xs leading-relaxed">
        {/* S - Situation */}
        <div className="border border-slate-200 rounded-xl p-3.5 bg-white">
          <div className="flex items-center gap-1.5 font-extrabold text-slate-900 text-xs uppercase mb-1 text-red-700">
            <span>S • Situation (Presenting Complaint & Triage Status)</span>
          </div>
          <p className="text-slate-800 whitespace-pre-wrap">{summary.situation}</p>
        </div>

        {/* B - Background */}
        <div className="border border-slate-200 rounded-xl p-3.5 bg-white">
          <div className="flex items-center gap-1.5 font-extrabold text-slate-900 text-xs uppercase mb-1 text-indigo-700">
            <span>B • Background (Clinical Timeline & History)</span>
          </div>
          <p className="text-slate-800 whitespace-pre-wrap">{summary.background}</p>
        </div>

        {/* A - Assessment */}
        <div className="border border-slate-200 rounded-xl p-3.5 bg-white">
          <div className="flex items-center gap-1.5 font-extrabold text-slate-900 text-xs uppercase mb-1 text-amber-700">
            <span>A • Assessment (Triage Rules & Guideline Findings)</span>
          </div>
          <p className="text-slate-800 whitespace-pre-wrap">{summary.assessment}</p>
        </div>

        {/* R - Recommendation */}
        <div className="border border-slate-200 rounded-xl p-3.5 bg-white">
          <div className="flex items-center gap-1.5 font-extrabold text-slate-900 text-xs uppercase mb-1 text-teal-700">
            <span>R • Recommendation (Pre-transfer Care & Immediate Actions)</span>
          </div>
          <p className="text-slate-800 whitespace-pre-wrap">{summary.recommendation}</p>
        </div>
      </div>

      {/* Guidelines Applied */}
      {summary.guideline_references && summary.guideline_references.length > 0 && (
        <div className="mt-4 text-[11px] text-slate-500">
          <span className="font-bold">Referenced Clinical STWs: </span>
          <span>{summary.guideline_references.join(' | ')}</span>
        </div>
      )}

      {/* Signatures & Verification Footer */}
      <div className="mt-8 pt-4 border-t-2 border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs text-slate-600">
        <div>
          <span className="block font-bold text-slate-800 mb-6">ASHA / Field Worker Signature</span>
          <div className="border-b border-dashed border-slate-400 w-36"></div>
          <span className="text-[10px] text-slate-400 mt-1 block">Verified on-site</span>
        </div>

        <div>
          <span className="block font-bold text-slate-800 mb-6">Receiving Doctor / MO Signature</span>
          <div className="border-b border-dashed border-slate-400 w-36"></div>
          <span className="text-[10px] text-slate-400 mt-1 block">PHC / CHC Emergency Desk</span>
        </div>

        <div className="text-right flex flex-col items-end">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Verification QR</span>
          <div className="w-12 h-12 bg-slate-100 border border-slate-300 rounded flex items-center justify-center text-slate-500 font-mono text-[9px] mt-1">
            [QR PASS]
          </div>
        </div>
      </div>

      {/* Non-Diagnostic Disclaimer */}
      <div className="mt-6 pt-3 border-t border-slate-100 text-[10px] text-center text-slate-400">
        This document is an algorithmic triage referral note generated by Gramin Health under National Health Mission protocols. It is intended strictly for handover to registered medical officers and does not constitute a definitive medical diagnosis.
      </div>
    </div>
  );
};

