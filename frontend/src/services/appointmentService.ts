import api from './api';
import {
  AppointmentCreateRequest,
  AppointmentResponse,
  AppointmentStatus,
  QueueEntryResponse,
  QueueStatus,
  WalkInRequest,
} from '../types';

export const appointmentService = {
  async getFacilityQueue(facilityId: string, statusFilter?: QueueStatus): Promise<QueueEntryResponse[]> {
    try {
      const params = statusFilter ? { status_filter: statusFilter } : {};
      const res = await api.get<QueueEntryResponse[]>(`/appointments/queue/facility/${facilityId}`, { params });
      return Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      console.warn('Failed to fetch facility queue:', err);
      return [];
    }
  },

  async getQueueEntry(queueId: string): Promise<QueueEntryResponse | null> {
    try {
      const res = await api.get<QueueEntryResponse>(`/appointments/queue/${queueId}`);
      return res.data;
    } catch (err) {
      console.warn('Failed to fetch queue entry:', err);
      return null;
    }
  },

  async issueWalkInToken(payload: WalkInRequest): Promise<QueueEntryResponse> {
    const res = await api.post<QueueEntryResponse>('/appointments/queue/walk-in', payload);
    return res.data;
  },

  async listAppointments(params?: {
    patient_id?: string;
    facility_id?: string;
    status_filter?: AppointmentStatus;
    requested_date?: string;
  }): Promise<AppointmentResponse[]> {
    try {
      const res = await api.get<AppointmentResponse[]>('/appointments', { params });
      console.log(res.data);
      return Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      console.warn('Failed to fetch appointments:', err);
      return [];
    }
  },

  async bookAppointment(payload: AppointmentCreateRequest): Promise<AppointmentResponse> {
    console.log(payload);
    const res = await api.post<AppointmentResponse>('/appointments', payload);
    return res.data;
  },

  async checkInAppointment(appointmentId: string): Promise<QueueEntryResponse> {
    const res = await api.post<QueueEntryResponse>(`/appointments/${appointmentId}/check-in`);
    return res.data;
  },

  async callPatient(queueId: string): Promise<QueueEntryResponse> {
    const res = await api.patch<QueueEntryResponse>(`/appointments/queue/${queueId}/call`);
    return res.data;
  },

  async startConsultation(queueId: string): Promise<QueueEntryResponse> {
    const res = await api.patch<QueueEntryResponse>(`/appointments/queue/${queueId}/start`);
    return res.data;
  },

  async completeConsultation(queueId: string): Promise<QueueEntryResponse> {
    const res = await api.patch<QueueEntryResponse>(`/appointments/queue/${queueId}/complete`);
    return res.data;
  },

  async skipPatient(queueId: string): Promise<QueueEntryResponse> {
    const res = await api.patch<QueueEntryResponse>(`/appointments/queue/${queueId}/skip`);
    return res.data;
  },

  async cancelQueueEntry(queueId: string): Promise<QueueEntryResponse> {
    const res = await api.delete<QueueEntryResponse>(`/appointments/queue/${queueId}`);
    return res.data;
  },

  // Cancel a booked appointment (before/without check-in). Patients can
  // cancel their own appointment; staff can cancel any.
  async cancelAppointment(appointmentId: string): Promise<AppointmentResponse> {
    const res = await api.patch<AppointmentResponse>(`/appointments/${appointmentId}/cancel`);
    return res.data;
  },

  // Staff-only administrative status correction (e.g. NO_SHOW). Sent as a
  // JSON body ({ new_status }) to match the backend's Body(embed=True) param.
  async updateAppointmentStatus(
    appointmentId: string,
    newStatus: AppointmentStatus
  ): Promise<AppointmentResponse> {
    const res = await api.patch<AppointmentResponse>(`/appointments/${appointmentId}/status`, {
      new_status: newStatus,
    });
    return res.data;
  },
};
