import React, { useState } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { AuthModal } from './components/auth/AuthModal';
import { HomePage } from './pages/HomePage';
import { GuidelinesPage } from './pages/GuidelinesPage';
import { HistoryPage } from './pages/HistoryPage';
import { TriageMessage } from './types';
import { useLanguage } from './context/LanguageContext';

export const App: React.FC = () => {
  const { isHindi } = useLanguage();
  const [activeTab, setActiveTab] = useState<'triage' | 'facilities' | 'guidelines' | 'history'>('triage');

  // Shared session messages
  const [chatId, setChatId] = useState<string>(() => 'chat_' + Math.random().toString(36).substring(2, 11));
  const [messages, setMessages] = useState<TriageMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'assistant',
      content: isHindi
        ? 'नमस्ते! मैं ग्रामीण हेल्थ (Gramin Health) ट्राइएज सहायक हूँ। कृपया मरीज के लक्षण बताएं या नीचे दिए गए माइक बटन को दबाकर हिंदी में बोलें।'
        : 'Hello! I am your Gramin Health Triage & Referral Assistant. Please describe patient symptoms or speak using the microphone.',
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      severity: 'UNKNOWN',
    },
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar with Logo & Hotline */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Container */}
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

        {activeTab === 'guidelines' && (
          <GuidelinesPage />
        )}

        {activeTab === 'history' && (
          <HistoryPage currentMessages={messages} currentChatId={chatId} />
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default App;

