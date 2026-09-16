import api from './api';
import {
  DashboardMetrics,
  FollowUpCreateRequest,
  FollowUpResponse,
} from '../types';

export const highriskService = {
  async listFollowups(params?: {
    patient_id?: string;
    facility_id?: string;
    is_high_risk?: boolean;
    status?: string;
  }): Promise<FollowUpResponse[]> {
    try {
      const res = await api.get<FollowUpResponse[]>('/followups', { params });
      return Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      console.warn('Failed to fetch followups:', err);
      return [];
    }
  },

  async createFollowup(payload: FollowUpCreateRequest): Promise<FollowUpResponse> {
    const res = await api.post<FollowUpResponse>('/followups', payload);
    return res.data;
  },

  async completeFollowup(followupId: string): Promise<FollowUpResponse> {
    const res = await api.patch<FollowUpResponse>(`/followups/${followupId}/complete`);
    return res.data;
  },

  async cancelFollowup(followupId: string): Promise<FollowUpResponse> {
    const res = await api.patch<FollowUpResponse>(`/followups/${followupId}/cancel`);
    return res.data;
  },

  async getFacilityDashboard(facilityId: string): Promise<DashboardMetrics | null> {
    try {
      const res = await api.get<DashboardMetrics>(`/dashboard/facility/${facilityId}`);
      return res.data || null;
    } catch (err) {
      console.warn('Failed to fetch facility dashboard metrics:', err);
      return null;
    }
  },

  async updateFacilityCapacity(facilityId: string, availableBeds: number): Promise<{ success: boolean }> {
    const res = await api.patch(`/facilities/${facilityId}/capacity`, { available_beds: availableBeds });
    return res.data || { success: true };
  },
};
