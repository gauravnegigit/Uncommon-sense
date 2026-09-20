import React, { useState } from 'react';
import {
  PhoneCall,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  UserCheck,
  Stethoscope,
  HeartHandshake,
  Home,
  Activity,
  Building2,
  Ticket,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { EMERGENCY_NUMBERS } from '../../config/constants';
import { PersonaRole } from '../../types';

export type ActiveView = 'LANDING' | PersonaRole;

interface NavbarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  setActiveView,
}) => {
  const { language, setLanguage, t, tr, isHindi, isMarathi } = useLanguage();
  const { user, isAuthenticated, setIsAuthModalOpen, setAuthModalMode, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showEmergencyMenu, setShowEmergencyMenu] = useState(false);

  const scrollToSection = (sectionId: string) => {
    setActiveView('LANDING');
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs transition-all">
      {/* Top Clinical Safety Bar */}
      <div className="bg-[#0c2a21] text-emerald-100 text-xs py-1.5 px-4 border-b border-emerald-900/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-semibold">
            <span className="px-2 py-0.5 rounded-full bg-emerald-900 text-emerald-300 border border-emerald-700/60 text-[10px]">
              {t('notADoctorBadge')}
            </span>
            <span className="hidden sm:inline text-emerald-200/90 truncate font-hindi">
              {t('emergencyDisclaimer')}
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href="tel:108"
              className="px-2.5 py-0.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs animate-pulse"
              title="Call 108 Emergency Ambulance"
            >
              <PhoneCall className="w-3 h-3" />
              <span>108 {tr('Emergency', 'आपातकाल', 'आपत्कालीन')}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo & Name */}
          <div
            className="flex items-center gap-3 cursor-pointer group shrink-0"
            onClick={() => setActiveView('LANDING')}
          >
            <div className="w-10 h-10 flex items-center justify-center p-1 rounded-xl bg-slate-950 shadow-sm border border-slate-800 group-hover:scale-105 transition-transform">
              <img
                src="/logo.png"
                alt="Gramin Health Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-black text-slate-950 tracking-tight font-sans">
                  Gramin <span className="text-emerald-600">Health</span>
                </span>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  NHM Triage
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-bold hidden sm:block font-hindi">
                {t('appSubtitle')}
              </p>
            </div>
          </div>

          {/* Navigation Items: Public or Authenticated Role */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs font-black">
            <button
              onClick={() => setActiveView('LANDING')}
              className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
                activeView === 'LANDING'
                  ? 'bg-slate-950 text-white shadow-xs font-black scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Home className="w-4 h-4 text-emerald-400" />
              <span>{tr('Home', 'होम', 'मुख्य पृष्ठ')}</span>
            </button>

            {/* If NOT authenticated, show fast public tools */}
            {!isAuthenticated ? (
              <>
                <button
                  onClick={() => scrollToSection('triage-section')}
                  className="px-3 py-2 rounded-xl flex items-center gap-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-all"
                >
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <span>{tr('AI Triage', 'एआई ट्राइएज', 'AI ट्रायज')}</span>
                </button>

                <button
                  onClick={() => scrollToSection('facilities-section')}
                  className="px-3 py-2 rounded-xl flex items-center gap-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-all"
                >
                  <Building2 className="w-4 h-4 text-teal-600" />
                  <span>{tr('Hospitals & PHCs', 'अस्पताल व केंद्र', 'रुग्णालय व केंद्रे')}</span>
                </button>

                <button
                  onClick={() => scrollToSection('token-section')}
                  className="px-3 py-2 rounded-xl flex items-center gap-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-all"
                >
                  <Ticket className="w-4 h-4 text-blue-600" />
                  <span>{tr('Track Token', 'टोकन जांच', 'टोकन स्थिती')}</span>
                </button>
              </>
            ) : (
              /* If Authenticated: Show the user's dedicated workspace */
              <>
                {user?.role === 'PATIENT' && (
                  <button
                    onClick={() => setActiveView('PATIENT')}
                    className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
                      activeView === 'PATIENT'
                        ? 'bg-emerald-700 text-white shadow-xs font-black scale-[1.02]'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 text-emerald-300" />
                    <span>{tr('🧑‍🌾 My Health Care', '🧑‍🌾 मरीज पोर्टल', '🧑‍🌾 माझे आरोग्य')}</span>
                  </button>
                )}

                {user?.role === 'ASHA_WORKER' && (
                  <button
                    onClick={() => setActiveView('ASHA_WORKER')}
                    className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
                      activeView === 'ASHA_WORKER'
                        ? 'bg-amber-600 text-white shadow-xs font-black scale-[1.02]'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <HeartHandshake className="w-4 h-4 text-amber-200" />
                    <span>{tr('👩‍⚕️ ASHA Field Care', '👩‍⚕️ आशा कार्यकर्ता', '👩‍⚕️ आशा फील्ड केअर')}</span>
                  </button>
                )}

                {user?.role === 'DOCTOR' && (
                  <button
                    onClick={() => setActiveView('DOCTOR')}
                    className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
                      activeView === 'DOCTOR'
                        ? 'bg-indigo-700 text-white shadow-xs font-black scale-[1.02]'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <Stethoscope className="w-4 h-4 text-indigo-300" />
                    <span>{tr('🩺 Doctor Clinical Hub', '🩺 चिकित्सा अधिकारी', '🩺 वैद्यकीय अधिकारी हब')}</span>
                  </button>
                )}
              </>
            )}
          </div>

          {/* Right Controls: Language Switch + Hotlines + Auth */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Trilingual Switch: English Primary, Hindi, Marathi */}
            <div className="flex items-center bg-slate-100 rounded-full p-0.5 border border-slate-200 text-xs font-black">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded-full transition-all ${
                  language === 'en'
                    ? 'bg-white text-emerald-950 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="English (Primary)"
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`px-2.5 py-1 rounded-full transition-all ${
                  language === 'hi'
                    ? 'bg-white text-emerald-950 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="हिंदी"
              >
                हिंदी
              </button>
              <button
                onClick={() => setLanguage('mr')}
                className={`px-2.5 py-1 rounded-full transition-all ${
                  language === 'mr'
                    ? 'bg-white text-emerald-950 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="मराठी"
              >
                मराठी
              </button>
            </div>

            {/* Emergency Hotline Quick Drawer */}
            <div className="relative">
              <button
                onClick={() => setShowEmergencyMenu(!showEmergencyMenu)}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5 text-red-600" />
                <span>108</span>
              </button>

              {showEmergencyMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-fadeIn">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                    {tr('National Emergency Hotlines', 'राष्ट्रीय आपातकालीन हेल्पलाइन', 'राष्ट्रीय आपत्कालीन हेल्पलाईन')}
                  </div>
                  <div className="space-y-1.5">
                    {EMERGENCY_NUMBERS.map((em) => (
                      <a
                        key={em.number}
                        href={`tel:${em.number}`}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 border border-slate-100 transition-colors"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-800">
                            {tr(em.titleEn, em.titleHi, (em as any).titleMr || em.titleHi)}
                          </div>
                          <div className="text-[10px] text-slate-400">24x7 Free Service</div>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-mono font-bold text-xs">
                          {em.number}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Auth Button / Profile */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-slate-800 leading-tight">
                    {user?.name}
                  </div>
                  <div className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full inline-block">
                    {user?.role || 'PATIENT'}
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  title={t('navLogout')}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthModalMode('LOGIN');
                  setIsAuthModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full bg-slate-950 hover:bg-slate-800 text-white text-xs font-black shadow-sm transition-all"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>{t('navLogin')}</span>
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="sm:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="sm:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-4 space-y-2 animate-fadeIn">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            {tr('Navigation:', 'नेविगेशन:', 'नेव्हिगेशन:')}
          </div>
          <button
            onClick={() => {
              setActiveView('LANDING');
              setIsMobileMenuOpen(false);
            }}
            className={`w-full p-2.5 text-xs rounded-xl font-bold flex items-center gap-2 ${
              activeView === 'LANDING' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-800'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>{tr('🏠 Home', '🏠 मुख्य पृष्ठ (Home)', '🏠 मुख्य पृष्ठ (Home)')}</span>
          </button>

          {!isAuthenticated ? (
            <>
              <button
                onClick={() => {
                  scrollToSection('triage-section');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full p-2.5 text-xs rounded-xl font-bold flex items-center gap-2 bg-slate-100 text-slate-800"
              >
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>{tr('🩺 AI Symptom Triage', '🩺 एआई ट्राइएज', '🩺 AI लक्षण ट्रायज')}</span>
              </button>

              <button
                onClick={() => {
                  scrollToSection('facilities-section');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full p-2.5 text-xs rounded-xl font-bold flex items-center gap-2 bg-slate-100 text-slate-800"
              >
                <Building2 className="w-4 h-4 text-teal-600" />
                <span>{tr('🏥 Hospitals & PHCs', '🏥 अस्पताल व केंद्र', '🏥 रुग्णालय व केंद्रे')}</span>
              </button>

              <button
                onClick={() => {
                  scrollToSection('token-section');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full p-2.5 text-xs rounded-xl font-bold flex items-center gap-2 bg-slate-100 text-slate-800"
              >
                <Ticket className="w-4 h-4 text-blue-600" />
                <span>{tr('🎫 Track OPD Token', '🎫 टोकन जांच', '🎫 टोकन स्थिती')}</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setAuthModalMode('LOGIN');
                  setIsAuthModalOpen(true);
                }}
                className="w-full p-2.5 text-xs rounded-xl font-bold flex items-center justify-center gap-2 bg-emerald-700 text-white shadow-xs mt-2"
              >
                <UserIcon className="w-4 h-4" />
                <span>{tr('Sign In to Your Account', 'अपने खाते में लॉगिन करें', 'आपल्या खात्यात लॉगिन करा')}</span>
              </button>
            </>
          ) : (
            <>
              {user?.role === 'PATIENT' && (
                <button
                  onClick={() => {
                    setActiveView('PATIENT');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full p-2.5 text-xs rounded-xl font-bold flex items-center gap-2 ${
                    activeView === 'PATIENT' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{tr('🧑‍🌾 My Patient Care', '🧑‍🌾 मरीज पोर्टल', '🧑‍🌾 रुग्ण व नागरिक पोर्टल')}</span>
                </button>
              )}

              {user?.role === 'ASHA_WORKER' && (
                <button
                  onClick={() => {
                    setActiveView('ASHA_WORKER');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full p-2.5 text-xs rounded-xl font-bold flex items-center gap-2 ${
                    activeView === 'ASHA_WORKER' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  <HeartHandshake className="w-4 h-4" />
                  <span>{tr('👩‍⚕️ ASHA Field Care', '👩‍⚕️ आशा कार्यकर्ता', '👩‍⚕️ आशा फील्ड केअर')}</span>
                </button>
              )}

              {user?.role === 'DOCTOR' && (
                <button
                  onClick={() => {
                    setActiveView('DOCTOR');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full p-2.5 text-xs rounded-xl font-bold flex items-center gap-2 ${
                    activeView === 'DOCTOR' ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  <Stethoscope className="w-4 h-4" />
                  <span>{tr('🩺 Doctor Clinical Hub', '🩺 चिकित्सा अधिकारी', '🩺 वैद्यकीय अधिकारी हब')}</span>
                </button>
              )}

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logout();
                }}
                className="w-full p-2.5 text-xs rounded-xl font-bold flex items-center justify-center gap-2 bg-red-50 text-red-700 border border-red-200 mt-2"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('navLogout')}</span>
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
};
