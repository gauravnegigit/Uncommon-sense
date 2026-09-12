import { ChatSession, TriageMessage } from '../types';

export const getDefaultWelcomeMessage = (isHindi: boolean): TriageMessage => {
  return {
    id: 'welcome_' + Date.now(),
    sender: 'assistant',
    content: isHindi
      ? 'नमस्ते! मैं ग्रामीण हेल्थ (Gramin Health) ट्राइएज सहायक हूँ। कृपया मरीज के लक्षण बताएं या नीचे दिए गए माइक बटन को दबाकर हिंदी में बोलें।'
      : 'Hello! I am your Gramin Health Triage & Referral Assistant. Please describe patient symptoms or speak using the microphone.',
    timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    severity: 'UNKNOWN',
  };
};

export const getDefaultSession = (isHindi: boolean = false): ChatSession => {
  const defaultTitle = isHindi ? 'प्राथमिक स्वास्थ्य परामर्श' : 'Initial Health Consultation';
  const defaultDate = isHindi ? 'आज' : 'Today';
  return {
    id: 'default_chat',
    title: defaultTitle,
    date: defaultDate,
    messages: [getDefaultWelcomeMessage(isHindi)],
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

  getSavedSessions(userId?: string, isHindi: boolean = false): ChatSession[] {
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
    return [getDefaultSession(isHindi)];
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

  getActiveChatId(userId?: string, isHindi: boolean = false): string {
    const { storage, activeKey } = getStorageKey(userId);
    try {
      const activeId = storage.getItem(activeKey);
      if (activeId) return activeId;
    } catch (e) {
      console.warn('Error reading active chat id:', e);
    }
    const defaultChat = getDefaultSession(isHindi);
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
