import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  RefreshCw,
  Filter,
  Eye,
  Microscope,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { diagnosticService } from '../../services/diagnosticService';
import {
  DiagnosticOrderCreateRequest,
  DiagnosticOrderResponse,
  DiagnosticStatus,
  PersonaRole,
} from '../../types';

interface DiagnosticTrackerProps {
  selectedPersona: PersonaRole;
}

export const DiagnosticTracker: React.FC<DiagnosticTrackerProps> = ({ selectedPersona }) => {
  const { t, isHindi } = useLanguage();

  const [orders, setOrders] = useState<DiagnosticOrderResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<DiagnosticOrderResponse | null>(null);

  // New Order Form
  const [patientId, setPatientId] = useState('pat-001');
  const [facilityId, setFacilityId] = useState('phc-phaphamau');
  const [testName, setTestName] = useState('Complete Blood Count (CBC) & Hb');
  const [notes, setNotes] = useState('');

  // Update Status Form
  const [nextStatus, setNextStatus] = useState<DiagnosticStatus>('SAMPLE_COLLECTED');
  const [resultSummary, setResultSummary] = useState('');

  const COMMON_TESTS = [
    'Complete Blood Count (CBC) & Hb',
    'Rapid Malaria Antigen Test (Pf / Pv)',
    'Fasting & Post-Prandial Blood Sugar',
    'Glycated Hemoglobin (HbA1c)',
    'Sputum AFB / CBNAAT (Tuberculosis)',
    'Urine Albumin & Microscopic Exam',
    'Lipid Profile & Serum Creatinine',
    'Rapid Dengue NS1 / IgM Antigen',
    'VDRL / RPR Syphilis Serology',
  ];

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const data = await diagnosticService.listDiagnostics();
      setOrders(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await diagnosticService.createDiagnostic({
      patient_id: patientId,
      facility_id: facilityId,
      test_name: testName,
      notes: notes.trim() || null,
    });
    setNotes('');
    setIsOrderModalOpen(false);
    loadOrders();
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;
    await diagnosticService.updateDiagnosticStatus(activeOrder.id, {
      new_status: nextStatus,
      result_summary: resultSummary.trim() || null,
    });
    setResultSummary('');
    setIsUpdateModalOpen(false);
    loadOrders();
  };

  const stages: DiagnosticStatus[] = [
    'REQUESTED',
    'SAMPLE_COLLECTED',
    'PROCESSING',
    'RESULT_AVAILABLE',
  ];

  const getStageIndex = (status: DiagnosticStatus): number => {
    return stages.indexOf(status);
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === 'ALL') return true;
    return o.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-cyan-50 text-cyan-700 rounded-xl">
              <FlaskConical className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950">
              {t('diagnosticTitle')}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-cyan-100 text-cyan-800">
              Specimen Tracking
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 font-hindi">
            {t('diagnosticSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsOrderModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-black shadow-sm flex items-center gap-1.5 transition-all"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span>{t('orderTestBtn')}</span>
          </button>
          <button
            onClick={loadOrders}
            className="p-2.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {isHindi ? 'स्थिति फ़िल्टर:' : 'Filter Status:'}
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {['ALL', 'REQUESTED', 'SAMPLE_COLLECTED', 'PROCESSING', 'RESULT_AVAILABLE'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  statusFilter === s
                    ? 'bg-slate-950 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
        <div className="text-xs text-slate-400 font-mono">
          {filteredOrders.length} Diagnostic Orders
        </div>
      </div>

      {/* Diagnostic Order Cards */}
      <div className="space-y-4">
        {filteredOrders.map((order) => {
          const currentIndex = getStageIndex(order.status);
          const isCompleted = order.status === 'RESULT_AVAILABLE';

          return (
            <div
              key={order.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5"
            >
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-cyan-50 text-cyan-700 rounded-xl">
                    <Microscope className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      {order.test_name}
                    </h3>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 font-mono">
                      <span>Order: {order.id}</span>
                      <span>• Patient: {order.patient_name || order.patient_id}</span>
                      <span>• Lab: {order.facility_name || order.facility_id}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                      isCompleted
                        ? 'bg-emerald-100 text-emerald-800'
                        : order.status === 'PROCESSING'
                        ? 'bg-blue-100 text-blue-800 animate-pulse'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {order.status.replace('_', ' ')}
                  </span>
                  {order.result_summary && (
                    <button
                      onClick={() => {
                        setActiveOrder(order);
                        setIsResultModalOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Result</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Notes */}
              {order.notes && (
                <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <b>Clinical Indication:</b> {order.notes}
                </div>
              )}

              {/* Specimen Lifecycle Stepper */}
              <div className="pt-2">
                <div className="relative flex items-center justify-between">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 rounded-full z-0" />
                  {currentIndex >= 0 && (
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-cyan-500 rounded-full z-0 transition-all duration-500"
                      style={{ width: `${(currentIndex / (stages.length - 1)) * 100}%` }}
                    />
                  )}

                  {stages.map((stg, i) => {
                    const isStepCompleted = i <= currentIndex;
                    const isCurrent = i === currentIndex;
                    return (
                      <div key={stg} className="relative z-10 flex flex-col items-center">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                            isCurrent
                              ? 'bg-cyan-600 text-white ring-4 ring-cyan-100 shadow-sm'
                              : isStepCompleted
                              ? 'bg-cyan-500 text-white'
                              : 'bg-white border-2 border-slate-200 text-slate-400'
                          }`}
                        >
                          {isStepCompleted ? '✓' : i + 1}
                        </div>
                        <span
                          className={`text-[10px] mt-1.5 font-bold whitespace-nowrap text-center ${
                            isCurrent
                              ? 'text-cyan-800 font-black'
                              : isStepCompleted
                              ? 'text-slate-800'
                              : 'text-slate-400'
                          }`}
                        >
                          {stg.replace('_', ' ')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons for Lab Staff / MO */}
              {(selectedPersona === 'DOCTOR' || selectedPersona === 'ASHA_WORKER') && !isCompleted && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Next Stage:{' '}
                    <b className="text-slate-800">
                      {stages[currentIndex + 1]?.replace('_', ' ') || 'Complete'}
                    </b>
                  </span>
                  <button
                    onClick={() => {
                      setActiveOrder(order);
                      setNextStatus(stages[currentIndex + 1] || 'RESULT_AVAILABLE');
                      setIsUpdateModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <span>Update Sample Status</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL: Order Diagnostic Test */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">
                {isHindi ? 'नई लैब जांच दर्ज करें' : 'Order Diagnostic Test'}
              </h3>
              <button
                onClick={() => setIsOrderModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isHindi ? 'मरीज चुनें:' : 'Select Patient:'}
                </label>
                <select
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium"
                >
                  <option value="pat-001">Sunita Devi (pat-001)</option>
                  <option value="pat-002">Ramesh Kumar Patel (pat-002)</option>
                  <option value="pat-003">Aarav (Child of Pinki - pat-003)</option>
                  <option value="pat-004">Shanti Devi (pat-004)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isHindi ? 'जांच का नाम (Test Catalog):' : 'Select Investigation:'}
                </label>
                <select
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium"
                >
                  {COMMON_TESTS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isHindi ? 'नैदानिक निर्देश / टिप्पणी:' : 'Clinical Notes / Indication:'}
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. High fever for 4 days, rule out malaria or typhoid..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOrderModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-950 text-white font-bold hover:bg-slate-800"
                >
                  Issue Lab Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Update Specimen Status */}
      {isUpdateModalOpen && activeOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">
                Update Sample Status: {activeOrder.test_name}
              </h3>
              <button
                onClick={() => setIsUpdateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  New Status Transition:
                </label>
                <select
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value as DiagnosticStatus)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium"
                >
                  <option value="SAMPLE_COLLECTED">Sample Collected (At Subcentre/PHC)</option>
                  <option value="PROCESSING">Processing in Lab</option>
                  <option value="RESULT_AVAILABLE">Result Available & Certified</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              {nextStatus === 'RESULT_AVAILABLE' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Certified Lab Result Summary:
                  </label>
                  <textarea
                    rows={4}
                    value={resultSummary}
                    onChange={(e) => setResultSummary(e.target.value)}
                    placeholder="e.g. Hemoglobin: 11.2 g/dL (Normal). Platelets: 220,000/mcL. Urine Albumin: Nil..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                    required
                  />
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-700 text-white font-bold hover:bg-cyan-800"
                >
                  Confirm Status Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: View Result Report */}
      {isResultModalOpen && activeOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Diagnostic Lab Report
                  </h3>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {activeOrder.id} • Certified by Lab Officer
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsResultModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div>
                <span className="text-[10px] uppercase font-extrabold text-slate-400">
                  Investigation
                </span>
                <div className="text-sm font-black text-slate-900">
                  {activeOrder.test_name}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-extrabold text-slate-400">
                  Patient & Facility
                </span>
                <div className="text-xs font-bold text-slate-800">
                  {activeOrder.patient_name || activeOrder.patient_id} • {activeOrder.facility_name || activeOrder.facility_id}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <span className="text-[10px] uppercase font-extrabold text-slate-400">
                  Certified Findings & Values
                </span>
                <div className="mt-1 text-xs text-slate-800 font-mono bg-white p-3 rounded-xl border border-slate-200 leading-relaxed">
                  {activeOrder.result_summary}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setIsResultModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-950 text-white text-xs font-bold"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

