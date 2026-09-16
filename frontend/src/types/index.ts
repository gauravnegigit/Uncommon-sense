export type UserRole = 'PATIENT' | 'ASHA_WORKER' | 'DOCTOR';

export type PersonaRole = 'PATIENT' | 'ASHA_WORKER' | 'DOCTOR';

export type ModuleTab =
  | 'triage'
  | 'appointments'
  | 'patients'
  | 'referrals'
  | 'diagnostics'
  | 'inventory'
  | 'highrisk'
  | 'dashboard'
  | 'facilities'
  | 'guidelines'
  | 'history';

export interface User {
  id?: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role: string;
  created_at?: string;
}

export interface UserCreateRequest {
  name: string;
  email?: string | null;
  contact?: string | null; // formatted as +91... or E.164
  password: string;
  address?: string | null;
  pincode?: string | null;
  role?: string;
}

export interface SignupVerifyRequest {
  email?: string | null;
  email_otp?: string | null;
  phone?: string | null;
  phone_otp?: string | null;
}

export interface UserLoginRequest {
  identifier: string; // email or phone
  password: string;
  role?: string;
}

export interface UserResponse {
  id?: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role: string;
  message?: string | null;
  created_at: string;
}

export interface ForgotPasswordRequest {
  contact: string; // email or phone
}

export interface ResetPasswordRequest {
  contact: string;
  otp: string;
  new_password: string;
}

// ---------------------------------------------------------------------------
// Triage Types
// ---------------------------------------------------------------------------
export type TriageSeverity = 'EMERGENCY' | 'SYMPTOM_ASSESSMENT' | 'FACILITY_LOOKUP' | 'UNKNOWN';

export interface TriageMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  severity?: TriageSeverity;
  audioBlob?: Blob;
  dangerSignsDetected?: string[];
}

export interface ChatSession {
  id: string;
  title: string;
  date: string;
  messages: TriageMessage[];
  updatedAt?: string;
}

export interface TriageRequest {
  transcript: string;
  chat_id: string;
  language?: string;
}

export interface TriageResponse {
  severity: 'EMERGENCY' | 'FACILITY_LOOKUP' | 'SYMPTOM_ASSESSMENT' | string;
  content: string;
}

// ---------------------------------------------------------------------------
// Summary Types
// ---------------------------------------------------------------------------
export interface ClinicalSummaryResponse {
  summary_id: string;
  updated_at: string;
  situation: string;
  background: string;
  assessment: string;
  recommendation: string;
  severity_level: 'RED' | 'YELLOW' | 'GREEN' | string;
  guideline_references: string[];
  target_facility_type: string;
}

// ---------------------------------------------------------------------------
// Facility Types
// ---------------------------------------------------------------------------
export interface LocationCoordinates {
  lat: number;
  lng: number;
}

export interface FacilityLocation {
  type: string;
  coordinates: [number, number]; // [lng, lat]
}

export interface Facility {
  id: string;
  name: string;
  facility_type: string;
  specialties: string[];
  emergency_services: boolean;
  contact_number: string;
  available_beds: number;
  location: FacilityLocation;
  avg_consult_minutes?: number;
  distance_km?: number | null;
}

export interface RegionalLocation {
  name: string;
  pincode: string;
  lat: number;
  lng: number;
  phcsCount: number;
  emergencyBeds: number;
}

// ---------------------------------------------------------------------------
// Preset Scenarios & Danger Signs
// ---------------------------------------------------------------------------
export interface PresetScenario {
  id: string;
  titleEn: string;
  titleHi: string;
  titleMr?: string;
  badge: string;
  badgeHi?: string;
  badgeMr?: string;
  promptHi: string;
  promptEn: string;
  promptMr?: string;
  expected: 'EMERGENCY' | 'SYMPTOM_ASSESSMENT' | 'FACILITY_LOOKUP';
}

export interface DangerSign {
  id: string;
  titleEn: string;
  titleHi: string;
  titleMr?: string;
  keywords: string[];
}

// ---------------------------------------------------------------------------
// Appointment & Queue Types
// ---------------------------------------------------------------------------
export type AppointmentStatus = 'BOOKED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export type PreferredSlot = 'MORNING' | 'AFTERNOON' | 'EVENING';

export type QueueStatus =
  | 'WAITING'
  | 'CALLED'
  | 'IN_CONSULTATION'
  | 'COMPLETED'
  | 'SKIPPED'
  | 'CANCELLED';

export type PriorityLevel = 'NORMAL' | 'URGENT';

export interface AppointmentCreateRequest {
  patient_id: string;
  facility_id: string;
  requested_date: string; // YYYY-MM-DD
  preferred_slot: PreferredSlot;
  reason: string;
}

export interface AppointmentResponse {
  id: string;
  patient_id: string;
  facility_id: string;
  requested_date: string;
  preferred_slot: PreferredSlot;
  reason: string;
  status: AppointmentStatus;
  queue_id?: string | null;
  booked_by: string;
  created_at: string;
  updated_at: string;
}

export interface WalkInRequest {
  facility_id: string;
  patient_id: string;
  priority: PriorityLevel;
}

export interface QueueEntryResponse {
  id: string;
  facility_id: string;
  patient_id: string;
  token_number: number;
  priority: PriorityLevel;
  status: QueueStatus;
  queue_date: string;
  appointment_id?: string | null;
  position?: number | null;
  estimated_wait_minutes?: number | null;
  called_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Patient & Longitudinal Record Types
// ---------------------------------------------------------------------------
export interface PatientCreateRequest {
  name: string;
  age?: number | null;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
  phone?: string | null;
  address?: string | null;
  pincode?: string | null;
  preferred_language?: string;
  home_facility_id?: string | null;
}

export interface PatientUpdateRequest {
  name?: string;
  age?: number | null;
  gender?: string | null;
  phone?: string | null;
  address?: string | null;
  pincode?: string | null;
  preferred_language?: string;
  home_facility_id?: string | null;
}

export interface PatientResponse {
  id: string;
  name: string;
  age?: number | null;
  gender?: string | null;
  phone?: string | null;
  address?: string | null;
  pincode?: string | null;
  preferred_language: string;
  linked_user_id?: string | null;
  home_facility_id?: string | null;
  registered_by?: string | null;
  created_at: string;
  updated_at: string;
  abha_id?: string | null; // UI display convenience
  blood_group?: string | null;
  allergies?: string[];
  chronic_conditions?: string[];
}

export type RecordEntryType = 'NOTE' | 'OBSERVATION';

export interface RecordEntryCreateRequest {
  facility_id?: string | null;
  entry_type: RecordEntryType;
  content: string;
}

export interface RecordEntryResponse {
  id: string;
  patient_id: string;
  facility_id?: string | null;
  entry_type: string;
  content: string;
  recorded_by: string;
  created_at: string;
}

export interface TimelineEvent {
  type: 'consultation' | 'diagnostic' | 'referral' | 'followup' | 'note' | string;
  id: string;
  date: string;
  title: string;
  summary: string;
  facility_id?: string | null;
  severity_level?: string;
  status?: string;
}

// ---------------------------------------------------------------------------
// Closed-Loop Referral Types
// ---------------------------------------------------------------------------
export type ReferralStatus =
  | 'CREATED'
  | 'ACCEPTED'
  | 'QUEUED'
  | 'PATIENT_ARRIVED'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED';

export interface ReferralCreateRequest {
  patient_id: string;
  from_facility_id: string;
  to_facility_id: string;
  reason: string;
  priority: PriorityLevel;
}

export interface ReferralStatusUpdateRequest {
  new_status: ReferralStatus;
  queue_id?: string | null;
}

export interface ReferralResponse {
  id: string;
  patient_id: string;
  from_facility_id: string;
  to_facility_id: string;
  reason: string;
  priority: PriorityLevel;
  status: ReferralStatus;
  queue_id?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  patient_name?: string;
  from_facility_name?: string;
  to_facility_name?: string;
}

// ---------------------------------------------------------------------------
// Diagnostics & Specimen Types
// ---------------------------------------------------------------------------
export type DiagnosticStatus =
  | 'REQUESTED'
  | 'SAMPLE_COLLECTED'
  | 'PROCESSING'
  | 'RESULT_AVAILABLE'
  | 'CANCELLED';

export interface DiagnosticOrderCreateRequest {
  patient_id: string;
  facility_id: string;
  test_name: string;
  notes?: string | null;
}

export interface DiagnosticStatusUpdateRequest {
  new_status: DiagnosticStatus;
  result_summary?: string | null;
}

export interface DiagnosticOrderResponse {
  id: string;
  patient_id: string;
  facility_id: string;
  test_name: string;
  notes?: string | null;
  status: DiagnosticStatus;
  result_summary?: string | null;
  ordered_by: string;
  ordered_at: string;
  updated_at: string;
  result_available_at?: string | null;
  patient_name?: string;
  facility_name?: string;
}

// ---------------------------------------------------------------------------
// Medicine Inventory Types
// ---------------------------------------------------------------------------
export type StockStatus = 'AVAILABLE' | 'LOW_STOCK' | 'UNAVAILABLE';

export interface MedicineUpsertRequest {
  medicine_name: string;
  category?: string | null;
  status: StockStatus;
  quantity?: number | null;
}

export interface MedicineResponse {
  id: string;
  facility_id: string;
  medicine_name: string;
  category?: string | null;
  status: StockStatus;
  quantity?: number | null;
  updated_by: string;
  updated_at: string;
}

export interface MedicineFacilityMatch {
  facility_id: string;
  facility_name: string;
  distance_km: number;
  medicine_name: string;
  status: StockStatus;
  quantity?: number | null;
}

// ---------------------------------------------------------------------------
// High-Risk & Follow-up Types
// ---------------------------------------------------------------------------
export type FollowUpStoredStatus = 'OPEN' | 'COMPLETED' | 'CANCELLED';

export type FollowUpDisplayStatus =
  | 'UPCOMING'
  | 'DUE'
  | 'OVERDUE'
  | 'COMPLETED'
  | 'CANCELLED';

export interface FollowUpCreateRequest {
  patient_id: string;
  facility_id: string;
  reason: string;
  due_date: string; // YYYY-MM-DD
  is_high_risk?: boolean;
}

export interface FollowUpResponse {
  id: string;
  patient_id: string;
  facility_id: string;
  reason: string;
  due_date: string;
  is_high_risk: boolean;
  status: FollowUpDisplayStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
  patient_name?: string;
  facility_name?: string;
}

// ---------------------------------------------------------------------------
// Operational Facility Dashboard Types
// ---------------------------------------------------------------------------
export interface DashboardMetrics {
  facility_id: string;
  queue_waiting: number;
  queue_active_total: number;
  open_referrals_incoming: number;
  open_referrals_outgoing: number;
  diagnostics_in_progress: number;
  followups_due_today: number;
  followups_overdue: number;
  medicines_low_or_out: number;
}
