import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Clock,
  UserCheck,
  PlusCircle,
  Play,
  CheckCircle2,
  FastForward,
  AlertTriangle,
  RefreshCw,
  Users,
  Ticket,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import { patientService } from '../../services/patientService';
import { useFacilityOptions } from '../../hooks/useFacilityOptions';
import {
  AppointmentCreateRequest,
  AppointmentResponse,
  PatientResponse,
  PersonaRole,
  PreferredSlot,
  PriorityLevel,
  QueueEntryResponse,
  QueueStatus,
  WalkInRequest,
} from '../../types';

interface QueueBoardProps {
  selectedPersona: PersonaRole;
}

export const QueueBoard: React.FC<QueueBoardProps> = ({ selectedPersona }) => {
  const { t, isHindi } = useLanguage();
  const { user } = useAuth();
  const { facilities, selectedFacilityId: facilityId } = useFacilityOptions(user?.home_facility_id);

  const [queue, setQueue] = useState<QueueEntryResponse[]>([]);
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [patients, setPatients] = useState<PatientResponse[]>([]);

  // Modal states
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);

  // Booking Form State
  const [bookDate, setBookDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [bookSlot, setBookSlot] = useState<PreferredSlot>('MORNING');
  const [bookReason, setBookReason] = useState('');
  const [bookPatientId, setBookPatientId] = useState('');

  // Walk-in Form State
  const [walkInPatientId, setWalkInPatientId] = useState('');
  const [walkInPriority, setWalkInPriority] = useState<PriorityLevel>('NORMAL');

  useEffect(() => {
    patientService.listPatients().then((list) => {
      setPatients(list);
      setBookPatientId((prev) => prev || list[0]?.id || '');
      setWalkInPatientId((prev) => prev || list[0]?.id || '');
    });
  }, []);

  const loadData = async () => {
    if (!facilityId) return;
    setIsLoading(true);
    try {
      const [qData, aptData] = await Promise.all([
        appointmentService.getFacilityQueue(facilityId),
        appointmentService.listAppointments({ facility_id: facilityId }),
      ]);
      setQueue(qData);
      setAppointments(aptData);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilityId]);

  const handleCallPatient = async (queueId: string) => {
    await appointmentService.callPatient(queueId);
    loadData();
  };

  const handleStartConsultation = async (queueId: string) => {
    await appointmentService.startConsultation(queueId);
    loadData();
  };

  const handleCompleteConsultation = async (queueId: string) => {
    await appointmentService.completeConsultation(queueId);
    loadData();
  };

  const handleSkipPatient = async (queueId: string) => {
    await appointmentService.skipPatient(queueId);
    loadData();
  };

  const handleCheckInAppointment = async (aptId: string) => {
    await appointmentService.checkInAppointment(aptId);
    loadData();
  };

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookReason.trim()) return;
    await appointmentService.bookAppointment({
      patient_id: bookPatientId,
      facility_id: facilityId,
      requested_date: bookDate,
      preferred_slot: bookSlot,
      reason: bookReason.trim(),
    });
    setBookReason('');
    setIsBookModalOpen(false);
    loadData();
  };

  const handleWalkInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await appointmentService.issueWalkInToken({
      facility_id: facilityId,
      patient_id: walkInPatientId,
      priority: walkInPriority,
    });
    setIsWalkInModalOpen(false);
    loadData();
  };

  const currentServing = queue.find((q) => q.status === 'IN_CONSULTATION');
  const nextInLine = queue.find((q) => q.status === 'WAITING' || q.status === 'CALLED');
  const waitingPatients = queue.filter((q) => q.status === 'WAITING');

  const filteredQueue = queue.filter((q) => {
    if (statusFilter === 'ALL') return true;
    return q.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header with Title & Quick Actions */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-blue-50 text-blue-700 rounded-xl">
              <Ticket className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950">
              {t('queueTitle')}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-800">
              {facilities.find((f) => f.id === facilityId)?.name || 'OPD Queue'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 font-hindi">
            {t('queueSubtitle')}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsBookModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 text-xs font-black shadow-xs flex items-center gap-1.5 transition-all"
          >
            <CalendarCheck className="w-4 h-4 text-blue-600" />
            <span>{t('bookAppointmentBtn')}</span>
          </button>

          {(selectedPersona === 'DOCTOR' || selectedPersona === 'ASHA_WORKER') && (
            <button
              onClick={() => setIsWalkInModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-black shadow-sm flex items-center gap-1.5 transition-all"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>{t('issueWalkInBtn')}</span>
            </button>
          )}

          <button
            onClick={loadData}
            className="p-2.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Real-time KPI / Live Board Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Serving Now Box */}
        <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white rounded-3xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-300 mb-2">
            <span>{t('nowServing')}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          </div>
          {currentServing ? (
            <div>
              <div className="text-4xl font-black tracking-tight text-white mb-1">
                #{currentServing.token_number}
              </div>
              <div className="text-xs text-emerald-200">
                Patient ID: <span className="font-mono font-bold text-white">{currentServing.patient_id}</span>
              </div>
              <div className="mt-2 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-800/80 inline-block">
                In Doctor Cabin
              </div>
            </div>
          ) : (
            <div className="text-sm text-emerald-300 font-bold py-3">
              Cabin Free • Call Next Patient
            </div>
          )}
        </div>

        {/* Next In Line Box */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-extrabold text-slate-500 mb-2">
            <span>{t('nextInLine')}</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          {nextInLine ? (
            <div>
              <div className="text-3xl font-black text-slate-900 mb-1">
                #{nextInLine.token_number}
              </div>
              <div className="text-xs text-slate-500">
                Priority:{' '}
                <span
                  className={`font-black ${
                    nextInLine.priority === 'URGENT' ? 'text-red-600' : 'text-slate-700'
                  }`}
                >
                  {nextInLine.priority}
                </span>
              </div>
              <div className="mt-2 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full inline-block">
                Status: {nextInLine.status}
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-400 font-medium py-3">Queue Empty</div>
          )}
        </div>

        {/* Patients Waiting */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-extrabold text-slate-500 mb-2">
            <span>{t('waitingCount')}</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 mb-1">
            {waitingPatients.length}
          </div>
          <div className="text-xs text-slate-500">
            Registered for today's OPD
          </div>
          <div className="mt-2 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full inline-block">
            {waitingPatients.filter((q) => q.priority === 'URGENT').length} Urgent Flags
          </div>
        </div>

        {/* Dynamic Estimated Wait Time */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-extrabold text-slate-500 mb-2">
            <span>{t('estWaitTime')}</span>
            <Clock className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 mb-1">
            ~{waitingPatients.length * 8} <span className="text-base font-bold text-slate-500">mins</span>
          </div>
          <div className="text-xs text-slate-500">
            Based on ~8 mins / consultation
          </div>
          <div className="mt-2 text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full inline-block">
            Atomic Token Algorithm
          </div>
        </div>
      </div>

      {/* Main Queue Table & Doctor Controls */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isHindi ? 'फ़िल्टर:' : 'Filter:'}
            </span>
            <div className="flex items-center gap-1">
              {['ALL', 'WAITING', 'CALLED', 'IN_CONSULTATION', 'COMPLETED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    statusFilter === st
                      ? 'bg-slate-950 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-slate-400 font-bold">
            Total Tokens: {filteredQueue.length}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 text-[11px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="py-3.5 px-4 sm:px-6">Token</th>
                <th className="py-3.5 px-4">Patient Identifier</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Wait Time</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions / Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {filteredQueue.map((item) => (
                <tr
                  key={item.id}
                  className={`hover:bg-slate-50/60 transition-colors ${
                    item.status === 'IN_CONSULTATION' ? 'bg-emerald-50/40 font-semibold' : ''
                  }`}
                >
                  <td className="py-3.5 px-4 sm:px-6 font-mono font-black text-slate-900 text-sm">
                    #{item.token_number}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-800">{item.patient_id}</div>
                    <div className="text-[10px] text-slate-400">
                      {item.appointment_id ? `Appointment: ${item.appointment_id}` : 'Walk-in Registration'}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                        item.priority === 'URGENT'
                          ? 'bg-red-100 text-red-800 animate-pulse'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.priority}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        item.status === 'IN_CONSULTATION'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'CALLED'
                          ? 'bg-blue-100 text-blue-800'
                          : item.status === 'WAITING'
                          ? 'bg-amber-100 text-amber-800'
                          : item.status === 'COMPLETED'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {item.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-mono">
                    {item.status === 'COMPLETED'
                      ? 'Done'
                      : item.status === 'IN_CONSULTATION'
                      ? 'In Cabin'
                      : `~${item.estimated_wait_minutes ?? 0}m`}
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 text-right">
                    {selectedPersona === 'DOCTOR' || selectedPersona === 'ASHA_WORKER' ? (
                      <div className="flex items-center justify-end gap-1.5">
                        {item.status === 'WAITING' && (
                          <button
                            onClick={() => handleCallPatient(item.id)}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold flex items-center gap-1"
                          >
                            <Play className="w-3 h-3" />
                            <span>{t('callNextBtn')}</span>
                          </button>
                        )}
                        {item.status === 'CALLED' && (
                          <button
                            onClick={() => handleStartConsultation(item.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1"
                          >
                            <UserCheck className="w-3 h-3" />
                            <span>{t('startConsultBtn')}</span>
                          </button>
                        )}
                        {item.status === 'IN_CONSULTATION' && (
                          <button
                            onClick={() => handleCompleteConsultation(item.id)}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>{t('completeConsultBtn')}</span>
                          </button>
                        )}
                        {(item.status === 'WAITING' || item.status === 'CALLED') && (
                          <button
                            onClick={() => handleSkipPatient(item.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            title="Skip"
                          >
                            <FastForward className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">
                        {item.status === 'IN_CONSULTATION' ? 'Active now' : 'Queued'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booked Appointments Tab (Physical Check-in Section) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900">
              {isHindi ? 'आज के बुक किए गए अपॉइंटमेंट्स (Check-in)' : "Today's Booked Appointments (Check-in)"}
            </h3>
            <p className="text-xs text-slate-500 font-hindi">
              {isHindi
                ? 'मरीज के स्वास्थ्य केंद्र पहुंचते ही चेक-इन करें और लाइव ओपीडी टोकन जारी करें'
                : 'Convert booked appointments into live queue tokens upon patient arrival at facility'}
            </p>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {appointments.length} Appointments
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {appointments.map((apt) => (
            <div
              key={apt.id}
              className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono font-black text-slate-900">
                    {apt.patient_id}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      apt.status === 'CHECKED_IN'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {apt.status}
                  </span>
                </div>
                <div className="text-xs text-slate-700 font-medium line-clamp-2">
                  {apt.reason}
                </div>
                <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-2 font-mono">
                  <span>📅 {apt.requested_date}</span>
                  <span>• {apt.preferred_slot}</span>
                </div>
              </div>

              {apt.status === 'BOOKED' && (
                <button
                  onClick={() => handleCheckInAppointment(apt.id)}
                  className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>{isHindi ? 'चेक-इन करें व टोकन बनाएं' : 'Check-in & Issue Token'}</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* MODAL: Book OPD Appointment */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">
                {isHindi ? 'ओपीडी अपॉइंटमेंट बुक करें' : 'Book OPD Appointment'}
              </h3>
              <button
                onClick={() => setIsBookModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBookSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isHindi ? 'मरीज चुनें / आईडी:' : 'Patient ID / Name:'}
                </label>
                <select
                  value={bookPatientId}
                  onChange={(e) => setBookPatientId(e.target.value)}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isHindi ? 'तारीख:' : 'Requested Date:'}
                  </label>
                  <input
                    type="date"
                    value={bookDate}
                    onChange={(e) => setBookDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isHindi ? 'समय स्लॉट:' : 'Preferred Slot:'}
                  </label>
                  <select
                    value={bookSlot}
                    onChange={(e) => setBookSlot(e.target.value as PreferredSlot)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium"
                  >
                    <option value="MORNING">Morning (09:00 - 12:00)</option>
                    <option value="AFTERNOON">Afternoon (12:00 - 03:00)</option>
                    <option value="EVENING">Evening (03:00 - 05:00)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isHindi ? 'परामर्श का कारण / मुख्य लक्षण:' : 'Reason / Symptoms:'}
                </label>
                <textarea
                  rows={3}
                  value={bookReason}
                  onChange={(e) => setBookReason(e.target.value)}
                  placeholder={
                    isHindi
                      ? 'उदा. पिछले 3 दिन से लगातार बुखार व सिरदर्द...'
                      : 'e.g. High fever, headache, and joint pain for 3 days...'
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-950 text-white font-bold hover:bg-slate-800"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Issue Walk-in Token */}
      {isWalkInModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">
                {isHindi ? 'वॉक-इन मरीज टोकन जारी करें' : 'Issue Walk-In Queue Token'}
              </h3>
              <button
                onClick={() => setIsWalkInModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleWalkInSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isHindi ? 'मरीज चुनें:' : 'Select Registered Patient:'}
                </label>
                <select
                  value={walkInPatientId}
                  onChange={(e) => setWalkInPatientId(e.target.value)}
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
                  {isHindi ? 'प्राथमिकता स्तर (Triage Priority):' : 'Priority Level:'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWalkInPriority('NORMAL')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      walkInPriority === 'NORMAL'
                        ? 'bg-slate-950 text-white border-slate-950'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    Normal Priority
                  </button>
                  <button
                    type="button"
                    onClick={() => setWalkInPriority('URGENT')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      walkInPriority === 'URGENT'
                        ? 'bg-red-600 text-white border-red-600'
                        : 'border-slate-200 text-red-600'
                    }`}
                  >
                    🔴 Urgent Priority
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsWalkInModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-950 text-white font-bold hover:bg-slate-800"
                >
                  Generate Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

