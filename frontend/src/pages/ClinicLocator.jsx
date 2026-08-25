import React, { useState, useEffect } from 'react';
import { 
  MapPin, Phone, Clock, Ambulance, 
  ShieldCheck, Activity, Search, Filter, 
  Navigation, Stethoscope, ChevronRight 
} from 'lucide-react';
import MapView from '../components/MapView';
import clinicService from '../services/clinicService';

const ClinicLocator = () => {
  const [clinics, setClinics] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  useEffect(() => {
    fetchClinics();
  }, [search, filterType]);

  const fetchClinics = async () => {
    const res = await clinicService.getClinics(search, filterType);
    if (res.clinics) {
      setClinics(res.clinics);
      if (!selectedClinic && res.clinics.length > 0) {
        setSelectedClinic(res.clinics[0]);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slatecalm-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-tealmed-100 text-tealmed-800">
              <MapPin className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-slatecalm-900 tracking-tight">
              Rural Primary Health Centres & Clinics
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slatecalm-500 mt-1">
            Real-time locator for government PHCs, Community Health Centres, and Mobile Medical Vans
          </p>
        </div>

        <a
          href="tel:108"
          className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-soft transition-colors"
        >
          <Ambulance className="w-4 h-4" />
          <span>Call 108 Emergency</span>
        </a>
      </div>

      {/* Map & Facility Directory Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Interactive Map (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <MapView
            onSelectClinic={(c) => setSelectedClinic(c)}
            selectedClinicId={selectedClinic?.id}
            height="520px"
          />
        </div>

        {/* Directory List & Detail Card (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slatecalm-200/80 p-5 shadow-soft space-y-4">
          
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slatecalm-900">Healthcare Facilities ({clinics.length})</h3>
            <span className="text-[11px] text-tealmed-700 bg-tealmed-50 px-2 py-0.5 rounded-full font-semibold">
              District Live Feed
            </span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slatecalm-400" />
            <input
              type="text"
              placeholder="Search facility by village or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slatecalm-50 border border-slatecalm-200 rounded-xl text-xs focus:outline-none focus:border-tealmed-500"
            />
          </div>

          {/* Scrollable Facility Cards */}
          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {clinics.map((clinic) => {
              const isSelected = selectedClinic?.id === clinic.id;
              return (
                <div
                  key={clinic.id}
                  onClick={() => setSelectedClinic(clinic)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-tealmed-500 bg-tealmed-50/50 shadow-xs'
                      : 'border-slatecalm-200 hover:border-slatecalm-300 bg-slatecalm-50/40 hover:bg-slatecalm-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-tealmed-100 text-tealmed-800 px-2 py-0.5 rounded">
                      {clinic.type}
                    </span>
                    <span className="text-xs font-bold text-tealmed-700">{clinic.distanceKm} km away</span>
                  </div>

                  <h4 className="font-bold text-xs sm:text-sm text-slatecalm-900">{clinic.name}</h4>
                  <p className="text-[11px] text-slatecalm-500 mt-0.5">{clinic.address}</p>

                  <div className="mt-2.5 pt-2 border-t border-slatecalm-100 flex items-center justify-between text-[11px]">
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {clinic.isOpen ? 'Open Now' : 'Closed'}
                    </span>
                    <span className="text-slatecalm-600 font-medium">
                      Beds: {clinic.beds.available} / {clinic.beds.total}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Selected Clinic Action Footer */}
          {selectedClinic && (
            <div className="p-4 bg-tealmed-50/60 rounded-2xl border border-tealmed-200/70 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-tealmed-900">Essential Stock at {selectedClinic.name}:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {selectedClinic.medicinesInStock?.map((med, i) => (
                  <span key={i} className="bg-white text-slatecalm-700 px-2 py-0.5 rounded border border-tealmed-200 text-[10px]">
                    ✓ {med}
                  </span>
                ))}
              </div>

              <div className="pt-2 flex items-center gap-2">
                <a
                  href={`tel:${selectedClinic.phone}`}
                  className="flex-1 py-2 bg-tealmed-600 hover:bg-tealmed-700 text-white font-bold text-xs rounded-xl text-center shadow-xs"
                >
                  Call Reception ({selectedClinic.phone})
                </a>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default ClinicLocator;

