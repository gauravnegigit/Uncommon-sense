import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, Activity, Stethoscope, MapPin, 
  Mic, ShieldAlert, CheckCircle2, 
  Users, ArrowRight, ShieldCheck, 
  FileText, WifiOff, AlertTriangle, 
  HelpCircle, Clock, Navigation
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import MapView from '../components/MapView';
import ContinuousDroneScrollJourney from '../components/ContinuousDroneScrollJourney';

const LandingPage = () => {
  const { t, language } = useLanguage();
  const { switchRole } = useAuth();

  const coreQuestions = [
    {
      qNum: '01',
      title: 'How urgently should I seek care?',
      hindiTitle: 'मुझे कितनी जल्दी इलाज की आवश्यकता है?',
      desc: 'Clinically reviewed deterministic rule engine classifies your situation into Emergency, Urgent, or Routine.',
      icon: Activity,
      accent: 'border-l-4 border-rose-500 bg-rose-50/40'
    },
    {
      qNum: '02',
      title: 'Where should I go?',
      hindiTitle: 'मुझे किस स्वास्थ्य केंद्र जाना चाहिए?',
      desc: 'Matches your urgency to the appropriate nearby facility tier: Sub-Centre, 24x7 PHC, CHC, or District Hospital.',
      icon: MapPin,
      accent: 'border-l-4 border-tealmed-500 bg-tealmed-50/40'
    },
    {
      qNum: '03',
      title: 'What information should I give the doctor?',
      hindiTitle: 'डॉक्टर को क्या जानकारी देनी चाहिए?',
      desc: 'Generates a structured, doctor-ready patient clinical summary in both Hindi and English.',
      icon: FileText,
      accent: 'border-l-4 border-purple-500 bg-purple-50/40'
    }
  ];

  const uniquePillars = [
    {
      title: 'Hindi & Vernacular Voice-First',
      desc: 'Speak your symptoms naturally in Hindi. Audio is converted into structured clinical symptoms with informed patient consent and privacy protection.',
      icon: Mic,
      path: '/triage',
      badge: 'Voice AI + Full Consent',
      color: 'teal'
    },
    {
      title: 'Safety-First Deterministic Triage',
      desc: 'Strictly rule-based clinical workflows that categorize into Emergency, Urgent, or Routine rather than attempting to guess a medical disease.',
      icon: ShieldCheck,
      path: '/triage',
      badge: 'Clinically Reviewed Rules',
      color: 'purple'
    },
    {
      title: 'Geospatial Facility Referral',
      desc: 'Directs patients to the nearest suitable public healthcare facility (PHC, CHC, Sub-Centre) based on severity, bed availability, and travel distance.',
      icon: MapPin,
      path: '/clinics',
      badge: 'Nearby PHC / CHC Locator',
      color: 'blue'
    },
    {
      title: 'Doctor-Ready Summary & Offline Cache',
      desc: 'Provides structured Hindi-English clinical summaries for consultations, with offline caching of decision flows for zero-connectivity zones.',
      icon: FileText,
      path: '/doctor',
      badge: 'Bilingual PDF + Offline Ready',
      color: 'emerald'
    }
  ];

  const urgencyTiers = [
    {
      badge: '🚨 Emergency (आपातकालीन)',
      color: 'bg-rose-50 border-rose-200 text-rose-900',
      actionBadge: 'bg-rose-600 text-white',
      timeframe: 'Immediate Attention (तत्काल)',
      examples: 'Severe chest pain, breathlessness (SpO2 < 92%), sudden unconsciousness, severe hemorrhaging',
      recommendation: 'Call 108 Ambulance / Go immediately to nearest 24x7 District Hospital or CHC'
    },
    {
      badge: '⚠️ Urgent (त्वरित देखभाल)',
      color: 'bg-amber-50 border-amber-200 text-amber-900',
      actionBadge: 'bg-amber-600 text-white',
      timeframe: 'Within 24–48 Hours (24-48 घंटे में)',
      examples: 'High fever > 102°F lasting 3+ days, localized acute abdominal pain, severe dehydration',
      recommendation: 'Visit Nearest 24x7 Primary Health Centre (PHC) or Community Health Centre (CHC)'
    },
    {
      badge: '🟢 Routine (सामान्य देखभाल)',
      color: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      actionBadge: 'bg-emerald-600 text-white',
      timeframe: 'Within 3–7 Days (3-7 दिनों में)',
      examples: 'Mild cold, mild cough, minor skin rash, regular antenatal checkup, medication refill',
      recommendation: 'Visit Village Health Sub-Centre, consult ASHA worker, or schedule Tele-OPD'
    }
  ];

  return (
    <div className="space-y-16 pb-16">
      
      {/* 1. CINEMATIC 3D STORY WALKTHROUGH AT THE BEGINNING OF LANDING PAGE */}
      <ContinuousDroneScrollJourney />

      {/* 2. PROMINENT "NOT A DIAGNOSIS" SAFETY & CONSENT BANNER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-amber-50/90 border-2 border-amber-200/80 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs sm:text-sm text-amber-950 uppercase tracking-wider">
                  Important Clinical Safety Notice • महत्वपूर्ण सुरक्षा सूचना
                </span>
                <span className="bg-amber-200/80 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Not a Medical Diagnosis
                </span>
              </div>
              <p className="text-xs sm:text-sm text-amber-900/90 mt-1 leading-relaxed">
                This system is a <strong>triage and referral assistant</strong>. It assists in assessing urgency (Emergency, Urgent, Routine) and guiding to nearby healthcare facilities. It <strong>does not diagnose medical diseases</strong> or replace a qualified doctor's clinical evaluation.
              </p>
            </div>
          </div>
          <Link
            to="/triage"
            className="px-5 py-2.5 bg-amber-900 hover:bg-black text-amber-100 font-bold text-xs rounded-xl shadow-xs shrink-0 transition"
          >
            Start Triage →
          </Link>
        </div>
      </div>

      {/* 3. THE 3 CORE QUESTIONS OUR SYSTEM ANSWERS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-tealmed-700">
            Purpose-Driven Rural Health Assistant
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slatecalm-900 mt-1">
            We Don't Ask "What Disease Do I Have?"
          </h2>
          <p className="text-xs sm:text-sm text-slatecalm-600 mt-2">
            Instead, we give rural citizens and caregivers clear, reliable answers to the three questions that truly save lives:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {coreQuestions.map((cq, idx) => {
            const Icon = cq.icon;
            return (
              <div 
                key={idx}
                className={`p-6 sm:p-7 rounded-3xl border border-slatecalm-200/80 shadow-soft bg-white ${cq.accent} flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs font-black text-slatecalm-400">
                      QUESTION {cq.qNum}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-white shadow-xs flex items-center justify-center text-slatecalm-800">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slatecalm-900 leading-snug">
                    {cq.title}
                  </h3>
                  <p className="text-xs font-bold text-tealmed-800 mt-1">
                    {cq.hindiTitle}
                  </p>
                  <p className="text-xs text-slatecalm-600 mt-3 leading-relaxed">
                    {cq.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. KEY UNIQUE FEATURES & CARE PATHWAY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-tealmed-700">
            Key Uniqueness & Standout Capabilities
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slatecalm-900 mt-1">
            Complete, Safety-First Rural Care Pathway
          </h2>
          <p className="text-xs sm:text-sm text-slatecalm-500 mt-2">
            Combining Hindi voice accessibility, deterministic clinical triage, location-based referral, and doctor-ready summaries in one seamless system.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {uniquePillars.map((svc, i) => {
            const Icon = svc.icon;
            return (
              <Link
                key={i}
                to={svc.path}
                className="bg-white p-6 rounded-3xl border border-slatecalm-200/80 shadow-soft hover:shadow-soft-lg hover:border-tealmed-400 transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-tealmed-50 text-tealmed-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slatecalm-100 text-slatecalm-700 px-2.5 py-1 rounded-full">
                      {svc.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slatecalm-900 group-hover:text-tealmed-700 transition-colors">
                    {svc.title}
                  </h3>
                  <p className="text-xs text-slatecalm-500 mt-2 leading-relaxed">
                    {svc.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slatecalm-100 flex items-center gap-1 text-xs font-bold text-tealmed-700 group-hover:translate-x-1 transition-transform">
                  <span>Explore Feature</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 5. 3-TIER CLINICAL URGENCY REFERENCE MATRIX */}
      <section className="bg-slatecalm-100/60 py-12 px-4 sm:px-6 lg:px-8 border-y border-slatecalm-200/60">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-tealmed-700">
              Deterministic Urgency Protocol
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slatecalm-900 mt-1">
              How Urgency Is Classified & Handled
            </h2>
            <p className="text-xs sm:text-sm text-slatecalm-500 mt-2">
              Clinically verified decision matrix ensuring emergency cases get instant escalation while routine cases avoid unnecessary hospital crowding.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {urgencyTiers.map((tier, idx) => (
              <div key={idx} className={`p-6 rounded-3xl border ${tier.color} shadow-xs space-y-3.5`}>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs sm:text-sm tracking-tight">{tier.badge}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tier.actionBadge}`}>
                    {tier.timeframe}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase text-slatecalm-500 block mb-1">
                    Red-Flag Symptoms Checked:
                  </span>
                  <p className="text-xs text-slatecalm-700 font-medium leading-relaxed">
                    {tier.examples}
                  </p>
                </div>
                <div className="pt-2 border-t border-black/10">
                  <span className="text-[11px] font-bold uppercase text-slatecalm-500 block mb-1">
                    Care Facility Recommendation:
                  </span>
                  <p className="text-xs font-bold text-slatecalm-900 leading-snug">
                    {tier.recommendation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. EMBEDDED GEOSPATIAL PHC & CHC FACILITY MAP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-extrabold text-slatecalm-900">Nearby Health Centres & Referral Points</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                Live Beds & Doctors
              </span>
            </div>
            <p className="text-xs text-slatecalm-500 mt-1">
              Geospatial locator connecting urgency level to Sub-Centres, Primary Health Centres (PHC), and Community Health Centres (CHC)
            </p>
          </div>
          <Link
            to="/clinics"
            className="text-xs font-bold text-tealmed-700 hover:text-tealmed-800 flex items-center gap-1"
          >
            <span>Open Fullscreen PHC Locator</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <MapView height="380px" />
      </section>

    </div>
  );
};

export default LandingPage;
