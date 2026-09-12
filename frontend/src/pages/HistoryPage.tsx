import React, { useState, useEffect } from 'react';
import { History, MessageSquare, FileText, Calendar, Trash2, ShieldAlert } from 'lucide-react';
import { ChatSession, TriageMessage } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { consultationStorage } from '../services/consultationStorage';
import { triageService } from '../services/triageService';
import { DoctorSummaryModal } from '../components/summary/DoctorSummaryModal';

interface HistoryPageProps {
  currentMessages: TriageMessage[];
  currentChatId: string;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  currentMessages,
  currentChatId,
}) => {
  const { user, isAuthenticated, setIsAuthModalOpen } = useAuth();
  const { t, isHindi } = useLanguage();

  const [savedChats, setSavedChats] = useState<ChatSession[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatSession | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState<boolean>(false);

  useEffect(() => {
    const loadHistory = async () => {
      if (!isAuthenticated) {
        const guestSessions = consultationStorage.getSavedSessions(undefined, isHindi);
        const filtered = guestSessions.filter(
          (c) => c.messages && (c.messages.some((m) => m.sender === 'user') || c.id === 'default_chat')
        );
        const toShow = filtered.length > 0 ? filtered : [consultationStorage.getDefaultSession(isHindi)];
        setSavedChats(toShow);
        setSelectedChat(toShow[0] || null);
      } else {
        try {
          const pastChats = await triageService.getChatIds();
          if (Array.isArray(pastChats) && pastChats.length > 0) {
            const restoredSessions: ChatSession[] = await Promise.all(
              pastChats.map(async (c) => {
                let msgs: TriageMessage[] = [];
                try {
                  const hist = await triageService.getChatHistory(c.chat_id);
                  if (Array.isArray(hist) && hist.length > 0) {
                    msgs = hist.map((m: any, idx: number) => ({
                      id: `hist_${c.chat_id}_${idx}`,
                      sender: m.role === 'user' || m.type === 'human' || m.type === 'HumanMessage' ? 'user' : 'assistant',
                      content: m.content || '',
                      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                      severity: 'UNKNOWN',
                    }));
                  }
                } catch (e) {
                  console.warn(`Error restoring history for ${c.chat_id}`, e);
                }
                return {
                  id: c.chat_id,
                  title: c.title || (isHindi ? 'परामर्श' : 'Consultation'),
                  date: c.date || (isHindi ? 'आज' : 'Today'),
                  messages: msgs,
                };
              })
            );
            setSavedChats(restoredSessions);
            setSelectedChat(restoredSessions[0] || null);
            return;
          }
        } catch (err) {
          console.warn('Backend getChatIds error in HistoryPage:', err);
        }

        const userSessions = consultationStorage.getSavedSessions(user?.id, isHindi);
        setSavedChats(userSessions);
        setSelectedChat(userSessions[0] || null);
      }
    };

    loadHistory();
  }, [isAuthenticated, user?.id, isHindi]);

  const handleDeleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (isAuthenticated) {
        await triageService.deleteChat(id);
      }
    } catch (err) {
      console.warn('Backend delete chat note:', err);
    }

    const updated = savedChats.filter((c) => c.id !== id);
    setSavedChats(updated);
    consultationStorage.saveSessions(user?.id, updated);
    if (selectedChat?.id === id) {
      setSelectedChat(updated[0] || null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-800 text-[10px] font-black uppercase tracking-wider border border-indigo-200">
            CONSULTATION ARCHIVE
          </span>
          <span className="text-xs text-slate-500 font-bold">
            • {savedChats.length} {isHindi ? 'सत्र सहेजे गए' : 'Sessions Recorded'}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
          🗂️ {t('navHistory')}
        </h1>

        <p className="text-xs sm:text-sm text-slate-600 font-hindi mt-1 max-w-2xl">
          {isHindi
            ? 'आपके पिछले परामर्श, लक्षण रिपोर्ट और क्लिनिकल रेफरल पर्ची रिकॉर्ड।'
            : 'Review past multi-turn symptom triage consultations and generated doctor referral notes.'}
        </p>
      </div>

      {!isAuthenticated && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center justify-between gap-4">
          <span>
            ℹ️ {isHindi ? 'स्थायी क्लाउड बैकअप के लिए लॉगिन करें।' : 'Sign in to sync your triage history across devices.'}
          </span>
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="px-4 py-1.5 rounded-full bg-amber-800 text-white text-xs font-black"
          >
            {t('navLogin')}
          </button>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sessions List */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/90 p-4 shadow-xs space-y-2">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider px-2 py-1">
            {isHindi ? 'परामर्श सूची' : 'Past Consultations'}
          </h3>

          {savedChats.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-bold">
              {isHindi ? 'कोई पूर्व परामर्श रिकॉर्ड नहीं मिला।' : 'No saved consultations yet.'}
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
              {savedChats.map((sess) => {
                const isSelected = selectedChat?.id === sess.id;
                const hasEm = sess.messages.some((m) => m.severity === 'EMERGENCY');

                return (
                  <div
                    key={sess.id}
                    onClick={() => setSelectedChat(sess)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-1.5 ${
                      isSelected
                        ? 'bg-emerald-50/80 border-emerald-400 shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1 leading-snug">
                        {sess.title}
                      </h4>
                      <button
                        onClick={(e) => handleDeleteChat(sess.id, e)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded"
                        title="Delete Session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>🕒 {sess.date}</span>
                      {hasEm ? (
                        <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">
                          EMERGENCY
                        </span>
                      ) : (
                        <span>{sess.messages.length} turns</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Session Details */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          {selectedChat ? (
            <>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {selectedChat.title}
                  </h3>
                  <span className="text-xs text-slate-400">
                    Session ID: {selectedChat.id} • {selectedChat.date}
                  </span>
                </div>

                <button
                  onClick={() => setIsSummaryOpen(true)}
                  className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <FileText className="w-4 h-4" />
                  <span>{t('viewDoctorSummary')}</span>
                </button>
              </div>

              {/* Message Transcript */}
              <div className="space-y-3 max-h-[420px] overflow-y-auto custom-scrollbar p-2">
                {selectedChat.messages.map((m) => {
                  const isUser = m.sender === 'user';
                  const isEm = m.severity === 'EMERGENCY';

                  return (
                    <div
                      key={m.id}
                      className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        isUser
                          ? 'bg-slate-900 text-white ml-8'
                          : isEm
                          ? 'bg-red-50 border-2 border-red-300 text-slate-900 mr-8'
                          : 'bg-slate-50 border border-slate-200 text-slate-900 mr-8'
                      }`}
                    >
                      <div className="font-bold text-[10px] uppercase text-slate-400 mb-1">
                        {isUser ? 'Patient' : 'Gramin Health Assistant'}
                      </div>
                      <div className="whitespace-pre-wrap">{m.content}</div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400 font-bold text-sm">
              Select a consultation from the left to view records
            </div>
          )}
        </div>
      </div>

      {/* Doctor Summary Modal for Selected Chat */}
      {selectedChat && (
        <DoctorSummaryModal
          isOpen={isSummaryOpen}
          onClose={() => setIsSummaryOpen(false)}
          chatId={selectedChat.id}
          messages={selectedChat.messages}
          dangerSigns={selectedChat.messages.flatMap((m) => m.dangerSignsDetected || [])}
          locationName="Saved Consultation"
        />
      )}
    </div>
  );
};
