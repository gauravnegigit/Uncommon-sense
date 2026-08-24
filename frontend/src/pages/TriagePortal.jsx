import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, Mic, Stethoscope, HeartPulse, 
  CheckCircle2, AlertTriangle, ShieldAlert, 
  MapPin, Phone, ArrowRight, RotateCcw, 
  CloudOff, Send, Clock, Sparkles, Plus, MessageSquare
} from 'lucide-react';
import AudioRecorder from '../components/AudioRecorder';
import SymptomTriageCard from '../components/SymptomTriageCard';
import VitalsInput from '../components/VitalsInput';
import triageService from '../services/triageService';
import { useAuth } from '../context/AuthContext';
import { useOfflineQueue } from '../context/OfflineQueueContext';

const PATIENT_HISTORY = [
  {
    id: 0,
    title: '🔴 Fever & Dry Cough',
    tag: 'Urgent',
    facility: 'Sonapur PHC',
    time: '10:45 AM',
    period: 'today',
    transcript: '"मुझे 3 दिनों से लगातार तेज बुखार है और सूखी खांसी आ रही है, गले में भी हल्का दर्द है।"',
    symptoms: ['High Fever (>101°F)', 'Dry Cough (3 Days)', 'Throat Discomfort'],
    urgencyText: '⚠️ URGENT (त्वरित देखभाल)',
    urgencyBg: 'bg-amber-500',
    timeframe: 'Timeframe: Within 24-48 Hours',
    facilityName: '📍 Sonapur Primary Health Centre (PHC) — 2.4 km away',
    summaryHindi: 'मरीज को 3 दिनों से लगातार तेज बुखार (>101°F) और सूखी खांसी है। PHC में परामर्श की सलाह दी गई है।',
    summaryEnglish: 'Patient presents with 3-day history of high fever (>101°F) and dry cough. Recommended same-day OPD evaluation at Sonapur PHC.'
  },
  {
    id: 1,
    title: '🟢 Knee Joint Swelling',
    tag: 'Routine',
    facility: 'Haripur Sub-Centre',
    time: '3 days ago',
    period: 'week',
    transcript: '"पिछले 4-5 दिनों से दाएं घुटने में दर्द और हल्का सूजन है, चलने में भारीपन लगता है।"',
    symptoms: ['Joint Pain (Right Knee)', 'Mild Swelling', 'Mobility Stiffness'],
    urgencyText: '🟢 ROUTINE (सामान्य प्राथमिक देखभाल)',
    urgencyBg: 'bg-emerald-600',
    timeframe: 'Timeframe: Next 3–7 Days',
    facilityName: '📍 Haripur Health & Wellness Sub-Centre — 4.1 km away',
    summaryHindi: 'दाएं घुटने में पिछले 4-5 दिनों से हल्का दर्द व सूजन। उप-स्वास्थ्य केंद्र (Sub-Centre) में बुनियादी जांच।',
    summaryEnglish: 'Patient reported right knee pain and mild swelling for 5 days. Recommended routine evaluation at Haripur Sub-Centre.'
  },
  {
    id: 2,
    title: '🟡 Stomach Cramps & Vomiting',
    tag: 'Routine',
    facility: 'Home ORS Fluids',
    time: '5 days ago',
    period: 'week',
    transcript: '"पेट में मरोड़ और कल रात दो बार उल्टी हुई थी, कमजोरी महसूस हो रही है।"',
    symptoms: ['Abdominal Cramps', 'Vomiting (2 Episodes)', 'Mild Dehydration'],
    urgencyText: '🟢 ROUTINE (घरेलू देखभाल व ओआरएस)',
    urgencyBg: 'bg-emerald-600',
    timeframe: 'Timeframe: Self-care + 48 Hr Observation',
    facilityName: '📍 Home Care / Village ASHA Health Kiosk — 0.8 km away',
    summaryHindi: 'हल्के पेट दर्द और उल्टी के लक्षण। ORS घोल और पर्याप्त पानी पीने की सलाह।',
    summaryEnglish: 'Mild acute gastritis with fluid loss. Recommended oral rehydration salts (ORS) and home fluid monitoring.'
  },
  {
    id: 3,
    title: '🔴 Acute Chest Compression',
    tag: 'Emergency',
    facility: 'Rampur CHC (108 SOS)',
    time: '22 July',
    period: 'month',
    transcript: '"सीने में बहुत ज्यादा भारीपन और सांस लेने में घबरावत हो रही है, बहुत पसीना आ रहा है।"',
    symptoms: ['Acute Chest Tightness', 'Dyspnea / Breathlessness', 'Excessive Diaphoresis (Sweating)'],
    urgencyText: '🚨 EMERGENCY (आपातकालीन 108 सहायता)',
    urgencyBg: 'bg-rose-600',
    timeframe: 'Timeframe: IMMEDIATE (Now)',
    facilityName: '📍 Rampur Community Health Centre (CHC Emergency Hub) — 7.8 km away',
    summaryHindi: 'मरीज को अचानक सीने में तेज दबाव और सांस की तकलीफ। आपातकालीन एम्बुलेंस 108 द्वारा CHC रेफरल।',
    summaryEnglish: 'Acute coronary syndrome red-flags detected. Immediate referral via 108 Ambulance to Rampur CHC Emergency.'
  }
];

const TriagePortal = () => {
  const { user } = useAuth();
  const { isOnline, enqueue } = useOfflineQueue();
  const navigate = useNavigate();

  const [activeSessionIdx, setActiveSessionIdx] = useState(0);

  // Patient Info State
  const [patientData, setPatientData] = useState({
    patientName: user?.name || 'Ramesh Kumar',
    village: user?.village || 'Sonapur, Block B',
    pincode: user?.pincode || '721101',
    phone: user?.phone || '+91 98765 43210',
    abhaId: user?.abhaId || '91-4521-8890-1234'
  });

  const [selectedSymptoms, setSelectedSymptoms] = useState(PATIENT_HISTORY[0].symptoms);
  const [audioTranscript, setAudioTranscript] = useState(PATIENT_HISTORY[0].transcript);
  const [triageResult, setTriageResult] = useState(PATIENT_HISTORY[0]);
  const [loading, setLoading] = useState(false);

  const handleSelectHistorySession = (idx) => {
    setActiveSessionIdx(idx);
    const session = PATIENT_HISTORY[idx];
    setSelectedSymptoms(session.symptoms);
    setAudioTranscript(session.transcript);
    setTriageResult(session);
  };

  const handleStartNewSession = () => {
    setActiveSessionIdx(null);
    setSelectedSymptoms([]);
    setAudioTranscript('');
    setTriageResult(null);
  };

  const handleAudioComplete = (audioData) => {
    setAudioTranscript(audioData.transcript);
    if (audioData.symptoms && audioData.symptoms.length > 0) {
      setSelectedSymptoms(prev => Array.from(new Set([...prev, ...audioData.symptoms])));
    }
  };

  const handleRunTriage = async (e) => {
    e.preventDefault();
    setLoading(true);

    const assessmentPayload = {
      ...patientData,
      symptoms: selectedSymptoms,
      transcript: audioTranscript
    };

    const res = await triageService.submitAssessment(assessmentPayload);
    setLoading(false);

    if (res.success) {
      setTriageResult({
        title: '🔴 Live Consultation',
        urgencyText: res.triageResult.badge,
        urgencyBg: res.triageResult.level === 'HIGH' ? 'bg-rose-600' : 'bg-amber-500',
        timeframe: res.triageResult.level === 'HIGH' ? 'Immediate' : 'Within 24-48 Hours',
        facilityName: '📍 Sonapur Primary Health Centre (PHC) — 2.4 km away',
        summaryHindi: 'मरीज को लक्षणों के आधार पर प्राथमिक स्वास्थ्य केंद्र में परामर्श की सलाह दी गई है।',
        summaryEnglish: 'Patient reported symptoms matching urgent evaluation protocol. Recommended visit to nearby PHC.'
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Patient Profile Header Card */}
      <div className="bg-white rounded-3xl border-2 border-[#BFDCD2] p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#BFDCD2]/60 text-[#164E4A] flex items-center justify-center font-extrabold text-xl">
            👤
          </div>
          <div>
            <h2 className="text-lg font-black text-[#164E4A]">
              {patientData.patientName} (Patient Health Portal)
            </h2>
            <p className="text-xs text-[#26302E]">
              Village: {patientData.village} | ABHA ID: <strong>{patientData.abhaId}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold px-3 py-1 rounded-full">
            ● ABDM Sync Active
          </span>
          {!isOnline && (
            <span className="bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <CloudOff className="w-3.5 h-3.5" />
              <span>Offline Cache</span>
            </span>
          )}
        </div>
      </div>

      {/* 2-Column ChatGPT / Gemini Style Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* LEFT SIDEBAR: CHATGPT STYLE CONSULTATION HISTORY */}
        <aside className="lg:col-span-1 bg-white rounded-3xl border-2 border-[#BFDCD2] p-4 shadow-xs space-y-4 sticky top-24">
          <button
            onClick={handleStartNewSession}
            className="w-full py-3 px-4 bg-[#F8FAF7] hover:bg-[#BFDCD2]/40 border-2 border-dashed border-[#2E8B83] text-[#164E4A] rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            <Plus className="w-4 h-4 text-[#2E8B83]" />
            <span>New Voice Triage</span>
          </button>

          <div className="flex items-center justify-between px-1 text-xs font-extrabold text-[#164E4A]">
            <span className="flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-[#2E8B83]" />
              <span>Consultation History</span>
            </span>
            <span className="bg-[#BFDCD2] px-2 py-0.5 rounded-full text-[10px]">
              {PATIENT_HISTORY.length}
            </span>
          </div>

          <div className="space-y-4 text-xs">
            {/* TODAY */}
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#2E8B83] px-1 block mb-1.5">
                Today
              </span>
              <div
                onClick={() => handleSelectHistorySession(0)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  activeSessionIdx === 0 
                    ? 'bg-[#BFDCD2]/50 border-[#2E8B83] font-bold shadow-xs' 
                    : 'border-transparent hover:bg-[#F8FAF7]'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="truncate font-bold text-[#164E4A]">🔴 Fever & Dry Cough</span>
                  <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-extrabold">Urgent</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Sonapur PHC</span>
                  <span>10:45 AM</span>
                </div>
              </div>
            </div>

            {/* PREVIOUS 7 DAYS */}
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#2E8B83] px-1 block mb-1.5">
                Previous 7 Days
              </span>
              <div className="space-y-1">
                <div
                  onClick={() => handleSelectHistorySession(1)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    activeSessionIdx === 1 
                      ? 'bg-[#BFDCD2]/50 border-[#2E8B83] font-bold shadow-xs' 
                      : 'border-transparent hover:bg-[#F8FAF7]'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="truncate font-bold text-[#164E4A]">🟢 Knee Joint Swelling</span>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-extrabold">Routine</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Haripur Sub-Centre</span>
                    <span>3 days ago</span>
                  </div>
                </div>

                <div
                  onClick={() => handleSelectHistorySession(2)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    activeSessionIdx === 2 
                      ? 'bg-[#BFDCD2]/50 border-[#2E8B83] font-bold shadow-xs' 
                      : 'border-transparent hover:bg-[#F8FAF7]'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="truncate font-bold text-[#164E4A]">🟡 Stomach Cramps</span>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-extrabold">Routine</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Home ORS</span>
                    <span>5 days ago</span>
                  </div>
                </div>
              </div>
            </div>

            {/* LAST MONTH */}
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#2E8B83] px-1 block mb-1.5">
                Last Month
              </span>
              <div
                onClick={() => handleSelectHistorySession(3)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  activeSessionIdx === 3 
                    ? 'bg-[#BFDCD2]/50 border-[#2E8B83] font-bold shadow-xs' 
                    : 'border-transparent hover:bg-[#F8FAF7]'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="truncate font-bold text-[#164E4A]">🔴 Acute Chest Tightness</span>
                  <span className="text-[9px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-extrabold">Emergency</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Rampur CHC</span>
                  <span>22 July</span>
                </div>
              </div>
            </div>

          </div>
        </aside>

        {/* RIGHT MAIN AREA: ACTIVE VOICE TRIAGE SESSION */}
        <section className="lg:col-span-3 space-y-6">
          
          {/* Voice Capture & Input */}
          <div className="bg-white rounded-3xl border-2 border-[#BFDCD2] p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex justify-between items-center border-b border-[#BFDCD2] pb-3">
              <span className="text-xs font-black text-[#2E8B83]">
                {activeSessionIdx !== null ? `Consultation Record #${activeSessionIdx + 1}` : 'Active Session: Live Voice Triage'}
              </span>
              <span className="text-[11px] font-bold bg-[#F8FAF7] text-[#164E4A] px-3 py-1 rounded-full border border-[#BFDCD2]">
                Audio Language: Hindi (हिंदी)
              </span>
            </div>

            <AudioRecorder
              onRecordingComplete={handleAudioComplete}
              initialTranscript={audioTranscript}
            />

            {/* Extracted Clinical Entity Chips */}
            <div className="bg-[#F8FAF7] p-4 rounded-2xl border border-[#BFDCD2] space-y-2">
              <span className="text-[11px] font-black uppercase text-[#164E4A] block">
                Extracted Clinical Entities:
              </span>
              <div className="flex flex-wrap gap-2">
                {selectedSymptoms.map((sym, idx) => (
                  <span key={idx} className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold px-3 py-1 rounded-full">
                    ✓ {sym}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={handleRunTriage}
              disabled={loading}
              className="w-full py-4 bg-[#2E8B83] hover:bg-[#164E4A] text-white font-extrabold text-xs rounded-2xl shadow-md transition-all active:scale-98"
            >
              {loading ? 'Evaluating Safety Logic...' : 'Run Safety Triage & Generate Doctor Summary →'}
            </button>
          </div>

          {/* Triage Output Card */}
          {triageResult && (
            <div className="bg-[#FEFCE8] rounded-3xl border-2 border-[#E7D88A] p-6 sm:p-8 shadow-md space-y-4 animate-in fade-in">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <span className="bg-amber-500 text-white font-black text-xs px-4 py-1.5 rounded-full shadow-xs">
                  {triageResult.urgencyText || '⚠️ URGENT (त्वरित देखभाल)'}
                </span>
                <span className="text-xs font-bold text-[#164E4A]">
                  {triageResult.timeframe || 'Timeframe: Within 24-48 Hours'}
                </span>
              </div>

              <div>
                <strong className="text-xs font-black uppercase text-[#164E4A] block mb-1">Recommended Care Facility:</strong>
                <div className="text-base font-black text-[#164E4A]">
                  {triageResult.facilityName}
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#BFDCD2] space-y-2 text-xs leading-relaxed">
                <strong className="text-[#164E4A]">Doctor-Ready Clinical Summary (Hindi / English):</strong>
                <p className="text-[#26302E] font-medium">{triageResult.summaryHindi}</p>
                <p className="text-slate-600 italic">{triageResult.summaryEnglish}</p>
              </div>

              <div className="flex gap-3 pt-2 flex-wrap">
                <button
                  onClick={() => navigate('/clinics')}
                  className="flex-1 py-3 px-4 bg-[#2E8B83] hover:bg-[#164E4A] text-white text-xs font-black rounded-xl shadow-xs text-center"
                >
                  🗺️ View GPS Route to PHC
                </button>
                <button
                  onClick={() => alert('Doctor-Ready PDF Dossier downloaded successfully!')}
                  className="py-3 px-5 bg-white border-2 border-[#BFDCD2] text-[#164E4A] text-xs font-black rounded-xl"
                >
                  📄 Download PDF Dossier
                </button>
              </div>
            </div>
          )}

        </section>

      </div>

    </div>
  );
};

export default TriagePortal;
