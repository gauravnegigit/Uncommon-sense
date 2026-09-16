import React, { useState, useEffect } from 'react';
import {
  GitPullRequest,
  PlusCircle,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Building2,
  RefreshCw,
  Filter,
  User,
  XCircle,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { referralService } from '../../services/referralService';
import {
  PersonaRole,
  PriorityLevel,
  ReferralCreateRequest,
  ReferralResponse,
  ReferralStatus,
} from '../../types';

interface ReferralTrackerProps {
  selectedPersona: PersonaRole;
}

export const ReferralTracker: React.FC<ReferralTrackerProps> = ({ selectedPersona }) => {
  const { t, isHindi } = useLanguage();

  const [referrals, setReferrals] = useState<ReferralResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [patientId, setPatientId] = useState('pat-001');
  const [fromFacility, setFromFacility] = useState('phc-phaphamau');
  const [toFacility, setToFacility] = useState('chc-soraon');
  const [priority, setPriority] = useState<PriorityLevel>('URGENT');
  const [reason, setReason] = useState('');

  const loadReferrals = async () => {
    setIsLoading(true);
    try {
      const data = await referralService.listReferrals();
      setReferrals(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReferrals();
  }, []);

  const handleStatusUpdate = async (referralId: string, nextStatus: ReferralStatus) => {
    await referralService.updateReferralStatus(referralId, { new_status: nextStatus });
    loadReferrals();
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    await referralService.createReferral({
      patient_id: patientId,
      from_facility_id: fromFacility,
      to_facility_id: toFacility,
      reason: reason.trim(),
      priority,
    });
    setReason('');
    setIsCreateModalOpen(false);
    loadReferrals();
  };

  const stages: ReferralStatus[] = ['CREATED', 'ACCEPTED', 'QUEUED', 'PATIENT_ARRIVED', 'COMPLETED'];

  const getStageIndex = (status: ReferralStatus): number => {
    return stages.indexOf(status);
  };

  const filteredReferrals = referrals.filter((r) => {
    if (priorityFilter === 'ALL') return true;
    return r.priority === priorityFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-amber-50 text-amber-700 rounded-xl">
              <GitPullRequest className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950">
              {t('referralTitle')}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800">
              Closed-Loop Tracking
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 font-hindi">
            {t('referralSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-black shadow-sm flex items-center gap-1.5 transition-all"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span>{t('createReferralBtn')}</span>
          </button>
          <button
            onClick={loadReferrals}
            className="p-2.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {isHindi ? 'प्राथमिकता:' : 'Priority Filter:'}
          </span>
          <div className="flex items-center gap-1.5">
            {['ALL', 'URGENT', 'NORMAL'].map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  priorityFilter === p
                    ? 'bg-slate-950 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="text-xs text-slate-400 font-mono">
          {filteredReferrals.length} Active Referral Loops
        </div>
      </div>

      {/* Referrals Cards with 5-Stage Visual Stepper */}
      <div className="space-y-4">
        {filteredReferrals.map((ref) => {
          const currentIndex = getStageIndex(ref.status);
          const isTerminalFailure = ref.status === 'REJECTED' || ref.status === 'CANCELLED';

          return (
            <div
              key={ref.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-xs text-slate-400">
                    {ref.id}
                  </span>
                  <span className="text-sm font-black text-slate-900">
                    {ref.patient_name || ref.patient_id}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                      ref.priority === 'URGENT'
                        ? 'bg-red-100 text-red-800 animate-pulse'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {ref.priority} PRIORITY
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 font-mono">
                  Initiated: {new Date(ref.created_at).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>

              {/* Transfer Route & Reason */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-5 flex items-center gap-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-slate-700 shadow-xs shrink-0">
                    <Building2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Origin Facility
                    </div>
                    <div className="text-xs font-black text-slate-800 truncate">
                      {ref.from_facility_name || ref.from_facility_id}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 flex justify-center">
                  <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>

                <div className="md:col-span-5 flex items-center gap-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-slate-700 shadow-xs shrink-0">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Destination Facility
                    </div>
                    <div className="text-xs font-black text-slate-800 truncate">
                      {ref.to_facility_name || ref.to_facility_id}
                    </div>
                  </div>
                </div>
              </div>

              {/* Reason Paragraph */}
              <div className="text-xs text-slate-700 bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100 leading-relaxed font-hindi">
                <b className="text-slate-900 font-sans">Clinical Reason: </b>
                {ref.reason}
              </div>

              {/* 5-Stage Closed-Loop Visual Stepper */}
              <div className="pt-2">
                <div className="relative flex items-center justify-between">
                  {/* Stepper background track */}
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 rounded-full z-0" />
                  
                  {/* Stepper progress track */}
                  {!isTerminalFailure && currentIndex >= 0 && (
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-500 rounded-full z-0 transition-all duration-500"
                      style={{ width: `${(currentIndex / (stages.length - 1)) * 100}%` }}
                    />
                  )}

                  {stages.map((stg, i) => {
                    const isCompleted = !isTerminalFailure && i <= currentIndex;
                    const isCurrent = !isTerminalFailure && i === currentIndex;
                    return (
                      <div key={stg} className="relative z-10 flex flex-col items-center">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                            isCurrent
                              ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-sm'
                              : isCompleted
                              ? 'bg-emerald-500 text-white'
                              : 'bg-white border-2 border-slate-200 text-slate-400'
                          }`}
                        >
                          {isCompleted ? '✓' : i + 1}
                        </div>
                        <span
                          className={`text-[10px] mt-1.5 font-bold whitespace-nowrap text-center ${
                            isCurrent
                              ? 'text-emerald-800 font-black'
                              : isCompleted
                              ? 'text-slate-800'
                              : 'text-slate-400'
                          }`}
                        >
                          {stg.replace('_', ' ')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Doctor / Facility Staff Action Buttons */}
              {(selectedPersona === 'DOCTOR' || selectedPersona === 'ASHA_WORKER') && !isTerminalFailure && (
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs text-slate-500">
                    Current Stage: <span className="font-bold text-slate-800">{ref.status}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {ref.status === 'CREATED' && (
                      <button
                        onClick={() => handleStatusUpdate(ref.id, 'ACCEPTED')}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                      >
                        Accept Referral
                      </button>
                    )}
                    {ref.status === 'ACCEPTED' && (
                      <button
                        onClick={() => handleStatusUpdate(ref.id, 'QUEUED')}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                      >
                        Queue in OPD
                      </button>
                    )}
                    {ref.status === 'QUEUED' && (
                      <button
                        onClick={() => handleStatusUpdate(ref.id, 'PATIENT_ARRIVED')}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                      >
                        Verify Patient Arrived
                      </button>
                    )}
                    {ref.status === 'PATIENT_ARRIVED' && (
                      <button
                        onClick={() => handleStatusUpdate(ref.id, 'COMPLETED')}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
                      >
                        Complete Referral & Close Loop
                      </button>
                    )}
                    {ref.status !== 'COMPLETED' && (
                      <button
                        onClick={() => handleStatusUpdate(ref.id, 'CANCELLED')}
                        className="px-3 py-1.5 rounded-xl text-red-600 hover:bg-red-50 text-xs font-bold"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL: Create Inter-Facility Referral */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">
                {isHindi ? 'नया अंतर-केंद्र रेफरल तैयार करें' : 'Create Inter-Facility Referral'}
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isHindi ? 'मरीज चुनें:' : 'Select Patient:'}
                </label>
                <select
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium"
                >
                  <option value="pat-001">Sunita Devi (pat-001 - ANC Week 26)</option>
                  <option value="pat-002">Ramesh Kumar Patel (pat-002 - NCD)</option>
                  <option value="pat-003">Aarav (Child of Pinki - pat-003 - SAM)</option>
                  <option value="pat-004">Shanti Devi (pat-004 - COPD)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isHindi ? 'रेफरल प्रेषक केंद्र (From):' : 'Origin Facility:'}
                  </label>
                  <select
                    value={fromFacility}
                    onChange={(e) => setFromFacility(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium"
                  >
                    <option value="phc-phaphamau">Phaphamau PHC</option>
                    <option value="subcentre-holagarh">Holagarh Sub-Centre</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isHindi ? 'लक्षित रेफरल केंद्र (To):' : 'Target Facility:'}
                  </label>
                  <select
                    value={toFacility}
                    onChange={(e) => setToFacility(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium"
                  >
                    <option value="chc-soraon">Soraon CHC</option>
                    <option value="dist-hosp-teliarganj">Tej Bahadur Sapru DH</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isHindi ? 'रेफरल प्राथमिकता (Urgency):' : 'Priority Level:'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPriority('NORMAL')}
                    className={`p-2 rounded-xl border font-bold transition-all ${
                      priority === 'NORMAL'
                        ? 'bg-slate-950 text-white border-slate-950'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    Normal (Routine)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('URGENT')}
                    className={`p-2 rounded-xl border font-bold transition-all ${
                      priority === 'URGENT'
                        ? 'bg-red-600 text-white border-red-600'
                        : 'border-slate-200 text-red-600'
                    }`}
                  >
                    🔴 Urgent / High-Risk
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isHindi ? 'रेफरल का नैदानिक कारण:' : 'Clinical Referral Reason:'}
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={
                    isHindi
                      ? 'उदा. अनियंत्रित उच्च रक्तचाप व सिरदर्द, विशेषज्ञ सोनोग्राफी व उपचार हेतु...'
                      : 'e.g. Gestational hypertension with pre-eclampsia symptoms. Needs urgent ultrasound & specialist OBG...'
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-950 text-white font-bold hover:bg-slate-800"
                >
                  Create Referral
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

