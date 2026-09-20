import api from './api';
import {
  PriorityLevel,
  ReferralCreateRequest,
  ReferralResponse,
  ReferralStatus,
  ReferralStatusUpdateRequest,
} from '../types';

export const referralService = {
  async listReferrals(params?: {
    patient_id?: string;
    from_facility_id?: string;
    to_facility_id?: string;
    status?: ReferralStatus;
    priority?: PriorityLevel;
  }): Promise<ReferralResponse[]> {
    try {
      const res = await api.get<ReferralResponse[]>('/referrals', { params });
      return Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      console.warn('Failed to fetch referrals from backend:', err);
      return [];
    }
  },

  async getReferral(referralId: string): Promise<ReferralResponse | null> {
    try {
      const res = await api.get<ReferralResponse>(`/referrals/${referralId}`);
      return res.data || null;
    } catch (err) {
      console.warn('Failed to fetch referral:', err);
      return null;
    }
  },

  async createReferral(payload: ReferralCreateRequest): Promise<ReferralResponse> {
    const res = await api.post<ReferralResponse>('/referrals', payload);
    return res.data;
  },

  async updateReferralStatus(
    referralId: string,
    payload: ReferralStatusUpdateRequest
  ): Promise<ReferralResponse> {
    const res = await api.patch<ReferralResponse>(`/referrals/${referralId}/status`, payload);
    return res.data;
  },
};
