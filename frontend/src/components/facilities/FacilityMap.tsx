import React, { useEffect, useRef } from 'react';
import { Facility } from '../../types';
import L from 'leaflet';

interface FacilityMapProps {
  facilities: Facility[];
  userLat: number;
  userLng: number;
  locationName: string;
}

export const FacilityMap: React.FC<FacilityMapProps> = ({
  facilities,
  userLat,
  userLng,
  locationName,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean previous map instance if exists
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    try {
      const map = L.map(mapContainerRef.current).setView([userLat, userLng], 12);
      mapInstanceRef.current = map;

      // OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);

      // User location marker (Blue Pulsing Marker)
      const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: `<div style="background-color: #2563eb; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(37,99,235,0.8);"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      L.marker([userLat, userLng], { icon: userIcon })
        .addTo(map)
        .bindPopup(`<b>📍 ${locationName}</b><br/>Your Selected Location`);

      // Facility markers
      facilities.forEach((fac) => {
        const coords = fac.location?.coordinates;
        if (!coords || coords.length < 2) return;

        const facLng = coords[0];
        const facLat = coords[1];
        const isEm = fac.emergency_services;

        const facIcon = L.divIcon({
          className: 'custom-facility-marker',
          html: `<div style="background-color: ${
            isEm ? '#dc2626' : '#16a34a'
          }; color: white; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">🏥</div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });

        const popupContent = `
          <div style="font-family: system-ui; font-size: 12px; min-width: 160px;">
            <b style="color: #0f172a; font-size: 13px;">${fac.name}</b><br/>
            <span style="color: ${isEm ? '#dc2626' : '#16a34a'}; font-weight: bold;">${fac.facility_type} ${
          isEm ? '• 24x7 Emergency' : ''
        }</span><br/>
            ${fac.distance_km ? `<span>📍 ${fac.distance_km} km away</span><br/>` : ''}
            ${fac.available_beds > 0 ? `<span>🛏️ ${fac.available_beds} Beds Available</span><br/>` : ''}
            ${
              fac.contact_number
                ? `<a href="tel:${fac.contact_number}" style="color: #059669; font-weight: bold; text-decoration: underline;">📞 ${fac.contact_number}</a>`
                : ''
            }
          </div>
        `;

        L.marker([facLat, facLng], { icon: facIcon }).addTo(map).bindPopup(popupContent);
      });
    } catch (e) {
      console.warn('Map initialization note:', e);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [facilities, userLat, userLng, locationName]);

  return (
    <div className="relative w-full h-[360px] sm:h-[420px] rounded-3xl overflow-hidden border border-slate-200 shadow-sm z-0">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};
