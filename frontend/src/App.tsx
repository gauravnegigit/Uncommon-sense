import React, { useState, useEffect } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar, ActiveView } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { AuthModal } from './components/auth/AuthModal';
import { LandingPage } from './components/landing/LandingPage';
import { PatientPortal } from './components/portals/PatientPortal';
import { AshaPortal } from './components/portals/AshaPortal';
import { DoctorPortal } from './components/portals/DoctorPortal';
import { PersonaRole, TriageMessage } from './types';
import { consultationStorage } from './services/consultationStorage';

const AppContent: React.FC = () => {
  const { language, isHindi } = useLanguage();
  const { user } = useAuth();

  // Active View: 'LANDING' by default, or 'PATIENT' | 'ASHA_WORKER' | 'DOCTOR'
  const [activeView, setActiveView] = useState<ActiveView>('LANDING');

  // Danger signs state shared across triage
  const [dangerSigns, setDangerSigns] = useState<string[]>([]);

  // Auto-sync active view with authenticated user role if logged in
  useEffect(() => {
    if (user?.role === 'DOCTOR') {
      setActiveView('DOCTOR');
    } else if (user?.role === 'ASHA_WORKER') {
      setActiveView('ASHA_WORKER');
    } else if (user?.role === 'PATIENT') {
      setActiveView('PATIENT');
    }
  }, [user?.role]);

  // Shared session messages & active chatId for patient triage
  const [chatId, setChatId] = useState<string>(() => {
    return consultationStorage.getActiveChatId(user?.id, language);
  });

  const [messages, setMessages] = useState<TriageMessage[]>(() => {
    const sessions = consultationStorage.getSavedSessions(user?.id, language as any);
    const active = sessions.find((s) => s.id === chatId) || sessions[0];
    return active && active.messages.length > 0
      ? active.messages
      : [consultationStorage.getDefaultWelcomeMessage(language)];
  });

  useEffect(() => {
    const currentId = consultationStorage.getActiveChatId(user?.id, language);
    const sessions = consultationStorage.getSavedSessions(user?.id, language as any);
    const active = sessions.find((s) => s.id === currentId) || sessions[0];
    if (active) {
      setChatId(active.id);
      setMessages(
        active.messages && active.messages.length > 0
          ? active.messages
          : [consultationStorage.getDefaultWelcomeMessage(language)]
      );
    } else {
      const defaultSess = consultationStorage.getDefaultSession(language);
      setChatId(defaultSess.id);
      setMessages(defaultSess.messages);
    }
  }, [user?.id, language]);

  const handleSelectScenario = (promptText: string) => {
    const inputElement = document.querySelector('input[type="text"]') as HTMLInputElement;
    if (inputElement) {
      inputElement.value = promptText;
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));
      inputElement.focus();
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#fbfdfc] text-slate-900 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar with Home & Role Specific Access */}
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
      />

      {/* Main Dedicated Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 0. COMMON INTERACTIVE LANDING PAGE */}
        {activeView === 'LANDING' && (
          <LandingPage
            chatId={chatId}
            setChatId={setChatId}
            messages={messages}
            setMessages={setMessages}
            dangerSigns={dangerSigns}
            setDangerSigns={setDangerSigns}
            onSelectRole={(role) => setActiveView(role)}
            onSelectScenario={handleSelectScenario}
          />
        )}

        {/* 1. PATIENT PORTAL (Privacy enforced: NO access to other patients) */}
        {activeView === 'PATIENT' && (
          <PatientPortal
            messages={messages}
            setMessages={setMessages}
            chatId={chatId}
            setChatId={setChatId}
            onBackToHome={() => setActiveView('LANDING')}
          />
        )}

        {/* 2. ASHA WORKER PORTAL (Field high-risk visits, patient registration, walk-in tokens) */}
        {activeView === 'ASHA_WORKER' && (
          <AshaPortal onBackToHome={() => setActiveView('LANDING')} />
        )}

        {/* 3. DOCTOR / MEDICAL OFFICER PORTAL (Live OPD queue cabin, clinical records, referrals, diagnostics, command) */}
        {activeView === 'DOCTOR' && (
          <DoctorPortal onBackToHome={() => setActiveView('LANDING')} />
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;