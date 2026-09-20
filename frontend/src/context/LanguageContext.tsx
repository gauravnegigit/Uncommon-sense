import React, { createContext, useContext, useState } from 'react';

export type Language = 'en' | 'hi' | 'mr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  tr: (en: string, hi: string, mr: string) => string;
  isEnglish: boolean;
  isHindi: boolean;
  isMarathi: boolean;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Brand & Header
    appTitle: 'Gramin Health',
    appSubtitle: 'Rural Health AI Triage & Digital Healthcare Ecosystem',
    notADoctorBadge: 'Clinical Decision-Support & Referral Tool • Not an AI Doctor',
    emergencyDisclaimer: 'This system is a health triage and referral assistant, not an AI doctor. In any life-threatening emergency, immediately dial 108 or go to the nearest hospital.',
    heroHeading: 'Safe, Rapid Health Triage & Trusted Clinical Referrals',
    heroSubheading: 'Empowering rural citizens, frontline ASHA workers, and PHC Medical Officers with clinical emergency detection and verified healthcare workflows.',
    
    // Navigation
    navHome: 'Home',
    navTriage: 'AI Symptom Triage',
    navAppointments: 'OPD Queue & Token',
    navPatients: 'Patient Records (LPR)',
    navReferrals: 'Referral Network',
    navDiagnostics: 'Diagnostics & Lab',
    navInventory: 'Medicines & Stock',
    navHighrisk: 'ASHA Field Care',
    navDashboard: 'Facility Command & Map',
    navFacilities: 'Hospitals & PHCs',
    navGuidelines: 'Emergency Guidelines',
    navHistory: 'History Records',
    navLogin: 'Sign In / Register',
    navGuest: 'Guest Mode',
    navLogout: 'Sign Out',
    
    // Emergency Action
    dial108: '108 Emergency Ambulance',
    emergencyAlertTitle: 'Emergency Red-Flag Danger Signs Detected!',
    emergencyAlertSub: 'Patient requires immediate emergency medical attention. Please call 108 Ambulance right away.',
    
    // Triage Console
    newChat: 'New Triage Consultation',
    chatHistory: 'Past Consultations',
    saveChat: 'Save Consultation',
    renameChat: 'Rename Session',
    chatNamePlaceholder: 'Enter consultation name (e.g. Fever check)',
    selectScenario: 'Sample Clinical Scenarios',
    scenarioHelp: 'Click any scenario below to test rapid emergency triage protocols:',
    dangerSignsDetected: 'Identified Red-Flag Danger Signs:',
    noDangerSigns: 'No immediate red-flag emergency danger signs detected.',
    triageCategory: 'Triage Category',
    deleteChat: 'Delete',
    
    // Input / Voice
    inputPlaceholder: 'Type patient symptoms here or click the microphone to speak...',
    speakInHindi: 'Voice Input (Click Mic)',
    listening: 'Listening... Please describe symptoms clearly',
    stopRecording: 'Stop Recording',
    processingAudio: 'Analyzing audio speech...',
    send: 'Evaluate Symptoms',
    audioRecorded: 'Audio recorded successfully',
    playVoice: 'Listen to Audio',
    stopVoice: 'Stop Audio',
    
    // Result Severities
    severity_EMERGENCY: '🔴 EMERGENCY - Immediate Specialist Referral Required',
    severity_SYMPTOM_ASSESSMENT: '🟡 SYMPTOM ASSESSMENT - Visit PHC/CHC Medical Officer',
    severity_FACILITY_LOOKUP: '🔵 FACILITY LOOKUP - Routine Health Checkup',
    
    // Doctor Summary
    viewDoctorSummary: 'View SBAR Doctor Referral Slip',
    generateSummary: 'Generate Clinical SBAR Summary',
    referralSlipTitle: 'Emergency & General Clinical Referral Handover Slip',
    sbarSituation: 'S - Situation',
    sbarBackground: 'B - Background & Symptom Duration',
    sbarAssessment: 'A - Clinical Assessment & Guidelines',
    sbarRecommendation: 'R - Referral Recommendation & Immediate Action',
    targetFacility: 'Recommended Referral Level:',
    severityLevel: 'Clinical Severity:',
    printReferral: 'Print Referral Slip',
    downloadPdf: 'Download PDF',
    close: 'Close',
    
    // Facilities Locator
    facilitySearchTitle: 'Find Nearest Health Facilities & Hospitals',
    findNearMe: 'Use Current GPS Location',
    locationTrackerTitle: 'Your Location & Health Facilities Radar',
    changeLocation: 'Change Location',
    searchRadius: 'Search Radius (km):',
    filterAll: 'All Facilities',
    filterEmergency: '24x7 Emergency Services',
    filterPHC: 'Primary Health Centre (PHC)',
    filterCHC: 'Community Health Centre (CHC)',
    filterHospital: 'Sub-District / District Hospital',
    bedsAvailable: 'Available Beds:',
    distanceKm: 'Distance:',
    callNow: 'Call Center',
    getDirections: 'Get Directions (Map)',
    noFacilitiesFound: 'No health facilities found in this perimeter. Try expanding the radius.',
    
    // Guidelines
    guidelinesTitle: 'National Health Mission (ASHA) Emergency Danger Signs',
    guidelinesDesc: 'Deterministic emergency clinical triage protocols based on Ministry of Health (MoHFW) & ICMR guidelines.',
    
    // Appointments & Queue
    queueTitle: 'Live OPD Smart Queue & Token Board',
    queueSubtitle: 'Real-time token tracking, wait time estimation, and physician consultation controls',
    bookAppointmentBtn: '📅 Book OPD Appointment',
    issueWalkInBtn: '⚡ Issue Walk-In Queue Token',
    nowServing: 'Serving Now',
    nextInLine: 'Next in Line',
    waitingCount: 'Patients Waiting',
    estWaitTime: 'Estimated Wait Time',
    callNextBtn: 'Call Next Patient',
    startConsultBtn: 'Start Consultation',
    completeConsultBtn: 'Complete Consultation',
    skipPatientBtn: 'Skip',
    
    // Patient Records
    patientDirectoryTitle: 'Longitudinal Patient Health Records (LPR / ABHA)',
    patientDirectorySub: 'Unified lifetime clinical history, physician notes, and laboratory findings',
    registerPatientBtn: '+ Register New Patient',
    addObservationBtn: '+ Add Clinical Observation',
    timelineTitle: 'Unified Patient Clinical Timeline',
    
    // Referrals
    referralTitle: 'Closed-Loop Inter-Facility Referral Network',
    referralSubtitle: 'Secure patient transfer tracking between Sub-Centres, PHCs, CHCs, and District Hospitals',
    createReferralBtn: '+ Create Inter-Facility Referral',
    referralStageCreated: '1. Referral Created',
    referralStageAccepted: '2. Accepted by Destination',
    referralStageQueued: '3. In Arrival Queue',
    referralStageArrived: '4. Patient Arrived at Facility',
    referralStageCompleted: '5. Treatment Completed',

    // Diagnostics
    diagnosticTitle: 'Diagnostic Lab Orders & Specimen Logistics',
    diagnosticSubtitle: 'Real-time specimen collection, laboratory transport, and certified test reports',
    orderTestBtn: '+ Order Diagnostic Test',
    testStageRequested: 'Requested',
    testStageCollected: 'Sample Collected',
    testStageProcessing: 'Processing in Lab',
    testStageResult: 'Report Certified',
    
    // Inventory
    inventoryTitle: 'Essential Medicine Stock & Shortage Radar',
    inventorySubtitle: 'Live pharmaceutical inventory across PHCs, CHCs, and Jan Aushadhi Kendras',
    updateStockBtn: 'Update Stock Level',
    searchNearbyMeds: 'Search Medicines in 15km Radius',
    inStock: 'Available',
    lowStock: 'Low Stock Alert',
    outOfStock: 'Stock Out',
    aiSubstitute: 'Clinical Alternative Suggestion:',

    // High Risk & ASHA
    highRiskTitle: 'High-Risk Maternal & Infant Surveillance',
    highRiskSubtitle: 'Surveillance for pregnant women (ANC), severely acute malnourished infants (SAM), and chronic illness',
    scheduleFollowupBtn: '+ Schedule Home Visit',
    recordVisitBtn: 'Complete Visit & Record Vitals',
    overdueWarning: 'OVERDUE - Urgent Field Follow-up Required!',
    dueTodayWarning: 'Due Today',
    upcomingTask: 'Upcoming Follow-up',

    // Operational Dashboard
    dashboardTitle: 'Medical Officer Facility Operational Command',
    dashboardSubtitle: 'Real-time facility capacity, bed occupancy, emergency readiness, and supply chains',
    updateBedsBtn: 'Update Inpatient Bed Count',

    // Auth Modal
    loginTitle: 'Sign In to Your Healthcare Account',
    signupTitle: 'Create New Account',
    otpTitle: '6-Digit OTP Verification',
    forgotTitle: 'Forgot Password?',
    resetTitle: 'Reset Account Password',
    identifierLabel: 'Mobile Number or Email Address',
    identifierPlaceholder: 'e.g. 9876543210 or user@example.com',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter your account password',
    nameLabel: 'Full Name',
    namePlaceholder: 'e.g. Ramesh Patel',
    phoneLabel: 'Mobile Number (Optional if Email is provided)',
    phonePlaceholder: 'e.g. 9876543210',
    emailLabel: 'Email Address (Optional if Mobile is provided)',
    emailPlaceholder: 'e.g. patient@example.com',
    phoneOrEmailHelp: 'Enter mobile number, email address, or both.',
    enterPhoneOrEmailError: 'Please provide either mobile phone or email address.',
    phoneOtpLabel: '📱 Enter Mobile SMS OTP Code',
    phoneOtpPlaceholder: 'e.g. 123456',
    emailOtpLabel: '📧 Enter Email Verification OTP Code',
    emailOtpPlaceholder: 'e.g. 123456',
    addressLabel: 'Village / Address (Optional)',
    addressPlaceholder: 'e.g. Phaphamau Village',
    pincodeLabel: 'Postal PIN Code (Optional)',
    pincodePlaceholder: 'e.g. 211013',
    otpLabel: '6-Digit OTP Code',
    otpPlaceholder: '123456',
    newPasswordLabel: 'New Password',
    newPasswordPlaceholder: 'Enter new secure password',
    contactLabel: 'Registered Phone Number or Email',
    contactPlaceholder: 'e.g. 9876543210',
    loginButton: 'Sign In',
    signupButton: 'Send Verification Code',
    verifyButton: 'Verify & Activate Account',
    forgotButton: 'Send Reset OTP',
    resetButton: 'Confirm Password Reset',
    toSignup: "Don't have an account? Create one now →",
    toLogin: 'Already have an account? Sign in →',
    toForgot: 'Forgot your password? Reset it here →',
    guestAccess: 'Continue in Guest Mode',
    invalidUserError: 'Invalid credentials: user not found or password incorrect.',
    invalidOtpError: 'Invalid OTP code. Please enter the correct 6-digit code.',
    userExistsError: 'An account with this phone or email already exists. Please sign in.',
    loginSuccessMsg: 'Signed in successfully!',
    signupSuccessMsg: 'Account created and verified successfully!',
    otpSentMsg: '6-digit OTP code sent to your mobile/email.',
    resetSuccessMsg: 'Password has been reset successfully! You can now sign in.',

    // Roles
    rolePatient: 'Patient / Citizen',
    roleAsha: 'ASHA Worker',
    roleDoctor: 'Medical Officer (Doctor / MO)',
  },

  hi: {
    // Brand & Header
    appTitle: 'Gramin Health',
    appSubtitle: 'ग्रामीण स्वास्थ्य ट्राइएज एवं डिजिटल स्वास्थ्य इकोसिस्टम',
    notADoctorBadge: 'निर्णय सहायता एवं रेफरल प्रणाली • एआई डॉक्टर नहीं',
    emergencyDisclaimer: 'यह प्रणाली एक स्वास्थ्य ट्राइएज और रेफरल सहायक है, डॉक्टर नहीं। किसी भी आपातकालीन स्थिति में तुरंत 108 डायल करें या नजदीकी अस्पताल जाएं।',
    heroHeading: 'ग्रामीण भारत के लिए सुरक्षित, त्वरित स्वास्थ्य ट्राइएज व रेफरल',
    heroSubheading: 'मरीजों और स्वास्थ्य कार्यकर्ताओं के लिए आधिकारिक आपातकालीन नियमों व निकटतम स्वास्थ्य केंद्रों (PHC/CHC) से युक्त आधुनिक निर्णय प्रणाली।',
    
    // Navigation Modules
    navHome: 'होम',
    navTriage: '1. AI ट्राइएज व आवाज',
    navAppointments: '2. OPD कतार व टोकन',
    navPatients: '3. मरीज रिकॉर्ड (LPR)',
    navReferrals: '4. रेफरल नेटवर्क',
    navDiagnostics: '5. जांच व लैब',
    navInventory: '6. दवा उपलब्धता',
    navHighrisk: '7. आशा फील्ड कार्य',
    navDashboard: '8. केंद्र कमांड व मैप',
    navFacilities: 'अस्पताल व PHC',
    navGuidelines: 'ASHA आपात नियम',
    navHistory: 'परामर्श इतिहास',
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
    send: 'लक्षणों का मूल्यांकन करें',
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
    
    // Appointments & Queue
    queueTitle: 'दैनिक ओपीडी स्मार्ट कतार एवं टोकन बोर्ड',
    queueSubtitle: 'वास्तविक समय में टोकन स्थिति, प्रतीक्षा समय और डॉक्टर परामर्श नियंत्रण',
    bookAppointmentBtn: '📅 ओपीडी अपॉइंटमेंट बुक करें',
    issueWalkInBtn: '⚡ वॉक-इन टोकन जारी करें',
    nowServing: 'वर्तमान परामर्श (Serving Now)',
    nextInLine: 'अगला टोकन',
    waitingCount: 'प्रतीक्षारत मरीज',
    estWaitTime: 'अनुमानित प्रतीक्षा समय',
    callNextBtn: 'मरीज को बुलाएं (Call)',
    startConsultBtn: 'परामर्श शुरू करें',
    completeConsultBtn: 'परामर्श संपन्न करें',
    skipPatientBtn: 'छोड़ें (Skip)',
    
    // Patient Records
    patientDirectoryTitle: 'दीर्घकालिक रोगी रिकॉर्ड (LPR / ABHA)',
    patientDirectorySub: 'एकीकृत स्वास्थ्य इतिहास, नैदानिक परामर्श, नुस्खे एवं जांच रिपोर्ट',
    registerPatientBtn: '+ नया मरीज पंजीकृत करें',
    addObservationBtn: '+ क्लिनिकल नोट जोड़ें',
    timelineTitle: 'रोगी संपूर्ण स्वास्थ्य समयरेखा (Unified Timeline)',
    
    // Referrals
    referralTitle: 'क्लोज्ड-लूप रेफरल ट्रैकिंग नेटवर्क',
    referralSubtitle: 'उपकेंद्र से पीएचसी, सीएचसी एवं जिला अस्पताल तक सुरक्षित रोगी स्थानांतरण',
    createReferralBtn: '+ नया रेफरल तैयार करें',
    referralStageCreated: '1. रेफरल जारी',
    referralStageAccepted: '2. स्वीकार हुआ',
    referralStageQueued: '3. कतारबद्ध',
    referralStageArrived: '4. मरीज पहुंचा',
    referralStageCompleted: '5. उपचार संपन्न',

    // Diagnostics
    diagnosticTitle: 'नैदानिक परीक्षण एवं नमूना रसद ट्रैकिंग',
    diagnosticSubtitle: 'उपकेंद्र एवं पीएचसी से एकत्रित लैब नमूनों की रीयल-टाइम स्थिति',
    orderTestBtn: '+ नई लैब जांच दर्ज करें',
    testStageRequested: 'अनुरोधित (Requested)',
    testStageCollected: 'सैंपल एकत्रित (Collected)',
    testStageProcessing: 'जांच जारी (Processing)',
    testStageResult: 'परिणाम तैयार (Report Ready)',
    
    // Inventory
    inventoryTitle: 'आवश्यक दवा स्टॉक एवं कमी का पूर्वानुमान',
    inventorySubtitle: 'पीएचसी, सीएचसी एवं जन औषधि केंद्रों में लाइव दवा उपलब्धता',
    updateStockBtn: 'स्टॉक अपडेट करें',
    searchNearbyMeds: 'निकटतम केंद्रों में दवा खोजें',
    inStock: 'उपलब्ध (In Stock)',
    lowStock: 'कम स्टॉक (Low Stock)',
    outOfStock: 'अनुपलब्ध (Out of Stock)',
    aiSubstitute: 'एआई वैकल्पिक दवा सुझाव:',

    // High Risk & ASHA
    highRiskTitle: 'उच्च जोखिम मरीज निगरानी एवं आशा कार्य सूची',
    highRiskSubtitle: 'गर्भवती महिलाएं (ANC), कुपोषित बच्चे (SAM) एवं गंभीर रोग गृह-भेंट अनुसूची',
    scheduleFollowupBtn: '+ गृह-भेंट अनुसूची बनाएं',
    recordVisitBtn: 'भेंट संपन्न करें व वाइटल्स दर्ज करें',
    overdueWarning: 'अतिदेय (Overdue) - तत्काल ध्यान दें!',
    dueTodayWarning: 'आज देय (Due Today)',
    upcomingTask: 'आगामी कार्य (Upcoming)',

    // Operational Dashboard
    dashboardTitle: 'चिकित्सा अधिकारी परिचालन कमांड केंद्र',
    dashboardSubtitle: 'स्वास्थ्य केंद्र की लाइव क्षमता, आपातकालीन स्थिति और संसाधन विश्लेषण',
    updateBedsBtn: 'बेड क्षमता अपडेट करें',

    // Auth Modal
    loginTitle: 'मरीज / स्वास्थ्य कार्यकर्ता लॉगिन',
    signupTitle: 'नया खाता बनाएं',
    otpTitle: 'OTP कोड सत्यापन',
    forgotTitle: 'पासवर्ड भूल गए?',
    resetTitle: 'नया पासवर्ड सेट करें',
    identifierLabel: 'मोबाइल नंबर या ईमेल पता',
    identifierPlaceholder: 'उदा. 9876543210 या patient@example.com',
    passwordLabel: 'पासवर्ड',
    passwordPlaceholder: 'अपना पासवर्ड दर्ज करें',
    nameLabel: 'पूरा नाम',
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
    loginButton: 'लॉगिन करें',
    signupButton: 'OTP सत्यापन कोड भेजें',
    verifyButton: 'सत्यापित करें व खाता सक्रिय करें',
    forgotButton: 'OTP कोड भेजें',
    resetButton: 'पासवर्ड रीसेट करें',
    toSignup: 'खाता नहीं है? नया खाता बनाएं →',
    toLogin: 'पहले से खाता है? लॉगिन करें →',
    toForgot: 'पासवर्ड भूल गए? पासवर्ड रीसेट करें →',
    guestAccess: 'अतिथि मोड में तुरंत परामर्श जारी रखें (Guest Mode)',
    invalidUserError: 'अमान्य क्रेडेंशियल्स: उपयोगकर्ता नहीं मिला या पासवर्ड गलत है।',
    invalidOtpError: 'अमान्य OTP कोड: कृपया सही 6-अंकीय कोड दर्ज करें।',
    userExistsError: 'इस मोबाइल नंबर या ईमेल से खाता पहले से मौजूद है। कृपया लॉगिन करें।',
    loginSuccessMsg: 'लॉगिन सफल!',
    signupSuccessMsg: 'खाता सक्रिय हो गया! स्वागत है।',
    otpSentMsg: '6-अंकीय OTP कोड आपके मोबाइल/ईमेल पर भेजा गया है।',
    resetSuccessMsg: 'पासवर्ड सफलतापूर्वक बदल दिया गया है! अब लॉगिन करें।',

    // Roles
    rolePatient: 'मरीज (Patient)',
    roleAsha: 'आशा कार्यकर्ता (ASHA)',
    roleDoctor: 'चिकित्सा अधिकारी (Doctor / MO)',
  },

  mr: {
    // Brand & Header
    appTitle: 'Gramin Health',
    appSubtitle: 'ग्रामीण आरोग्य ट्रायज आणि डिजिटल आरोग्य इकोसिस्टम',
    notADoctorBadge: 'वैद्यकीय निर्णय-समर्थन आणि संदर्भ प्रणाली • एआय डॉक्टर नाही',
    emergencyDisclaimer: 'ही प्रणाली एक आरोग्य ट्रायज आणि संदर्भ सहाय्यक आहे, डॉक्टर नाही. कोणत्याही आपत्कालीन परिस्थितीत त्वरित १०८ डायल करा किंवा जवळच्या रुग्णालयात जा.',
    heroHeading: 'ग्रामीण भारतासाठी सुरक्षित, जलद आरोग्य ट्रायज आणि क्लिनिकल रेफरल',
    heroSubheading: 'नागरिक आणि आरोग्य सेवकांसाठी अधिकृत आपत्कालीन नियम आणि जवळच्या प्राथमिक आरोग्य केंद्रांशी (PHC/CHC) जोडलेली आधुनिक प्रणाली.',
    
    // Navigation Modules
    navHome: 'मुख्यपृष्ठ',
    navTriage: '1. AI ट्रायज व आवाज',
    navAppointments: '2. OPD रांग व टोकन',
    navPatients: '3. रुग्ण नोंदी (LPR)',
    navReferrals: '4. रेफरल नेटवर्क',
    navDiagnostics: '5. तपासणी व लॅब',
    navInventory: '6. औषध उपलब्धता',
    navHighrisk: '7. आशा क्षेत्रीय कार्य',
    navDashboard: '8. केंद्र नियंत्रण व नकाशा',
    navFacilities: 'रुग्णालये व PHC',
    navGuidelines: 'आशा आपत्कालीन नियम',
    navHistory: 'तपासणी इतिहास',
    navLogin: 'साइन इन / नोंदणी',
    navGuest: 'अतिथी मोड (Guest)',
    navLogout: 'साइन आउट',
    
    // Emergency Action
    dial108: '१०८ आपत्कालीन रुग्णवाहिका',
    emergencyAlertTitle: 'आपत्कालीन रेड-फ्लॅग धोक्याचे लक्षण आढळले!',
    emergencyAlertSub: 'रुग्णाला त्वरित आपत्कालीन वैद्यकीय सेवेची गरज आहे. कृपया त्वरित १०८ रुग्णवाहिका बोलवा.',
    
    // Triage Console
    newChat: 'नवीन तपासणी (New Chat)',
    chatHistory: 'मागील तपासणी इतिहास',
    saveChat: 'तपासणी जतन करा',
    renameChat: 'नाव बदला',
    chatNamePlaceholder: 'तपासणीचे नाव टाका (उदा. ताप तपासणी)',
    selectScenario: 'नमुना प्रकरणे (परीक्षण)',
    scenarioHelp: 'एका क्लिकमध्ये लक्षणे आणि आपत्कालीन नियमांची चाचणी करा:',
    dangerSignsDetected: 'ओळखलेली धोक्याची लक्षणे (Danger Signs):',
    noDangerSigns: 'कोणतेही तातडीचे धोक्याचे लक्षण आढळले नाही.',
    triageCategory: 'ट्रायज श्रेणी',
    deleteChat: 'हटवा',
    
    // Input / Voice
    inputPlaceholder: 'रुग्णाची लक्षणे येथे लिहा किंवा खालील माईक बटण दाबून मराठीत बोला...',
    speakInHindi: 'मराठीत बोला (माईक दाबा)',
    listening: 'ऐकत आहे... कृपया स्पष्ट बोला',
    stopRecording: 'रेकॉर्डिंग थांबवा',
    processingAudio: 'आवाजाचे विश्लेषण सुरू आहे...',
    send: 'लक्षणांचे मूल्यांकन करा',
    audioRecorded: 'ऑडिओ रेकॉर्ड झाला',
    playVoice: 'आवाजात ऐका',
    stopVoice: 'आवाज थांबवा',
    
    // Result Severities
    severity_EMERGENCY: '🔴 आपत्कालीन (EMERGENCY) - त्वरित रेफरल आवश्यक',
    severity_SYMPTOM_ASSESSMENT: '🟡 लक्षण मूल्यांकन (SYMPTOM ASSESSMENT) - PHC/CHC सल्ला',
    severity_FACILITY_LOOKUP: '🔵 आरोग्य केंद्र शोध (FACILITY LOOKUP)',
    
    // Doctor Summary
    viewDoctorSummary: 'डॉक्टर रेफरल स्लिप पहा (SBAR)',
    generateSummary: 'डॉक्टर सारांश तयार करा',
    referralSlipTitle: 'आपत्कालीन / सामान्य रुग्ण रेफरल स्लिप',
    sbarSituation: 'S - सद्यस्थिती (Situation)',
    sbarBackground: 'B - पार्श्वभूमी व लक्षण कालावधी (Background)',
    sbarAssessment: 'A - मूल्यमापन व मार्गदर्शक तत्त्वे (Assessment)',
    sbarRecommendation: 'R - रेफरल शिफारस व तात्काळ पावले (Recommendation)',
    targetFacility: 'शिफारस केलेले केंद्र:',
    severityLevel: 'गंभीरता पातळी:',
    printReferral: 'रेफरल स्लिप प्रिंट करा',
    downloadPdf: 'PDF डाउनलोड करा',
    close: 'बंद करा',
    
    // Facilities Locator
    facilitySearchTitle: 'जवळचे आरोग्य केंद्र आणि रुग्णालय शोधा',
    findNearMe: 'माझे सध्याचे स्थान (GPS)',
    locationTrackerTitle: 'तुमचे स्थान आणि परिसरातील आरोग्य सेवा',
    changeLocation: 'स्थान बदला',
    searchRadius: 'शोध अंतर (किलोमीटर):',
    filterAll: 'सर्व केंद्रे',
    filterEmergency: '२४x७ आपत्कालीन सेवा',
    filterPHC: 'प्राथमिक आरोग्य केंद्र (PHC)',
    filterCHC: 'ग्रामीण रुग्णालय (CHC)',
    filterHospital: 'जिल्हा रुग्णालय (Hospital)',
    bedsAvailable: 'उपलब्ध खाटा:',
    distanceKm: 'अंतर:',
    callNow: 'कॉल करा',
    getDirections: 'नकाशावर मार्ग पहा',
    noFacilitiesFound: 'या भागात कोणतेही आरोग्य केंद्र आढळले नाही. कृपया अंतर वाढवा.',
    
    // Guidelines
    guidelinesTitle: 'राष्ट्रीय आरोग्य अभियान (ASHA) आपत्कालीन धोक्याची लक्षणे',
    guidelinesDesc: 'भारत सरकार आणि ICMR मार्गदर्शक तत्त्वांवर आधारित आपत्कालीन ट्रायज नियम.',
    
    // Appointments & Queue
    queueTitle: 'दैनिक OPD स्मार्ट रांग आणि टोकन फलक',
    queueSubtitle: 'थेट टोकन स्थिती, अंदाजे प्रतीक्षा वेळ आणि डॉक्टर तपासणी नियंत्रण',
    bookAppointmentBtn: '📅 OPD अपॉइंटमेंट बुक करा',
    issueWalkInBtn: '⚡ वॉक-इन टोकन द्या',
    nowServing: 'सध्या सुरू असलेली तपासणी (Serving Now)',
    nextInLine: 'पुढील टोकन',
    waitingCount: 'प्रतीक्षेत असलेले रुग्ण',
    estWaitTime: 'अंदाजे प्रतीक्षा वेळ',
    callNextBtn: 'पुढील रुग्णाला बोलवा (Call)',
    startConsultBtn: 'तपासणी सुरू करा',
    completeConsultBtn: 'तपासणी पूर्ण करा',
    skipPatientBtn: 'वगळा (Skip)',
    
    // Patient Records
    patientDirectoryTitle: 'दीर्घकालीन रुग्ण नोंदी (LPR / ABHA)',
    patientDirectorySub: 'एकीकृत आरोग्य इतिहास, वैद्यकीय सल्ला, औषधोपचार आणि लॅब अहवाल',
    registerPatientBtn: '+ नवीन रुग्ण नोंदणी करा',
    addObservationBtn: '+ क्लिनिकल नोंद जोडा',
    timelineTitle: 'रुग्ण संपूर्ण आरोग्य कालरेषा (Unified Timeline)',
    
    // Referrals
    referralTitle: 'क्लोज्ड-लूप रेफरल ट्रॅकिंग नेटवर्क',
    referralSubtitle: 'उपकेंद्राकडून प्राथमिक आरोग्य केंद्र, ग्रामीण रुग्णालय व जिल्हा रुग्णालयापर्यंत सुरक्षित रुग्ण हस्तांतरण',
    createReferralBtn: '+ नवीन रेफरल तयार करा',
    referralStageCreated: '1. रेफरल जारी',
    referralStageAccepted: '2. स्वीकारले',
    referralStageQueued: '3. रांगेत समाविष्ट',
    referralStageArrived: '4. रुग्ण पोहोचला',
    referralStageCompleted: '5. उपचार पूर्ण',

    // Diagnostics
    diagnosticTitle: 'लॅब चाचण्या व नमुने वाहतूक ट्रॅकिंग',
    diagnosticSubtitle: 'उपकेंद्र व प्राथमिक आरोग्य केंद्रातून गोळा केलेल्या लॅब नमुन्यांची थेट स्थिती',
    orderTestBtn: '+ नवीन लॅब चाचणी नोंदवा',
    testStageRequested: 'विनंती केली (Requested)',
    testStageCollected: 'नमुना गोळा केला (Collected)',
    testStageProcessing: 'तपासणी सुरू (Processing)',
    testStageResult: 'अहवाल तयार (Report Ready)',
    
    // Inventory
    inventoryTitle: 'आवश्यक औषध साठा व तुटवडा अंदाज',
    inventorySubtitle: 'प्राथमिक आरोग्य केंद्र, ग्रामीण रुग्णालय व जन औषधी केंद्रातील थेट औषध उपलब्धता',
    updateStockBtn: 'साठा अपडेट करा',
    searchNearbyMeds: 'जवळच्या केंद्रांत औषध शोधा',
    inStock: 'उपलब्ध (In Stock)',
    lowStock: 'कमी साठा (Low Stock)',
    outOfStock: 'उपलब्ध नाही (Out of Stock)',
    aiSubstitute: 'पर्यायी औषध शिफारस:',

    // High Risk & ASHA
    highRiskTitle: 'उच्च जोखीम रुग्ण देखरेख व आशा कार्य यादी',
    highRiskSubtitle: 'गरोदर महिला (ANC), कुपोषित बालके (SAM) आणि जुनाट आजार गृहभेट वेळापत्रक',
    scheduleFollowupBtn: '+ गृहभेट वेळापत्रक बनवा',
    recordVisitBtn: 'भेट पूर्ण करा व नोंदी घ्या',
    overdueWarning: 'थकीत (Overdue) - त्वरित लक्ष द्या!',
    dueTodayWarning: 'आज करावयाची भेट (Due Today)',
    upcomingTask: 'आगामी कार्य (Upcoming)',

    // Operational Dashboard
    dashboardTitle: 'वैद्यकीय अधिकारी नियंत्रण केंद्र',
    dashboardSubtitle: 'आरोग्य केंद्राची थेट क्षमता, आपत्कालीन स्थिती आणि संसाधन विश्लेषण',
    updateBedsBtn: 'खाटांची क्षमता अपडेट करा',

    // Auth Modal
    loginTitle: 'रुग्ण / आरोग्य सेवक लॉगिन',
    signupTitle: 'नवीन खाते तयार करा',
    otpTitle: 'OTP पडताळणी',
    forgotTitle: 'पासवर्ड विसरलात?',
    resetTitle: 'नवीन पासवर्ड सेट करा',
    identifierLabel: 'मोबाईल नंबर किंवा ईमेल पत्ता',
    identifierPlaceholder: 'उदा. 9876543210 किंवा user@example.com',
    passwordLabel: 'पासवर्ड',
    passwordPlaceholder: 'तुमचा पासवर्ड टाका',
    nameLabel: 'पूर्ण नाव',
    namePlaceholder: 'उदा. रमेश पाटील',
    phoneLabel: 'मोबाईल नंबर (ईमेल दिल्यास पर्यायी)',
    phonePlaceholder: 'उदा. 9876543210',
    emailLabel: 'ईमेल पत्ता (मोबाईल दिल्यास पर्यायी)',
    emailPlaceholder: 'उदा. patient@example.com',
    phoneOrEmailHelp: 'मोबाईल नंबर किंवा ईमेल पत्ता (किंवा दोन्ही) टाका.',
    enterPhoneOrEmailError: 'कृपया नोंदणीसाठी मोबाईल नंबर किंवा ईमेल पत्ता टाका.',
    phoneOtpLabel: '📱 मोबाईल SMS OTP कोड टाका',
    phoneOtpPlaceholder: 'उदा. 123456',
    emailOtpLabel: '📧 ईमेल पडताळणी OTP कोड टाका',
    emailOtpPlaceholder: 'उदा. 123456',
    addressLabel: 'पत्ता / गावाचे नाव (पर्यायी)',
    addressPlaceholder: 'उदा. मु. पो. फाफामऊ',
    pincodeLabel: 'पिनकोड (पर्यायी)',
    pincodePlaceholder: 'उदा. 411001',
    otpLabel: '६-अंकी OTP कोड टाका',
    otpPlaceholder: '123456',
    newPasswordLabel: 'नवीन पासवर्ड',
    newPasswordPlaceholder: 'नवीन पासवर्ड टाका',
    contactLabel: 'नोंदणीकृत मोबाईल किंवा ईमेल',
    contactPlaceholder: 'उदा. 9876543210',
    loginButton: 'लॉगिन करा',
    signupButton: 'OTP कोड पाठवा',
    verifyButton: 'पडताळणी करा व खाते सुरू करा',
    forgotButton: 'OTP कोड पाठवा',
    resetButton: 'पासवर्ड रीसेट करा',
    toSignup: 'खाते नाही? नवीन खाते तयार करा →',
    toLogin: 'आधीच खाते आहे? लॉगिन करा →',
    toForgot: 'पासवर्ड विसरलात? रीसेट करा →',
    guestAccess: 'अतिथी मोडमध्ये सल्ला सुरू ठेवा',
    invalidUserError: 'अवैध माहिती: वापरकर्ता सापडला नाही किंवा पासवर्ड चुकीचा आहे.',
    invalidOtpError: 'चुकीचा OTP कोड: कृपया योग्य ६-अंकी कोड टाका.',
    userExistsError: 'या मोबाईल किंवा ईमेलने आधीच खाते अस्तित्वात आहे. कृपया लॉगिन करा.',
    loginSuccessMsg: 'लॉगिन यशस्वी झाले!',
    signupSuccessMsg: 'खाते तयार झाले! स्वागत आहे.',
    otpSentMsg: '६-अंकी OTP कोड तुमच्या मोबाईल/ईमेलवर पाठवला आहे.',
    resetSuccessMsg: 'पासवर्ड यशस्वीरीत्या बदलला आहे! आता लॉगिन करा.',

    // Roles
    rolePatient: 'रुग्ण व नागरिक (Patient)',
    roleAsha: 'आशा स्वयंसेविका (ASHA Worker)',
    roleDoctor: 'वैद्यकीय अधिकारी (Doctor / MO)',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('gramin_health_lang') as Language;
    return saved === 'en' || saved === 'hi' || saved === 'mr' ? saved : 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('gramin_health_lang', lang);
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  const tr = (en: string, hi: string, mr: string): string => {
    if (language === 'mr') return mr;
    if (language === 'hi') return hi;
    return en;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        tr,
        isEnglish: language === 'en',
        isHindi: language === 'hi',
        isMarathi: language === 'mr',
      }}
    >
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
