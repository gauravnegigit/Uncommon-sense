import React, { useState, useEffect } from 'react';
import {
  HeartHandshake,
  PlusCircle,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Phone,
  User,
  RefreshCw,
  Filter,
  ShieldAlert,
  Baby,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useFacilityOptions } from '../../hooks/useFacilityOptions';
import { highriskService } from '../../services/highriskService';
import { patientService } from '../../services/patientService';
import {
  FollowUpCreateRequest,
  FollowUpResponse,
  PatientResponse,
  PersonaRole,
} from '../../types';

interface HighRiskRegistryProps {
  selectedPersona: PersonaRole;
}

export const HighRiskRegistry: React.FC<HighRiskRegistryProps> = ({ selectedPersona }) => {
  const { t, isHindi } = useLanguage();
  const { user } = useAuth();
  const { facilities, selectedFacilityId: facilityId, setSelectedFacilityId: setFacilityId } =
    useFacilityOptions(user?.home_facility_id);

  const [followups, setFollowups] = useState<FollowUpResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | 'HIGH_RISK_ONLY'>('ALL');

  // Modals
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [activeFollowup, setActiveFollowup] = useState<FollowUpResponse | null>(null);

  // Schedule Form State
  const [patients, setPatients] = useState<PatientResponse[]>([]);
  const [patientId, setPatientId] = useState('');
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [reason, setReason] = useState('');
  const [isHighRisk, setIsHighRisk] = useState(true);

  // Complete Form State
  const [visitNotes, setVisitNotes] = useState('');
  const [bpValue, setBpValue] = useState('126/82');
  const [weightValue, setWeightValue] = useState('56');

  const loadFollowups = async () => {
    setIsLoading(true);
    try {
      const data = await highriskService.listFollowups();
      setFollowups(data);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPatients = async () => {
    const data = await patientService.listPatients();
    setPatients(data);
    if (data.length > 0) {
      setPatientId((prev) => prev || data[0].id);
    }
  };

  useEffect(() => {
    loadFollowups();
    loadPatients();
  }, []);

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFollowup) return;
    await highriskService.completeFollowup(activeFollowup.id);
    setIsCompleteModalOpen(false);
    setVisitNotes('');
    loadFollowups();
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || !patientId || !facilityId) return;
    await highriskService.createFollowup({
      patient_id: patientId,
      facility_id: facilityId,
      due_date: dueDate,
      reason: reason.trim(),
      is_high_risk: isHighRisk,
    });
    setReason('');
    setIsScheduleModalOpen(false);
    loadFollowups();
  };

  const filteredFollowups = followups.filter((f) => {
    if (filterType === 'HIGH_RISK_ONLY') return f.is_high_risk;
    return true;
  });

  const overdueItems = filteredFollowups.filter((f) => f.status === 'OVERDUE');
  const dueTodayItems = filteredFollowups.filter((f) => f.status === 'DUE');
  const upcomingItems = filteredFollowups.filter((f) => f.status === 'UPCOMING');
  const completedItems = filteredFollowups.filter((f) => f.status === 'COMPLETED');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-orange-50 text-orange-700 rounded-xl">
              <HeartHandshake className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950">
              {t('highRiskTitle')}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-orange-100 text-orange-800">
              ASHA Field Care
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 font-hindi">
            {t('highRiskSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-black shadow-sm flex items-center gap-1.5 transition-all"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span>{t('scheduleFollowupBtn')}</span>
          </button>
          <button
            onClick={loadFollowups}
            className="p-2.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Urgency Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-red-50 rounded-3xl p-5 border border-red-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-black text-red-700 mb-1">
            <span>Overdue Visits</span>
            <AlertTriangle className="w-4 h-4 text-red-600 animate-bounce" />
          </div>
          <div className="text-3xl font-black text-red-700">
            {overdueItems.length}
          </div>
          <div className="text-[11px] text-red-600 font-bold mt-1">
            Immediate ASHA field visit required
          </div>
        </div>

        <div className="bg-amber-50 rounded-3xl p-5 border border-amber-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-black text-amber-700 mb-1">
            <span>Due Today</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-black text-amber-700">
            {dueTodayItems.length}
          </div>
          <div className="text-[11px] text-amber-700 font-bold mt-1">
            Scheduled for today's village round
          </div>
        </div>

        <div className="bg-blue-50 rounded-3xl p-5 border border-blue-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-black text-blue-700 mb-1">
            <span>Upcoming Tasks</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-black text-blue-700">
            {upcomingItems.length}
          </div>
          <div className="text-[11px] text-blue-700 font-bold mt-1">
            Next 7 days surveillance
          </div>
        </div>

        <div className="bg-emerald-50 rounded-3xl p-5 border border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-black text-emerald-700 mb-1">
            <span>Completed Visits</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-700">
            {completedItems.length}
          </div>
          <div className="text-[11px] text-emerald-700 font-bold mt-1">
            Audited and logged in LPR
          </div>
        </div>
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Category Filter:
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                filterType === 'ALL'
                  ? 'bg-slate-950 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Follow-ups ({followups.length})
            </button>
            <button
              onClick={() => setFilterType('HIGH_RISK_ONLY')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                filterType === 'HIGH_RISK_ONLY'
                  ? 'bg-orange-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              High-Risk Registry Only (ANC / SAM)
            </button>
          </div>
        </div>
      </div>

      {/* Follow-up Cards List */}
      <div className="space-y-4">
        {filteredFollowups.map((task) => {
          const isOverdue = task.status === 'OVERDUE';
          const isDueToday = task.status === 'DUE';
          const isDone = task.status === 'COMPLETED';

          return (
            <div
              key={task.id}
              className={`bg-white rounded-3xl p-6 border shadow-xs transition-all space-y-4 ${
                isOverdue
                  ? 'border-red-300 bg-red-50/20 ring-2 ring-red-100'
                  : isDueToday
                  ? 'border-amber-300 bg-amber-50/20'
                  : isDone
                  ? 'border-slate-200 opacity-80'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  {task.is_high_risk ? (
                    <span className="p-2 bg-red-100 text-red-700 rounded-xl">
                      <ShieldAlert className="w-4 h-4" />
                    </span>
                  ) : (
                    <span className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                      <HeartHandshake className="w-4 h-4" />
                    </span>
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-slate-900">
                        {task.patient_name || task.patient_id}
                      </h3>
                      {task.is_high_risk && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-800">
                          HIGH-RISK
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Task ID: {task.id} • Facility: {task.facility_name || task.facility_id}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black ${
                      isOverdue
                        ? 'bg-red-600 text-white animate-pulse'
                        : isDueToday
                        ? 'bg-amber-500 text-white'
                        : isDone
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {isOverdue
                      ? t('overdueWarning')
                      : isDueToday
                      ? t('dueTodayWarning')
                      : isDone
                      ? 'COMPLETED'
                      : t('upcomingTask')}
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    Due: {task.due_date}
                  </span>
                </div>
              </div>

              {/* Task Details */}
              <div className="text-xs text-slate-800 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 font-hindi leading-relaxed">
                <b className="text-slate-900 font-sans">Care Directive: </b>
                {task.reason}
              </div>

              {/* Actions */}
              {!isDone && (selectedPersona === 'ASHA_WORKER' || selectedPersona === 'DOCTOR') && (
                <div className="pt-1 flex items-center justify-end">
                  <button
                    onClick={() => {
                      setActiveFollowup(task);
                      setIsCompleteModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black shadow-xs flex items-center gap-1.5 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t('recordVisitBtn')}</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL: Schedule Follow-up Visit */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">
                {isHindi ? 'नई गृह-भेंट अनुसूची बनाएं' : 'Schedule ASHA Follow-up Visit'}
              </h3>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isHindi ? 'मरीज चुनें:' : 'Select Patient:'}
                </label>
                <select
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium"
                >
                  {patients.length === 0 && <option value="">No patients found</option>}
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.phone ? `(${p.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isHindi ? 'सुविधा:' : 'Facility:'}
                </label>
                <select
                  value={facilityId}
                  onChange={(e) => setFacilityId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium"
                >
                  {facilities.length === 0 && <option value="">No facilities found</option>}
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isHindi ? 'नियत तारीख (Due Date):' : 'Due Date:'}
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isHindi ? 'गृह-भेंट का उद्देश्य व निर्देश:' : 'Care Directives / Purpose:'}
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Check for danger signs of pre-eclampsia (severe headache, swelling) and record BP..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="highRiskCheck"
                  checked={isHighRisk}
                  onChange={(e) => setIsHighRisk(e.target.checked)}
                  className="w-4 h-4 rounded text-red-600 focus:ring-red-500"
                />
                <label htmlFor="highRiskCheck" className="font-bold text-slate-800">
                  Tag as High-Risk Patient (ANC / SAM / Uncontrolled Chronic)
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-950 text-white font-bold hover:bg-slate-800"
                >
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Complete Visit & Record Vitals */}
      {isCompleteModalOpen && activeFollowup && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">
                Record ASHA Home Visit Vitals
              </h3>
              <button
                onClick={() => setIsCompleteModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCompleteSubmit} className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-800">{activeFollowup.patient_name}</div>
                <div className="text-[11px] text-slate-500">{activeFollowup.reason}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Recorded Blood Pressure:
                  </label>
                  <input
                    type="text"
                    value={bpValue}
                    onChange={(e) => setBpValue(e.target.value)}
                    placeholder="e.g. 120/80 mmHg"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Weight (kg):
                  </label>
                  <input
                    type="text"
                    value={weightValue}
                    onChange={(e) => setWeightValue(e.target.value)}
                    placeholder="e.g. 56 kg"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Field Observations & Compliance Notes:
                </label>
                <textarea
                  rows={3}
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                  placeholder="e.g. Patient is taking IFA tablets daily. Swelling on feet has reduced. Counselled family on emergency signs..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCompleteModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 text-white font-bold hover:bg-emerald-800"
                >
                  Submit & Complete Visit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

