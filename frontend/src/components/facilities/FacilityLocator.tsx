import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  PhoneCall,
  Compass,
  Filter,
  Layers,
  Map as MapIcon,
  List,
  AlertCircle,
  RotateCw,
} from 'lucide-react';
import { Facility, RegionalLocation } from '../../types';
import { facilityService } from '../../services/facilityService';
import { REGIONAL_LOCATIONS } from '../../config/constants';
import { useLanguage } from '../../context/LanguageContext';
import { FacilityCard } from './FacilityCard';
import { FacilityMap } from './FacilityMap';

// Sample fallback facilities if backend DB is unseeded
const SAMPLE_FALLBACK_FACILITIES: Facility[] = [
  {
    id: 'f1',
    name: 'Primary Health Centre (PHC) Phaphamau',
    facility_type: 'PHC',
    emergency_services: true,
    contact_number: '+91 532 244 5101',
    available_beds: 6,
    location: { type: 'Point', coordinates: [81.861, 25.495] },
    specialties: ['General Medicine', 'Maternal Health', 'Immunization', 'First Aid'],
    distance_km: 1.2,
  },
  {
    id: 'f2',
    name: 'Community Health Centre (CHC) Soraon',
    facility_type: 'CHC',
    emergency_services: true,
    contact_number: '+91 532 244 5800',
    available_beds: 30,
    location: { type: 'Point', coordinates: [81.852, 25.578] },
    specialties: ['General Surgery', 'Obstetrics & Gynaecology', 'Paediatrics', '24x7 Delivery', 'X-Ray'],
    distance_km: 7.8,
  },
  {
    id: 'f3',
    name: 'Tej Bahadur Sapru (Beli) District Hospital',
    facility_type: 'HOSPITAL',
    emergency_services: true,
    contact_number: '+91 532 254 0200',
    available_beds: 180,
    location: { type: 'Point', coordinates: [81.834, 25.449] },
    specialties: ['Emergency Trauma Care', 'ICU', 'Cardiology', 'Orthopaedics', 'Blood Bank'],
    distance_km: 8.5,
  },
  {
    id: 'f4',
    name: 'Health & Wellness Sub-Centre (Arogya Mandir) Malaka',
    facility_type: 'CLINIC',
    emergency_services: false,
    contact_number: '+91 94150 12345',
    available_beds: 2,
    location: { type: 'Point', coordinates: [81.875, 25.512] },
    specialties: ['NCD Screening', 'Basic Diagnostics', 'Tele-Consultation'],
    distance_km: 3.1,
  },
];

export const FacilityLocator: React.FC = () => {
  const { t, isHindi } = useLanguage();

  // Location state
  const [currentLocation, setCurrentLocation] = useState<RegionalLocation>(() => {
    const saved = localStorage.getItem('gramin_saved_location');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return REGIONAL_LOCATIONS[0];
  });

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isDetectingGPS, setIsDetectingGPS] = useState(false);

  // Filters & display
  const [filterType, setFilterType] = useState<string>('ALL'); // 'ALL' | 'EMERGENCY' | 'PHC' | 'CHC' | 'HOSPITAL'
  const [radiusKm, setRadiusKm] = useState<number>(20);
  const [viewMode, setViewMode] = useState<'both' | 'list' | 'map'>('both');

  // Facilities data
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch facilities from Backend API
  const fetchFacilities = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const isEmergencyOnly = filterType === 'EMERGENCY';
      const facilityTypeParam = filterType !== 'ALL' && filterType !== 'EMERGENCY' ? filterType : undefined;

      const data = await facilityService.getNearbyFacilities({
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        radius_km: radiusKm,
        facility_type: facilityTypeParam,
        emergency_services: isEmergencyOnly ? true : undefined,
      });

      if (data && data.length > 0) {
        setFacilities(data);
      } else {
        // If backend database returns empty list (e.g. fresh DB before full seed), use regional dataset
        const filteredFallback = SAMPLE_FALLBACK_FACILITIES.filter((f) => {
          if (filterType === 'EMERGENCY') return f.emergency_services;
          if (filterType !== 'ALL') return f.facility_type === filterType;
          return true;
        });
        setFacilities(filteredFallback);
      }
    } catch (err: any) {
      console.warn('Backend facilities fetch error, using local fallback:', err);
      const filteredFallback = SAMPLE_FALLBACK_FACILITIES.filter((f) => {
        if (filterType === 'EMERGENCY') return f.emergency_services;
        if (filterType !== 'ALL') return f.facility_type === filterType;
        return true;
      });
      setFacilities(filteredFallback);
    } finally {
      setLoading(false);
    }
  }, [currentLocation, filterType, radiusKm]);

  useEffect(() => {
    fetchFacilities();
    localStorage.setItem('gramin_saved_location', JSON.stringify(currentLocation));
  }, [fetchFacilities, currentLocation]);

  // GPS Detection
  const handleDetectGPS = () => {
    if (!('geolocation' in navigator)) {
      alert(isHindi ? 'ब्राउज़र में GPS उपलब्ध नहीं है।' : 'Geolocation is not supported by your browser.');
      return;
    }

    setIsDetectingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const detected: RegionalLocation = {
          name: `GPS Location (${pos.coords.latitude.toFixed(3)}°N, ${pos.coords.longitude.toFixed(3)}°E)`,
          pincode: 'Auto',
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          phcsCount: 4,
          emergencyBeds: 150,
        };
        setCurrentLocation(detected);
        setIsDetectingGPS(false);
        setIsLocationModalOpen(false);
      },
      (err) => {
        console.warn('GPS Error:', err);
        alert(
          isHindi
            ? 'GPS अनुमति प्राप्त नहीं हुई। कृपया नीचे दी गई सूची से अपना क्षेत्र चुनें।'
            : 'GPS permission denied or unavailable. Please pick a regional hub from the list.'
        );
        setIsDetectingGPS(false);
      },
      { timeout: 10000 }
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 text-[10px] font-black uppercase tracking-wider border border-teal-200">
                GEOSPATIAL REFERRAL ROUTER
              </span>
              <span className="text-xs text-slate-500 font-bold">
                • {facilities.length} {isHindi ? 'केंद्र उपलब्ध' : 'Facilities Listed'}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              📍 {t('facilitySearchTitle')}
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 font-hindi mt-1">
              {isHindi
                ? `सक्रिय लोकेशन: ${currentLocation.name} (अक्षांश: ${currentLocation.lat.toFixed(3)}, देशांतर: ${currentLocation.lng.toFixed(3)})`
                : `Active Location: ${currentLocation.name} (Lat: ${currentLocation.lat.toFixed(3)}, Lng: ${currentLocation.lng.toFixed(3)})`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Location Selector Button */}
            <button
              onClick={() => setIsLocationModalOpen(true)}
              className="px-4 py-2.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-black flex items-center gap-1.5 shadow-xs transition-all"
            >
              <MapPin className="w-4 h-4 text-emerald-700" />
              <span className="max-w-[150px] truncate">{currentLocation.name}</span>
            </button>

            {/* 108 Emergency Call */}
            <a
              href="tel:108"
              className="px-4 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-black flex items-center gap-1.5 shadow-xs transition-all animate-pulse"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>108 {t('callNow')}</span>
            </a>
          </div>
        </div>

        {/* Filters & View Toggles */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Facility Type Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 custom-scrollbar">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all ${
                filterType === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {t('filterAll')}
            </button>

            <button
              onClick={() => setFilterType('EMERGENCY')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all ${
                filterType === 'EMERGENCY'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
              }`}
            >
              🚨 {t('filterEmergency')}
            </button>

            <button
              onClick={() => setFilterType('PHC')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all ${
                filterType === 'PHC'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {t('filterPHC')}
            </button>

            <button
              onClick={() => setFilterType('CHC')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all ${
                filterType === 'CHC'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {t('filterCHC')}
            </button>

            <button
              onClick={() => setFilterType('HOSPITAL')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all ${
                filterType === 'HOSPITAL'
                  ? 'bg-indigo-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {t('filterHospital')}
            </button>
          </div>

          {/* Radius selector & View Toggle */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
              <span>{t('searchRadius')}</span>
              <select
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
              >
                <option value={10}>10 km</option>
                <option value={20}>20 km</option>
                <option value={35}>35 km</option>
                <option value={50}>50 km</option>
              </select>
            </div>

            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
              <button
                onClick={() => setViewMode('both')}
                className={`p-1.5 rounded-md text-xs font-bold ${
                  viewMode === 'both' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
                title="Both List and Map"
              >
                <Layers className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md text-xs font-bold ${
                  viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
                title="List Only"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`p-1.5 rounded-md text-xs font-bold ${
                  viewMode === 'map' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
                title="Map Only"
              >
                <MapIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Facilities View Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Map View */}
        {(viewMode === 'both' || viewMode === 'map') && (
          <div className={`${viewMode === 'map' ? 'lg:col-span-12' : 'lg:col-span-6'} space-y-2`}>
            <div className="bg-white p-3 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>🗺️ Interactive Facility Map</span>
              <span className="text-emerald-700">Live GPS & Coordinates</span>
            </div>
            <FacilityMap
              facilities={facilities}
              userLat={currentLocation.lat}
              userLng={currentLocation.lng}
              locationName={currentLocation.name}
            />
          </div>
        )}

        {/* Facilities List Cards */}
        {(viewMode === 'both' || viewMode === 'list') && (
          <div
            className={`${
              viewMode === 'list' ? 'lg:col-span-12' : 'lg:col-span-6'
            } space-y-4`}
          >
            {loading ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
                <span className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin inline-block"></span>
                <p className="text-xs text-slate-500 font-bold">
                  {isHindi ? 'नजदीकी स्वास्थ्य केंद्रों की दूरी खोजी जा रही है...' : 'Querying geospatial database for nearby centers...'}
                </p>
              </div>
            ) : facilities.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-bold text-slate-700">{t('noFacilitiesFound')}</p>
                <button
                  onClick={() => setRadiusKm(50)}
                  className="px-4 py-2 rounded-full bg-emerald-600 text-white text-xs font-bold"
                >
                  Expand search radius to 50 km
                </button>
              </div>
            ) : (
              <div
                className={`grid gap-4 ${
                  viewMode === 'list' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'
                }`}
              >
                {facilities.map((fac) => (
                  <FacilityCard key={fac.id} facility={fac} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Location Selector Modal */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">
                📍 {t('locationTrackerTitle')}
              </h3>
              <button
                onClick={() => setIsLocationModalOpen(false)}
                className="text-slate-400 hover:text-slate-900 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 font-hindi">
              {isHindi
                ? 'अपनी सक्रिय लोकेशन चुनें जिससे निकटतम प्राथमिक स्वास्थ्य केंद्र (PHC) एवं आपातकालीन बेड की उपलब्धता दिखाई जा सके।'
                : 'Select your active location to display nearby Primary Health Centres (PHC) and 24x7 emergency bed availability.'}
            </p>

            {/* GPS Auto Detect Button */}
            <button
              onClick={handleDetectGPS}
              disabled={isDetectingGPS}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md transition-all"
            >
              <Compass className={`w-4 h-4 ${isDetectingGPS ? 'animate-spin' : ''}`} />
              <span>
                {isDetectingGPS
                  ? isHindi
                    ? 'GPS लोकेशन खोजी जा रही है...'
                    : 'Detecting GPS coordinates...'
                  : t('findNearMe')}
              </span>
            </button>

            <div className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {isHindi ? '— या क्षेत्रीय स्वास्थ्य केंद्र हब चुनें —' : '— Or Select Regional Health Hub —'}
            </div>

            {/* Regional Hubs List */}
            <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
              {REGIONAL_LOCATIONS.map((loc, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setCurrentLocation(loc);
                    setIsLocationModalOpen(false);
                  }}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    currentLocation.name === loc.name
                      ? 'border-emerald-500 bg-emerald-50/80 font-bold shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">{loc.name}</h5>
                    <span className="text-[10px] text-slate-500">
                      Pincode: {loc.pincode} • ({loc.lat.toFixed(2)}°N, {loc.lng.toFixed(2)}°E)
                    </span>
                  </div>
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold">
                    {loc.phcsCount} PHCs • {loc.emergencyBeds} Beds
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
