export type UserRole = 'PATIENT' | 'ASHA_WORKER' | 'DOCTOR';

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

// Triage Types
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

// Summary Types
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

// Facility Types
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

// Preset Scenarios
export interface PresetScenario {
  id: string;
  titleEn: string;
  titleHi: string;
  badge: string;
  promptHi: string;
  promptEn: string;
  expected: 'EMERGENCY' | 'SYMPTOM_ASSESSMENT' | 'FACILITY_LOOKUP';
}

// ASHA Danger Sign Criteria
export interface DangerSign {
  id: string;
  titleEn: string;
  titleHi: string;
  keywords: string[];
}
