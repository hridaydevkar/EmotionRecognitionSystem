// Emotion helper functions

export const getEmotionEmoji = (emotion: string): string => {
  const emojis: Record<string, string> = {
    happy: '😊',
    sad: '😢',
    angry: '😠',
    fearful: '😨',
    disgusted: '🤢',
    surprised: '😮',
    neutral: '😐',
  };
  return emojis[emotion] || '😐';
};

export const getEmotionColor = (emotion: string): string => {
  const colors: Record<string, string> = {
    happy: 'bg-yellow-400',
    sad: 'bg-blue-400',
    angry: 'bg-red-400',
    fearful: 'bg-purple-400',
    disgusted: 'bg-green-400',
    surprised: 'bg-pink-400',
    neutral: 'bg-gray-400',
  };
  return colors[emotion] || 'bg-gray-400';
};

export const getEmotionTextColor = (emotion: string): string => {
  const colors: Record<string, string> = {
    happy: 'text-yellow-400',
    sad: 'text-blue-400',
    angry: 'text-red-400',
    fearful: 'text-purple-400',
    disgusted: 'text-green-400',
    surprised: 'text-pink-400',
    neutral: 'text-gray-400',
  };
  return colors[emotion] || 'text-gray-400';
};

export const getEmotionIntensity = (value: number): string => {
  if (value >= 0.8) return 'Very High';
  if (value >= 0.6) return 'High';
  if (value >= 0.4) return 'Medium';
  if (value >= 0.2) return 'Low';
  return 'Very Low';
};

export const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};
