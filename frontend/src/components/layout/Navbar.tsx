import React, { useState } from 'react';
import { 
  PhoneCall, 
  User, 
  LogOut, 
  Activity, 
  MapPin, 
  BookOpen, 
  History,
  Menu,
  X
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
  const { user, isAuthenticated, setIsAuthModalOpen, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showEmergencyMenu, setShowEmergencyMenu] = useState(false);

  const getRoleLabel = (role?: string) => {
    if (role === 'DOCTOR') return t('roleDoctor');
    if (role === 'ASHA_WORKER') return t('roleAsha');
    return t('rolePatient');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
      {/* Top Clinical Safety Bar */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-medium">
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-900/80 text-emerald-200 font-bold border border-emerald-500/40">
              {t('notADoctorBadge')}
            </span>
            <span className="hidden sm:inline opacity-90 truncate">
              {t('emergencyDisclaimer')}
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href="tel:108"
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-sm transition-all animate-pulse"
              title="Call 108 Emergency"
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
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-slate-950 p-1.5 shadow-md shadow-emerald-500/10 group-hover:scale-105 transition-transform border border-slate-800">
              <img 
                src="/logo.png" 
                alt="Gramin Health Logo" 
                className="w-full h-full object-contain" 
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-slate-900 tracking-tight font-sans">
                  Gramin <span className="text-emerald-600">Health</span>
                </span>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  NHM ASHA Triage
                </span>
              </div>
              <p className="text-xs text-slate-500 font-semibold hidden sm:block font-hindi">
                {t('appSubtitle')}
              </p>
            </div>
          </div>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setActiveTab('triage')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'triage'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>{t('navTriage')}</span>
            </button>

            <button
              onClick={() => setActiveTab('facilities')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'facilities'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <MapPin className="w-4 h-4 text-teal-600" />
              <span>{t('navFacilities')}</span>
            </button>

            <button
              onClick={() => setActiveTab('guidelines')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'guidelines'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>{t('navGuidelines')}</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'history'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <History className="w-4 h-4 text-slate-600" />
              <span>{t('navHistory')}</span>
            </button>
          </nav>

          {/* Right Controls: Language, Emergency Dropdown, Auth */}
          <div className="flex items-center gap-2.5">
            {/* Language Switcher */}
            <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
              <button
                onClick={() => setLanguage('hi')}
                className={`px-2.5 py-1 rounded-md text-xs font-extrabold transition-all ${
                  language === 'hi'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="हिंदी में स्विच करें"
              >
                हिंदी
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded-md text-xs font-extrabold transition-all ${
                  language === 'en'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Switch to English"
              >
                EN
              </button>
            </div>

            {/* Emergency Hotline Quick Dial Drawer */}
            <div className="relative">
              <button
                onClick={() => setShowEmergencyMenu(!showEmergencyMenu)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5 text-red-600 animate-bounce" />
                <span>108 / 102</span>
              </button>

              {showEmergencyMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 animate-fadeIn">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    {isHindi ? 'आपातकालीन हेल्पलाइन नंबर' : 'National Emergency Hotlines'}
                  </div>
                  <div className="space-y-1.5">
                    {EMERGENCY_NUMBERS.map((em) => (
                      <a
                        key={em.number}
                        href={`tel:${em.number}`}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 border border-slate-100 transition-colors"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-800">
                            {isHindi ? em.titleHi : em.titleEn}
                          </div>
                          <div className="text-[11px] text-slate-500">24x7 Free Service</div>
                        </div>
                        <span className="px-2.5 py-1 rounded-md bg-red-600 text-white font-mono font-bold text-xs">
                          {em.number}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile / Auth Button */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-slate-800 leading-tight">
                    {user?.name}
                  </div>
                  <div className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded inline-block">
                    {getRoleLabel(user?.role)}
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title={t('navLogout')}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
              >
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('navLogin')}</span>
                <span className="sm:hidden">Login</span>
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2">
          <button
            onClick={() => {
              setActiveTab('triage');
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold ${
              activeTab === 'triage' ? 'bg-emerald-50 text-emerald-800' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Activity className="w-5 h-5 text-emerald-600" />
            <span>{t('navTriage')}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('facilities');
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold ${
              activeTab === 'facilities' ? 'bg-emerald-50 text-emerald-800' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <MapPin className="w-5 h-5 text-teal-600" />
            <span>{t('navFacilities')}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('guidelines');
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold ${
              activeTab === 'guidelines' ? 'bg-emerald-50 text-emerald-800' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <span>{t('navGuidelines')}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('history');
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold ${
              activeTab === 'history' ? 'bg-emerald-50 text-emerald-800' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <History className="w-5 h-5 text-slate-600" />
            <span>{t('navHistory')}</span>
          </button>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {user?.name} ({getRoleLabel(user?.role)})
            </span>
            <a
              href="tel:108"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>108 {isHindi ? 'डायल करें' : 'Call'}</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};

