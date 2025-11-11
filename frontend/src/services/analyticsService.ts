import api from './api';

export interface EmotionStats {
  averageEmotions: {
    [key: string]: number;
  };
  dominantEmotion: string;
  totalSessions: number;
  totalDetections: number;
  moodTrend: 'positive' | 'negative' | 'neutral';
}

export interface DailyEmotionSummary {
  date: string;
  emotions: {
    [key: string]: number;
  };
  sessionCount: number;
  detectionCount: number;
}

export interface EmotionTrends {
  daily: DailyEmotionSummary[];
  weekly: DailyEmotionSummary[];
  monthly: DailyEmotionSummary[];
}

export interface PatternAnalysis {
  peakEmotionHours: string[];
  emotionCorrelations: {
    [key: string]: number;
  };
  stressLevels: {
    low: number;
    medium: number;
    high: number;
  };
}

export interface Recommendation {
  type: 'music' | 'activity' | 'breathing' | 'tip';
  title: string;
  description: string;
  emotion: string;
  priority: 'low' | 'medium' | 'high';
}

class AnalyticsService {
  async getEmotionStats(
    startDate?: string,
    endDate?: string
  ): Promise<EmotionStats> {
    try {
      const params: any = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      
      const response = await api.get('/analytics/summary', { params });
      const backendData = response.data.data;
      
      // Map backend response to frontend interface
      return {
        averageEmotions: backendData.average_emotions || {},
        dominantEmotion: backendData.dominant_emotion || 'neutral',
        totalSessions: backendData.session_count || 0,
        totalDetections: backendData.total_detections || 0,
        moodTrend: this.calculateMoodTrend(backendData.average_emotions || {})
      };
    } catch (error: any) {
      throw error.response?.data || { message: 'Failed to fetch emotion statistics' };
    }
  }

  private calculateMoodTrend(averageEmotions: { [key: string]: number }): 'positive' | 'negative' | 'neutral' {
    const positiveEmotions = (averageEmotions.happy || 0) + (averageEmotions.surprised || 0);
    const negativeEmotions = (averageEmotions.sad || 0) + (averageEmotions.angry || 0) + 
                            (averageEmotions.fearful || 0) + (averageEmotions.disgusted || 0);
    
    if (positiveEmotions > negativeEmotions) {
      return 'positive';
    } else if (negativeEmotions > positiveEmotions) {
      return 'negative';
    } else {
      return 'neutral';
    }
  }

  async getEmotionTrends(
    period: 'daily' | 'weekly' | 'monthly' = 'daily',
    startDate?: string,
    endDate?: string
  ): Promise<DailyEmotionSummary[]> {
    try {
      const params: any = { period };
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      
      const response = await api.get('/analytics/trends', { params });
      return response.data.data.trends;
    } catch (error: any) {
      throw error.response?.data || { message: 'Failed to fetch emotion trends' };
    }
  }

  async getPatternAnalysis(): Promise<PatternAnalysis> {
    try {
      const response = await api.get('/analytics/patterns');
      return response.data.data;
    } catch (error: any) {
      throw error.response?.data || { message: 'Failed to fetch pattern analysis' };
    }
  }

  async getRecommendations(): Promise<Recommendation[]> {
    try {
      const response = await api.get('/analytics/recommendations');
      return response.data.data.recommendations;
    } catch (error: any) {
      throw error.response?.data || { message: 'Failed to fetch recommendations' };
    }
  }

  async exportData(
    format: 'csv' | 'pdf',
    startDate?: string,
    endDate?: string
  ): Promise<Blob> {
    try {
      const params: any = { format };
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      
      const response = await api.get('/analytics/export', {
        params,
        responseType: 'blob',
      });
      
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: 'Failed to export data' };
    }
  }

  async getMoodPrediction(): Promise<{
    predictedMood: string;
    confidence: number;
    factors: string[];
  }> {
    try {
      const response = await api.get('/analytics/mood-prediction');
      return response.data.data;
    } catch (error: any) {
      throw error.response?.data || { message: 'Failed to get mood prediction' };
    }
  }
}

const analyticsService = new AnalyticsService();
export default analyticsService;
