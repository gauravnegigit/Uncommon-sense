import api from './api';
import {
  DiagnosticOrderCreateRequest,
  DiagnosticOrderResponse,
  DiagnosticStatus,
  DiagnosticStatusUpdateRequest,
} from '../types';

export const diagnosticService = {
  async listDiagnostics(params?: {
    patient_id?: string;
    facility_id?: string;
    status?: DiagnosticStatus;
  }): Promise<DiagnosticOrderResponse[]> {
    try {
      const res = await api.get<DiagnosticOrderResponse[]>('/diagnostics', { params });
      return Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      console.warn('Failed to fetch diagnostics from backend:', err);
      return [];
    }
  },

  async getDiagnostic(orderId: string): Promise<DiagnosticOrderResponse | null> {
    try {
      const res = await api.get<DiagnosticOrderResponse>(`/diagnostics/${orderId}`);
      return res.data || null;
    } catch (err) {
      console.warn('Failed to fetch diagnostic order:', err);
      return null;
    }
  },

  async createDiagnostic(payload: DiagnosticOrderCreateRequest): Promise<DiagnosticOrderResponse> {
    const res = await api.post<DiagnosticOrderResponse>('/diagnostics', payload);
    return res.data;
  },

  async updateDiagnosticStatus(
    orderId: string,
    payload: DiagnosticStatusUpdateRequest
  ): Promise<DiagnosticOrderResponse> {
    const res = await api.patch<DiagnosticOrderResponse>(`/diagnostics/${orderId}`, payload);
    return res.data;
  },
};
