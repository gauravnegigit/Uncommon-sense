import React from 'react';
import { Phone, Navigation, Bed, ShieldAlert } from 'lucide-react';
import { Facility } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface FacilityCardProps {
  facility: Facility;
}

export const FacilityCard: React.FC<FacilityCardProps> = ({ facility }) => {
  const { t } = useLanguage();

  const coords = facility.location?.coordinates || [81.864, 25.492];
  // Backend GeoJSON coordinates are [lng, lat]
  const lng = coords[0];
  const lat = coords[1];
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  return (
    <div className="p-4 sm:p-5 rounded-3xl border border-slate-200/90 bg-white hover:border-emerald-400 hover:shadow-md transition-all flex flex-col justify-between group">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200">
            {facility.facility_type}
          </span>
          {facility.emergency_services ? (
            <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-black flex items-center gap-1 border border-red-200">
              <ShieldAlert className="w-3 h-3" />
              <span>24x7 Emergency</span>
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
              OPD 9AM - 4PM
            </span>
          )}
        </div>

        {/* Facility Name */}
        <h4 className="text-sm font-black text-slate-900 mb-1.5 leading-snug group-hover:text-emerald-700 transition-colors">
          {facility.name}
        </h4>

        {/* Metrics: Distance & Beds */}
        <div className="flex items-center gap-3 text-xs text-slate-600 mb-3">
          {typeof facility.distance_km === 'number' && (
            <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              📍 {facility.distance_km} km
            </span>
          )}
          {facility.available_beds > 0 && (
            <span className="flex items-center gap-1 font-semibold text-slate-700">
              <Bed className="w-3.5 h-3.5 text-indigo-600" />
              <span>{facility.available_beds} Beds</span>
            </span>
          )}
        </div>

        {/* Specialties Badges */}
        {facility.specialties && facility.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {facility.specialties.map((spec, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-full bg-slate-50 text-[10px] font-medium text-slate-600 border border-slate-100"
              >
                {spec}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
        {facility.contact_number ? (
          <a
            href={`tel:${facility.contact_number}`}
            className="flex-1 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-xs transition-all"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>{t('callNow')}</span>
          </a>
        ) : (
          <a
            href="tel:108"
            className="flex-1 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-xs transition-all"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>108 Ambulance</span>
          </a>
        )}

        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3.5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1 transition-colors"
          title={t('getDirections')}
        >
          <Navigation className="w-3.5 h-3.5 text-teal-600" />
          <span className="hidden sm:inline">{t('getDirections')}</span>
        </a>
      </div>
    </div>
  );
};
