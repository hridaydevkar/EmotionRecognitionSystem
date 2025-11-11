import React from 'react';
import EmotionDetectorClean from '../components/EmotionDetectorClean';
import { EmotionDetection, FaceDetection } from '../hooks/useEmotionDetection';

const EmotionTestPage: React.FC = () => {
  const handleEmotionUpdate = (emotions: EmotionDetection[], faces: FaceDetection[]) => {
    // Optional: Log emotion updates for debugging
    console.log('Emotions detected:', emotions);
    console.log('Faces detected:', faces.length);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Real-time Face Detection & Emotion Recognition
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Powered by face-api.js • Detects 7 emotions with confidence scores
          </p>
        </div>
        
        <EmotionDetectorClean
          onEmotionUpdate={handleEmotionUpdate}
          showConfidence={true}
          className="w-full"
        />
        
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900 dark:text-white">✨ Detection Features</h3>
              <ul className="text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Real-time webcam capture with getUserMedia</li>
                <li>• Face detection with bounding box overlays</li>
                <li>• 7 emotions: happy, sad, angry, fearful, disgusted, surprised, neutral</li>
                <li>• Confidence scores for each emotion</li>
                <li>• Multiple faces support</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900 dark:text-white">🚀 Performance</h3>
              <ul className="text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Optimized for smooth 10fps detection</li>
                <li>• Proper memory management & cleanup</li>
                <li>• Mobile-responsive interface</li>
                <li>• Error handling for camera access</li>
                <li>• face-api.js SSD MobileNet models</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmotionTestPage;
