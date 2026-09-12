import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Volume2,
  PhoneCall,
  FileText,
  MapPin,
  Sparkles,
  Bookmark,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';
import { TriageMessage, ChatSession, TriageSeverity } from '../../types';
import { triageService } from '../../services/triageService';
import { consultationStorage } from '../../services/consultationStorage';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { scanDangerSigns, PRESET_SCENARIOS } from '../../config/constants';
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import { VoiceInterface } from './VoiceInterface';
import { TriageResultBadge } from './TriageResultBadge';

interface TriageConsoleProps {
  chatId: string;
  setChatId: (id: string) => void;
  messages: TriageMessage[];
  setMessages: React.Dispatch<React.SetStateAction<TriageMessage[]>>;
  dangerSigns: string[];
  setDangerSigns: React.Dispatch<React.SetStateAction<string[]>>;
  onOpenDoctorModal: () => void;
  onOpenFacilities: () => void;
}

export const TriageConsole: React.FC<TriageConsoleProps> = ({
  chatId,
  setChatId,
  messages,
  setMessages,
  dangerSigns,
  setDangerSigns,
  onOpenDoctorModal,
  onOpenFacilities,
}) => {
  const { user, isAuthenticated, setIsAuthModalOpen } = useAuth();
  const { t, isHindi } = useLanguage();

  // Voice & Speech Hooks
  const {
    isRecording,
    recordingDuration,
    startRecording,
    stopRecording,
    clearAudio,
  } = useVoiceRecorder();
  const { speak, stop: stopSpeech, isPlaying: isPlayingAudio } = useSpeechSynthesis();

  // Input & loading states
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Chat sessions list scoped to current user or guest session
  const [savedSessions, setSavedSessions] = useState<ChatSession[]>(() => {
    return consultationStorage.getSavedSessions(user?.id, isHindi);
  });

  // 1. Fetch previous chats from /api/triage/chat_ids ONLY on initial load / sign-in
  useEffect(() => {
    const syncUserChats = async () => {
      console.log(user)
      console.log(isAuthenticated)
      if (isAuthenticated && user?.id) {
        try {
          // Fetch past chat sessions and their titles using /chat_ids route only
          const pastChats = await triageService.getChatIds();
          if (Array.isArray(pastChats)) {
            const formattedSessions: ChatSession[] = pastChats.map((c) => ({
              id: c.chat_id,
              title: c.title || (isHindi ? 'परामर्श' : 'Consultation'),
              date: c.date || (isHindi ? 'आज' : 'Today'),
              messages: [],
            }));
            setSavedSessions(formattedSessions);
          }
        } catch (e) {
          console.warn('Backend getChatIds error:', e);
        }

        // Start with a clean new consultation session ready for new query
        try {
          const res = await triageService.startNewChat();
          if (res && res.chat_id) {
            setChatId(res.chat_id);
            const welcomeMsg = consultationStorage.getDefaultWelcomeMessage(isHindi);
            setMessages([welcomeMsg]);
            setDangerSigns([]);
          }
        } catch (err) {
          console.warn('Backend startNewChat error:', err);
        }
      } else {
        const guestSessions = consultationStorage.getSavedSessions(undefined, isHindi);
        setSavedSessions(guestSessions);
      }
    };

    syncUserChats();
  }, [isAuthenticated, user?.id, isHindi]);

  // Sync saved sessions to user/guest storage whenever updated
  useEffect(() => {
    consultationStorage.saveSessions(user?.id, savedSessions);
  }, [savedSessions, user?.id]);

  // Persist active chat ID
  useEffect(() => {
    if (chatId) {
      consultationStorage.setActiveChatId(user?.id, chatId);
    }
  }, [chatId, user?.id]);

  // Rename Chat inline state
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingChatTitle, setEditingChatTitle] = useState('');

  // Save chat name modal/prompt state
  const [isNamingChat, setIsNamingChat] = useState(false);
  const [customChatName, setCustomChatName] = useState('');

  // 1. Initial Triage Load: Create or reset to a new chat
  const initializeNewChat = useCallback(async () => {
    stopSpeech();

    // If current session is already empty (no user messages), just refresh it
    const hasUserMessages = messages.some((m) => m.sender === 'user');
    if (!hasUserMessages && messages.length > 0) {
      const welcomeMsg = consultationStorage.getDefaultWelcomeMessage(isHindi);
      setMessages([welcomeMsg]);
      setDangerSigns([]);
      setErrorMessage(null);
      return;
    }

    let newId = 'chat_' + Math.random().toString(36).substring(2, 11);

    try {
      if (isAuthenticated) {
        const res = await triageService.startNewChat();
        if (res && res.chat_id) {
          newId = res.chat_id;
        }
      }
    } catch (err) {
      console.warn('Backend new chat initialization note:', err);
    }

    const defaultTitle = isHindi ? 'नया स्वास्थ्य परामर्श' : 'New Consultation';
    const welcomeMsg = consultationStorage.getDefaultWelcomeMessage(isHindi);

    setChatId(newId);
    setDangerSigns([]);
    setMessages([welcomeMsg]);
    setErrorMessage(null);
  }, [isAuthenticated, isHindi, messages, setChatId, setDangerSigns, setMessages, stopSpeech]);

  // 2. Save Chat with Specific Name
  const handleSaveChatTitle = (targetId: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;

    setSavedSessions((prev) =>
      prev.map((s) => (s.id === targetId ? { ...s, title: trimmed } : s))
    );
    setEditingChatId(null);
    setIsNamingChat(false);
  };

  // 3. When user clicks on a particular chat, THEN ONLY fetch history through /chat/{chat_id}/history
  const handleSelectSession = async (sess: ChatSession) => {
    stopSpeech();
    setChatId(sess.id);
    setIsLoading(true);
    setErrorMessage(null);

    if (isAuthenticated && sess.id !== 'default_chat') {
      try {
        const hist = await triageService.getChatHistory(sess.id);
        console.log("Yes")
        if (Array.isArray(hist) && hist.length > 0) {
          console.log("chat present")
          const restoredMsgs: TriageMessage[] = hist.map((m: any, idx: number) => ({
            id: `hist_${sess.id}_${idx}`,
            sender: m.role === 'user' || m.type === 'human' || m.type === 'HumanMessage' ? 'user' : 'assistant',
            content: m.content || '',
            timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            severity: 'UNKNOWN',
          }));
          setMessages(restoredMsgs);
          const allText = restoredMsgs.map((m) => m.content).join(' ');
          setDangerSigns(scanDangerSigns(allText));



          setSavedSessions((prev) =>
            prev.map((s) => (s.id === sess.id ? { ...s, messages: restoredMsgs } : s))
          );
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Failed to fetch chat history from backend:', err);
      }
    }

    setDangerSigns([]);
    setMessages(
      sess.messages && sess.messages.length > 0
        ? sess.messages
        : [consultationStorage.getDefaultWelcomeMessage(isHindi)]
    );
    setIsLoading(false);
  };

  // 4. Delete Chat Session
  const handleDeleteSession = async (targetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (isAuthenticated) {
        await triageService.deleteChat(targetId);
      }
    } catch (err) {
      console.warn('Backend delete chat note:', err);
    }

    setSavedSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== targetId);
      if (filtered.length === 0) {
        const defaultSess = consultationStorage.getDefaultSession(isHindi);
        setChatId(defaultSess.id);
        setMessages(defaultSess.messages);
        return [defaultSess];
      } else if (chatId === targetId) {
        handleSelectSession(filtered[0]);
      }
      return filtered;
    });
  };

  // 5. Send Text Question -> /api/triage/evaluate
  const handleSendText = async (textOverride?: string) => {
    const query = (textOverride || inputText).trim();
    if (!query || isLoading) return;

    stopSpeech();
    setInputText('');
    setErrorMessage(null);

    // Client-side danger sign scanning for immediate safety alert
    const detected = scanDangerSigns(query);
    if (detected.length > 0) {
      setDangerSigns((prev) => Array.from(new Set([...prev, ...detected])));
    }

    const userMsg: TriageMessage = {
      id: 'usr_' + Date.now(),
      sender: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      dangerSignsDetected: detected,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await triageService.evaluateText({
        transcript: query,
        chat_id: chatId,
        language: isHindi ? 'hi-IN' : 'en-IN',
      });

      const astSeverity = response.severity as TriageSeverity;
      const astMsg: TriageMessage = {
        id: 'ast_' + Date.now(),
        sender: 'assistant',
        content: response.content,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        severity: astSeverity,
      };

      const finalMessages = [...newMessages, astMsg];
      setMessages(finalMessages);

      // Auto update sidebar sessions with 5-6 word title
      setSavedSessions((prev) => {
        const words = query.trim().split(/\s+/);
        const titleSnippet = words.slice(0, 6).join(' ') + (words.length > 6 ? '...' : '');
        const exists = prev.some((s) => s.id === chatId);
        if (exists) {
          return prev.map((s) => {
            if (s.id === chatId) {
              const isDefaultTitle =
                s.title === (isHindi ? 'नया स्वास्थ्य परामर्श' : 'New Consultation') ||
                s.title === (isHindi ? 'प्राथमिक स्वास्थ्य परामर्श' : 'Initial Health Consultation') ||
                s.title === 'New Consultation' ||
                s.title === 'Initial Health Consultation' ||
                s.title === 'Consultation';
              return {
                ...s,
                title: isDefaultTitle ? titleSnippet : s.title,
                messages: finalMessages,
              };
            }
            return s;
          });
        } else {
          return [
            {
              id: chatId,
              title: titleSnippet,
              date: isHindi ? 'आज' : 'Today',
              messages: finalMessages,
            },
            ...prev,
          ];
        }
      });

      // Audio alerts for emergency
      if (astSeverity === 'EMERGENCY') {
        speak(
          isHindi
            ? 'सावधान! आपातकालीन खतरे के संकेत मिले हैं। कृपया तुरंत 108 एम्बुलेंस बुलाएं।'
            : 'Alert! Emergency danger signs detected. Please call 108 immediately.',
          isHindi ? 'hi' : 'en'
        );
      }
    } catch (err: any) {
      console.error('Triage Evaluate Error:', err);
      // Fallback response with helpful error message
      const isAuthErr = err.message?.includes('token') || err.message?.includes('401') || err.message?.includes('cookie');
      const fallbackContent = isAuthErr
        ? isHindi
          ? '🔒 AI ट्राइएज व सत्र सहेजने के लिए कृपया ऊपर लॉगिन या साइन अप करें। (Login required for full AI triage).'
          : '🔒 Please sign in or register above to connect with the full AI clinical triage engine and save history.'
        : isHindi
        ? `⚠️ सर्वर से कनेक्ट करने में त्रुटि: ${err.message}`
        : `⚠️ Server connection error: ${err.message}`;

      const fallbackMsg: TriageMessage = {
        id: 'ast_err_' + Date.now(),
        sender: 'assistant',
        content: fallbackContent,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        severity: detected.length > 0 ? 'EMERGENCY' : 'UNKNOWN',
      };

      setMessages([...newMessages, fallbackMsg]);
      if (isAuthErr) {
        setIsAuthModalOpen(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 6. Voice Input -> Audio Blob -> /api/triage/evaluate-audio-file
  const handleStopAndUploadVoice = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const audioBlob = await stopRecording();
      if (!audioBlob || audioBlob.size === 0) {
        setIsLoading(false);
        return;
      }

      const userMsg: TriageMessage = {
        id: 'usr_voice_' + Date.now(),
        sender: 'user',
        content: isHindi ? '🎙️ [हिंदी वॉयस रिकॉर्डिंग भेजी गई]' : '🎙️ [Voice recording sent for transcription]',
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        audioBlob,
      };

      const newMessages = [...messages, userMsg];
      setMessages(newMessages);

      const response = await triageService.evaluateAudioFile(audioBlob, chatId);

      const astSeverity = response.severity as TriageSeverity;
      const astMsg: TriageMessage = {
        id: 'ast_voice_' + Date.now(),
        sender: 'assistant',
        content: response.content,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        severity: astSeverity,
      };

      const finalMessages = [...newMessages, astMsg];
      setMessages(finalMessages);

      setSavedSessions((prev) => {
        const exists = prev.some((s) => s.id === chatId);
        if (exists) {
          return prev.map((s) => (s.id === chatId ? { ...s, messages: finalMessages } : s));
        } else {
          return [
            {
              id: chatId,
              title: isHindi ? 'वॉयस परामर्श' : 'Voice Consultation',
              date: isHindi ? 'आज' : 'Today',
              messages: finalMessages,
            },
            ...prev,
          ];
        }
      });

      if (astSeverity === 'EMERGENCY') {
        speak(
          isHindi
            ? 'सावधान! आपातकालीन खतरे के संकेत मिले हैं। कृपया 108 एम्बुलेंस को कॉल करें।'
            : 'Alert! Emergency danger signs detected.',
          isHindi ? 'hi' : 'en'
        );
      }
    } catch (err: any) {
      console.error('Audio triage error:', err);
      const isAuthErr = err.message?.includes('token') || err.message?.includes('cookie');
      const errAstMsg: TriageMessage = {
        id: 'ast_err_' + Date.now(),
        sender: 'assistant',
        content: isAuthErr
          ? isHindi
            ? '🔒 वॉयस ट्राइएज हेतु कृपया लॉगिन करें। (Please sign in for voice triage).'
            : '🔒 Please sign in to use Sarvam AI speech-to-text voice triage.'
          : isHindi
          ? `⚠️ ऑडियो ट्राइएज में त्रुटि: ${err.message}`
          : `⚠️ Speech recognition error: ${err.message}`,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        severity: 'UNKNOWN',
      };
      setMessages((prev) => [...prev, errAstMsg]);
    } finally {
      clearAudio();
      setIsLoading(false);
    }
  };

  const activeChat = savedSessions.find((s) => s.id === chatId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* LEFT CHAT SESSIONS SIDEBAR */}
      <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200/80 p-4 shadow-sm flex flex-col h-[600px]">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
          <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>{t('chatHistory')}</span>
          </span>
          <button
            onClick={initializeNewChat}
            className="px-2.5 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold shadow-xs flex items-center gap-1 transition-all"
            title="Start New Chat"
          >
            <Plus className="w-3 h-3" />
            <span>{isHindi ? 'नया' : 'New'}</span>
          </button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {savedSessions.map((s) => {
            const isSelected = s.id === chatId;
            const isEditingThis = editingChatId === s.id;

            return (
              <div
                key={s.id}
                onClick={() => handleSelectSession(s)}
                className={`p-3 rounded-2xl cursor-pointer border transition-all text-xs flex flex-col justify-between group ${
                  isSelected
                    ? 'bg-emerald-50/80 border-emerald-400 text-emerald-950 font-bold shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {isEditingThis ? (
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editingChatTitle}
                      onChange={(e) => setEditingChatTitle(e.target.value)}
                      className="w-full px-2 py-1 text-xs rounded-lg border border-emerald-400 bg-white"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveChatTitle(s.id, editingChatTitle)}
                      className="p-1 text-emerald-700 hover:bg-emerald-100 rounded"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingChatId(null)}
                      className="p-1 text-slate-400 hover:bg-slate-200 rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-1">
                    <span className="line-clamp-2 font-bold text-[11px] mb-1 flex-1 leading-snug">
                      {s.title}
                    </span>
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingChatId(s.id);
                          setEditingChatTitle(s.title);
                        }}
                        className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-100 rounded"
                        title={t('renameChat')}
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteSession(s.id, e)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title={t('deleteChat')}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1">
                  <span>🕒 {s.date}</span>
                  {s.messages.length > 0 && <span>{s.messages.length} msgs</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* User Account / Guest info in Sidebar */}
        <div className="pt-3 border-t border-slate-100 mt-2">
          {isAuthenticated ? (
            <div className="text-xs space-y-1">
              <div className="font-bold text-slate-800 truncate">👤 {user?.name}</div>
              <div className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                PATIENT PORTAL
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500">
              <span className="block mb-1 font-semibold">{t('navGuest')}</span>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="w-full py-1.5 rounded-xl bg-slate-900 text-white text-[11px] font-bold"
              >
                {t('navLogin')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MAIN TRIAGE CONSOLE COLUMN */}
      <div className="lg:col-span-9 space-y-4">
        {/* Top Preset Buttons Pill */}
        <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200 text-xs">
          <span className="font-bold text-slate-700 flex items-center gap-1 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">{isHindi ? 'त्वरित परिदृश्य:' : 'Quick Presets:'}</span>
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pl-2">
            {PRESET_SCENARIOS.map((sc) => (
              <button
                key={sc.id}
                onClick={() => handleSendText(isHindi ? sc.promptHi : sc.promptEn)}
                className={`px-3 py-1 rounded-full text-[10px] font-extrabold whitespace-nowrap border transition-all ${
                  sc.expected === 'EMERGENCY'
                    ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                {isHindi ? sc.titleHi : sc.titleEn}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Window Box */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[540px] overflow-hidden">
          {/* Header */}
          <div className="bg-slate-950 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 flex items-center justify-center shrink-0">
                <img src="/logo.png" alt="Gramin Health" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-extrabold text-white">
                    {activeChat?.title || 'Gramin Health Triage'}
                  </h4>
                  <button
                    onClick={() => {
                      if (activeChat) {
                        setEditingChatId(activeChat.id);
                        setEditingChatTitle(activeChat.title);
                      }
                    }}
                    className="text-slate-400 hover:text-emerald-400 text-xs"
                    title={t('renameChat')}
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {isAuthenticated
                    ? `${isHindi ? 'मरीज' : 'Patient'}: ${user?.name}`
                    : t('navGuest')}{' '}
                  • Session: {chatId.slice(0, 8)}...
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={initializeNewChat}
                className="px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>{t('newChat')}</span>
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/50">
            {messages.map((m) => {
              const isUser = m.sender === 'user';
              const isEm = m.severity === 'EMERGENCY';

              return (
                <div key={m.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && (
                    <div className="w-8 h-8 shrink-0 flex items-center justify-center">
                      <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                  )}

                  <div className="max-w-[85%] sm:max-w-[78%] space-y-2">
                    <div
                      className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                        isUser
                          ? 'bg-slate-950 text-white rounded-tr-none'
                          : isEm
                          ? 'bg-red-50 border-2 border-red-300 text-slate-900 rounded-tl-none'
                          : 'bg-white border border-slate-200 text-slate-900 rounded-tl-none'
                      }`}
                    >
                      {!isUser && <TriageResultBadge severity={m.severity} />}

                      <div className="whitespace-pre-wrap font-sans mt-1">
                        {m.content}
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                        <span>{m.timestamp}</span>
                        {!isUser && (
                          <button
                            onClick={() => speak(m.content, isHindi ? 'hi' : 'en')}
                            className="text-emerald-700 font-extrabold hover:underline flex items-center gap-1"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>{t('playVoice')}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons on AI Response */}
                    {!isUser && (
                      <div className="flex flex-wrap gap-2 pt-0.5">
                        {isEm && (
                          <a
                            href="tel:108"
                            className="px-3.5 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-black flex items-center gap-1 shadow-xs"
                          >
                            <PhoneCall className="w-3 h-3" />
                            <span>108 {t('callNow')}</span>
                          </a>
                        )}

                        <button
                          onClick={onOpenDoctorModal}
                          className="px-3.5 py-1.5 rounded-full bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1 shadow-xs"
                        >
                          <FileText className="w-3 h-3" />
                          <span>{t('viewDoctorSummary')}</span>
                        </button>

                        <button
                          onClick={onOpenFacilities}
                          className="px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold flex items-center gap-1"
                        >
                          <MapPin className="w-3 h-3 text-teal-600" />
                          <span>{t('navFacilities')}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2.5 text-xs text-slate-600 font-bold p-3 bg-white rounded-2xl border border-slate-200 w-fit animate-pulse">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span>{isHindi ? 'AI क्लिनिकल ट्राइएज दिशानिर्देशों का विश्लेषण हो रहा है...' : 'Evaluating with AI clinical triage engine...'}</span>
              </div>
            )}
          </div>

          {/* Input & Voice Controls */}
          <div className="p-4 bg-white border-t border-slate-200 space-y-3">
            {/* Glowing Voice Recording Button */}
            <VoiceInterface
              isRecording={isRecording}
              recordingDuration={recordingDuration}
              isPlayingAudio={isPlayingAudio}
              onStartRecording={startRecording}
              onStopRecording={handleStopAndUploadVoice}
              onStopAudioPlayback={stopSpeech}
            />

            {/* Text Input & Submit */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendText();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                disabled={isLoading || isRecording}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={t('inputPlaceholder')}
                className="flex-1 px-4 py-3 rounded-full bg-slate-100 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 font-sans transition-all"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isLoading || isRecording}
                className={`px-5 py-3 rounded-full text-white font-extrabold text-xs sm:text-sm flex items-center justify-center transition-all ${
                  !inputText.trim() || isLoading
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-slate-950 hover:bg-slate-800 shadow-sm'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};