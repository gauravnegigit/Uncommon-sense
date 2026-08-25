import React, { useState, useEffect } from 'react';
import { 
  Video, VideoOff, Mic, MicOff, PhoneOff, 
  MessageSquare, ShieldCheck, Wifi, FileText, 
  User, CheckCircle2, AlertTriangle, Send 
} from 'lucide-react';
import consultationService from '../services/consultationService';

const TeleconsultationRoom = ({ patient, onClose, onCompleteConsultation }) => {
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isLowBandwidthMode, setIsLowBandwidthMode] = useState(false);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { sender: 'System', text: 'Secure Telehealth encrypted connection established.', time: 'Just now' },
    { sender: 'Patient', text: 'Namaste Doctor, I have had a high fever for 3 days and severe body ache.', time: '1m ago' }
  ]);
  const [newChatText, setNewChatText] = useState('');
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCallDuration(p => p + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newChatText.trim()) return;
    setChatMessages(prev => [
      ...prev,
      { sender: 'Doctor', text: newChatText, time: 'Just now' }
    ]);
    setNewChatText('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slatecalm-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="bg-white w-full max-w-5xl h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-slatecalm-200">
        
        {/* Top Teleconsultation Header */}
        <div className="bg-slatecalm-900 text-white px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <h3 className="font-bold text-sm flex items-center gap-2">
                Teleconsultation: {patient?.patientName || 'Rural Citizen'}
                <span className="text-xs bg-slatecalm-800 text-slatecalm-300 px-2 py-0.5 rounded-full border border-slatecalm-700">
                  {patient?.village || 'Sonapur PHC'}
                </span>
              </h3>
              <p className="text-[11px] text-slatecalm-400">
                Call Duration: {formatDuration(callDuration)} • e-Sanjeevani Telehealth Protocol
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsLowBandwidthMode(!isLowBandwidthMode)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                isLowBandwidthMode ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slatecalm-800 text-slatecalm-300 border border-slatecalm-700'
              }`}
            >
              <Wifi className="w-3.5 h-3.5" />
              <span>{isLowBandwidthMode ? '2G/Low Data Mode (Active)' : 'High Quality'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slatecalm-400 hover:text-white rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Video & Consultation Split View */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 overflow-hidden bg-slatecalm-950">
          
          {/* Main Video Stream Arena (2 columns on large screen) */}
          <div className="lg:col-span-2 relative p-4 flex flex-col justify-between bg-slatecalm-950">
            {/* Patient Stream Box */}
            <div className="relative w-full h-[65%] rounded-2xl overflow-hidden bg-slatecalm-900 border border-slatecalm-800 flex items-center justify-center">
              {isVideoOn ? (
                <div className="relative w-full h-full bg-gradient-to-t from-slatecalm-950/80 via-transparent to-transparent flex items-center justify-center">
                  {/* Simulated video frame */}
                  <div className="w-32 h-32 rounded-full bg-tealmed-900/40 border-4 border-tealmed-500/30 flex items-center justify-center text-white">
                    <User className="w-16 h-16 text-tealmed-300" />
                  </div>
                  <div className="absolute bottom-4 left-4 text-white text-xs bg-slatecalm-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slatecalm-700 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>{patient?.patientName} (Patient Stream)</span>
                  </div>
                </div>
              ) : (
                <div className="text-center text-slatecalm-400">
                  <VideoOff className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Audio-Only Bandwidth Saving Mode</p>
                </div>
              )}

              {/* Floating Self Doctor Video Preview */}
              <div className="absolute top-4 right-4 w-36 h-28 rounded-xl overflow-hidden bg-slatecalm-800 border-2 border-tealmed-500/50 shadow-xl flex items-center justify-center">
                <div className="text-center text-xs text-slatecalm-300">
                  <div className="w-10 h-10 rounded-full bg-tealmed-700/60 mx-auto mb-1 flex items-center justify-center text-white">
                    👨‍⚕️
                  </div>
                  <span>Dr. Ananya (You)</span>
                </div>
              </div>
            </div>

            {/* Quick Vitals Bar for Doctor's reference during call */}
            <div className="my-2 p-3 bg-slatecalm-900/90 rounded-xl border border-slatecalm-800 text-xs text-white grid grid-cols-4 gap-2 text-center">
              <div>
                <span className="text-slatecalm-400 block text-[10px]">BP</span>
                <span className="font-bold text-tealmed-400">{patient?.vitals?.bpSystolic || 120}/{patient?.vitals?.bpDiastolic || 80}</span>
              </div>
              <div>
                <span className="text-slatecalm-400 block text-[10px]">SpO2</span>
                <span className={`font-bold ${(patient?.vitals?.spO2 || 97) < 94 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {patient?.vitals?.spO2 || 97}%
                </span>
              </div>
              <div>
                <span className="text-slatecalm-400 block text-[10px]">Heart Rate</span>
                <span className="font-bold text-sky-400">{patient?.vitals?.heartRate || 78} bpm</span>
              </div>
              <div>
                <span className="text-slatecalm-400 block text-[10px]">Temp</span>
                <span className="font-bold text-amber-400">{patient?.vitals?.temp || 98.6}°F</span>
              </div>
            </div>

            {/* Call Control Toolbar */}
            <div className="flex items-center justify-center gap-4 py-2">
              <button
                onClick={() => setIsAudioOn(!isAudioOn)}
                className={`p-3.5 rounded-full shadow-lg transition-colors ${
                  isAudioOn ? 'bg-slatecalm-800 text-white hover:bg-slatecalm-700' : 'bg-rose-600 text-white'
                }`}
                title="Toggle Mic"
              >
                {isAudioOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>

              <button
                onClick={() => setIsVideoOn(!isVideoOn)}
                className={`p-3.5 rounded-full shadow-lg transition-colors ${
                  isVideoOn ? 'bg-slatecalm-800 text-white hover:bg-slatecalm-700' : 'bg-rose-600 text-white'
                }`}
                title="Toggle Video"
              >
                {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>

              <button
                onClick={() => {
                  onCompleteConsultation(doctorNotes);
                  onClose();
                }}
                className="px-6 py-3.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs rounded-full flex items-center gap-2 shadow-lg transition-all"
              >
                <PhoneOff className="w-4 h-4" />
                <span>End & Finalize Rx</span>
              </button>
            </div>
          </div>

          {/* Right Side: Doctor Notes & Chat */}
          <div className="bg-white flex flex-col border-l border-slatecalm-200">
            {/* Tab: Doctor Clinical Summary */}
            <div className="p-4 border-b border-slatecalm-200 bg-slatecalm-50">
              <h4 className="text-xs font-bold text-slatecalm-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-tealmed-600" />
                <span>Clinical Notes & Prescription</span>
              </h4>
            </div>

            <div className="p-4 flex-1 flex flex-col gap-3 overflow-y-auto">
              <div>
                <label className="text-xs font-semibold text-slatecalm-700 block mb-1">
                  Diagnosis / Clinical Observation:
                </label>
                <textarea
                  rows={4}
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  placeholder="e.g. Acute Upper Respiratory Infection. Advised Paracetamol 650mg TDS x 3 days and warm saline gargle..."
                  className="w-full bg-slatecalm-50 border border-slatecalm-200 rounded-xl p-2.5 text-xs text-slatecalm-800 focus:outline-none focus:border-tealmed-500 resize-none"
                />
              </div>

              {/* Patient reported symptoms overview */}
              <div className="p-3 bg-tealmed-50/50 rounded-xl border border-tealmed-100 text-xs">
                <span className="font-bold text-tealmed-900 block mb-1">Reported Symptoms:</span>
                <div className="flex flex-wrap gap-1">
                  {patient?.symptoms?.map((s, idx) => (
                    <span key={idx} className="bg-white text-tealmed-800 px-2 py-0.5 rounded border border-tealmed-200 text-[11px]">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Live Chat with ASHA/Patient */}
              <div className="flex-1 flex flex-col justify-end mt-2">
                <span className="text-[11px] font-bold text-slatecalm-500 mb-1">Session Transcript / Chat</span>
                <div className="bg-slatecalm-50 rounded-xl border border-slatecalm-200 p-2.5 h-32 overflow-y-auto space-y-2 text-xs">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`p-1.5 rounded-lg ${msg.sender === 'Doctor' ? 'bg-tealmed-100 text-tealmed-900 ml-4' : 'bg-white text-slatecalm-800 mr-4 border border-slatecalm-200'}`}>
                      <span className="font-bold text-[10px] block opacity-75">{msg.sender}</span>
                      <span>{msg.text}</span>
                    </div>
                  ))}
                </div>
                
                <form onSubmit={handleSendMessage} className="mt-2 flex gap-1.5">
                  <input
                    type="text"
                    value={newChatText}
                    onChange={(e) => setNewChatText(e.target.value)}
                    placeholder="Type advice or message..."
                    className="flex-1 bg-white border border-slatecalm-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-tealmed-500"
                  />
                  <button type="submit" className="p-2 bg-tealmed-600 text-white rounded-lg">
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default TeleconsultationRoom;

