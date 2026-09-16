import api from './api';
import {
  PatientCreateRequest,
  PatientResponse,
  PatientUpdateRequest,
  RecordEntryCreateRequest,
  RecordEntryResponse,
  TimelineEvent,
} from '../types';

export const patientService = {
  async listPatients(query?: string): Promise<PatientResponse[]> {
    try {
      const res = await api.get<PatientResponse[]>('/patients');
      const list = Array.isArray(res.data) ? res.data : [];
      if (!query || !query.trim()) return list;
      const q = query.toLowerCase().trim();
      return list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.phone?.includes(q) ||
          p.id?.toLowerCase().includes(q) ||
          p.pincode?.includes(q)
      );
    } catch (err) {
      console.warn('Failed to fetch patients from backend:', err);
      return [];
    }
  },

  async getMyPatientProfile(): Promise<PatientResponse | null> {
    try {
      const res = await api.get<PatientResponse>('/patients/me');
      return res.data || null;
    } catch (err) {
      console.warn('Failed to fetch my patient profile:', err);
      return null;
    }
  },

  async getPatient(id: string): Promise<PatientResponse | null> {
    try {
      const res = await api.get<PatientResponse>(`/patients/${id}`);
      return res.data || null;
    } catch (err) {
      console.warn('Failed to fetch patient by id:', err);
      return null;
    }
  },

  async createPatient(payload: PatientCreateRequest): Promise<PatientResponse> {
    const res = await api.post<PatientResponse>('/patients', payload);
    return res.data;
  },

  async updatePatient(id: string, payload: PatientUpdateRequest): Promise<PatientResponse> {
    const res = await api.patch<PatientResponse>(`/patients/${id}`, payload);
    return res.data;
  },

  async getPatientTimeline(patientId: string, limit: number = 100): Promise<TimelineEvent[]> {
    try {
      const res = await api.get<TimelineEvent[]>(`/patient-records/patients/${patientId}/timeline`, {
        params: { limit },
      });
      return Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      console.warn('Failed to fetch patient timeline:', err);
      return [];
    }
  },

  async addRecordEntry(patientId: string, payload: RecordEntryCreateRequest): Promise<RecordEntryResponse> {
    const res = await api.post<RecordEntryResponse>(
      `/patient-records/patients/${patientId}/entries`,
      payload
    );
    return res.data;
  },
};
