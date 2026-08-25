import React, { useState } from 'react';
import { 
  FileText, Download, Printer, QrCode, 
  Clock, ShieldCheck, Sun, Moon, Sunrise, Volume2 
} from 'lucide-react';

const PrescriptionViewer = ({ prescription, onClose }) => {
  const [isPlayingAudioRx, setIsPlayingAudioRx] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleAudioExplain = () => {
    setIsPlayingAudioRx(true);
    if ('speechSynthesis' in window) {
      const text = `Prescription for ${prescription.patientName}. Diagnosis: ${prescription.diagnosis}. Please take ${prescription.medicines.map(m => `${m.name}, ${m.dosage}`).join('. ')}. ${prescription.dietAdvice}`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.onend = () => setIsPlayingAudioRx(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setIsPlayingAudioRx(false), 3000);
    }
  };

  if (!prescription) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slatecalm-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
      <div className="bg-white w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl border border-slatecalm-200 flex flex-col my-auto">
        
        {/* Modal Action Bar */}
        <div className="p-4 bg-slatecalm-50 border-b border-slatecalm-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-tealmed-100 text-tealmed-800 flex items-center justify-center font-bold text-xs">
              Rx
            </div>
            <div>
              <h3 className="font-bold text-slatecalm-900 text-sm">Official Digital e-Prescription</h3>
              <p className="text-[11px] text-slatecalm-500">ID: {prescription.id} • Verified by Telehealth Doctor</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAudioExplain}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                isPlayingAudioRx ? 'bg-tealmed-600 text-white border-tealmed-600 animate-pulse' : 'bg-white text-tealmed-700 border-tealmed-300 hover:bg-tealmed-50'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{isPlayingAudioRx ? 'Reading Aloud...' : 'Listen in Local Audio'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="p-2 text-slatecalm-600 hover:text-slatecalm-900 bg-white border border-slatecalm-200 rounded-lg text-xs"
              title="Print Prescription"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slatecalm-400 hover:text-slatecalm-700 rounded-lg text-sm"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable Prescription Body */}
        <div className="p-6 sm:p-8 space-y-6 print:p-0">
          
          {/* PHC & Doctor Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b-2 border-tealmed-600">
            <div>
              <span className="text-[11px] font-bold text-tealmed-700 uppercase tracking-widest block">
                Primary Healthcare Mission • Telehealth Outpost
              </span>
              <h2 className="text-xl font-black text-slatecalm-900">{prescription.facility || 'Sonapur Primary Health Centre'}</h2>
              <p className="text-xs text-slatecalm-600 mt-0.5">Government Health & Family Welfare Department</p>
            </div>

            <div className="text-right">
              <h4 className="font-extrabold text-sm text-slatecalm-900">{prescription.doctorName || 'Dr. Ananya Roy, MD'}</h4>
              <p className="text-xs text-tealmed-700 font-semibold">{prescription.doctorReg || 'Reg: MCI-88234-WB'}</p>
              <p className="text-xs text-slatecalm-500 mt-1">Date: {prescription.date || new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {/* Patient Details Bar */}
          <div className="bg-slatecalm-50 p-3.5 rounded-2xl border border-slatecalm-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slatecalm-400 block text-[10px]">Patient Name:</span>
              <span className="font-bold text-slatecalm-800">{prescription.patientName}</span>
            </div>
            <div>
              <span className="text-slatecalm-400 block text-[10px]">Age / Gender:</span>
              <span className="font-bold text-slatecalm-800">{prescription.patientAge || '48'} Yrs / {prescription.patientGender || 'Adult'}</span>
            </div>
            <div>
              <span className="text-slatecalm-400 block text-[10px]">Clinical Vitals:</span>
              <span className="font-bold text-tealmed-800">{prescription.vitalsRecorded || 'BP: 120/80 | SpO2: 98%'}</span>
            </div>
            <div>
              <span className="text-slatecalm-400 block text-[10px]">Prescription ID:</span>
              <span className="font-mono font-bold text-slatecalm-800">{prescription.id}</span>
            </div>
          </div>

          {/* Diagnosis */}
          <div className="p-3 bg-tealmed-50/60 rounded-xl border border-tealmed-100 text-xs">
            <span className="font-bold text-tealmed-900 block mb-0.5">Provisional Diagnosis:</span>
            <span className="text-tealmed-800 font-medium">{prescription.diagnosis || 'Acute Upper Respiratory Symptom Complex'}</span>
          </div>

          {/* Prescribed Medicines with Visual Dosage Timing Icons */}
          <div>
            <h4 className="font-bold text-slatecalm-800 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-tealmed-600" />
              <span>Prescribed Medicines & Dosage Instructions (दवाई की खुराक)</span>
            </h4>

            <div className="space-y-3">
              {prescription.medicines?.map((med, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl border border-slatecalm-200 bg-white hover:border-tealmed-300 transition-all flex flex-wrap items-center justify-between gap-3 shadow-xs"
                >
                  <div className="space-y-1 max-w-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-tealmed-100 text-tealmed-800 font-bold text-[11px] flex items-center justify-center">
                        {index + 1}
                      </span>
                      <h5 className="font-extrabold text-xs sm:text-sm text-slatecalm-900">{med.name}</h5>
                    </div>
                    <p className="text-xs text-slatecalm-600 font-medium pl-7">{med.dosage} • Duration: <strong>{med.duration}</strong></p>
                    <p className="text-[11px] text-tealmed-700 italic pl-7">{med.instructions}</p>
                  </div>

                  {/* Visual Dosage Icons for Rural Low-Literacy Comprehension */}
                  <div className="flex items-center gap-2 bg-slatecalm-50 p-2 rounded-xl border border-slatecalm-200 text-xs">
                    <div className={`flex flex-col items-center p-1 rounded-lg ${med.timingIcons?.includes('morning') ? 'bg-amber-100 text-amber-900 font-bold' : 'opacity-30 text-slatecalm-400'}`}>
                      <Sunrise className="w-4 h-4" />
                      <span className="text-[9px] mt-0.5">Morning</span>
                    </div>
                    <div className={`flex flex-col items-center p-1 rounded-lg ${med.timingIcons?.includes('midday') || med.timingIcons?.includes('afternoon') ? 'bg-orange-100 text-orange-900 font-bold' : 'opacity-30 text-slatecalm-400'}`}>
                      <Sun className="w-4 h-4" />
                      <span className="text-[9px] mt-0.5">Afternoon</span>
                    </div>
                    <div className={`flex flex-col items-center p-1 rounded-lg ${med.timingIcons?.includes('night') ? 'bg-indigo-100 text-indigo-900 font-bold' : 'opacity-30 text-slatecalm-400'}`}>
                      <Moon className="w-4 h-4" />
                      <span className="text-[9px] mt-0.5">Night</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Advice & Followup */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slatecalm-50 border border-slatecalm-200">
              <span className="font-bold text-slatecalm-700 block mb-1">Diet & Home Care:</span>
              <p className="text-slatecalm-600">{prescription.dietAdvice || 'Drink plenty of boiled water, warm fluids, and rest.'}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slatecalm-50 border border-slatecalm-200">
              <span className="font-bold text-slatecalm-700 block mb-1">Follow-up Schedule:</span>
              <p className="text-slatecalm-600">{prescription.followUpDate || 'After 5 days at local Sub-Centre'}</p>
            </div>
          </div>

          {/* Footer Security Verification & QR Code */}
          <div className="pt-4 border-t border-slatecalm-200 flex flex-wrap items-center justify-between gap-4 text-xs text-slatecalm-500">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slatecalm-100 rounded-lg flex items-center justify-center border border-slatecalm-300">
                <QrCode className="w-8 h-8 text-slatecalm-700" />
              </div>
              <div>
                <p className="font-bold text-slatecalm-700">Digital Telehealth Signature</p>
                <p className="text-[10px]">Scan QR code at any government Jan Aushadhi Kendra</p>
              </div>
            </div>

            <div className="text-right text-[11px]">
              <p className="font-semibold text-emerald-700 flex items-center justify-end gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                ABDM Verified Medical Record
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default PrescriptionViewer;

