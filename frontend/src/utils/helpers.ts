import { EmotionData } from '../services/emotionService';
import { EmotionDetection } from '../hooks/useEmotionDetection';

// Format dates consistently
export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Kolkata'
  });
};

export const formatDateTime = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata'
  });
};

export const formatTime = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata'
  });
};

// Get current date in IST timezone in YYYY-MM-DD format
export const getTodayIST = (): string => {
  const now = new Date();
  const istDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  return istDate.toISOString().split('T')[0];
};

// Get date N days ago in IST timezone in YYYY-MM-DD format
export const getDaysAgoIST = (daysAgo: number): string => {
  const now = new Date();
  const istNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const pastDate = new Date(istNow.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
  return pastDate.toISOString().split('T')[0];
};

// Calculate the dominant emotion
export const getDominantEmotion = (emotions: EmotionData): string => {
  // Handle null, undefined, or malformed emotions
  if (!emotions || typeof emotions !== 'object') {
    console.warn('getDominantEmotion: Invalid emotions data:', emotions);
    return 'neutral'; // fallback
  }

  const emotionEntries = Object.entries(emotions).filter(([key, value]) => 
    typeof value === 'number' && !isNaN(value)
  );
  
  if (emotionEntries.length === 0) {
    console.warn('getDominantEmotion: No valid emotion entries found:', emotions);
    return 'neutral'; // fallback
  }

  const dominant = emotionEntries.reduce((max, current) => {
    return current[1] > max[1] ? current : max;
  });
  
  return dominant[0];
};

// Get emotion color for visualization
export const getEmotionColor = (emotion: string): string => {
  const colors: { [key: string]: string } = {
    happy: '#22c55e', // green
    sad: '#3b82f6', // blue
    angry: '#ef4444', // red
    fearful: '#8b5cf6', // purple
    disgusted: '#f97316', // orange
    surprised: '#eab308', // yellow
    neutral: '#6b7280', // gray
  };
  return colors[emotion] || '#6b7280';
};

// Calculate emotion intensity (0-100) with bounds checking
export const getEmotionIntensity = (value: number): number => {
  // Ensure value is between 0 and 1 before converting to percentage
  const clampedValue = Math.max(0, Math.min(1, value));
  return Math.round(clampedValue * 100);
};

// Filter emotions above threshold
export const filterEmotionsByThreshold = (
  emotions: EmotionData,
  threshold: number = 0.1
): EmotionData => {
  const filtered: Partial<EmotionData> = {};
  
  Object.entries(emotions).forEach(([emotion, value]) => {
    if (value >= threshold) {
      filtered[emotion as keyof EmotionData] = value;
    }
  });
  
  return filtered as EmotionData;
};

// Calculate average emotions from array
export const calculateAverageEmotions = (emotionArray: EmotionData[]): EmotionData => {
  if (emotionArray.length === 0) {
    return {
      happy: 0,
      sad: 0,
      angry: 0,
      fearful: 0,
      disgusted: 0,
      surprised: 0,
      neutral: 0,
    };
  }

  const total = emotionArray.reduce(
    (acc, emotions) => {
      Object.keys(emotions).forEach((key) => {
        acc[key as keyof EmotionData] += emotions[key as keyof EmotionData];
      });
      return acc;
    },
    {
      happy: 0,
      sad: 0,
      angry: 0,
      fearful: 0,
      disgusted: 0,
      surprised: 0,
      neutral: 0,
    }
  );

  const count = emotionArray.length;
  return {
    happy: total.happy / count,
    sad: total.sad / count,
    angry: total.angry / count,
    fearful: total.fearful / count,
    disgusted: total.disgusted / count,
    surprised: total.surprised / count,
    neutral: total.neutral / count,
  };
};

// Get emotion emoji
export const getEmotionEmoji = (emotion: string): string => {
  const emojis: { [key: string]: string } = {
    happy: '😊',
    sad: '😢',
    angry: '😠',
    fearful: '😨',
    disgusted: '🤢',
    surprised: '😲',
    neutral: '😐',
  };
  return emojis[emotion] || '😐';
};

// Calculate mood score (positive emotions vs negative)
export const calculateMoodScore = (emotions: EmotionData): number => {
  // Handle null, undefined, or malformed emotions
  if (!emotions || typeof emotions !== 'object') {
    console.warn('calculateMoodScore: Invalid emotions data:', emotions);
    return 0.5; // neutral fallback
  }

  // Safely extract emotion values with fallbacks
  const happy = emotions.happy ?? 0;
  const surprised = emotions.surprised ?? 0;
  const sad = emotions.sad ?? 0;
  const angry = emotions.angry ?? 0;
  const fearful = emotions.fearful ?? 0;
  const disgusted = emotions.disgusted ?? 0;
  const neutral = emotions.neutral ?? 0;

  const positiveEmotions = happy + surprised;
  const negativeEmotions = sad + angry + fearful + disgusted;
  const total = positiveEmotions + negativeEmotions + neutral;
  
  if (total === 0) return 0.5; // neutral
  
  return (positiveEmotions + neutral * 0.5) / total;
};

// Get mood label based on score
export const getMoodLabel = (score: number): string => {
  if (score >= 0.7) return 'Very Positive';
  if (score >= 0.6) return 'Positive';
  if (score >= 0.4) return 'Neutral';
  if (score >= 0.3) return 'Negative';
  return 'Very Negative';
};

// Generate random session ID
export const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Debounce function
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle function
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Validate email
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password
export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};

// Validate username
export const isValidUsername = (username: string): boolean => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

// Format duration
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
};

// Download file
export const downloadFile = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
