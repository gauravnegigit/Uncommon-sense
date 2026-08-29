import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'hi' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isHindi: boolean;
}

const translations: Record<Language, Record<string, string>> = {
  hi: {
    // Brand & Header
    appTitle: 'Gramin Health',
    appSubtitle: 'ग्रामीण स्वास्थ्य ट्राइएज एवं रेफरल सहायक',
    notADoctorBadge: 'केवल निर्णय सहायता एवं रेफरल प्रणाली • एआई डॉक्टर नहीं',
    emergencyDisclaimer: 'यह प्रणाली एक स्वास्थ्य ट्राइएज और रेफरल सहायक है, डॉक्टर नहीं। किसी भी आपातकालीन स्थिति में तुरंत 108 डायल करें या नजदीकी अस्पताल जाएं।',
    
    // Navigation
    navTriage: 'स्वास्थ्य ट्राइएज (परामर्श)',
    navFacilities: 'नजदीकी अस्पताल/PHC',
    navGuidelines: 'ASHA आपातकालीन नियम',
    navHistory: 'पूर्व परामर्श रिकॉर्ड',
    navLogin: 'लॉग इन / साइन अप',
    navGuest: 'अतिथि मोड (Guest)',
    navLogout: 'लॉग आउट',
    
    // Emergency Action
    dial108: 'आपातकालीन 108 डायल करें',
    emergencyAlertTitle: 'आपातकालीन रेड-फ्लैग संकेत का पता चला!',
    emergencyAlertSub: 'मरीज को तत्काल चिकित्सा ध्यान की आवश्यकता है। कृपया तुरंत 108 एम्बुलेंस बुलाएं।',
    
    // Triage Console
    newChat: 'नया परामर्श शुरू करें',
    clearChat: 'चैट साफ करें',
    selectScenario: 'नमूना परिदृश्य (परीक्षण)',
    scenarioHelp: 'एक क्लिक में हिंदी आवाज व आपातकालीन नियमों का परीक्षण करें:',
    dangerSignsDetected: 'पहचाने गए खतरे के संकेत (Danger Signs):',
    noDangerSigns: 'कोई तत्काल रेड-फ्लैग खतरे का संकेत नहीं मिला।',
    triageCategory: 'ट्राइएज श्रेणी',
    
    // Input / Voice
    inputPlaceholder: 'मरीज के लक्षण यहाँ लिखें या नीचे माइक बटन दबाकर बोलें...',
    speakInHindi: 'हिंदी में बोलें (माइक दबाएं)',
    listening: 'सुन रहे हैं... कृपया स्पष्ट बोलें',
    stopRecording: 'रिकॉर्डिंग समाप्त करें',
    processingAudio: 'आवाज का विश्लेषण हो रहा है...',
    send: 'भेजें',
    audioRecorded: 'ऑडियो रिकॉर्ड हो गया',
    playVoice: 'आवाज में सुनें',
    stopVoice: 'आवाज रोकें',
    
    // Result Severities
    severity_EMERGENCY: '🔴 आपातकालीन (EMERGENCY) - तत्काल रेफरल',
    severity_SYMPTOM_ASSESSMENT: '🟡 लक्षण मूल्यांकन (SYMPTOM ASSESSMENT) - PHC/CHC परामर्श',
    severity_FACILITY_LOOKUP: '🔵 स्वास्थ्य केंद्र खोज (FACILITY LOOKUP)',
    
    // Doctor Summary
    viewDoctorSummary: 'डॉक्टर रेफरल पर्ची देखें (SBAR)',
    generateSummary: 'डॉक्टर-रेडी सारांश बनाएं',
    referralSlipTitle: 'आपातकालीन / सामान्य रोगी रेफरल पर्ची',
    sbarSituation: 'S - स्थिति (Situation)',
    sbarBackground: 'B - पृष्ठभूमि एवं लक्षण अवधि (Background)',
    sbarAssessment: 'A - मूल्यांकन व दिशानिर्देश (Assessment)',
    sbarRecommendation: 'R - रेफरल अनुशंसा एवं तात्कालिक कदम (Recommendation)',
    targetFacility: 'अनुशंसित रेफरल स्तर:',
    severityLevel: 'गंभीरता स्तर:',
    printReferral: 'रेफरल पर्ची प्रिंट करें',
    downloadPdf: 'PDF डाउनलोड करें',
    close: 'बंद करें',
    
    // Facilities Locator
    facilitySearchTitle: 'निकटतम स्वास्थ्य केंद्र एवं अस्पताल खोजें',
    findNearMe: 'मेरी वर्तमान लोकेशन से खोजें',
    searchRadius: 'खोज दायरा (किलोमीटर):',
    filterAll: 'सभी केंद्र',
    filterEmergency: '24x7 आपातकालीन सेवा',
    filterPHC: 'प्राथमिक स्वास्थ्य केंद्र (PHC)',
    filterCHC: 'सामुदायिक स्वास्थ्य केंद्र (CHC)',
    filterHospital: 'जिला अस्पताल (Hospital)',
    bedsAvailable: 'उपलब्ध बेड:',
    distanceKm: 'दूरी:',
    callNow: 'कॉल करें',
    getDirections: 'रास्ता देखें (Maps)',
    noFacilitiesFound: 'इस क्षेत्र में कोई स्वास्थ्य केंद्र नहीं मिला। कृपया दायरा बढ़ाएं।',
    
    // Guidelines
    guidelinesTitle: 'राष्ट्रीय स्वास्थ्य मिशन (ASHA) आपातकालीन खतरे के संकेत',
    guidelinesDesc: 'भारत सरकार एवं आईसीएमआर (ICMR) दिशानिर्देशों पर आधारित आपातकालीन ट्राइएज नियम।',
    
    // Roles
    rolePatient: 'मरीज / नागरिक',
    roleAsha: 'आशा कार्यकर्ता (ASHA)',
    roleDoctor: 'चिकित्सा अधिकारी (Doctor)',
  },
  en: {
    // Brand & Header
    appTitle: 'Gramin Health',
    appSubtitle: 'Rural Health Triage & Referral Assistant',
    notADoctorBadge: 'Decision-Support & Referral Tool • Not an AI Doctor',
    emergencyDisclaimer: 'This system is a health triage and referral assistant, not an AI doctor. In any life-threatening emergency, immediately dial 108 or go to the nearest hospital.',
    
    // Navigation
    navTriage: 'Triage Portal',
    navFacilities: 'Nearby Facilities',
    navGuidelines: 'ASHA Danger Signs',
    navHistory: 'History Records',
    navLogin: 'Sign In / Register',
    navGuest: 'Guest Mode',
    navLogout: 'Sign Out',
    
    // Emergency Action
    dial108: 'Call 108 Ambulance',
    emergencyAlertTitle: 'Emergency Danger Sign Detected!',
    emergencyAlertSub: 'Patient requires immediate medical intervention. Please dispatch emergency transport immediately.',
    
    // Triage Console
    newChat: 'Start New Triage',
    clearChat: 'Clear History',
    selectScenario: 'Preset Scenarios (Test)',
    scenarioHelp: 'One-click Hindi voice & deterministic triage test scenarios:',
    dangerSignsDetected: 'Identified Danger Signs (ASHA Criteria):',
    noDangerSigns: 'No immediate red-flag danger signs detected.',
    triageCategory: 'Triage Category',
    
    // Input / Voice
    inputPlaceholder: 'Describe patient symptoms or click microphone to speak in Hindi/English...',
    speakInHindi: 'Speak in Hindi / English',
    listening: 'Listening... Please speak clearly',
    stopRecording: 'Stop Recording',
    processingAudio: 'Analyzing audio...',
    send: 'Send',
    audioRecorded: 'Audio Recorded',
    playVoice: 'Play Voice Audio',
    stopVoice: 'Stop Audio',
    
    // Result Severities
    severity_EMERGENCY: '🔴 EMERGENCY - Immediate High-Priority Referral',
    severity_SYMPTOM_ASSESSMENT: '🟡 SYMPTOM ASSESSMENT - Visit PHC / CHC Today',
    severity_FACILITY_LOOKUP: '🔵 FACILITY LOOKUP - Logistics & Medical Resources',
    
    // Doctor Summary
    viewDoctorSummary: 'View Doctor Handover (SBAR)',
    generateSummary: 'Generate Clinical Referral Summary',
    referralSlipTitle: 'Clinical Triage & Patient Referral Slip',
    sbarSituation: 'S - Situation',
    sbarBackground: 'B - Background & Timeline',
    sbarAssessment: 'A - Clinical Assessment & STWs',
    sbarRecommendation: 'R - Referral Recommendation & Immediate Action',
    targetFacility: 'Target Facility Tier:',
    severityLevel: 'Triage Severity Level:',
    printReferral: 'Print Referral Slip',
    downloadPdf: 'Download PDF Slip',
    close: 'Close',
    
    // Facilities Locator
    facilitySearchTitle: 'Locate Nearby Health Facilities',
    findNearMe: 'Use My Current GPS Location',
    searchRadius: 'Search Radius (km):',
    filterAll: 'All Facilities',
    filterEmergency: '24x7 Emergency Services',
    filterPHC: 'Primary Health Centre (PHC)',
    filterCHC: 'Community Health Centre (CHC)',
    filterHospital: 'District Hospital',
    bedsAvailable: 'Available Beds:',
    distanceKm: 'Distance:',
    callNow: 'Call Facility',
    getDirections: 'Get Directions',
    noFacilitiesFound: 'No facilities found in this perimeter. Try expanding the radius.',
    
    // Guidelines
    guidelinesTitle: 'National Health Mission (ASHA) Emergency Warning Signs',
    guidelinesDesc: 'Based on Government of India and ICMR Standard Treatment Workflows.',
    
    // Roles
    rolePatient: 'Patient / Citizen',
    roleAsha: 'ASHA Worker',
    roleDoctor: 'Medical Officer (Doctor)',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('swasthya_lang');
    return (saved === 'hi' || saved === 'en') ? saved : 'hi';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('swasthya_lang', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isHindi: language === 'hi' }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

