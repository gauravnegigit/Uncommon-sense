import { DangerSign, PresetScenario, RegionalLocation } from '../types';

export const API_BASE_URL = '/api';

export const EMERGENCY_NUMBERS = [
  { number: '108', titleEn: 'Emergency Ambulance', titleHi: 'आपातकालीन एम्बुलेंस' },
  { number: '102', titleEn: 'Janani Shishu Ambulance', titleHi: 'जननी शिशु सुरक्षा एम्बुलेंस' },
  { number: '112', titleEn: 'National Emergency Helpline', titleHi: 'राष्ट्रीय आपातकालीन सेवा' },
  { number: '104', titleEn: 'Health Information & Advice', titleHi: 'स्वास्थ्य सूचना एवं परामर्श' },
];

export const OFFICIAL_DANGER_SIGNS: DangerSign[] = [
  {
    id: 'breathing',
    titleEn: 'Breathing Difficulty / Stridor',
    titleHi: 'सांस लेने में गंभीर कठिनाई',
    keywords: [
      'सांस', 'साँस', 'breathing', 'breath', 'shortness of breath', 'stridor', 'cyanosis',
      'दम घुट', 'dyspnea', 'wheezing', 'हाफना', 'सांस फूलना'
    ],
  },
  {
    id: 'chest_pain',
    titleEn: 'Severe Chest Pain / Pressure',
    titleHi: 'सीने में तेज दर्द व भारीपन',
    keywords: [
      'chest pain', 'chest', 'सीने', 'सीना', 'छाती', 'दर्द', 'heart', 'दिल',
      'पसीना', 'sweat', 'radiating', 'pressure', 'भारीपन'
    ],
  },
  {
    id: 'unconscious',
    titleEn: 'Loss of Consciousness / Fainting',
    titleHi: 'बेहोशी / चेतना का लोप',
    keywords: [
      'unconscious', 'fainting', 'fainted', 'unresponsive', 'बेहोश', 'बेहोशी',
      'होश', 'चक्कर', 'coma', 'collapsed', 'अचेत'
    ],
  },
  {
    id: 'bleeding',
    titleEn: 'Severe / Uncontrolled Bleeding',
    titleHi: 'अत्यधिक रक्तस्राव',
    keywords: [
      'bleeding', 'blood', 'hemorrhage', 'खून', 'रक्त', 'रक्तस्राव',
      'उल्टी में खून', 'heavy bleed', 'चोट'
    ],
  },
  {
    id: 'seizures',
    titleEn: 'Confusion / Convulsions / Seizures',
    titleHi: 'दौरे पड़ना / मानसिक भ्रम',
    keywords: [
      'confusion', 'seizure', 'convulsion', 'fits', 'दौरे', 'मिरगी',
      'झटके', 'भ्रम', 'stiff neck', 'गर्दन अकड़ना'
    ],
  },
  {
    id: 'choking',
    titleEn: 'Choking / Airway Obstruction',
    titleHi: 'गले में कुछ अटकना / दम घुटना',
    keywords: [
      'choking', 'choke', 'foreign body', 'गले में अटक', 'दम घुटना', 'अटक गया'
    ],
  },
  {
    id: 'obstetric',
    titleEn: 'Pregnancy Complications / Labour',
    titleHi: 'गर्भावस्था की आपात स्थिति',
    keywords: [
      'pregnancy', 'pregnant', 'labor', 'गर्भवती', 'प्रसव', 'गर्भ',
      'bleeding in pregnancy', 'प्रसव पीड़ा'
    ],
  },
  {
    id: 'snakebite',
    titleEn: 'Snake Bite / Poisoning',
    titleHi: 'सांप का काटना / विषबाधा',
    keywords: [
      'snake', 'snakebite', 'poison', 'poisoning', 'सांप', 'जहर', 'विष',
      'कीटनाशक', 'काट लिया'
    ],
  },
];

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: '1',
    titleEn: 'Severe Chest Pain & Breathlessness',
    titleHi: 'सीने में तीव्र दर्द और सांस फूलना',
    badge: 'EMERGENCY',
    promptHi: 'मुझे 2 घंटे से सीने में बहुत तेज दर्द और भारीपन हो रहा है, दर्द बाएं हाथ में जा रहा है और सांस लेने में बहुत तकलीफ़ हो रही है।',
    promptEn: 'I have severe chest pain and heavy pressure for 2 hours, radiating to left arm with acute shortness of breath.',
    expected: 'EMERGENCY',
  },
  {
    id: '2',
    titleEn: 'Severe Trauma with Bleeding & Fainting',
    titleHi: 'गंभीर चोट, रक्तस्राव और बेहोशी',
    badge: 'EMERGENCY',
    promptHi: 'सड़क दुर्घटना के बाद मरीज के सिर और पैर से बहुत खून बह रहा है और वह बेहोश हो गया है, कुछ बोल नहीं पा रहा है।',
    promptEn: 'After a road trauma, the patient has heavy bleeding from head and leg and has become completely unconscious.',
    expected: 'EMERGENCY',
  },
  {
    id: '3',
    titleEn: 'High Fever with Chills for 3 Days',
    titleHi: '3 दिनों से तेज बुखार और कंपकंपी',
    badge: 'ASSESSMENT',
    promptHi: 'मुझे 3 दिन से 102 डिग्री तेज बुखार आ रहा है, बहुत ठंड और कंपकंपी लग रही है और सिर में दर्द है, सांस में कोई परेशानी नहीं है।',
    promptEn: 'I have had high fever of 102°F with intense chills and headache for 3 days. No breathing difficulty.',
    expected: 'SYMPTOM_ASSESSMENT',
  },
  {
    id: '4',
    titleEn: 'Nearest PHC & Ambulance Enquiry',
    titleHi: 'निकटतम प्राथमिक स्वास्थ्य केंद्र व एम्बुलेंस',
    badge: 'FACILITY LOOKUP',
    promptHi: 'मेरे गांव के पास सबसे नजदीकी प्राथमिक स्वास्थ्य केंद्र (PHC) कहां है और 108 एम्बुलेंस कैसे बुलाएं?',
    promptEn: 'Where is the nearest Primary Health Centre (PHC) and how to call 108 ambulance?',
    expected: 'FACILITY_LOOKUP',
  },
  {
    id: '5',
    titleEn: 'Vague Symptoms (Safety Clarification)',
    titleHi: 'अस्पष्ट लक्षण (सुरक्षा स्पष्टीकरण)',
    badge: 'SAFETY CHECK',
    promptHi: 'मुझे सुबह से ठीक नहीं लग रहा है, शरीर में अजीब सी बेचैनी है।',
    promptEn: 'I am not feeling well since morning, feeling uneasy in my body.',
    expected: 'SYMPTOM_ASSESSMENT',
  },
];

export const REGIONAL_LOCATIONS: RegionalLocation[] = [
  {
    name: 'Phaphamau, Prayagraj (UP)',
    pincode: '211013',
    lat: 25.4920,
    lng: 81.8640,
    phcsCount: 4,
    emergencyBeds: 186,
  },
  {
    name: 'Malihabad Rural, Lucknow (UP)',
    pincode: '226102',
    lat: 26.9200,
    lng: 80.7100,
    phcsCount: 3,
    emergencyBeds: 120,
  },
  {
    name: 'Kashi Rural / Shivpur, Varanasi (UP)',
    pincode: '221003',
    lat: 25.3500,
    lng: 82.9800,
    phcsCount: 5,
    emergencyBeds: 210,
  },
  {
    name: 'Danapur Rural, Patna (Bihar)',
    pincode: '801503',
    lat: 25.6300,
    lng: 85.0400,
    phcsCount: 4,
    emergencyBeds: 160,
  },
  {
    name: 'Chomu Rural, Jaipur (Rajasthan)',
    pincode: '303702',
    lat: 27.1700,
    lng: 75.7200,
    phcsCount: 3,
    emergencyBeds: 95,
  },
];

// Helper to scan danger signs locally as an immediate safety fallback
export function scanDangerSigns(text: string): string[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  const detected: string[] = [];

  OFFICIAL_DANGER_SIGNS.forEach((sign) => {
    if (sign.keywords.some((kw) => lower.includes(kw.toLowerCase()))) {
      detected.push(sign.titleEn);
    }
  });

  return Array.from(new Set(detected));
}
