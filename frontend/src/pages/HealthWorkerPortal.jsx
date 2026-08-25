import React, { useState } from 'react';
import { 
  Users, UserPlus, Calendar, HeartPulse, 
  Baby, ShieldCheck, CheckCircle2, AlertTriangle, 
  Clock, Plus, Filter, Search, CloudOff, FileCheck 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOfflineQueue } from '../context/OfflineQueueContext';

const HealthWorkerPortal = () => {
  const { user } = useAuth();
  const { isOnline, enqueue } = useOfflineQueue();

  const [activeTab, setActiveTab] = useState('surveys'); // 'surveys' | 'maternal' | 'immunization'
  const [householdRecords, setHouseholdRecords] = useState([
    {
      id: 'HH-104',
      headName: 'Haradhan Mondal',
      village: 'Sonapur, Ward 3',
      members: 5,
      lastVisit: 'Yesterday',
      ncdStatus: 'BP Screening Due',
      maternalDue: 'Nil',
      syncStatus: 'SYNCED'
    },
    {
      id: 'HH-105',
      headName: 'Saraswati Soren',
      village: 'Sonapur, Ward 4',
      members: 4,
      lastVisit: '3 Days ago',
      ncdStatus: 'High Sugar (Re-check)',
      maternalDue: 'ANC Visit #3 Due',
      syncStatus: 'SYNCED'
    },
    {
      id: 'HH-106',
      headName: 'Bikash Mahato',
      village: 'Rampur East',
      members: 6,
      lastVisit: '5 Days ago',
      ncdStatus: 'Normal Vitals',
      maternalDue: 'Child Pentavalent-2 Due',
      syncStatus: 'SYNCED'
    }
  ]);

  const [isAddingSurvey, setIsAddingSurvey] = useState(false);
  const [newSurvey, setNewSurvey] = useState({
    headName: '',
    village: 'Sonapur, Ward 3',
    members: 4,
    bpSystolic: '',
    bpDiastolic: '',
    bloodSugar: '',
    notes: ''
  });

  const handleAddSurvey = (e) => {
    e.preventDefault();
    const entry = {
      id: `HH-${Math.floor(100 + Math.random() * 900)}`,
      headName: newSurvey.headName,
      village: newSurvey.village,
      members: newSurvey.members,
      lastVisit: 'Just Now',
      ncdStatus: newSurvey.bpSystolic > 140 ? 'High BP Alert' : 'Vitals Normal',
      maternalDue: 'None',
      syncStatus: isOnline ? 'SYNCED' : 'PENDING_OFFLINE'
    };

    if (!isOnline) {
      enqueue({
        type: 'ASHA_SURVEY',
        data: entry
      });
    }

    setHouseholdRecords([entry, ...householdRecords]);
    setIsAddingSurvey(false);
    setNewSurvey({ headName: '', village: 'Sonapur, Ward 3', members: 4, bpSystolic: '', bpDiastolic: '', bloodSugar: '', notes: '' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-tealmed-800 to-tealmed-900 text-white rounded-3xl p-6 sm:p-8 shadow-soft flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center font-bold text-2xl">
            👩‍⚕️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black">ASHA & Village Health Worker Corner</h1>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full font-semibold">
                Field Mode Active
              </span>
            </div>
            <p className="text-xs text-tealmed-200 mt-1">
              Field Worker: <strong>{user?.name || 'Sunita Devi'}</strong> • Cluster: Sonapur & Rampur Sub-Centres
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddingSurvey(true)}
          className="flex items-center gap-2 px-5 py-3 bg-white text-tealmed-900 hover:bg-tealmed-50 font-bold text-xs rounded-2xl shadow-soft transition-all active:scale-95"
        >
          <UserPlus className="w-4 h-4 text-tealmed-700" />
          <span>New Village Household Screening</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slatecalm-200 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('surveys')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'surveys' ? 'bg-tealmed-700 text-white shadow-xs' : 'text-slatecalm-600 hover:bg-slatecalm-100'
          }`}
        >
          Household Survey Register ({householdRecords.length})
        </button>
        <button
          onClick={() => setActiveTab('maternal')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'maternal' ? 'bg-tealmed-700 text-white shadow-xs' : 'text-slatecalm-600 hover:bg-slatecalm-100'
          }`}
        >
          Maternal Health (ANC / PNC) Tracker
        </button>
        <button
          onClick={() => setActiveTab('immunization')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'immunization' ? 'bg-tealmed-700 text-white shadow-xs' : 'text-slatecalm-600 hover:bg-slatecalm-100'
          }`}
        >
          Child Immunization Due List
        </button>
      </div>

      {/* Tab 1: Household Survey Register */}
      {activeTab === 'surveys' && (
        <div className="bg-white rounded-3xl border border-slatecalm-200/80 p-6 shadow-soft space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-bold text-sm text-slatecalm-900">Village Family Surveillance Records</h3>
            <span className="text-xs text-slatecalm-500">Auto-saved to local memory when internet is low</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slatecalm-200 text-slatecalm-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-3">House ID</th>
                  <th className="py-3 px-3">Family Head</th>
                  <th className="py-3 px-3">Village Area</th>
                  <th className="py-3 px-3">Members</th>
                  <th className="py-3 px-3">NCD / Vitals Alert</th>
                  <th className="py-3 px-3">Sync Status</th>
                  <th className="py-3 px-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slatecalm-100 text-slatecalm-700 font-medium">
                {householdRecords.map((item) => (
                  <tr key={item.id} className="hover:bg-slatecalm-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-tealmed-800">{item.id}</td>
                    <td className="py-3 px-3 font-bold text-slatecalm-900">{item.headName}</td>
                    <td className="py-3 px-3 text-slatecalm-600">{item.village}</td>
                    <td className="py-3 px-3">{item.members} Persons</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.ncdStatus.includes('High') ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {item.ncdStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`flex items-center gap-1 text-[11px] font-semibold ${
                        item.syncStatus === 'SYNCED' ? 'text-emerald-700' : 'text-amber-700'
                      }`}>
                        {item.syncStatus === 'SYNCED' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <CloudOff className="w-3.5 h-3.5" />}
                        {item.syncStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <button className="text-tealmed-700 hover:underline font-bold">
                        Add Vitals
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Maternal Health Tracker */}
      {activeTab === 'maternal' && (
        <div className="bg-white rounded-3xl border border-slatecalm-200/80 p-6 shadow-soft space-y-4">
          <h3 className="font-bold text-sm text-slatecalm-900">Maternal & Ante-Natal Care (ANC) Tracker</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-tealmed-50/50 border border-tealmed-200 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-tealmed-900">Pooja Mandal (24y)</span>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">Trimester 2</span>
              </div>
              <p className="text-slatecalm-600">Village: Sonapur West • Hb: 10.2 g/dL</p>
              <p className="text-slatecalm-700 font-semibold">ANC Checkup #3 Due: 28th August</p>
              <button className="w-full py-1.5 bg-tealmed-600 text-white rounded-lg font-bold">Log Checkup</button>
            </div>
            <div className="p-4 rounded-2xl bg-tealmed-50/50 border border-tealmed-200 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-tealmed-900">Lakshmi Das (28y)</span>
                <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded">High Risk Pregnancy</span>
              </div>
              <p className="text-slatecalm-600">Village: Rampur • Elevated BP: 145/95</p>
              <p className="text-slatecalm-700 font-semibold">Immediate Specialist Teleconsultation</p>
              <button className="w-full py-1.5 bg-rose-600 text-white rounded-lg font-bold">Connect Doctor</button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Immunization Tracker */}
      {activeTab === 'immunization' && (
        <div className="bg-white rounded-3xl border border-slatecalm-200/80 p-6 shadow-soft space-y-4">
          <h3 className="font-bold text-sm text-slatecalm-900">Village Infant Immunization Schedule</h3>
          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl border border-slatecalm-200 flex justify-between items-center">
              <div>
                <h5 className="font-bold text-slatecalm-900">Aniket Roy (Infant - 6 weeks)</h5>
                <p className="text-slatecalm-500">Vaccine Due: OPV 1 + Pentavalent 1 + Rotavirus 1</p>
              </div>
              <span className="px-3 py-1 bg-amber-100 text-amber-800 font-bold rounded-lg">Due This Week</span>
            </div>
            <div className="p-3.5 rounded-xl border border-slatecalm-200 flex justify-between items-center">
              <div>
                <h5 className="font-bold text-slatecalm-900">Suman Murmu (Child - 9 months)</h5>
                <p className="text-slatecalm-500">Vaccine Due: MR 1st Dose (Measles Rubella) + Vitamin A</p>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg">Scheduled</span>
            </div>
          </div>
        </div>
      )}

      {/* New Survey Drawer Modal */}
      {isAddingSurvey && (
        <div className="fixed inset-0 z-50 bg-slatecalm-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-slatecalm-200">
            <div className="p-5 bg-tealmed-700 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">New Household Health Survey</h3>
              <button onClick={() => setIsAddingSurvey(false)} className="text-white/80 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddSurvey} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slatecalm-700 block mb-1">Head of Family Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={newSurvey.headName}
                  onChange={(e) => setNewSurvey({ ...newSurvey, headName: e.target.value })}
                  className="w-full bg-slatecalm-50 border border-slatecalm-200 rounded-xl p-2.5 font-bold focus:outline-none focus:border-tealmed-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slatecalm-700 block mb-1">Village & Ward:</label>
                  <input
                    type="text"
                    value={newSurvey.village}
                    onChange={(e) => setNewSurvey({ ...newSurvey, village: e.target.value })}
                    className="w-full bg-slatecalm-50 border border-slatecalm-200 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="font-bold text-slatecalm-700 block mb-1">Total Members:</label>
                  <input
                    type="number"
                    value={newSurvey.members}
                    onChange={(e) => setNewSurvey({ ...newSurvey, members: e.target.value })}
                    className="w-full bg-slatecalm-50 border border-slatecalm-200 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slatecalm-700 block mb-1">Systolic BP (mmHg):</label>
                  <input
                    type="number"
                    placeholder="120"
                    value={newSurvey.bpSystolic}
                    onChange={(e) => setNewSurvey({ ...newSurvey, bpSystolic: e.target.value })}
                    className="w-full bg-slatecalm-50 border border-slatecalm-200 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="font-bold text-slatecalm-700 block mb-1">Random Sugar (mg/dL):</label>
                  <input
                    type="number"
                    placeholder="110"
                    value={newSurvey.bloodSugar}
                    onChange={(e) => setNewSurvey({ ...newSurvey, bloodSugar: e.target.value })}
                    className="w-full bg-slatecalm-50 border border-slatecalm-200 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingSurvey(false)}
                  className="px-4 py-2 bg-slatecalm-100 rounded-xl font-semibold text-slatecalm-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-tealmed-600 hover:bg-tealmed-700 text-white rounded-xl font-bold shadow-soft"
                >
                  Save Survey Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default HealthWorkerPortal;

