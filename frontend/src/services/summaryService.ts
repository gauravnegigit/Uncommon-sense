import api from './api';
import { ClinicalSummaryResponse } from '../types';

export const summaryService = {
  async generateSummary(chatId: string): Promise<ClinicalSummaryResponse> {
    const response = await api.get<ClinicalSummaryResponse>('/summary/generate', {
      params: {
        chat_id: chatId,
      },
    });
    return response.data;
  },
};
