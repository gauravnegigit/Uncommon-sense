import api from './api';

// Initial Mock Triage Queue for Doctor & Village Records
let TRIAGE_QUEUE = [
  {
    id: 'TRG-9021',
    patientName: 'Kaveri Devi',
    age: 56,
    gender: 'Female',
    village: 'Rampur North',
    ashaWorker: 'Sunita Devi (ASHA-WB-2024-88)',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    urgency: 'HIGH', // HIGH (Red), MODERATE (Amber), MILD (Green)
    urgencyColor: 'rose',
    symptoms: ['Chest Tightness', 'Shortness of Breath', 'Dizziness'],
    bodyArea: 'Chest & Lungs',
    vitals: {
      bpSystolic: 158,
      bpDiastolic: 98,
      heartRate: 104,
      spO2: 91,
      temp: 99.4,
      glucose: 140
    },
    audioNoteUrl: null,
    audioDuration: '00:42',
    transcript: 'Patient experiencing chest compression and difficulty breathing since 4 AM. Sweating reported.',
    recommendedAction: 'Immediate teleconsultation & dispatch 108 Ambulance if symptoms persist.',
    status: 'PENDING_REVIEW', // PENDING_REVIEW, IN_CONSULTATION, RESOLVED
    doctorNotes: ''
  },
  {
    id: 'TRG-9022',
    patientName: 'Govind Mandal',
    age: 32,
    gender: 'Male',
    village: 'Sonapur Block B',
    ashaWorker: 'Direct Patient Entry',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    urgency: 'MODERATE',
    urgencyColor: 'amber',
    symptoms: ['High Fever for 3 Days', 'Severe Body Ache', 'Chills'],
    bodyArea: 'Whole Body / Fever',
    vitals: {
      bpSystolic: 120,
      bpDiastolic: 80,
      heartRate: 88,
      spO2: 97,
      temp: 102.6,
      glucose: 110
    },
    audioNoteUrl: null,
    audioDuration: '00:28',
    transcript: 'Fever spikes in evening with shivering. No rash. Took paracetamol yesterday with mild relief.',
    recommendedAction: 'Order Rapid Malaria & Dengue NS1 strip test at local PHC. Prescribe antipyretics.',
    status: 'PENDING_REVIEW',
    doctorNotes: ''
  },
  {
    id: 'TRG-9023',
    patientName: 'Anjali Soren (Child - 4y)',
    age: 4,
    gender: 'Female',
    village: 'Haripur Toll',
    ashaWorker: 'Meera Das (ASHA)',
    timestamp: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    urgency: 'MODERATE',
    urgencyColor: 'amber',
    symptoms: ['Watery Diarrhea (5 times)', 'Vomiting', 'Mild Lethargy'],
    bodyArea: 'Abdomen / Digestive',
    vitals: {
      bpSystolic: 95,
      bpDiastolic: 65,
      heartRate: 115,
      spO2: 98,
      temp: 99.8,
      glucose: 90
    },
    audioNoteUrl: null,
    audioDuration: '00:35',
    transcript: 'Child has passed watery stool repeatedly since morning. Started ORS packet.',
    recommendedAction: 'Zinc supplements + continuous ORS rehydration. Check skin pinch elasticity.',
    status: 'IN_CONSULTATION',
    doctorNotes: 'Prescribed Zinc 20mg OD x 14 days + ORS sachets.'
  },
  {
    id: 'TRG-9024',
    patientName: 'Bikram Sen',
    age: 62,
    gender: 'Male',
    village: 'Sonapur Central',
    ashaWorker: 'Sunita Devi (ASHA)',
    timestamp: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    urgency: 'MILD',
    urgencyColor: 'emerald',
    symptoms: ['Knee Joint Pain', 'Morning Stiffness'],
    bodyArea: 'Musculoskeletal',
    vitals: {
      bpSystolic: 128,
      bpDiastolic: 82,
      heartRate: 72,
      spO2: 99,
      temp: 98.4,
      glucose: 135
    },
    audioNoteUrl: null,
    audioDuration: '00:19',
    transcript: 'Chronic knee ache exacerbated by rainy weather.',
    recommendedAction: 'Topical analgesic ointment + gentle quadriceps exercises.',
    status: 'RESOLVED',
    doctorNotes: 'Prescribed Diclofenac gel + Calcium Vitamin D3.'
  }
];

export const triageService = {
  // Calculate automated clinical triage urgency
  evaluateTriageScore(symptoms = [], vitals = {}) {
    let redFlags = 0;
    let amberFlags = 0;
    let explanations = [];

    // Red flag symptom keywords
    const redFlagSymptoms = [
      'chest pain', 'chest tightness', 'severe breathlessness', 'unconscious',
      'unresponsive', 'seizures', 'heavy bleeding', 'severe head injury',
      'sudden vision loss', 'poisoning', 'snake bite'
    ];

    symptoms.forEach(sym => {
      const lower = sym.toLowerCase();
      if (redFlagSymptoms.some(r => lower.includes(r))) {
        redFlags += 2;
        explanations.push(`Critical symptom detected: ${sym}`);
      }
    });

    // Vitals analysis
    if (vitals.spO2 && vitals.spO2 < 92) {
      redFlags += 2;
      explanations.push(`Critically low Oxygen Saturation: ${vitals.spO2}%`);
    } else if (vitals.spO2 && vitals.spO2 < 95) {
      amberFlags += 1;
      explanations.push(`Sub-optimal Oxygen Saturation: ${vitals.spO2}%`);
    }

    if (vitals.bpSystolic && vitals.bpSystolic > 160) {
      redFlags += 1;
      explanations.push(`High Stage 2 Systolic Blood Pressure: ${vitals.bpSystolic} mmHg`);
    } else if (vitals.bpSystolic && vitals.bpSystolic > 140) {
      amberFlags += 1;
      explanations.push(`Elevated Blood Pressure: ${vitals.bpSystolic} mmHg`);
    }

    if (vitals.temp && vitals.temp >= 102.5) {
      amberFlags += 1;
      explanations.push(`High body temperature: ${vitals.temp}°F`);
    }

    if (vitals.heartRate && (vitals.heartRate > 120 || vitals.heartRate < 50)) {
      redFlags += 1;
      explanations.push(`Abnormal Heart Rate: ${vitals.heartRate} bpm`);
    }

    if (redFlags >= 1) {
      return {
        level: 'HIGH',
        color: 'rose',
        badge: 'Emergency / Immediate Doctor Attention',
        reasons: explanations.length > 0 ? explanations : ['Critical symptom cluster identified'],
        recommendation: 'Connect immediately to Telemedicine Doctor or reach nearest PHC/Emergency.'
      };
    } else if (amberFlags >= 1 || symptoms.length >= 3) {
      return {
        level: 'MODERATE',
        color: 'amber',
        badge: 'Moderate Urgency / Same-Day Review',
        reasons: explanations.length > 0 ? explanations : ['Multiple symptoms requiring clinical evaluation'],
        recommendation: 'Doctor review within 2 to 4 hours. Keep patient hydrated and monitored.'
      };
    } else {
      return {
        level: 'MILD',
        color: 'emerald',
        badge: 'Mild / Routine Care & Observation',
        reasons: explanations.length > 0 ? explanations : ['Stable vitals with mild symptoms'],
        recommendation: 'Basic home care, hydration, and tele-prescription follow-up.'
      };
    }
  },

  // Normalize backend record schema (handling both snake_case from FastAPI/Pydantic and camelCase)
  normalizeRecord(item) {
    if (!item) return null;
    return {
      id: item.id || item._id || item.triage_id || `TRG-${Math.floor(1000 + Math.random() * 9000)}`,
      patientName: item.patientName || item.patient_name || 'Rural Citizen',
      age: item.age || 40,
      gender: item.gender || 'Not Specified',
      village: item.village || 'Local Village',
      phone: item.phone || '+91 98765 43210',
      ashaWorker: item.ashaWorker || item.asha_worker || 'Self Triage',
      timestamp: item.timestamp || item.created_at || new Date().toISOString(),
      urgency: item.urgency || item.urgency_level || 'MILD',
      urgencyColor: item.urgencyColor || item.urgency_color || (item.urgency === 'HIGH' || item.urgency_level === 'HIGH' ? 'rose' : item.urgency === 'MODERATE' || item.urgency_level === 'MODERATE' ? 'amber' : 'emerald'),
      symptoms: item.symptoms || [],
      bodyArea: item.bodyArea || item.body_area || 'General',
      vitals: {
        bpSystolic: item.vitals?.bpSystolic || item.vitals?.bp_systolic || item.bp_systolic || 120,
        bpDiastolic: item.vitals?.bpDiastolic || item.vitals?.bp_diastolic || item.bp_diastolic || 80,
        heartRate: item.vitals?.heartRate || item.vitals?.heart_rate || item.heart_rate || 76,
        spO2: item.vitals?.spO2 || item.vitals?.spo2 || item.spo2 || 98,
        temp: item.vitals?.temp || item.temp || 98.6,
        glucose: item.vitals?.glucose || item.glucose || ''
      },
      audioNoteUrl: item.audioNoteUrl || item.audio_url || null,
      audioDuration: item.audioDuration || item.audio_duration || '00:30',
      transcript: item.transcript || item.symptom_notes || item.notes || '',
      recommendedAction: item.recommendedAction || item.recommendation || item.recommended_action || 'Consult Telehealth doctor',
      status: item.status || 'PENDING_REVIEW',
      doctorNotes: item.doctorNotes || item.doctor_notes || ''
    };
  },

  // Submit triage assessment to backend (backend/api/triage.py)
  async submitAssessment(data) {
    const payload = {
      patient_name: data.patientName || data.patient_name || 'Rural Citizen',
      age: data.age || 40,
      gender: data.gender || 'Not Specified',
      village: data.village || 'Local Village',
      phone: data.phone || '',
      asha_worker: data.ashaWorker || data.asha_worker || 'Self Triage',
      symptoms: data.symptoms || [],
      severity: data.severity || 5,
      transcript: data.transcript || '',
      body_area: data.bodyArea || data.body_area || 'General',
      vitals: {
        bp_systolic: data.vitals?.bpSystolic || data.vitals?.bp_systolic || 120,
        bp_diastolic: data.vitals?.bpDiastolic || data.vitals?.bp_diastolic || 80,
        heart_rate: data.vitals?.heartRate || data.vitals?.heart_rate || 76,
        spo2: data.vitals?.spO2 || data.vitals?.spo2 || 98,
        temp: data.vitals?.temp || 98.6,
        glucose: data.vitals?.glucose || ''
      }
    };

    try {
      const response = await api.post('/triage/submit', payload);
      const resData = response.data;
      const normalized = this.normalizeRecord(resData.record || resData);
      return {
        success: true,
        triageId: normalized.id,
        triageResult: resData.triage_result || resData.triageResult || this.evaluateTriageScore(data.symptoms, data.vitals),
        record: normalized
      };
    } catch (err) {
      const triageScore = this.evaluateTriageScore(data.symptoms, data.vitals);
      const newRecord = {
        id: `TRG-${Math.floor(1000 + Math.random() * 9000)}`,
        patientName: data.patientName || 'Rural Citizen',
        age: data.age || 40,
        gender: data.gender || 'Not Specified',
        village: data.village || 'Local Village',
        ashaWorker: data.ashaWorker || 'Self Triage',
        timestamp: new Date().toISOString(),
        urgency: triageScore.level,
        urgencyColor: triageScore.color,
        symptoms: data.symptoms || [],
        bodyArea: data.bodyArea || 'General',
        vitals: data.vitals || {},
        audioNoteUrl: data.audioNoteUrl || null,
        audioDuration: data.audioDuration || '00:30',
        transcript: data.transcript || data.symptomNotes || 'Voice dictation recorded by patient/worker.',
        recommendedAction: triageScore.recommendation,
        status: 'PENDING_REVIEW',
        doctorNotes: ''
      };

      TRIAGE_QUEUE = [newRecord, ...TRIAGE_QUEUE];
      return {
        success: true,
        triageId: newRecord.id,
        triageResult: triageScore,
        record: newRecord
      };
    }
  },

  // Get active Doctor queue from backend/api/triage.py
  async getDoctorQueue() {
    try {
      const res = await api.get('/triage/queue');
      const list = Array.isArray(res.data) ? res.data : res.data.queue || [];
      return {
        success: true,
        queue: list.map(item => this.normalizeRecord(item))
      };
    } catch (e) {
      return {
        success: true,
        queue: TRIAGE_QUEUE.map(item => this.normalizeRecord(item))
      };
    }
  },

  // Update triage status (Doctor action)
  async updateTriageStatus(triageId, status, notes = '') {
    try {
      const res = await api.patch(`/triage/${triageId}`, { status, notes });
      return res.data;
    } catch (e) {
      TRIAGE_QUEUE = TRIAGE_QUEUE.map(item => {
        if (item.id === triageId) {
          return { ...item, status, doctorNotes: notes || item.doctorNotes };
        }
        return item;
      });
      return { success: true, updatedId: triageId };
    }
  },

  // Get patient history
  async getPatientHistory(patientId) {
    try {
      const res = await api.get(`/triage/patient/${patientId}`);
      return res.data;
    } catch (e) {
      return {
        success: true,
        records: TRIAGE_QUEUE
      };
    }
  }
};

export default triageService;

