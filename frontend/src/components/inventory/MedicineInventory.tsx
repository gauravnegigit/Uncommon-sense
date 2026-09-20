import React, { useState, useEffect } from 'react';
import {
  Pill,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  PlusCircle,
  RefreshCw,
  MapPin,
  Building2,
  ArrowRight,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useFacilityOptions } from '../../hooks/useFacilityOptions';
import { medicineService } from '../../services/medicineService';
import {
  MedicineFacilityMatch,
  MedicineResponse,
  MedicineUpsertRequest,
  PersonaRole,
  StockStatus,
} from '../../types';

interface MedicineInventoryProps {
  selectedPersona: PersonaRole;
}

export const MedicineInventory: React.FC<MedicineInventoryProps> = ({ selectedPersona }) => {
  const { t, isHindi } = useLanguage();
  const { user } = useAuth();
  const { facilities, selectedFacilityId: facilityId, setSelectedFacilityId: setFacilityId } =
    useFacilityOptions(user?.home_facility_id);

  const [medicines, setMedicines] = useState<MedicineResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Nearby Search State
  const [nearbyQuery, setNearbyQuery] = useState('Amlodipine');
  const [nearbyResults, setNearbyResults] = useState<MedicineFacilityMatch[]>([]);
  const [isSearchingNearby, setIsSearchingNearby] = useState(false);

  // Update Stock Modal
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [medName, setMedName] = useState('');
  const [medCategory, setMedCategory] = useState('');
  const [medStatus, setMedStatus] = useState<StockStatus>('AVAILABLE');
  const [medQuantity, setMedQuantity] = useState<number>(100);

  const loadMedicines = async () => {
    if (!facilityId) return;
    setIsLoading(true);
    try {
      const data = await medicineService.listFacilityMedicines(facilityId);
      setMedicines(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMedicines();
    handleSearchNearby('Amlodipine');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilityId]);

  const handleSearchNearby = async (query: string) => {
    if (!query.trim()) return;
    setIsSearchingNearby(true);
    try {
      const results = await medicineService.searchMedicineNearby(query.trim());
      setNearbyResults(results);
    } finally {
      setIsSearchingNearby(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName.trim() || !facilityId) return;
    await medicineService.upsertMedicineStock(facilityId, {
      medicine_name: medName.trim(),
      category: medCategory.trim() || 'General Medicine',
      status: medStatus,
      quantity: Number(medQuantity),
    });
    setIsUpdateModalOpen(false);
    loadMedicines();
  };

  const openUpdateModal = (med?: MedicineResponse) => {
    if (med) {
      setMedName(med.medicine_name);
      setMedCategory(med.category || '');
      setMedStatus(med.status as StockStatus);
      setMedQuantity(med.quantity ?? 0);
    } else {
      setMedName('');
      setMedCategory('');
      setMedStatus('AVAILABLE');
      setMedQuantity(100);
    }
    setIsUpdateModalOpen(true);
  };

  const filteredMedicines = medicines.filter((m) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.medicine_name.toLowerCase().includes(q) ||
      m.category?.toLowerCase().includes(q)
    );
  });

  const lowStockCount = medicines.filter((m) => m.status === 'LOW_STOCK').length;
  const outOfStockCount = medicines.filter((m) => m.status === 'UNAVAILABLE').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-rose-50 text-rose-700 rounded-xl">
              <Pill className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950">
              {t('inventoryTitle')}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 font-hindi">
            {t('inventorySubtitle')}
          </p>
          <select
            value={facilityId}
            onChange={(e) => setFacilityId(e.target.value)}
            className="mt-2 text-xs font-bold text-rose-800 bg-rose-50 border border-rose-200 rounded-full px-2.5 py-1"
          >
            {facilities.length === 0 && <option value="">No facilities found</option>}
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2.5">
          {(selectedPersona === 'DOCTOR' || selectedPersona === 'ASHA_WORKER') && (
            <button
              onClick={() => openUpdateModal()}
              className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-black shadow-sm flex items-center gap-1.5 transition-all"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>{t('updateStockBtn')}</span>
            </button>
          )}
          <button
            onClick={loadMedicines}
            className="p-2.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stock Health KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1">
            <span>Essential Drugs Tracked</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">
            {medicines.length}
          </div>
          <div className="text-xs text-emerald-600 font-bold mt-1">
            {medicines.filter((m) => m.status === 'AVAILABLE').length} Available in Sufficient Stock
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1">
            <span>Low Stock Warnings</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-amber-600">
            {lowStockCount}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Requires replenishment requisition
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1">
            <span>Critical Stock-outs</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-3xl font-black text-rose-600">
            {outOfStockCount}
          </div>
          <div className="text-xs text-rose-600 font-bold mt-1">
            AI Substitution Active for Disrupted Items
          </div>
        </div>
      </div>

      {/* Main Grid: Inventory Table (Left 7 Cols) + Search Nearby / AI Substitutions (Right 5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Inventory Table (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isHindi ? 'दवा का नाम या श्रेणी खोजें...' : 'Search drug name or category...'
                }
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
            <div className="text-xs text-slate-400 font-mono shrink-0">
              {filteredMedicines.length} Medicines
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="py-3 px-4">Medicine Name</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Quantity</th>
                  {(selectedPersona === 'DOCTOR' || selectedPersona === 'ASHA_WORKER') && (
                    <th className="py-3 px-4 text-right">Edit</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredMedicines.map((med) => (
                  <tr
                    key={med.id}
                    onClick={() => {
                      setNearbyQuery(med.medicine_name);
                      handleSearchNearby(med.medicine_name);
                    }}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{med.medicine_name}</div>
                      <div className="text-[10px] text-slate-400">{med.category}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          med.status === 'AVAILABLE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : med.status === 'LOW_STOCK'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800 animate-pulse'
                        }`}
                      >
                        {med.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-700">
                      {med.quantity ?? 0} units
                    </td>
                    {(selectedPersona === 'DOCTOR' || selectedPersona === 'ASHA_WORKER') && (
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openUpdateModal(med);
                          }}
                          className="px-2 py-1 text-[10px] font-bold rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                        >
                          Update
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Col: Nearby Availability & AI Substitutions (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Nearby Facility Search Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-black text-slate-900">
              <MapPin className="w-4 h-4 text-rose-600" />
              <span>{t('searchNearbyMeds')}</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={nearbyQuery}
                onChange={(e) => setNearbyQuery(e.target.value)}
                placeholder="Enter drug name..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white"
              />
              <button
                onClick={() => handleSearchNearby(nearbyQuery)}
                className="px-3.5 py-2 rounded-xl bg-slate-950 text-white text-xs font-bold hover:bg-slate-800"
              >
                Search
              </button>
            </div>

            {/* Results List */}
            {isSearchingNearby ? (
              <div className="py-6 text-center text-xs text-slate-400">Searching nearby facilities...</div>
            ) : nearbyResults.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No nearby facility has reporting stock for "{nearbyQuery}".
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                {nearbyResults.map((match, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {match.facility_name}
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-2">
                        <span>📍 {match.distance_km} km away</span>
                        <span>• Stock: {match.quantity} units</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
                      {match.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: Update Stock Level */}
      {isUpdateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">
                {isHindi ? 'दवा स्टॉक विवरण अपडेट करें' : 'Update Medicine Stock Level'}
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
                  Medicine Name:
                </label>
                <input
                  type="text"
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                  placeholder="e.g. Paracetamol Tablets IP 500mg"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Therapeutic Category:
                </label>
                <input
                  type="text"
                  value={medCategory}
                  onChange={(e) => setMedCategory(e.target.value)}
                  placeholder="e.g. Analgesic & Antipyretic"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Stock Status:
                  </label>
                  <select
                    value={medStatus}
                    onChange={(e) => setMedStatus(e.target.value as StockStatus)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium"
                  >
                    <option value="AVAILABLE">AVAILABLE (पर्याप्त)</option>
                    <option value="LOW_STOCK">LOW STOCK (कम स्टॉक)</option>
                    <option value="UNAVAILABLE">UNAVAILABLE (अनुपलब्ध)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Current Quantity:
                  </label>
                  <input
                    type="number"
                    value={medQuantity}
                    onChange={(e) => setMedQuantity(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                    min={0}
                  />
                </div>
              </div>

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
                  className="px-5 py-2 rounded-xl bg-slate-950 text-white font-bold hover:bg-slate-800"
                >
                  Save Stock Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

