import React, { useState, useEffect } from 'react';
import {
  Activity,
  Calendar,
  MapPin,
  Clock,
  Ticket,
  PlusCircle,
  PhoneCall,
  Search,
  CheckCircle2,
  FileText,
  ArrowLeft,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { TriageMessage, PreferredSlot, AppointmentResponse, QueueEntryResponse } from '../../types';
import { TriageConsole } from '../triage/TriageConsole';
import { DangerSignsCard } from '../triage/DangerSignsCard';
import { PresetScenarios } from '../triage/PresetScenarios';
import { DoctorSummaryModal } from '../summary/DoctorSummaryModal';
import { FacilityLocator } from '../facilities/FacilityLocator';
import { HistoryPage } from '../../pages/HistoryPage';
import { appointmentService } from '../../services/appointmentService';

interface PatientPortalProps {
  messages: TriageMessage[];
  setMessages: React.Dispatch<React.SetStateAction<TriageMessage[]>>;
  chatId: string;
  setChatId: (id: string) => void;
  onBackToHome?: () => void;
}

export const PatientPortal: React.FC<PatientPortalProps> = ({
  messages,
  setMessages,
  chatId,
  setChatId,
  onBackToHome,
}) => {
  const { t, isHindi } = useLanguage();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'triage' | 'appointments' | 'facilities' | 'history'>('triage');
  const [dangerSigns, setDangerSigns] = useState<string[]>([]);
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);

  // Appointments & Token State
  const [myAppointments, setMyAppointments] = useState<AppointmentResponse[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  // Booking Form
  const [bookFacilityId, setBookFacilityId] = useState('phc-phaphamau');
  const [bookDate, setBookDate] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [bookSlot, setBookSlot] = useState<PreferredSlot>('MORNING');
  const [bookReason, setBookReason] = useState('');

  // Queue Token Lookup
  const [tokenLookupId, setTokenLookupId] = useState('');
  const [lookupResult, setLookupResult] = useState<QueueEntryResponse | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);

  const loadMyAppointments = async () => {
    setIsLoadingAppointments(true);
    try {
      const data = await appointmentService.listAppointments();
      setMyAppointments(data);
    } finally {
      setIsLoadingAppointments(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'appointments') {
      loadMyAppointments();
    }
  }, [activeTab]);

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookReason.trim()) return;
    try {
      await appointmentService.bookAppointment({
        patient_id: user?.id || 'self',
        facility_id: bookFacilityId,
        requested_date: bookDate,
        preferred_slot: bookSlot,
        reason: bookReason.trim(),
      });
      setBookReason('');
      setIsBookModalOpen(false);
      loadMyAppointments();
    } catch (err: any) {
      alert(err.message || 'Booking failed. Please try again.');
    }
  };

  const handleTokenLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenLookupId.trim()) return;
    setIsLookingUp(true);
    try {
      const res = await appointmentService.getQueueEntry(tokenLookupId.trim());
      setLookupResult(res);
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleSelectPreset = (promptText: string) => {
    setActiveTab('triage');
    const inputElement = document.querySelector('input[type="text"]') as HTMLInputElement;
    if (inputElement) {
      inputElement.value = promptText;
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Patient Top Header Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="mb-2 text-xs font-bold text-slate-500 hover:text-emerald-700 flex items-center gap-1.5 transition-colors group cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
              <span>{isHindi ? '← मुख्य पृष्ठ पर लौटें' : '← Back to Home'}</span>
            </button>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl">🧑‍🌾</span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950">
              {isHindi ? 'मरीज एवं नागरिक पोर्टल' : 'Patient & Citizen Care Portal'}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 font-hindi mt-0.5">
            {isHindi
              ? 'आसान व त्वरित लक्षण जांच, ओपीडी अपॉइंटमेंट बुकिंग एवं नजदीकी अस्पताल खोज'
              : 'Voice AI symptom triage, OPD appointment booking, and nearby health center locator'}
          </p>
        </div>

        {/* Navigation Tabs for Patient */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200 overflow-x-auto text-xs font-black shrink-0">
          <button
            onClick={() => setActiveTab('triage')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
              activeTab === 'triage'
                ? 'bg-slate-950 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isHindi ? 'लक्षण जांच व आवाज' : 'AI Symptom Triage'}</span>
          </button>

          <button
            onClick={() => setActiveTab('appointments')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
              activeTab === 'appointments'
                ? 'bg-slate-950 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span>{isHindi ? 'अपॉइंटमेंट व टोकन' : 'OPD Appointments & Token'}</span>
          </button>

          <button
            onClick={() => setActiveTab('facilities')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
              activeTab === 'facilities'
                ? 'bg-slate-950 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-teal-400" />
            <span>{isHindi ? 'अस्पताल व PHC' : 'Nearby Hospitals'}</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
              activeTab === 'history'
                ? 'bg-slate-950 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{isHindi ? 'मेरा परामर्श इतिहास' : 'My History'}</span>
          </button>
        </div>
      </div>

      {/* TAB 1: AI TRIAGE & VOICE */}
      {activeTab === 'triage' && (
        <div className="space-y-6">
          <DangerSignsCard
            dangerSigns={dangerSigns}
            onOpenDoctorModal={() => setIsDoctorModalOpen(true)}
            onOpenFacilities={() => setActiveTab('facilities')}
          />

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

          <PresetScenarios onSelectScenario={handleSelectPreset} />
        </div>
      )}

      {/* TAB 2: APPOINTMENTS & MY QUEUE TOKEN */}
      {activeTab === 'appointments' && (
        <div className="space-y-6">
          {/* Quick Actions & Live Token Lookup */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Book Appointment Card */}
            <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {isHindi ? 'ओपीडी अपॉइंटमेंट बुक करें' : 'Book PHC / CHC OPD Appointment'}
                  </h3>
                  <p className="text-xs text-slate-500 font-hindi">
                    {isHindi
                      ? 'स्वास्थ्य केंद्र में कतार से बचने के लिए पूर्व स्लॉट आरक्षित करें'
                      : 'Schedule ahead to reserve your spot and reduce hospital waiting times'}
                  </p>
                </div>
                <button
                  onClick={() => setIsBookModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-black shadow-xs flex items-center gap-1.5 transition-all shrink-0"
                >
                  <PlusCircle className="w-4 h-4 text-emerald-400" />
                  <span>{isHindi ? 'नया स्लॉट बुक करें' : 'Book Slot'}</span>
                </button>
              </div>

              {/* Patient's own appointments list */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {isHindi ? 'आपके बुक किए गए अपॉइंटमेंट्स:' : 'Your Booked Appointments:'}
                </div>

                {isLoadingAppointments ? (
                  <div className="py-8 text-center text-xs text-slate-400">Loading appointments...</div>
                ) : myAppointments.length === 0 ? (
                  <div className="py-8 text-center bg-slate-50 rounded-2xl border border-slate-100 p-4">
                    <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <div className="text-xs font-bold text-slate-700">
                      {isHindi ? 'कोई सक्रिय अपॉइंटमेंट नहीं मिला' : 'No upcoming appointments found'}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {isHindi
                        ? 'ऊपर दिए गए "नया स्लॉट बुक करें" बटन पर क्लिक करके ओपीडी अपॉइंटमेंट लें।'
                        : 'Click "Book Slot" above to schedule an OPD consultation.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {myAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900">
                              📅 {apt.requested_date}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                              {apt.preferred_slot}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                                apt.status === 'CHECKED_IN'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {apt.status}
                            </span>
                          </div>
                          <div className="text-xs text-slate-700 mt-1 font-medium line-clamp-1">
                            {apt.reason}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Facility: {apt.facility_id}
                          </div>
                        </div>

                        {apt.queue_id && (
                          <div className="text-right shrink-0">
                            <div className="text-[10px] font-bold text-slate-400 uppercase">Live Token</div>
                            <div className="text-sm font-black text-emerald-600 font-mono">
                              #{apt.queue_id.split('-').pop()}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Live Queue Token Status Checker */}
            <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {isHindi ? 'ओपीडी टोकन लाइव स्थिति जांचें' : 'Check Live OPD Queue Token Status'}
                </h3>
                <p className="text-xs text-slate-500 font-hindi">
                  {isHindi
                    ? 'अस्पताल से मिला टोकन नंबर दर्ज करें और अपना प्रतीक्षा समय देखें'
                    : 'Enter your assigned Token / Queue ID to view real-time queue position'}
                </p>
              </div>

              <form onSubmit={handleTokenLookup} className="flex items-center gap-2">
                <input
                  type="text"
                  value={tokenLookupId}
                  onChange={(e) => setTokenLookupId(e.target.value)}
                  placeholder="e.g. q-101 or token UUID..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950"
                  required
                />
                <button
                  type="submit"
                  disabled={isLookingUp}
                  className="px-4 py-2.5 rounded-xl bg-slate-950 text-white text-xs font-black hover:bg-slate-800 shrink-0"
                >
                  {isLookingUp ? 'Searching...' : 'Check Status'}
                </button>
              </form>

              {lookupResult ? (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      Token #{lookupResult.token_number}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-700 text-white">
                      {lookupResult.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-white p-3 rounded-xl border border-emerald-200/60">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Queue Position</div>
                      <div className="text-2xl font-black text-slate-900">
                        {lookupResult.position ? `#${lookupResult.position}` : 'Called / Done'}
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-emerald-200/60">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Estimated Wait</div>
                      <div className="text-2xl font-black text-emerald-600">
                        ~{lookupResult.estimated_wait_minutes ?? 0} mins
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-600 pt-1">
                    Facility: <b className="text-slate-900">{lookupResult.facility_id}</b> • Date: {lookupResult.queue_date}
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-400">
                  <Ticket className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  Enter your token ID above to check live wait times and cabin calling status.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: NEARBY HOSPITALS & PHCS */}
      {activeTab === 'facilities' && <FacilityLocator />}

      {/* TAB 4: MY MEDICAL HISTORY (Patient's Own History Only) */}
      {activeTab === 'history' && (
        <HistoryPage currentMessages={messages} currentChatId={chatId} />
      )}

      {/* MODAL: Book OPD Appointment */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">
                {isHindi ? 'ओपीडी अपॉइंटमेंट बुक करें' : 'Book OPD Appointment Slot'}
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
                  {isHindi ? 'स्वास्थ्य केंद्र (PHC / CHC):' : 'Select Health Facility:'}
                </label>
                <select
                  value={bookFacilityId}
                  onChange={(e) => setBookFacilityId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium"
                >
                  <option value="phc-phaphamau">Primary Health Centre (PHC) Phaphamau</option>
                  <option value="chc-soraon">Community Health Centre (CHC) Soraon</option>
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
                  {isHindi ? 'लक्षण या परामर्श का कारण:' : 'Symptoms / Reason for Visit:'}
                </label>
                <textarea
                  rows={3}
                  value={bookReason}
                  onChange={(e) => setBookReason(e.target.value)}
                  placeholder={
                    isHindi
                      ? 'उदा. पिछले 3 दिनों से सिरदर्द व तेज बुखार...'
                      : 'e.g. Fever, body ache, and persistent cough for 3 days...'
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
                  Confirm Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SBAR Doctor Handover Modal */}
      <DoctorSummaryModal
        isOpen={isDoctorModalOpen}
        onClose={() => setIsDoctorModalOpen(false)}
        chatId={chatId}
        messages={messages}
        dangerSigns={dangerSigns}
        locationName="Phaphamau, Prayagraj"
      />
    </div>
  );
};

