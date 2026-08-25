import React, { useState } from 'react';
import { 
  HeartPulse, User, AlertTriangle, ShieldCheck, Thermometer, 
  Wind, Activity, Stethoscope, Check 
} from 'lucide-react';

const BODY_REGIONS = [
  { id: 'fever_general', label: 'Fever & General', icon: '🌡️', symptoms: ['High Fever (>101°F)', 'Severe Body Ache', 'Chills & Shivering', 'Extreme Weakness', 'Loss of Appetite'] },
  { id: 'chest_lungs', label: 'Chest & Breathing', icon: '🫁', symptoms: ['Shortness of Breath', 'Chest Tightness/Pain', 'Persistent Dry Cough', 'Cough with Phlegm', 'Wheezing'] },
  { id: 'head_throat', label: 'Head & Throat', icon: '🧠', symptoms: ['Severe Headache', 'Sore Throat', 'Dizziness / Vertigo', 'Eye Redness', 'Ear Pain'] },
  { id: 'stomach_digestive', label: 'Abdomen & Digestion', icon: '🫄', symptoms: ['Watery Diarrhea', 'Severe Abdominal Cramps', 'Vomiting / Nausea', 'Dehydration & Dry Mouth', 'Acidity / Burning'] },
  { id: 'joints_limbs', label: 'Limbs & Injuries', icon: '🦵', symptoms: ['Knee/Joint Swelling', 'Animal/Insect Bite', 'Sprain / Fracture Pain', 'Open Wound / Bleeding', 'Numbness in Feet'] },
  { id: 'maternal_child', label: 'Maternal & Child', icon: '👶', symptoms: ['Labor Pain / Contractions', 'Excessive Vomiting in Pregnancy', 'Child High Fever & Convulsion', 'Infant Feeding Inability', 'Jaundice / Yellow Eyes'] }
];

const SymptomTriageCard = ({ selectedSymptoms = [], onChange, severity = 5, onSeverityChange }) => {
  const [activeRegion, setActiveRegion] = useState(BODY_REGIONS[0].id);

  const toggleSymptom = (sym) => {
    if (selectedSymptoms.includes(sym)) {
      onChange(selectedSymptoms.filter(s => s !== sym));
    } else {
      onChange([...selectedSymptoms, sym]);
    }
  };

  const currentRegionData = BODY_REGIONS.find(r => r.id === activeRegion) || BODY_REGIONS[0];

  return (
    <div className="bg-white rounded-2xl border border-slatecalm-200/80 p-6 shadow-soft space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-tealmed-50 text-tealmed-700 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div>
              <h3 className="text-base font-bold text-slatecalm-900">Select Body Area & Symptoms</h3>
              <p className="text-xs text-slatecalm-500">Tap body region and choose all matching symptoms</p>
            </div>
          </div>

          <span className="text-xs font-semibold px-2.5 py-1 bg-tealmed-100/70 text-tealmed-800 rounded-full">
            {selectedSymptoms.length} Selected
          </span>
        </div>
      </div>

      {/* Body Area Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {BODY_REGIONS.map((region) => {
          const isActive = region.id === activeRegion;
          const hasSelectedInRegion = region.symptoms.some(s => selectedSymptoms.includes(s));
          return (
            <button
              key={region.id}
              onClick={() => setActiveRegion(region.id)}
              className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 relative ${
                isActive
                  ? 'border-tealmed-500 bg-tealmed-50/70 text-tealmed-900 shadow-xs'
                  : 'border-slatecalm-200 hover:border-slatecalm-300 bg-slatecalm-50/50 text-slatecalm-700'
              }`}
            >
              {hasSelectedInRegion && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-tealmed-600" />
              )}
              <span className="text-xl">{region.icon}</span>
              <span className="text-xs font-semibold leading-tight">{region.label}</span>
            </button>
          );
        })}
      </div>

      {/* Symptom Selection Chips */}
      <div className="p-4 rounded-xl bg-slatecalm-50/70 border border-slatecalm-200/80">
        <h4 className="text-xs font-bold text-slatecalm-600 uppercase tracking-wider mb-3">
          {currentRegionData.label} Symptoms:
        </h4>
        <div className="flex flex-wrap gap-2">
          {currentRegionData.symptoms.map((symptom) => {
            const isSelected = selectedSymptoms.includes(symptom);
            return (
              <button
                key={symptom}
                onClick={() => toggleSymptom(symptom)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-tealmed-600 text-white shadow-soft font-semibold'
                    : 'bg-white text-slatecalm-700 border border-slatecalm-200 hover:border-tealmed-300 hover:bg-tealmed-50/30'
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5" />}
                <span>{symptom}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Discomfort / Pain Severity Slider */}
      <div className="pt-2 border-t border-slatecalm-100">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-slatecalm-800 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-tealmed-600" />
            <span>Discomfort / Pain Intensity Level:</span>
          </label>
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
            severity >= 8 ? 'bg-rose-100 text-rose-800' :
            severity >= 5 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
          }`}>
            {severity} / 10 - {severity >= 8 ? 'Severe / Intense' : severity >= 5 ? 'Moderate' : 'Mild'}
          </span>
        </div>

        <input
          type="range"
          min="1"
          max="10"
          value={severity}
          onChange={(e) => onSeverityChange(parseInt(e.target.value))}
          className="w-full h-2 bg-slatecalm-200 rounded-lg appearance-none cursor-pointer accent-tealmed-600"
        />

        <div className="flex justify-between text-[11px] text-slatecalm-400 font-medium mt-1">
          <span>1 (Barely noticeable)</span>
          <span>5 (Moderate ache)</span>
          <span>10 (Unbearable)</span>
        </div>
      </div>
    </div>
  );
};

export default SymptomTriageCard;

