import React, { useState } from 'react';
import {
  HeartHandshake,
  UserPlus,
  Users,
  Ticket,
  Pill,
  Search,
  PlusCircle,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Phone,
  MapPin,
  FileText,
  ArrowLeft,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useFacilityOptions } from '../../hooks/useFacilityOptions';
import { PatientDirectory } from '../patient/PatientDirectory';
import { HighRiskRegistry } from '../highrisk/HighRiskRegistry';
import { MedicineInventory } from '../inventory/MedicineInventory';
import { appointmentService } from '../../services/appointmentService';
import { PriorityLevel } from '../../types';

interface AshaPortalProps {
  onBackToHome?: () => void;
}

export const AshaPortal: React.FC<AshaPortalProps> = ({ onBackToHome }) => {
  const { isHindi } = useLanguage();
  const { user } = useAuth();
  const { selectedFacilityId: facilityId } = useFacilityOptions(user?.home_facility_id);

  const [activeTab, setActiveTab] = useState<'highrisk' | 'patients' | 'walkin' | 'medicines'>('highrisk');

  // Walk-In Token Generator State
  const [walkInPatientId, setWalkInPatientId] = useState('');
  const [walkInPriority, setWalkInPriority] = useState<PriorityLevel>('NORMAL');
  const [walkInStatus, setWalkInStatus] = useState<string | null>(null);
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);

  const handleGenerateWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInPatientId.trim() || !facilityId) return;
    setIsGeneratingToken(true);
    try {
      const res = await appointmentService.issueWalkInToken({
        facility_id: facilityId,
        patient_id: walkInPatientId.trim(),
        priority: walkInPriority,
      });
      setWalkInStatus(`Generated Token #${res.token_number} (Status: ${res.status}) for patient ${res.patient_id}`);
      setWalkInPatientId('');
    } catch (err: any) {
      setWalkInStatus(`Error: ${err.message || 'Failed to issue token'}`);
    } finally {
      setIsGeneratingToken(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ASHA Portal Header Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="mb-2 text-xs font-bold text-slate-500 hover:text-amber-700 flex items-center gap-1.5 transition-colors group cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
              <span>{isHindi ? '← मुख्य पृष्ठ पर लौटें' : '← Back to Home'}</span>
            </button>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl">👩‍⚕️</span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950">
              {isHindi ? 'आशा कार्यकर्ता फील्ड पोर्टल' : 'ASHA Health Activist Portal'}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 font-hindi mt-0.5">
            {isHindi
              ? 'ग्रामीण स्वास्थ्य निगरानी, उच्च जोखिम गर्भवती/शिशु ट्रैकिंग, मरीज पंजीकरण एवं वॉक-इन टोकन'
              : 'Community healthcare outreach, high-risk ANC/SAM follow-ups, and village patient registration'}
          </p>
        </div>

        {/* Navigation Tabs for ASHA Worker */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200 overflow-x-auto text-xs font-black shrink-0">
          <button
            onClick={() => setActiveTab('highrisk')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
              activeTab === 'highrisk'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>{isHindi ? 'उच्च जोखिम निगरानी व गृह-भेंट' : 'High-Risk Follow-ups'}</span>
          </button>

          <button
            onClick={() => setActiveTab('patients')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
              activeTab === 'patients'
                ? 'bg-slate-950 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-purple-400" />
            <span>{isHindi ? 'मरीज पंजीकरण व रिकॉर्ड' : 'Patient Registration'}</span>
          </button>

          <button
            onClick={() => setActiveTab('walkin')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
              activeTab === 'walkin'
                ? 'bg-slate-950 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Ticket className="w-3.5 h-3.5 text-blue-400" />
            <span>{isHindi ? 'वॉक-इन टोकन जारी करें' : 'Issue Walk-in Token'}</span>
          </button>

          <button
            onClick={() => setActiveTab('medicines')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
              activeTab === 'medicines'
                ? 'bg-slate-950 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Pill className="w-3.5 h-3.5 text-rose-400" />
            <span>{isHindi ? 'दवा उपलब्धता जांचें' : 'Medicine Stock Radar'}</span>
          </button>
        </div>
      </div>

      {/* TAB 1: HIGH-RISK REGISTRY & HOME VISITS */}
      {activeTab === 'highrisk' && (
        <HighRiskRegistry selectedPersona="ASHA_WORKER" />
      )}

      {/* TAB 2: PATIENT REGISTRATION & DIRECTORY */}
      {activeTab === 'patients' && (
        <PatientDirectory selectedPersona="ASHA_WORKER" />
      )}

      {/* TAB 3: ISSUE WALK-IN TOKEN FOR VILLAGE PATIENT */}
      {activeTab === 'walkin' && (
        <div className="max-w-xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <span className="p-2.5 bg-blue-50 text-blue-700 rounded-2xl">
              <Ticket className="w-6 h-6" />
            </span>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                {isHindi ? 'ग्रामीण मरीज हेतु ओपीडी वॉक-इन टोकन' : 'Issue Walk-in OPD Queue Token'}
              </h3>
              <p className="text-xs text-slate-500 font-hindi">
                {isHindi
                  ? 'अस्पताल जाने वाले गांव के मरीज का टोकन पहले से जारी कर कतार में स्थान सुनिश्चित करें'
                  : 'Assign immediate OPD queue position for a village patient heading to the PHC'}
              </p>
            </div>
          </div>

          <form onSubmit={handleGenerateWalkIn} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {isHindi ? 'मरीज आईडी दर्ज करें:' : 'Patient ID (or Registered UUID):'}
              </label>
              <input
                type="text"
                value={walkInPatientId}
                onChange={(e) => setWalkInPatientId(e.target.value)}
                placeholder="e.g. Registered patient UUID or phone..."
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-mono text-xs"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">
                {isHindi
                  ? '* यदि मरीज पंजीकृत नहीं है, तो पहले "मरीज पंजीकरण" टैब से उनका विवरण जोड़ें।'
                  : '* If patient is not yet registered, create their profile under the "Patient Registration" tab first.'}
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {isHindi ? 'प्राथमिकता स्तर (Clinical Urgency):' : 'Triage Priority:'}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setWalkInPriority('NORMAL')}
                  className={`p-3 rounded-xl border font-bold transition-all text-xs ${
                    walkInPriority === 'NORMAL'
                      ? 'bg-slate-950 text-white border-slate-950'
                      : 'border-slate-200 text-slate-700'
                  }`}
                >
                  Normal Priority
                </button>
                <button
                  type="button"
                  onClick={() => setWalkInPriority('URGENT')}
                  className={`p-3 rounded-xl border font-bold transition-all text-xs ${
                    walkInPriority === 'URGENT'
                      ? 'bg-red-600 text-white border-red-600'
                      : 'border-slate-200 text-red-600'
                  }`}
                >
                  🔴 Urgent / High-Risk
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isGeneratingToken}
                className="w-full py-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-black shadow-sm transition-all"
              >
                {isGeneratingToken ? 'Generating Token...' : 'Generate Live PHC Token'}
              </button>
            </div>

            {walkInStatus && (
              <div
                className={`p-3.5 rounded-xl border text-xs font-mono ${
                  walkInStatus.startsWith('Error')
                    ? 'bg-red-50 text-red-800 border-red-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold'
                }`}
              >
                {walkInStatus}
              </div>
            )}
          </form>
        </div>
      )}

      {/* TAB 4: MEDICINE RADAR */}
      {activeTab === 'medicines' && (
        <MedicineInventory selectedPersona="ASHA_WORKER" />
      )}
    </div>
  );
};

