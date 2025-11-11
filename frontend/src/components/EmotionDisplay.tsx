import React from 'react';
import { EmotionDetection } from '../hooks/useEmotionDetection';

interface EmotionDisplayProps {
  emotions: EmotionDetection[];
  showConfidence?: boolean;
  className?: string;
}

const EmotionDisplay: React.FC<EmotionDisplayProps> = ({ 
  emotions, 
  showConfidence = true,
  className = '' 
}) => {
  const getEmotionColor = (emotion: string) => {
    const colors = {
      happy: 'text-yellow-400',
      sad: 'text-blue-400',
      angry: 'text-red-400',
      fearful: 'text-purple-400',
      disgusted: 'text-green-400',
      surprised: 'text-pink-400',
      neutral: 'text-gray-400',
    };
    return colors[emotion as keyof typeof colors] || 'text-gray-400';
  };

  const getEmotionEmoji = (emotion: string) => {
    const emojis = {
      happy: '😊',
      sad: '😢',
      angry: '😠',
      fearful: '😨',
      disgusted: '🤢',
      surprised: '😮',
      neutral: '😐',
    };
    return emojis[emotion as keyof typeof emojis] || '😐';
  };

  if (!emotions || emotions.length === 0) {
    return (
      <div className={`text-center text-gray-500 ${className}`}>
        <div className="text-4xl mb-2">🔍</div>
        <p>No faces detected</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {emotions.map((emotionSet, faceIndex) => (
        <div key={faceIndex} className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-3">
            {emotions.length > 1 ? `Face ${faceIndex + 1}` : 'Detected Emotions'}
          </h3>
          
          <div className="space-y-2">
            {Object.entries(emotionSet)
              .sort(([, a], [, b]) => b - a) // Sort by confidence
              .map(([emotion, confidence]) => (
                <div key={emotion} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">
                      {getEmotionEmoji(emotion)}
                    </span>
                    <span className={`font-medium capitalize ${getEmotionColor(emotion)}`}>
                      {emotion}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {showConfidence && (
                      <span className="text-sm text-gray-300">
                        {Math.round(confidence * 100)}%
                      </span>
                    )}
                    <div className="w-20 bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          confidence > 0.1 ? 'bg-blue-500' : 'bg-gray-600'
                        }`}
                        style={{
                          width: `${Math.min(100, confidence * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
          </div>
          
          {/* Dominant emotion highlight */}
          {(() => {
            const dominantEmotion = Object.entries(emotionSet)
              .reduce((prev, current) => current[1] > prev[1] ? current : prev);
            
            if (dominantEmotion[1] > 0.3) {
              return (
                <div className="mt-3 pt-3 border-t border-gray-600">
                  <div className="text-center">
                    <div className="text-3xl mb-1">
                      {getEmotionEmoji(dominantEmotion[0])}
                    </div>
                    <p className={`font-bold capitalize ${getEmotionColor(dominantEmotion[0])}`}>
                      {dominantEmotion[0]} - {Math.round(dominantEmotion[1] * 100)}%
                    </p>
                  </div>
                </div>
              );
            }
            return null;
          })()}
        </div>
      ))}
    </div>
  );
};

export default EmotionDisplay;
