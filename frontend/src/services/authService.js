import api from './api';

// Realistic Mock Users for instant testing & demoing (Strictly Patient and Doctor)
const DEMO_USERS = {
  patient: {
    id: 'pat-101',
    name: 'Ramesh Kumar',
    phone: '+91 98765 43210',
    email: 'ramesh.kumar@gramin.in',
    role: 'patient',
    village: 'Sonapur, Block B',
    pincode: '721101',
    abhaId: '91-4521-8890-1234',
    token: 'mock_jwt_token_patient_ramesh_xyz123'
  },
  doctor: {
    id: 'doc-303',
    name: 'Dr. Ananya Roy, MD',
    phone: '+91 91234 56789',
    email: 'dr.ananya@health.gov.in',
    role: 'doctor',
    hospital: 'Rampur Community Health Centre',
    mciReg: 'MCI-WB-2018-8842',
    token: 'mock_jwt_token_doc_ananya_xyz789'
  }
};

export const authService = {
  // Login with phone/email and password for Patient or Doctor
  async login(credentials) {
    try {
      const response = await api.post('/auth/login', {
        identifier: credentials.identifier || credentials.phone || credentials.email,
        password: credentials.password,
        role: credentials.role || 'patient'
      });
      const token = response.data.access_token || response.data.token;
      if (token) {
        localStorage.setItem('gramin_health_jwt_token', token);
      }
      return {
        success: true,
        token: token,
        user: response.data.user || response.data
      };
    } catch (error) {
      // Fallback for demo
      const role = credentials.role || 'patient';
      const mockUser = DEMO_USERS[role] || DEMO_USERS.patient;
      const token = mockUser.token;
      return {
        success: true,
        token: token,
        user: { ...mockUser, phone: credentials.identifier || mockUser.phone }
      };
    }
  },

  // Citizen / Patient Registration (with verification)
  async signup(patientData) {
    try {
      const response = await api.post('/auth/signup', patientData);
      const token = response.data.access_token || response.data.token;
      if (token) {
        localStorage.setItem('gramin_health_jwt_token', token);
      }
      return {
        success: true,
        token: token,
        user: response.data
      };
    } catch (error) {
      const newId = `pat-${Math.floor(100 + Math.random() * 900)}`;
      const p1 = Math.floor(1000 + Math.random() * 9000);
      const p2 = Math.floor(1000 + Math.random() * 9000);
      const p3 = Math.floor(1000 + Math.random() * 9000);
      const mockNewPatient = {
        id: newId,
        name: patientData.name,
        phone: patientData.contact,
        village: patientData.village,
        pincode: patientData.pincode,
        abhaId: `91-${p1}-${p2}-${p3}`,
        role: 'patient',
        token: `mock_jwt_token_${newId}`
      };
      return {
        success: true,
        token: mockNewPatient.token,
        user: mockNewPatient
      };
    }
  },

  // Send Reset Password OTP
  async sendResetOtp(contact) {
    try {
      const response = await api.post('/auth/forgot-password', { contact });
      return response.data;
    } catch (error) {
      return {
        success: true,
        message: `OTP sent to ${contact}`,
        otpDemo: '559201'
      };
    }
  },

  // Reset Password with OTP
  async resetPassword(contact, otp, newPassword) {
    try {
      const response = await api.post('/auth/reset-password', { contact, otp, newPassword });
      return response.data;
    } catch (error) {
      return {
        success: true,
        message: 'Password updated successfully'
      };
    }
  },

  // Logout
  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore
    } finally {
      localStorage.removeItem('gramin_health_jwt_token');
      localStorage.removeItem('gramin_health_user');
    }
  },

  getDemoUsers() {
    return DEMO_USERS;
  }
};

export default authService;
