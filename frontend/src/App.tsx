import React, { useState, useEffect } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { AuthModal } from './components/auth/AuthModal';
import { HomePage } from './pages/HomePage';
import { GuidelinesPage } from './pages/GuidelinesPage';
import { HistoryPage } from './pages/HistoryPage';
import { TriageMessage } from './types';
import { consultationStorage } from './services/consultationStorage';

const AppContent: React.FC = () => {
  const { isHindi } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'triage' | 'facilities' | 'guidelines' | 'history'>('triage');

  // Shared session messages & active chatId - initialized via consultationStorage
  const [chatId, setChatId] = useState<string>(() => {
    return consultationStorage.getActiveChatId(user?.id, isHindi);
  });
  const [messages, setMessages] = useState<TriageMessage[]>(() => {
    const sessions = consultationStorage.getSavedSessions(user?.id, isHindi);
    const active = sessions.find((s) => s.id === chatId) || sessions[0];
    return active && active.messages.length > 0
      ? active.messages
      : [consultationStorage.getDefaultWelcomeMessage(isHindi)];
  });

  // Keep state synced when user logs in or out
  useEffect(() => {
    const currentId = consultationStorage.getActiveChatId(user?.id, isHindi);
    const sessions = consultationStorage.getSavedSessions(user?.id, isHindi);
    const active = sessions.find((s) => s.id === currentId) || sessions[0];
    if (active) {
      setChatId(active.id);
      setMessages(active.messages && active.messages.length > 0 ? active.messages : [consultationStorage.getDefaultWelcomeMessage(isHindi)]);
    } else {
      const defaultSess = consultationStorage.getDefaultSession(isHindi);
      setChatId(defaultSess.id);
      setMessages(defaultSess.messages);
    }
  }, [user?.id]);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#fbfdfc] text-slate-900 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar with Logo & Hotlines */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main App Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {(activeTab === 'triage' || activeTab === 'facilities') && (
          <HomePage
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            messages={messages}
            setMessages={setMessages}
            chatId={chatId}
            setChatId={setChatId}
          />
        )}

        {activeTab === 'guidelines' && <GuidelinesPage />}

        {activeTab === 'history' && (
          <HistoryPage currentMessages={messages} currentChatId={chatId} />
        )}
      </main>

      {/* Patient Auth Modal */}
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