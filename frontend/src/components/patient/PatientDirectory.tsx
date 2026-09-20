import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  UserPlus,
  Activity,
  Calendar,
  Phone,
  MapPin,
  Heart,
  AlertCircle,
  Plus,
  Clock,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { patientService } from '../../services/patientService';
import {
  PatientCreateRequest,
  PatientResponse,
  PersonaRole,
  RecordEntryCreateRequest,
  TimelineEvent,
} from '../../types';

interface PatientDirectoryProps {
  selectedPersona: PersonaRole;
}

export const PatientDirectory: React.FC<PatientDirectoryProps> = ({ selectedPersona }) => {
  const { t, isHindi } = useLanguage();

  const [patients, setPatients] = useState<PatientResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Selected Patient for Timeline
  const [selectedPatient, setSelectedPatient] = useState<PatientResponse | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [isTimelineLoading, setIsTimelineLoading] = useState(false);

  // Modals
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);

  // Registration Form
  const [regName, setRegName] = useState('');
  const [regAge, setRegAge] = useState<number | ''>('');
  const [regGender, setRegGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('FEMALE');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regPincode, setRegPincode] = useState('');

  // Clinical Note Form
  const [noteType, setNoteType] = useState<'NOTE' | 'OBSERVATION'>('OBSERVATION');
  const [noteContent, setNoteContent] = useState('');

  const loadPatients = async (query?: string) => {
    setIsLoading(true);
    try {
      const data = await patientService.listPatients(query);
      setPatients(data);
      if (data.length > 0 && !selectedPatient) {
        handleSelectPatient(data[0]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadPatients(searchQuery);
  };

  const handleSelectPatient = async (patient: PatientResponse) => {
    setSelectedPatient(patient);
    setIsTimelineLoading(true);
    try {
      const events = await patientService.getPatientTimeline(patient.id);
      setTimelineEvents(events);
    } finally {
      setIsTimelineLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) return;
    const newPat = await patientService.createPatient({
      name: regName.trim(),
      age: regAge ? Number(regAge) : null,
      gender: regGender,
      phone: regPhone.trim() || null,
      address: regAddress.trim() || null,
      pincode: regPincode.trim() || null,
    });
    setRegName('');
    setRegAge('');
    setRegPhone('');
    setRegAddress('');
    setRegPincode('');
    setIsRegisterModalOpen(false);
    loadPatients();
    handleSelectPatient(newPat);
  };

  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !noteContent.trim()) return;
    await patientService.addRecordEntry(selectedPatient.id, {
      entry_type: noteType,
      content: noteContent.trim(),
    });
    setNoteContent('');
    setIsNoteModalOpen(false);
    handleSelectPatient(selectedPatient);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-purple-50 text-purple-700 rounded-xl">
              <FileText className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950">
              {t('patientDirectoryTitle')}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-100 text-purple-800">
              ABHA Standardized
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 font-hindi">
            {t('patientDirectorySub')}
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={() => setIsRegisterModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-black shadow-sm flex items-center gap-1.5 transition-all self-start md:self-auto"
        >
          <UserPlus className="w-4 h-4 text-emerald-400" />
          <span>{t('registerPatientBtn')}</span>
        </button>
      </div>

      {/* Main Workspace: Left Patient List + Right Longitudinal Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Search & Patient Cards (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          {/* Search bar */}
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isHindi
                  ? 'मरीज का नाम, मोबाइल नंबर या ABHA ID खोजें...'
                  : 'Search by patient name, phone, or ABHA ID...'
              }
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-950"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          </form>

          {/* Patient Cards List */}
          <div className="space-y-2.5 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
            {patients.map((pat) => {
              const isSelected = selectedPatient?.id === pat.id;
              return (
                <div
                  key={pat.id}
                  onClick={() => handleSelectPatient(pat)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-950 text-white border-slate-950 shadow-md scale-[1.01]'
                      : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <div className="text-sm font-black flex items-center gap-2">
                        <span>{pat.name}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            isSelected
                              ? 'bg-white/20 text-emerald-300'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {pat.age ? `${pat.age}y` : ''} • {pat.gender}
                        </span>
                      </div>
                      <div
                        className={`text-[11px] font-mono mt-0.5 ${
                          isSelected ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        ABHA: {pat.abha_id || '91-XXXX-XXXX-XXXX'}
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`}
                    />
                  </div>

                  {/* Conditions & Location Tags */}
                  <div className="space-y-1 mt-2">
                    {pat.chronic_conditions && pat.chronic_conditions.length > 0 && (
                      <div
                        className={`text-[11px] font-bold line-clamp-1 flex items-center gap-1 ${
                          isSelected ? 'text-amber-300' : 'text-amber-700'
                        }`}
                      >
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{pat.chronic_conditions[0]}</span>
                      </div>
                    )}

                    <div
                      className={`text-[10px] flex items-center gap-3 ${
                        isSelected ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      {pat.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {pat.phone}
                        </span>
                      )}
                      {pat.address && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3" /> {pat.address}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Longitudinal Timeline (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
          {selectedPatient ? (
            <>
              {/* Patient Overview Card */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900">
                      {selectedPatient.name}
                    </h3>
                    <span className="text-xs font-mono font-bold text-slate-500 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                      {selectedPatient.id}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1 flex flex-wrap gap-2">
                    <span>🩸 Blood Group: <b>{selectedPatient.blood_group || 'Unknown'}</b></span>
                    <span>• Allergies: <b>{selectedPatient.allergies?.join(', ') || 'None reported'}</b></span>
                  </div>
                </div>

                <button
                  onClick={() => setIsNoteModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t('addObservationBtn')}</span>
                </button>
              </div>

              {/* Timeline Events Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2 text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{t('timelineTitle')}</span>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {timelineEvents.length} Clinical Records
                </span>
              </div>

              {/* Chronological Stepper Timeline */}
              {isTimelineLoading ? (
                <div className="py-12 text-center text-xs text-slate-400">Loading timeline...</div>
              ) : timelineEvents.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No medical records found for this patient.
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {timelineEvents.map((evt) => (
                    <div key={evt.id} className="relative group">
                      {/* Timeline node icon */}
                      <div
                        className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-white shadow-xs flex items-center justify-center ${
                          evt.type === 'CONSULTATION'
                            ? 'bg-blue-600'
                            : evt.type === 'DIAGNOSTIC'
                            ? 'bg-cyan-500'
                            : evt.type === 'REFERRAL'
                            ? 'bg-amber-500'
                            : evt.type === 'FOLLOW_UP'
                            ? 'bg-purple-500'
                            : 'bg-slate-600'
                        }`}
                      />

                      {/* Event Card */}
                      <div className="bg-slate-50/70 hover:bg-slate-50 rounded-2xl p-4 border border-slate-200 transition-colors space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-xs font-black text-slate-900 flex items-center gap-2">
                            <span>{evt.title}</span>
                            <span
                              className={`text-[9px] px-2 py-0.2 rounded-full font-bold uppercase ${
                                evt.type === 'CONSULTATION'
                                  ? 'bg-blue-100 text-blue-800'
                                  : evt.type === 'DIAGNOSTIC'
                                  ? 'bg-cyan-100 text-cyan-800'
                                  : evt.type === 'REFERRAL'
                                  ? 'bg-amber-100 text-amber-800'
                                  : evt.type === 'FOLLOW_UP'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {evt.type}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">
                            {new Date(evt.date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed">
                          {evt.summary}
                        </p>

                        <div className="text-[10px] text-slate-400 font-mono pt-1">
                          Facility: {evt.facility_id || 'PHC Phaphamau'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="py-20 text-center text-xs text-slate-400">
              Select a patient from the left column to view their lifetime clinical timeline.
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Register New Patient */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">
                {isHindi ? 'नया मरीज पंजीकृत करें' : 'Register New Patient Profile'}
              </h3>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isHindi ? 'मरीज का पूरा नाम:' : 'Full Name:'}
                </label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="उदा. सुनीता देवी"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isHindi ? 'उम्र (वर्ष):' : 'Age:'}
                  </label>
                  <input
                    type="number"
                    value={regAge}
                    onChange={(e) => setRegAge(e.target.value ? Number(e.target.value) : '')}
                    placeholder="उदा. 28"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isHindi ? 'लिंग:' : 'Gender:'}
                  </label>
                  <select
                    value={regGender}
                    onChange={(e) => setRegGender(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium"
                  >
                    <option value="FEMALE">Female (महिला)</option>
                    <option value="MALE">Male (पुरुष)</option>
                    <option value="OTHER">Other (अन्य)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isHindi ? 'मोबाइल नंबर:' : 'Phone Number:'}
                </label>
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="उदा. 9876543210"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isHindi ? 'गांव / पता:' : 'Village / Address:'}
                  </label>
                  <input
                    type="text"
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    placeholder="उदा. ग्राम फाफामऊ"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isHindi ? 'पिनकोड:' : 'Pincode:'}
                  </label>
                  <input
                    type="text"
                    value={regPincode}
                    onChange={(e) => setRegPincode(e.target.value)}
                    placeholder="उदा. 211013"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-950 text-white font-bold hover:bg-slate-800"
                >
                  Register Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Clinical Observation */}
      {isNoteModalOpen && selectedPatient && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">
                {isHindi ? 'क्लिनिकल अवलोकन / नोट जोड़ें' : 'Add Clinical Observation Note'}
              </h3>
              <button
                onClick={() => setIsNoteModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleNoteSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isHindi ? 'प्रविष्टि प्रकार:' : 'Entry Type:'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNoteType('OBSERVATION')}
                    className={`p-2 rounded-xl border font-bold transition-all ${
                      noteType === 'OBSERVATION'
                        ? 'bg-slate-950 text-white border-slate-950'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    Clinical Observation
                  </button>
                  <button
                    type="button"
                    onClick={() => setNoteType('NOTE')}
                    className={`p-2 rounded-xl border font-bold transition-all ${
                      noteType === 'NOTE'
                        ? 'bg-slate-950 text-white border-slate-950'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    Staff Note
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isHindi ? 'नैदानिक विवरण / निष्कर्ष:' : 'Observation Content:'}
                </label>
                <textarea
                  rows={4}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder={
                    isHindi
                      ? 'उदा. मरीज का रक्तचाप 130/85 दर्ज किया गया। पिछले 2 हफ़्ते से दवा नियमित ले रहे हैं...'
                      : 'e.g. Blood pressure stabilized at 130/85 mmHg. Good adherence to antihypertensive therapy...'
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNoteModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-950 text-white font-bold hover:bg-slate-800"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};



