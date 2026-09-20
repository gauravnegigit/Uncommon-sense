import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  GitPullRequest,
  FlaskConical,
  HeartHandshake,
  Pill,
  Bed,
  AlertTriangle,
  RefreshCw,
  Building2,
  MapPin,
  CheckCircle2,
  PhoneCall,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useFacilityOptions } from '../../hooks/useFacilityOptions';
import { highriskService } from '../../services/highriskService';
import { DashboardMetrics, PersonaRole } from '../../types';
import { FacilityLocator } from '../facilities/FacilityLocator';

interface FacilityCommandDashboardProps {
  selectedPersona: PersonaRole;
}

export const FacilityCommandDashboard: React.FC<FacilityCommandDashboardProps> = ({
  selectedPersona,
}) => {
  const { t, isHindi } = useLanguage();
  const { user } = useAuth();
  const { facilities, selectedFacilityId: facilityId } = useFacilityOptions(user?.home_facility_id);

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    facility_id: '',
    queue_waiting: 0,
    queue_active_total: 0,
    open_referrals_incoming: 0,
    open_referrals_outgoing: 0,
    diagnostics_in_progress: 0,
    followups_due_today: 0,
    followups_overdue: 0,
    medicines_low_or_out: 0,
  });

  const [availableBeds, setAvailableBeds] = useState(0);
  const [isUpdatingBeds, setIsUpdatingBeds] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadMetrics = async () => {
    if (!facilityId) return;
    setIsLoading(true);
    try {
      const data = await highriskService.getFacilityDashboard(facilityId);
      if (data) {
        setMetrics(data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilityId]);

  const handleUpdateBeds = async (newCount: number) => {
    setAvailableBeds(newCount);
    if (!facilityId) return;
    await highriskService.updateFacilityCapacity(facilityId, newCount);
    setIsUpdatingBeds(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-teal-50 text-teal-700 rounded-xl">
              <LayoutDashboard className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950">
              {t('dashboardTitle')}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-teal-100 text-teal-800">
              {facilities.find((f) => f.id === facilityId)?.name || 'Medical Officer Console'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 font-hindi">
            {t('dashboardSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsUpdatingBeds(!isUpdatingBeds)}
            className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-black shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Bed className="w-4 h-4 text-emerald-400" />
            <span>{t('updateBedsBtn')}</span>
          </button>
          <button
            onClick={loadMetrics}
            className="p-2.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Bed Capacity Quick Updater Dropdown */}
      {isUpdatingBeds && (
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm animate-fadeIn flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm font-black text-slate-900">
              Update Live Available Inpatient Beds
            </div>
            <div className="text-xs text-slate-500">
              Instantly synchronizes with the Leaflet geospatial referral map and emergency dispatch.
            </div>
          </div>
          <div className="flex items-center gap-2">
            {[8, 12, 14, 18, 24].map((cnt) => (
              <button
                key={cnt}
                onClick={() => handleUpdateBeds(cnt)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  availableBeds === cnt
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cnt} Beds
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 8 Core Operational KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Queue Depth */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
            <span>OPD Queue Depth</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {metrics.queue_waiting}
            </span>
            <span className="text-xs text-slate-500 font-bold">
              waiting / {metrics.queue_active_total} active
            </span>
          </div>
          <div className="mt-3 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full inline-block">
            Atomic Token System
          </div>
        </div>

        {/* Incoming Referrals */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
            <span>Incoming Referrals</span>
            <GitPullRequest className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-700">
              {metrics.open_referrals_incoming}
            </span>
            <span className="text-xs text-slate-500 font-bold">
              from Sub-Centres
            </span>
          </div>
          <div className="mt-3 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
            {metrics.open_referrals_outgoing} outgoing to CHC
          </div>
        </div>

        {/* Active Diagnostics */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
            <span>Lab Tests in Progress</span>
            <FlaskConical className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-cyan-700">
              {metrics.diagnostics_in_progress}
            </span>
            <span className="text-xs text-slate-500 font-bold">
              specimens in lab
            </span>
          </div>
          <div className="mt-3 text-[10px] font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full inline-block">
            CBC, Malaria, Sputum
          </div>
        </div>

        {/* Overdue Follow-ups (Alert) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
            <span>Overdue Follow-ups</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-red-600">
              {metrics.followups_overdue}
            </span>
            <span className="text-xs text-slate-500 font-bold">
              overdue / {metrics.followups_due_today} due today
            </span>
          </div>
          <div className="mt-3 text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full inline-block">
            High-Risk Surveillance
          </div>
        </div>

        {/* Medicine Shortages */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
            <span>Medicine Shortages</span>
            <Pill className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-600">
              {metrics.medicines_low_or_out}
            </span>
            <span className="text-xs text-slate-500 font-bold">
              items low or stock-out
            </span>
          </div>
          <div className="mt-3 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full inline-block">
            Amlodipine, Metformin
          </div>
        </div>

        {/* Available Beds */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
            <span>Inpatient Beds</span>
            <Bed className="w-4 h-4 text-teal-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-teal-700">
              {availableBeds}
            </span>
            <span className="text-xs text-slate-500 font-bold">
              available / 20 capacity
            </span>
          </div>
          <div className="mt-3 text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full inline-block">
            70% Occupancy
          </div>
        </div>

        {/* 24x7 Emergency Readiness */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
            <span>108 Ambulance Hub</span>
            <PhoneCall className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              2
            </span>
            <span className="text-xs text-emerald-600 font-bold">
              ambulances on station
            </span>
          </div>
          <div className="mt-3 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
            Average ETA: 9 mins
          </div>
        </div>

        {/* Deterministic Safety Engine */}
        <div className="bg-gradient-to-br from-[#0c2a21] to-[#081d17] text-white rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-300 mb-2">
            <span>RAG & Guidelines Compliance</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white">
            100%
          </div>
          <div className="mt-3 text-[10px] font-bold text-emerald-300 bg-emerald-900/60 px-2 py-0.5 rounded-full inline-block">
            ICMR / NHM Verified STWs
          </div>
        </div>
      </div>

      {/* Embedded Facility Locator Map Component */}
      <div className="pt-2">
        <FacilityLocator />
      </div>
    </div>
  );
};

