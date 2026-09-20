import React, { useState } from 'react';
import {
  Activity,
  ArrowRight,
  PhoneCall,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Building2,
  Ticket,
  Sparkles,
  Lock,
  HeartPulse,
  Compass,
  Zap,
  Stethoscope,
  HeartHandshake,
  UserCheck,
  FileText,
  Hospital,
  ChevronDown,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { PersonaRole, QueueEntryResponse, TriageMessage } from '../../types';
import { appointmentService } from '../../services/appointmentService';
import { TriageConsole } from '../triage/TriageConsole';
import { DangerSignsCard } from '../triage/DangerSignsCard';
import { PresetScenarios } from '../triage/PresetScenarios';
import { DoctorSummaryModal } from '../summary/DoctorSummaryModal';
import { FacilityLocator } from '../facilities/FacilityLocator';

interface LandingPageProps {
  chatId: string;
  setChatId: (id: string) => void;
  messages: TriageMessage[];
  setMessages: React.Dispatch<React.SetStateAction<TriageMessage[]>>;
  dangerSigns: string[];
  setDangerSigns: React.Dispatch<React.SetStateAction<string[]>>;
  onSelectRole?: (role: PersonaRole) => void;
  onSelectScenario?: (promptText: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  chatId,
  setChatId,
  messages,
  setMessages,
  dangerSigns,
  setDangerSigns,
  onSelectRole,
  onSelectScenario,
}) => {
  const { t, tr, isEnglish, isHindi, isMarathi } = useLanguage();
  const { isAuthenticated, user, setIsAuthModalOpen, setAuthModalMode } = useAuth();

  // Doctor Summary Modal State
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);

  // Quick Token Lookup state
  const [quickTokenId, setQuickTokenId] = useState('');
  const [tokenResult, setTokenResult] = useState<QueueEntryResponse | null>(null);
  const [isCheckingToken, setIsCheckingToken] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const handleQuickTokenCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTokenId.trim()) return;
    setIsCheckingToken(true);
    setTokenError(null);
    setTokenResult(null);

    try {
      const res = await appointmentService.getQueueEntry(quickTokenId.trim());
      if (res) {
        setTokenResult(res);
      } else {
        setTokenError(
          tr(
            'No live queue record found for this Token ID. Please verify the number.',
            'इस टोकन आईडी के लिए कोई रिकॉर्ड नहीं मिला। कृपया नंबर जांचें।',
            'या टोकन आयडीसाठी कोणतीही नोंद आढळली नाही. कृपया नंबर तपासा.'
          )
        );
      }
    } catch {
      setTokenError(
        tr(
          'Unable to check token status. Please check your connection or token ID.',
          'टोकन विवरण लोड करने में असमर्थ। कृपया आईडी या कनेक्शन जांचें।',
          'टोकन स्थिती तपासता आली नाही. कृपया आयडी किंवा इंटरनेट तपासा.'
        )
      );
    } finally {
      setIsCheckingToken(false);
    }
  };

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePresetSelect = (promptText: string) => {
    if (onSelectScenario) {
      onSelectScenario(promptText);
    } else {
      const inputElement = document.querySelector('input[type="text"]') as HTMLInputElement;
      if (inputElement) {
        inputElement.value = promptText;
        inputElement.dispatchEvent(new Event('input', { bubbles: true }));
        inputElement.focus();
      }
    }
    scrollToSection('triage-section');
  };

  return (
    <div className="space-y-12 py-4">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-[#0b2920] to-emerald-950 text-white p-8 sm:p-14 shadow-2xl border border-emerald-800/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-2xl pointer-events-none -ml-20 -mb-20"></div>

        <div className="relative z-10 max-w-4xl space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3.5 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>
                {tr(
                  'National Health Mission (NHM) Standards',
                  'राष्ट्रीय स्वास्थ्य मिशन आधारित',
                  'राष्ट्रीय आरोग्य अभियान मानके'
                )}
              </span>
            </span>
            <span className="px-3.5 py-1 rounded-full text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-400/30 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>
                {tr(
                  'Instant 108 Emergency Ambulance Link',
                  'त्वरित 108 एम्बुलेंस लिंक',
                  'तात्काळ १०८ रुग्णवाहिका जोडणी'
                )}
              </span>
            </span>
            <span className="px-3.5 py-1 rounded-full text-xs font-black bg-teal-500/20 text-teal-300 border border-teal-400/30 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>
                {tr(
                  '100% Patient Privacy & Real DB',
                  '100% मरीज गोपनीयता एवं प्रामाणिक डेटा',
                  '१००% रुग्ण गोपनीयता व अधिकृत डेटा'
                )}
              </span>
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            {tr(
              'Intelligent, Safe & Accessible Rural Health Platform',
              'ग्रामीण भारत के लिए सशक्त, सुरक्षित एवं समर्पित स्वास्थ्य प्लेटफॉर्म',
              'ग्रामीण भारतासाठी सुरक्षित, विश्वासार्ह व एकात्मिक डिजिटल आरोग्य सेवा'
            )}
          </h1>

          <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-3xl font-hindi">
            {tr(
              'Designed for rural citizens, frontline ASHA workers, and Primary Health Centre Medical Officers. Evaluate symptoms via AI in English, Hindi, and Marathi, identify life-threatening red-flag emergencies, track live OPD queue tokens, and locate nearby healthcare facilities with real-time bed capacity.',
              'ग्रामीण नागरिकों, आशा कार्यकर्ताओं और प्राथमिक स्वास्थ्य केंद्र चिकित्सा अधिकारियों के लिए समर्पित। अंग्रेजी, हिंदी और मराठी में लक्षणों की त्वरित एआई जांच करें, आपातकालीन रेड-फ्लैग की पहचान करें, लाइव ओपीडी टोकन ट्रैक करें और नजदीकी स्वास्थ्य केंद्रों में बेड उपलब्धता देखें।',
              'ग्रामीण नागरिक, आशा स्वयंसेविका आणि प्राथमिक आरोग्य केंद्राच्या वैद्यकीय अधिकाऱ्यांसाठी समर्पित. इंग्रजी, हिंदी आणि मराठीत लक्षणांची अचूक AI तपासणी करा, तात्काळ धोक्याची लक्षणे ओळखा, ओपीडी टोकन तपासा आणि जवळच्या रुग्णालयांची थेट माहिती मिळवा.'
            )}
          </p>

          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <button
              onClick={() => scrollToSection('triage-section')}
              className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <HeartPulse className="w-4 h-4" />
              <span>
                {tr('Start AI Symptom Triage', 'लक्षण जांच शुरू करें', 'AI लक्षण तपासणी सुरू करा')}
              </span>
              <ChevronDown className="w-4 h-4" />
            </button>

            <button
              onClick={() => scrollToSection('token-section')}
              className="px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm flex items-center gap-2 border border-white/20 backdrop-blur-xs transition-all cursor-pointer"
            >
              <Ticket className="w-4 h-4 text-teal-300" />
              <span>
                {tr('Track OPD Token', 'टोकन स्थिति देखें', 'ओपीडी टोकन स्थिती')}
              </span>
            </button>

            <button
              onClick={() => scrollToSection('facilities-section')}
              className="px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm flex items-center gap-2 border border-white/20 backdrop-blur-xs transition-all cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-emerald-300" />
              <span>
                {tr('Nearby Hospitals', 'नजदीकी अस्पताल', 'जवळची रुग्णालये')}
              </span>
            </button>

            <a
              href="tel:108"
              className="px-6 py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-sm flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all animate-pulse"
            >
              <PhoneCall className="w-4 h-4" />
              <span>108 {tr('Ambulance', 'एम्बुलेंस', 'रुग्णवाहिका')}</span>
            </a>
          </div>
        </div>
      </section>

      {/* 2. ABOUT GRAMIN HEALTH & MISSION SECTION */}
      <section className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/90 shadow-xs space-y-8">
        <div className="max-w-3xl space-y-2">
          <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
            {tr('About Our Platform & Mission', 'हमारे प्लेटफॉर्म व मिशन के बारे में', 'आमच्या व्यासपीठ आणि उद्दिष्टांबद्दल')}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-950">
            {tr(
              'Bridging Grassroots Villages with Quality Clinical Care',
              'ग्रामीण क्षेत्रों को गुणवत्तापूर्ण स्वास्थ्य सेवाओं से जोड़ना',
              'ग्रामीण भागाला दर्जेदार व जलद आरोग्य सेवेशी जोडणारा सेतू'
            )}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-hindi leading-relaxed">
            {tr(
              'Gramin Health is engineered to tackle the critical healthcare challenges of rural India: geographical remoteness, medical officer shortages, and referral delays. The platform provides safe, protocol-driven clinical triage for patients, while offering dedicated, privacy-protected workspaces for healthcare workers.',
              'ग्रामीण हेल्थ का उद्देश्य ग्रामीण भारत की स्वास्थ्य चुनौतियों का समाधान करना है: भौगोलिक दूरी, डॉक्टरों की कमी और रेफरल में देरी। यह प्लेटफॉर्म मरीजों के लिए सुरक्षित एआई ट्राइएज उपलब्ध कराता है, तथा स्वास्थ्य कर्मियों के लिए पूर्णतः सुरक्षित कार्यक्षेत्र प्रदान करता है।',
              'ग्रामीण हेल्थ हे दुर्गम भागातील नागरिकांना तात्काळ वैद्यकीय मार्गदर्शन देण्यासाठी तयार केले आहे. हे व्यासपीठ नागरिकांसाठी सुरक्षित लक्षण तपासणी प्रदान करते, तसेच डॉक्टर व आशा स्वयंसेविकांसाठी सुरक्षित कार्यप्रणाली उपलब्ध करून देते.'
            )}
          </p>
        </div>

        {/* 6 Core Platform Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Pillar 1 */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 hover:border-emerald-500 hover:bg-emerald-50/20 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
              🩺
            </div>
            <h4 className="text-sm font-black text-slate-900">
              {tr(
                'Clinical-Grade AI Triage',
                'चिकित्सीय-मानक एआई ट्राइएज',
                'वैद्यकीय निकषांवर आधारित AI ट्रायज'
              )}
            </h4>
            <p className="text-xs text-slate-600 font-hindi leading-relaxed">
              {tr(
                'Evaluates symptoms strictly against Ministry of Health (MoHFW) and NHM protocols. Never guesses or provides unsafe home remedies for serious conditions.',
                'स्वास्थ्य मंत्रालय (MoHFW) एवं NHM नियमों के अनुसार लक्षणों का विश्लेषण। गंभीर स्थितियों में कभी भी खतरनाक घरेलू नुस्खे नहीं सुझाता।',
                'आरोग्य मंत्रालय व NHM नियमांनुसार लक्षणांचे विश्लेषण. कोणत्याही गंभीर स्थितीत धोकादायक अंदाज न बांधता योग्य मार्ग दाखवते.'
              )}
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 hover:border-red-400 hover:bg-red-50/20 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
              🚨
            </div>
            <h4 className="text-sm font-black text-slate-900">
              {tr(
                'Instant Emergency Red-Flags',
                'तात्कालिक आपातकालीन चेतावनी',
                'तातडीचे आपत्कालीन धोक्याचे संकेत'
              )}
            </h4>
            <p className="text-xs text-slate-600 font-hindi leading-relaxed">
              {tr(
                'Deterministic scanning detects critical red-flags: cardiac chest pain, severe obstetric bleeding, infant dehydration, and trauma with zero latency and direct 108 calling.',
                'सीने का दर्द, प्रसव रक्तस्राव, शिशु निर्जलीकरण व दुर्घटना जैसे गंभीर आपातकालीन लक्षणों की तुरंत पहचान और 108 एम्बुलेंस सहायता।',
                'छातीत वेदना, गरोदरपणातील रक्तस्त्राव, बालकांमधील तीव्र निर्जलीकरण व गंभीर अपघात यांसारख्या धोक्यांची तात्काळ सूचना व १०८ संपर्क.'
              )}
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 hover:border-blue-400 hover:bg-blue-50/20 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
              🗣️
            </div>
            <h4 className="text-sm font-black text-slate-900">
              {tr(
                'Trilingual Voice Accessibility',
                'त्रिभाषी वॉयस एवं टेक्स्ट सुविधा',
                'इंग्रजी, हिंदी व मराठी संवाद'
              )}
            </h4>
            <p className="text-xs text-slate-600 font-hindi leading-relaxed">
              {tr(
                'Fully accessible in English, Hindi, and Marathi. Voice recording and speech synthesis allow rural citizens of all literacy levels to explain symptoms naturally.',
                'अंग्रेजी, हिंदी और मराठी में पूरी तरह उपलब्ध। आवाज से लक्षण बताने और सुनने की सुविधा ताकि हर ग्रामीण नागरिक आसानी से उपयोग कर सके।',
                'इंग्रजी, हिंदी आणि मराठीमध्ये संपूर्ण माहिती. माईकद्वारे बोलून लक्षणे सांगण्याची आणि ऐकण्याची सोय, जेणेकरून प्रत्येकाला वापरणे सुलभ होईल.'
              )}
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 hover:border-indigo-400 hover:bg-indigo-50/20 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
              📋
            </div>
            <h4 className="text-sm font-black text-slate-900">
              {tr(
                'Standardized SBAR Handover',
                'डॉक्टर SBAR रेफरल सारांश',
                'डॉक्टर SBAR रेफरल स्लिप'
              )}
            </h4>
            <p className="text-xs text-slate-600 font-hindi leading-relaxed">
              {tr(
                'Generates certified clinical Situation, Background, Assessment, Recommendation (SBAR) slips for Medical Officers, saving vital triage minutes at the PHC.',
                'डॉक्टरों के लिए मानकीकृत SBAR रेफरल पर्ची तैयार करता है, जिससे अस्पताल पहुंचने पर मरीज की स्थिति समझने में समय की बचत होती है।',
                'वैद्यकीय अधिकाऱ्यांसाठी प्रमाणभूत SBAR रेफरल स्लिप तयार करते, ज्यामुळे रुग्णालयात पोहोचल्यावर प्राथमिक तपासणीचा वेळ वाचतो.'
              )}
            </p>
          </div>

          {/* Pillar 5 */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 hover:border-emerald-400 hover:bg-emerald-50/20 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
              🔒
            </div>
            <h4 className="text-sm font-black text-slate-900">
              {tr(
                'Strict Privacy & Protected Records',
                'गोपनीयता एवं सुरक्षित मरीज रिकॉर्ड',
                'कडक गोपनीयता व सुरक्षित नोंदी'
              )}
            </h4>
            <p className="text-xs text-slate-600 font-hindi leading-relaxed">
              {tr(
                'Patient clinical directories and ASHA registries are never shown on public pages. Full records and cabin controls are unlocked only when authenticated.',
                'सार्वजनिक पेज पर कभी भी अन्य मरीजों का डेटा नहीं दिखाया जाता। क्लिनिकल टाइमलाइन और केबिन नियंत्रण केवल लॉगिन के बाद ही उपलब्ध होते हैं।',
                'सार्वजनिक पृष्ठावर इतर रुग्णांची माहिती कधीही उघड केली जात नाही. सर्व नोंदी आणि नियंत्रण केवळ अधिकृत लॉगिननंतरच दिसतात.'
              )}
            </p>
          </div>

          {/* Pillar 6 */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 hover:border-amber-400 hover:bg-amber-50/20 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
              🏥
            </div>
            <h4 className="text-sm font-black text-slate-900">
              {tr(
                'Connected Rural Health Loop',
                'एकीकृत ग्रामीण स्वास्थ्य नेटवर्क',
                'एकात्मिक ग्रामीण आरोग्य नेटवर्क'
              )}
            </h4>
            <p className="text-xs text-slate-600 font-hindi leading-relaxed">
              {tr(
                'Connects village Sub-Centres (Arogya Mandir) with Primary Health Centres (PHC), Community Health Centres (CHC), and District Hospitals.',
                'गांव के उपकेंद्र (आरोग्य मंदिर) को प्राथमिक स्वास्थ्य केंद्र (PHC), सामुदायिक स्वास्थ्य केंद्र (CHC) और जिला अस्पताल से जोड़ता है।',
                'गावातील उपकेंद्र (आरोग्य मंदिर), प्राथमिक आरोग्य केंद्र (PHC), ग्रामीण रुग्णालय (CHC) आणि जिल्हा रुग्णालय यांना एकमेकांशी जोडते.'
              )}
            </p>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE INTERFACE FOR USERS / PATIENTS */}
      <section id="triage-section" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                {tr('Interactive Tool for Users', 'नागरिकों हेतु इंटरएक्टिव टूल', 'नागरिकांसाठी थेट साधन')}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 mt-1">
              {tr(
                'AI Clinical Symptom Triage Console',
                'एआई क्लिनिकल लक्षण ट्राइएज कंसोल',
                'AI क्लिनिकल लक्षण ट्रायज कन्सोल'
              )}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-hindi mt-0.5">
              {tr(
                'Type or speak patient symptoms to receive immediate safety guidance, clinical assessment, and facility recommendation.',
                'मरीज के लक्षण लिखें या बोलें और तुरंत स्वास्थ्य मूल्यांकन व नजदीकी केंद्र की सिफारिश प्राप्त करें।',
                'रुग्णाची लक्षणे लिहा किंवा बोला आणि तात्काळ मार्गदर्शन व शिफारस मिळवा.'
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDoctorModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>{t('viewDoctorSummary')}</span>
            </button>
          </div>
        </div>

        {/* Emergency Red-Flag Warning Alert Banner */}
        <DangerSignsCard
          dangerSigns={dangerSigns}
          onOpenDoctorModal={() => setIsDoctorModalOpen(true)}
          onOpenFacilities={() => scrollToSection('facilities-section')}
        />

        {/* The Interactive Triage Console */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <TriageConsole
            chatId={chatId}
            setChatId={setChatId}
            messages={messages}
            setMessages={setMessages}
            dangerSigns={dangerSigns}
            setDangerSigns={setDangerSigns}
            onOpenDoctorModal={() => setIsDoctorModalOpen(true)}
            onOpenFacilities={() => scrollToSection('facilities-section')}
          />
        </div>

        {/* Sample Preset Clinical Scenarios */}
        <PresetScenarios onSelectScenario={handlePresetSelect} />
      </section>

      {/* 4. FAST INTERACTIVE TOOLS: QUICK LIVE TOKEN TRACKER */}
      <section id="token-section" className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="max-w-2xl space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Ticket className="w-5 h-5" />
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800">
              {tr('Live Database Lookup', 'लाइव डेटाबेस जांच', 'थेट डेटाबेस तपासणी')}
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-950">
            {tr('Quick OPD Queue Token Tracker', 'त्वरित ओपीडी कतार टोकन ट्रैकर', 'थेट OPD टोकन तपासणी')}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 font-hindi">
            {tr(
              'Check your live appointment status, token number, and consulting status directly without logging in.',
              'बिना लॉगिन किए तुरंत अपनी कतार संख्या, ओपीडी स्थिति और केंद्र विवरण जांचें।',
              'लॉगिन न करता आपली रांगेतील स्थिती आणि टोकन क्रमांक तात्काळ तपासा.'
            )}
          </p>
        </div>

        <div className="max-w-xl">
          <form onSubmit={handleQuickTokenCheck} className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={quickTokenId}
                  onChange={(e) => setQuickTokenId(e.target.value)}
                  placeholder={tr(
                    'Enter Token ID or Token number (e.g. q-101)...',
                    'टोकन आईडी या टोकन संख्या दर्ज करें...',
                    'टोकन आयडी किंवा क्रमांक टाका...'
                  )}
                  className="w-full pl-4 pr-10 py-3 rounded-2xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white bg-slate-50 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={isCheckingToken}
                className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all shrink-0 cursor-pointer disabled:opacity-50"
              >
                <Search className="w-4 h-4" />
                <span>{isCheckingToken ? tr('Searching...', 'खोज रहे हैं...', 'शोधत आहे...') : tr('Search Token', 'खोजें', 'शोधा')}</span>
              </button>
            </div>

            {tokenError && (
              <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{tokenError}</span>
              </div>
            )}

            {tokenResult && (
              <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">
                    {tr('Token Number:', 'टोकन संख्या:', 'टोकन क्रमांक:')}
                  </span>
                  <span className="px-3.5 py-1 bg-blue-700 text-white font-black text-base rounded-xl shadow-xs">
                    #{tokenResult.token_number}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-bold">
                    {tr('Queue Status:', 'कतार स्थिति:', 'रांगेतील स्थिती:')}
                  </span>
                  <span
                    className={`font-black px-3 py-1 rounded-full text-xs uppercase ${
                      tokenResult.status === 'IN_CONSULTATION'
                        ? 'bg-emerald-100 text-emerald-800'
                        : tokenResult.status === 'CALLED'
                        ? 'bg-amber-100 text-amber-800 animate-pulse'
                        : tokenResult.status === 'COMPLETED'
                        ? 'bg-slate-200 text-slate-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {tokenResult.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-blue-200/60">
                  <span>{tr('Healthcare Facility:', 'स्वास्थ्य केंद्र:', 'आरोग्य केंद्र:')}</span>
                  <span className="font-bold text-slate-900">{tokenResult.facility_id}</span>
                </div>
              </div>
            )}
          </form>

          <p className="text-[11px] text-slate-500 font-hindi pt-2">
            💡 {tr(
              'Your Token ID is printed on your physical OPD registration slip or SMS confirmation.',
              'आपकी टोकन आईडी ओपीडी पर्ची या बुकिंग एसएमएस पर अंकित होती है।',
              'आपला टोकन आयडी ओपीडी नोंदणी पावतीवर किंवा एसएमएसवर दिलेला असतो.'
            )}
          </p>
        </div>
      </section>

      {/* 5. NEARBY HEALTHCARE FACILITIES & HOSPITALS */}
      <section id="facilities-section" className="space-y-4">
        <div className="max-w-2xl space-y-1">
          <span className="px-3 py-0.5 rounded-full text-xs font-black bg-teal-100 text-teal-800 uppercase tracking-wider">
            {tr('Facility Radar', 'स्वास्थ्य केंद्र रडार', 'आरोग्य केंद्र शोध')}
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-slate-950">
            {tr(
              'Nearest Health Facilities & Real-time Beds',
              'निकटतम स्वास्थ्य केंद्र एवं लाइव बेड उपलब्धता',
              'जवळची आरोग्य केंद्रे आणि खाटांची थेट उपलब्धता'
            )}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 font-hindi">
            {tr(
              'Locate nearby Primary Health Centres (PHC), Community Health Centres (CHC), and District Hospitals with contact numbers and emergency services.',
              'नजदीकी प्राथमिक स्वास्थ्य केंद्र, सामुदायिक स्वास्थ्य केंद्र एवं जिला अस्पताल खोजें।',
              'जवळचे प्राथमिक आरोग्य केंद्र (PHC), ग्रामीण रुग्णालय (CHC) आणि जिल्हा रुग्णालय शोधा.'
            )}
          </p>
        </div>

        <FacilityLocator />
      </section>

      {/* 6. STAFF & RESPECTIVE ACCOUNT ACCESS GATEWAY */}
      <section className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 text-white p-8 sm:p-12 border border-slate-800 shadow-xl space-y-6">
        <div className="max-w-3xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Lock className="w-5 h-5" />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
              {tr('Role-Based Secure Access', 'भूमिका-आधारित सुरक्षित पहुंच', 'भूमिका-आधारित सुरक्षित प्रवेश')}
            </span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-black text-white">
            {tr(
              'Medical Officers, ASHA Activists & Registered Citizens',
              'चिकित्सा अधिकारी, आशा कार्यकर्ता एवं पंजीकृत नागरिक',
              'वैद्यकीय अधिकारी, आशा स्वयंसेविका आणि नोंदणीकृत नागरिक'
            )}
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 font-hindi leading-relaxed">
            {tr(
              'To protect sensitive patient health records, longitudinal clinical timelines (LPR), OPD consultation cabin callers, and high-risk pregnancy registries are strictly restricted to authenticated accounts. Sign in with your registered credentials to access your dedicated workspace.',
              'मरीजों की गोपनीयता बनाए रखने के लिए विस्तृत स्वास्थ्य इतिहास, ओपीडी केबिन कतार नियंत्रक एवं उच्च-जोखिम निगरानी रजिस्टर केवल अधिकृत खातों के लिए सुरक्षित हैं। अपने समर्पित पोर्टल में प्रवेश करने के लिए लॉगिन करें।',
              'रुग्णांच्या गोपनीयतेचे रक्षण करण्यासाठी, संपूर्ण वैद्यकीय इतिहास, ओपीडी केबिन रांग नियंत्रण आणि उच्च जोखीम देखरेख केवळ अधिकृत खात्यांसाठी उपलब्ध आहे. आपल्या खात्यात प्रवेश करण्यासाठी लॉगिन करा.'
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          {!isAuthenticated ? (
            <button
              onClick={() => {
                setAuthModalMode('LOGIN');
                setIsAuthModalOpen(true);
              }}
              className="px-7 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>
                {tr(
                  'Sign In to Your Respective Account',
                  'अपने खाते में सुरक्षित लॉगिन करें',
                  'आपल्या खात्यात सुरक्षित लॉगिन करा'
                )}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="p-4 rounded-2xl bg-white/10 border border-white/20 flex items-center gap-3">
              <span className="text-2xl">
                {user?.role === 'DOCTOR' ? '🩺' : user?.role === 'ASHA_WORKER' ? '👩‍⚕️' : '🧑‍🌾'}
              </span>
              <div>
                <div className="text-xs font-bold text-white">
                  {tr('Currently Signed In as:', 'वर्तमान में लॉगिन:', 'सध्या लॉगिन आहात:')} <span className="text-emerald-300 font-black">{user?.name}</span> ({user?.role})
                </div>
                <div className="text-[11px] text-slate-300">
                  {tr('Use the navigation bar above to switch to your dedicated workspace.', 'अपने कार्यक्षेत्र में जाने के लिए ऊपर नेविगेशन बार का उपयोग करें।', 'आपल्या मुख्य डॅशबोर्डवर जाण्यासाठी वरील नेव्हिगेशन वापरा.')}
                </div>
              </div>
            </div>
          )}

          <div className="text-xs text-slate-400 flex items-center gap-1.5 font-hindi">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              {tr(
                'Full ABHA & National Digital Health standards compliance',
                'आयुष्मान भारत डिजिटल मिशन (ABHA) सुरक्षा मानकों के अनुरूप',
                'ABHA आणि राष्ट्रीय डिजिटल आरोग्य मानकांनुसार सुरक्षित'
              )}
            </span>
          </div>
        </div>
      </section>

      {/* 7. EMERGENCY HELPLINES 24X7 BANNER */}
      <section className="rounded-3xl bg-gradient-to-r from-red-950 via-slate-900 to-red-950 text-white p-6 sm:p-8 border border-red-800/40 shadow-md">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white font-extrabold text-[10px] animate-pulse">
                24x7 TOLL FREE
              </span>
              <h3 className="text-lg font-black text-white">
                {tr(
                  'National Emergency & Health Helplines',
                  'राष्ट्रीय आपातकालीन एवं स्वास्थ्य हेल्पलाइन',
                  'राष्ट्रीय आपत्कालीन व आरोग्य हेल्पलाईन'
                )}
              </h3>
            </div>
            <p className="text-xs text-red-200/80 font-hindi">
              {tr(
                'Free 24x7 emergency medical transport, maternal protection, and healthcare guidance numbers.',
                'किसी भी आपात स्थिति में तुरंत संपर्क करें — सेवा पूर्णतः निःशुल्क है।',
                'कोणत्याही आपत्कालीन स्थितीत तात्काळ संपर्क साधा — सेवा पूर्णपणे मोफत आहे.'
              )}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto shrink-0">
            <a
              href="tel:108"
              className="p-3 bg-red-600/30 hover:bg-red-600/50 border border-red-500/50 rounded-2xl text-center transition-all group"
            >
              <div className="text-xl font-black text-red-300 group-hover:scale-105 transition-transform">108</div>
              <div className="text-[10px] font-bold text-red-100">{tr('Ambulance', 'एम्बुलेंस', 'रुग्णवाहिका')}</div>
            </a>

            <a
              href="tel:102"
              className="p-3 bg-white/10 hover:bg-white/15 border border-white/20 rounded-2xl text-center transition-all group"
            >
              <div className="text-xl font-black text-amber-300 group-hover:scale-105 transition-transform">102</div>
              <div className="text-[10px] font-bold text-white">{tr('Maternal/Child', 'जननी शिशु', 'जननी शिशु')}</div>
            </a>

            <a
              href="tel:104"
              className="p-3 bg-white/10 hover:bg-white/15 border border-white/20 rounded-2xl text-center transition-all group"
            >
              <div className="text-xl font-black text-teal-300 group-hover:scale-105 transition-transform">104</div>
              <div className="text-[10px] font-bold text-white">{tr('Health Advice', 'स्वास्थ्य सलाह', 'आरोग्य सल्ला')}</div>
            </a>

            <a
              href="tel:112"
              className="p-3 bg-white/10 hover:bg-white/15 border border-white/20 rounded-2xl text-center transition-all group"
            >
              <div className="text-xl font-black text-white group-hover:scale-105 transition-transform">112</div>
              <div className="text-[10px] font-bold text-white">{tr('National SOS', 'अखिल आपातकाल', 'राष्ट्रीय आपत्कालीन')}</div>
            </a>
          </div>
        </div>
      </section>

      {/* Doctor SBAR Referral Summary Modal */}
      <DoctorSummaryModal
        isOpen={isDoctorModalOpen}
        onClose={() => setIsDoctorModalOpen(false)}
        chatId={chatId}
        messages={messages}
        dangerSigns={dangerSigns}
        locationName="Gramin Health"
      />
    </div>
  );
};
