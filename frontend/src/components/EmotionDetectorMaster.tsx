import React, { useState, useCallback } from 'react';
import { useEmotionDetection, EmotionDetection, FaceDetection } from '../hooks/useEmotionDetection';
import CameraFeed from './CameraFeed';
import EmotionDisplay from './EmotionDisplay';
import FaceOverlay from './FaceOverlay';
import { Play, Square, AlertCircle, Camera } from 'lucide-react';

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
  const [detectionStarted, setDetectionStarted] = useState(false);

  // Initialize emotion detection hook with optimized settings
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
    onEmotionDetected: useCallback((emotions: EmotionDetection[], detectedFaces: FaceDetection[]) => {
      if (onEmotionUpdate) {
        onEmotionUpdate(emotions, detectedFaces);
      }
    }, [onEmotionUpdate]),
    detectionInterval: 33, // ~30fps for smooth real-time updates
    confidenceThreshold: 0.3, // Balanced confidence threshold
  });

  const handleStartDetection = async () => {
    try {
      await startDetection();
      setDetectionStarted(true);
    } catch (err) {
      console.error('Failed to start detection:', err);
    }
  };

  const handleStopDetection = () => {
    stopDetection();
    setDetectionStarted(false);
  };

  return (
    <div className={`emotion-detector ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          Real-Time Face Detection & Emotion Recognition
        </h2>
        <p className="text-gray-300">
          Using face-api.js with ssd_mobilenetv1, faceLandmark68Net, and faceExpressionNet models
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Camera Section */}
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Camera className="w-5 h-5 mr-2" />
              Camera Feed
            </h3>
            
            {/* Video Container with Overlay */}
            <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden">
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
            </div>

            {/* Controls */}
            <div className="mt-4 flex items-center justify-center space-x-4">
              {!isDetecting ? (
                <button
                  onClick={handleStartDetection}
                  disabled={!modelsLoaded || isLoading}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  <Play className="w-5 h-5" />
                  <span>Start Detection</span>
                </button>
              ) : (
                <button
                  onClick={handleStopDetection}
                  className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  <Square className="w-5 h-5" />
                  <span>Stop Detection</span>
                </button>
              )}
            </div>

            {/* Status */}
            <div className="mt-4 text-center">
              {isLoading && (
                <div className="flex items-center justify-center space-x-2 text-blue-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                  <span>Loading models...</span>
                </div>
              )}
              
              {error && (
                <div className="flex items-center justify-center space-x-2 text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}
              
              {modelsLoaded && !isLoading && !error && (
                <div className="text-green-400">
                  ✅ Models loaded successfully
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Emotions Section */}
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Detected Emotions
            </h3>
            
            <EmotionDisplay
              emotions={currentEmotions}
              showConfidence={showConfidence}
            />
          </div>

          {/* Info Panel */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Detection Info
            </h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Models Loaded:</span>
                <span className={modelsLoaded ? 'text-green-400' : 'text-red-400'}>
                  {modelsLoaded ? 'Yes' : 'No'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Detection Active:</span>
                <span className={isDetecting ? 'text-green-400' : 'text-gray-400'}>
                  {isDetecting ? 'Yes' : 'No'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Faces Detected:</span>
                <span className="text-white">
                  {faces.length}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Frame Rate:</span>
                <span className="text-white">
                  ~30fps
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Confidence Threshold:</span>
                <span className="text-white">
                  30%
                </span>
              </div>
            </div>
          </div>

          {/* Features List */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Features
            </h3>
            
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Real-time webcam capture</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Face detection with bounding boxes</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>7 emotion recognition</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Multiple face support</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Confidence scores display</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Optimized 30fps performance</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Mobile-responsive interface</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Proper memory management</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmotionDetector;
