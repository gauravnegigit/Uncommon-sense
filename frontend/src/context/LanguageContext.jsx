import React, { createContext, useContext, useState, useEffect } from 'react';

const TRANSLATIONS = {
  en: {
    appName: 'GraminHealth',
    tagline: 'Rural Medical Assistance & Tele-Triage',
    navHome: 'Home',
    navTriage: 'Symptom Triage',
    navDoctor: 'Doctor Dashboard',
    navWorker: 'ASHA Worker Portal',
    navClinics: 'Find Nearby PHC',
    navRecords: 'Health Records',
    navEmergency: '108 Emergency SOS',
    login: 'Sign In',
    logout: 'Sign Out',
    switchRole: 'Switch Role',
    online: 'Online',
    offline: 'Offline (Sync Ready)',
    emergencyBanner: 'Medical Emergency? Call 108 immediately or tap Emergency SOS.',
    startTriageBtn: 'Start Voice & Symptom Triage',
    findClinicsBtn: 'Locate Nearest Primary Health Centre',
    voiceRecordingTitle: 'Voice Symptom Recorder',
    speakSymptomsPrompt: 'Hold to record your symptoms in your own language...',
    recordedTime: 'Recording Time',
    transcriptionText: 'Live Audio Transcription',
    triageUrgency: 'Urgency Level',
    mildUrgency: 'Mild - Home Care & Observation',
    modUrgency: 'Moderate - Needs Doctor Evaluation',
    highUrgency: 'Emergency - Immediate Attention Required',
    vitalsSection: 'Patient Vital Signs',
    bpLabel: 'Blood Pressure',
    spo2Label: 'Oxygen Saturation (SpO2)',
    pulseLabel: 'Pulse Rate',
    tempLabel: 'Body Temperature',
    sugarLabel: 'Blood Glucose',
    submitTriage: 'Submit for Medical Review',
    doctorQueueTitle: 'Active Rural Patient Triage Queue',
    videoConsult: 'Start Teleconsultation',
    writePrescription: 'Generate e-Prescription',
    allRightsReserved: 'Ministry of Health & Family Welfare - Rural Telehealth Initiative'
  },
  hi: {
    appName: 'ग्रामीण स्वास्थ्य',
    tagline: 'ग्रामीण चिकित्सा सहायता एवं टेली-ट्राइएज',
    navHome: 'होम',
    navTriage: 'लक्षण जांच (ट्राइएज)',
    navDoctor: 'डॉक्टर डैशबोर्ड',
    navWorker: 'आशा कार्यकर्ता पोर्टल',
    navClinics: 'निकटतम स्वास्थ्य केंद्र',
    navRecords: 'स्वास्थ्य रिकॉर्ड',
    navEmergency: '108 आपातकालीन सेवा',
    login: 'लॉग इन करें',
    logout: 'लॉग आउट',
    switchRole: 'भूमिका बदलें',
    online: 'ऑनलाइन',
    offline: 'ऑफ़लाइन (सिंक तैयार)',
    emergencyBanner: 'चिकित्सा आपातकाल? 108 डायल करें या आपातकालीन बटन दबाएं।',
    startTriageBtn: 'आवाज़ और लक्षणों से जांच शुरू करें',
    findClinicsBtn: 'निकटतम प्राथमिक स्वास्थ्य केंद्र खोजें',
    voiceRecordingTitle: 'वॉइस लक्षण रिकॉर्डर',
    speakSymptomsPrompt: 'अपनी भाषा में अपने लक्षण बोलने के लिए माइक दबाएं...',
    recordedTime: 'रिकॉर्डिंग समय',
    transcriptionText: 'ऑडियो ट्रांसक्रिप्शन (लक्षण विवरण)',
    triageUrgency: 'गंभीरता स्तर',
    mildUrgency: 'हल्का - घरेलू देखभाल और आराम',
    modUrgency: 'मध्यम - डॉक्टर से सलाह आवश्यक',
    highUrgency: 'आपातकालीन - तुरंत डॉक्टर से संपर्क करें',
    vitalsSection: 'रोगी के महत्वपूर्ण संकेत (वाइटल्स)',
    bpLabel: 'रक्तचाप (BP)',
    spo2Label: 'ऑक्सीजन स्तर (SpO2)',
    pulseLabel: 'नाड़ी गति (हार्ट रेट)',
    tempLabel: 'शरीर का तापमान',
    sugarLabel: 'ब्लड शुगर (ग्लूकोज)',
    submitTriage: 'डॉक्टर जांच के लिए भेजें',
    doctorQueueTitle: 'ग्रामीण मरीजों की ट्राइएज सूची',
    videoConsult: 'वीडियो परामर्श शुरू करें',
    writePrescription: 'डिजिटल पर्ची बनाएं',
    allRightsReserved: 'राष्ट्रीय ग्रामीण स्वास्थ्य मिशन - टेली-हेल्थ पहल'
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('gramin_health_lang');
    return (saved === 'en' || saved === 'hi') ? saved : 'en';
  });

  const changeLanguage = (langCode) => {
    const valid = (langCode === 'en' || langCode === 'hi') ? langCode : 'en';
    setLanguage(valid);
    localStorage.setItem('gramin_health_lang', valid);
  };

  const t = (key) => {
    if (TRANSLATIONS[language] && TRANSLATIONS[language][key]) {
      return TRANSLATIONS[language][key];
    }
    return TRANSLATIONS['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t, supportedLanguages: ['en', 'hi'] }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
export default LanguageContext;

