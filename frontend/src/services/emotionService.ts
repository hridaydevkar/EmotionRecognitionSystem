import api from './api';

export interface EmotionData {
  happy: number;
  sad: number;
  angry: number;
  fearful: number;
  disgusted: number;
  surprised: number;
  neutral: number;
}

export interface EmotionRecord {
  id: string;
  user_id: string;
  emotions?: EmotionData;
  emotions_json?: EmotionData; // Backend field name
  confidence_scores: EmotionData;
  timestamp: string;
  session_id: string;
}

export interface EmotionSession {
  id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  total_detections: number;
}

export interface EmotionHistory {
  items: EmotionRecord[];
  pagination: {
    total: number;
    page: number;
    pages: number;
    per_page: number;
  };
}

export interface SaveEmotionData {
  emotions: EmotionData;
  confidence_scores: EmotionData;
  session_id?: string;
}

class EmotionService {
  async saveEmotion(data: SaveEmotionData): Promise<any> {
    try {
      console.log('Attempting to save emotion:', data);
      const response = await api.post('/emotions/save', data);
      console.log('Emotion save successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Emotion save failed:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw error.response?.data || { message: 'Failed to save emotion data' };
    }
  }

  async getEmotionHistory(
    page: number = 1, 
    limit: number = 50,
    startDate?: string,
    endDate?: string
  ): Promise<EmotionHistory> {
    try {
      const params: any = { page, limit };
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      
      console.log('emotionService: Fetching history with params:', params);
      const response = await api.get('/emotions/history', { params });
      console.log('emotionService: History API response:', response.data);
      return response.data.data;
    } catch (error: any) {
      console.error('emotionService: History fetch failed:', error);
      throw error.response?.data || { message: 'Failed to fetch emotion history' };
    }
  }

  async getEmotionSessions(): Promise<EmotionSession[]> {
    try {
      const response = await api.get('/emotions/sessions');
      return response.data.data.sessions;
    } catch (error: any) {
      throw error.response?.data || { message: 'Failed to fetch emotion sessions' };
    }
  }

  async startEmotionSession(): Promise<string> {
    try {
      console.log('Attempting to start emotion session...');
      const response = await api.post('/emotions/session/start');
      console.log('Session start successful:', response.data);
      console.log('Response structure:', JSON.stringify(response.data, null, 2));
      
      // Try different possible response structures based on backend
      const sessionId = 
        response.data?.data?.session?.session_id ||
        response.data?.session?.session_id ||
        response.data?.data?.session_id ||
        response.data?.session_id;
        
      console.log('Extracted session_id:', sessionId);
      
      if (!sessionId) {
        console.error('No session_id found in response. Full response:', response.data);
        throw new Error('No session_id found in response');
      }
      
      return sessionId;
    } catch (error: any) {
      console.error('Session start failed:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw error.response?.data || { message: 'Failed to start emotion session' };
    }
  }

  async endEmotionSession(sessionId: string): Promise<void> {
    try {
      await api.post(`/emotions/session/${sessionId}/end`);
    } catch (error: any) {
      throw error.response?.data || { message: 'Failed to end emotion session' };
    }
  }

  async deleteEmotionRecord(recordId: string): Promise<void> {
    try {
      await api.delete(`/emotions/${recordId}`);
    } catch (error: any) {
      throw error.response?.data || { message: 'Failed to delete emotion record' };
    }
  }
}

const emotionService = new EmotionService();
export default emotionService;
