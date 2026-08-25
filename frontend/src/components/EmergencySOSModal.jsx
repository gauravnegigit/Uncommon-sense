import React, { useState } from 'react';
import { 
  ShieldAlert, Phone, Ambulance, MapPin, 
  CheckCircle2, Clock, AlertTriangle, X, Radio 
} from 'lucide-react';
import clinicService from '../services/clinicService';

const EmergencySOSModal = ({ onClose }) => {
  const [isDispatched, setIsDispatched] = useState(false);
  const [dispatchData, setDispatchData] = useState(null);
  const [loading, setLoading] = useState(false);

  const emergencyContacts = [
    { name: 'National Ambulance Service', number: '108', desc: '24x7 Critical Medical Emergency', icon: '🚑' },
    { name: 'National Health Advice Helpline', number: '104', desc: 'Free Medical Guidance & Tele-doctor', icon: '📞' },
    { name: 'Janani Shishu Suraksha (Maternal)', number: '102', desc: 'Free Delivery & Infant Transport', icon: '🤰' },
    { name: 'Local Gram Panchayat Police / SOS', number: '112', desc: 'All-in-one Emergency First Responder', icon: '🛡️' }
  ];

  const handleInstantDispatch = async () => {
    setLoading(true);
    const res = await clinicService.dispatchEmergencyAmbulance({
      urgency: 'CRITICAL_108',
      location: 'Current GPS Village Coordinates',
      timestamp: new Date().toISOString()
    });
    setLoading(false);
    setDispatchData(res);
    setIsDispatched(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slatecalm-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-rose-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-red-800 text-white p-6 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full bg-black/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center mx-auto mb-3 beacon-pulse">
            <ShieldAlert className="w-8 h-8 text-white" />
          </div>
          
          <h2 className="text-xl font-black tracking-tight">108 Rural Emergency SOS</h2>
          <p className="text-xs text-rose-100 mt-1 max-w-xs mx-auto">
            Direct high-priority dispatch to nearest Primary Health Centre & GPS-tracked Ambulance
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {!isDispatched ? (
            <>
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-900 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Life-Threatening Emergency Protocol</p>
                  <p className="mt-0.5 text-rose-800/90">
                    Pressing the button below will immediately alert the district 108 emergency command center with your live GPS location.
                  </p>
                </div>
              </div>

              {/* Huge One-Touch Dispatch Button */}
              <button
                onClick={handleInstantDispatch}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-extrabold text-base rounded-2xl shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-75"
              >
                <Ambulance className="w-6 h-6 animate-bounce" />
                <span>{loading ? 'Transmitting GPS Alert...' : 'DISPATCH 108 AMBULANCE NOW'}</span>
              </button>

              {/* Direct Toll-Free Helplines */}
              <div>
                <h4 className="text-xs font-bold text-slatecalm-600 uppercase tracking-wider mb-2.5">
                  Direct Toll-Free Emergency Hotlines:
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {emergencyContacts.map((contact, i) => (
                    <a
                      key={i}
                      href={`tel:${contact.number}`}
                      className="p-3 rounded-xl border border-slatecalm-200 hover:border-tealmed-400 bg-slatecalm-50/60 hover:bg-tealmed-50/40 transition-all flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-lg">{contact.icon}</span>
                        <span className="font-extrabold text-sm text-tealmed-800 bg-white px-2 py-0.5 rounded border border-slatecalm-200">
                          {contact.number}
                        </span>
                      </div>
                      <p className="font-bold text-xs text-slatecalm-800 leading-tight">{contact.name}</p>
                      <p className="text-[10px] text-slatecalm-500 mt-0.5 leading-tight">{contact.desc}</p>
                    </a>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Enhanced Dispatch Confirmation & Live Radar Tracking */
            <div className="space-y-4 text-center py-2 animate-in fade-in">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="font-extrabold text-slatecalm-900 text-lg">108 Ambulance En Route!</h3>
                <p className="text-xs text-slatecalm-600 mt-0.5">
                  Dispatch ID: <span className="font-mono font-bold text-tealmed-700">{dispatchData?.dispatchId || 'AMB-1082'}</span>
                </p>
              </div>

              {/* Clickable / Tappable Interactive Live GPS Telemetry Card */}
              <div 
                className="bg-gradient-to-br from-slatecalm-900 to-slatecalm-950 text-white rounded-2xl p-4 border border-slatecalm-800 text-left space-y-3 shadow-lg relative overflow-hidden group cursor-pointer hover:border-tealmed-500 transition-all"
                title="Tap for full GPS tracking details"
              >
                {/* Live Radar Pulse Effect */}
                <div className="flex items-center justify-between pb-2 border-b border-slatecalm-800">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                    </span>
                    <span className="text-xs font-bold text-tealmed-300 uppercase tracking-wider">
                      Live GPS Ambulance Radar
                    </span>
                  </div>
                  <span className="text-[10px] bg-slatecalm-800 text-slatecalm-300 px-2 py-0.5 rounded border border-slatecalm-700">
                    Speed: 52 km/h
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slatecalm-400 block text-[10px]">Vehicle Assigned:</span>
                    <span className="font-bold text-white text-sm">{dispatchData?.ambulanceNumber || 'WB-34-AMB-1082'}</span>
                  </div>
                  <div>
                    <span className="text-slatecalm-400 block text-[10px]">Estimated Arrival (ETA):</span>
                    <span className="font-extrabold text-rose-400 text-sm flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {dispatchData?.etaMinutes || 14} Minutes
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slatecalm-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slatecalm-400 block text-[10px]">Driver & Paramedic:</span>
                    <span className="font-bold text-slatecalm-200">{dispatchData?.driverName || 'Rabin Ghosh'}</span>
                  </div>
                  <a
                    href={`tel:${dispatchData?.driverPhone || '+919732100108'}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Driver</span>
                  </a>
                </div>

                {/* Animated Route Progress Bar */}
                <div className="w-full bg-slatecalm-800 rounded-full h-1.5 overflow-hidden mt-2">
                  <div className="bg-gradient-to-r from-tealmed-500 to-rose-500 h-1.5 rounded-full w-2/3 animate-pulse"></div>
                </div>
                <div className="flex justify-between text-[10px] text-slatecalm-400">
                  <span>Base: {dispatchData?.nearestFacility || 'Sonapur PHC'}</span>
                  <span className="text-tealmed-400">Heading towards your GPS point</span>
                </div>
              </div>

              {/* Crucial First-Aid Guidance While Waiting */}
              <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200 text-left text-xs text-amber-950 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5 text-amber-900">
                  <span>💡</span>
                  <span>What to do while waiting for the 108 Ambulance:</span>
                </p>
                <ul className="space-y-1 text-[11px] text-amber-900/90 list-disc list-inside">
                  <li>Keep the patient in a comfortable, well-ventilated position.</li>
                  <li>Loosen tight clothes and avoid giving heavy solid food or cold water.</li>
                  <li>Keep patient's ABHA ID / Aadhaar card ready for rapid PHC admission.</li>
                  <li>Send a family member to the village road corner with a flashlight/torch.</li>
                </ul>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <a
                  href={`tel:${dispatchData?.driverPhone || '108'}`}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-soft transition-colors flex items-center justify-center gap-1.5"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call Emergency 108</span>
                </a>

                <button
                  onClick={onClose}
                  className="px-5 py-3 bg-slatecalm-100 hover:bg-slatecalm-200 text-slatecalm-700 font-bold text-xs rounded-xl transition-colors"
                >
                  Back to Portal
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default EmergencySOSModal;

