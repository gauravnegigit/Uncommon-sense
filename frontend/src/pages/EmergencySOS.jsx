import React, { useState } from 'react';
import { 
  ShieldAlert, Phone, Ambulance, MapPin, 
  CheckCircle2, Clock, AlertTriangle, Radio, 
  HeartPulse, Users, ArrowRight 
} from 'lucide-react';
import clinicService from '../services/clinicService';

const EmergencySOS = () => {
  const [isDispatched, setIsDispatched] = useState(false);
  const [dispatchData, setDispatchData] = useState(null);
  const [loading, setLoading] = useState(false);

  const emergencyHelplines = [
    { title: '108 National Ambulance', num: '108', desc: 'Critical life-threatening emergencies, road accidents, heart attacks', color: 'rose' },
    { title: '104 Health Information', num: '104', desc: '24x7 Doctor telephone advice, poison consultation, mental health', color: 'teal' },
    { title: '102 Janani Shishu Van', num: '102', desc: 'Free rural transport for pregnant women & sick infants', color: 'emerald' },
    { title: '112 Unified Emergency', num: '112', desc: 'Police, Fire, and First Responder disaster coordination', color: 'blue' }
  ];

  const handleInstantDispatch = async () => {
    setLoading(true);
    const res = await clinicService.dispatchEmergencyAmbulance({
      urgency: 'CRITICAL_108',
      location: 'Village GPS Geo-beacon',
      timestamp: new Date().toISOString()
    });
    setLoading(false);
    setDispatchData(res);
    setIsDispatched(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Emergency Header Beacon */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-rose-100 border-4 border-rose-300 text-rose-600 flex items-center justify-center mx-auto beacon-pulse">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <div>
          <span className="text-xs font-black uppercase tracking-widest text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
            High Priority Emergency Dispatch
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slatecalm-900 mt-2">
            108 Rural Emergency SOS Hotline
          </h1>
          <p className="text-xs sm:text-sm text-slatecalm-500 max-w-lg mx-auto mt-1">
            Transmits instant GPS coordinates to the district medical control center and dispatches nearest ambulance
          </p>
        </div>
      </div>

      {/* Main Dispatch Action Area */}
      <div className="bg-white rounded-3xl border-2 border-rose-200 p-6 sm:p-10 shadow-soft-lg text-center space-y-6">
        {!isDispatched ? (
          <>
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-xs text-rose-950 flex items-center gap-3 text-left">
              <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
              <div>
                <p className="font-bold">Are you experiencing severe chest pain, sudden paralysis, or heavy bleeding?</p>
                <p className="text-rose-800 mt-0.5">Press the button below to initiate high-speed ambulance routing with oxygen support.</p>
              </div>
            </div>

            <button
              onClick={handleInstantDispatch}
              disabled={loading}
              className="w-full max-w-md mx-auto py-5 bg-gradient-to-r from-rose-600 via-rose-700 to-red-700 hover:from-rose-700 hover:to-red-800 active:scale-95 text-white font-black text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-75"
            >
              <Ambulance className="w-7 h-7 animate-bounce" />
              <span>{loading ? 'TRANSMITTING GPS BEACON...' : 'DISPATCH 108 AMBULANCE NOW'}</span>
            </button>

            <p className="text-xs text-slatecalm-400">
              Or call toll-free directly: <a href="tel:108" className="font-bold text-rose-600 underline text-sm">108</a>
            </p>
          </>
        ) : (
          <div className="space-y-5 animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-slatecalm-900">108 Ambulance En Route!</h2>
              <p className="text-xs text-slatecalm-500 mt-0.5">Dispatch Reference: <span className="font-mono font-bold text-tealmed-700">{dispatchData?.dispatchId || 'AMB-1082'}</span></p>
            </div>

            {/* Interactive Live Radar Telemetry Box */}
            <div className="bg-slatecalm-950 text-white rounded-3xl p-6 border border-slatecalm-800 text-left space-y-4 max-w-lg mx-auto shadow-xl">
              <div className="flex justify-between items-center pb-2 border-b border-slatecalm-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                  <span className="text-xs font-bold text-tealmed-300 uppercase tracking-wider">Live GPS Vehicle Radar</span>
                </div>
                <span className="text-[10px] bg-slatecalm-800 text-slatecalm-300 px-2.5 py-0.5 rounded border border-slatecalm-700">Speed: 52 km/h</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slatecalm-400 text-[10px] block">Vehicle Assigned:</span>
                  <span className="font-bold text-base text-white">{dispatchData?.ambulanceNumber || 'WB-34-AMB-1082'}</span>
                </div>
                <div>
                  <span className="text-slatecalm-400 text-[10px] block">Estimated Arrival (ETA):</span>
                  <span className="font-black text-base text-rose-400 flex items-center gap-1">
                    <Clock className="w-4 h-4" /> {dispatchData?.etaMinutes || 14} Minutes
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slatecalm-800 flex justify-between items-center text-xs">
                <div>
                  <span className="text-slatecalm-400 text-[10px] block">Driver & Paramedic:</span>
                  <span className="font-bold text-slatecalm-200">{dispatchData?.driverName || 'Rabin Ghosh'}</span>
                </div>
                <a
                  href={`tel:${dispatchData?.driverPhone || '+919732100108'}`}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Driver</span>
                </a>
              </div>

              {/* Progress Tracker */}
              <div className="w-full bg-slatecalm-800 rounded-full h-2 overflow-hidden mt-1">
                <div className="bg-gradient-to-r from-tealmed-500 to-rose-500 h-2 rounded-full w-2/3 animate-pulse"></div>
              </div>
              <div className="flex justify-between text-[11px] text-slatecalm-400">
                <span>Base: {dispatchData?.nearestFacility || 'Sonapur Primary Health Centre'}</span>
                <span className="text-tealmed-400 font-semibold">Heading towards your GPS coordinates</span>
              </div>
            </div>

            {/* First aid guide */}
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-left text-xs text-amber-950 max-w-lg mx-auto space-y-1.5">
              <span className="font-bold text-amber-900 block flex items-center gap-1.5">
                <span>💡</span> What to do while waiting for the ambulance:
              </span>
              <ul className="space-y-1 text-[11px] text-amber-900/90 list-disc list-inside">
                <li>Keep patient in a well-ventilated, comfortable position (sitting 45° if breathless).</li>
                <li>Loosen collar and tight clothing; avoid giving solid food or cold water.</li>
                <li>Keep patient's ABHA ID / Aadhaar card ready for swift PHC emergency admission.</li>
                <li>Send a person to the village main junction with a light/torch to flag down the vehicle.</li>
              </ul>
            </div>

            <button
              onClick={() => setIsDispatched(false)}
              className="px-6 py-2.5 bg-slatecalm-100 hover:bg-slatecalm-200 text-slatecalm-700 text-xs font-bold rounded-xl transition-colors"
            >
              Reset SOS Beacon
            </button>
          </div>
        )}
      </div>

      {/* Toll-Free Helplines Grid */}
      <div>
        <h3 className="font-bold text-sm text-slatecalm-800 uppercase tracking-wider mb-4 text-center">
          National & State Rural Helplines
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {emergencyHelplines.map((item, i) => (
            <a
              key={i}
              href={`tel:${item.num}`}
              className="bg-white p-5 rounded-2xl border border-slatecalm-200 hover:border-tealmed-400 shadow-soft transition-all flex items-center justify-between group"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-black text-base text-slatecalm-900">{item.title}</span>
                  <span className="text-xs font-bold text-tealmed-700 bg-tealmed-50 px-2 py-0.5 rounded border border-tealmed-200">
                    Dial {item.num}
                  </span>
                </div>
                <p className="text-xs text-slatecalm-500">{item.desc}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slatecalm-100 group-hover:bg-tealmed-600 group-hover:text-white flex items-center justify-center text-slatecalm-600 transition-colors shrink-0 ml-3">
                <Phone className="w-4 h-4" />
              </div>
            </a>
          ))}
        </div>
      </div>

    </div>
  );
};

export default EmergencySOS;

