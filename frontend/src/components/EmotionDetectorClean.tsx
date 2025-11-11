import React, { useEffect } from 'react';
import { useEmotionDetection, EmotionDetection, FaceDetection } from '../hooks/useEmotionDetection';
import CameraFeed from './CameraFeed';
import EmotionDisplay from './EmotionDisplay';
import FaceOverlay from './FaceOverlay';
import { Play, Square, Camera, AlertCircle, Loader } from 'lucide-react';

interface EmotionDetectorProps {
  onEmotionUpdate?: (emotions: EmotionDetection[], faces: FaceDetection[]) => void;
  showConfidence?: boolean;
  className?: string;
}

const EmotionDetector: React.FC<EmotionDetectorProps> = ({
  onEmotionUpdate,
  showConfidence = true,
  className = '',
}) => {
  const {
    videoRef,
    canvasRef,
    isLoading,
    isDetecting,
    error,
    currentEmotions,
    faces,
    modelsLoaded,
    startDetection,
    stopDetection,
  } = useEmotionDetection({
    onEmotionDetected: onEmotionUpdate,
    detectionInterval: 100, // 10fps for smooth performance
    confidenceThreshold: 0.5,
  });

  const handleStartDetection = async () => {
    try {
      await startDetection();
    } catch (error) {
      console.error('Failed to start detection:', error);
    }
  };

  const handleStopDetection = () => {
    stopDetection();
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <Camera className="w-5 h-5 mr-2" />
            Real-time Emotion Detection
          </h2>
          
          <div className="flex items-center space-x-2">
            {/* Model Loading Status */}
            {isLoading && !modelsLoaded && (
              <div className="flex items-center text-blue-600 dark:text-blue-400">
                <Loader className="w-4 h-4 animate-spin mr-1" />
                <span className="text-sm">Loading models...</span>
              </div>
            )}
            
            {/* Detection Status */}
            {modelsLoaded && isDetecting && (
              <div className="flex items-center text-green-600 dark:text-green-400">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                <span className="text-sm">Detecting</span>
              </div>
            )}
            
            {/* Start/Stop Button */}
            <button
              onClick={isDetecting ? handleStopDetection : handleStartDetection}
              disabled={isLoading || !modelsLoaded}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                isDetecting
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed'
              }`}
            >
              {isDetecting ? (
                <>
                  <Square className="w-4 h-4" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Start</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center text-red-800 dark:text-red-400">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Camera and Detection Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Camera Feed with Face Overlay */}
          <div className="lg:col-span-2">
            <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
              <CameraFeed
                videoRef={videoRef}
                isLoading={isLoading}
                error={error}
              />
              <FaceOverlay
                canvasRef={canvasRef}
                faces={faces}
                isDetecting={isDetecting}
              />
              
              {/* No faces message */}
              {isDetecting && faces.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white bg-black bg-opacity-50 rounded-lg p-4">
                    <div className="text-4xl mb-2">👤</div>
                    <p>Looking for faces...</p>
                    <p className="text-sm text-gray-300 mt-1">
                      Position yourself in front of the camera
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Emotion Display */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 h-full">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Detected Emotions
              </h3>
              
              {currentEmotions.length > 0 ? (
                <div className="space-y-4">
                  {currentEmotions.map((emotions, index) => (
                    <div key={index} className="space-y-2">
                      {currentEmotions.length > 1 && (
                        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          Face {index + 1}
                        </h4>
                      )}
                      
                      {/* Dominant Emotion */}
                      {(() => {
                        const dominantEmotion = Object.entries(emotions)
                          .reduce((max, current) => current[1] > max[1] ? current : max);
                        
                        if (dominantEmotion[1] > 0.3) {
                          return (
                            <div className="text-center mb-4">
                              <div className="text-3xl mb-1">
                                {getEmotionEmoji(dominantEmotion[0])}
                              </div>
                              <div className="text-lg font-medium capitalize">
                                {dominantEmotion[0]}
                              </div>
                              {showConfidence && (
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {Math.round(dominantEmotion[1] * 100)}% confident
                                </div>
                              )}
                            </div>
                          );
                        }
                      })()}
                      
                      {/* All Emotions with Bars */}
                      {showConfidence && (
                        <div className="space-y-2">
                          {Object.entries(emotions)
                            .sort(([,a], [,b]) => b - a)
                            .map(([emotion, value]) => (
                            <div key={emotion} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="capitalize flex items-center">
                                  <span className="mr-1">{getEmotionEmoji(emotion)}</span>
                                  {emotion}
                                </span>
                                <span className="text-gray-600 dark:text-gray-400">
                                  {Math.round(value * 100)}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all duration-300 ${getEmotionColor(emotion)}`}
                                  style={{ width: `${value * 100}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <div className="text-4xl mb-2">😐</div>
                  <p>No emotions detected</p>
                  {!isDetecting && (
                    <p className="text-sm mt-1">Click "Start" to begin detection</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Performance Info */}
        {isDetecting && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg px-4 py-2">
              <span>🎯 Detection Rate: ~10fps</span>
              <span>👥 Faces: {faces.length}</span>
              <span>🧠 Models: face-api.js</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper functions
const getEmotionEmoji = (emotion: string): string => {
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

const getEmotionColor = (emotion: string): string => {
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

export default EmotionDetector;
