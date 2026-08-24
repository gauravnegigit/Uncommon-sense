import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, Phone, Activity, Clock, ShieldCheck, Ambulance, HeartPulse, Search, Filter } from 'lucide-react';
import clinicService from '../services/clinicService';

// Custom Leaflet Pin Icons using SVG Data URIs
const createCustomIcon = (bgColor, iconText) => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="
        background-color: ${bgColor};
        width: 34px;
        height: 34px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2.5px solid white;
        box-shadow: 0 4px 10px rgba(0,0,0,0.25);
      ">
        <span style="
          transform: rotate(45deg);
          color: white;
          font-weight: bold;
          font-size: 13px;
          font-family: sans-serif;
        ">${iconText}</span>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -32]
  });
};

const PHC_ICON = createCustomIcon('#0d9488', '🏥');
const CHC_ICON = createCustomIcon('#0284c7', '🏢');
const SUB_ICON = createCustomIcon('#10b981', '🩺');
const MMU_ICON = createCustomIcon('#8b5cf6', '🚐');
const USER_ICON = createCustomIcon('#e11d48', '📍');

// Recenter helper component
const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

const MapView = ({ onSelectClinic, selectedClinicId, height = '450px' }) => {
  const [clinics, setClinics] = useState([]);
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [userLocation, setUserLocation] = useState({ lat: 22.4350, lng: 87.3300 }); // Default Rural District Center
  const [mapCenter, setMapCenter] = useState([22.4350, 87.3300]);
  const [mapZoom, setMapZoom] = useState(12);

  useEffect(() => {
    fetchClinics();
  }, [filterType, searchQuery]);

  const fetchClinics = async () => {
    const res = await clinicService.getClinics(searchQuery, filterType);
    if (res.clinics) {
      setClinics(res.clinics);
      if (selectedClinicId) {
        const found = res.clinics.find(c => c.id === selectedClinicId);
        if (found) {
          setSelectedClinic(found);
          setMapCenter([found.lat, found.lng]);
        }
      }
    }
  };

  const handleClinicClick = (clinic) => {
    setSelectedClinic(clinic);
    setMapCenter([clinic.lat, clinic.lng]);
    setMapZoom(14);
    if (onSelectClinic) {
      onSelectClinic(clinic);
    }
  };

  const getUserGeolocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          setMapCenter([loc.lat, loc.lng]);
          setMapZoom(13);
        },
        (err) => {
          console.warn('Geolocation denied, using district default', err);
        }
      );
    }
  };

  const getMarkerIcon = (type) => {
    switch (type) {
      case 'PHC': return PHC_ICON;
      case 'CHC': return CHC_ICON;
      case 'SUBCENTRE': return SUB_ICON;
      case 'MOBILE_VAN': return MMU_ICON;
      default: return PHC_ICON;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slatecalm-200/80 shadow-soft overflow-hidden flex flex-col">
      {/* Map Control Header */}
      <div className="p-4 bg-slatecalm-50/90 border-b border-slatecalm-200/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-tealmed-100 flex items-center justify-center text-tealmed-700">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slatecalm-800">Rural Health Facilities & PHC Map</h3>
            <p className="text-xs text-slatecalm-500">Live GPS locator for medical aid and 24x7 ambulance posts</p>
          </div>
        </div>

        {/* Quick Location & Filters */}
        <div className="flex items-center gap-2">
          <button
            onClick={getUserGeolocation}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slatecalm-200 text-slatecalm-700 hover:text-tealmed-700 text-xs rounded-lg shadow-xs transition-colors"
          >
            <Navigation className="w-3.5 h-3.5 text-tealmed-600" />
            <span>My Location</span>
          </button>

          {/* Type Filter */}
          <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slatecalm-200 text-xs">
            <Filter className="w-3 h-3 text-slatecalm-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-transparent text-slatecalm-700 font-medium focus:outline-none cursor-pointer text-xs"
            >
              <option value="ALL">All Facilities ({clinics.length})</option>
              <option value="PHC">Primary Health Centres (PHC)</option>
              <option value="CHC">Community Health Centres (CHC)</option>
              <option value="SUBCENTRE">Health Sub-Centres</option>
              <option value="MOBILE_VAN">Mobile Medical Vans</option>
            </select>
          </div>
        </div>
      </div>

      {/* Map Content Area */}
      <div className="relative w-full" style={{ height }}>
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          scrollWheelZoom={false}
          className="w-full h-full"
        >
          <ChangeView center={mapCenter} zoom={mapZoom} />
          {/* Calming OpenStreetMap tile layer */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* User Location Marker */}
          <Marker position={[userLocation.lat, userLocation.lng]} icon={USER_ICON}>
            <Popup>
              <div className="text-xs p-1">
                <p className="font-bold text-rose-600">Your Current Village GPS Point</p>
                <p className="text-slatecalm-500">Coordinates: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</p>
              </div>
            </Popup>
          </Marker>

          {/* Clinic Markers */}
          {clinics.map((clinic) => (
            <Marker
              key={clinic.id}
              position={[clinic.lat, clinic.lng]}
              icon={getMarkerIcon(clinic.type)}
              eventHandlers={{
                click: () => handleClinicClick(clinic)
              }}
            >
              <Popup>
                <div className="p-1 max-w-[220px]">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-tealmed-100 text-tealmed-800">
                      {clinic.type}
                    </span>
                    <span className="text-[11px] text-slatecalm-500 font-semibold">{clinic.distanceKm} km away</span>
                  </div>
                  <h4 className="font-bold text-slatecalm-900 text-xs leading-tight mb-1">{clinic.name}</h4>
                  <p className="text-[11px] text-slatecalm-600 mb-2">{clinic.address}</p>
                  
                  <div className="text-[11px] text-emerald-700 bg-emerald-50 px-1.5 py-1 rounded mb-2 flex items-center gap-1 font-medium">
                    <Clock className="w-3 h-3 text-emerald-600" />
                    <span>{clinic.isOpen ? 'Open Now' : 'Closed'}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <a
                      href={`tel:${clinic.phone}`}
                      className="flex-1 py-1 px-2 bg-tealmed-600 hover:bg-tealmed-700 text-white text-[11px] font-medium rounded text-center"
                    >
                      Call PHC
                    </a>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${clinic.lat},${clinic.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1 px-2 bg-slatecalm-100 hover:bg-slatecalm-200 text-slatecalm-700 text-[11px] rounded"
                    >
                      Directions
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Quick Legend Overlay */}
        <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 backdrop-blur-sm p-2.5 rounded-xl border border-slatecalm-200 shadow-sm text-[11px] flex flex-wrap gap-2.5 items-center">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-tealmed-600" />
            <span className="text-slatecalm-700 font-medium">PHC</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
            <span className="text-slatecalm-700 font-medium">CHC</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slatecalm-700 font-medium">Sub-Centre</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span className="text-slatecalm-700 font-medium">Mobile Unit</span>
          </div>
        </div>
      </div>

      {/* Selected Clinic Quick Drawer Card */}
      {selectedClinic && (
        <div className="p-4 bg-tealmed-50/40 border-t border-tealmed-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-tealmed-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              {selectedClinic.type}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slatecalm-900 text-sm">{selectedClinic.name}</h4>
                <span className="text-xs bg-tealmed-100 text-tealmed-800 font-semibold px-2 py-0.5 rounded-full">
                  {selectedClinic.distanceKm} km
                </span>
              </div>
              <p className="text-xs text-slatecalm-600 mt-0.5">{selectedClinic.address}</p>
              
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="text-slatecalm-600">
                  <strong>Doctors:</strong> {selectedClinic.doctorsAvailable.map(d => d.name).join(', ')}
                </span>
                <span className="text-slatecalm-600">
                  <strong>Beds:</strong> {selectedClinic.beds.available} / {selectedClinic.beds.total} Available
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`tel:${selectedClinic.phone}`}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-tealmed-300 text-tealmed-800 hover:bg-tealmed-50 text-xs font-semibold rounded-lg shadow-xs"
            >
              <Phone className="w-3.5 h-3.5 text-tealmed-600" />
              <span>{selectedClinic.phone}</span>
            </a>
            <a
              href={`tel:${selectedClinic.emergencyPhone}`}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs"
            >
              <Ambulance className="w-3.5 h-3.5 text-white" />
              <span>108 Ambulance</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;

