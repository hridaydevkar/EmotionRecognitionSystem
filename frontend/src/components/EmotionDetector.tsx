import React, { useState, useRef } from 'react';
import { useEmotionDetection, EmotionDetection, FaceDetection } from '../hooks/useEmotionDetection';
import { useAuth } from '../context/AuthContext';
import emotionService from '../services/emotionService';
import CameraFeed from './CameraFeed';
import FaceOverlay from './FaceOverlay';
import {
  Play,
  Square,
  Camera,
  AlertCircle,
  Loader,
} from 'lucide-react';

interface EmotionDetectorProps {
  onEmotionUpdate?: (emotions: EmotionDetection[], faces: FaceDetection[]) => void;
  onEmotionSaved?: () => void;
  autoSave?: boolean;
  showConfidence?: boolean;
  className?: string;
}

const EmotionDetector: React.FC<EmotionDetectorProps> = ({
  onEmotionUpdate,
  onEmotionSaved,
  autoSave = true,
  showConfidence = true,
  className = '',
}) => {
  const { user, isAuthenticated } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveCount, setSaveCount] = useState(0);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);

  // Auto-save emotions when detected
  const saveEmotionData = async (emotions: EmotionDetection[], faces: FaceDetection[], capturedSessionId: string) => {
    console.log('💾 saveEmotionData called with:', {
      autoSave,
      isAuthenticated,
      sessionId: capturedSessionId,
      emotionsLength: emotions.length
    });
    
    if (!autoSave || !isAuthenticated || !capturedSessionId || emotions.length === 0) {
      console.log('❌ Save conditions not met');
      return;
    }

    try {
      const dominantEmotion = emotions[0]; // Use first face
      const dominantEmotionName = Object.entries(dominantEmotion)
        .reduce((prev, current) => current[1] > prev[1] ? current : prev)[0];

      // Only save if there's a meaningful emotion detected (not all zeros)
      const hasValidEmotion = Object.values(dominantEmotion).some(value => value > 0.05); // Lower threshold
      
      console.log('🔍 Checking emotion validity:', {
        dominantEmotion,
        hasValidEmotion,
        maxValue: Math.max(...Object.values(dominantEmotion))
      });
      
      if (hasValidEmotion) {
        console.log('💾 Attempting to save emotion data...');
        await emotionService.saveEmotion({
          emotions: dominantEmotion,
          confidence_scores: dominantEmotion, // Use same data for confidence scores
          session_id: capturedSessionId,
        });
        
        setSaveCount(prev => prev + 1);
        setSaveError(null);
        setLastSaveTime(new Date());
        console.log('✅ Emotion data saved successfully');
        
        // Notify parent component that data was saved
        if (onEmotionSaved) {
          onEmotionSaved();
        }
      } else {
        console.log('⏭️ No valid emotions to save (all values < 0.05)');
      }
    } catch (error: any) {
      console.error('❌ Failed to save emotion data:', error);
      setSaveError('Failed to save emotion data');
    }
  };

  // Create a debounced save function that captures sessionId at call time
  const createDebouncedSave = () => {
    let timeout: NodeJS.Timeout | null = null;
    
    return (emotions: EmotionDetection[], faces: FaceDetection[]) => {
      const capturedSessionId = sessionIdRef.current; // Capture sessionId now
      
      console.log('🔄 Debounced save triggered with sessionId:', capturedSessionId);
      
      if (timeout) {
        clearTimeout(timeout);
        console.log('⏰ Cleared previous timeout');
      }
      
      timeout = setTimeout(() => {
        console.log('⏰ Debounced timeout executing with sessionId:', capturedSessionId);
        if (capturedSessionId) { // Only save if we had a valid session when called
          saveEmotionData(emotions, faces, capturedSessionId);
        } else {
          console.log('❌ No valid sessionId for debounced save');
        }
      }, 2000); // Save at most every 2 seconds
      
      console.log('⏰ Set new timeout for save in 2 seconds');
    };
  };

  const debouncedSaveEmotion = createDebouncedSave();

  // Handle emotion updates (including auto-save)
  const handleEmotionUpdate = (emotions: EmotionDetection[], faces: FaceDetection[]) => {
    console.log('🔄 handleEmotionUpdate called with:', {
      emotionsCount: emotions.length,
      autoSave,
      isAuthenticated,
      sessionId: sessionIdRef.current
    });
    
    // Call the original onEmotionUpdate callback if provided
    if (onEmotionUpdate) {
      onEmotionUpdate(emotions, faces);
    }
    
    // Auto-save if enabled
    if (autoSave && isAuthenticated && emotions.length > 0) {
      console.log('✅ Triggering auto-save for emotions:', emotions[0]);
      debouncedSaveEmotion(emotions, faces);
    } else {
      console.log('❌ Auto-save not triggered:', {
        autoSave,
        isAuthenticated,
        emotionsLength: emotions.length,
        hasSession: !!sessionIdRef.current
      });
    }
  };

  // Initialize emotion detection hook
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
    onEmotionDetected: handleEmotionUpdate, // Use our custom handler that includes saving
    detectionInterval: 200, // 5fps for more stable detection
    confidenceThreshold: 0.3, // Lower threshold to allow more emotions through
  });

  // Generate session ID helper
  const generateSessionId = (): string => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Handle start detection
  const handleStartDetection = async () => {
    try {
      let newSessionId: string;

      console.log('Starting emotion detection with autoSave:', autoSave, 'isAuthenticated:', isAuthenticated);

      // Start emotion session in backend if auto-save is enabled and user is authenticated
      if (autoSave && isAuthenticated) {
        console.log('Starting emotion session in backend...');
        newSessionId = await emotionService.startEmotionSession();
        console.log('Backend session created:', newSessionId);
      } else {
        // Generate client-side session ID for non-auto-save mode or unauthenticated users
        newSessionId = generateSessionId();
        console.log('Client-side session generated:', newSessionId);
        
        if (autoSave && !isAuthenticated) {
          setSaveError('Please log in to save emotion data');
        }
      }

      console.log('Setting sessionId state to:', newSessionId);
      setSessionId(newSessionId);
      sessionIdRef.current = newSessionId;

      await startDetection();
      console.log('Emotion detection started successfully');
    } catch (error: any) {
      setSaveError(error.message || 'Failed to start detection');
      console.error('Failed to start detection:', error);
    }
  };

  // Handle stop detection
  const handleStopDetection = async () => {
    stopDetection();

    // End emotion session in backend if auto-save is enabled
    if (autoSave && sessionIdRef.current) {
      try {
        await emotionService.endEmotionSession(sessionIdRef.current);
      } catch (error: any) {
        console.error('Failed to end session:', error);
      }
    }

    setSessionId(null);
    sessionIdRef.current = null;
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

  // Get first face emotions for display
  const firstFaceEmotions = currentEmotions.length > 0 ? currentEmotions[0] : null;
  const dominantEmotion = firstFaceEmotions
    ? Object.entries(firstFaceEmotions).reduce((max, current) => 
        (current[1] || 0) > (max[1] || 0) ? current : max
      )
    : null;

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
        {(error || saveError) && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center text-red-800 dark:text-red-400">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span>{error || saveError}</span>
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
              
              {/* Save status indicator */}
              {autoSave && isAuthenticated && lastSaveTime && (
                <div className="absolute top-4 right-16 bg-green-500 bg-opacity-90 rounded-full px-3 py-1 animate-pulse">
                  <span className="text-xs text-white font-medium">
                    💾 Saved {Math.floor((Date.now() - lastSaveTime.getTime()) / 1000)}s ago
                  </span>
                </div>
              )}
              
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
              
              {firstFaceEmotions ? (
                <div className="space-y-4">
                  {/* Dominant Emotion */}
                  {dominantEmotion && dominantEmotion[1] > 0.3 && (
                    <div className="text-center mb-4">
                      <div className="text-4xl mb-2">
                        {getEmotionEmoji(dominantEmotion[0])}
                      </div>
                      <div className="text-xl font-semibold capitalize text-gray-900 dark:text-white">
                        {dominantEmotion[0]}
                      </div>
                      {showConfidence && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {Math.round(dominantEmotion[1] * 100)}% confident
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* All Emotions with Progress Bars */}
                  {showConfidence && (
                    <div className="space-y-3">
                      {Object.entries(firstFaceEmotions)
                        .sort(([,a], [,b]) => b - a)
                        .map(([emotion, value]) => (
                        <div key={emotion} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="capitalize flex items-center text-gray-700 dark:text-gray-300">
                              <span className="mr-2">{getEmotionEmoji(emotion)}</span>
                              {emotion}
                            </span>
                            <span className="text-gray-600 dark:text-gray-400">
                              {Math.round(value * 100)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${getEmotionColor(emotion)}`}
                              style={{ width: `${Math.max(value * 100, 0)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Multiple faces indicator */}
                  {faces.length > 1 && (
                    <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
                      Showing Face 1 of {faces.length}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <div className="text-4xl mb-3">😐</div>
                  <p className="mb-2">No emotions detected</p>
                  {!isDetecting && (
                    <p className="text-sm">Click "Start" to begin detection</p>
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
              <span>🎯 Detection Rate: ~5fps (Stable)</span>
              <span>👥 Faces: {faces.length}</span>
              <span>🧠 Models: face-api.js</span>
              {autoSave && isAuthenticated && (
                <>
                  <span>💾 Auto-save: On</span>
                  <span>📊 Saved: {saveCount}</span>
                </>
              )}
              {!isAuthenticated && autoSave && (
                <span className="text-amber-600 dark:text-amber-400">⚠️ Login to save</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmotionDetector;