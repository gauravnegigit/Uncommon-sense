import { ChatSession, TriageMessage } from '../types';

export const getDefaultWelcomeMessage = (lang: string | boolean = 'en'): TriageMessage => {
  const isMr = lang === 'mr';
  const isHi = lang === 'hi' || lang === true;

  const content = isMr
    ? 'नमस्कार! मी ग्रामीण हेल्थ (Gramin Health) ट्रायज सहाय्यक आहे. कृपया रुग्णाची लक्षणे सांगा किंवा खालील माईक बटण दाबून मराठीत बोला.'
    : isHi
    ? 'नमस्ते! मैं ग्रामीण हेल्थ (Gramin Health) ट्राइएज सहायक हूँ। कृपया मरीज के लक्षण बताएं या नीचे दिए गए माइक बटन को दबाकर हिंदी में बोलें।'
    : 'Hello! I am your Gramin Health Triage & Referral Assistant. Please describe patient symptoms or speak using the microphone.';

  return {
    id: 'welcome_' + Date.now(),
    sender: 'assistant',
    content,
    timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    severity: 'UNKNOWN',
  };
};

export const getDefaultSession = (lang: string | boolean = 'en'): ChatSession => {
  const isMr = lang === 'mr';
  const isHi = lang === 'hi' || lang === true;
  const defaultTitle = isMr
    ? 'प्राथमिक आरोग्य सल्ला'
    : isHi
    ? 'प्राथमिक स्वास्थ्य परामर्श'
    : 'Initial Health Consultation';
  const defaultDate = isMr ? 'आज' : isHi ? 'आज' : 'Today';
  return {
    id: 'default_chat',
    title: defaultTitle,
    date: defaultDate,
    messages: [getDefaultWelcomeMessage(lang)],
  };
};

// Cleanup any legacy unscoped storage
const cleanupLegacyStorage = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (localStorage.getItem('gramin_saved_chats')) {
        localStorage.removeItem('gramin_saved_chats');
      }
      if (localStorage.getItem('gramin_current_chat_id')) {
        localStorage.removeItem('gramin_current_chat_id');
      }
    }
  } catch (e) {
    // Ignore storage errors
  }
};

// Run cleanup once on load
cleanupLegacyStorage();

const getStorageKey = (userId?: string): { storage: Storage; key: string; activeKey: string } => {
  if (userId) {
    return {
      storage: localStorage,
      key: `gramin_saved_chats_${userId}`,
      activeKey: `gramin_current_chat_id_${userId}`,
    };
  }
  return {
    storage: sessionStorage,
    key: 'gramin_guest_saved_chats',
    activeKey: 'gramin_guest_current_chat_id',
  };
};

export const consultationStorage = {
  getDefaultWelcomeMessage,
  getDefaultSession,

  getSavedSessions(userId?: string, lang: string | boolean = 'en'): ChatSession[] {
    const { storage, key } = getStorageKey(userId);
    try {
      const data = storage.getItem(key);
      if (data) {
        const parsed: ChatSession[] = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading saved sessions:', e);
    }
    return [getDefaultSession(lang)];
  },

  saveSessions(userId: string | undefined, sessions: ChatSession[]): void {
    const { storage, key } = getStorageKey(userId);
    try {
      if (Array.isArray(sessions) && sessions.length > 0) {
        storage.setItem(key, JSON.stringify(sessions));
      }
    } catch (e) {
      console.warn('Error saving sessions:', e);
    }
  },

  getActiveChatId(userId?: string, lang: string | boolean = 'en'): string {
    const { storage, activeKey } = getStorageKey(userId);
    try {
      const activeId = storage.getItem(activeKey);
      if (activeId) return activeId;
    } catch (e) {
      console.warn('Error reading active chat id:', e);
    }
    const defaultChat = getDefaultSession(lang);
    return defaultChat.id;
  },

  setActiveChatId(userId: string | undefined, chatId: string): void {
    const { storage, activeKey } = getStorageKey(userId);
    try {
      storage.setItem(activeKey, chatId);
    } catch (e) {
      console.warn('Error setting active chat id:', e);
    }
  },

  clearGuestStorage(): void {
    try {
      sessionStorage.removeItem('gramin_guest_saved_chats');
      sessionStorage.removeItem('gramin_guest_current_chat_id');
    } catch (e) {
      console.warn('Error clearing guest storage:', e);
    }
  },
};
