import React from 'react';
import { Heart, Activity, Thermometer, Droplet, Wind, AlertCircle } from 'lucide-react';

const VitalsInput = ({ vitals, onChange }) => {
  const handleChange = (field, value) => {
    onChange({
      ...vitals,
      [field]: value === '' ? '' : Number(value)
    });
  };

  // Status helper badges
  const getSpO2Status = (val) => {
    if (!val) return null;
    if (val < 92) return { text: 'Critical Low', color: 'bg-rose-100 text-rose-800' };
    if (val < 95) return { text: 'Low Warning', color: 'bg-amber-100 text-amber-800' };
    return { text: 'Normal', color: 'bg-emerald-100 text-emerald-800' };
  };

  const getBpStatus = (sys, dia) => {
    if (!sys) return null;
    if (sys >= 160 || (dia && dia >= 100)) return { text: 'High (Crisis)', color: 'bg-rose-100 text-rose-800' };
    if (sys >= 140 || (dia && dia >= 90)) return { text: 'Stage 2 High', color: 'bg-amber-100 text-amber-800' };
    if (sys >= 120 && sys <= 139) return { text: 'Pre-hypertension', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'Optimal', color: 'bg-emerald-100 text-emerald-800' };
  };

  const getTempStatus = (temp) => {
    if (!temp) return null;
    if (temp >= 102) return { text: 'High Fever', color: 'bg-rose-100 text-rose-800' };
    if (temp >= 99.5) return { text: 'Low Fever', color: 'bg-amber-100 text-amber-800' };
    return { text: 'Normal', color: 'bg-emerald-100 text-emerald-800' };
  };

  const spo2Status = getSpO2Status(vitals.spO2);
  const bpStatus = getBpStatus(vitals.bpSystolic, vitals.bpDiastolic);
  const tempStatus = getTempStatus(vitals.temp);

  return (
    <div className="bg-white rounded-2xl border border-slatecalm-200/80 p-6 shadow-soft space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slatecalm-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-tealmed-50 text-tealmed-700 flex items-center justify-center font-bold text-sm">
            2
          </div>
          <div>
            <h3 className="text-base font-bold text-slatecalm-900">Patient Vitals (Optional / ASHA Screening)</h3>
            <p className="text-xs text-slatecalm-500">Record standard readings if pulse oximeter or BP cuff is available</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Blood Pressure */}
        <div className="p-4 rounded-xl bg-slatecalm-50/70 border border-slatecalm-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slatecalm-700">
              <Heart className="w-4 h-4 text-rose-500" />
              <span>Blood Pressure (mmHg)</span>
            </div>
            {bpStatus && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${bpStatus.color}`}>
                {bpStatus.text}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Systolic (120)"
              value={vitals.bpSystolic || ''}
              onChange={(e) => handleChange('bpSystolic', e.target.value)}
              className="w-full bg-white px-2.5 py-1.5 border border-slatecalm-200 rounded-lg text-xs font-semibold text-slatecalm-800 focus:outline-none focus:border-tealmed-500"
            />
            <input
              type="number"
              placeholder="Diastolic (80)"
              value={vitals.bpDiastolic || ''}
              onChange={(e) => handleChange('bpDiastolic', e.target.value)}
              className="w-full bg-white px-2.5 py-1.5 border border-slatecalm-200 rounded-lg text-xs font-semibold text-slatecalm-800 focus:outline-none focus:border-tealmed-500"
            />
          </div>
          <span className="text-[10px] text-slatecalm-400 mt-1">Normal: 110-120 / 70-80</span>
        </div>

        {/* Oxygen Saturation (SpO2) */}
        <div className="p-4 rounded-xl bg-slatecalm-50/70 border border-slatecalm-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slatecalm-700">
              <Wind className="w-4 h-4 text-sky-500" />
              <span>SpO2 Oxygen (%)</span>
            </div>
            {spo2Status && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${spo2Status.color}`}>
                {spo2Status.text}
              </span>
            )}
          </div>
          <input
            type="number"
            placeholder="e.g. 98"
            min="60"
            max="100"
            value={vitals.spO2 || ''}
            onChange={(e) => handleChange('spO2', e.target.value)}
            className="w-full bg-white px-2.5 py-1.5 border border-slatecalm-200 rounded-lg text-xs font-semibold text-slatecalm-800 focus:outline-none focus:border-tealmed-500"
          />
          <span className="text-[10px] text-slatecalm-400 mt-1">Normal: 95% - 100%</span>
        </div>

        {/* Pulse Rate */}
        <div className="p-4 rounded-xl bg-slatecalm-50/70 border border-slatecalm-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slatecalm-700">
              <Activity className="w-4 h-4 text-emerald-500" />
              <span>Pulse / HR (bpm)</span>
            </div>
          </div>
          <input
            type="number"
            placeholder="e.g. 76"
            value={vitals.heartRate || ''}
            onChange={(e) => handleChange('heartRate', e.target.value)}
            className="w-full bg-white px-2.5 py-1.5 border border-slatecalm-200 rounded-lg text-xs font-semibold text-slatecalm-800 focus:outline-none focus:border-tealmed-500"
          />
          <span className="text-[10px] text-slatecalm-400 mt-1">Normal: 60 - 100 bpm</span>
        </div>

        {/* Temperature */}
        <div className="p-4 rounded-xl bg-slatecalm-50/70 border border-slatecalm-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slatecalm-700">
              <Thermometer className="w-4 h-4 text-amber-500" />
              <span>Body Temp (°F)</span>
            </div>
            {tempStatus && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tempStatus.color}`}>
                {tempStatus.text}
              </span>
            )}
          </div>
          <input
            type="number"
            step="0.1"
            placeholder="e.g. 98.6"
            value={vitals.temp || ''}
            onChange={(e) => handleChange('temp', e.target.value)}
            className="w-full bg-white px-2.5 py-1.5 border border-slatecalm-200 rounded-lg text-xs font-semibold text-slatecalm-800 focus:outline-none focus:border-tealmed-500"
          />
          <span className="text-[10px] text-slatecalm-400 mt-1">Normal: 97.5°F - 99.0°F</span>
        </div>
      </div>
    </div>
  );
};

export default VitalsInput;

