import api from './api';
import { Facility } from '../types';

export interface NearbyFacilitiesParams {
  lat: number;
  lng: number;
  radius_km?: number;
  facility_type?: string;
  specialty?: string;
  emergency_services?: boolean;
  limit?: number;
}

export const facilityService = {
  // List/search facilities by name or type. Used to populate facility
  // pickers (referrals, appointments, inventory, dashboards) with real
  // facility IDs instead of hardcoded placeholders.
  async listFacilities(params?: {
    q?: string;
    facility_type?: string;
    specialty?: string;
    limit?: number;
    skip?: number;
  }): Promise<Facility[]> {
    try {
      const res = await api.get<Facility[]>('/facilities', { params });
      return Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      console.warn('Failed to fetch facilities:', err);
      return [];
    }
  },

  // Get nearby facilities based on coordinates
  async getNearbyFacilities(params: NearbyFacilitiesParams): Promise<Facility[]> {
    const cleanParams: Record<string, any> = {
      lat: params.lat,
      lng: params.lng,
      radius_km: params.radius_km || 15,
      limit: params.limit || 20,
    };

    if (params.facility_type && params.facility_type !== 'ALL') {
      cleanParams.facility_type = params.facility_type;
    }
    if (params.specialty) {
      cleanParams.specialty = params.specialty;
    }
    if (typeof params.emergency_services === 'boolean') {
      cleanParams.emergency_services = params.emergency_services;
    }

    const response = await api.get<Facility[]>('/facilities/nearby', {
      params: cleanParams,
    });
    return response.data;
  },

  // Get 24x7 emergency facilities
  async getEmergencyFacilities(lat: number, lng: number, radiusKm: number = 25): Promise<Facility[]> {
    const response = await api.get<Facility[]>('/facilities/emergency', {
      params: {
        lat,
        lng,
        radius_km: radiusKm,
        limit: 10,
      },
    });
    return response.data;
  },

  // Get specific facility by ID
  async getFacilityById(facilityId: string): Promise<Facility> {
    const response = await api.get<Facility>(`/facilities/${facilityId}`);
    return response.data;
  },
};
