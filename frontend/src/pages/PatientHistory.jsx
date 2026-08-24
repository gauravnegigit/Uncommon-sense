import React, { useState, useEffect } from 'react';
import { 
  FileText, Activity, Clock, Download, 
  Printer, Volume2, ShieldCheck, Heart, 
  ChevronRight, Calendar, User, QrCode 
} from 'lucide-react';
import consultationService from '../services/consultationService';
import triageService from '../services/triageService';
import PrescriptionViewer from '../components/PrescriptionViewer';
import { useAuth } from '../context/AuthContext';

const PatientHistory = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [triageHistory, setTriageHistory] = useState([]);
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    const rxRes = await consultationService.getPrescriptions(user?.id || 'pat-101');
    if (rxRes.prescriptions) {
      setPrescriptions(rxRes.prescriptions);
    }
    const triageRes = await triageService.getPatientHistory(user?.id || 'pat-101');
    if (triageRes.records) {
      setTriageHistory(triageRes.records);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Patient Health Profile Card */}
      <div className="bg-white rounded-3xl border border-slatecalm-200/80 p-6 sm:p-8 shadow-soft flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-tealmed-100 text-tealmed-800 flex items-center justify-center font-black text-2xl shadow-xs">
            {user?.name ? user.name[0] : 'R'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slatecalm-900">{user?.name || 'Ramesh Kumar'}</h1>
              <span className="text-xs bg-emerald-50 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                ABHA Active
              </span>
            </div>
            <p className="text-xs text-slatecalm-500 mt-1">
              ABHA ID: <strong className="text-slatecalm-800 font-mono">{user?.abhaId || '91-4521-8890-1234'}</strong> • Age: <strong>{user?.age || 48}</strong> Yrs • Blood Group: <strong>{user?.bloodGroup || 'B+'}</strong>
            </p>
            <p className="text-xs text-slatecalm-500 mt-0.5">
              Village: <strong>{user?.village || 'Sonapur, Block B'}</strong>
            </p>
          </div>
        </div>

        <div className="p-3 bg-tealmed-50/70 rounded-2xl border border-tealmed-100 flex items-center gap-3 text-xs">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-tealmed-200">
            <QrCode className="w-6 h-6 text-tealmed-800" />
          </div>
          <div>
            <p className="font-bold text-tealmed-900">National Health Pass</p>
            <p className="text-[11px] text-tealmed-700">Digital Health Record</p>
          </div>
        </div>
      </div>

      {/* Grid: Digital Prescriptions & Past Triage Consultations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Digital Prescriptions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slatecalm-200">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-tealmed-600" />
              <h2 className="text-base font-bold text-slatecalm-900">Digital Prescriptions (दवाई का पर्चा)</h2>
            </div>
            <span className="text-xs font-semibold text-slatecalm-500">
              {prescriptions.length} Records
            </span>
          </div>

          <div className="space-y-3">
            {prescriptions.map((rx) => (
              <div
                key={rx.id}
                className="bg-white p-5 rounded-2xl border border-slatecalm-200/80 shadow-soft hover:border-tealmed-400 transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-tealmed-700 bg-tealmed-50 px-2 py-0.5 rounded">
                    {rx.id}
                  </span>
                  <span className="text-xs text-slatecalm-400 font-medium">{rx.date}</span>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slatecalm-900">{rx.diagnosis}</h4>
                  <p className="text-xs text-slatecalm-500 mt-0.5">Doctor: {rx.doctorName} • {rx.facility}</p>
                </div>

                {/* Medicines List Preview */}
                <div className="p-3 bg-slatecalm-50 rounded-xl space-y-1 text-xs">
                  <span className="font-bold text-slatecalm-700 block text-[11px]">Prescribed Medicines:</span>
                  {rx.medicines?.map((m, i) => (
                    <p key={i} className="text-slatecalm-600 font-medium">
                      • {m.name} ({m.dosage})
                    </p>
                  ))}
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedPrescription(rx)}
                    className="px-4 py-2 bg-tealmed-600 hover:bg-tealmed-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <span>View & Listen Rx</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> ABDM Verified
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Triage Consultations History */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slatecalm-200">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-tealmed-600" />
              <h2 className="text-base font-bold text-slatecalm-900">Past Triage & Consultations</h2>
            </div>
            <span className="text-xs font-semibold text-slatecalm-500">
              {triageHistory.length} Cases
            </span>
          </div>

          <div className="space-y-3">
            {triageHistory.map((item) => (
              <div
                key={item.id}
                className="bg-white p-5 rounded-2xl border border-slatecalm-200/80 shadow-soft space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    item.urgency === 'HIGH' ? 'bg-rose-100 text-rose-800' :
                    item.urgency === 'MODERATE' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {item.urgency} Urgency
                  </span>
                  <span className="text-[11px] text-slatecalm-400 font-mono">{item.id}</span>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slatecalm-900">Symptoms: {item.symptoms?.join(', ')}</h4>
                  <p className="text-xs text-slatecalm-600 mt-1 italic">"{item.transcript}"</p>
                </div>

                <div className="p-3 bg-slatecalm-50 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-slatecalm-700 block">Doctor Advice / Action:</span>
                  <p className="text-slatecalm-600">{item.recommendedAction}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Prescription Modal */}
      {selectedPrescription && (
        <PrescriptionViewer
          prescription={selectedPrescription}
          onClose={() => setSelectedPrescription(null)}
        />
      )}

    </div>
  );
};

export default PatientHistory;

