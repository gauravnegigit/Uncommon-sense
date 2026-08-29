import React, { useState } from 'react';
import {
  PhoneCall,
  User as UserIcon,
  LogOut,
  Activity,
  MapPin,
  BookOpen,
  History,
  Menu,
  X,
  Compass,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { EMERGENCY_NUMBERS } from '../../config/constants';

interface NavbarProps {
  activeTab: 'triage' | 'facilities' | 'guidelines' | 'history';
  setActiveTab: (tab: 'triage' | 'facilities' | 'guidelines' | 'history') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { language, setLanguage, t, isHindi } = useLanguage();
  const { user, isAuthenticated, setIsAuthModalOpen, setAuthModalMode, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showEmergencyMenu, setShowEmergencyMenu] = useState(false);

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
              <span>108 {isHindi ? 'आपातकाल' : 'Emergency'}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setActiveTab('triage')}
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

          {/* Center Navigation Pills (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 p-1 rounded-full border border-slate-200/60 text-xs font-extrabold">
            <button
              onClick={() => setActiveTab('triage')}
              className={`px-4 py-2 rounded-full flex items-center gap-1.5 transition-all ${
                activeTab === 'triage'
                  ? 'bg-slate-950 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('navTriage')}</span>
            </button>

            <button
              onClick={() => setActiveTab('facilities')}
              className={`px-4 py-2 rounded-full flex items-center gap-1.5 transition-all ${
                activeTab === 'facilities'
                  ? 'bg-slate-950 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-teal-400" />
              <span>{t('navFacilities')}</span>
            </button>

            <button
              onClick={() => setActiveTab('guidelines')}
              className={`px-4 py-2 rounded-full flex items-center gap-1.5 transition-all ${
                activeTab === 'guidelines'
                  ? 'bg-slate-950 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>{t('navGuidelines')}</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-full flex items-center gap-1.5 transition-all ${
                activeTab === 'history'
                  ? 'bg-slate-950 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <History className="w-3.5 h-3.5 text-slate-400" />
              <span>{t('navHistory')}</span>
            </button>
          </nav>

          {/* Right Controls: Language + Hotlines + Auth */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Language Switch */}
            <div className="flex items-center bg-slate-100 rounded-full p-0.5 border border-slate-200 text-xs font-black">
              <button
                onClick={() => setLanguage('hi')}
                className={`px-2.5 py-1 rounded-full transition-all ${
                  language === 'hi'
                    ? 'bg-white text-emerald-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="हिंदी"
              >
                हिंदी
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded-full transition-all ${
                  language === 'en'
                    ? 'bg-white text-emerald-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="English"
              >
                EN
              </button>
            </div>

            {/* Emergency Hotline Quick Drawer */}
            <div className="relative">
              <button
                onClick={() => setShowEmergencyMenu(!showEmergencyMenu)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5 text-red-600" />
                <span>108 / 102</span>
              </button>

              {showEmergencyMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-fadeIn">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                    {isHindi ? 'राष्ट्रीय आपातकालीन हेल्पलाइन' : 'National Emergency Hotlines'}
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
                            {isHindi ? em.titleHi : em.titleEn}
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

            {/* Patient Auth Button & Logout */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-slate-800 leading-tight">
                    {user?.name}
                  </div>
                  <div className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-full inline-block">
                    PATIENT
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

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1.5">
          <button
            onClick={() => {
              setActiveTab('triage');
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold ${
              activeTab === 'triage' ? 'bg-emerald-50 text-emerald-900' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Activity className="w-4 h-4 text-emerald-600" />
            <span>{t('navTriage')}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('facilities');
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold ${
              activeTab === 'facilities' ? 'bg-emerald-50 text-emerald-900' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <MapPin className="w-4 h-4 text-teal-600" />
            <span>{t('navFacilities')}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('guidelines');
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold ${
              activeTab === 'guidelines' ? 'bg-emerald-50 text-emerald-900' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span>{t('navGuidelines')}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('history');
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold ${
              activeTab === 'history' ? 'bg-emerald-50 text-emerald-900' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <History className="w-4 h-4 text-slate-600" />
            <span>{t('navHistory')}</span>
          </button>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold">
              {isAuthenticated ? user?.name : t('navGuest')}
            </span>
            <a
              href="tel:108"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600 text-white text-xs font-bold"
            >
              <PhoneCall className="w-3 h-3" />
              <span>108</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
