import api from './api';
import { TriageRequest, TriageResponse } from '../types';

export const triageService = {
  // Start a new isolated chat session
  async startNewChat(): Promise<{ status: string; chat_id: string; user_id?: string }> {
    const response = await api.post<{ status: string; chat_id: string; user_id?: string }>(
      '/triage/chat/new'
    );
    return response.data;
  },

  // Evaluate text input
  async evaluateText(payload: TriageRequest): Promise<TriageResponse> {
    const response = await api.post<TriageResponse>('/triage/evaluate', {
      transcript: payload.transcript,
      chat_id: payload.chat_id,
      language: payload.language || 'hi-IN',
    });
    return response.data;
  },

  // Evaluate recorded audio file
  async evaluateAudioFile(audioBlob: Blob, chatId: string): Promise<TriageResponse> {
    const formData = new FormData();
    // Default to recording.webm or recording.wav depending on blob type
    const filename = audioBlob.type.includes('wav') ? 'recording.wav' : 'recording.webm';
    formData.append('file', audioBlob, filename);
    formData.append('chat_id', chatId);

    const response = await api.post<TriageResponse>('/triage/evaluate-audio-file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 60 seconds for speech-to-text + LLM evaluation
    });
    return response.data;
  },

  // Get session history from MongoDB
  async getChatHistory(chatId: string): Promise<any[]> {
    const response = await api.get<any[]>(`/triage/chat/${chatId}/history`);
    return response.data;
  },

  // Clear session history
  async deleteChat(chatId: string): Promise<{ status: string; message: string }> {
    const response = await api.delete<{ status: string; message: string }>(`/triage/chat/${chatId}`);
    return response.data;
  },
};
