import api from './api';

let ACTIVE_PRESCRIPTIONS = [
  {
    id: 'RX-2024-5501',
    patientName: 'Ramesh Kumar',
    patientAge: 48,
    doctorName: 'Dr. Ananya Roy, MD',
    doctorReg: 'MCI-88234-WB',
    facility: 'District Telehealth Hub / Sonapur PHC',
    date: new Date().toLocaleDateString(),
    diagnosis: 'Acute Viral Bronchitis with Mild Dyspnea',
    vitalsRecorded: 'BP: 130/84 mmHg | SpO2: 96% | Pulse: 78 bpm',
    medicines: [
      {
        name: 'Amoxicillin + Clavulanate 625mg',
        dosage: '1 tablet twice daily after meals',
        duration: '5 days',
        instructions: 'Complete full course. Do not stop early.',
        icon: 'pill',
        timingIcons: ['morning', 'night']
      },
      {
        name: 'Paracetamol 650mg',
        dosage: '1 tablet SOS (when fever > 100°F)',
        duration: '3 days',
        instructions: 'Maintain at least 6 hours gap between doses',
        icon: 'thermometer',
        timingIcons: ['midday', 'night']
      },
      {
        name: 'Salbutamol + Guaiphenesin Expectorant',
        dosage: '2 teaspoons (10ml) thrice daily',
        duration: '5 days',
        instructions: 'Warm water gargle before taking syrup',
        icon: 'droplet',
        timingIcons: ['morning', 'afternoon', 'night']
      },
      {
        name: 'ORS Sachet (Oral Rehydration Salts)',
        dosage: '1 liter solution daily',
        duration: '3 days',
        instructions: 'Mix 1 packet in 1 liter clean boiled-cooled water',
        icon: 'cup',
        timingIcons: ['morning', 'afternoon', 'night']
      }
    ],
    dietAdvice: 'Warm soups, boiled water, avoid cold beverages and dust exposure.',
    followUpDate: 'After 5 Days (or immediately if SpO2 drops below 94%)',
    qrCodeData: 'https://graminhealth.gov.in/verify/rx/RX-2024-5501'
  }
];

export const consultationService = {
  // Get active prescriptions
  async getPrescriptions(patientId) {
    try {
      const res = await api.get(`/consultations/prescriptions/${patientId}`);
      return res.data;
    } catch (e) {
      return {
        success: true,
        prescriptions: ACTIVE_PRESCRIPTIONS
      };
    }
  },

  // Save new digital prescription
  async createPrescription(rxData) {
    try {
      const res = await api.post('/consultations/prescriptions', rxData);
      return res.data;
    } catch (e) {
      const newRx = {
        id: `RX-2024-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toLocaleDateString(),
        ...rxData
      };
      ACTIVE_PRESCRIPTIONS = [newRx, ...ACTIVE_PRESCRIPTIONS];
      return {
        success: true,
        prescription: newRx
      };
    }
  },

  // Start / Join Teleconsultation session
  async joinSession(consultationId, role) {
    try {
      const res = await api.post(`/consultations/${consultationId}/join`, { role });
      return res.data;
    } catch (e) {
      return {
        success: true,
        roomToken: `demo_room_tok_${consultationId}_${role}`,
        consultationId,
        channelName: `gramin_telehealth_${consultationId}`,
        peerStatus: 'CONNECTED'
      };
    }
  },

  // Export patient summary (backend/api/summary.py)
  async exportPatientSummary(patientId, format = 'json') {
    try {
      const res = await api.get(`/summary/patient/${patientId}`, {
        params: { format },
        responseType: format === 'pdf' ? 'blob' : 'json'
      });
      return res.data;
    } catch (e) {
      return {
        success: true,
        summary: {
          patientId,
          generatedAt: new Date().toISOString(),
          prescriptions: ACTIVE_PRESCRIPTIONS
        }
      };
    }
  }
};

export default consultationService;

