import React, { createContext, useContext, useState } from 'react';

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
    notADoctorBadge: 'निर्णय सहायता एवं रेफरल प्रणाली • एआई डॉक्टर नहीं',
    emergencyDisclaimer: 'यह प्रणाली एक स्वास्थ्य ट्राइएज और रेफरल सहायक है, डॉक्टर नहीं। किसी भी आपातकालीन स्थिति में तुरंत 108 डायल करें या नजदीकी अस्पताल जाएं।',
    heroHeading: 'ग्रामीण भारत के लिए सुरक्षित, त्वरित स्वास्थ्य ट्राइएज व रेफरल',
    heroSubheading: 'मरीजों और स्वास्थ्य कार्यकर्ताओं के लिए आधिकारिक आपातकालीन नियमों व निकटतम स्वास्थ्य केंद्रों (PHC/CHC) से युक्त आधुनिक निर्णय प्रणाली।',
    
    // Navigation
    navHome: 'होम',
    navTriage: 'स्वास्थ्य ट्राइएज',
    navFacilities: 'नजदीकी अस्पताल/PHC',
    navGuidelines: 'ASHA आपातकालीन नियम',
    navHistory: 'पूर्व परामर्श रिकॉर्ड',
    navLogin: 'लॉग इन / साइन अप',
    navGuest: 'अतिथि मोड (Guest)',
    navLogout: 'लॉग आउट',
    
    // Emergency Action
    dial108: '108 आपातकालीन एम्बुलेंस',
    emergencyAlertTitle: 'आपातकालीन रेड-फ्लैग खतरे का संकेत मिला!',
    emergencyAlertSub: 'मरीज को तुरंत आपातकालीन चिकित्सा देखभाल की आवश्यकता है। कृपया तुरंत 108 एम्बुलेंस बुलाएं।',
    
    // Triage Console
    newChat: 'नया परामर्श (New Chat)',
    chatHistory: 'पूर्व परामर्श इतिहास',
    saveChat: 'परामर्श सहेजें',
    renameChat: 'नाम बदलें',
    chatNamePlaceholder: 'परामर्श का नाम दर्ज करें (उदा. बुखार जांच)',
    selectScenario: 'नमूना परिदृश्य (परीक्षण)',
    scenarioHelp: 'एक क्लिक में हिंदी आवाज व आपातकालीन नियमों का परीक्षण करें:',
    dangerSignsDetected: 'पहचाने गए खतरे के संकेत (Danger Signs):',
    noDangerSigns: 'कोई तत्काल रेड-फ्लैग खतरे का संकेत नहीं मिला।',
    triageCategory: 'ट्राइएज श्रेणी',
    deleteChat: 'हटाएं',
    
    // Input / Voice
    inputPlaceholder: 'मरीज के लक्षण यहाँ लिखें या नीचे माइक बटन दबाकर हिंदी में बोलें...',
    speakInHindi: 'हिंदी में बोलें (माइक दबाएं)',
    listening: 'सुन रहे हैं... कृपया स्पष्ट बोलें',
    stopRecording: 'रिकॉर्डिंग रोकें',
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
    findNearMe: 'मेरी वर्तमान लोकेशन (GPS)',
    locationTrackerTitle: 'आपकी लोकेशन एवं क्षेत्र में स्वास्थ्य सेवाएं',
    changeLocation: 'लोकेशन बदलें',
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
    
    // Auth Modal
    loginTitle: 'मरीज लॉगिन',
    signupTitle: 'नया मरीज खाता बनाएं',
    otpTitle: 'OTP कोड सत्यापन',
    forgotTitle: 'पासवर्ड भूल गए?',
    resetTitle: 'नया पासवर्ड सेट करें',
    identifierLabel: 'मोबाइल नंबर या ईमेल पता',
    identifierPlaceholder: 'उदा. 9876543210 या patient@example.com',
    passwordLabel: 'पासवर्ड',
    passwordPlaceholder: 'अपना पासवर्ड दर्ज करें',
    nameLabel: 'मरीज का पूरा नाम',
    namePlaceholder: 'उदा. रमेश कुमार',
    phoneLabel: 'मोबाइल नंबर (वैकल्पिक यदि ईमेल दिया है)',
    phonePlaceholder: 'उदा. 9876543210',
    emailLabel: 'ईमेल पता (वैकल्पिक यदि मोबाइल दिया है)',
    emailPlaceholder: 'उदा. patient@example.com',
    phoneOrEmailHelp: 'मोबाइल नंबर या ईमेल पता (या दोनों) दर्ज करें।',
    enterPhoneOrEmailError: 'कृपया पंजीकरण के लिए मोबाइल नंबर या ईमेल पता (या दोनों) दर्ज करें।',
    phoneOtpLabel: '📱 मोबाइल SMS OTP कोड दर्ज करें',
    phoneOtpPlaceholder: 'उदा. 123456',
    emailOtpLabel: '📧 ईमेल सत्यापन OTP कोड दर्ज करें',
    emailOtpPlaceholder: 'उदा. 123456',
    addressLabel: 'पता / गांव का नाम (वैकल्पिक)',
    addressPlaceholder: 'उदा. ग्राम फाफामऊ',
    pincodeLabel: 'पिनकोड (वैकल्पिक)',
    pincodePlaceholder: 'उदा. 211013',
    otpLabel: '6-अंकीय OTP कोड दर्ज करें',
    otpPlaceholder: '123456',
    newPasswordLabel: 'नया पासवर्ड',
    newPasswordPlaceholder: 'नया पासवर्ड दर्ज करें',
    contactLabel: 'पंजीकृत मोबाइल नंबर या ईमेल',
    contactPlaceholder: 'उदा. 9876543210 या email@example.com',
    loginButton: 'मरीज लॉगिन करें',
    signupButton: 'OTP सत्यापन कोड भेजें',
    verifyButton: 'सत्यापित करें व खाता सक्रिय करें',
    forgotButton: 'OTP कोड भेजें',
    resetButton: 'पासवर्ड रीसेट करें',
    toSignup: 'खाता नहीं है? नया मरीज खाता बनाएं →',
    toLogin: 'पहले से खाता है? लॉगिन करें →',
    toForgot: 'पासवर्ड भूल गए? पासवर्ड रीसेट करें →',
    guestAccess: 'अतिथि मोड में तुरंत परामर्श जारी रखें (Guest Mode)',
    invalidUserError: 'अमान्य क्रेडेंशियल्स: उपयोगकर्ता नहीं मिला या पासवर्ड गलत है।',
    invalidOtpError: 'अमान्य OTP कोड: कृपया सही 6-अंकीय कोड दर्ज करें।',
    userExistsError: 'इस मोबाइल नंबर या ईमेल से खाता पहले से मौजूद है। कृपया लॉगिन करें।',
    loginSuccessMsg: 'मरीज लॉगिन सफल!',
    signupSuccessMsg: 'खाता सक्रिय हो गया! स्वागत है।',
    otpSentMsg: '6-अंकीय OTP कोड आपके मोबाइल/ईमेल पर भेजा गया है।',
    resetSuccessMsg: 'पासवर्ड सफलतापूर्वक बदल दिया गया है! अब लॉगिन करें।',

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
    heroHeading: 'Safe, Rapid Health Triage & Trusted Clinical Referrals',
    heroSubheading: 'Empowering patients and rural caregivers with deterministic emergency danger sign detection and nearby PHC routing.',
    
    // Navigation
    navHome: 'Home',
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
    chatHistory: 'Past Consultations',
    saveChat: 'Save Chat',
    renameChat: 'Rename',
    chatNamePlaceholder: 'Enter chat title (e.g. Fever Triage)',
    selectScenario: 'Preset Scenarios (Test)',
    scenarioHelp: 'One-click Hindi voice & deterministic triage test scenarios:',
    dangerSignsDetected: 'Identified Danger Signs (ASHA Criteria):',
    noDangerSigns: 'No immediate red-flag danger signs detected.',
    triageCategory: 'Triage Category',
    deleteChat: 'Delete',
    
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
    locationTrackerTitle: 'Your Location & Regional Availability',
    changeLocation: 'Change Location',
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
    
    // Auth Modal
    loginTitle: 'Patient Sign In',
    signupTitle: 'Create Patient Account',
    otpTitle: 'Verify OTP Code',
    forgotTitle: 'Forgot Password?',
    resetTitle: 'Reset Password',
    identifierLabel: 'Mobile Number or Email Address',
    identifierPlaceholder: 'e.g. 9876543210 or patient@example.com',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter your password',
    nameLabel: "Patient's Full Name",
    namePlaceholder: 'e.g. Ramesh Kumar',
    phoneLabel: 'Mobile Phone Number (Optional if Email is entered)',
    phonePlaceholder: 'e.g. 9876543210',
    emailLabel: 'Email Address (Optional if Phone is entered)',
    emailPlaceholder: 'e.g. patient@example.com',
    phoneOrEmailHelp: 'Enter mobile phone, email, or both to register.',
    enterPhoneOrEmailError: 'Please enter a mobile phone number or an email address (or both) to register.',
    phoneOtpLabel: '📱 Mobile SMS OTP Code',
    phoneOtpPlaceholder: 'e.g. 123456',
    emailOtpLabel: '📧 Email Verification OTP Code',
    emailOtpPlaceholder: 'e.g. 123456',
    addressLabel: 'Address / Village Name (Optional)',
    addressPlaceholder: 'e.g. Phaphamau Village',
    pincodeLabel: 'Pincode (Optional)',
    pincodePlaceholder: 'e.g. 211013',
    otpLabel: 'Enter 6-Digit OTP Code',
    otpPlaceholder: '123456',
    newPasswordLabel: 'New Password',
    newPasswordPlaceholder: 'Enter new password',
    contactLabel: 'Registered Mobile Number or Email',
    contactPlaceholder: 'e.g. 9876543210 or email@example.com',
    loginButton: 'Sign In to Account',
    signupButton: 'Send OTP Verification Code',
    verifyButton: 'Verify OTP & Activate Account',
    forgotButton: 'Send OTP Code',
    resetButton: 'Reset Password',
    toSignup: "Don't have an account? Sign Up →",
    toLogin: 'Already have an account? Sign In →',
    toForgot: 'Forgot your password? Reset it here →',
    guestAccess: 'Continue in Guest Mode (Instant Access)',
    invalidUserError: 'Invalid credentials: User not found or incorrect password.',
    invalidOtpError: 'Invalid OTP code: Please enter the correct 6-digit code.',
    userExistsError: 'An account with this mobile number or email already exists. Please Sign In.',
    loginSuccessMsg: 'Patient login successful!',
    signupSuccessMsg: 'Account created and verified successfully!',
    otpSentMsg: '6-digit OTP code sent to your mobile/email.',
    resetSuccessMsg: 'Password has been reset successfully! You can now sign in.',

    // Roles
    rolePatient: 'Patient / Citizen',
    roleAsha: 'ASHA Worker',
    roleDoctor: 'Medical Officer (Doctor)',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('gramin_health_lang');
    return saved === 'hi' || saved === 'en' ? saved : 'hi';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('gramin_health_lang', lang);
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
