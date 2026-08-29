import api from './api';
import {
  UserCreateRequest,
  SignupVerifyRequest,
  UserLoginRequest,
  UserResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  User,
} from '../types';

/**
 * Format phone number to E.164 (+91...) format required by backend regex
 */
export function formatPhoneNumber(contact: string): string {
  const clean = contact.trim().replace(/[\s-]/g, '');
  if (!clean) return '';
  if (clean.includes('@')) {
    return clean.toLowerCase();
  }
  // If starts with +, return as is
  if (clean.startsWith('+')) {
    return clean;
  }
  // If 10 digits (standard Indian mobile number), prepend +91
  if (/^\d{10}$/.test(clean)) {
    return `+91${clean}`;
  }
  // If starts with 91 and 12 digits, prepend +
  if (/^91\d{10}$/.test(clean)) {
    return `+${clean}`;
  }
  // If starts with 0 and 11 digits, replace 0 with +91
  if (/^0\d{10}$/.test(clean)) {
    return `+91${clean.substring(1)}`;
  }
  return clean.startsWith('+') ? clean : `+${clean}`;
}

export const authService = {
  // Initiate Signup - can register via phone only, email only, or both
  async initiateSignup(payload: UserCreateRequest): Promise<UserResponse> {
    const formattedPayload: Record<string, any> = {
      name: payload.name.trim(),
      password: payload.password,
      address: payload.address?.trim() || '',
      pincode: payload.pincode?.trim() || '',
      role: payload.role || 'PATIENT',
      contact: payload.contact ? formatPhoneNumber(payload.contact) : '',
      email: payload.email?.trim().toLowerCase() || null,
    };

    const response = await api.post<UserResponse>('/auth/signup/initiate', formattedPayload);
    return response.data;
  },

  // Verify Signup OTP - accepts phone_otp, email_otp, or both
  async verifySignup(payload: SignupVerifyRequest): Promise<{ success: boolean; message: string; user: User }> {
    const formattedPayload: Record<string, any> = {};

    if (payload.phone) {
      formattedPayload.phone = formatPhoneNumber(payload.phone);
      if (payload.phone_otp) {
        formattedPayload.phone_otp = payload.phone_otp.trim();
      }
    }

    if (payload.email) {
      formattedPayload.email = payload.email.trim().toLowerCase();
      if (payload.email_otp) {
        formattedPayload.email_otp = payload.email_otp.trim();
      }
    }

    const response = await api.post<{ success: boolean; message: string; user: User }>(
      '/auth/signup/verify',
      formattedPayload
    );
    return response.data;
  },

  // Login
  async login(payload: UserLoginRequest): Promise<UserResponse> {
    const isPhone = !payload.identifier.includes('@');
    const formattedIdentifier = isPhone
      ? formatPhoneNumber(payload.identifier)
      : payload.identifier.trim().toLowerCase();

    const response = await api.post<UserResponse>('/auth/login', {
      identifier: formattedIdentifier,
      password: payload.password,
      role: payload.role || 'PATIENT',
    });
    return response.data;
  },

  // Get Current Logged In User
  async getMe(): Promise<UserResponse> {
    const response = await api.get<UserResponse>('/auth/me');
    return response.data;
  },

  // Forgot Password
  async forgotPassword(payload: ForgotPasswordRequest): Promise<{ success: boolean; message: string }> {
    const isPhone = !payload.contact.includes('@');
    const formattedContact = isPhone
      ? formatPhoneNumber(payload.contact)
      : payload.contact.trim().toLowerCase();

    const response = await api.post<{ success: boolean; message: string }>('/auth/forgot-password', {
      contact: formattedContact,
    });
    return response.data;
  },

  // Reset Password
  async resetPassword(payload: ResetPasswordRequest): Promise<{ success: boolean; message: string }> {
    const isPhone = !payload.contact.includes('@');
    const formattedContact = isPhone
      ? formatPhoneNumber(payload.contact)
      : payload.contact.trim().toLowerCase();

    const response = await api.post<{ success: boolean; message: string }>('/auth/reset-password', {
      contact: formattedContact,
      otp: payload.otp.trim(),
      new_password: payload.new_password,
    });
    return response.data;
  },

  // Logout
  async logout(): Promise<{ success: boolean; message: string }> {
    const response = await api.post<{ success: boolean; message: string }>('/auth/logout');
    return response.data;
  },
};
