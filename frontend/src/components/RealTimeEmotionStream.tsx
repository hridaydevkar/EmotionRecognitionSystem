import React, { useState, useEffect, useRef } from 'react';
import { Activity, Pause, Play, Wifi, WifiOff } from 'lucide-react';

interface RealTimeEmotionStreamProps {
  isActive: boolean;
  onToggle: () => void;
  currentEmotion?: {
    emotion: string;
    confidence: number;
    timestamp: Date;
  } | null;
}

const RealTimeEmotionStream: React.FC<RealTimeEmotionStreamProps> = ({
  isActive,
  onToggle,
  currentEmotion
}) => {
  const [emotionHistory, setEmotionHistory] = useState<Array<{
    emotion: string;
    confidence: number;
    timestamp: Date;
  }>>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const historyRef = useRef<HTMLDivElement>(null);

  const emotionColors = {
    happy: '#10B981',
    sad: '#3B82F6', 
    angry: '#EF4444',
    surprised: '#F59E0B',
    fearful: '#8B5CF6',
    disgusted: '#84CC16',
    neutral: '#6B7280'
  };

  const emotionEmojis = {
    happy: '😊',
    sad: '😢',
    angry: '😠',
    surprised: '😲',
    fearful: '😨',
    disgusted: '🤢',
    neutral: '😐'
  };

  useEffect(() => {
    if (currentEmotion) {
      setEmotionHistory(prev => {
        const newHistory = [...prev, currentEmotion].slice(-20); // Keep last 20 emotions
        return newHistory;
      });
      
      // Simulate connection status
      setConnectionStatus('connected');
    }
  }, [currentEmotion]);

  useEffect(() => {
    // Simulate connection management
    if (isActive) {
      setConnectionStatus('connecting');
      const timer = setTimeout(() => {
        setConnectionStatus('connected');
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setConnectionStatus('disconnected');
    }
  }, [isActive]);

  useEffect(() => {
    // Auto-scroll to bottom when new emotions are added
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [emotionHistory]);

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'connecting':
        return <Activity className="w-4 h-4 text-yellow-500 animate-pulse" />;
      default:
        return <WifiOff className="w-4 h-4 text-gray-500" />;
    }
  };

  const getConnectionStatus = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Live';
      case 'connecting':
        return 'Connecting...';
      default:
        return 'Offline';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Activity className="w-5 h-5 text-purple-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Live Emotion Stream
          </h3>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            {getConnectionIcon()}
            <span className={`text-sm font-medium ${
              connectionStatus === 'connected' 
                ? 'text-green-600 dark:text-green-400' 
                : connectionStatus === 'connecting'
                ? 'text-yellow-600 dark:text-yellow-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}>
              {getConnectionStatus()}
            </span>
          </div>

          {/* Toggle Button */}
          <button
            onClick={onToggle}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              isActive
                ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
                : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
            }`}
          >
            {isActive ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Stop Stream
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start Stream
              </>
            )}
          </button>
        </div>
      </div>

      {/* Current Emotion Display */}
      {isActive && currentEmotion && (
        <div className="mb-6 p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
          <div className="flex items-center justify-center space-x-4">
            <div className="text-6xl">
              {emotionEmojis[currentEmotion.emotion as keyof typeof emotionEmojis]}
            </div>
            <div className="text-center">
              <h4 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                {currentEmotion.emotion}
              </h4>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                {(currentEmotion.confidence * 100).toFixed(1)}% confidence
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatTimestamp(currentEmotion.timestamp)}
              </p>
            </div>
          </div>
          
          {/* Confidence Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-500"
                style={{ 
                  width: `${currentEmotion.confidence * 100}%`,
                  backgroundColor: emotionColors[currentEmotion.emotion as keyof typeof emotionColors]
                }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Emotion History Stream */}
      {isActive && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Recent Detections ({emotionHistory.length})
          </h4>
          
          <div 
            ref={historyRef}
            className="h-48 overflow-y-auto space-y-2 bg-gray-50 dark:bg-gray-900 rounded-lg p-3"
          >
            {emotionHistory.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Waiting for emotions...</p>
                </div>
              </div>
            ) : (
              emotionHistory.map((emotion, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">
                      {emotionEmojis[emotion.emotion as keyof typeof emotionEmojis]}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                        {emotion.emotion}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTimestamp(emotion.timestamp)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: emotionColors[emotion.emotion as keyof typeof emotionColors] }}
                    ></div>
                    <span className="text-xs text-gray-600 dark:text-gray-300">
                      {(emotion.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Offline State */}
      {!isActive && (
        <div className="text-center py-12">
          <WifiOff className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Stream Offline
          </h4>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Start the stream to see live emotion detection results
          </p>
          <button
            onClick={onToggle}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Start Streaming
          </button>
        </div>
      )}
    </div>
  );
};

export default RealTimeEmotionStream;
