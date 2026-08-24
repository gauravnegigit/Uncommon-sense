import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, Activity, Users, Video, 
  FileText, CheckCircle2, AlertTriangle, ShieldAlert, 
  Clock, Play, Pause, ChevronRight, Filter, Search, 
  Send, RefreshCw, PlusCircle, Check 
} from 'lucide-react';
import triageService from '../services/triageService';
import consultationService from '../services/consultationService';
import TeleconsultationRoom from '../components/TeleconsultationRoom';
import PrescriptionViewer from '../components/PrescriptionViewer';
import { useAuth } from '../context/AuthContext';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [queue, setQueue] = useState([]);
  const [filteredQueue, setFilteredQueue] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [urgencyFilter, setUrgencyFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeConsultation, setActiveConsultation] = useState(null);
  const [viewingPrescription, setViewingPrescription] = useState(null);
  const [isCreatingRx, setIsCreatingRx] = useState(false);
  const [newRxData, setNewRxData] = useState({
    diagnosis: '',
    medicines: [
      { name: 'Paracetamol 650mg', dosage: '1 tab TDS x 3 days', duration: '3 days', instructions: 'After meals', timingIcons: ['morning', 'afternoon', 'night'] },
      { name: 'Amoxicillin 500mg', dosage: '1 cap BD x 5 days', duration: '5 days', instructions: 'Complete course', timingIcons: ['morning', 'night'] }
    ],
    dietAdvice: 'Boiled water, light nutritious khichdi, proper hydration.',
    followUpDate: 'After 3 days at nearest PHC'
  });

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    const res = await triageService.getDoctorQueue();
    if (res.queue) {
      setQueue(res.queue);
      setSelectedCase(res.queue[0]);
    }
  };

  // Filter queue based on urgency and search
  useEffect(() => {
    let result = [...queue];
    if (urgencyFilter !== 'ALL') {
      result = result.filter(item => item.urgency === urgencyFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.patientName.toLowerCase().includes(q) ||
        item.village.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q)
      );
    }
    setFilteredQueue(result);
  }, [queue, urgencyFilter, searchQuery]);

  const handleStartConsultation = (patientCase) => {
    setActiveConsultation(patientCase);
  };

  const handleCompleteConsultation = async (notes) => {
    if (activeConsultation) {
      await triageService.updateTriageStatus(activeConsultation.id, 'RESOLVED', notes);
      fetchQueue();
    }
  };

  const handleCreatePrescriptionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCase) return;
    const rxPayload = {
      patientName: selectedCase.patientName,
      patientAge: selectedCase.age,
      patientGender: selectedCase.gender,
      doctorName: user?.name || 'Dr. Ananya Roy, MD',
      doctorReg: user?.regNumber || 'MCI-88234-WB',
      facility: 'District Telehealth Center / Sonapur PHC',
      diagnosis: newRxData.diagnosis || 'Acute Respiratory Episode',
      vitalsRecorded: `BP: ${selectedCase.vitals?.bpSystolic || 120}/${selectedCase.vitals?.bpDiastolic || 80} | SpO2: ${selectedCase.vitals?.spO2 || 98}%`,
      medicines: newRxData.medicines,
      dietAdvice: newRxData.dietAdvice,
      followUpDate: newRxData.followUpDate
    };

    const res = await consultationService.createPrescription(rxPayload);
    setIsCreatingRx(false);
    setViewingPrescription(res.prescription);
    await triageService.updateTriageStatus(selectedCase.id, 'RESOLVED', 'e-Prescription Generated');
    fetchQueue();
  };

  const highCount = queue.filter(q => q.urgency === 'HIGH').length;
  const modCount = queue.filter(q => q.urgency === 'MODERATE').length;
  const mildCount = queue.filter(q => q.urgency === 'MILD').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Doctor Profile & Analytics Header */}
      <div className="bg-white rounded-3xl border border-slatecalm-200/80 p-6 shadow-soft flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-tealmed-100 text-tealmed-800 flex items-center justify-center font-bold text-lg shadow-xs">
            👨‍⚕️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slatecalm-900">
                {user?.name || 'Dr. Ananya Roy, MD'}
              </h1>
              <span className="text-xs bg-tealmed-50 text-tealmed-800 font-semibold px-2.5 py-0.5 rounded-full border border-tealmed-200">
                On Duty (Telehealth OPD)
              </span>
            </div>
            <p className="text-xs text-slatecalm-500 mt-0.5">
              {user?.hospital || 'District Civil Hospital, Telemedicine Hub'} • Reg: {user?.regNumber || 'MCI-88234-WB'}
            </p>
          </div>
        </div>

        {/* Quick Triage Counters */}
        <div className="flex items-center gap-2 sm:gap-4 text-xs font-semibold">
          <div className="px-3 py-2 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
            <span>Emergency (Red): <strong>{highCount}</strong></span>
          </div>
          <div className="px-3 py-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Moderate (Amber): <strong>{modCount}</strong></span>
          </div>
          <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Mild: <strong>{mildCount}</strong></span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Workflow Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Triage Queue Filter & List (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slatecalm-200/80 p-5 shadow-soft space-y-4">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-tealmed-600" />
              <h3 className="font-bold text-sm text-slatecalm-900">Rural Patient Queue ({filteredQueue.length})</h3>
            </div>
            <button
              onClick={fetchQueue}
              className="p-1.5 text-slatecalm-400 hover:text-tealmed-700 rounded-lg hover:bg-slatecalm-50 transition-colors"
              title="Refresh queue"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Search & Urgency Filter Buttons */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slatecalm-400" />
              <input
                type="text"
                placeholder="Search patient, village or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slatecalm-50 border border-slatecalm-200 rounded-xl text-xs focus:outline-none focus:border-tealmed-500"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
              {['ALL', 'HIGH', 'MODERATE', 'MILD'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setUrgencyFilter(lvl)}
                  className={`px-2.5 py-1 rounded-lg font-medium shrink-0 transition-colors ${
                    urgencyFilter === lvl
                      ? 'bg-tealmed-700 text-white font-bold'
                      : 'bg-slatecalm-100 text-slatecalm-600 hover:bg-slatecalm-200'
                  }`}
                >
                  {lvl === 'ALL' ? 'All Cases' : lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Patient Cards List */}
          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredQueue.length === 0 ? (
              <div className="p-8 text-center text-slatecalm-400 text-xs">
                No patients found in this category.
              </div>
            ) : (
              filteredQueue.map((item) => {
                const isSelected = selectedCase?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedCase(item)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-tealmed-500 bg-tealmed-50/50 shadow-xs'
                        : 'border-slatecalm-200/80 hover:border-slatecalm-300 bg-slatecalm-50/40 hover:bg-slatecalm-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        item.urgency === 'HIGH' ? 'bg-rose-100 text-rose-800' :
                        item.urgency === 'MODERATE' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {item.urgency} Urgency
                      </span>
                      <span className="text-[11px] text-slatecalm-400 font-mono font-bold">{item.id}</span>
                    </div>

                    <h4 className="font-bold text-xs sm:text-sm text-slatecalm-900 flex items-center justify-between">
                      <span>{item.patientName} ({item.age}y / {item.gender[0]})</span>
                      <span className="text-[11px] font-normal text-slatecalm-500">{item.village}</span>
                    </h4>

                    <div className="mt-2 flex flex-wrap gap-1">
                      {item.symptoms.slice(0, 2).map((s, idx) => (
                        <span key={idx} className="bg-white text-slatecalm-600 text-[10px] px-2 py-0.5 rounded border border-slatecalm-200">
                          {s}
                        </span>
                      ))}
                      {item.symptoms.length > 2 && (
                        <span className="text-[10px] text-slatecalm-400 font-medium">
                          +{item.symptoms.length - 2} more
                        </span>
                      )}
                    </div>

                    {/* Vitals snapshot */}
                    <div className="mt-2.5 pt-2 border-t border-slatecalm-100/80 flex items-center justify-between text-[11px] text-slatecalm-500">
                      <span>SpO2: <strong className={item.vitals?.spO2 < 94 ? 'text-rose-600' : 'text-slatecalm-800'}>{item.vitals?.spO2 || 98}%</strong></span>
                      <span>BP: <strong className="text-slatecalm-800">{item.vitals?.bpSystolic || 120}/{item.vitals?.bpDiastolic || 80}</strong></span>
                      <span className="text-tealmed-700 font-medium flex items-center gap-0.5">
                        Details <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* Right Column: Selected Case Detailed Inspection & Actions (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slatecalm-200/80 p-6 shadow-soft space-y-5">
          {selectedCase ? (
            <>
              {/* Selected Patient Header */}
              <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slatecalm-200">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-slatecalm-900">{selectedCase.patientName}</h2>
                    <span className="text-xs text-slatecalm-500">({selectedCase.age} Years • {selectedCase.gender})</span>
                  </div>
                  <p className="text-xs text-slatecalm-600 mt-0.5">
                    📍 {selectedCase.village} • Field Worker: <strong>{selectedCase.ashaWorker}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStartConsultation(selectedCase)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-tealmed-600 hover:bg-tealmed-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-soft transition-all"
                  >
                    <Video className="w-4 h-4" />
                    <span>Start Video Consult</span>
                  </button>

                  <button
                    onClick={() => setIsCreatingRx(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slatecalm-900 hover:bg-slatecalm-800 text-white font-bold text-xs rounded-xl shadow-soft transition-all"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Write Rx</span>
                  </button>
                </div>
              </div>

              {/* Vitals Grid */}
              <div>
                <h4 className="text-xs font-bold text-slatecalm-700 uppercase tracking-wider mb-2.5">
                  Clinical Vital Signs
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slatecalm-50 border border-slatecalm-200">
                    <span className="text-slatecalm-400 block text-[10px]">Blood Pressure</span>
                    <span className="text-sm font-extrabold text-slatecalm-800">
                      {selectedCase.vitals?.bpSystolic || 120} / {selectedCase.vitals?.bpDiastolic || 80} <span className="text-[10px] text-slatecalm-400 font-normal">mmHg</span>
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slatecalm-50 border border-slatecalm-200">
                    <span className="text-slatecalm-400 block text-[10px]">Oxygen (SpO2)</span>
                    <span className={`text-sm font-extrabold ${(selectedCase.vitals?.spO2 || 98) < 94 ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {selectedCase.vitals?.spO2 || 98}%
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slatecalm-50 border border-slatecalm-200">
                    <span className="text-slatecalm-400 block text-[10px]">Pulse Rate</span>
                    <span className="text-sm font-extrabold text-slatecalm-800">
                      {selectedCase.vitals?.heartRate || 76} <span className="text-[10px] text-slatecalm-400 font-normal">bpm</span>
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slatecalm-50 border border-slatecalm-200">
                    <span className="text-slatecalm-400 block text-[10px]">Temperature</span>
                    <span className="text-sm font-extrabold text-slatecalm-800">
                      {selectedCase.vitals?.temp || 98.6}°F
                    </span>
                  </div>
                </div>
              </div>

              {/* Voice Note & Speech Transcript */}
              <div className="p-4 rounded-2xl bg-tealmed-50/60 border border-tealmed-100 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-tealmed-900 flex items-center gap-1.5">
                    🎙️ Voice Recording & Dialect Transcript
                  </span>
                  <span className="text-[11px] text-tealmed-700 font-mono">
                    Duration: {selectedCase.audioDuration || '00:32'}
                  </span>
                </div>
                <p className="text-slatecalm-700 italic bg-white p-3 rounded-xl border border-tealmed-200/60 leading-relaxed">
                  "{selectedCase.transcript || 'Patient reported acute fever with dry cough.'}"
                </p>
              </div>

              {/* Reported Symptoms Breakdown */}
              <div>
                <h4 className="text-xs font-bold text-slatecalm-700 uppercase tracking-wider mb-2">
                  Diagnosed Symptom Cluster:
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCase.symptoms.map((s, i) => (
                    <span key={i} className="px-3 py-1 bg-slatecalm-100 text-slatecalm-800 text-xs font-semibold rounded-lg border border-slatecalm-200">
                      ✓ {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Triage Decision Recommendation */}
              <div className="p-4 rounded-2xl bg-slatecalm-50 border border-slatecalm-200 text-xs space-y-1">
                <span className="font-bold text-slatecalm-900 block">AI Triage Clinical Recommendation:</span>
                <p className="text-slatecalm-600">{selectedCase.recommendedAction}</p>
              </div>

            </>
          ) : (
            <div className="p-12 text-center text-slatecalm-400 text-sm">
              Select a patient case from the queue to view full dossier.
            </div>
          )}
        </div>

      </div>

      {/* Video Consultation Modal */}
      {activeConsultation && (
        <TeleconsultationRoom
          patient={activeConsultation}
          onClose={() => setActiveConsultation(null)}
          onCompleteConsultation={handleCompleteConsultation}
        />
      )}

      {/* Digital Prescription Viewer */}
      {viewingPrescription && (
        <PrescriptionViewer
          prescription={viewingPrescription}
          onClose={() => setViewingPrescription(null)}
        />
      )}

      {/* Fast e-Prescription Generator Drawer Modal */}
      {isCreatingRx && selectedCase && (
        <div className="fixed inset-0 z-50 bg-slatecalm-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl border border-slatecalm-200">
            <div className="p-5 bg-tealmed-700 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Write e-Prescription for {selectedCase.patientName}</h3>
              <button onClick={() => setIsCreatingRx(false)} className="text-white/80 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreatePrescriptionSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slatecalm-700 block mb-1">Clinical Diagnosis:</label>
                <input
                  type="text"
                  placeholder="e.g. Acute Viral Bronchitis / Gastroenteritis"
                  value={newRxData.diagnosis}
                  onChange={(e) => setNewRxData({ ...newRxData, diagnosis: e.target.value })}
                  className="w-full bg-slatecalm-50 border border-slatecalm-200 rounded-xl p-2.5 font-semibold text-slatecalm-800 focus:outline-none focus:border-tealmed-500"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slatecalm-700 block mb-1">Medicines & Schedule:</label>
                <div className="space-y-2">
                  {newRxData.medicines.map((med, idx) => (
                    <div key={idx} className="p-2.5 bg-slatecalm-50 rounded-xl border border-slatecalm-200 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slatecalm-800">{med.name}</p>
                        <p className="text-[11px] text-slatecalm-500">{med.dosage} • {med.duration}</p>
                      </div>
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold">
                        Stock Available in PHC
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slatecalm-700 block mb-1">Diet Advice & Home Care:</label>
                <input
                  type="text"
                  value={newRxData.dietAdvice}
                  onChange={(e) => setNewRxData({ ...newRxData, dietAdvice: e.target.value })}
                  className="w-full bg-slatecalm-50 border border-slatecalm-200 rounded-xl p-2.5 text-slatecalm-800 focus:outline-none focus:border-tealmed-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingRx(false)}
                  className="px-4 py-2.5 text-slatecalm-600 bg-slatecalm-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-tealmed-600 hover:bg-tealmed-700 text-white rounded-xl font-bold shadow-soft"
                >
                  Issue & Sign Digital Prescription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default DoctorDashboard;

