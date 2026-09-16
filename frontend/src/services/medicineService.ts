import api from './api';
import {
  MedicineFacilityMatch,
  MedicineResponse,
  MedicineUpsertRequest,
} from '../types';

export const medicineService = {
  async listFacilityMedicines(facilityId: string): Promise<MedicineResponse[]> {
    try {
      const res = await api.get<MedicineResponse[]>(`/medicines/facility/${facilityId}`);
      return Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      console.warn('Failed to fetch facility medicines:', err);
      return [];
    }
  },

  async upsertMedicineStock(
    facilityId: string,
    payload: MedicineUpsertRequest
  ): Promise<MedicineResponse> {
    const res = await api.put<MedicineResponse>(`/medicines/facility/${facilityId}`, payload);
    return res.data;
  },

  async deleteMedicine(facilityId: string, medicineName: string): Promise<void> {
    await api.delete(`/medicines/facility/${facilityId}/${encodeURIComponent(medicineName)}`);
  },

  async searchMedicineNearby(
    medicineName: string,
    lat: number = 25.49,
    lng: number = 81.86,
    radiusKm: number = 15,
    includeLowStock: boolean = true
  ): Promise<MedicineFacilityMatch[]> {
    try {
      const res = await api.get<MedicineFacilityMatch[]>('/medicines/search', {
        params: {
          medicine_name: medicineName,
          lat,
          lng,
          radius_km: radiusKm,
          include_low_stock: includeLowStock,
        },
      });
      return Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      console.warn('Failed to search nearby medicines:', err);
      return [];
    }
  },
};
